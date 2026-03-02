/**
 * Nokia Location APIs - Location Retrieval & Location Verification
 * Uses device object + paths from official Python SDK
 */

import { nokiaFetch } from "./client";
import type {
  LocationRetrievalRequest,
  LocationRetrievalResponse,
  LocationVerificationRequest,
  LocationVerificationResponse,
} from "./types";

/**
 * Retrieve the current network-based location of a phone/SIM
 * Path: /location-retrieval/v0/retrieve
 */
export async function getLocation(
  params: LocationRetrievalRequest
): Promise<LocationRetrievalResponse | null> {
  try {
    const body = {
      device: { phoneNumber: params.phoneNumber },
      maxAge: 60,
    };
    const data = await nokiaFetch<{ area: { center: { latitude: number; longitude: number }; radius: number } }>(
      "/location-retrieval/v0/retrieve",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return {
      latitude: data.area.center.latitude,
      longitude: data.area.center.longitude,
      accuracy: data.area.radius,
    };
  } catch (err) {
    console.error("[Nokia] Location Retrieval failed:", err);
    return null;
  }
}

/**
 * Verify that a device is at an expected location (e.g. POS)
 * Path: /location-verification/v1/verify
 */
export async function verifyLocation(
  params: LocationVerificationRequest
): Promise<LocationVerificationResponse | null> {
  try {
    const body = {
      device: { phoneNumber: params.phoneNumber },
      area: {
        areaType: "CIRCLE",
        center: {
          latitude: params.expectedLatitude,
          longitude: params.expectedLongitude,
        },
        radius: params.maxUncertainty ?? 500,
      },
      maxAge: params.maxAge ?? 60,
    };
    const data = await nokiaFetch<{ verificationResult: string }>(
      "/location-verification/v1/verify",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const v = data.verificationResult?.toUpperCase();
    let verified: boolean | undefined;
    if (v === "TRUE" || v === "MATCH" || v === "CONFIRMED") {
      verified = true;
    } else if (v === "NO_MATCH" || v === "FALSE" || v === "NOT_MATCHED") {
      verified = false;
    }
    // UNKNOWN or other = inconclusive (undefined), don't treat as explicit mismatch
    return { verified };
  } catch (err) {
    console.error("[Nokia] Location Verification failed:", err);
    return null;
  }
}
