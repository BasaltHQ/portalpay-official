"use client";

import React, { useEffect, useRef } from "react";

type ShopTheme = {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
};

/**
 * ShopThemeAuditor
 * - Client-side watchdog to ensure brand theming remains correct on shop routes.
 * - Audits CSS variables at :root and detects unexpected resets to default PortalPay colors.
 * - Emits audit events and, when on /shop with lock=merchant, performs a gentle auto-repair.
 *
 * Events:
 *  - pp:theme:audit { ok, expected, actual }
 *  - pp:theme:audit:repaired { expected, actual } (only fired when auto-repair is applied)
 *
 * Root attributes set:
 *  - data-pp-theme-audit-status = 'ok' | 'fail'
 */
export function ShopThemeAuditor({ expected }: { expected: ShopTheme }) {
  const expectedRef = useRef<ShopTheme>(expected);
  useEffect(() => {
    expectedRef.current = expected;
  }, [expected]);

  useEffect(() => {
    const root = document.documentElement;
    let path = "";
    try {
      const url = new URL(window.location.href);
      path = url.pathname || "";
    } catch {}
    const isShop = path.startsWith("/shop");

    const DEFAULTS = {
      primary: "#10b981",
      secondary: "#2dd4bf",
      header: "#ffffff",
      body: "#e5e7eb",
    };

    const norm = (s?: string) => String(s || "").trim().toLowerCase();

    const getActual = () => {
      const cs = getComputedStyle(root);
      const ppPrimary = norm(cs.getPropertyValue("--pp-primary"));
      const ppSecondary = norm(cs.getPropertyValue("--pp-secondary"));
      const ppHeader = norm(cs.getPropertyValue("--pp-text-header"));
      const ppBody = norm(cs.getPropertyValue("--pp-text-body"));
      const ppFont = norm(cs.getPropertyValue("--pp-font"));
      return {
        ppPrimary,
        ppSecondary,
        ppHeader,
        ppBody,
        ppFont,
        lock: root.getAttribute("data-pp-theme-lock") || "",
        stage: root.getAttribute("data-pp-theme-stage") || "",
        ready: root.getAttribute("data-pp-theme-ready") || "",
      };
    };

    const applyExpected = (exp: ShopTheme) => {
      try {
        const primary = exp.primaryColor || DEFAULTS.primary;
        const secondary = exp.secondaryColor || DEFAULTS.secondary;
        const text = exp.textColor || DEFAULTS.header;
        const font = exp.fontFamily;

        root.style.setProperty("--pp-primary", primary);
        root.style.setProperty("--pp-secondary", secondary);
        root.style.setProperty("--pp-text", text);
        root.style.setProperty("--pp-text-header", text);
        root.style.setProperty("--pp-text-body", exp.textColor || DEFAULTS.body);
        root.style.setProperty("--primary", primary);
        if (typeof font === "string" && font.trim().length > 0) {
          root.style.setProperty("--pp-font", font);
        }
      } catch {}
    };

    const audit = (exp: ShopTheme) => {
      const actual = getActual();
      const expPrimary = norm(exp.primaryColor);
      const expSecondary = norm(exp.secondaryColor);
      const expHeader = norm(exp.textColor);
      const expFont = norm(exp.fontFamily);

      const primaryMismatch = !!expPrimary && !!actual.ppPrimary && actual.ppPrimary !== expPrimary;
      const secondaryMismatch = !!expSecondary && !!actual.ppSecondary && actual.ppSecondary !== expSecondary;
      // Detect bleed of default colors when expecting non-default branding
      const defaultBleed =
        (!!expPrimary && expPrimary !== norm(DEFAULTS.primary) && actual.ppPrimary === norm(DEFAULTS.primary)) ||
        (!!expSecondary && expSecondary !== norm(DEFAULTS.secondary) && actual.ppSecondary === norm(DEFAULTS.secondary));
      const headerMismatch = !!expHeader && !!actual.ppHeader && actual.ppHeader !== expHeader;
      const fontMismatch = !!expFont && !!actual.ppFont && actual.ppFont !== expFont;

      const ok = !(primaryMismatch || secondaryMismatch || defaultBleed || headerMismatch || fontMismatch);

      try {
        root.setAttribute("data-pp-theme-audit-status", ok ? "ok" : "fail");
        window.dispatchEvent(new CustomEvent("pp:theme:audit", { detail: { ok, expected: exp, actual } }));
      } catch {}

      if (!ok) {
        // Only auto-repair on shop routes when the theme lock is explicitly set to merchant.
        const lock = root.getAttribute("data-pp-theme-lock") || "";
        if (isShop && lock === "merchant") {
          applyExpected(exp);
          try {
            root.setAttribute("data-pp-theme-stage", "merchant");
            window.dispatchEvent(new CustomEvent("pp:theme:audit:repaired", { detail: { expected: exp, actual } }));
          } catch {}
        }
      }

      return ok;
    };

    // Initial audit
    audit(expectedRef.current || {});

    // Observe attribute changes tied to theming to re-audit quickly on transitions.
    const mo = new MutationObserver(() => {
      try {
        audit(expectedRef.current || {});
      } catch {}
    });
    try {
      mo.observe(root, {
        attributes: true,
        attributeFilter: [
          "style",
          "data-pp-theme-stage",
          "data-pp-theme-lock",
          "data-pp-theme-ready",
          "data-pp-theme-merchant-available",
          "data-pp-theme-merchant-expected",
        ],
      });
    } catch {}

    // Listen to theme events
    const onReady = () => audit(expectedRef.current || {});
    const onUpdated = () => audit(expectedRef.current || {});
    try {
      window.addEventListener("pp:theme:ready", onReady as any);
      window.addEventListener("pp:theme:updated", onUpdated as any);
    } catch {}

    // Safety: periodic audit in case of silent changes
    const id = window.setInterval(() => {
      try { audit(expectedRef.current || {}); } catch {}
    }, 2000);

    return () => {
      try {
        mo.disconnect();
        window.removeEventListener("pp:theme:ready", onReady as any);
        window.removeEventListener("pp:theme:updated", onUpdated as any);
        window.clearInterval(id);
      } catch {}
    };
  }, []);

  return null;
}
