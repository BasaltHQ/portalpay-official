/**
 * Centralized branding helpers to surgically resolve BasaltSurge vs PortalPay defaults.
 * This ensures we never accidentally fall back to "portalpay" hardcoded strings when
 * we should be showing BasaltSurge.
 */

export function getEffectiveBrandKey(): string {
    // 1. Check public environment variable (available on client & server)
    const envKey = (process.env.NEXT_PUBLIC_BRAND_KEY || "").trim().toLowerCase();
    if (envKey) return envKey;

    // 2. Check server-only environment variable
    if (typeof process !== "undefined" && process.env.BRAND_KEY) {
        return process.env.BRAND_KEY.trim().toLowerCase();
    }

    // 3. Client-side hostname check (last resort for static builds/hydration)
    if (typeof window !== "undefined") {
        const host = window.location.host.toLowerCase();
        if (host.includes("basalt") || host.includes("surge")) {
            return "basaltsurge";
        }
    }

    return "portalpay";
}

export function isBasaltSurge(key?: string): boolean {
    const k = (key || getEffectiveBrandKey()).toLowerCase();
    return k === "basaltsurge";
}

export function getDefaultBrandSymbol(key?: string): string {
    return isBasaltSurge(key) ? "/bssymbol.png" : "/ppsymbol.png";
}

export function getDefaultBrandName(key?: string): string {
    return isBasaltSurge(key) ? "BasaltSurge" : "PortalPay";
}

/**
 * Resolves a logo source, falling back to the correct brand default.
 * Use this to replace `src || "/ppsymbol.png"` patterns.
 */
export function resolveBrandSymbol(src?: string | null, brandKey?: string): string {
    const k = (brandKey || getEffectiveBrandKey()).toLowerCase();
    const s = String(src || "").trim();

    if (k === "basaltsurge") {
        const lower = s.toLowerCase();
        // Check for known legacy/default asset filenames, including "portalpay" generic matches unless explicitly in /brands/
        const isLegacyAsset = lower.includes("cblogod") ||
            lower.includes("ppsymbol") ||
            lower.includes("pplogo") ||
            lower.includes("portalpay1") ||
            (lower.includes("portalpay") && !lower.includes("/brands/") && !lower.includes("basalt"));

        if (!s || isLegacyAsset) {
            return "/bssymbol.png";
        }
    }

    if (s) return s;
    return getDefaultBrandSymbol(k);
}

export function resolveBrandAppLogo(src?: string | null, brandKey?: string): string {
    const k = (brandKey || getEffectiveBrandKey()).toLowerCase();
    const s = String(src || "").trim();

    if (k === "basaltsurge") {
        const lower = s.toLowerCase();
        // Check for known legacy/default asset filenames, including "portalpay" generic matches unless explicitly in /brands/
        const isLegacyAsset = lower.includes("cblogod") ||
            lower.includes("ppsymbol") ||
            lower.includes("pplogo") ||
            lower.includes("portalpay1") ||
            (lower.includes("portalpay") && !lower.includes("/brands/") && !lower.includes("basalt"));

        if (!s || isLegacyAsset) {
            return "/bssymbol.png";
        }
    }

    if (s) return s;
    return getDefaultBrandSymbol(k);
}
