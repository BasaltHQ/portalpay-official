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

          /* 1. ThirdWeb Modal Text Contrast & Background */
          .tw-modal, .tw-connect, div[role="dialog"][class*="tw-"] {
            --tw-color-text: #ffffff !important;
            --tw-color-primary-text: #ffffff !important;
            --tw-color-secondary-text: #e5e7eb !important;
          }

          .tw-modal *, .tw-connect * {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
          }

          /* 2. Fix the "Pay" button spacing (locked to the bottom otherwise on VP550) */
          .tw-connect-wallet--modal-overlay > div,
          .tw-modal > div:first-child {
            margin-bottom: 24px !important;
          }

          button:has(> span:contains("Pay ")),
          button:has(> span > span:contains("Pay ")),
          .tw-modal button,
          .tw-connect button {
            margin-bottom: 8px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }

          /* 3. Re-align the 'Transactions' label to match the SVG */
          .tw-modal span:has(> svg) + span {
            display: inline-flex !important;
            align-items: center !important;
            height: 100% !important;
            vertical-align: middle !important;
          }

          /* 4. Pad the Copy Wallet / Manage Wallet nested buttons */
          .tw-modal .tw-wallet-select-wallet-button {
            padding: 12px 16px !important;
          }

          /* 5. Fallback Glassmorphism (Chrome 70 fails severely on backdrop-filter) */
          .glass-pane, .glass-backdrop, .tw-modal {
            background: rgba(15, 23, 42, 0.98) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
          }
          
          /* Ensure disabled buttons aren't blinding */
          .tw-modal button:disabled {
            opacity: 0.6 !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return null;
}
