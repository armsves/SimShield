/**
 * Payment Validator
 * Orchestrates Nokia API calls and scoring for payment decisions
 */

import {
  getLocation,
  verifyLocation,
  checkSimSwap,
  checkDeviceSwap,
  checkKycMatch,
} from "./nokia";
import { getKycDataForPhone } from "./kyc-data";
import { calculateScore } from "./scoring";
import type { NokiaSignals, ScoringResult } from "./scoring";
import type { KycMatchRequest } from "./nokia/types";

export interface ValidatePaymentInput {
  phoneNumber: string;
  posLatitude: number;
  posLongitude: number;
  amountCents: number;
  transactionId?: string;
  /** Optional KYC data for KYC Match API; auto-used for known test numbers */
  kycData?: Omit<KycMatchRequest, "phoneNumber">;
}

export interface ApiTiming {
  api: string;
  ms: number;
}

export interface ValidatePaymentResult extends ScoringResult {
  nokiaSignals: NokiaSignals;
  apiTimings?: ApiTiming[];
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
  posLng: number,
  kycData?: Omit<KycMatchRequest, "phoneNumber">
): Promise<NokiaSignals> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 300));

  // Deterministic mock based on phone number (last digits) for demo
  const seed = parseInt(phoneNumber.replace(/\D/g, "").slice(-2) || "50", 10);
  const locationVerified = seed % 3 !== 0; // ~66% verified
  const simSwapped = seed % 7 === 0; // ~14% swapped
  const deviceSwapped = seed % 11 === 0; // ~9% swapped

  // Sandbox KYC: when we have KYC data (explicit or from getKycDataForPhone), mock match
  const kycMatch = kycData || getKycDataForPhone(phoneNumber) ? true : undefined;

  return {
    locationVerified,
    simSwapped,
    deviceSwapped,
    kycMatch,
    simLocation: locationVerified
      ? { latitude: posLat + 0.001, longitude: posLng + 0.001 }
      : { latitude: 41.3, longitude: 2.0 }, // Barcelona if mismatch
    apiErrors: [],
  };
}

/**
 * Derive overall KYC match from API response
 */
function deriveKycMatch(result: Record<string, string | undefined>): boolean | undefined {
  const matches = Object.entries(result)
    .filter(([k]) => k.endsWith("Match"))
    .map(([, v]) => v);
  if (matches.length === 0) return undefined;
  const allTrue = matches.every((v) => v === "true");
  const anyFalse = matches.some((v) => v === "false");
  if (anyFalse) return false;
  if (allTrue) return true;
  return undefined; // mixed or not_available
}

/**
 * Call Nokia APIs and build signals
 */
async function gatherNokiaSignals(
  phoneNumber: string,
  posLat: number,
  posLng: number,
  kycData?: Omit<KycMatchRequest, "phoneNumber">
): Promise<NokiaSignals & { apiTimings?: ApiTiming[] }> {
  if (USE_SANDBOX) {
    return sandboxNokiaCalls(phoneNumber, posLat, posLng, kycData);
  }

  const apiErrors: string[] = [];
  const apiTimings: ApiTiming[] = [];
  let simLocation: { latitude: number; longitude: number } | undefined;
  let locationVerified: boolean | undefined;
  let simSwapped: boolean | undefined;
  let deviceSwapped: boolean | undefined;
  let kycMatch: boolean | undefined;

  // Resolve KYC data: explicit input or test data for known numbers
  const resolvedKyc = kycData ?? getKycDataForPhone(phoneNumber);

  // 1. Location Retrieval - get SIM position
  let t0 = performance.now();
  const loc = await getLocation({ phoneNumber });
  apiTimings.push({ api: "location_retrieval", ms: Math.round(performance.now() - t0) });
  if (loc) {
    simLocation = { latitude: loc.latitude, longitude: loc.longitude };
  } else {
    apiErrors.push("location_retrieval");
  }

  // 2. Location Verification - SIM near POS?
  t0 = performance.now();
  const locVerify = await verifyLocation({
    phoneNumber,
    expectedLatitude: posLat,
    expectedLongitude: posLng,
    maxUncertainty: LOCATION_MATCH_METERS,
  });
  apiTimings.push({ api: "location_verification", ms: Math.round(performance.now() - t0) });
  if (locVerify) {
    locationVerified = locVerify.verified;
  } else {
    apiErrors.push("location_verification");
  }

  // 3. SIM Swap check
  t0 = performance.now();
  const simCheck = await checkSimSwap({ phoneNumber, maxAge: 7 });
  apiTimings.push({ api: "sim_swap", ms: Math.round(performance.now() - t0) });
  if (simCheck) {
    simSwapped = simCheck.swapped;
  } else {
    apiErrors.push("sim_swap");
  }

  // 4. Device Swap check
  t0 = performance.now();
  const devCheck = await checkDeviceSwap({ phoneNumber, maxAge: 7 });
  apiTimings.push({ api: "device_swap", ms: Math.round(performance.now() - t0) });
  if (devCheck) {
    deviceSwapped = devCheck.swapped;
  } else {
    apiErrors.push("device_swap");
  }

  // 5. KYC Match - when we have KYC data
  if (resolvedKyc) {
    t0 = performance.now();
    const kycResult = await checkKycMatch({
      phoneNumber,
      ...resolvedKyc,
    });
    apiTimings.push({ api: "kyc_match", ms: Math.round(performance.now() - t0) });
    if (kycResult) {
      kycMatch = deriveKycMatch(kycResult as Record<string, string | undefined>);
    } else {
      apiErrors.push("kyc_match");
    }
  }

  return {
    simLocation,
    locationVerified,
    simSwapped,
    deviceSwapped,
    kycMatch,
    apiErrors,
    apiTimings,
  };
}

/**
 * Validate a payment - main entry point
 */
export async function validatePayment(
  input: ValidatePaymentInput
): Promise<ValidatePaymentResult> {
  const gathered = await gatherNokiaSignals(
    input.phoneNumber,
    input.posLatitude,
    input.posLongitude,
    input.kycData
  );
  const { apiTimings, ...signals } = gathered;

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
    apiTimings,
  };
}
