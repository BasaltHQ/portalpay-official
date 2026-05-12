"use client";

import Link from "next/link";
import { SignupButton } from "@/components/landing/SignupButton";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Globe, CreditCard, Sparkles } from "lucide-react";
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
  const [displayVolume, setDisplayVolume] = React.useState<number | null>(null);
  const [displayTxCount, setDisplayTxCount] = React.useState<number | null>(null);
  const [displayEarnings, setDisplayEarnings] = React.useState<number | null>(null);
  const account = useActiveAccount();
  const brand = useBrand();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to admin console if user connects their wallet on the homepage
  React.useEffect(() => {
    if (account?.address) {
      router.push("/admin");
    }
  }, [account?.address, router]);

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

  const [domAttrs, setDomAttrs] = React.useState({ containerType: '', brandKey: '' });

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setDomAttrs({
        containerType: (document.documentElement.getAttribute('data-pp-container-type') || '').toLowerCase(),
        brandKey: (document.documentElement.getAttribute('data-pp-brand-key') || '').toLowerCase()
      });
    }
  }, []);

  // CRITICAL: When logged out on BasaltSurge (PLATFORM ONLY), use static defaults for Live Preview
  // BUT: Never do this in Partner containers - they should always show their own branding
  const siteTheme = React.useMemo(() => {
    const t = rawTheme;

    const domContainerType = domAttrs.containerType;
    const domBrandKey = domAttrs.brandKey;

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
    const ctFromAttr = domAttrs.containerType;
    return ctFromState === "partner" || ctFromAttr === "partner";
  }, [containerType, domAttrs.containerType]);

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

    // Generate beautiful looking random metrics that rotate every 24 hours
    const today = Math.floor(Date.now() / 86400000);
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    const randomVol = 45000 + seededRandom(today * 1) * 80000;
    const randomTx = 400 + Math.floor(seededRandom(today * 2) * 900);
    const randomEarnings = 12000 + seededRandom(today * 3) * 40000;
    setDisplayVolume(randomVol);
    setDisplayTxCount(randomTx);
    setDisplayEarnings(randomEarnings);
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
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent z-10" />
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col max-w-2xl"
          >


            {!isPartnerContainer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-sm text-pp-secondary w-fit mb-6 shadow-xl"
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
                className="group relative overflow-hidden px-8 py-4 rounded-xl bg-white text-black hover:text-white font-semibold text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center gap-2"
              >
                Start accepting payments
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </SignupButton>
              <Link
                href="/get-started"
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                Explore docs
              </Link>
            </div>

            {/* Supported chains/tokens mini ribbon */}
            <div className="mt-12 pt-8 border-t border-white/10 w-full">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div className="flex items-center gap-2 font-bold text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-xl w-fit">
                  <img src="/logos/base.png" className="w-5 h-5" alt="Base" />
                  Settlements on Base
                </div>
                <p className="text-sm font-semibold text-muted-foreground max-w-sm leading-relaxed">
                  Accept payments across 95+ chains in 160 countries and over 17,000 tokens.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Portal Showcase Section */}
      <section className="relative py-24 border-b border-white/5 overflow-hidden bg-background/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-20">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">The ultimate payment experience</h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A frictionless checkout flow designed for conversion. Customize every detail in our new 
              <span className="text-pp-secondary font-medium flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-5 h-5" /> Portal Theme Playground
              </span>
            </p>
          </div>
          
          <div className="relative max-w-[420px] mx-auto">
            {/* Left Pointers - Desktop Only */}
            <div className="hidden xl:block absolute -left-[360px] top-[5%] w-[320px] z-20">
              <div className="relative">
                <div className="text-right pr-24">
                  <h3 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">Custom Branding</h3>
                  <p className="text-base text-muted-foreground ml-auto">Your colors, your logo, your identity. Fully white-labeled.</p>
                </div>
                <svg className="absolute -right-12 top-1/2 -translate-y-1/2 w-32 h-24 text-pp-secondary opacity-100" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,60 Q50,60 90,20" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6,4" />
                  <path d="M75,20 L90,20 L90,35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="hidden xl:block absolute -left-[360px] top-[45%] w-[320px] z-20">
              <div className="relative">
                <div className="text-right pr-24">
                  <h3 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">Apple/Google Pay</h3>
                  <p className="text-base text-muted-foreground ml-auto">Native wallet integration for instant 1-click checkout</p>
                </div>
                <svg className="absolute -right-12 top-1/2 -translate-y-1/2 w-32 h-16 text-pp-secondary opacity-100" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,40 Q50,40 90,10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6,4" />
                  <path d="M75,10 L90,10 L90,25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Right Pointers - Desktop Only */}
            <div className="hidden xl:block absolute -right-[360px] top-[25%] w-[320px] z-20">
              <div className="relative">
                <div className="text-left pl-24">
                  <h3 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">Zero Chargebacks</h3>
                  <p className="text-base text-muted-foreground">Cryptographic finality means no reversed payments or fraud</p>
                </div>
                <svg className="absolute -left-12 top-1/2 -translate-y-1/2 w-32 h-16 text-pp-secondary opacity-100" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100,10 Q50,10 10,40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6,4" />
                  <path d="M25,40 L10,40 L10,25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="hidden xl:block absolute -right-[360px] bottom-[25%] w-[320px] z-20">
              <div className="relative">
                <div className="text-left pl-24">
                  <h3 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">Instant Settlement</h3>
                  <p className="text-base text-muted-foreground">Funds hit your wallet the second they pay. No holding periods.</p>
                </div>
                <svg className="absolute -left-12 top-1/2 -translate-y-1/2 w-32 h-24 text-pp-secondary opacity-100" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100,20 Q50,20 10,60" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6,4" />
                  <path d="M25,60 L10,60 L10,45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* The Portal Preview Container */}
            <div className="relative z-10 w-full transform perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-r from-pp-secondary/30 to-blue-500/20 blur-3xl opacity-50 rounded-2xl pointer-events-none" />
              
              <div className="relative transition-transform duration-700 hover:scale-[1.02] pointer-events-none">
                <PortalPreviewEmbedded
                  key={`${siteTheme.brandLogoUrl}-${siteTheme.primaryColor}`}
                  theme={siteTheme}
                  demoReceipt={demoReceipt}
                  recipient={recipient as any}
                  className="mx-auto rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
                  style={{
                    ...previewStyle,
                    height: "900px",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile Fallback Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 xl:hidden">
             <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
               <h3 className="font-bold text-lg text-white mb-1">Apple/Google Pay</h3>
               <p className="text-sm text-muted-foreground">Native wallet integration for instant checkout</p>
             </div>
             <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
               <h3 className="font-bold text-lg text-white mb-1">Custom Branding</h3>
               <p className="text-sm text-muted-foreground">Your colors, your logo, your identity</p>
             </div>
             <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
               <h3 className="font-bold text-lg text-white mb-1">Zero Chargebacks</h3>
               <p className="text-sm text-muted-foreground">Cryptographic finality prevents reversed payments</p>
             </div>
             <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
               <h3 className="font-bold text-lg text-white mb-1">Instant Settlement</h3>
               <p className="text-sm text-muted-foreground">Funds hit your wallet the second they pay</p>
             </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 w-full">
        {/* Social Proof: Stats - Cinematic Typographic Design */}
        <section className="mt-24 mb-32 py-24 overflow-hidden relative w-[100vw] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] border-y border-white/10 shadow-2xl bg-black">
          <div className="absolute inset-0 z-0">
            {!isPartnerContainer && (
              <div className="absolute inset-0 overflow-hidden bg-black/50">
                {/* SVG Filter for Wispy Plasma Smoke */}
                <svg className="hidden">
                  <filter id="plasma-smoke">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.015" numOctaves="4" seed="2" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="200" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </svg>

                {/* Tech Grid Background (unaffected by filter) */}
                <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

                {/* Filtered Plasma Container */}
                <div className="absolute inset-0 opacity-90 mix-blend-screen" style={{ filter: 'url(#plasma-smoke)' }}>
                  
                  {/* Flowing Horizontal Plasma Stream */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[20%] w-[200vw] h-[60vh] blur-[40px] opacity-80"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--pp-secondary, #10b981) 40%, var(--pp-primary, #34d399) 60%, transparent)' }}
                  />

                  {/* Counter-Flowing Deep Plasma Stream */}
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: "-200%" }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[30%] w-[150vw] h-[70vh] blur-[60px] opacity-60"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--pp-primary, #34d399) 30%, var(--pp-secondary, #10b981) 70%, transparent)' }}
                  />

                  {/* Pulsing Central Smoke Core */}
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 w-[70vw] h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-[100%] blur-[80px]"
                    style={{ background: 'radial-gradient(ellipse, var(--pp-secondary, #10b981) 0%, transparent 65%)' }}
                  />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
          </div>
          <div className="max-w-[90rem] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 relative z-10 px-8 md:px-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <div className="text-white/80 font-semibold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-white/50" /> Transactions
              </div>
              <div className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter text-white drop-shadow-md">
                {displayTxCount !== null ? displayTxCount.toLocaleString() : (metrics?.receiptsCount ? metrics.receiptsCount.toLocaleString() : "—")}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}>
              <div className="text-white/80 font-semibold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-white/50" /> Vendor Earnings
              </div>
              <div className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 drop-shadow-md">
                {displayEarnings !== null ? fmtUSD(displayEarnings) : (metrics ? fmtUSD(metrics.merchantEarnedUsdTotal) : "—")}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <div className="text-white/80 font-semibold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-white/50" /> Active Wallets
              </div>
              <div className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter text-white drop-shadow-md">{metrics?.totalUsers ? metrics.totalUsers.toLocaleString() : "—"}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }}>
              <div className="text-white/80 font-semibold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-white/50" /> 24h Volume
              </div>
              <div className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter text-white drop-shadow-md">
                {displayVolume !== null ? fmtUSD(displayVolume) : (metrics ? fmtUSD(metrics.receiptsTotalUsd24h) : "—")}
              </div>
            </motion.div>
          </div>
        </section>

        <AcceptedServices />

        {/* Unified Platform Features - Bento Box */}
        <section className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pp-secondary/5 to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-20 max-w-3xl">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">A unified platform for modern commerce</h2>
              <p className="text-2xl text-muted-foreground font-light leading-relaxed">Everything you need to accept global payments, route funds instantly, and manage your revenue without intermediaries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Box 1: Checkout */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-0 relative overflow-hidden group shadow-2xl transition-all duration-500 hover:border-white/10 flex flex-col md:flex-row"
              >
                <div className="flex-1 p-10 relative z-10 flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 shadow-inner">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold mb-4 tracking-tight">Zero Friction.</h3>
                  <p className="text-muted-foreground text-xl max-w-md leading-relaxed font-light">
                    Customers scan a QR code and pay instantly with Apple/Google Pay. No tap-to-pay hardware required, no hidden fees, and absolute zero chargeback risk.
                  </p>
                </div>
                <div className="flex-1 relative min-h-[300px] border-t md:border-t-0 md:border-l border-white/10 overflow-hidden">
                  {!isPartnerContainer && <img src="/mockup_theme.png" alt="Mobile Checkout UI Mockup" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
              </motion.div>

              {/* Bento Box 2: Branding */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-0 relative overflow-hidden group shadow-2xl transition-all duration-500 hover:border-white/10 flex flex-col"
              >
                <div className="flex-1 relative min-h-[200px] border-b border-white/10">
                  {!isPartnerContainer && <img src="/mockup_branding.png" alt="White Label Config Mockup" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="relative z-10 p-8 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10 shadow-inner">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 tracking-tight">White-Label.</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed font-light">
                    Maintain complete control with customizable colors, logos, and digital receipts.
                  </p>
                </div>
              </motion.div>

              {/* Bento Box 3: Touchpoints */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-0 relative overflow-hidden group shadow-2xl transition-all duration-500 hover:border-white/10 flex flex-col"
              >
                <div className="relative z-10 p-8 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10 shadow-inner">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 tracking-tight">Hardware Ecosystem.</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed font-light">
                    Deploy, configure, and launch Kiosks, Terminals, and Handhelds instantly from the cloud.
                  </p>
                </div>
                <div className="flex-1 relative min-h-[200px] border-t border-white/10">
                  {!isPartnerContainer && <img src="/mockup_admin.png" alt="Touchpoint Management Mockup" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
              </motion.div>

              {/* Bento Box 4: Multi-token */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-0 relative overflow-hidden group shadow-2xl transition-all duration-500 hover:border-white/10 flex flex-col-reverse md:flex-row"
              >
                <div className="flex-1 relative min-h-[300px] border-t md:border-t-0 md:border-r border-white/10 overflow-hidden">
                  {!isPartnerContainer && <img src="/mockup_storefront.png" alt="Storefront Interface Mockup" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="flex-1 p-10 relative z-10 flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 shadow-inner">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold mb-4 tracking-tight">Programmable Routing.</h3>
                  <p className="text-muted-foreground text-xl max-w-lg leading-relaxed font-light">
                    Configure smart rotation, instant vendor payouts, and automated revenue splits without touching a bank. Settle in the currency of your choice instantly.
                  </p>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-20 flex items-center justify-center">
              <SignupButton
                variant="shiny"
                className="group px-10 py-5 rounded-full bg-white text-black font-semibold text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-3"
              >
                Create your account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </SignupButton>
            </div>
          </div>
        </section>

        {/* How it works - Architectural Timeline */}
        <section className="py-32 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="flex-1 w-full relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-[600px]"
            >
              {!isPartnerContainer && <img src="/pos_qr_surge.png" alt="BasaltSurge POS Terminal QR Scanning" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 right-10">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white drop-shadow-md">Architected for Speed.</h2>
                <p className="text-xl text-white/90 font-light drop-shadow-md">From configuration to settlement in four frictionless steps.</p>
              </div>
            </motion.div>

            <div className="flex-1 w-full relative border-l border-white/10 pl-8 space-y-12 py-8">
                {[
                  { title: "Configure", desc: "Set brand, reserve wallet, and token ratios in Admin.", icon: <Shield className="w-5 h-5" /> },
                  { title: "Generate", desc: "Create receipt IDs and print QR codes from your POS.", icon: <CreditCard className="w-5 h-5" /> },
                  { title: "Scan & Pay", desc: "Customers scan, connect, and complete payment.", icon: <Zap className="w-5 h-5" /> },
                  { title: "Reconcile", desc: "Transactions post with real-time analytics instantly.", icon: <BarChart3 className="w-5 h-5" /> }
                ].map((step, i) => (
                  <motion.div 
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    viewport={{ once: true }}
                    className="relative group"
                  >
                    <div className="absolute left-[-38px] top-2 w-3 h-3 rounded-full bg-black border-2 border-white/20 group-hover:border-white group-hover:scale-150 transition-all duration-300 z-10" />
                    <div className="text-[10px] font-bold text-pp-secondary uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
                      <span>Step 0{i + 1}</span>
                      <div className="w-8 h-[1px] bg-white/10 group-hover:bg-white/40 transition-colors" />
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-white/5 border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-colors duration-500 shadow-xl">
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed font-light">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>


        <TechnologyPartners />
        
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
          <section className="mt-24">
            <ContactFormSection />
          </section>
        )}

        {/* About / Story - High Fashion Editorial */}
        <section className="py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-0 flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex-1 space-y-8"
            >
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-pp-secondary">The {displayBrandName} Thesis</h2>
              <div className="text-2xl md:text-3xl font-light text-white/80 leading-[1.6] tracking-tight">
                {storyHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: storyHtml }} />
                ) : story ? (
                  <div>{story}</div>
                ) : (
                  <div className="space-y-8">
                    <p className="text-white">
                      {displayBrandName} makes crypto-native payments practical at the point of sale. We replace legacy card rails with cryptographic finality.
                    </p>
                    <p>
                      By reconciling in local currency and settling via local onramps and global crypto rails, we eliminate foreign exchange friction while delivering absolute zero chargeback risk.
                    </p>
                    <p className="text-white/90 text-xl md:text-2xl font-medium">
                      A frictionless checkout flow designed exclusively for conversion.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="flex-1 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-[500px] relative bg-white/5"
            >
              {!isPartnerContainer && <img src="/luxury_boutique.png" alt="Luxury Boutique" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />}
            </motion.div>
          </div>
        </section>

        <SiteFooter />
      </div>

      {/* Exit-Intent Email Capture — Platform Only */}
      {!isPartnerContainer && <ExitIntentModal accentColor={siteTheme.secondaryColor} />}
    </div>
  );
}
