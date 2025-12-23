"use client";

import React, { useMemo } from "react";

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function DefaultAvatar({ seed, size = 64, className = "" }: { seed: string; size?: number; className?: string }) {
  const svg = useMemo(() => {
    const h = hashString(seed || "");
    const hue = h % 360;
    const hue2 = (h * 7) % 360;
    const bg = `hsl(${hue} 70% 20%)`;
    const fg = `hsl(${hue2} 70% 55%)`;
    const s = size;
    const circleR = Math.max(6, Math.floor((s / 2) * 0.6));
    const dotR = Math.max(3, Math.floor((s / 2) * 0.18));
    const cx = s / 2;
    const cy = s / 2;
    const leftX = cx - circleR * 0.5;
    const rightX = cx + circleR * 0.5;
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect width="${s}" height="${s}" rx="${s/2}" ry="${s/2}" fill="${bg}"/><circle cx="${cx}" cy="${cy}" r="${circleR}" fill="${fg}" opacity="0.18"/><circle cx="${leftX}" cy="${cy}" r="${dotR}" fill="${fg}"/><circle cx="${rightX}" cy="${cy}" r="${dotR}" fill="${fg}"/></svg>`;
  }, [seed, size]);
  const dataUrl = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64')}`;
  return (
    <img src={dataUrl} alt="avatar" width={size} height={size} className={className} />
  );
}


