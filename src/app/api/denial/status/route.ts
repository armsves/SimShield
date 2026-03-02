/**
 * Mock API: Check denial case status
 * POST /api/denial/status
 *
 * Poll until resolved. ID contains encoded resolve time.
 * Mock: returns pending until elapsed > resolve delay, then resolved with approve/deny.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  id: z.string(),
});

function decodeCaseId(id: string): { resolveAt: number; approved: boolean } | null {
  try {
    const json = Buffer.from(id, "base64url").toString("utf-8");
    const data = JSON.parse(json);
    if (typeof data.resolveAt === "number" && typeof data.approved === "boolean") {
      return { resolveAt: data.resolveAt, approved: data.approved };
    }
  } catch {
    return null;
  }
  return null;
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

    const { id } = parsed.data;

    const decoded = decodeCaseId(id);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid case ID" },
        { status: 400 }
      );
    }

    const now = Date.now();
    if (now < decoded.resolveAt) {
      return NextResponse.json({ status: "pending" });
    }

    // Small delay to simulate final processing
    await new Promise((r) => setTimeout(r, 80));

    return NextResponse.json({
      status: "resolved",
      approved: decoded.approved,
    });
  } catch (err) {
    console.error("Denial status error:", err);
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 }
    );
  }
}
