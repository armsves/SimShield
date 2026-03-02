/**
 * Nokia SIM Swap API
 * Path: /passthrough/camara/v1/sim-swap/sim-swap/v0/check
 */

import { nokiaFetch } from "./client";
import type { SimSwapRequest, SimSwapResponse } from "./types";

export async function checkSimSwap(
  params: SimSwapRequest
): Promise<SimSwapResponse | null> {
  try {
    const body: Record<string, unknown> = {
      phoneNumber: params.phoneNumber,
    };
    // Nokia API expects maxAge in hours (7 days = 168)
    if (params.maxAge) body.maxAge = params.maxAge * 24;

    const data = await nokiaFetch<{ swapped: boolean; swapDate?: string }>(
      "/passthrough/camara/v1/sim-swap/sim-swap/v0/check",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return {
      swapped: data.swapped,
      swapDate: data.swapDate,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 403 "Access denied for given device" = number not provisioned for this API (e.g. not a hackathon SIM)
    if (msg.includes("403") && msg.includes("Access denied")) {
      return { swapped: undefined };
    }
    console.error("[Nokia] SIM Swap check failed:", err);
    return null;
  }
}
