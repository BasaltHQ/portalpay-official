"use client";

import React from "react";
import { useBrand } from "@/contexts/BrandContext";

// Shared types used across Admin panels

export type ReserveBalancesResponse = {
  degraded?: boolean;
  reason?: string;
  balances?: Record<
    string,
    {
      units?: number;
      usd?: number;
    }
  >;
  totalUsd?: number;
  wallet?: string; // legacy
  merchantWallet?: string;
  sourceWallet?: string;
  splitAddressUsed?: string | null;
  indexedMetrics?: {
    totalVolumeUsd: number;
    merchantEarnedUsd: number;
    platformFeeUsd: number;
    customers: number;
    totalCustomerXp: number;
    transactionCount: number;
  };
};

export type SiteConfig = {
  processingFeePct?: number;
  reserveRatios?: Record<string, number>;
  defaultPaymentToken?: "ETH" | "USDC" | "USDT" | "cbBTC" | "cbXRP" | "SOL";
  accumulationMode?: "fixed" | "dynamic";
  taxConfig?: {
    jurisdictions?: { code: string; name: string; rate: number; country?: string; type?: string }[];
    provider?: { name?: string; apiKeySet?: boolean };
    defaultJurisdictionCode?: string;
  };
  theme?: { brandName?: string };
};

export type TaxCatalogEntry = {
  code: string;
  name: string;
  rate: number;
  country?: string;
  type?: string;
  components?: { code: string; name: string; rate: number }[];
};

// Shared Thumbnail component used across panels

export function Thumbnail({
  src,
  size = 32,
  alt = "",
  itemId = "",
  primaryColor,
  secondaryColor,
}: {
  src?: string | null;
  size?: number;
  alt?: string;
  itemId?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const s = Math.max(16, Math.floor(size));
  const brand = useBrand();

  if (src) {
    let display = src as string;
    try {
      if (typeof src === "string" && src.startsWith("/uploads/") && src.endsWith(".webp")) {
        display = src.replace(/\.webp$/, "_thumb.webp");
      }
    } catch {}
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={display} alt={alt} style={{ height: s, width: s }} className="rounded-md object-cover border flex-shrink-0" />;
  }

  const generateColors = (id: string, primary: string, secondary: string): string[] => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash = hash & hash;
    }
    const colors: string[] = [primary || "#0ea5e9", secondary || "#22c55e"];
    for (let i = 0; i < 3; i++) {
      const h = Math.abs(hash + i * 137) % 360;
      const s = 65 + (Math.abs(hash + i * 251) % 25);
      const l = 55 + (Math.abs(hash + i * 179) % 25);
      colors.push(`hsl(${h}, ${s}%, ${l}%)`);
    }
    return colors;
  };

  const colors = generateColors(itemId || alt || "default", primaryColor || "#0ea5e9", secondaryColor || "#22c55e");
  const gradientStyle: React.CSSProperties = {
    background: `
      radial-gradient(at 0% 0%, ${colors[0]} 0px, transparent 50%),
      radial-gradient(at 100% 0%, ${colors[1]} 0px, transparent 50%),
      radial-gradient(at 100% 100%, ${colors[2]} 0px, transparent 50%),
      radial-gradient(at 0% 100%, ${colors[3]} 0px, transparent 50%),
      radial-gradient(at 50% 50%, ${colors[4]} 0px, transparent 50%)
    `,
    backgroundColor: colors[0],
  };

  return (
    <div style={{ ...{ height: s, width: s }, ...gradientStyle }} className="rounded-md border flex items-center justify-center flex-shrink-0 relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand?.logos?.symbol || brand?.logos?.app || "/ppsymbol.png"}
        alt={brand?.name || "Brand"}
        className="w-1/2 h-1/2 object-contain opacity-90"
      />
    </div>
  );
}
