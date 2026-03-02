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
    const isCapacitorAndroid = !!(window as any).Capacitor && (window as any).Capacitor.getPlatform?.() === 'android';
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

    // Prevent duplicate injections
    if (document.getElementById("vp550-legacy-styles")) return;

    console.log('[DeviceStyleInjector] Injecting legacy CSS for Chrome', chromeVersion);

    // 1. Load Flattened External Stylesheet (Chrome 93-compatible, no @layer/oklch)
    const link = document.createElement("link");
    link.id = "vp550-legacy-link";
    link.rel = "stylesheet";
    link.href = "/css/legacy.css";
    document.head.appendChild(link);

    // 2. SES-safe inline overrides for glass effects and backdrop-filter
    const style = document.createElement("style");
    style.id = "vp550-legacy-styles";
    const css = `
      /* VP550/Legacy Android Overrides */
      body::before, .glass-pane, .glass-backdrop, .tw-modal {
        background: rgba(10, 10, 10, 0.95) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .global-gradient-layer div {
        background: #052e16 !important;
        filter: none !important;
      }
      /* Thirdweb contrast fixes */
      .tw-modal *, .tw-connect * {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      /* Hide elements that break layout in older Chrome */
      .shield-gleam-container, .shield-gleam {
        display: none !important;
      }
    `;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);

    // 3. Direct DOM Manipulation (MutationObserver)
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
