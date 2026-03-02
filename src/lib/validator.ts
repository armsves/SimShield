/**
 * Payment Validator
 * Orchestrates Nokia API calls and scoring for payment decisions
 */

import {
  getLocation,
  verifyLocation,
  checkSimSwap,
  checkDeviceSwap,
} from "./nokia";
import { calculateScore } from "./scoring";
import type { NokiaSignals, ScoringResult } from "./scoring";

export interface ValidatePaymentInput {
  phoneNumber: string;
  posLatitude: number;
  posLongitude: number;
  amountCents: number;
  transactionId?: string;
}

export interface ValidatePaymentResult extends ScoringResult {
  nokiaSignals: NokiaSignals;
}

const LOCATION_MATCH_METERS = 500; // Consider match if within 500m
const USE_SANDBOX =
  !process.env.NOKIA_RAPID_API_KEY && !process.env.NOKIA_API_TOKEN;

/**
 * Sandbox responses for development without Nokia API
 */
async function sandboxNokiaCalls(
  phoneNumber: string,
  posLat: number,
  posLng: number
): Promise<NokiaSignals> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 300));

  // Deterministic mock based on phone number (last digits) for demo
  const seed = parseInt(phoneNumber.replace(/\D/g, "").slice(-2) || "50", 10);
  const locationVerified = seed % 3 !== 0; // ~66% verified
  const simSwapped = seed % 7 === 0; // ~14% swapped
  const deviceSwapped = seed % 11 === 0; // ~9% swapped

  return {
    locationVerified,
    simSwapped,
    deviceSwapped,
    simLocation: locationVerified
      ? { latitude: posLat + 0.001, longitude: posLng + 0.001 }
      : { latitude: 41.3, longitude: 2.0 }, // Barcelona if mismatch
    apiErrors: [],
  };
}

/**
 * Call Nokia APIs and build signals
 */
async function gatherNokiaSignals(
  phoneNumber: string,
  posLat: number,
  posLng: number
): Promise<NokiaSignals> {
  if (USE_SANDBOX) {
    return sandboxNokiaCalls(phoneNumber, posLat, posLng);
  }

  const apiErrors: string[] = [];
  let simLocation: { latitude: number; longitude: number } | undefined;
  let locationVerified: boolean | undefined;
  let simSwapped: boolean | undefined;
  let deviceSwapped: boolean | undefined;

  // 1. Location Retrieval - get SIM position
  const loc = await getLocation({ phoneNumber });
  if (loc) {
    simLocation = { latitude: loc.latitude, longitude: loc.longitude };
  } else {
    apiErrors.push("location_retrieval");
  }

  // 2. Location Verification - SIM near POS?
  const locVerify = await verifyLocation({
    phoneNumber,
    expectedLatitude: posLat,
    expectedLongitude: posLng,
    maxUncertainty: LOCATION_MATCH_METERS,
  });
  if (locVerify) {
    locationVerified = locVerify.verified;
  } else {
    apiErrors.push("location_verification");
  }

  // 3. SIM Swap check
  const simCheck = await checkSimSwap({ phoneNumber, maxAge: 7 });
  if (simCheck) {
    simSwapped = simCheck.swapped;
  } else {
    apiErrors.push("sim_swap");
  }

  // 4. Device Swap check
  const devCheck = await checkDeviceSwap({ phoneNumber, maxAge: 7 });
  if (devCheck) {
    deviceSwapped = devCheck.swapped;
  } else {
    apiErrors.push("device_swap");
  }

  return {
    simLocation,
    locationVerified,
    simSwapped,
    deviceSwapped,
    apiErrors,
  };
}

/**
 * Validate a payment - main entry point
 */
export async function validatePayment(
  input: ValidatePaymentInput
): Promise<ValidatePaymentResult> {
  const signals = await gatherNokiaSignals(
    input.phoneNumber,
    input.posLatitude,
    input.posLongitude
  );

  const result = calculateScore({
    phoneNumber: input.phoneNumber,
    posLatitude: input.posLatitude,
    posLongitude: input.posLongitude,
    amountCents: input.amountCents,
    transactionId: input.transactionId,
    nokiaSignals: signals,
  });

  return {
    ...result,
    nokiaSignals: signals,
  };
}
