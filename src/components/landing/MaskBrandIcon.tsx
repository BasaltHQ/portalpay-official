"use client";

import React from "react";

type Size = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, { box: string }> = {
  sm: { box: "h-8 w-8" },
  md: { box: "h-10 w-10" },
  lg: { box: "h-12 w-12" },
  xl: { box: "h-16 w-16" },
};

/**
 * Renders a local logo asset as a pure white, backgroundless silhouette using CSS mask.
 * Use this for logos that don't render correctly when color-inverted (e.g., Base).
 */
export default function MaskBrandIcon({
  url,
  alt,
  size = "md",
  className = "",
}: {
  url: string;
  alt: string;
  size?: Size;
  className?: string;
}) {
  const classes = sizeMap[size];

  return (
    <div
      role="img"
      aria-label={alt}
      title={alt}
      className={`${classes.box} ${className}`}
      style={{
        backgroundColor: "#ffffff",
        // CSS mask for white silhouette, no background
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
