"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  primaryColor?: string;
  secondaryColor?: string;
  bars?: number;
  height?: number | string;
  /** Border radius for compact mode - clips visualization to rounded corners */
  borderRadius?: number | string;
};

/**
 * HeroVisualizer
 * Full-width spectral equalizer that reacts to live mic/agent spectrum.
 * - Only visible while the voice agent is listening
 * - Fixed color: secondaryColor (no agent/user color switching)
 * - Rectangular bars scaled from actual audio frequency magnitudes (AnalyserNode)
 * - Peak bar height maps to the top of the hero content area (container height),
 *   so the visualization can reach the bottom border of the cover photo.
 * - Does not process audio; subscribes to pp:voice:levels events from the voice hook
 *   and uses micSpectrum/agentSpectrum arrays when available.
 */
const HeroVisualizer: React.FC<Props> = ({
  primaryColor = "#0ea5e9",
  secondaryColor = "#22c55e",
  bars = 48,
  height = "100%",
  borderRadius = 0,
}) => {
  const count = Math.max(16, Math.floor(Number(bars)));
  const [isActive, setIsActive] = useState(false);
  const [dominant, setDominant] = useState<"idle" | "user" | "agent">("idle");
  const [amp, setAmp] = useState(0);
  const heightsRef = useRef<number[]>([]);
  const [, force] = useState(0);

  // Resample a spectrum array to N bars, mirroring to create centered symmetric visualization
  const resampleSpectrum = (src: number[] | undefined, n: number): number[] => {
    if (!src || src.length === 0 || n <= 0) return Array.from({ length: n }, () => 0);
    
    // First, resample the source spectrum to half the bars (we'll mirror it)
    const halfN = Math.ceil(n / 2);
    const halfOut: number[] = new Array(halfN).fill(0);
    
    // Use only the lower 60% of the spectrum where most energy exists
    const usableLength = Math.floor(src.length * 0.6);
    const step = usableLength / halfN;
    
    for (let i = 0; i < halfN; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      let sum = 0;
      let cnt = 0;
      for (let k = start; k < Math.min(usableLength, Math.max(start + 1, end)); k++) {
        sum += src[k];
        cnt++;
      }
      halfOut[i] = cnt ? sum / cnt : 0;
    }
    
    // Now create the full output by mirroring: center bars get highest values
    // Pattern: edges → center → edges (symmetric)
    const out: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      // Map position to 0 (edges) → 1 (center) → 0 (edges)
      const centerDist = Math.abs((i / (n - 1)) - 0.5) * 2; // 0 at center, 1 at edges
      const halfIdx = Math.floor(centerDist * (halfN - 1));
      const clampedIdx = Math.min(halfN - 1, Math.max(0, halfIdx));
      out[i] = halfOut[clampedIdx];
    }
    
    // Apply gentle bell-curve shaping for visual smoothness
    for (let i = 0; i < n; i++) {
      const pos = i / Math.max(1, n - 1); // 0 to 1
      // Hanning window peaks at center (pos=0.5)
      const hanningWeight = 0.5 * (1 - Math.cos(2 * Math.PI * pos));
      // Blend: base value shaped by hanning for smooth falloff at edges
      const weight = 0.6 + 0.5 * hanningWeight;
      out[i] = Math.max(0, Math.min(1, out[i] * weight));
    }
    
    return out;
  };

  // Simple moving-average smoothing to soften sharp peaks
  const smoothArray = (src: number[], window = 5): number[] => {
    const n = src.length;
    if (n === 0 || window <= 1) return src.slice();
    const half = Math.floor(window / 2);
    const out: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let cnt = 0;
      for (let k = i - half; k <= i + half; k++) {
        const idx = Math.max(0, Math.min(n - 1, k));
        sum += src[idx];
        cnt++;
      }
      out[i] = cnt ? sum / cnt : src[i];
    }
    return out;
  };

  // Build a contiguous smoothed area path (cubic) from values (0..1)
  // Inverted: base at top, peaks flow downward (like a mouth)
  const buildSmoothAreaPath = (vals: number[], n: number): string => {
    // No inversion - values grow downward from 0 (top)
    const clampY = (v: number) => Math.max(0, Math.min(0.999, v));
    const y = (i: number) => clampY(vals[i] || 0);

    // Start path at top-left corner (0,0), then trace the wave
    let d = `M 0,0 L 0,${y(0)}`;
    for (let i = 1; i < n; i++) {
      const x0 = i - 1;
      const x1 = i;
      const y0 = y(i - 1);
      const y1 = y(i);
      // Simple cubic smoothing: control points mid-way between samples
      const cp1x = x0 + 0.5;
      const cp1y = y0;
      const cp2x = x1 - 0.5;
      const cp2y = y1;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
    }
    // Close path back to top-right corner
    d += ` L ${n - 1},0 Z`;
    return d;
  };

  // Initialize per-bar heights
  useEffect(() => {
    heightsRef.current = Array.from({ length: count }, () => 0);
  }, [count]);

  // Subscribe to live levels from the voice hook
  useEffect(() => {
    const onLevels = (e: Event) => {
      const ce = e as CustomEvent<{
        isListening: boolean;
        micLevel: number;
        agentLevel: number;
        micSpectrum?: number[];
        agentSpectrum?: number[];
      }>;
      const listening = !!ce.detail?.isListening;
      const micLevel = Number(ce.detail?.micLevel || 0);
      const agentLevel = Number(ce.detail?.agentLevel || 0);
      const micSpec = ce.detail?.micSpectrum || [];
      const agentSpec = ce.detail?.agentSpectrum || [];

      setIsActive(listening);

      if (!listening) {
        // fade out quickly and reset
        setAmp(0);
        heightsRef.current = heightsRef.current.map(() => 0);
        force((x) => x + 1);
        setDominant("idle");
        return;
      }

      const dom = micLevel >= agentLevel ? "user" : "agent";
      setDominant(dom);

      // Normalize amplitude (0..1) with mild boost, clamp
      const a = Math.min(1, Math.max(0, Math.max(micLevel, agentLevel) * 1.2));
      setAmp(a);

      // Choose spectrum from the source with higher energy to ensure visibility,
      // then resample and smooth it.
      const micEnergy = (micSpec || []).reduce((s, v) => s + (v || 0), 0);
      const agentEnergy = (agentSpec || []).reduce((s, v) => s + (v || 0), 0);
      const chosen = micEnergy >= agentEnergy ? micSpec : agentSpec;

      let barsSpec = resampleSpectrum(chosen, count);

      // If spectrum empty, fallback to a simple window shape modulated by amplitude
      if (!chosen || chosen.length === 0) {
        barsSpec = Array.from({ length: count }, (_, i) => {
          const pos = i / Math.max(1, count - 1);
          const window = 0.6 - 0.3 * Math.abs(pos - 0.5); // center emphasis
          return Math.max(0, Math.min(1, a * window));
        });
      }

      // Additional moving-average smoothing before applying low-pass
      barsSpec = smoothArray(barsSpec, 7);

      // Apply low-pass filter and a baseline floor so it's visible while active.
      const baseFloor = 0.08; // small solid baseline for contiguous fill
      const next = heightsRef.current.slice();
      for (let i = 0; i < count; i++) {
        // Weight target by current amplitude so shape grows with louder audio
        const weighted = baseFloor + (1 - baseFloor) * Math.max(0, Math.min(1, barsSpec[i])) * (0.7 + 0.3 * a);
        next[i] = next[i] * 0.55 + weighted * 0.45;
      }
      heightsRef.current = next;
      force((x) => x + 1);
    };

    window.addEventListener("pp:voice:levels", onLevels as EventListener);
    return () => {
      window.removeEventListener("pp:voice:levels", onLevels as EventListener);
    };
  }, [count]);

  const color = useMemo(() => {
    return isActive ? secondaryColor : "transparent";
  }, [isActive, secondaryColor]);

  if (!isActive) {
    // Do not render when the agent is not listening
    return null;
  }

  // Build contiguous area path for current spectrum
  const values = heightsRef.current.slice();
  const smoothed = smoothArray(values, 9);
  const areaPath = buildSmoothAreaPath(smoothed, count);

  // Parse borderRadius to handle string (e.g. "1rem") or number (px)
  const radiusStyle = typeof borderRadius === 'number' 
    ? `${borderRadius}px` 
    : borderRadius || '0';
  const hasRadius = borderRadius && borderRadius !== 0 && borderRadius !== '0';

  return (
    <div 
      className="pp-hero-vis" 
      style={{ 
        color, 
        width: "100%", 
        height: "100%",
        overflow: hasRadius ? 'hidden' : undefined,
        borderRadius: hasRadius ? radiusStyle : undefined,
      }}
    >
      <svg
        className="pp-hero-vis-svg"
        viewBox={`0 0 ${count - 1} 1`}
        preserveAspectRatio="none"
        style={{ 
          height, 
          width: "100%",
          borderRadius: hasRadius ? radiusStyle : undefined,
        }}
      >
        <path d={areaPath} fill={secondaryColor} opacity={0.95} />
      </svg>

      <style jsx>{`
        .pp-hero-vis-svg {
          display: block;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default HeroVisualizer;
