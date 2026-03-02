/**
 * Nokia Device Swap API
 * Path: /passthrough/camara/v1/device-swap/device-swap/v1/check
 */

import { nokiaFetch } from "./client";
import type { DeviceSwapRequest, DeviceSwapResponse } from "./types";

export async function checkDeviceSwap(
  params: DeviceSwapRequest
): Promise<DeviceSwapResponse | null> {
  try {
    const body: Record<string, unknown> = {
      phoneNumber: params.phoneNumber,
    };
    // Nokia API expects maxAge in hours (7 days = 168)
    if (params.maxAge) body.maxAge = params.maxAge * 24;

    const data = await nokiaFetch<{ swapped: boolean; swapDate?: string }>(
      "/passthrough/camara/v1/device-swap/device-swap/v1/check",
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
    console.error("[Nokia] Device Swap check failed:", err);
    return null;
  }
}
