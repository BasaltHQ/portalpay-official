"use client";

import Link from "next/link";
import React from "react";
import { 
  Volume2, 
  VolumeX, 
  DollarSign, 
  Palette, 
  Zap, 
  BarChart3,
  CheckCircle2
} from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import GeometricAnimation from "@/components/landing/GeometricAnimation";
import { cachedFetch } from "@/lib/client-api-cache";

export default function GetStartedPage() {
  const brand = useBrand();
  const { theme: siteTheme } = useTheme();
  const [isMuted, setIsMuted] = React.useState(true);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [containerBrandKey, setContainerBrandKey] = React.useState<string>("");
  const [containerType, setContainerType] = React.useState<string>("");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);

  // Fetch container identity to get brandKey for partner containers
  React.useEffect(() => {
    let cancelled = false;
    cachedFetch("/api/site/container", { cache: "no-store" })
      .then((ci: any) => {
        if (cancelled) return;
        setContainerBrandKey(String(ci?.brandKey || "").trim());
        setContainerType(String(ci?.containerType || "").trim());
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Detect partner container
  const isPartnerContainer = React.useMemo(() => {
    const ctFromState = containerType.toLowerCase();
    const ctFromAttr = typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-pp-container-type") || "").toLowerCase()
      : "";
    return ctFromState === "partner" || ctFromAttr === "partner";
  }, [containerType]);

  // Compute display brand name (avoids showing "PortalPay" on partner containers)
  const displayBrandName = React.useMemo(() => {
    try {
      const raw = String(siteTheme?.brandName || "").trim();
      const generic = /^ledger\d*$/i.test(raw) || /^partner\d*$/i.test(raw) || /^default$/i.test(raw);
      // In partner containers, also treat "PortalPay" as generic to force using the brand key
      const treatAsGeneric = generic || (isPartnerContainer && /^portalpay$/i.test(raw));
      // Prefer container brand key over context brand key
      const key = containerBrandKey || String((brand as any)?.key || "").trim();
      const titleizedKey = key ? key.charAt(0).toUpperCase() + key.slice(1) : "PortalPay";
      return (!raw || treatAsGeneric) ? titleizedKey : raw;
    } catch {
      const key = containerBrandKey || String((brand as any)?.key || "").trim();
      return key ? key.charAt(0).toUpperCase() + key.slice(1) : "PortalPay";
    }
  }, [siteTheme?.brandName, containerBrandKey, (brand as any)?.key, isPartnerContainer]);

  const toggleMute = async () => {
    if (!videoRef.current) return;
    
    try {
      const newMutedState = !isMuted;
      
      // Set volume to full when unmuting
      if (!newMutedState) {
        videoRef.current.volume = 1.0;
      }
      
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // Ensure video is playing
      if (videoRef.current.paused) {
        await videoRef.current.play();
      }
      
      console.log('Video muted:', newMutedState, 'Volume:', videoRef.current.volume);
    } catch (error) {
      console.error('Toggle mute failed:', error);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      
      const heroHeight = heroRef.current.offsetHeight;
      const scrollY = window.scrollY;
      
      // Calculate progress as a value from 0 to 1 based on scroll through hero section
      const progress = Math.min(scrollY / (heroHeight * 0.75), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate different animation stages based on scroll progress
  // Stage 1 (0-0.2): Fade in hero content
  const contentOpacity = Math.min(scrollProgress / 0.2, 1);
  
  // Stage 2 (0.2-0.5): Scale up content slightly
  const contentScale = 1 + (Math.min(Math.max(scrollProgress - 0.2, 0) / 0.3, 1) * 0.15);
  
  // Stage 3 (0.5-0.8): Fade out content
  const contentFadeOut = 1 - Math.min(Math.max(scrollProgress - 0.5, 0) / 0.3, 1);
  
  // Stage 4 (0-1): Increase blur gradually throughout
  const blurAmount = scrollProgress * 20;
  
  // Overlay darkness increases with scroll
  const overlayOpacity = scrollProgress * 0.7;

  return (
    <div className="min-h-screen">
      {/* Fixed Background - Video or Geometric Animation based on container type */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden z-0">
        {isPartnerContainer ? (
          /* Geometric Animation for partner containers */
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              filter: `blur(${blurAmount}px)`,
              transform: `scale(${1 + scrollProgress * 0.1})`,
            }}
          >
            <GeometricAnimation className="w-full h-full" />
          </div>
        ) : (
          /* Video Background for platform container */
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
            style={{
              filter: `blur(${blurAmount}px)`,
              transform: `scale(${1 + scrollProgress * 0.1})`,
            }}
          >
            <source
              src="https://engram1.blob.core.windows.net/portalpay/Videos/PortalPay25LQ.mp4"
              type="video/mp4"
            />
          </video>
        )}

        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: overlayOpacity }}
        />
      </div>

      {/* Audio Control - Bottom Right - Only show for video (non-partner containers) */}
      {!isPartnerContainer && (
        <button
          onClick={toggleMute}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>
      )}

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative h-[200vh] w-full -mt-20"
      >
        {/* Hero Content */}
        <div 
          className="fixed top-0 left-0 w-full h-screen flex flex-col items-center justify-center text-center px-4 transition-all duration-300 z-10"
          style={{
            opacity: contentOpacity * contentFadeOut,
            transform: `scale(${contentScale})`,
          }}
        >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(() => {
                  // Prefer platform/container symbol, then app logo; never use favicon
                  const symbol = String((brand.logos?.symbol || "")).trim();
                  const app = String((brand.logos?.app || "")).trim();
                  if (symbol) return symbol;
                  if (app) return app;
                  // Fallback to platform symbol asset
                  return "/ppsymbol.png";
                })()}
                alt={`${brand.name} Logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white max-w-4xl">
              Accept crypto at the point of sale
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl leading-relaxed">
              Scan. Pay. Settled. Give customers a secure web3‑native checkout and get instant,
              programmable settlement in stablecoins or tokens.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/admin"
                className="px-8 py-4 text-lg rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity shadow-xl"
              >
                Start accepting crypto
              </Link>
              <Link
                href="/terminal"
                className="px-8 py-4 text-lg rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                Try the portal
              </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10 bg-background">
        <div className="max-w-6xl mx-auto px-6 py-20">
          {/* Core Value Props */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why {displayBrandName}?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Modern payment infrastructure designed for the web3 era
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="glass-pane rounded-xl border p-8 text-center hover:border-[var(--primary)]/50 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Lower Fees</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Avoid legacy card rails and reduce foreign exchange friction
                </p>
              </div>

              <div className="glass-pane rounded-xl border p-8 text-center hover:border-[var(--primary)]/50 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Brand Control</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  White‑label portal with your colors, logo, and receipt backdrop
                </p>
              </div>

              <div className="glass-pane rounded-xl border p-8 text-center hover:border-[var(--primary)]/50 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Settlement</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real‑time on‑chain settlement with programmable splits
                </p>
              </div>

              <div className="glass-pane rounded-xl border p-8 text-center hover:border-[var(--primary)]/50 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real‑Time Analytics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track transactions, USD volume, and trends as they happen
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Four simple steps to start accepting crypto payments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-pane rounded-xl border p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Configure</h3>
                <p className="text-sm text-muted-foreground">
                  Set your brand, colors, logo, reserve wallet, and token ratios in the admin panel
                </p>
              </div>

              <div className="glass-pane rounded-xl border p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Generate</h3>
                <p className="text-sm text-muted-foreground">
                  Create receipt IDs and print QR codes from your POS system
                </p>
              </div>

              <div className="glass-pane rounded-xl border p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Scan & Pay</h3>
                <p className="text-sm text-muted-foreground">
                  Customers scan the QR code, connect their wallet, and complete payment
                </p>
              </div>

              <div className="glass-pane rounded-xl border p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-lg mb-4">
                  4
                </div>
                <h3 className="text-lg font-semibold mb-2">Reconcile</h3>
                <p className="text-sm text-muted-foreground">
                  Transactions post to your dashboard with real‑time analytics and insights
                </p>
              </div>
            </div>
          </section>

          {/* Feature Deep Dive */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need for modern crypto commerce
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-pane rounded-xl border p-8">
                <h3 className="text-2xl font-semibold mb-3">QR Code Payments</h3>
                <p className="text-muted-foreground mb-4">
                  Print QR codes on POS receipts. Customers scan and pay on mobile with their
                  preferred wallet. No hardware changes needed.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Works with existing receipt printers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Mobile-first customer experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>No additional hardware required</span>
                  </li>
                </ul>
              </div>

              <div className="glass-pane rounded-xl border p-8">
                <h3 className="text-2xl font-semibold mb-3">Multi‑Token Support</h3>
                <p className="text-muted-foreground mb-4">
                  Accept multiple cryptocurrencies and stablecoins. Customers pay with their
                  preferred token on Base network.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>USDC & USDT stablecoins</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>cbBTC, cbXRP, and ETH</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Base network for fast, low-cost transactions</span>
                  </li>
                </ul>
              </div>

              <div className="glass-pane rounded-xl border p-8">
                <h3 className="text-2xl font-semibold mb-3">White‑Label Branding</h3>
                <p className="text-muted-foreground mb-4">
                  Customize every aspect of the payment portal to match your brand identity. Your
                  customers see your brand, not ours.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Custom logo and colors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Custom fonts and receipt backgrounds</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Fully branded checkout experience</span>
                  </li>
                </ul>
              </div>

              <div className="glass-pane rounded-xl border p-8">
                <h3 className="text-2xl font-semibold mb-3">Reserve & Revenue Splits</h3>
                <p className="text-muted-foreground mb-4">
                  Configure your token mix and automatically split revenue between multiple wallets.
                  Perfect for partnerships and revenue sharing.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Smart token rotation and balancing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>On‑chain revenue splits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Configurable reserve ratios</span>
                  </li>
                </ul>
              </div>

              <div className="glass-pane rounded-xl border p-8">
                <h3 className="text-2xl font-semibold mb-3">Real‑Time Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Track every transaction with detailed insights. Monitor USD volume, trends, and
                  customer behavior in real time.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Live transaction dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>USD volume tracking and reporting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Customer and transaction insights</span>
                  </li>
                </ul>
              </div>

              <div className="glass-pane rounded-xl border p-8">
                <h3 className="text-2xl font-semibold mb-3">Web3‑Native Security</h3>
                <p className="text-muted-foreground mb-4">
                  Secure wallet connect with account abstraction and gas sponsorship. Your customers
                  don't need to worry about gas fees.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Secure wallet connection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>Gas sponsorship for seamless UX</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <span>On‑chain settlement verification</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <div className="glass-pane rounded-2xl border p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start accepting crypto payments in minutes. No complex setup, no hidden fees.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/admin"
                  className="px-8 py-4 text-lg rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                >
                  Open Admin Panel
                </Link>
                <Link
                  href="/terminal"
                  className="px-8 py-4 text-lg rounded-lg border hover:bg-accent transition-colors"
                >
                  View Portal
                </Link>
                <Link
                  href="/"
                  className="px-8 py-4 text-lg rounded-lg border hover:bg-accent transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
