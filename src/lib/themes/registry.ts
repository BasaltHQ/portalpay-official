/**
 * Touchpoint Theme Registry
 *
 * Central catalogue of all preset themes. Every theme is dark-mode.
 * Themes are style-based: Minimal, Elegant, Luxury, Modern, Bold.
 */

import type { TouchpointTheme } from "./types";

// ────────────────────────────────────────────────────────────
// 1. MINIMAL — Clean lines, muted tones, generous whitespace
// ────────────────────────────────────────────────────────────
const minimal: TouchpointTheme = {
    id: "minimal",
    name: "Minimal",
    description: "Clean lines, muted tones, generous whitespace, no visual clutter.",

    primaryBg: "#0c0c0e",
    secondaryBg: "rgba(18, 18, 22, 0.6)",
    surfaceBg: "rgba(26, 26, 32, 0.7)",
    primaryColor: "#6b7280",     // neutral gray accent
    secondaryColor: "#9ca3af",
    textPrimary: "#e5e7eb",
    textSecondary: "rgba(156, 163, 175, 0.7)",
    textOnPrimary: "#ffffff",
    borderColor: "rgba(75, 85, 99, 0.25)",

    glassOpacity: 0.35,
    blurStrength: "8px",
    borderRadius: "8px",
    shadowIntensity: "soft",

    buttonStyle: "rounded",
};

// ────────────────────────────────────────────────────────────
// 2. ELEGANT — Refined dark palette, gold / champagne accents
// ────────────────────────────────────────────────────────────
const elegant: TouchpointTheme = {
    id: "elegant",
    name: "Elegant",
    description: "Refined dark palette with gold/champagne accents, thin borders, polished feel.",

    primaryBg: "#0a0a0f",
    secondaryBg: "rgba(16, 14, 20, 0.65)",
    surfaceBg: "rgba(24, 22, 30, 0.75)",
    primaryColor: "#c9a84c",     // champagne gold
    secondaryColor: "#b08d3e",
    textPrimary: "#f0ece2",
    textSecondary: "rgba(208, 196, 170, 0.65)",
    textOnPrimary: "#0a0a0f",
    borderColor: "rgba(180, 160, 100, 0.2)",

    glassOpacity: 0.45,
    blurStrength: "14px",
    borderRadius: "10px",
    shadowIntensity: "soft",

    fontFamily: "'Georgia', 'Times New Roman', serif",
    buttonStyle: "rounded",
};

// ────────────────────────────────────────────────────────────
// 3. LUXURY — Deep blacks, jewel-tone accents, heavy glass
// ────────────────────────────────────────────────────────────
const luxury: TouchpointTheme = {
    id: "luxury",
    name: "Luxury",
    description: "Deep blacks with rich jewel-tone accents, heavy glass blur, prominent drop shadows.",

    primaryBg: "#050507",
    secondaryBg: "rgba(10, 10, 16, 0.7)",
    surfaceBg: "rgba(16, 14, 24, 0.82)",
    primaryColor: "#10b981",     // emerald
    secondaryColor: "#6366f1",   // indigo
    textPrimary: "#f8fafc",
    textSecondary: "rgba(203, 213, 225, 0.6)",
    textOnPrimary: "#ffffff",
    borderColor: "rgba(99, 102, 241, 0.2)",

    glassOpacity: 0.65,
    blurStrength: "22px",
    borderRadius: "16px",
    shadowIntensity: "strong",

    gradientBg: "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 80% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)",
    buttonStyle: "pill",
};

// ────────────────────────────────────────────────────────────
// 4. MODERN — Vibrant accents, neutral dark base, rounded shapes
// ────────────────────────────────────────────────────────────
const modern: TouchpointTheme = {
    id: "modern",
    name: "Modern",
    description: "Vibrant accent colours on neutral dark base, rounded shapes, gradient buttons.",

    primaryBg: "#09090b",
    secondaryBg: "rgba(16, 16, 20, 0.55)",
    surfaceBg: "rgba(24, 24, 30, 0.7)",
    primaryColor: "#3b82f6",     // vivid blue
    secondaryColor: "#f43f5e",   // rose
    textPrimary: "#f4f4f5",
    textSecondary: "rgba(161, 161, 170, 0.7)",
    textOnPrimary: "#ffffff",
    borderColor: "rgba(63, 63, 70, 0.4)",

    glassOpacity: 0.5,
    blurStrength: "12px",
    borderRadius: "14px",
    shadowIntensity: "medium",

    gradientBg: "linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, transparent 50%, rgba(244, 63, 94, 0.04) 100%)",
    buttonStyle: "rounded",
};

// ────────────────────────────────────────────────────────────
// 5. BOLD — High-contrast, thick borders, neon accent
// ────────────────────────────────────────────────────────────
const bold: TouchpointTheme = {
    id: "bold",
    name: "Bold",
    description: "High-contrast dark UI with thick borders, saturated neon accent, strong visual weight.",

    primaryBg: "#000000",
    secondaryBg: "rgba(12, 12, 12, 0.8)",
    surfaceBg: "rgba(20, 20, 20, 0.9)",
    primaryColor: "#22d3ee",     // bright cyan
    secondaryColor: "#facc15",   // yellow
    textPrimary: "#ffffff",
    textSecondary: "rgba(212, 212, 216, 0.75)",
    textOnPrimary: "#000000",
    borderColor: "rgba(34, 211, 238, 0.35)",

    glassOpacity: 0.6,
    blurStrength: "6px",
    borderRadius: "6px",
    shadowIntensity: "strong",

    buttonStyle: "sharp",
};

// ────────────────────────────────────────────────────────────
// 6. WIREFRAME — Current default style: simple, clean, no effects
// ────────────────────────────────────────────────────────────
const wireframe: TouchpointTheme = {
    id: "wireframe",
    name: "Wireframe",
    description: "The default interface style. Clean structure, minimal effects, no glass or blur.",

    primaryBg: "#0a0a0a",
    secondaryBg: "rgba(20, 20, 20, 0.8)",
    surfaceBg: "rgba(30, 30, 30, 0.9)",
    primaryColor: "#6b7280",     // neutral — actual accent comes from shop config
    secondaryColor: "#9ca3af",
    textPrimary: "#f4f4f5",
    textSecondary: "rgba(161, 161, 170, 0.7)",
    textOnPrimary: "#ffffff",
    borderColor: "rgba(63, 63, 70, 0.3)",

    glassOpacity: 0,
    blurStrength: "0px",
    borderRadius: "8px",
    shadowIntensity: "none",

    buttonStyle: "rounded",
};

// ────────────────────────────────────────────────────────────
// Registry
// ────────────────────────────────────────────────────────────

export const THEME_REGISTRY: Record<string, TouchpointTheme> = {
    wireframe,
    minimal,
    elegant,
    luxury,
    modern,
    bold,
};

/** Default theme ID used when nothing else is configured */
export const DEFAULT_THEME_ID = "modern";

/** Get a theme by ID (falls back to wireframe) */
export function getTheme(id: string | undefined | null): TouchpointTheme {
    if (!id) return THEME_REGISTRY[DEFAULT_THEME_ID];
    return THEME_REGISTRY[id] || THEME_REGISTRY[DEFAULT_THEME_ID];
}

/** All available themes as an array */
export function getAllThemes(): TouchpointTheme[] {
    return Object.values(THEME_REGISTRY);
}
