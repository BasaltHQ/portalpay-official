/**
 * Generative Art System - Utility Functions
 * 
 * Deterministic generation of unique art from seeds using layered SVG traits.
 */

// ============== TYPES ==============

export interface GenerativeArtDNA {
    seed: string;
    background: number;
    shape: number;
    effect: number;
    animation: number;
    texture: number;
    particles: number;
    colors: string[];
}

export interface PlatformArtConfig {
    palette: {
        primary: string;
        secondary: string;
        accent: string;
        glow: string;
        background: string;
    };
    weights: {
        backgrounds: number[];
        shapes: number[];
        effects: number[];
        animations: number[];
        textures: number[];
        particles: number[];
    };
    theme: ArtTheme;
    enabled: boolean;
}

export type ArtTheme =
    | 'cosmic'      // Space, nebula, stars
    | 'crystal'     // Gems, prisms, facets
    | 'nature'      // Organic, flowing, leaves
    | 'cyber'       // Neon, glitch, tech
    | 'elemental'   // Fire, water, earth, air
    | 'royal'       // Gold, crowns, luxury
    | 'minimal'     // Clean, geometric, modern
    | 'aurora';     // Northern lights, gradients

// ============== VARIANT DEFINITIONS ==============

export const BACKGROUNDS = [
    'radial-burst',
    'concentric-rings',
    'mesh-grid',
    'aurora-waves',
    'particle-field',
    'geometric-tessellation',
    'nebula-swirl',
    'crystal-lattice'
] as const;

export const SHAPES = [
    'circle-glow',
    'hexagon-crystal',
    'star-burst',
    'shield-emblem',
    'diamond-prism',
    'organic-blob'
] as const;

export const EFFECTS = [
    'sparkle-particles',
    'holographic-sheen',
    'scanlines',
    'noise-grain',
    'energy-pulse',
    'prismatic-refraction',
    'glitch-fragments',
    'heat-distortion'
] as const;

export const ANIMATIONS = [
    'slow-rotation',
    'pulse-glow',
    'floating-drift',
    'shimmer-wave',
    'orbit-particles',
    'breathing-scale'
] as const;

export const TEXTURES = [
    'smooth',
    'brushed-metal',
    'frosted-glass',
    'fabric-weave',
    'carbon-fiber',
    'marble-veins',
    'paper-grain',
    'holographic-foil'
] as const;

export const PARTICLES = [
    'none',
    'dust-motes',
    'glints',
    'bubbles',
    'embers',
    'snowflakes',
    'stars',
    'fireflies'
] as const;

export const THEME_PALETTES: Record<ArtTheme, string[]> = {
    cosmic: ['#0f0c29', '#302b63', '#24243e', '#8b5cf6', '#06b6d4'],
    crystal: ['#f0fdfa', '#99f6e4', '#2dd4bf', '#0d9488', '#134e4a'],
    nature: ['#14532d', '#22c55e', '#84cc16', '#fef08a', '#f0fdf4'],
    cyber: ['#0a0a0a', '#ff00ff', '#00ffff', '#39ff14', '#ff3131'],
    elemental: ['#ff6b35', '#004e98', '#3a5311', '#f5f5f5', '#1a1a2e'],
    royal: ['#1a1a2e', '#c9a227', '#f4e4ba', '#7d1538', '#ffd700'],
    minimal: ['#ffffff', '#f5f5f5', '#262626', '#525252', '#a3a3a3'],
    aurora: ['#0c1445', '#1e3a5f', '#4dd0e1', '#7e57c2', '#f48fb1']
};

// ============== HASH & SEED FUNCTIONS ==============

/**
 * Simple hash function for generating deterministic values from a string
 */
export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Seeded random number generator (deterministic)
 */
export function seededRandom(seed: number): () => number {
    return () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

/**
 * Generate DNA from a seed string (wallet, level, etc.)
 */
export function generateDNA(seed: string, colors?: string[]): GenerativeArtDNA {
    const hash = hashString(seed);
    const random = seededRandom(hash);

    return {
        seed,
        background: Math.floor(random() * BACKGROUNDS.length),
        shape: Math.floor(random() * SHAPES.length),
        effect: Math.floor(random() * EFFECTS.length),
        animation: Math.floor(random() * ANIMATIONS.length),
        texture: Math.floor(random() * TEXTURES.length),
        particles: Math.floor(random() * PARTICLES.length),
        colors: colors || generateHarmoniousColors(hash)
    };
}

/**
 * Generate weighted DNA based on platform config
 */
export function generateWeightedDNA(seed: string, config: PlatformArtConfig): GenerativeArtDNA {
    const hash = hashString(seed);
    const random = seededRandom(hash);

    const pickWeighted = (weights: number[], max: number): number => {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let roll = random() * totalWeight;
        for (let i = 0; i < max; i++) {
            roll -= weights[i] || 1;
            if (roll <= 0) return i;
        }
        return 0;
    };

    const palette = config.palette;

    return {
        seed,
        background: pickWeighted(config.weights.backgrounds, BACKGROUNDS.length),
        shape: pickWeighted(config.weights.shapes, SHAPES.length),
        effect: pickWeighted(config.weights.effects, EFFECTS.length),
        animation: pickWeighted(config.weights.animations, ANIMATIONS.length),
        texture: pickWeighted(config.weights.textures, TEXTURES.length),
        particles: pickWeighted(config.weights.particles, PARTICLES.length),
        colors: [palette.primary, palette.secondary, palette.accent, palette.glow, palette.background]
    };
}

/**
 * Generate harmonious color palette from a seed
 */
export function generateHarmoniousColors(seed: number): string[] {
    const random = seededRandom(seed);
    const baseHue = Math.floor(random() * 360);

    // Generate analogous + complement harmony
    const hues = [
        baseHue,
        (baseHue + 30) % 360,
        (baseHue + 180) % 360,
        (baseHue + 210) % 360,
        (baseHue + 270) % 360
    ];

    return hues.map((h, i) => {
        const saturation = 60 + Math.floor(random() * 30);
        const lightness = i === 0 ? 50 : (40 + Math.floor(random() * 30));
        return `hsl(${h}, ${saturation}%, ${lightness}%)`;
    });
}

/**
 * Generate colors from shop theme
 */
export function generateColorsFromShopTheme(
    primaryColor?: string,
    secondaryColor?: string,
    accentColor?: string
): string[] {
    const primary = primaryColor || '#6366f1';
    const secondary = secondaryColor || '#22c55e';
    const accent = accentColor || '#f59e0b';

    // Derive additional colors
    const glow = adjustLightness(primary, 20);
    const background = adjustLightness(primary, -40);

    return [primary, secondary, accent, glow, background];
}

/**
 * Adjust HSL lightness of a color
 */
function adjustLightness(hex: string, amount: number): string {
    try {
        // Simple hex to hsl approximation
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        l = Math.max(0, Math.min(1, l + amount / 100));

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    } catch {
        return hex;
    }
}

/**
 * Get DNA trait names for display
 */
export function getDNATraitNames(dna: GenerativeArtDNA): {
    background: string;
    shape: string;
    effect: string;
    animation: string;
    texture: string;
    particles: string;
} {
    return {
        background: BACKGROUNDS[dna.background] || 'unknown',
        shape: SHAPES[dna.shape] || 'unknown',
        effect: EFFECTS[dna.effect] || 'unknown',
        animation: ANIMATIONS[dna.animation] || 'unknown',
        texture: TEXTURES[dna.texture] || 'unknown',
        particles: PARTICLES[dna.particles] || 'unknown'
    };
}

/**
 * Create default platform art config
 */
export function createDefaultPlatformConfig(theme: ArtTheme = 'cosmic'): PlatformArtConfig {
    const colors = THEME_PALETTES[theme];

    return {
        palette: {
            primary: colors[0],
            secondary: colors[1],
            accent: colors[2],
            glow: colors[3],
            background: colors[4] || colors[0]
        },
        weights: {
            backgrounds: new Array(BACKGROUNDS.length).fill(10),
            shapes: new Array(SHAPES.length).fill(10),
            effects: new Array(EFFECTS.length).fill(10),
            animations: new Array(ANIMATIONS.length).fill(10),
            textures: new Array(TEXTURES.length).fill(10),
            particles: new Array(PARTICLES.length).fill(10)
        },
        theme,
        enabled: true
    };
}
