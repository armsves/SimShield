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

const RequestSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number required"),
  posLatitude: z.number().min(-90).max(90),
  posLongitude: z.number().min(-180).max(180),
  amountCents: z.number().int().min(0),
  transactionId: z.string().optional(),
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
    });

    return NextResponse.json({
      decision: result.decision,
      score: result.score,
      factors: result.factors,
      suggestBlockCard: result.suggestBlockCard,
      // Include signals for debugging (can remove in production)
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
