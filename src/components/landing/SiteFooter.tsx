"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cachedFetch } from "@/lib/client-api-cache";
import { getDefaultBrandSymbol, resolveBrandSymbol } from "@/lib/branding";

export default function SiteFooter() {
  const brand = useBrand();
  const { theme } = useTheme();
  const [containerBrandKey, setContainerBrandKey] = useState<string>("");
  const [containerType, setContainerType] = useState<string>("");
  // Partner brand assets (fetched when container is partner type)
  const [partnerLogoSymbol, setPartnerLogoSymbol] = useState<string>("");
  const [partnerLogoFavicon, setPartnerLogoFavicon] = useState<string>("");
  const [partnerLogoApp, setPartnerLogoApp] = useState<string>("");
  const [partnerBrandName, setPartnerBrandName] = useState<string>("");
  const [isPartnerBrandLoading, setIsPartnerBrandLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    cachedFetch("/api/site/container", { cache: "no-store" })
      .then((ci: any) => {
        if (cancelled) return;
        const bk = String(ci?.brandKey || "").trim();
        const ct = String(ci?.containerType || "").trim();
        setContainerBrandKey(bk);
        setContainerType(ct);
        // If not a partner container, stop loading state immediately
        if (ct.toLowerCase() !== "partner" || !bk) {
          setIsPartnerBrandLoading(false);
        }
      })
      .catch(() => {
        setIsPartnerBrandLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Fetch partner brand configuration when in a partner container
  useEffect(() => {
    if (containerType.toLowerCase() !== "partner" || !containerBrandKey) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/platform/brands/${encodeURIComponent(containerBrandKey)}/config`, { cache: "no-store" });
        if (!res.ok || cancelled) {
          if (!cancelled) setIsPartnerBrandLoading(false);
          return;
        }
        const data = await res.json();
        // API returns { brandKey, brand: { logos, ... }, overrides }
        const cfg = data?.brand || data?.config || data || {};
        const logos = cfg?.logos || data?.overrides?.logos || cfg?.theme?.logos || {};
        if (!cancelled) {
          setPartnerLogoSymbol(String(logos?.symbol || "").trim());
          setPartnerLogoFavicon(String(logos?.favicon || cfg?.theme?.brandFaviconUrl || "").trim());
          setPartnerLogoApp(String(logos?.app || cfg?.theme?.brandLogoUrl || "").trim());
          setPartnerBrandName(String(cfg?.name || cfg?.displayName || "").trim());
          setIsPartnerBrandLoading(false);
        }
      } catch {
        if (!cancelled) setIsPartnerBrandLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [containerType, containerBrandKey]);

  // Detect container type from state or HTML attribute set in RootLayout
  const containerTypeAttr = (typeof document !== "undefined"
    ? (document.documentElement.getAttribute("data-pp-container-type") || "").toLowerCase()
    : "");
  const isPartnerContainer = containerType.toLowerCase() === "partner" || containerTypeAttr === "partner";

  // Effective values: partner assets take precedence for partner containers
  const effectiveLogoSymbol = (isPartnerContainer && partnerLogoSymbol) ? partnerLogoSymbol : (theme?.symbolLogoUrl || "");
  const effectiveLogoFavicon = (isPartnerContainer && partnerLogoFavicon) ? partnerLogoFavicon : (theme?.brandFaviconUrl || "");
  const effectiveLogoApp = (isPartnerContainer && partnerLogoApp) ? partnerLogoApp : (theme?.brandLogoUrl || "");

  // Use transparent placeholder while loading partner brand data to prevent wrong logo flash
  const footerIcon = (() => {
    if (isPartnerBrandLoading && isPartnerContainer) {
      return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
    // Partner-fetched logos take absolute priority in partner containers
    // Don't let theme context or brand context values override them
    if (isPartnerContainer) {
      const pSym = partnerLogoSymbol.trim();
      const pFav = partnerLogoFavicon.trim();
      const pApp = partnerLogoApp.trim();
      if (pSym) return pSym;
      if (pFav) return pFav;
      if (pApp) return pApp;
      // If partner fetch completed but returned no logos, use fallback
      // DO NOT fall through to theme/brand context as they may be platform defaults
      return getDefaultBrandSymbol(containerBrandKey);
    }
    // For platform container, use the standard cascade
    const sym = effectiveLogoSymbol.trim();
    const fav = effectiveLogoFavicon.trim();
    const app = effectiveLogoApp.trim();
    const rawIcon = (
      (theme as any)?.logos?.footer ||
      sym ||
      fav ||
      app ||
      brand.logos.footer ||
      brand.logos.symbol ||
      brand.logos.app ||
      getDefaultBrandSymbol(containerBrandKey || (brand as any)?.key)
    );
    return resolveBrandSymbol(rawIcon, containerBrandKey || (brand as any)?.key);
  })();

  // Brand name fallback: prefer partner brand name for partner containers
  const effectiveBrandNameFromPartner = (isPartnerContainer && partnerBrandName) ? partnerBrandName : "";
  const rawFooterName =
    (effectiveBrandNameFromPartner) ||
    (typeof theme?.brandName === "string" && theme.brandName.trim()
      ? theme.brandName.trim()
      : brand.name);
  const isGenericFooterName =
    /^ledger\d*$/i.test(String(rawFooterName || "")) ||
    /^partner\d*$/i.test(String(rawFooterName || "")) ||
    /^default$/i.test(String(rawFooterName || "")) ||
    // Treat 'PortalPay' as generic in partner containers so we fall back to titleized brand key
    (isPartnerContainer && /^portalpay$/i.test(String(rawFooterName || "")));
  const titleizedKey = (() => {
    // Prefer container brand key over static brand key
    const k = String(containerBrandKey || (brand as any)?.key || "").trim();
    return k ? k.charAt(0).toUpperCase() + k.slice(1) : "PortalPay";
  })();
  const footerName = (!rawFooterName || isGenericFooterName) ? titleizedKey : rawFooterName;

  return (
    <footer className="mt-10 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={footerIcon}
          alt={`${footerName} symbol`}
          className="h-6 w-6 rounded-sm object-contain"
        />
        <span className="microtext text-muted-foreground">
          © {new Date().getFullYear()} {footerName}. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
