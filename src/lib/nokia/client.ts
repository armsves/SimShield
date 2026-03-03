/**
 * Nokia Network as Code API Client
 * Uses RapidAPI-style auth (X-RapidAPI-Key, X-RapidAPI-Host) per official Python SDK
 * https://github.com/nokia/network-as-code-py
 */

const DEFAULT_BASE_URL = "https://network-as-code.p-eu.rapidapi.com";
const DEFAULT_RAPID_HOST = "network-as-code.nokia.rapidapi.com";

function getConfig() {
  // Prefer explicit RapidAPI vars; fall back to legacy NOKIA_API_TOKEN
  const apiKey =
    process.env.NOKIA_RAPID_API_KEY ?? process.env.NOKIA_API_TOKEN;
  const rapidHost =
    process.env.NOKIA_RAPID_HOST ?? DEFAULT_RAPID_HOST;
  const baseUrl =
    process.env.NOKIA_API_BASE_URL ?? DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error(
      "NOKIA_RAPID_API_KEY or NOKIA_API_TOKEN is required. Get your key at https://developer.networkascode.nokia.io/"
    );
  }

  return { apiKey, rapidHost, baseUrl };
}

export async function nokiaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey, rapidHost, baseUrl } = getConfig();

  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": rapidHost,
      ...options.headers,
    },
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
