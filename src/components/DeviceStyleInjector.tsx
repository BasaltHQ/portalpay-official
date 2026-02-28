"use client";

import { useEffect } from "react";

export function DeviceStyleInjector() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof document !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

      // Specifically target Android Chrome prior to version 80 (VP550 uses Chrome 70)
      const isAndroid = /Android/i.test(ua);
      const chromeMatch = ua.match(/Chrome\/([0-9]+)/i);
      const isOldChrome = chromeMatch && parseInt(chromeMatch[1], 10) < 80;

      // Only execute this strictly if on Android AND using legacy Chromium
      if (isAndroid && isOldChrome) {
        // Prevent duplicate injections
        if (document.getElementById("vp550-legacy-styles")) return;

        // 1. Load Flattened External Stylesheet
        const link = document.createElement("link");
        link.id = "vp550-legacy-link";
        link.rel = "stylesheet";
        link.href = "/css/legacy.css";
        document.head.appendChild(link);

        // 2. SES-safe Style Injection (Inline fallback)
        const style = document.createElement("style");
        style.id = "vp550-legacy-styles";
        const css = `
          /* VP550 Flattened Overrides */
          body::before, .glass-pane, .glass-backdrop, .tw-modal {
            background: rgba(10, 10, 10, 0.95) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .global-gradient-layer div {
            background: #052e16 !important; /* Static fallback for color-mix */
            filter: none !important;
          }
          /* Thirdweb contrast fixes */
          .tw-modal *, .tw-connect * {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          /* Hide things that break layout in Chrome 70 */
          .shield-gleam-container, .shield-gleam {
            display: none !important;
          }
        `;
        // Use createTextNode for better compatibility/safety in older engines
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);

        // 2. Direct DOM Manipulation (MutationObserver)
        // This ensures that even if CSS fails to parse due to @layers, 
        // critical layout elements (like the giant logo) are fixed by JS.
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

          // Fix Backgrounds (Direct style set)
          const panes = el.querySelectorAll('.glass-pane, .tw-modal');
          panes.forEach((p: any) => {
            p.style.background = 'rgba(10, 10, 10, 0.95)';
            p.style.backdropFilter = 'none';
          });
        };

        // Run initial fix
        fixLayout(document.body);

        // Observe future changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => fixLayout(node));
          });
        });

        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }, []);

  return null;
}
