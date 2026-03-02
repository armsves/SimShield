/**
 * Mock API: Submit denial case for review
 * POST /api/denial/submit
 *
 * In production, this would forward to an external processor/server.
 * Mock: returns ID with encoded resolve time (1-3s delay) and random approve/deny.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  phoneNumber: z.string(),
  amountCents: z.number(),
  posLatitude: z.number(),
  posLongitude: z.number(),
});

function createCaseId(): string {
  const resolveDelayMs = 1000 + Math.floor(Math.random() * 2000); // 1-3 seconds
  const resolveAt = Date.now() + resolveDelayMs;
  const approved = Math.random() > 0.5;
  const payload = JSON.stringify({
    t: Date.now(),
    resolveAt,
    approved,
  });
  return Buffer.from(payload, "utf-8").toString("base64url");
}

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

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 150));

    const id = createCaseId();

    return NextResponse.json({ id });
  } catch (err) {
    console.error("Denial submit error:", err);
    return NextResponse.json(
      { error: "Submit failed" },
      { status: 500 }
    );
  }
}
