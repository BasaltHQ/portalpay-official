/**
 * Touchpoint Theme — CSS Variable Applicator
 *
 * Sets `--tp-*` CSS custom properties on documentElement
 * so that all downstream components pick up the active theme automatically.
 * NOTE: Does NOT set `--pp-*` brand colours — those come from ShopConfig.
 *
 * Also provides a React hook `useApplyTheme` for client components.
 */

import { useMemo, useEffect } from "react";
import type { TouchpointTheme } from "./types";
import { getTheme } from "./registry";

/** Shadow presets mapped from intensity keywords */
const SHADOW_MAP: Record<TouchpointTheme["shadowIntensity"], string> = {
    none: "none",
    soft: "0 4px 16px rgba(0,0,0,0.18)",
    medium: "0 8px 28px rgba(0,0,0,0.3)",
    strong: "0 12px 40px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.2)",
};

/** Button border-radius derived from buttonStyle */
function buttonRadius(style: TouchpointTheme["buttonStyle"]): string {
    switch (style) {
        case "pill": return "9999px";
        case "sharp": return "4px";
        case "rounded":
        default: return "12px";
    }
}

/**
 * Apply all theme CSS variables to the document root.
 * Safe to call on server (no-ops when `document` is unavailable).
 */
export function applyThemeVars(theme: TouchpointTheme): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const s = root.style;

    // ── Touchpoint-specific vars ──
    s.setProperty("--tp-bg-primary", theme.primaryBg);
    s.setProperty("--tp-bg-secondary", theme.secondaryBg);
    s.setProperty("--tp-bg-surface", theme.surfaceBg);
    s.setProperty("--tp-text-primary", theme.textPrimary);
    s.setProperty("--tp-text-secondary", theme.textSecondary);
    s.setProperty("--tp-text-on-primary", theme.textOnPrimary);
    s.setProperty("--tp-border", theme.borderColor);
    s.setProperty("--tp-radius", theme.borderRadius);
    s.setProperty("--tp-glass-opacity", String(theme.glassOpacity));
    s.setProperty("--tp-blur", theme.blurStrength);
    s.setProperty("--tp-shadow", SHADOW_MAP[theme.shadowIntensity]);
    s.setProperty("--tp-btn-radius", buttonRadius(theme.buttonStyle));

    // NOTE: --pp-primary and --pp-secondary are NOT set here.
    // Those belong to the shop's brand identity (from ShopConfig),
    // not the touchpoint layout theme.

    // Font family (only if theme specifies one)
    if (theme.fontFamily) {
        s.setProperty("--tp-font", theme.fontFamily);
    } else {
        s.removeProperty("--tp-font");
    }

    // Ambient gradient
    if (theme.gradientBg) {
        s.setProperty("--tp-gradient", theme.gradientBg);
    } else {
        s.removeProperty("--tp-gradient");
    }

    // Mark theme as applied for CSS selectors
    root.setAttribute("data-tp-theme", theme.id);
}

/**
 * Remove all touchpoint theme vars from the root.
 */
export function clearThemeVars(): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const s = root.style;

    const vars = [
        "--tp-bg-primary", "--tp-bg-secondary", "--tp-bg-surface",
        "--tp-text-primary", "--tp-text-secondary", "--tp-text-on-primary",
        "--tp-border", "--tp-radius", "--tp-glass-opacity", "--tp-blur",
        "--tp-shadow", "--tp-btn-radius", "--tp-font", "--tp-gradient",
    ];
    for (const v of vars) s.removeProperty(v);
    root.removeAttribute("data-tp-theme");
}

/**
 * React hook: resolves a theme by ID, applies its CSS variables,
 * and cleans up on unmount or ID change.
 */
export function useApplyTheme(themeId: string | undefined | null): TouchpointTheme {
    const theme = useMemo(() => getTheme(themeId), [themeId]);

    useEffect(() => {
        applyThemeVars(theme);
        return () => {
            clearThemeVars();
        };
    }, [theme]);

    return theme;
}
