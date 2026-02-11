/**
 * Touchpoint Theme System — Type Definitions
 *
 * Defines the shape of themes, touchpoint identifiers, and per-touchpoint config.
 */

/** Touchpoint identifiers */
export type TouchpointType = "terminal" | "handheld" | "kiosk" | "kds" | "portal";

/** Full theme definition applied via CSS custom properties */
export interface TouchpointTheme {
    id: string;
    name: string;
    description: string;

    // ── Colours ──────────────────────────────────────────────
    primaryBg: string;         // Main page / app background
    secondaryBg: string;       // Panel / card background
    surfaceBg: string;         // Elevated surface (inputs, modals)
    primaryColor: string;      // Brand accent (→ --pp-primary)
    secondaryColor: string;    // Secondary accent (→ --pp-secondary)
    textPrimary: string;       // Primary text colour
    textSecondary: string;     // Muted / secondary text
    textOnPrimary: string;     // Text rendered on primaryColor surfaces
    borderColor: string;       // Default border colour

    // ── Effects ──────────────────────────────────────────────
    glassOpacity: number;      // 0-1  (glass-pane alpha)
    blurStrength: string;      // CSS blur value, e.g. "12px"
    borderRadius: string;      // Default radius, e.g. "12px" | "4px"
    shadowIntensity: "none" | "soft" | "medium" | "strong";

    // ── Typography ───────────────────────────────────────────
    fontFamily?: string;       // Optional font override

    // ── Special ──────────────────────────────────────────────
    gradientBg?: string;       // Optional ambient gradient
    buttonStyle: "rounded" | "sharp" | "pill";
}

/**
 * Per-touchpoint theme override stored in ShopConfig.
 * Each value is a theme ID (e.g. "minimal", "elegant").
 * Omitted keys fall back to the merchant / partner / platform default.
 */
export interface TouchpointThemeConfig {
    terminal?: string;
    handheld?: string;
    kiosk?: string;
    kds?: string;
    portal?: string;
}
