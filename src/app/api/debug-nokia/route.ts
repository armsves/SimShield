/**
 * Debug endpoint: Test Nokia API connection
 * GET /api/debug-nokia?phone=+34600123456
 *
 * Returns raw error/details to diagnose why API calls fail.
 * Remove or restrict in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { nokiaFetch } from "@/lib/nokia/client";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") || "+34600123456";

  const token = process.env.NOKIA_RAPID_API_KEY ?? process.env.NOKIA_API_TOKEN;
  // Resolve host same way as client (for debugging)
  const baseUrl = process.env.NOKIA_API_BASE_URL ?? "https://network-as-code.p-eu.rapidapi.com";
  let resolvedHost = process.env.NOKIA_RAPID_HOST?.trim();
  if (!resolvedHost) {
    try {
      const u = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      resolvedHost = u.hostname.includes("p-eu") || u.hostname.includes("p-")
        ? u.hostname
        : "network-as-code.nokia.rapidapi.com";
    } catch {
      resolvedHost = "network-as-code.nokia.rapidapi.com";
    }
  }
  const envCheck = {
    hasRapidKey: !!process.env.NOKIA_RAPID_API_KEY,
    hasLegacyToken: !!process.env.NOKIA_API_TOKEN,
    tokenPrefix: token ? token.trim().slice(0, 8) + "..." : "missing",
    baseUrl: baseUrl.replace(/\/$/, ""),
    rapidHost: resolvedHost,
    rapidHostSource: process.env.NOKIA_RAPID_HOST ? "NOKIA_RAPID_HOST" : "derived from baseUrl",
  };

  try {
    const data = await nokiaFetch<unknown>("/location-retrieval/v0/retrieve", {
      method: "POST",
      body: JSON.stringify({
        device: { phoneNumber: phone },
        maxAge: 60,
      }),
    });
    return NextResponse.json({ success: true, data, env: envCheck });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({
      success: false,
      error: message,
      stack: process.env.NODE_ENV === "development" ? stack : undefined,
      env: envCheck,
    });
  }
}
