// Shared helpers for constructing receipt endpoints and fetch options
// Ensures TEST receipts include merchant context so branding/themes load consistently.

export function isValidHexAddress(addr: string): boolean {
  try {
    return /^0x[a-fA-F0-9]{40}$/.test(String(addr || "").trim());
  } catch {
    return false;
  }
}

/**
 * Build the URL for a receipt endpoint, attaching the merchant wallet (or split address)
 * so the backend can derive branding/theme for demo receipts and stored rows.
 */
export function buildReceiptEndpoint(id: string, recipient?: string): string {
  const base = `/api/receipts/${encodeURIComponent(id)}`;
  const w = isValidHexAddress(String(recipient || "").toLowerCase())
    ? String(recipient).toLowerCase()
    : "";
  return w ? `${base}?wallet=${encodeURIComponent(w)}` : base;
}

/**
 * Build fetch init with appropriate headers so per-wallet partitioning and split resolution
 * can be applied server-side.
 */
export function buildReceiptFetchInit(recipient?: string): RequestInit {
  const w = isValidHexAddress(String(recipient || "").toLowerCase())
    ? String(recipient).toLowerCase()
    : "";
  const headers: Record<string, string> = {};
  if (w) headers["x-wallet"] = w;
  return { headers };
}

/**
 * Convenience helper for TEST receipt endpoint.
 */
export function buildTestReceiptEndpoint(recipient?: string): string {
  return buildReceiptEndpoint("TEST", recipient);
}

/**
 * Convenience helper to open the test portal link with recipient scoped so theme loads.
 */
export function buildPortalUrlForTest(recipient?: string): string {
  const w = isValidHexAddress(String(recipient || "").toLowerCase())
    ? String(recipient).toLowerCase()
    : "";
  return w ? `/portal/TEST?recipient=${encodeURIComponent(w)}` : "/portal/TEST";
}
