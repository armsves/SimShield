/**
 * Nokia KYC Match API
 * Path: /passthrough/camara/v1/kyc-match/kyc-match/v0.3/match
 * Compares customer data against operator KYC records
 */

import { nokiaFetch } from "./client";
import type { KycMatchRequest, KycMatchResponse } from "./types";

export async function checkKycMatch(
  params: KycMatchRequest
): Promise<KycMatchResponse | null> {
  try {
    const body: Record<string, string> = {
      phoneNumber: params.phoneNumber.startsWith("+")
        ? params.phoneNumber
        : `+${params.phoneNumber.replace(/\D/g, "")}`,
      idDocument: params.idDocument,
    };
    if (params.name) body.name = params.name;
    if (params.givenName) body.givenName = params.givenName;
    if (params.familyName) body.familyName = params.familyName;
    if (params.familyNameAtBirth) body.familyNameAtBirth = params.familyNameAtBirth;
    if (params.address) body.address = params.address;
    if (params.streetName) body.streetName = params.streetName;
    if (params.streetNumber) body.streetNumber = params.streetNumber;
    if (params.postalCode) body.postalCode = params.postalCode;
    if (params.region) body.region = params.region;
    if (params.locality) body.locality = params.locality;
    if (params.country) body.country = params.country;
    if (params.birthdate) body.birthdate = params.birthdate;
    if (params.email) body.email = params.email;
    if (params.gender) body.gender = params.gender;

    const data = await nokiaFetch<KycMatchResponse>(
      "/passthrough/camara/v1/kyc-match/kyc-match/v0.3/match",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("403") && msg.includes("Access denied")) {
      return null;
    }
    console.error("[Nokia] KYC Match failed:", err);
    return null;
  }
}
