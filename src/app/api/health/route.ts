/**
 * Serverless API: Health check
 * GET /api/health
 */

import { NextResponse } from "next/server";

export async function GET() {
  const hasNokiaToken = !!process.env.NOKIA_API_TOKEN;

  return NextResponse.json({
    status: "ok",
    nokiaConfigured: hasNokiaToken,
    mode: hasNokiaToken ? "live" : "sandbox",
  });
}
