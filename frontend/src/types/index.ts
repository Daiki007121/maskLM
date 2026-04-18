/** Request body for POST /api/mask. */
export interface MaskRequest {
  text: string;
}

/** Response body for POST /api/mask. */
export interface MaskResponse {
  masked_text: string;
  mapping: Record<string, string>;
  session_id: string;
}

/** Request body for POST /api/unmask. */
export interface UnmaskRequest {
  masked_text: string;
  mapping: Record<string, string>;
}

/** Response body for POST /api/unmask. */
export interface UnmaskResponse {
  text: string;
}

/** Response body for GET /api/health. */
export interface HealthResponse {
  status: string;
}
