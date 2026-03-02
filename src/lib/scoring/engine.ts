/**
 * Risk Scoring Engine
 * Combines Nokia API signals into a payment decision
 * - approve: process payment
 * - deny: reject, optionally suggest card block
 * - clarify: trigger Telegram LLM flow for customer verification
 */

import type {
  PaymentDecision,
  ScoringFactor,
  ScoringInput,
  ScoringResult,
} from "./types";

const SCORE_APPROVE_THRESHOLD = 70;
const SCORE_CLARIFY_THRESHOLD = 40;
// Below clarify = deny

export function calculateScore(input: ScoringInput): ScoringResult {
  const factors: ScoringFactor[] = [];
  let score = 50; // Start neutral

  const { nokiaSignals } = input;

  // Location verification - strongest signal for physical POS
  if (nokiaSignals.locationVerified === true) {
    score += 25;
    factors.push({
      name: "location_match",
      impact: "positive",
      description: "SIM location matches POS - user present at payment point",
    });
  } else if (nokiaSignals.locationVerified === false) {
    score -= 35;
    factors.push({
      name: "location_mismatch",
      impact: "negative",
      description: "SIM location does not match POS - possible remote fraud",
    });
  } else if (nokiaSignals.simLocation) {
    // Have location but verification inconclusive (UNKNOWN) or out of range
    score -= 10;
    factors.push({
      name: "location_unverifiable",
      impact: "negative",
      description: "Could not confirm SIM is at POS (UNKNOWN / out of range)",
    });
  } else {
    // No location data - reduce score, API may have failed
    score -= 10;
    factors.push({
      name: "location_unavailable",
      impact: "neutral",
      description: "Could not retrieve SIM location",
    });
  }

  // SIM Swap - major fraud indicator
  if (nokiaSignals.simSwapped === true) {
    score -= 40;
    factors.push({
      name: "sim_swap_detected",
      impact: "negative",
      description: "Recent SIM swap - elevated fraud risk",
    });
  } else if (nokiaSignals.simSwapped === false) {
    score += 10;
    factors.push({
      name: "no_sim_swap",
      impact: "positive",
      description: "No recent SIM change",
    });
  }

  // Device Swap
  if (nokiaSignals.deviceSwapped === true) {
    score -= 20;
    factors.push({
      name: "device_swap_detected",
      impact: "negative",
      description: "Device changed recently",
    });
  } else if (nokiaSignals.deviceSwapped === false) {
    score += 5;
    factors.push({
      name: "no_device_swap",
      impact: "positive",
      description: "Same device in use",
    });
  }

  // API errors reduce confidence
  if (nokiaSignals.apiErrors.length > 0) {
    score -= nokiaSignals.apiErrors.length * 5;
    factors.push({
      name: "api_errors",
      impact: "negative",
      description: `${nokiaSignals.apiErrors.length} API call(s) failed - reduced confidence`,
    });
  }

  const finalScore = Math.max(0, Math.min(100, score));

  let decision: PaymentDecision;
  let suggestBlockCard = false;

  if (finalScore >= SCORE_APPROVE_THRESHOLD) {
    decision = "approve";
  } else if (finalScore >= SCORE_CLARIFY_THRESHOLD) {
    decision = "clarify";
    // If we have strong negative signals, suggest block on deny
    if (nokiaSignals.simSwapped || nokiaSignals.locationVerified === false) {
      suggestBlockCard = true;
    }
  } else {
    decision = "deny";
    suggestBlockCard =
      nokiaSignals.simSwapped === true ||
      nokiaSignals.locationVerified === false; // Only explicit mismatch, not UNKNOWN
  }

  return {
    decision,
    score: finalScore,
    factors,
    suggestBlockCard,
  };
}
