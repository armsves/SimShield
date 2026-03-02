/**
 * Serverless API: Validate Payment
 * POST /api/validate-payment
 *
 * Called by POS before processing payment.
 * Sends phone + POS data to Nokia APIs, runs scoring, returns allow/deny/clarify.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePayment } from "@/lib/validator";

const KycDataSchema = z.object({
  idDocument: z.string(),
  name: z.string().optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  familyNameAtBirth: z.string().optional(),
  address: z.string().optional(),
  streetName: z.string().optional(),
  streetNumber: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  locality: z.string().optional(),
  country: z.string().optional(),
  birthdate: z.string().optional(),
  email: z.string().optional(),
  gender: z.string().optional(),
}).optional();

const RequestSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number required"),
  posLatitude: z.number().min(-90).max(90),
  posLongitude: z.number().min(-180).max(180),
  amountCents: z.number().int().min(0),
  transactionId: z.string().optional(),
  kycData: KycDataSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await validatePayment({
      phoneNumber: parsed.data.phoneNumber,
      posLatitude: parsed.data.posLatitude,
      posLongitude: parsed.data.posLongitude,
      amountCents: parsed.data.amountCents,
      transactionId: parsed.data.transactionId,
      kycData: parsed.data.kycData,
    });

    return NextResponse.json({
      decision: result.decision,
      score: result.score,
      factors: result.factors,
      suggestBlockCard: result.suggestBlockCard,
      apiTimings: result.apiTimings,
      _debug: process.env.NODE_ENV === "development" ? result.nokiaSignals : undefined,
    });
  } catch (err) {
    console.error("Validate payment error:", err);
    return NextResponse.json(
      {
        error: "Validation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
