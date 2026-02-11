/**
 * Touchpoint Theme System — Barrel Export
 */

// Types
export type { TouchpointType, TouchpointTheme, TouchpointThemeConfig } from "./types";

// Registry
export { THEME_REGISTRY, DEFAULT_THEME_ID, getTheme, getAllThemes } from "./registry";

// Resolver
export { resolveTheme, resolveThemeId } from "./resolver";
export type { ThemeResolutionContext } from "./resolver";

// CSS Applicator
export { applyThemeVars, clearThemeVars, useApplyTheme } from "./apply";
