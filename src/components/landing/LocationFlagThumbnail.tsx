'use client';

import Image from 'next/image';
import { useBrand } from "@/contexts/BrandContext";

export interface LocationFlagThumbnailProps {
  colors: string[];
  size?: number;
}

/**
 * LocationFlagThumbnail
 * - Compact square thumbnail with vibrant flag gradient for location listings
 * - More saturated colors and bolder animation for visibility
 * - Optimized for small display sizes
 */
export default function LocationFlagThumbnail({
  colors,
  size = 96,
}: LocationFlagThumbnailProps) {
  const brand = useBrand();
  // Ensure we have 5 colors by cycling the provided palette
  const palette = Array.from({ length: 5 }, (_, i) => colors[i % Math.max(colors.length, 1)] || '#999999');

  // Tighter positioning for square format
  const positions = [
    { top: '10%', left: '10%' },   // blob 1
    { top: '10%', right: '10%' },  // blob 2
    { bottom: '10%', left: '10%' },// blob 3
    { bottom: '10%', right: '10%' }, // blob 4
    { top: '40%', left: '40%' },  // blob 5 (center)
  ] as const;

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ width: size, height: size }}
      aria-label="Location flag gradient"
    >
      {/* Darker base for more contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20" />

      {/* Mesh container */}
      <div className="mesh absolute -inset-[15%]">
        {/* Render 5 animated blobs with higher opacity for "louder" effect */}
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

      {/* Square logo container - matches FlagMeshCard styling */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm border aspect-square p-3">
          <Image
            src={brand?.key === 'basaltsurge' ? "/BasaltSurgeD.png" : (brand?.logos?.symbol || brand?.logos?.favicon || brand?.logos?.app || "/ppsymbol.png")}
            alt={brand?.name || "Brand"}
            width={Math.floor(size * 0.5)}
            height={Math.floor(size * 0.5)}
            className="drop-shadow-lg"
          />
        </div>
      </div>

      {/* Stronger vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]" />

      <style jsx>{`
        .mesh-blob {
          position: absolute;
          width: 50%;
          height: 50%;
          border-radius: 9999px;
          filter: blur(35px);
          opacity: 0.85; /* Higher opacity for more vibrant colors */
          mix-blend-mode: screen;
          will-change: transform;
        }

        /* Faster, more noticeable animations */
        .blob1 { animation: float1 10s ease-in-out infinite alternate; }
        .blob2 { animation: float2 11s ease-in-out infinite alternate; }
        .blob3 { animation: float3 12s ease-in-out infinite alternate; }
        .blob4 { animation: float4 13s ease-in-out infinite alternate; }
        .blob5 { animation: float5 14s ease-in-out infinite alternate; }

        @keyframes float1 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(15%, -10%, 0) scale(1.15); }
        }
        @keyframes float2 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(-12%, 12%, 0) scale(1.12); }
        }
        @keyframes float3 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(18%, 8%, 0) scale(1.14); }
        }
        @keyframes float4 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(-15%, -8%, 0) scale(1.13); }
        }
        @keyframes float5 {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.0); }
          100% { transform: translate3d(0%, 12%, 0) scale(1.16); }
        }
      `}</style>
    </div>
  );
}
