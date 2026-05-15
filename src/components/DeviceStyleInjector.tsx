"use client";

import { useEffect } from "react";

export function DeviceStyleInjector() {
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof document === "undefined") return;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

    // ── Detection Strategy ──
    // The VP550 runs Android 6.0 with a WebView (Chrome 93) that does NOT support:
    //   - @layer (Chrome 99+)    → Tailwind v4 wraps ALL CSS in @layer
    //   - oklch() (Chrome 111+)  → Tailwind v4 color system
    //   - color-mix() (111+), individual translate/scale/rotate (104+)
    //
    // We detect legacy devices using TWO methods:
    //   1. Capacitor Android environment (most reliable for our app)
    //   2. Fallback: Android UA with Chrome < 99 (covers @layer support boundary)
    const cap = (window as any).Capacitor;
    const isCapacitorAndroid = !!cap && typeof cap.getPlatform === 'function' && cap.getPlatform() === 'android';
    const isAndroid = /Android/i.test(ua);
    const chromeMatch = ua.match(/Chrome\/([0-9]+)/i);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1], 10) : 0;
    const isPreLayerChrome = chromeVersion > 0 && chromeVersion < 99;

    // Trigger for: Capacitor Android app OR any Android Chrome < 99
    const needsLegacyCss = isCapacitorAndroid || (isAndroid && isPreLayerChrome);

    console.log('[DeviceStyleInjector] Detection:', {
      ua: ua.substring(0, 120),
      isCapacitorAndroid,
      isAndroid,
      chromeVersion,
      isPreLayerChrome,
      needsLegacyCss
    });

    if (!needsLegacyCss) return;

    // ── STEP 1 & 2: Legacy CSS injection and SES overrides are now handled ──
    // ── instantly by the beforeInteractive Script in layout.tsx to prevent ──
    // ── the 5-second unstyled flash and rendering crash. ──

    // ── STEP 3: Direct DOM Manipulation (MutationObserver) ──
    const fixLayout = (root: Node) => {
      const el = root as HTMLElement;
      if (!el.querySelectorAll) return;

      // Fix Logos
      const logos = el.querySelectorAll('nav img, [src*="Surge"], [src*="Basalt"], [class*="Logo"] img');
      logos.forEach((img: any) => {
        img.style.maxHeight = '42px';
        img.style.width = 'auto';
        img.style.position = 'relative';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
      });

      // Fix SVGs/Icons
      const svgs = el.querySelectorAll('svg');
      svgs.forEach((svg: any) => {
        svg.style.maxWidth = '24px';
        svg.style.maxHeight = '24px';
      });

      // Fix Backgrounds
      const panes = el.querySelectorAll('.glass-pane, .tw-modal');
      panes.forEach((p: any) => {
        p.style.background = 'rgba(10, 10, 10, 0.95)';
        p.style.backdropFilter = 'none';
      });
    };

    fixLayout(document.body);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => fixLayout(node));
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }, []);

  return null;
}
