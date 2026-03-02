/**
 * Payment validation scoring types
 */

export type PaymentDecision = "approve" | "deny" | "clarify";

export interface NokiaSignals {
  /** SIM location from network (if available) */
  simLocation?: { latitude: number; longitude: number };
  /** Location matches POS within threshold */
  locationVerified?: boolean;
  /** SIM was swapped recently - high risk */
  simSwapped?: boolean;
  /** Device was swapped recently - risk */
  deviceSwapped?: boolean;
  /** Any API call failed - treat as uncertain */
  apiErrors: string[];
}

export interface ScoringInput {
  phoneNumber: string;
  /** POS merchant location */
  posLatitude: number;
  posLongitude: number;
  /** Transaction amount in smallest currency unit (e.g. cents) */
  amountCents: number;
  /** Merchant/card id for logging */
  transactionId?: string;
  nokiaSignals: NokiaSignals;
}

export interface ScoringResult {
  decision: PaymentDecision;
  score: number; // 0-100, higher = safer
  factors: ScoringFactor[];
  suggestBlockCard?: boolean;
}

export interface ScoringFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  /** Human-readable description */
  description: string;
  /** Points added or subtracted from score for this factor */
  points: number;
}
