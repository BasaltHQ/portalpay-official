"use client";

import React, { useCallback, useState } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, { img: string }> = {
  sm: { img: "h-8 w-8" },
  md: { img: "h-10 w-10" },
  lg: { img: "h-12 w-12" },
  xl: { img: "h-16 w-16" },
};

export default function WhiteBrandIcon({
  url,
  alt,
  size = "md",
  className = "",
  fallbackUrl,
}: {
  url: string;
  alt: string;
  size?: Size;
  className?: string;
  fallbackUrl?: string;
}) {
  const classes = sizeMap[size];
  const [currentSrc, setCurrentSrc] = useState<string>(url);
  const onError = useCallback(() => {
    if (fallbackUrl && currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
    }
  }, [fallbackUrl, currentSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={onError}
      className={`object-contain ${classes.img} ${className}`}
      style={{
        // Force pure white, backgroundless rendering from monochrome SVGs
        filter: "brightness(0) invert(1)",
      }}
    />
  );
}
