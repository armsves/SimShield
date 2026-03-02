/**
 * Test KYC data for Nokia KYC Match API
 * Phone: +34640030004
 * See: https://networkascode.nokia.io/docs/know-your-customer/kyc-match
 */

import type { KycMatchRequest } from "./nokia/types";

export const TEST_KYC_640030004: Omit<KycMatchRequest, "phoneNumber"> = {
  idDocument: "OJAZ00936",
  name: "JOHN OPENTEST",
  givenName: "JOHN",
  familyName: "OPENTEST",
  familyNameAtBirth: "",
  address: "DEL CLUB DEPORTIVO 1 28223",
  streetName: "DEL CLUB DEPORTIVO",
  streetNumber: "1",
  postalCode: "28223",
  region: "MADRID",
  locality: "POZUELO DE ALARCON",
  country: "ES",
  birthdate: "1976-04-16",
  email: "roberto.garcia@masorange.es",
  gender: "MALE",
};

export const TEST_PHONE_FOR_KYC = "+34640030004";

export function getKycDataForPhone(phoneNumber: string): Omit<KycMatchRequest, "phoneNumber"> | null {
  const normalized = phoneNumber.replace(/\s/g, "");
  const digits = normalized.replace(/\D/g, "");
  if (digits === "640030004" || normalized === "+34640030004") {
    return TEST_KYC_640030004;
  }
  return null;
}
