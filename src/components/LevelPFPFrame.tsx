"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { hashString } from "@/utils/generative-art";

interface LevelPFPFrameProps {
    level: number;
    prestige?: number;
    size?: number;
    profileImageUrl?: string;
    showAnimation?: boolean;
    className?: string;
    primaryColor?: string;
    innerRingColor?: string;
    glowIntensity?: number;
    ringText?: string;
    textColor?: string;
}

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

function getTier(level: number): Tier {
    if (level >= 50) return 'diamond';
    if (level >= 41) return 'platinum';
    if (level >= 26) return 'gold';
    if (level >= 11) return 'silver';
    return 'bronze';
}

function getTierColor(tier: Tier): string {
    switch (tier) {
        case 'bronze': return '#cd7f32';
        case 'silver': return '#c0c0c0';
        case 'gold': return '#ffd700';
        case 'platinum': return '#e5e4e2';
        case 'diamond': return '#b9f2ff';
    }
}

// VIBRANT tier colors - much brighter
const TIER_COLORS: Record<Tier, { primary: string; secondary: string; glow: string }> = {
    bronze: { primary: '#F97316', secondary: '#EA580C', glow: '#FB923C' },
    silver: { primary: '#E2E8F0', secondary: '#CBD5E1', glow: '#F8FAFC' },
    gold: { primary: '#FACC15', secondary: '#EAB308', glow: '#FDE047' },
    platinum: { primary: '#22D3EE', secondary: '#06B6D4', glow: '#67E8F9' },
    diamond: { primary: '#60A5FA', secondary: '#3B82F6', glow: '#93C5FD' }
};

const PRESTIGE_COLORS = [
    '#F8FAFC', '#FACC15', '#22D3EE', '#60A5FA', '#F472B6',
    '#4ADE80', '#818CF8', '#C084FC', '#FB7185', '#FDBA74',
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 99, g: 102, b: 241 };
}

function seededRandom(seed: number): () => number {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

export function LevelPFPFrame({
    level,
    prestige = 0,
    size = 128,
    profileImageUrl,
    showAnimation = true,
    className = "",
    primaryColor,
    innerRingColor,
    glowIntensity = 1.5,
    ringText,
    textColor
}: LevelPFPFrameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef(0);

    const tier = getTier(level);
    const tierColors = TIER_COLORS[tier];
    const color = primaryColor || tierColors.primary;
    const glowColor = tierColors.glow;
    const rgb = useMemo(() => hexToRgb(color), [color]);
    const innerColorRgb = useMemo(() => innerRingColor ? hexToRgb(innerRingColor) : null, [innerRingColor]);
    const glowRgb = useMemo(() => hexToRgb(glowColor), [glowColor]);
    const id = useMemo(() => hashString(`${level}-${prestige}`), [level, prestige]);

    // Generate unique ID for SVG path to avoid conflicts
    const textPathId = `text-path-${id}`;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cx = size / 2;
        const cy = size / 2;
        const random = seededRandom(id);

        // Generate particles - MORE of them
        const particleCount = tier === 'diamond' ? 60 : tier === 'platinum' ? 48 : tier === 'gold' ? 36 : tier === 'silver' ? 28 : 20;
        const particles = Array.from({ length: particleCount }, () => ({
            angle: random() * Math.PI * 2,
            speed: 0.2 + random() * 0.6,
            size: 0.008 + random() * 0.02,
            alpha: 0.5 + random() * 0.5,
            radiusOffset: (random() - 0.5) * 0.12,
            layer: Math.floor(random() * 3)
        }));

        // Ring segments for sparkle effect
        const sparkleCount = tier === 'diamond' ? 32 : tier === 'platinum' ? 24 : 16;
        const sparkles = Array.from({ length: sparkleCount }, () => ({
            angle: random() * Math.PI * 2,
            intensity: 0.3 + random() * 0.7,
            speed: random() * 2 - 1
        }));

        // Reduced sizes to keep everything within bounds
        const margin = size * 0.12; // Safe margin for prestige gems
        const innerRadius = size * 0.32;
        const outerRadius = size * 0.42;
        const ringRadius = (innerRadius + outerRadius) / 2;
        const frameWidth = outerRadius - innerRadius;

        const render = () => {
            const time = timeRef.current;
            const pulse = 1 + Math.sin(time * 2.5) * 0.08 * glowIntensity;

            ctx.clearRect(0, 0, size, size);

            // === MULTI-LAYER OUTER GLOW - Only draw in ring area, not center ===
            // Use a donut/ring path instead of full circle
            for (let i = 2; i >= 0; i--) {
                const glowRadius = Math.min(outerRadius + size * (0.04 + i * 0.02) * pulse, size / 2 - margin);
                const alpha = (0.3 - i * 0.08) * glowIntensity;

                // Draw a ring (donut) path - outer circle counterclockwise, inner circle clockwise
                ctx.beginPath();
                ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2, false); // Outer edge
                ctx.arc(cx, cy, innerRadius - 2, 0, Math.PI * 2, true); // Inner cutout
                ctx.closePath();

                // Simple gradient from ring outward
                const glow = ctx.createRadialGradient(cx, cy, outerRadius * 0.8, cx, cy, glowRadius);
                glow.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${alpha})`);
                glow.addColorStop(0.5, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${alpha * 0.4})`);
                glow.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`);

                ctx.fillStyle = glow;
                ctx.fill();
            }

            // === ANIMATED SPARKLES ON RING ===
            sparkles.forEach((sparkle, i) => {
                const ang = sparkle.angle + time * sparkle.speed * 0.1;
                const sx = cx + Math.cos(ang) * ringRadius;
                const sy = cy + Math.sin(ang) * ringRadius;
                const pulseAlpha = (0.5 + Math.sin(time * 3 + i) * 0.5) * sparkle.intensity * glowIntensity;

                if (pulseAlpha > 0.3) {
                    const sparkGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 0.04);
                    sparkGrad.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha * 0.9})`);
                    sparkGrad.addColorStop(0.3, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${pulseAlpha * 0.5})`);
                    sparkGrad.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`);
                    ctx.beginPath();
                    ctx.arc(sx, sy, size * 0.04, 0, Math.PI * 2);
                    ctx.fillStyle = sparkGrad;
                    ctx.fill();
                }
            });

            // === ORBITING PARTICLES ===
            particles.forEach((p, i) => {
                const dir = p.layer % 2 === 0 ? 1 : -1;
                const angle = p.angle + time * p.speed * dir;
                const radius = ringRadius + p.radiusOffset * size;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;
                const pSize = p.size * size * pulse;
                const depth = 0.7 + Math.sin(angle + time) * 0.3;

                // Particle glow
                const pGlow = ctx.createRadialGradient(x, y, 0, x, y, pSize * 4);
                pGlow.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${p.alpha * depth * 0.6})`);
                pGlow.addColorStop(0.5, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${p.alpha * depth * 0.2})`);
                pGlow.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`);
                ctx.beginPath();
                ctx.arc(x, y, pSize * 4, 0, Math.PI * 2);
                ctx.fillStyle = pGlow;
                ctx.fill();

                // Bright core
                ctx.beginPath();
                ctx.arc(x, y, pSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * depth * 0.95})`;
                ctx.fill();
            });

            // === PROFILE IMAGE REMOVED FROM CANVAS (RENDERED IN DOM BELOW) ===


            // === MAIN RING - 3D METALLIC ===
            // Outer shadow
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 0, 0, 0.4)`;
            ctx.lineWidth = frameWidth + 4;
            ctx.stroke();

            // Main ring gradient - enhanced 3D
            const ringGrad = ctx.createRadialGradient(
                cx - frameWidth * 0.8, cy - frameWidth * 0.8, 0,
                cx, cy, outerRadius + 4
            );
            ringGrad.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
            ringGrad.addColorStop(0.15, `rgba(${Math.min(255, rgb.r + 80)}, ${Math.min(255, rgb.g + 80)}, ${Math.min(255, rgb.b + 80)}, 1)`);
            ringGrad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
            ringGrad.addColorStop(0.7, `rgba(${Math.floor(rgb.r * 0.7)}, ${Math.floor(rgb.g * 0.7)}, ${Math.floor(rgb.b * 0.7)}, 1)`);
            ringGrad.addColorStop(1, `rgba(${Math.floor(rgb.r * 0.4)}, ${Math.floor(rgb.g * 0.4)}, ${Math.floor(rgb.b * 0.4)}, 1)`);

            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = ringGrad;
            ctx.lineWidth = frameWidth;
            ctx.stroke();

            // Inner edge highlight
            ctx.beginPath();
            ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
            if (innerColorRgb) {
                ctx.strokeStyle = `rgba(${innerColorRgb.r}, ${innerColorRgb.g}, ${innerColorRgb.b}, 0.9)`;
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
                ctx.lineWidth = 2;
            }
            ctx.stroke();

            // Outer edge with glow
            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${0.8 * glowIntensity})`;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 1)`;
            ctx.shadowBlur = 12 * glowIntensity;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // === DIAMOND SHIMMER ===
            if (tier === 'diamond') {
                const hue = (time * 60) % 360;
                ctx.beginPath();
                ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${0.4 * glowIntensity})`;
                ctx.lineWidth = frameWidth * 0.6;
                ctx.stroke();

                // Rainbow edge
                const segments = 12;
                for (let i = 0; i < segments; i++) {
                    const startAngle = (i / segments) * Math.PI * 2 + time * 0.5;
                    const endAngle = startAngle + Math.PI / segments;
                    const segHue = (hue + i * 30) % 360;

                    ctx.beginPath();
                    ctx.arc(cx, cy, outerRadius + 2, startAngle, endAngle);
                    ctx.strokeStyle = `hsla(${segHue}, 100%, 70%, ${0.5 * glowIntensity})`;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = `hsla(${segHue}, 100%, 70%, 0.8)`;
                    ctx.shadowBlur = 8;
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
            }

            // === LEVEL BADGE now rendered as DOM element for proper z-index layering ===
            // (Badge drawing removed from canvas - now in separate DOM element at z-20)

            // === PRESTIGE GEMS - Compact arc above ring ===
            if (prestige > 0) {
                const gemCount = Math.min(prestige, 10);
                // Tighter spacing to keep gems in safe zone
                const gemSpacing = 0.22;
                const gemArcStart = -Math.PI / 2 - (gemCount - 1) * gemSpacing / 2;
                // Keep gems closer to ring and within bounds
                const gemOrbitR = outerRadius + size * 0.045;
                const gemSize = size * 0.028;

                for (let i = 0; i < gemCount; i++) {
                    const gemAngle = gemArcStart + i * gemSpacing;
                    const gx = cx + Math.cos(gemAngle) * gemOrbitR;
                    const gy = cy + Math.sin(gemAngle) * gemOrbitR;
                    const gemRgb = hexToRgb(PRESTIGE_COLORS[i] || '#FACC15');
                    const gemPulse = 0.8 + Math.sin(time * 3 + i * 0.5) * 0.2;

                    // Gem glow - smaller
                    const gemGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gemSize * 2.5);
                    gemGlow.addColorStop(0, `rgba(${gemRgb.r}, ${gemRgb.g}, ${gemRgb.b}, ${0.6 * gemPulse * glowIntensity})`);
                    gemGlow.addColorStop(0.5, `rgba(${gemRgb.r}, ${gemRgb.g}, ${gemRgb.b}, ${0.25 * gemPulse * glowIntensity})`);
                    gemGlow.addColorStop(1, `rgba(${gemRgb.r}, ${gemRgb.g}, ${gemRgb.b}, 0)`);
                    ctx.beginPath();
                    ctx.arc(gx, gy, gemSize * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = gemGlow;
                    ctx.fill();

                    // Diamond shape
                    ctx.beginPath();
                    ctx.moveTo(gx, gy - gemSize);
                    ctx.lineTo(gx + gemSize * 0.7, gy);
                    ctx.lineTo(gx, gy + gemSize);
                    ctx.lineTo(gx - gemSize * 0.7, gy);
                    ctx.closePath();

                    const gemGrad = ctx.createLinearGradient(gx - gemSize, gy - gemSize, gx + gemSize, gy + gemSize);
                    gemGrad.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
                    gemGrad.addColorStop(0.3, `rgba(${gemRgb.r}, ${gemRgb.g}, ${gemRgb.b}, 1)`);
                    gemGrad.addColorStop(1, `rgba(${Math.floor(gemRgb.r * 0.6)}, ${Math.floor(gemRgb.g * 0.6)}, ${Math.floor(gemRgb.b * 0.6)}, 1)`);

                    ctx.fillStyle = gemGrad;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            if (showAnimation) {
                timeRef.current += 0.016;
                animationRef.current = requestAnimationFrame(render);
            }
        };

        render();
        return () => cancelAnimationFrame(animationRef.current);
    }, [size, rgb, glowRgb, tier, level, prestige, showAnimation, id, glowIntensity]);

    const innerRadius = size * 0.32;
    const imgSize = (innerRadius - 3) * 2;
    const centerOffset = (size - imgSize) / 2;

    return (
        <div
            className={`relative inline-block ${className}`}
            style={{
                width: size,
                height: size,
                filter: `drop-shadow(0 0 ${10 * glowIntensity}px rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0.5))`
            }}
        >
            {/* DOM Image Layer - Behind Canvas to prevent Tainted Canvas Errors */}
            {profileImageUrl && (
                <div
                    className="absolute rounded-full overflow-hidden bg-black/50"
                    style={{
                        top: centerOffset,
                        left: centerOffset,
                        width: imgSize,
                        height: imgSize,
                    }}
                >
                    <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Canvas Layer - Pure Vector Graphics (Safe) */}
            <canvas ref={canvasRef} width={size} height={size} className="absolute inset-0 w-full h-full z-10" />

            {/* SVG Text Overlay - Spinning Ring Text (z-15 above canvas ring, badge on canvas will overlap at bottom) */}
            {ringText && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    style={{ animation: 'spin 20s linear infinite', zIndex: 15 }}
                >
                    <defs>
                        {/* Full circle path for text to follow */}
                        <path
                            id={textPathId}
                            d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                            fill="none"
                        />
                    </defs>
                    <text
                        fontSize="6"
                        fontWeight="700"
                        letterSpacing="1.5"
                        fill={textColor || color}
                        style={{ textTransform: 'uppercase' }}
                    >
                        <textPath
                            href={`#${textPathId}`}
                            startOffset="0%"
                        >
                            {ringText} • {ringText} • {ringText} • {ringText} •
                        </textPath>
                    </text>
                </svg>
            )}

            {/* DOM Level Badge - z-20 to appear above spinning text */}
            <div
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                    bottom: size * 0.02,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20
                }}
            >
                <div
                    className="flex items-center justify-center rounded-full font-black text-white"
                    style={{
                        width: size * 0.22,
                        height: size * 0.15,
                        fontSize: size * 0.1,
                        background: `linear-gradient(180deg, rgba(255,255,255,0.5) 0%, ${color} 20%, ${color} 50%, rgba(0,0,0,0.3) 100%)`,
                        boxShadow: `0 0 ${8 * glowIntensity}px ${color}, inset 0 1px 2px rgba(255,255,255,0.3)`,
                        border: `1px solid ${color}`,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                >
                    {level}
                </div>
            </div>
        </div>
    );
}

export default LevelPFPFrame;
