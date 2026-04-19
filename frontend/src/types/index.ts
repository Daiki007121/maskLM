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

/** A single history entry stored in localStorage. */
export interface HistoryEntry {
  id: string;
  createdAt: number;
  original: string;
  masked: string;
  mapping: Record<string, string>;
  /** The LLM response pasted into unmask (if user unmasked). */
  unmaskInput?: string;
  /** The restored text after unmasking (if user unmasked). */
  unmaskOutput?: string;
}
