"use client";

import React, { useCallback, useState } from "react";

interface LogoTileProps {
  slug: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "h-12 w-12 rounded-lg", img: "h-8 w-8 rounded-md" },
  md: { container: "h-14 w-14 rounded-lg", img: "h-10 w-10 rounded-md" },
  lg: { container: "h-16 w-16 rounded-xl", img: "h-12 w-12 rounded-lg" },
};

export default function LogoTile({
  slug,
  alt,
  size = "md",
  className = "",
}: LogoTileProps) {
  // Prefer best-known sources per brand (avoid initial 404 + swap)
  const initialSrc =
    slug === "flexa"
      ? `/logos/flexa.webp`
      : slug === "woocommerce"
      ? `/logos/woocommerce.svg`
      : `/logos/${slug}.png`;
  const [src, setSrc] = useState<string>(initialSrc);
  const [attempt, setAttempt] = useState<number>(0);

  const onError = useCallback(() => {
    // Prefer WEBP for flexa, avoid the low-quality SVG
    if (slug === "flexa") {
      if (attempt === 0) {
        setSrc(`/logos/${slug}.png`);
        setAttempt(1);
      } else if (attempt === 1) {
        setSrc(`/logos/Untitled-2.png`);
        setAttempt(2);
      }
      return;
    }

    if (attempt === 0) {
      setSrc(`/logos/${slug}.svg`);
      setAttempt(1);
    } else if (attempt === 1) {
      setSrc(`/logos/Untitled-2.png`);
      setAttempt(2);
    }
  }, [attempt, slug]);

  const classes = sizeMap[size];

  return (
    <div
      className={`border bg-white flex items-center justify-center overflow-hidden ${classes.container} ${className}`}
    >
      <img
        src={src}
        alt={alt ?? `${slug} logo`}
        className={`object-contain ${classes.img}`}
        onError={onError}
      />
    </div>
  );
}
