/**
 * Nokia Network as Code API Types
 * Based on GSMA CAMARA / Nokia API Hub
 * See: https://developer.networkascode.nokia.io/docs
 */

export interface NokiaApiConfig {
  /** API token from Network as Code developer portal */
  apiToken: string;
  /** Base URL (default: https://api.networkascode.nokia.com) */
  baseUrl?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/** Location Retrieval - get device/SIM location from network */
export interface LocationRetrievalRequest {
  phoneNumber: string;
}

export interface LocationRetrievalResponse {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  timestamp?: string;
}

/** Location Verification - verify device is at expected location */
export interface LocationVerificationRequest {
  phoneNumber: string;
  expectedLatitude: number;
  expectedLongitude: number;
  /** Max allowed distance in meters (default: 200) */
  maxAge?: number;
  /** Max age of location data in seconds (default: 300) */
  maxUncertainty?: number;
}

export interface LocationVerificationResponse {
  verified?: boolean; // undefined = inconclusive (e.g. UNKNOWN)
  /** Distance in meters from expected location */
  distance?: number;
  /** Reason if not verified */
  reason?: string;
}

/** SIM Swap - detect recent SIM card change (fraud indicator) */
export interface SimSwapRequest {
  phoneNumber: string;
  /** Check if swap occurred in last N days (default: 7) */
  maxAge?: number;
}

export interface SimSwapResponse {
  /** True if SIM was swapped in the period; undefined if API skipped (e.g. 403) */
  swapped?: boolean;
  /** When the swap occurred (ISO timestamp) if swapped */
  swapDate?: string;
}

/** Device Swap - detect device change (fraud indicator) */
export interface DeviceSwapRequest {
  phoneNumber: string;
  maxAge?: number;
}

export interface DeviceSwapResponse {
  /** True if device was swapped; undefined if API skipped (e.g. 403) */
  swapped?: boolean;
  swapDate?: string;
}

/** Number Verification - verify phone belongs to device */
export interface NumberVerificationRequest {
  phoneNumber: string;
}

export interface NumberVerificationResponse {
  verified: boolean;
}

/** Device Status - connectivity/network info */
export interface DeviceStatusRequest {
  phoneNumber: string;
}

export interface DeviceStatusResponse {
  connected: boolean;
  networkType?: string;
}

/** KYC Match - verify customer data against operator records */
export interface KycMatchRequest {
  phoneNumber: string;
  idDocument: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  familyNameAtBirth?: string;
  address?: string;
  streetName?: string;
  streetNumber?: string;
  postalCode?: string;
  region?: string;
  locality?: string;
  country?: string;
  birthdate?: string;
  email?: string;
  gender?: string;
}

export interface KycMatchResponse {
  idDocumentMatch?: "true" | "false" | "not_available";
  nameMatch?: "true" | "false" | "not_available";
  givenNameMatch?: "true" | "false" | "not_available";
  familyNameMatch?: "true" | "false" | "not_available";
  addressMatch?: "true" | "false" | "not_available";
  postalCodeMatch?: "true" | "false" | "not_available";
  birthdateMatch?: "true" | "false" | "not_available";
  emailMatch?: "true" | "false" | "not_available";
  countryMatch?: "true" | "false" | "not_available";
  [key: string]: string | undefined;
}
