/**
 * Touchpoint Theme Resolver
 *
 * Resolution chain:
 *   URL param (`tp_theme`) → Merchant touchpointThemes[type] → Partner config → Platform default → "minimal"
 */

import type { TouchpointType, TouchpointThemeConfig, TouchpointTheme } from "./types";
import { getTheme, DEFAULT_THEME_ID } from "./registry";

export interface ThemeResolutionContext {
    /** Which touchpoint we're resolving for */
    touchpoint: TouchpointType;
    /** Merchant-level per-touchpoint overrides (from ShopConfig.touchpointThemes) */
    merchantThemes?: TouchpointThemeConfig | null;
    /** Partner container config (may include a default theme ID) */
    partnerDefaultTheme?: string | null;
    /** URL search params (checked for `tp_theme` param) */
    urlParams?: URLSearchParams | null;
}

/**
 * Resolve the effective theme for a given touchpoint.
 *
 * Priority: URL > Merchant > Partner > Platform default
 */
export function resolveTheme(ctx: ThemeResolutionContext): TouchpointTheme {
    const { touchpoint, merchantThemes, partnerDefaultTheme, urlParams } = ctx;

    // 1. URL override (highest priority)
    const urlThemeId = urlParams?.get("tp_theme") || urlParams?.get("theme");
    if (urlThemeId) {
        const t = getTheme(urlThemeId);
        if (t.id === urlThemeId) return t; // only if it actually matched
    }

    // 2. Merchant per-touchpoint override
    if (merchantThemes) {
        const merchantId = merchantThemes[touchpoint];
        if (merchantId) return getTheme(merchantId);
    }

    // 3. Partner container default
    if (partnerDefaultTheme) {
        return getTheme(partnerDefaultTheme);
    }

    // 4. Platform default
    return getTheme(DEFAULT_THEME_ID);
}

/**
 * Convenience hook-friendly resolver for client components.
 * Accepts raw values that may come from props / context.
 */
export function resolveThemeId(
    touchpoint: TouchpointType,
    merchantThemes?: TouchpointThemeConfig | null,
    partnerDefaultTheme?: string | null,
    urlThemeParam?: string | null,
): string {
    // URL override
    if (urlThemeParam) {
        const t = getTheme(urlThemeParam);
        if (t.id === urlThemeParam) return t.id;
    }
    // Merchant
    if (merchantThemes?.[touchpoint]) return merchantThemes[touchpoint]!;
    // Partner
    if (partnerDefaultTheme) return partnerDefaultTheme;
    // Default
    return DEFAULT_THEME_ID;
}
