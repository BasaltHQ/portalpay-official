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

        const style = document.createElement("style");
        style.id = "vp550-legacy-styles";
        style.innerHTML = `
          /* =======================================================
             VP550 / Android Terminal Specific Layout Overrides
             These run ONLY on legacy endpoints like the Valor VP550
          ======================================================= */

          /* 1. Global Backgrounds & Transparency Fallbacks */
          /* Chrome 70 fails severely on backdrop-filter and color-mix */
          body::before, .glass-pane, .glass-backdrop, .tw-modal {
            background: rgba(10, 10, 10, 0.92) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          .global-gradient-layer div {
            background: linear-gradient(135deg, #064e3b 0%, #000000 100%) !important;
            filter: none !important;
          }

          /* 2. Fix the "Giant Logo" issue */
          /* Forced strict dimensions for logos that use Next.js 'fill' which breaks in old Chrome */
          nav img, [class*="Logo"] img, .group img {
            max-height: 40px !important;
            width: auto !important;
            position: relative !important;
            object-fit: contain !important;
          }

          /* Specifically target the giant X logo (Basalt logo) */
          img[src*="Surge"], img[src*="Basalt"] {
            max-height: 48px !important;
            width: auto !important;
          }

          /* 3. ThirdWeb Modal Text Contrast */
          .tw-modal, .tw-connect, div[role="dialog"][class*="tw-"] {
            --tw-color-text: #ffffff !important;
            --tw-color-primary-text: #ffffff !important;
            --tw-color-secondary-text: #d1d5db !important;
          }

          .tw-modal *, .tw-connect * {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
          }

          /* 4. Fix Button Spacings */
          button {
            border-radius: 8px !important;
          }

          .tw-connect-wallet--modal-overlay > div,
          .tw-modal > div:first-child {
            margin-bottom: 24px !important;
          }

          /* 5. Icon Scaling (Lucide SVGs) */
          svg {
            max-width: 24px !important;
            max-height: 24px !important;
          }

          /* Section-specific fixes for Touchpoint Setup */
          h1 {
            font-size: 1.25rem !important;
            line-height: 1.5rem !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return null;
}
