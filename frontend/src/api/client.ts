import type {
  MaskRequest,
  MaskResponse,
  UnmaskRequest,
  UnmaskResponse,
  HealthResponse,
} from "../types";

const BASE_URL = "/api";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body as { detail?: string } | null)?.detail ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/** Mask PII in the provided text. */
export async function maskText(text: string): Promise<MaskResponse> {
  const body: MaskRequest = { text };
  return request<MaskResponse>("/mask", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Replace placeholders with original PII values. */
export async function unmaskText(
  maskedText: string,
  mapping: Record<string, string>,
): Promise<UnmaskResponse> {
  const body: UnmaskRequest = { masked_text: maskedText, mapping };
  return request<UnmaskResponse>("/unmask", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Check API health. */
export async function healthCheck(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}
