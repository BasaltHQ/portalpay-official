'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useBrand } from "@/contexts/BrandContext";

export type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  brandLogoUrl: string;
  brandFaviconUrl: string;
  symbolLogoUrl: string;
  brandName: string;
  fontFamily: string;
  receiptBackgroundUrl: string;
  brandLogoShape: 'round' | 'square' | 'unmasked';
  textColor: string;
  headerTextColor: string;
  bodyTextColor: string;
  // Added fields propagated from /api/site/config to ensure consistent client usage
  navbarMode?: 'symbol' | 'logo';
  brandKey?: string;
  footerLogoUrl?: string;
};

type ThemeContextType = {
  theme: SiteTheme;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

const defaultTheme: SiteTheme = {
  primaryColor: '#0f172a',
  secondaryColor: '#F54029',
  // Neutral defaults to avoid PortalPay flash in partner context before BrandContext loads
  brandLogoUrl: '',
  brandFaviconUrl: '',
  symbolLogoUrl: '',
  brandName: '',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  receiptBackgroundUrl: '/watermark.png',
  textColor: '#ffffff',
  headerTextColor: '#ffffff',
  bodyTextColor: '#e5e7eb',
  brandLogoShape: 'square',
  navbarMode: 'symbol',
  brandKey: '',
  footerLogoUrl: '',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isLoading: true,
  refetch: async () => { },
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const brand = useBrand();
  const account = useActiveAccount();
  const wallet = (account?.address || '').toLowerCase();
  const [theme, setTheme] = useState<SiteTheme>(() => ({
    ...defaultTheme,
    // Seed with container brand colors so landing page reflects merchant theme immediately
    primaryColor: typeof (brand as any)?.colors?.primary === 'string' ? (brand as any).colors.primary : defaultTheme.primaryColor,
    secondaryColor: typeof (brand as any)?.colors?.accent === 'string' ? (brand as any).colors.accent : defaultTheme.secondaryColor,
    brandName: brand.name,
    brandFaviconUrl: brand.logos.favicon,
    symbolLogoUrl: String(brand.logos.symbol || brand.logos.app || ''),
    brandLogoUrl: brand.logos.app,
    footerLogoUrl: (brand as any)?.logos?.footer || '',
    navbarMode: (brand as any)?.logos?.navbarMode === 'logo' ? 'logo' : 'symbol',
    brandKey: (brand as any)?.key || '',
  }));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch theme from API
  const fetchTheme = useMemo(() => {
    return async () => {
      try {
        const headers: Record<string, string> = {};
        const recipientEnv = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "").toLowerCase();
        // Prefer active wallet for personal whitelabel post-login
        // For partner containers, fall back to RECIPIENT env to load default merchant theme
        // For platform container, DO NOT fall back to RECIPIENT env so platform theme is used when logged out
        let isPartner = false;
        try {
          const ct = typeof document !== "undefined"
            ? (document.documentElement.getAttribute('data-pp-container-type') || '').toLowerCase()
            : '';
          isPartner = ct === 'partner';
        } catch { }
        if (!isPartner) {
          try {
            const bk = String((brand as any)?.key || '').toLowerCase();
            isPartner = !!bk && bk !== 'portalpay';
          } catch { }
        }
        const useWallet = wallet || (isPartner ? recipientEnv : '');
        if (useWallet) headers['x-wallet'] = useWallet;
        headers['x-theme-caller'] = 'ThemeContext:fetchTheme';

        // Build base URL using selected wallet (if any) and append invoice=1 when requested via query (mode/layout/invoice)
        const baseUrl = useWallet ? `/api/site/config?wallet=${encodeURIComponent(useWallet)}` : `/api/site/config`;
        let urlWithParams = baseUrl;
        try {
          const loc = new URL(window.location.href);
          const invParam = String(loc.searchParams.get('invoice') || '').toLowerCase();
          const modeParam = String(loc.searchParams.get('mode') || '').toLowerCase();
          const layoutParam = String(loc.searchParams.get('layout') || '').toLowerCase();
          const useInvoice = invParam === '1' || invParam === 'true' || modeParam === 'invoice' || layoutParam === 'invoice';
          if (useInvoice) {
            urlWithParams = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}invoice=1`;
          }
        } catch { }
        // Retry/backoff on transient failures to reduce console noise during dev reloads
        let j: any = {};
        let lastErr: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const r = await fetch(urlWithParams, { cache: 'no-store', headers });
            j = await r.json();
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
            const delay = attempt === 0 ? 200 : 700;
            await new Promise(res => setTimeout(res, delay));
          }
        }
        if (lastErr) {
          throw lastErr;
        }
        // Client-side sanitization to kill legacy teal + cblogod fallback quickly
        const tRaw = (j?.config?.theme || {}) as any;
        const t = (() => {
          const x: any = { ...tRaw };
          // Hardcode Green for BasaltSurge if it comes back with generic colors
          const bKey = String((brand as any)?.key || '').toLowerCase();
          if (bKey === 'basaltsurge') {
            x.primaryColor = '#22C55E';
            x.secondaryColor = '#16A34A';
            x.brandName = 'BasaltSurge';
          }
          // Determine container type from DOM attribute set by RootLayout
          let isPartner = false;
          try {
            const ct = typeof document !== 'undefined'
              ? (document.documentElement.getAttribute('data-pp-container-type') || '').toLowerCase()
              : '';
            isPartner = ct === 'partner';
          } catch { }
          // Replace legacy cblogod only in platform context to avoid leaking platform asset in partners
          const brandKey = String((brand as any)?.key || '').toLowerCase();
          const defaultPlatformSymbol = brandKey === 'basaltsurge' ? '/bssymbol.png' : '/ppsymbol.png';
          if (!isPartner && (x.brandLogoUrl === '/cblogod.png' || (brandKey === 'basaltsurge' && x.brandLogoUrl === '/ppsymbol.png'))) {
            x.brandLogoUrl = defaultPlatformSymbol;
          }
          // Ensure compact symbol glyph is present; avoid platform symbol fallback in partner context
          const hasSymbol = !!(x?.logos && typeof x.logos.symbol === 'string' && x.logos.symbol);
          if (!hasSymbol) {
            const symbol =
              typeof x.brandLogoUrl === 'string' && x.brandLogoUrl
                ? x.brandLogoUrl
                : (typeof x.brandFaviconUrl === 'string' && x.brandFaviconUrl ? x.brandFaviconUrl : (isPartner ? '' : defaultPlatformSymbol));
            x.logos = { ...(x.logos || {}), symbol };
            x.symbolLogoUrl = symbol;
          }
          // Clamp legacy teal defaults
          if (x.primaryColor === '#10b981' || x.primaryColor === '#14b8a6') {
            x.primaryColor = '#1f2937';
          }
          if (x.secondaryColor === '#2dd4bf' || x.secondaryColor === '#22d3ee') {
            x.secondaryColor = '#F54029';
          }
          return x;
        })();

        setTheme((prev) => ({
          primaryColor: typeof t.primaryColor === 'string' ? t.primaryColor : prev.primaryColor,
          secondaryColor: typeof t.secondaryColor === 'string' ? t.secondaryColor : prev.secondaryColor,
          brandLogoUrl: typeof t.brandLogoUrl === 'string' ? t.brandLogoUrl : prev.brandLogoUrl,
          brandFaviconUrl: typeof t.brandFaviconUrl === 'string' ? t.brandFaviconUrl : prev.brandFaviconUrl,
          symbolLogoUrl:
            (t?.logos && typeof t.logos.symbol === 'string')
              ? t.logos.symbol
              : (typeof (t as any).brandSymbolUrl === 'string'
                ? (t as any).brandSymbolUrl
                : (typeof t.brandLogoUrl === 'string'
                  ? t.brandLogoUrl
                  : prev.symbolLogoUrl)),
          brandName: typeof t.brandName === 'string' ? t.brandName : prev.brandName,
          fontFamily: typeof t.fontFamily === 'string' ? t.fontFamily : prev.fontFamily,
          receiptBackgroundUrl: typeof t.receiptBackgroundUrl === 'string' ? t.receiptBackgroundUrl : prev.receiptBackgroundUrl,
          textColor: typeof t.textColor === 'string' ? t.textColor : prev.textColor,
          headerTextColor:
            typeof t.headerTextColor === 'string'
              ? t.headerTextColor
              : typeof t.textColor === 'string'
                ? t.textColor
                : prev.headerTextColor,
          bodyTextColor: typeof t.bodyTextColor === 'string' ? t.bodyTextColor : prev.bodyTextColor,
          brandLogoShape:
            t.brandLogoShape === 'round' || t.brandLogoShape === 'square' || t.brandLogoShape === 'unmasked'
              ? t.brandLogoShape
              : prev.brandLogoShape,
          navbarMode:
            (t?.navbarMode === 'logo' || t?.navbarMode === 'symbol')
              ? t.navbarMode
              : ((t?.logos && (t.logos.navbarMode === 'logo' || t.logos.navbarMode === 'symbol'))
                ? t.logos.navbarMode
                : prev.navbarMode),
          footerLogoUrl:
            (t?.logos && typeof t.logos.footer === 'string')
              ? t.logos.footer
              : prev.footerLogoUrl,
          brandKey:
            typeof (t as any)?.brandKey === 'string' && (t as any).brandKey
              ? (t as any).brandKey
              : prev.brandKey,
        }));

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch theme:', error);
        setIsLoading(false);
      }
    };
  }, [wallet]);

  // Initial fetch
  // Do NOT fetch any theme on portal or shop routes — those pages are the sole source of truth for their themes.
  // This prevents accidental cross-wallet theme pulls and eliminates extra /api/site/config calls.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const path = url.pathname || "";
      if (path.startsWith("/portal") || path.startsWith("/shop")) {
        setIsLoading(false);
        return;
      }
    } catch { }
    fetchTheme();
  }, [fetchTheme]);

  // Sync CSS variables on :root when theme changes
  useEffect(() => {
    try {
      const root = document.documentElement;

      // CRITICAL GUARD: Never override portal/shop merchant themes
      // Check hardlock first - if merchant hardlock is set, portal/shop owns the theme
      const hardLock = root.getAttribute('data-pp-theme-hardlock');
      if (hardLock === 'merchant') {
        return; // Portal/Shop has exclusive control
      }

      // Never override theme on Portal or Shop routes; those pages manage their theme lifecycle
      try {
        const url = new URL(window.location.href);
        const path = url.pathname || '';
        if (path.startsWith('/portal') || path.startsWith('/shop')) {
          return;
        }
      } catch { }

      // Check theme lock
      const lock = root.getAttribute('data-pp-theme-lock') || 'user';
      // Allow brand theme to override unless explicitly hardlocked for merchant,
      // or hardlocked for portalpay default while the current brand IS portalpay
      if (lock === 'merchant' || (lock === 'portalpay-default' && String(brand?.key || '').toLowerCase() === 'portalpay')) {
        return; // Don't override these locks in their legitimate scopes
      }

      // Check if merchant theme stage is active
      const stage = root.getAttribute('data-pp-theme-stage') || '';
      const merchantAvailable = root.getAttribute('data-pp-theme-merchant-available');
      if (stage === 'merchant' || merchantAvailable === '1') {
        return; // Merchant theme is active, don't override
      }

      const setVar = (key: string, val?: string) => {
        if (!val) return;
        root.style.setProperty(key, val);
      };

      setVar('--pp-primary', theme.primaryColor);
      setVar('--pp-secondary', theme.secondaryColor);
      setVar('--pp-text', theme.headerTextColor || theme.textColor);
      setVar('--pp-text-header', theme.headerTextColor || theme.textColor);
      setVar('--pp-text-body', theme.bodyTextColor);
      setVar('--primary', theme.primaryColor);
      // Ensure text on primary surfaces uses merchant-provided contrast color
      setVar('--primary-foreground', theme.headerTextColor || theme.textColor || '#ffffff');

      if (typeof theme.fontFamily === 'string' && theme.fontFamily.trim().length > 0) {
        setVar('--pp-font', theme.fontFamily);
      }
    } catch { }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isLoading,
      refetch: fetchTheme,
    }),
    [theme, isLoading, fetchTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
