"use client";

import React, { useMemo } from "react";

type PrestigeBadgeProps = {
    level: number;
    prestige: number; // 0 to 10+
    size?: number;
    className?: string;
};

/**
 * Generates a deterministic but unique-looking badge based on prestige and level.
 * Uses SVG filters and gradients for an "epic" look.
 */
export function PrestigeBadge({ level, prestige, size = 120, className = "" }: PrestigeBadgeProps) {

    const config = useMemo(() => {
        // Deterministic colors based on prestige tier
        const tiers = [
            { main: "#78716c", accent: "#a8a29e", glow: "#d6d3d1" }, // 0: Stone
            { main: "#b45309", accent: "#d97706", glow: "#fcd34d" }, // 1: Bronze
            { main: "#64748b", accent: "#94a3b8", glow: "#e2e8f0" }, // 2: Silver
            { main: "#eab308", accent: "#facc15", glow: "#fef08a" }, // 3: Gold
            { main: "#0ea5e9", accent: "#38bdf8", glow: "#bae6fd" }, // 4: Diamond
            { main: "#a855f7", accent: "#c084fc", glow: "#e9d5ff" }, // 5: Master
            { main: "#ef4444", accent: "#f87171", glow: "#fecaca" }, // 6: Grandmaster
            { main: "#be123c", accent: "#fb7185", glow: "#ffe4e6" }, // 7: Challenger
            { main: "#14b8a6", accent: "#2dd4bf", glow: "#ccfbf1" }, // 8: Celestial
            { main: "#d946ef", accent: "#e879f9", glow: "#fae8ff" }, // 9: Galaxy
            { main: "#f43f5e", accent: "#fb7185", glow: "#fff1f2" }, // 10: Infinite
        ];

        const tier = tiers[Math.min(prestige, tiers.length - 1)];

        // Shape complexity increases with prestige
        const spikes = 8 + (prestige * 2);
        const innerRotation = level * 6; // Rotate inner ring based on level

        return { ...tier, spikes, innerRotation };
    }, [level, prestige]);

    // Generate star path
    const starPath = useMemo(() => {
        let points = "";
        const cx = 50, cy = 50;
        const outerRadius = 45;
        const innerRadius = 25 - (prestige * 1); // Spikier as prestige goes up
        const count = config.spikes;

        for (let i = 0; i < count * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (Math.PI * i) / count;
            const x = cx + r * Math.sin(a);
            const y = cy + r * Math.cos(a);
            points += `${x},${y} `;
        }
        return points;
    }, [config.spikes, prestige]);

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                <defs>
                    <linearGradient id={`grad-${prestige}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={config.main} />
                        <stop offset="50%" stopColor={config.accent} />
                        <stop offset="100%" stopColor={config.glow} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <mask id="badge-mask">
                        <circle cx="50" cy="50" r="48" fill="white" />
                    </mask>
                </defs>

                {/* Animated Background Pulse */}
                <circle cx="50" cy="50" r="35" fill={config.main} opacity="0.2">
                    <animate attributeName="r" values="35;45;35" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.1;0.2" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Main Star Shape */}
                <polygon
                    points={starPath}
                    fill={`url(#grad-${prestige})`}
                    stroke="white"
                    strokeWidth="1.5"
                    filter="url(#glow)"
                />

                {/* Rotating Inner Ring */}
                <g transform={`rotate(${config.innerRotation} 50 50)`}>
                    <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                </g>

                {/* Level Text bg */}
                <circle cx="50" cy="50" r="14" fill="#1e293b" stroke={config.accent} strokeWidth="2" />

                {/* Level Text */}
                <text
                    x="50"
                    y="50"
                    dy="0.35em"
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.5))"
                >
                    {level}
                </text>
            </svg>

            {/* Prestige Label (Floating below) */}
            {prestige > 0 && (
                <div
                    className="absolute -bottom-4 bg-background border px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm whitespace-nowrap"
                    style={{ color: config.main, borderColor: config.accent }}
                >
                    Prestige {prestige}
                </div>
            )}
        </div>
    );
}
