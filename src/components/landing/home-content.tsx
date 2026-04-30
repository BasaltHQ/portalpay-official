"use client";

import Link from "next/link";
import { SignupButton } from "@/components/landing/SignupButton";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Globe, CreditCard } from "lucide-react";
import { buildPortalUrlForTest } from "@/lib/receipts";
import { getRecipientAddress } from "@/lib/thirdweb/client";
import { PortalPreviewEmbedded } from "@/components/portal-preview-embedded";
import InteractiveChecklist from "@/components/ui/interactive-checklist";
import { useActiveAccount } from "thirdweb/react";
import { useTheme } from "@/contexts/ThemeContext";
import AcceptedServices from "@/components/landing/AcceptedServices";
import TechnologyPartners from "@/components/landing/TechnologyPartners";
import SiteFooter from "@/components/landing/SiteFooter";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandSymbol, resolveBrandAppLogo, getEffectiveBrandKey } from "@/lib/branding";

import { cachedFetch } from "@/lib/client-api-cache";
import RebrandingHero from "@/components/landing/RebrandingHero";
import { ExitIntentModal } from "@/components/landing/ExitIntentModal";
import PluginsSection from "@/components/landing/PluginsSection";
import TrustlessPermissionlessSection from "@/components/landing/TrustlessPermissionlessSection";
import { AgenticPaymentsSection } from "@/components/landing/AgenticPaymentsSection";
import ContactFormSection from "@/components/landing/ContactFormSection";
import IndustryTouchpointsSection from "@/components/landing/IndustryTouchpointsSection";

type Metrics = {
  totalUsers: number;
  totalSeconds: number;
  totalSecondsAllTime?: number;
  totalSummarizedSecondsAllTime?: number;
  activeNowCount?: number;
  totalLiveSecondsNow?: number;
  topDomain: string;
  topLanguage: string;
  topPlatform?: string;
  topTopic?: string;
  sessionsCount?: number;
  averageSeconds?: number;
  sessionsCount24h?: number;
  averageSeconds24h?: number;
  xpTotal?: number;
  purchasedSecondsTotal?: number;
  p50Seconds7d?: number;
  p95Seconds7d?: number;
  receiptsCount?: number;
  receiptsTotalUsd?: number;
  receiptsCount24h?: number;
  receiptsTotalUsd24h?: number;
  averageReceiptUsd?: number;
  merchantsCount?: number;
  topCurrency?: string;
  merchantEarnedUsdTotal?: number;
};

type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  brandLogoUrl: string;
  brandFaviconUrl: string;
  brandName: string;
  fontFamily: string;
  receiptBackgroundUrl: string;
  brandLogoShape?: "round" | "square" | "unmasked";
  textColor?: string;
  headerTextColor?: string;
  bodyTextColor?: string;
  symbolLogoUrl?: string;
  brandKey?: string;
  navbarMode?: "symbol" | "logo";
};

type SiteConfigResponse = {
  config?: {
    theme?: Partial<SiteTheme>;
  };
  degraded?: boolean;
  reason?: string;
};

type DemoReceipt = {
  lineItems: { label: string; priceUsd: number; qty?: number }[];
  totalUsd: number;
} | null;

function fmtUSD(n?: number): string {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "—";
  return `$${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function HomeContent() {
  const [story, setStory] = React.useState("");
  const [storyHtml, setStoryHtml] = React.useState("");
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [containerBrandKey, setContainerBrandKey] = React.useState<string>("");
  const [containerType, setContainerType] = React.useState<string>("");
  const account = useActiveAccount();
  const brand = useBrand();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAdminClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.authed) {
        router.push("/admin");
        return;
      }
    } catch { }

    const onLogin = () => {
      router.push("/admin");
      window.removeEventListener("pp:auth:logged_in", onLogin as any);
    };
    window.addEventListener("pp:auth:logged_in", onLogin as any);
    window.dispatchEvent(new CustomEvent("pp:auth:prompt"));
  };

  const { theme: rawTheme } = useTheme();

  // CRITICAL: When logged out on BasaltSurge (PLATFORM ONLY), use static defaults for Live Preview
  // BUT: Never do this in Partner containers - they should always show their own branding
  const siteTheme = React.useMemo(() => {
    const t = rawTheme;

    // Read DOM attributes directly for most reliable partner detection
    const domContainerType = typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-pp-container-type') || '').toLowerCase()
      : '';
    const domBrandKey = typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-pp-brand-key') || '').toLowerCase()
      : '';

    // Detect partner container from DOM attribute (most reliable) OR from environment/context
    // This ensures partner detection works even during initial render before DOM is fully hydrated
    const envContainerType = (typeof window !== 'undefined' && (window as any).__PP_CONTAINER_TYPE) || '';
    const envBrandKey = (typeof window !== 'undefined' && (window as any).__PP_BRAND_KEY) || '';
    const brandKeyFromContext = ((brand as any)?.key || '').toLowerCase();

    // Partner detection: DOM attribute OR non-platform brand key from context/env
    const isPartnerFromDOM = domContainerType === 'partner';
    const isPartnerFromBrand = brandKeyFromContext &&
      brandKeyFromContext !== 'portalpay' &&
      brandKeyFromContext !== 'basaltsurge';
    const isPartner = isPartnerFromDOM || isPartnerFromBrand;

    // Use DOM brand key first, then context
    const effectiveBrandKey = (domBrandKey || brandKeyFromContext || t.brandKey || getEffectiveBrandKey()).toLowerCase();
    const isBasalt = effectiveBrandKey === "basaltsurge" || effectiveBrandKey === "portalpay";
    const isLoggedIn = Boolean(account?.address);

    // Only force BasaltSurge on PLATFORM, never for partners
    if (isBasalt && !isLoggedIn && !isPartner) {
      return {
        ...t,
        brandLogoUrl: "/BasaltSurgeWideD.png",
        brandFaviconUrl: t.brandFaviconUrl || "/favicon-32x32.png",
        symbolLogoUrl: "/BasaltSurgeD.png",
        brandName: "BasaltSurge",
        brandKey: "basaltsurge",
        navbarMode: "logo" as const,
      };
    }

    // For partners, SANITIZE: strip any BasaltSurge logos that leaked through from rawTheme
    if (isPartner) {
      const sanitizeLogo = (logo: string | undefined) => {
        if (!logo) return logo;
        if (logo.startsWith('http')) return logo;
        const s = String(logo).toLowerCase();
        
        const filename = s.split('/').pop()?.split('?')[0] || '';
        const isPlatformAsset =
          filename === 'basaltsurge.png' ||
          filename === 'basaltsurgewided.png' ||
          filename === 'basaltsurged.png' ||
          filename === 'bssymbol.png' ||
          filename === 'bswide.png' ||
          filename === 'ppsymbol.png' ||
          filename === 'cblogod.png';

        if (isPlatformAsset) {
          return (brand as any)?.logos?.app || (brand as any)?.logos?.symbol || '/api/favicon'; // Use partner logo instead
        }
        return logo;
      };
      return {
        ...t,
        brandLogoUrl: sanitizeLogo(t.brandLogoUrl),
        symbolLogoUrl: sanitizeLogo(t.symbolLogoUrl),
      };
    }

    return t;
  }, [rawTheme, (brand as any)?.key, account?.address]);

  // Fetch container identity to get brandKey for partner containers
  React.useEffect(() => {
    let cancelled = false;
    cachedFetch("/api/site/container", { cache: "no-store" })
      .then((ci: any) => {
        if (cancelled) return;
        setContainerBrandKey(String(ci?.brandKey || "").trim());
        setContainerType(String(ci?.containerType || "").trim());
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Detect if this is a partner container
  const isPartnerContainer = React.useMemo(() => {
    const ctFromState = containerType.toLowerCase();
    const ctFromAttr = typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-pp-container-type") || "").toLowerCase()
      : "";
    return ctFromState === "partner" || ctFromAttr === "partner";
  }, [containerType]);

  const displayBrandName = React.useMemo(() => {
    try {
      const raw = String(siteTheme?.brandName || "").trim();
      const generic = /^ledger\d*$/i.test(raw) || /^partner\d*$/i.test(raw) || /^default$/i.test(raw);
      // In partner containers, also treat "PortalPay" as generic to force using the brand key
      const treatAsGeneric = generic || (isPartnerContainer && /^portalpay$/i.test(raw));
      // Prefer container brand key over context brand key
      const key = containerBrandKey || String((brand as any)?.key || "").trim();
      const titleizedKey = key ? key.charAt(0).toUpperCase() + key.slice(1) : "BasaltSurge";
      return (!raw || treatAsGeneric) ? titleizedKey : raw;
    } catch {
      const key = containerBrandKey || String((brand as any)?.key || "").trim();
      return key ? key.charAt(0).toUpperCase() + key.slice(1) : "BasaltSurge";
    }
  }, [siteTheme?.brandName, containerBrandKey, (brand as any)?.key, isPartnerContainer]);

  React.useEffect(() => {
    const headers: Record<string, string> = {};
    const w = (account?.address || "").toLowerCase();
    if (w) headers["x-wallet"] = w;
    fetch("/api/site/config", { cache: "no-store", headers })
      .then((r) => r.json())
      .then((j: SiteConfigResponse & any) => {
        try {
          setStory(String(j?.config?.story || ""));
          setStoryHtml(String(j?.config?.storyHtml || ""));
        } catch { }
      })
      .catch(() => { });
    fetch("/api/site/metrics")
      .then((r) => r.json())
      .then((j) => setMetrics(j?.metrics || null))
      .catch(() => { });
  }, [account?.address]);

  React.useEffect(() => {
    const loginParam = searchParams.get("login");
    if (loginParam === "admin") {
      fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (data?.authed) {
            router.push("/admin");
          } else {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("login");
            window.history.replaceState({}, "", newUrl.toString());

            const onLogin = () => {
              router.push("/admin");
              window.removeEventListener("pp:auth:logged_in", onLogin as any);
            };
            window.addEventListener("pp:auth:logged_in", onLogin as any);
            window.dispatchEvent(new CustomEvent("pp:auth:prompt"));
          }
        })
        .catch(() => {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("login");
          window.history.replaceState({}, "", newUrl.toString());
          window.dispatchEvent(new CustomEvent("pp:auth:prompt"));
        });
    }
  }, [searchParams, router]);

  const previewStyle = React.useMemo(() => {
    return {
      ["--pp-primary" as any]: siteTheme.primaryColor,
      ["--pp-secondary" as any]: siteTheme.secondaryColor,
      ["--pp-text" as any]: siteTheme.headerTextColor || siteTheme.textColor || "#ffffff",
      ["--pp-text-header" as any]:
        siteTheme.headerTextColor || siteTheme.textColor || "#ffffff",
      ["--pp-text-body" as any]: siteTheme.bodyTextColor || "#e5e7eb",
      fontFamily: siteTheme.fontFamily,
      backgroundImage: siteTheme.receiptBackgroundUrl
        ? `url(${siteTheme.receiptBackgroundUrl})`
        : "none",
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as React.CSSProperties;
  }, [siteTheme]);

  const demoReceipts: DemoReceipt[] = React.useMemo(
    () => [
      {
        lineItems: [
          { label: "Chicken Bowl", priceUsd: 10.99 },
          { label: "Tax", priceUsd: 1.0 },
        ],
        totalUsd: 11.99,
      },
      {
        lineItems: [
          { label: "Cappuccino", priceUsd: 4.50 },
          { label: "Tax", priceUsd: 0.40 },
        ],
        totalUsd: 4.90,
      },
      {
        lineItems: [
          { label: "Yoga Class", priceUsd: 22.00 },
          { label: "Tax", priceUsd: 2.00 },
        ],
        totalUsd: 24.00,
      },
      {
        lineItems: [
          { label: "Haircut & Style", priceUsd: 45.00 },
          { label: "Tax", priceUsd: 4.05 },
        ],
        totalUsd: 49.05,
      },
      {
        lineItems: [
          { label: "Concert Ticket", priceUsd: 85.00 },
          { label: "Tax", priceUsd: 7.65 },
        ],
        totalUsd: 92.65,
      },
      {
        lineItems: [
          { label: "Handcrafted Soap", priceUsd: 12.00 },
          { label: "Tax", priceUsd: 1.08 },
        ],
        totalUsd: 13.08,
      },
      {
        lineItems: [
          { label: "Pizza Margherita", priceUsd: 16.00 },
          { label: "Tax", priceUsd: 1.44 },
        ],
        totalUsd: 17.44,
      },
      {
        lineItems: [
          { label: "Car Wash", priceUsd: 28.00 },
          { label: "Tax", priceUsd: 2.52 },
        ],
        totalUsd: 30.52,
      },
      {
        lineItems: [
          { label: "Massage (60 min)", priceUsd: 75.00 },
          { label: "Tax", priceUsd: 6.75 },
        ],
        totalUsd: 81.75,
      },
      {
        lineItems: [
          { label: "Art Print", priceUsd: 35.00 },
          { label: "Tax", priceUsd: 3.15 },
        ],
        totalUsd: 38.15,
      },
    ],
    []
  );

  const [receiptIndex, setReceiptIndex] = React.useState(0);
  const demoReceipt = demoReceipts[receiptIndex];

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setReceiptIndex((prev) => (prev + 1) % demoReceipts.length);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [demoReceipts.length]);

  const recipient = getRecipientAddress();

  return (
    <div className="min-h-screen">

      {/* Stripe-style Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-24 overflow-hidden border-b border-white/5">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {/* Gradient to ensure text readability on the left, fading out to reveal the video */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
          {/* Subtle bottom gradient to blend with the next section */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent z-10" />
          
          {!isPartnerContainer && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            >
              <source src="/SurgeHeader.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col"
            >
              <div className="mb-8">
                <Link href="/" className="block" aria-label={`${brand.name} Home`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveBrandAppLogo(brand.logos?.symbol || brand.logos?.app, (brand as any)?.key)}
                    alt={`${brand.name} Logo`}
                    className="h-14 w-auto max-w-[300px] object-contain"
                  />
                </Link>
              </div>

              {!isPartnerContainer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-pp-secondary w-fit mb-6 shadow-xl"
                >
                  <span className="flex h-2 w-2 rounded-full bg-pp-secondary animate-pulse" />
                  BasaltSurge Network is Live
                </motion.div>
              )}

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-[1.05]">
                Global payments, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                  instantly settled.
                </span>
              </h1>

              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                Scan. Pay. Settled. Give customers a frictionless checkout experience and get instant,
                borderless settlement—wrapped in your brand, with zero chargebacks, built-in analytics, and programmable revenue routing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <SignupButton
                  variant="shiny"
                  className="group relative px-8 py-4 rounded-full bg-white text-black font-semibold text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center gap-2"
                >
                  Start accepting payments
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </SignupButton>
                <Link
                  href="/get-started"
                  className="px-8 py-4 rounded-full bg-white/5 border border-white/10 font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  Explore docs
                </Link>
              </div>

              {/* Supported chains/tokens mini ribbon */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                  <div className="flex items-center gap-2 font-bold text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-full w-fit">
                    <img src="/logos/base.png" className="w-5 h-5" alt="Base" />
                    Settlements on Base
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground max-w-sm leading-relaxed">
                    Accept payments across 95+ chains in 160 countries and over 17,000 tokens.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Floating Portal Preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="relative lg:ml-auto w-full max-w-[480px]"
            >
              {/* Decorative glows */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pp-secondary/30 to-blue-500/20 blur-3xl opacity-50 rounded-[2.5rem] pointer-events-none" />

              <div className="relative glass-pane rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden bg-background/40">
                <div className="bg-black/40 border-b border-white/10 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs text-white/40 font-mono flex-1 text-center pr-12">Live Preview</div>
                </div>

                <div className="p-4 md:p-6 pb-8">
                  <PortalPreviewEmbedded
                    key={`${siteTheme.brandLogoUrl}-${siteTheme.primaryColor}`}
                    theme={siteTheme}
                    demoReceipt={demoReceipt}
                    recipient={recipient as any}
                    className="mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/5"
                    style={{
                      ...previewStyle,
                      maxHeight: "calc(100vh - 280px)",
                      minHeight: "500px",
                    }}
                  />
                  <div className="microtext text-white/40 text-center mt-4 font-mono">
                    Preview inherits your theme
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 w-full">
        {/* Social Proof: Stats */}
        <section className="mt-6">
          <div className="glass-pane rounded-xl border p-4 md:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div className="rounded-md border p-3 bg-background/60">
                <div className="microtext text-muted-foreground">Transactions (all‑time)</div>
                <div className="text-lg font-semibold">{metrics?.receiptsCount ?? "—"}</div>
              </div>

              <div className="rounded-md border p-3 bg-background/60">
                <div className="microtext text-muted-foreground">Vendor earnings</div>
                <div className="text-lg font-semibold text-pp-secondary">
                  {metrics ? fmtUSD(metrics.merchantEarnedUsdTotal) : "—"}
                </div>
              </div>
              <div className="rounded-md border p-3 bg-background/60">
                <div className="microtext text-muted-foreground">Avg receipt</div>
                <div className="text-lg font-semibold">
                  {metrics ? fmtUSD(metrics.averageReceiptUsd) : "—"}
                </div>
              </div>
              <div className="rounded-md border p-3 bg-background/60">
                <div className="microtext text-muted-foreground">Transactions (24h)</div>
                <div className="text-lg font-semibold">{metrics?.receiptsCount24h ?? "—"}</div>
              </div>
              <div className="rounded-md border p-3 bg-background/60">
                <div className="microtext text-muted-foreground">Volume (24h)</div>
                <div className="text-lg font-semibold">
                  {metrics ? fmtUSD(metrics.receiptsTotalUsd24h) : "—"}
                </div>
              </div>
              <div className="rounded-md border p-3 bg-background/60">
                <div className="microtext text-muted-foreground">Wallets connected</div>
                <div className="text-lg font-semibold">{metrics?.totalUsers ?? "—"}</div>
              </div>
            </div>
          </div>
        </section>

        <AcceptedServices />

        {/* Unified Platform Features - Bento Box */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pp-secondary/5 to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
            <div className="mb-16 max-w-3xl">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">A unified platform for modern commerce</h2>
              <p className="text-xl text-muted-foreground">Everything you need to accept global payments, route funds instantly, and manage your revenue without intermediaries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Box 1: Checkout */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 glass-pane rounded-[2rem] border border-white/10 p-8 md:p-10 relative overflow-hidden group shadow-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                  <CreditCard className="w-40 h-40 text-pp-secondary rotate-12 translate-x-8 -translate-y-8" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight">Frictionless Checkout</h3>
                  <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                    Print QR codes directly on POS receipts. Customers scan and pay instantly with zero friction—no manual entry, no hidden fees, and zero chargeback risk.
                  </p>
                </div>
              </motion.div>

              {/* Bento Box 2: Branding */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-pane rounded-[2rem] border border-white/10 p-8 md:p-10 relative overflow-hidden group shadow-xl"
              >
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">White-Label Experience</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Maintain complete control over the customer experience with fully customizable colors, logos, typography, and branded digital receipts.
                  </p>
                </div>
              </motion.div>

              {/* Bento Box 3: Analytics */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-pane rounded-[2rem] border border-white/10 p-8 md:p-10 relative overflow-hidden group shadow-xl"
              >
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">Real-Time Intelligence</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Monitor your business with precision. Track transactions, settlement volume, fee savings, and customer trends as they happen.
                  </p>
                </div>
              </motion.div>

              {/* Bento Box 4: Multi-token */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 glass-pane rounded-[2rem] border border-white/10 p-8 md:p-10 relative overflow-hidden group shadow-xl"
              >
                <div className="absolute bottom-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Globe className="w-40 h-40 text-pp-secondary translate-x-8 translate-y-8" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight">Programmable Revenue Routing</h3>
                  <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                    Accept payments globally and settle in the currency of your choice. Configure smart rotation, instant vendor payouts, and automated revenue splits without touching a bank.
                  </p>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-12 flex items-center justify-center">
              <SignupButton
                variant="shiny"
                className="group px-8 py-4 rounded-full bg-white text-black font-semibold text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-2"
              >
                Create your account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </SignupButton>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-6">
          <div className="glass-pane rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-3">How {displayBrandName} Works</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm list-decimal pl-5">
              <li>
                <div className="font-semibold">Configure</div>
                <div className="microtext text-muted-foreground">
                  Set brand, colors, logo, reserve wallet, and token ratios in Admin.
                </div>
              </li>
              <li>
                <div className="font-semibold">Generate</div>
                <div className="microtext text-muted-foreground">
                  Create receipt IDs and print QR codes from your POS.
                </div>
              </li>
              <li>
                <div className="font-semibold">Scan & Pay</div>
                <div className="microtext text-muted-foreground">
                  Customers scan the QR, connect wallet, and complete payment.
                </div>
              </li>
              <li>
                <div className="font-semibold">Reconcile</div>
                <div className="microtext text-muted-foreground">
                  Transactions post to your dashboard with real‑time analytics.
                </div>
              </li>
            </ol>
          </div>
        </section>



        <TechnologyPartners />
        {/* Get Started: Interactive Checklist */}
        <section className="mt-6 mb-12">
          <div className="glass-pane rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-3">Get Started</h2>
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              <div className="flex-1 w-full">
                <p className="text-sm text-muted-foreground mb-4">
                  Follow these steps to start accepting crypto in minutes.
                </p>
                <InteractiveChecklist
                  storageKey="landing:get-started"
                  title="Step-by-step Checklist"
                  steps={[
                    "Open Admin and connect your wallet",
                    "Set your brand, colors, logo, and font",
                    "Configure token acceptance and reserve ratios",
                    "Set tax defaults and (optionally) revenue splits",
                    "Generate a test receipt and scan it on your phone",
                    "Print QR codes or use the POS Terminal for live payments",
                    "Review Analytics to monitor volume and trends",
                  ]}
                />
              </div>
              <div className="w-full md:w-[280px] shrink-0 flex items-center justify-center">
                <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 w-full">
                  <h3 className="text-lg font-bold text-white mb-2">Ready to launch?</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Create your portal in seconds. No credit card required.
                  </p>
                  <SignupButton
                    variant="shiny"
                    className="block w-full text-center px-4 py-3 rounded-md bg-pp-secondary text-[var(--primary-foreground)] font-bold transition-all hover:opacity-90 shadow-lg hover:shadow-xl"
                  >
                    Sign Up Now
                  </SignupButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Plugins & Integrations */}
        <PluginsSection />

        {/* Industry Packs — Platform Only */}
        {!isPartnerContainer && <IndustryTouchpointsSection />}

        {/* Agentic Payments (x402) */}
        <AgenticPaymentsSection />

        {/* Philosophy: Trustless & Permissionless */}
        <TrustlessPermissionlessSection />

        {/* Merchant Onboarding Contact Form — Platform Only */}
        {!isPartnerContainer && (
          <section className="mt-8">
            <ContactFormSection />
          </section>
        )}

        {/* About / Story */}
        <section className="mt-8">
          <div className="glass-pane rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-2">About {displayBrandName}</h2>
            {storyHtml ? (
              <div
                className="prose prose-invert text-sm leading-relaxed story-body"
                dangerouslySetInnerHTML={{ __html: storyHtml }}
              />
            ) : story ? (
              <div className="story-body text-sm leading-relaxed">
                {story.split(/\n\s*\n+/).map((para, idx) => (
                  <p key={idx} className="mb-4 whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className="story-body text-sm leading-relaxed">
                <h3 className="text-lg font-semibold mb-2">The {displayBrandName} Story</h3>
                <p className="mb-4">
                  {displayBrandName} makes crypto-native payments practical at the point of sale. Customers
                  scan the QR code on their receipt and pay with stablecoins or tokens using a
                  secure checkout experience. Merchants get a white‑label experience with branding,
                  loyalty, and real‑time analytics.
                </p>
                <h4 className="font-semibold mt-2 mb-1">Transformative benefits for small businesses</h4>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Faster settlement with lower processing costs than legacy card rails.</li>
                  <li>
                    Local‑currency reconciliation via local merchant providers, minimizing FX spread
                    and fees.
                  </li>
                  <li>Programmable loyalty and receipts with optional account registration.</li>
                  <li>Flexible token acceptance with reserve management and smart rotation.</li>
                </ul>
                <h4 className="font-semibold mt-2 mb-1">Benefits for consumers</h4>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>
                    Pay with stablecoins (USDC, USDT) or tokens (cbBTC, cbXRP, ETH) directly from
                    your wallet.
                  </li>
                  <li>Transparent pricing and fewer foreign exchange fees when paying abroad.</li>
                  <li>Own your receipts history and unlock rewards across participating merchants.</li>
                </ul>
                <p className="mb-0">
                  By reconciling in local currency and settling via local merchant providers,
                  {displayBrandName} reduces foreign exchange friction while keeping payments simple, secure,
                  and fast.
                </p>
              </div>
            )}
          </div>
        </section>

        <SiteFooter />
      </div>

      {/* Exit-Intent Email Capture — Platform Only */}
      {!isPartnerContainer && <ExitIntentModal accentColor={siteTheme.secondaryColor} />}
    </div>
  );
}
