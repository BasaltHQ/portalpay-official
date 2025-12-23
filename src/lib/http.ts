/**
 * Client-safe HTTP helpers for building API URLs.
 * Prefers NEXT_PUBLIC_APP_URL, which in partner containers should be set to the container URL (e.g., https://pay.ledger1.ai).
 * Falls back to relative paths when NEXT_PUBLIC_APP_URL is not set.
 */

export const getApiBase = (): string => {
  try {
    // In development, use relative path to avoid CORS issues
    if (process.env.NODE_ENV !== "production") {
      return "";
    }
    const base = String(process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
    return base || "";
  } catch {
    return "";
  }
};

/**
 * Build a URL by prefixing the API base if available.
 * Ensures a single slash between base and path.
 */
export const buildApiUrl = (path: string): string => {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
};

/**
 * Partner brand-aware API base:
 * - For partner brands, use the Azure App Service subdomain (https://{brandKey}.azurewebsites.net)
 * - For platform/portalpay or empty brandKey, fall back to NEXT_PUBLIC_APP_URL via getApiBase()
 */
export const getBrandApiBase = (brandKey: string): string => {
  try {
    const key = String(brandKey || "").toLowerCase();
    if (key && key !== "portalpay") {
      return `https://${key}.azurewebsites.net`;
    }
    return getApiBase();
  } catch {
    return getApiBase();
  }
};

/**
 * Build a URL using the brand-aware base when a brandKey is known.
 */
export const buildBrandApiUrl = (brandKey: string, path: string): string => {
  const base = getBrandApiBase(brandKey);
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
};
