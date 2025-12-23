"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { hashString } from "@/utils/generative-art";

export type SolarSystemTheme =
    | "default"
    | "pixelated"
    | "neon"
    | "wireframe"
    | "holographic"
    | "retro"
    | "minimal"
    | "cosmic-dust"
    | "glitch"
    | "watercolor"
    | "crystalline"
    | "plasma";

export interface SolarSystemColors {
    starColor: string;
    planetColors: string[];
    orbitLineColor?: string;
}

export interface SolarSystemConfig {
    theme?: SolarSystemTheme;
    colors?: SolarSystemColors;
    glowIntensity?: number;
    orbitStyle?: "solid" | "dashed" | "dotted" | "none";
    planetStyle?: "3d" | "flat" | "ring" | "glow";
    starStyle?: "pulsing" | "static" | "flare" | "corona";
    showOrbits?: boolean;
    showTrails?: boolean;
    animationSpeed?: number;
}

interface GenerativeArtBadgeProps {
    seed: string;
    size?: number;
    level?: number;
    showAnimation?: boolean;
    className?: string;
    primaryColor?: string;
    colors?: SolarSystemColors;
    glowIntensity?: number;
    config?: SolarSystemConfig;
    prestige?: number;
}

type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

function getTier(level: number): Tier {
    if (level >= 50) return "diamond";
    if (level >= 41) return "platinum";
    if (level >= 26) return "gold";
    if (level >= 11) return "silver";
    return "bronze";
}

const TIER_PALETTES: Record<Tier, { sun: string; planets: string[]; glow: string }> = {
    bronze: { sun: "#FF6B35", planets: ["#FF8C42", "#FFD166", "#F77F00", "#E85D04", "#DC2F02", "#D00000", "#9D0208", "#6A040F"], glow: "#FF6B35" },
    silver: { sun: "#E0E5EC", planets: ["#A8DADC", "#457B9D", "#F1FAEE", "#1D3557", "#CBD5E1", "#94A3B8", "#64748B", "#475569"], glow: "#A8DADC" },
    gold: { sun: "#FFD700", planets: ["#FFA500", "#FF6347", "#FFE135", "#FFAA00", "#FF8C00", "#FF7F50", "#FF4500", "#DC143C"], glow: "#FFD700" },
    platinum: { sun: "#00F5FF", planets: ["#7B68EE", "#00CED1", "#9370DB", "#48D1CC", "#BA55D3", "#00FFFF", "#8A2BE2", "#9400D3"], glow: "#00F5FF" },
    diamond: { sun: "#FF00FF", planets: ["#00FFFF", "#FF1493", "#00FF00", "#FFD700", "#FF4500", "#7B68EE", "#00FF7F", "#FF69B4"], glow: "#FF00FF" }
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 100, b: 255 };
}

function seededRandom(seed: number): () => number {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// Theme configuration presets
export const THEME_CONFIGS: Record<SolarSystemTheme, Partial<SolarSystemConfig>> = {
    default: { orbitStyle: "solid", planetStyle: "3d", starStyle: "pulsing", showOrbits: true },
    pixelated: { orbitStyle: "dotted", planetStyle: "flat", starStyle: "static", showOrbits: true },
    neon: { orbitStyle: "solid", planetStyle: "glow", starStyle: "flare", showOrbits: true, glowIntensity: 2.5 },
    wireframe: { orbitStyle: "dashed", planetStyle: "ring", starStyle: "static", showOrbits: true, glowIntensity: 0.5 },
    holographic: { orbitStyle: "solid", planetStyle: "3d", starStyle: "corona", showOrbits: true, showTrails: true },
    retro: { orbitStyle: "dashed", planetStyle: "flat", starStyle: "static", showOrbits: true, glowIntensity: 0.8 },
    minimal: { orbitStyle: "none", planetStyle: "flat", starStyle: "static", showOrbits: false, glowIntensity: 0.3 },
    "cosmic-dust": { orbitStyle: "dotted", planetStyle: "glow", starStyle: "corona", showOrbits: true, showTrails: true },
    glitch: { orbitStyle: "solid", planetStyle: "3d", starStyle: "flare", showOrbits: true },
    watercolor: { orbitStyle: "solid", planetStyle: "3d", starStyle: "pulsing", showOrbits: true, glowIntensity: 2 },
    crystalline: { orbitStyle: "solid", planetStyle: "ring", starStyle: "flare", showOrbits: true },
    plasma: { orbitStyle: "none", planetStyle: "glow", starStyle: "corona", showOrbits: false, glowIntensity: 3 },
};

function PrestigeOverlay({ prestige, size }: { prestige: number; size: number }) {
    if (prestige <= 0) return null;

    // Prestige visuals
    const isGold = prestige >= 1;
    const isDiamond = prestige >= 5;
    const isCosmic = prestige >= 10;

    return (
        <div className="absolute inset-0 pointer-events-none z-10 font-mono">
            {/* Rotating Prestige Ring */}
            <div
                className="absolute inset-0 border-[1px] border-dashed rounded-full animate-spin-slow duration-[30s] opacity-30"
                style={{
                    borderColor: isCosmic ? '#a855f7' : isDiamond ? '#06b6d4' : '#fbbf24',
                    width: '120%',
                    height: '120%',
                    left: '-10%',
                    top: '-10%'
                }}
            />

            {/* Prestige Particles/Sparkles */}
            {isDiamond && (
                <div className="absolute inset-0 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white rounded-full blur-[1px]"
                            style={{
                                width: Math.random() * 2 + 1 + 'px',
                                height: Math.random() * 2 + 1 + 'px',
                                top: Math.random() * 100 + '%',
                                left: Math.random() * 100 + '%',
                                animation: `twinkle ${Math.random() * 3 + 1}s infinite`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Prestige Label */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div
                    className={`text-[8px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm border ${isCosmic ? 'bg-purple-500/10 border-purple-500/50 text-purple-200' :
                        isDiamond ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200' :
                            'bg-amber-500/10 border-amber-500/50 text-amber-200'
                        }`}
                >
                    Prestige {prestige}
                </div>
            </div>
        </div>
    );
}

export function GenerativeArtBadge({
    seed,
    size = 80,
    level = 1,
    showAnimation = true,
    className = "",
    primaryColor,
    colors,
    glowIntensity = 1.5,
    config,
    prestige = 0
}: GenerativeArtBadgeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef(0);

    const tier = getTier(level);
    const palette = TIER_PALETTES[tier];

    // Merge theme config with props
    const theme = config?.theme || "default";
    const themeConfig = THEME_CONFIGS[theme];
    const effectiveGlow = config?.glowIntensity ?? themeConfig.glowIntensity ?? glowIntensity;
    const orbitStyle = config?.orbitStyle ?? themeConfig.orbitStyle ?? "solid";
    const planetStyle = config?.planetStyle ?? themeConfig.planetStyle ?? "3d";
    const starStyle = config?.starStyle ?? themeConfig.starStyle ?? "pulsing";
    const showOrbits = config?.showOrbits ?? themeConfig.showOrbits ?? true;
    const showTrails = config?.showTrails ?? themeConfig.showTrails ?? false;
    const animSpeed = config?.animationSpeed ?? 1;

    // Merge colors from config if not provided in props
    const effectiveColors = colors || config?.colors;
    const starColor = effectiveColors?.starColor || primaryColor || palette.sun;
    const planetColors = effectiveColors?.planetColors || palette.planets;
    const orbitLineColor = effectiveColors?.orbitLineColor || "#FFFFFF";

    const starRgb = useMemo(() => hexToRgb(starColor), [starColor]);
    const id = useMemo(() => hashString(seed), [seed]);
    const planetCount = Math.min(8, Math.max(1, Math.ceil(level / 7)));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const cx = size / 2;
        const cy = size / 2;
        const random = seededRandom(id);
        const margin = size * 0.12;
        const maxOrbitRadius = (size / 2) - margin;
        const pixelSize = theme === "pixelated" ? Math.max(2, Math.floor(size / 40)) : 1;

        // Generate planet data
        const planets = Array.from({ length: planetCount }, (_, i) => {
            const planetColor = planetColors[i % planetColors.length] || palette.planets[i % palette.planets.length];
            const pRgb = hexToRgb(planetColor);
            const pSize = size * (0.045 - i * 0.003);
            const orbitRadius = size * 0.18 + (maxOrbitRadius - size * 0.18) * (i / Math.max(1, planetCount - 1)) * 0.85;
            return {
                orbitRadius: Math.min(orbitRadius, maxOrbitRadius - pSize * 2),
                size: pSize,
                speed: 0.3 + random() * 0.5,
                startAngle: random() * Math.PI * 2,
                color: planetColor,
                rgb: pRgb,
                hasRing: random() > 0.75 && i > 2,
                trail: [] as { x: number; y: number; alpha: number }[]
            };
        });

        const drawPixelCircle = (x: number, y: number, r: number, color: string) => {
            if (theme !== "pixelated") {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                return;
            }
            const px = pixelSize;
            for (let py = -r; py <= r; py += px) {
                for (let ppx = -r; ppx <= r; ppx += px) {
                    if (ppx * ppx + py * py <= r * r) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            Math.floor((x + ppx) / px) * px,
                            Math.floor((y + py) / px) * px,
                            px, px
                        );
                    }
                }
            }
        };

        const render = () => {
            const time = timeRef.current * animSpeed;
            const pulse = starStyle === "pulsing" ? 1 + Math.sin(time * 2) * 0.1 * effectiveGlow : 1;
            const glitchOffset = theme === "glitch" ? (Math.random() > 0.95 ? (Math.random() - 0.5) * 4 : 0) : 0;

            ctx.clearRect(0, 0, size, size);

            // Holographic/watercolor background effect
            if (theme === "holographic" || theme === "watercolor") {
                const hue = (time * 30) % 360;
                const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
                bgGrad.addColorStop(0, `hsla(${hue}, 60%, 20%, 0.1)`);
                bgGrad.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 60%, 15%, 0.05)`);
                bgGrad.addColorStop(1, "transparent");
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, size, size);
            }

            // Cosmic dust particles
            if (theme === "cosmic-dust" || theme === "plasma") {
                const dustCount = 30;
                for (let i = 0; i < dustCount; i++) {
                    const angle = (i / dustCount) * Math.PI * 2 + time * 0.2;
                    const dist = size * 0.15 + Math.sin(time + i) * size * 0.2;
                    const dx = cx + Math.cos(angle) * dist;
                    const dy = cy + Math.sin(angle) * dist;
                    const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;
                    ctx.beginPath();
                    ctx.arc(dx, dy, 1, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, ${alpha})`;
                    ctx.fill();
                }
            }

            // === ORBIT LINES ===
            if (showOrbits && orbitStyle !== "none") {
                const orbitRgb = hexToRgb(orbitLineColor);
                planets.forEach((planet, i) => {
                    ctx.beginPath();
                    if (orbitStyle === "dashed") {
                        ctx.setLineDash([4, 4]);
                    } else if (orbitStyle === "dotted") {
                        ctx.setLineDash([2, 6]);
                    } else {
                        ctx.setLineDash([]);
                    }
                    ctx.arc(cx + glitchOffset, cy, planet.orbitRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${orbitRgb.r}, ${orbitRgb.g}, ${orbitRgb.b}, ${theme === "neon" ? 0.4 : 0.12 - i * 0.012})`;
                    ctx.lineWidth = theme === "neon" ? 2 : 1;
                    if (theme === "neon") {
                        ctx.shadowColor = `rgba(${orbitRgb.r}, ${orbitRgb.g}, ${orbitRgb.b}, 0.8)`;
                        ctx.shadowBlur = 8;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.setLineDash([]);
                });
            }

            // === STAR ===
            const starRadius = size * 0.10 * pulse;

            // Star corona/glow
            if (starStyle !== "static" || theme === "neon" || theme === "plasma") {
                for (let i = 2; i >= 0; i--) {
                    const coronaR = starRadius * (starStyle === "corona" ? 2.5 + i * 0.8 : 1.8 + i * 0.5);
                    const alpha = (starStyle === "flare" ? 0.35 : 0.2) - i * 0.05;
                    const grad = ctx.createRadialGradient(cx + glitchOffset, cy, starRadius * 0.3, cx, cy, coronaR);
                    grad.addColorStop(0, `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, ${alpha * effectiveGlow})`);
                    grad.addColorStop(0.5, `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, ${alpha * 0.4 * effectiveGlow})`);
                    grad.addColorStop(1, `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, 0)`);
                    ctx.beginPath();
                    ctx.arc(cx + glitchOffset, cy, coronaR, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                }

                // Flare rays
                if (starStyle === "flare") {
                    const rayCount = 8;
                    for (let i = 0; i < rayCount; i++) {
                        const rayAngle = (i / rayCount) * Math.PI * 2 + time * 0.5;
                        const rayLength = starRadius * (2 + Math.sin(time * 3 + i) * 0.5);
                        const grad = ctx.createLinearGradient(
                            cx, cy,
                            cx + Math.cos(rayAngle) * rayLength,
                            cy + Math.sin(rayAngle) * rayLength
                        );
                        grad.addColorStop(0, `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, 0.4)`);
                        grad.addColorStop(1, "transparent");
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(cx + Math.cos(rayAngle) * rayLength, cy + Math.sin(rayAngle) * rayLength);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }
            }

            // Star core
            if (theme === "pixelated") {
                drawPixelCircle(cx, cy, starRadius, starColor);
            } else if (theme === "wireframe") {
                ctx.beginPath();
                ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
                ctx.strokeStyle = starColor;
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                const starGrad = ctx.createRadialGradient(
                    cx - starRadius * 0.3, cy - starRadius * 0.3, 0,
                    cx, cy, starRadius
                );
                starGrad.addColorStop(0, "#FFFFFF");
                starGrad.addColorStop(0.2, `rgba(${Math.min(255, starRgb.r + 80)}, ${Math.min(255, starRgb.g + 80)}, ${Math.min(255, starRgb.b + 80)}, 1)`);
                starGrad.addColorStop(0.6, `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, 1)`);
                starGrad.addColorStop(1, `rgba(${Math.floor(starRgb.r * 0.7)}, ${Math.floor(starRgb.g * 0.7)}, ${Math.floor(starRgb.b * 0.7)}, 1)`);
                ctx.beginPath();
                ctx.arc(cx + glitchOffset, cy, starRadius, 0, Math.PI * 2);
                ctx.fillStyle = starGrad;
                ctx.fill();
            }

            // Star outline glow
            if (theme !== "minimal" && theme !== "wireframe") {
                ctx.beginPath();
                ctx.arc(cx + glitchOffset, cy, starRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, ${0.8 * effectiveGlow})`;
                ctx.lineWidth = theme === "neon" ? 3 : 2;
                ctx.shadowColor = `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, 1)`;
                ctx.shadowBlur = theme === "neon" ? 20 : 15 * effectiveGlow;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // === PLANETS ===
            planets.forEach((planet, i) => {
                const angle = planet.startAngle + time * planet.speed * (i % 2 === 0 ? 1 : -1);
                const px = cx + Math.cos(angle) * planet.orbitRadius + glitchOffset;
                const py = cy + Math.sin(angle) * planet.orbitRadius;

                // Trail
                if (showTrails) {
                    planet.trail.push({ x: px, y: py, alpha: 0.5 });
                    if (planet.trail.length > 20) planet.trail.shift();
                    planet.trail.forEach((t, ti) => {
                        const tAlpha = (ti / planet.trail.length) * 0.3;
                        ctx.beginPath();
                        ctx.arc(t.x, t.y, planet.size * 0.5, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, ${tAlpha})`;
                        ctx.fill();
                    });
                }

                // Planet glow
                if (planetStyle === "glow" || theme === "neon" || theme === "plasma") {
                    const pGlowR = planet.size * (theme === "plasma" ? 4 : 2.5);
                    const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pGlowR);
                    pGlow.addColorStop(0, `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, ${0.7 * effectiveGlow})`);
                    pGlow.addColorStop(0.5, `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, ${0.3 * effectiveGlow})`);
                    pGlow.addColorStop(1, `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, 0)`);
                    ctx.beginPath();
                    ctx.arc(px, py, pGlowR, 0, Math.PI * 2);
                    ctx.fillStyle = pGlow;
                    ctx.fill();
                }

                // Saturn-like ring
                if (planet.hasRing && planetStyle !== "flat") {
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(0.4);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, planet.size * 2, planet.size * 0.4, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, 0.4)`;
                    ctx.lineWidth = theme === "neon" ? 2 : 2;
                    if (theme === "neon") {
                        ctx.shadowColor = planet.color;
                        ctx.shadowBlur = 8;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.restore();
                }

                // Planet body
                if (theme === "pixelated") {
                    drawPixelCircle(px, py, planet.size, planet.color);
                } else if (theme === "wireframe" || planetStyle === "ring") {
                    ctx.beginPath();
                    ctx.arc(px, py, planet.size, 0, Math.PI * 2);
                    ctx.strokeStyle = planet.color;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                } else if (planetStyle === "flat" || theme === "minimal" || theme === "retro") {
                    ctx.beginPath();
                    ctx.arc(px, py, planet.size, 0, Math.PI * 2);
                    ctx.fillStyle = planet.color;
                    ctx.fill();
                } else {
                    // 3D planet
                    const planetGrad = ctx.createRadialGradient(
                        px - planet.size * 0.3, py - planet.size * 0.3, 0,
                        px, py, planet.size
                    );
                    planetGrad.addColorStop(0, "#FFFFFF");
                    planetGrad.addColorStop(0.3, `rgba(${Math.min(255, planet.rgb.r + 50)}, ${Math.min(255, planet.rgb.g + 50)}, ${Math.min(255, planet.rgb.b + 50)}, 1)`);
                    planetGrad.addColorStop(0.7, `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, 1)`);
                    planetGrad.addColorStop(1, `rgba(${Math.floor(planet.rgb.r * 0.5)}, ${Math.floor(planet.rgb.g * 0.5)}, ${Math.floor(planet.rgb.b * 0.5)}, 1)`);
                    ctx.beginPath();
                    ctx.arc(px, py, planet.size, 0, Math.PI * 2);
                    ctx.fillStyle = planetGrad;
                    ctx.fill();
                }

                // Planet outline
                if (theme !== "minimal" && theme !== "wireframe" && planetStyle !== "ring") {
                    ctx.beginPath();
                    ctx.arc(px, py, planet.size, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${planet.rgb.r}, ${planet.rgb.g}, ${planet.rgb.b}, 0.6)`;
                    ctx.lineWidth = 1;
                    if (theme === "neon") {
                        ctx.shadowColor = planet.color;
                        ctx.shadowBlur = 10;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });

            // === LEVEL NUMBER ===
            const fontSize = Math.floor(size * (theme === "pixelated" ? 0.18 : 0.22));
            ctx.font = `900 ${fontSize}px ${theme === "retro" ? '"Courier New", monospace' : '"SF Pro Display", "Inter", system-ui, sans-serif'}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const levelText = String(level);

            // Text effects based on theme
            if (theme === "neon") {
                ctx.shadowColor = `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, 1)`;
                ctx.shadowBlur = 15;
            } else if (theme !== "minimal") {
                ctx.shadowColor = `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, 1)`;
                ctx.shadowBlur = 10 * effectiveGlow;
            }

            if (theme !== "wireframe") {
                ctx.strokeStyle = `rgba(0, 0, 0, 0.8)`;
                ctx.lineWidth = theme === "pixelated" ? 2 : 4;
                ctx.strokeText(levelText, cx + glitchOffset, cy);
            }

            ctx.fillStyle = theme === "holographic" ? `hsl(${(time * 60) % 360}, 100%, 80%)` : "#FFFFFF";
            ctx.fillText(levelText, cx + glitchOffset, cy);
            ctx.shadowBlur = 0;

            if (showAnimation) {
                timeRef.current += 0.016;
                animationRef.current = requestAnimationFrame(render);
            }
        };

        render();
        return () => cancelAnimationFrame(animationRef.current);
    }, [size, starRgb, planetColors, orbitLineColor, palette, tier, level, planetCount, showAnimation, id, effectiveGlow, theme, orbitStyle, planetStyle, starStyle, showOrbits, showTrails, animSpeed]);

    return (
        <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
            <canvas ref={canvasRef} width={size} height={size} className="w-full h-full" />
            <PrestigeOverlay prestige={prestige} size={size} />
        </div>
    );
}

export function getDefaultSolarSystemColors(tier: Tier): SolarSystemColors {
    const palette = TIER_PALETTES[tier];
    return { starColor: palette.sun, planetColors: [...palette.planets], orbitLineColor: "rgba(255, 255, 255, 0.1)" };
}

export default GenerativeArtBadge;
