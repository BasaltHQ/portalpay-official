import type { MetadataRoute } from "next";
import { getBrandConfig, getBrandKey } from "@/config/brands";
import { getEnv } from "@/lib/env";

/**
 * Dynamic web app manifest per brand.
 * Ensures partner favicon (.ico) is advertised correctly and avoids portal defaults.
 */
export default function manifest(): MetadataRoute.Manifest {
  // Prefer explicit brand key when available (env), otherwise fall back to config helper
  let key: string;
  try { key = getBrandKey(); } catch { key = ""; }
  const brand = getBrandConfig(key);
  const env = getEnv();
  const isPartner = String(env.CONTAINER_TYPE || "").toLowerCase() === "partner";

  const fav = String(brand.logos?.favicon || "").trim();
  const isIco = /\.ico($|\?)/i.test(fav);

  const icons: MetadataRoute.Manifest["icons"] = [];
  if (fav) {
    // Advertise partner favicon with correct MIME; browsers and PWAs can pick it up
    icons.push({
      src: fav,
      sizes: isIco ? "any" : "32x32",
      type: isIco ? "image/x-icon" : "image/png",
    });
  } else {
    // Fallbacks only when favicon not provided
    icons.push(
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    );
  }

  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.meta?.ogDescription || "Crypto-native payments with unified billing, instant receipts, and analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons,
  };
}
