/**
 * Nokia Network as Code API Client
 * Uses RapidAPI-style auth (X-RapidAPI-Key, X-RapidAPI-Host) per official Python SDK
 * https://github.com/nokia/network-as-code-py
 */

const DEFAULT_BASE_URL = "https://network-as-code.p-eu.rapidapi.com";
const DEFAULT_RAPID_HOST = "network-as-code.nokia.rapidapi.com";

function getConfig() {
  // Prefer explicit RapidAPI vars; fall back to legacy NOKIA_API_TOKEN
  const rawKey = process.env.NOKIA_RAPID_API_KEY ?? process.env.NOKIA_API_TOKEN;
  const apiKey = rawKey?.trim();
  const explicitHost = process.env.NOKIA_RAPID_HOST?.trim();
  const baseUrl = (process.env.NOKIA_API_BASE_URL ?? DEFAULT_BASE_URL).replace(
    /\/$/,
    ""
  );

  if (!apiKey) {
    throw new Error(
      "NOKIA_RAPID_API_KEY or NOKIA_API_TOKEN is required. Get your key at https://developer.networkascode.nokia.io/"
    );
  }

  // When using regional base URL (e.g. p-eu.rapidapi.com), X-RapidAPI-Host must match
  // the base URL hostname. This fixes "works local, fails on Vercel" issues.
  let rapidHost = explicitHost;
  if (!rapidHost) {
    try {
      const u = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      if (u.hostname.includes("p-eu") || u.hostname.includes("p-")) {
        rapidHost = u.hostname;
      } else {
        rapidHost = DEFAULT_RAPID_HOST;
      }
    } catch {
      rapidHost = DEFAULT_RAPID_HOST;
    }
  }

  return { apiKey, rapidHost, baseUrl };
}

export async function nokiaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey, rapidHost, baseUrl } = getConfig();

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": rapidHost,
      ...options.headers,
    },
    cache: "no-store", // Avoid Vercel/edge caching of API responses
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Nokia API error ${response.status}: ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as T;
  console.log("[Nokia API]", path, data);
  return data;
}
