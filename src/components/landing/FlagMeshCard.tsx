'use client';

import Image from 'next/image';
import { useBrand } from '@/contexts/BrandContext';

export interface FlagMeshCardProps {
  colors: string[];
  className?: string;
  logoSrc?: string;
  height?: number;
}

/**
 * FlagMeshCard
 * - Renders a brand logo card over a graceful 5-blob animated "mesh gradient"
 * - Colors are derived from the location's country flag (passed via props)
 * - Pure CSS animation (no JS timers). Works in server components.
 */
export default function FlagMeshCard({
  colors,
  className = '',
  logoSrc,
  height = 224, // ~h-56
}: FlagMeshCardProps) {
  const brand = useBrand();
  // Resolve logo: prefer brand symbol/app, then provided logoSrc, else platform ppsymbol fallback
  const resolvedLogoSrc = String(brand?.logos?.symbol || brand?.logos?.app || logoSrc || '/ppsymbol.png');

  // Ensure we have 5 colors by cycling the provided palette
  const palette = Array.from({ length: 5 }, (_, i) => colors[i % Math.max(colors.length, 1)] || '#999999');

  // Initial positions for the 5 blobs (percentages relative to container)
  const positions = [
    { top: '5%', left: '10%' },   // blob 1
    { top: '10%', right: '5%' },  // blob 2
    { bottom: '5%', left: '15%' },// blob 3
    { bottom: '10%', right: '10%' }, // blob 4
    { top: '35%', left: '40%' },  // blob 5 (center-ish)
  ] as const;

  return (
      <div
        className={`relative overflow-hidden rounded-2xl border glass-pane ${className}`}
        style={{ height }}
        aria-label={`${brand?.name || 'Brand'} logo with animated mesh gradient`}
      >
      {/* Soft base to help mesh blend on both light/dark themes */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 to-background/20" />

      {/* Mesh container expanded to avoid clipping while animating */}
      <div className="mesh absolute -inset-[20%]">
        {/* Render 5 animated blobs */}
        {palette.map((c, i) => {
          const pos = positions[i];
          return (
            <span
              key={i}
              className={`mesh-blob blob${i + 1}`}
              style={{
                background: c,
                ...(pos as any),
              }}
            />
          );
        })}
      </div>

      {/* Logo overlay */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm px-6 py-4 border">
          <Image
            src={resolvedLogoSrc}
            alt={brand?.name || 'Brand'}
            width={96}
            height={96}
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Animated shadow vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.15)]" />

      <style jsx>{`
        .mesh-blob {
          position: absolute;
          width: 45%;
          height: 45%;
          border-radius: 9999px;
          filter: blur(40px);
          opacity: 0.6;
          mix-blend-mode: screen; /* Nice additive blending */
          will-change: transform;
        }

        /* Gentle floating animations, each with distinct path/timing */
        .blob1 { animation: float1 14s ease-in-out infinite alternate; }
        .blob2 { animation: float2 16s ease-in-out infinite alternate; }
        .blob3 { animation: float3 18s ease-in-out infinite alternate; }
        .blob4 { animation: float4 20s ease-in-out infinite alternate; }
        .blob5 { animation: float5 22s ease-in-out infinite alternate; }

        @keyframes float1 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(12%, -8%, 0) scale(1.08); }
        }
        @keyframes float2 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(-10%, 10%, 0) scale(1.05); }
        }
        @keyframes float3 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(15%, 6%, 0) scale(1.07); }
        }
        @keyframes float4 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(-12%, -6%, 0) scale(1.06); }
        }
        @keyframes float5 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(0%, 10%, 0) scale(1.09); }
        }
      `}</style>
    </div>
  );
}
