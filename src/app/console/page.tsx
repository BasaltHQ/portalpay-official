"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";
import { client, chain, getRecipientAddress } from "@/lib/thirdweb/client";
import { buildTestReceiptEndpoint, buildReceiptFetchInit, buildPortalUrlForTest } from "@/lib/receipts";
import { getPortalThirdwebTheme, getConnectButtonStyle, connectButtonClass } from "@/lib/thirdweb/theme";
import { fetchEthRates, type EthRates } from "@/lib/eth";
import { PortalPreviewEmbedded } from "@/components/portal-preview-embedded";

type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  brandLogoUrl: string;
  brandFaviconUrl: string;
  brandName: string;
  fontFamily: string;
  receiptBackgroundUrl: string;
  brandLogoShape?: "round" | "square";
  textColor?: string;
  headerTextColor?: string;
  bodyTextColor?: string;
};

type SiteConfigResponse = {
  config?: {
    theme?: SiteTheme;
  };
  degraded?: boolean;
  reason?: string;
};

const THEME_DEFAULTS: SiteTheme = {
  primaryColor: "#10b981",
  secondaryColor: "#2dd4bf",
  brandLogoUrl: "/cblogod.png",
  brandFaviconUrl: "/favicon-32x32.png",
  brandName: "PortalPay",
  brandLogoShape: "round",
  textColor: "#ffffff",
  headerTextColor: "#ffffff",
  bodyTextColor: "#e5e7eb",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  receiptBackgroundUrl: "/manifest.webmanifest",
};

const FONT_PRESETS: { label: string; value: string }[] = [
  { label: "Inter (Default system stack)", value: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "Roboto", value: "Roboto, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" },
  { label: "Poppins", value: "Poppins, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" },
  { label: "Merriweather (serif)", value: "Merriweather, Georgia, Cambria, Times New Roman, Times, serif" },
  { label: "Space Grotesk", value: "Space Grotesk, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" },
  { label: "System (SF/Segoe/UI)", value: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
];

function clampColor(v: string, fallback: string): string {
  try {
    const s = (v || "").trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
    return fallback;
  } catch {
    return fallback;
  }
}

/* Color helpers for HEX/RGB toggle */
function hexToRgbString(hex: string): string {
  try {
    const s = hex.trim().toLowerCase();
    const m3 = /^#([0-9a-f]{3})$/i.exec(s);
    const m6 = /^#([0-9a-f]{6})$/i.exec(s);
    let r = 0, g = 0, b = 0;
    if (m3) {
      const h = m3[1];
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else if (m6) {
      const h = m6[1];
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    } else {
      return "rgb(255, 255, 255)";
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return "rgb(255, 255, 255)";
  }
}

function rgbStringToHex(rgb: string): string | null {
  try {
    const s = rgb.trim().toLowerCase().replace(/\s+/g, "");
    const m = /^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/.exec(s) || /^(\d{1,3}),(\d{1,3}),(\d{1,3})$/.exec(s);
    if (!m) return null;
    const toHex = (n: number) => {
      const v = Math.max(0, Math.min(255, n));
      return v.toString(16).padStart(2, "0");
    };
    const r = toHex(parseInt(m[1], 10));
    const g = toHex(parseInt(m[2], 10));
    const b = toHex(parseInt(m[3], 10));
    return `#${r}${g}${b}`;
  } catch {
    return null;
  }
}

function isValidHexAddress(addr: string): boolean {
  try {
    return /^0x[a-fA-F0-9]{40}$/.test(String(addr || "").trim());
  } catch {
    return false;
  }
}

async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  try {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/media/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { error: j?.error || "Upload failed" };
    if (typeof j?.url === "string") return { url: j.url };
    return { error: "Invalid response" };
  } catch (e: any) {
    return { error: e?.message || "Upload error" };
  }
}

export default function ConsolePage() {
  const account = useActiveAccount();
  const wallet = (account?.address || "").toLowerCase();
  const isOwner = !!wallet;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  
  const [theme, setTheme] = useState<SiteTheme>(THEME_DEFAULTS);
  const [colorMode, setColorMode] = useState<"hex" | "rgb">("hex");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const receiptBgInputRef = useRef<HTMLInputElement | null>(null);
  const primaryColorRef = useRef<HTMLInputElement | null>(null);
  const secondaryColorRef = useRef<HTMLInputElement | null>(null);
  const textColorRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        document.documentElement.setAttribute("data-pp-console-ready", "0");
      } catch {}
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (wallet) headers["x-wallet"] = wallet;
        const r = await fetch("/api/site/config", { cache: "no-store", headers });
        const j: SiteConfigResponse = await r.json().catch(() => ({} as any));
        const t = j?.config?.theme;
        if (!cancelled) {
          setTheme({
            primaryColor: clampColor(t?.primaryColor || THEME_DEFAULTS.primaryColor, THEME_DEFAULTS.primaryColor),
            secondaryColor: clampColor(t?.secondaryColor || THEME_DEFAULTS.secondaryColor, THEME_DEFAULTS.secondaryColor),
            brandLogoUrl: typeof t?.brandLogoUrl === "string" ? t!.brandLogoUrl : THEME_DEFAULTS.brandLogoUrl,
            brandFaviconUrl: typeof t?.brandFaviconUrl === "string" ? t!.brandFaviconUrl : THEME_DEFAULTS.brandFaviconUrl,
            brandName: typeof t?.brandName === "string" ? t!.brandName : THEME_DEFAULTS.brandName,
            fontFamily: typeof t?.fontFamily === "string" ? t!.fontFamily : THEME_DEFAULTS.fontFamily,
            receiptBackgroundUrl: typeof t?.receiptBackgroundUrl === "string" ? t!.receiptBackgroundUrl : THEME_DEFAULTS.receiptBackgroundUrl,
            brandLogoShape: t?.brandLogoShape === "round" ? "round" : "square",
            textColor: clampColor(t?.textColor || (THEME_DEFAULTS.textColor || "#ffffff"), THEME_DEFAULTS.textColor || "#ffffff"),
            headerTextColor: clampColor(t?.headerTextColor || t?.textColor || (THEME_DEFAULTS.headerTextColor || "#ffffff"), THEME_DEFAULTS.headerTextColor || "#ffffff"),
            bodyTextColor: clampColor(t?.bodyTextColor || (THEME_DEFAULTS.bodyTextColor || "#e5e7eb"), THEME_DEFAULTS.bodyTextColor || "#e5e7eb"),
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load site config");
      } finally {
        if (!cancelled) {
          setLoading(false);
          try {
            const rootEl = document.documentElement;
            rootEl.setAttribute("data-pp-console-ready", "1");
            window.dispatchEvent(new CustomEvent("pp:theme:console_ready"));
          } catch {}
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const previewStyle = useMemo(() => {
    return {
      ["--pp-primary" as any]: theme.primaryColor,
      ["--pp-secondary" as any]: theme.secondaryColor,
      ["--pp-text" as any]: theme.headerTextColor || theme.textColor || "#ffffff",
      ["--pp-text-header" as any]: theme.headerTextColor || theme.textColor || "#ffffff",
      ["--pp-text-body" as any]: theme.bodyTextColor || "#e5e7eb",
      fontFamily: theme.fontFamily,
      backgroundImage: theme.receiptBackgroundUrl ? `url(${theme.receiptBackgroundUrl})` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as React.CSSProperties;
  }, [theme]);

  // Live-apply console edits to global CSS vars so navbar indicator, background orbs,
  // Contrast Preview buttons, and Submit Branding button reflect changes immediately.
  useEffect(() => {
    try {
      const root = document.documentElement;
      const setVar = (key: string, val?: string) => {
        if (!val) return;
        root.style.setProperty(key, val);
      };
      setVar("--pp-primary", theme.primaryColor);
      setVar("--pp-secondary", theme.secondaryColor);
      setVar("--pp-text", theme.headerTextColor || theme.textColor || "#ffffff");
      setVar("--pp-text-header", theme.headerTextColor || theme.textColor || "#ffffff");
      setVar("--pp-text-body", theme.bodyTextColor || "#e5e7eb");
      // Map legacy/global primary to brand primary for elements like the navbar selection strip
      setVar("--primary", theme.primaryColor);
      if (typeof theme.fontFamily === "string" && theme.fontFamily.trim().length > 0) {
        setVar("--pp-font", theme.fontFamily);
      }
      // Broadcast so any listeners (ThemeLoader, Navbar, widgets) sync immediately
      window.dispatchEvent(new CustomEvent("pp:theme:updated", { detail: { ...theme } }));
    } catch {}
  }, [theme.primaryColor, theme.secondaryColor, theme.headerTextColor, theme.textColor, theme.bodyTextColor, theme.fontFamily]);

  async function saveTheme() {
    setSaving(true);
    setError(null);
    setStatus("");
    try {
      const body = { theme };
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (wallet) headers["x-wallet"] = wallet;
      const res = await fetch("/api/site/config", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.error) {
        throw new Error(j?.error || j?.reason || "Save failed");
      }
      setStatus("Saved theme");
      // Immediately apply new theme to CSS vars and broadcast to the app so headers update without refresh
      try {
        const root = document.documentElement;
        const setVar = (key: string, val?: string) => {
          if (!val) return;
          root.style.setProperty(key, val);
        };
        setVar("--pp-primary", theme.primaryColor);
        setVar("--pp-secondary", theme.secondaryColor);
        setVar("--pp-text", theme.headerTextColor || theme.textColor || "#ffffff");
        setVar("--primary", theme.primaryColor);
        if (typeof theme.fontFamily === "string" && theme.fontFamily.trim().length > 0) {
          setVar("--pp-font", theme.fontFamily);
        }
        // Notify other components (Navbar, ThemeLoader) to update synchronously
        window.dispatchEvent(new CustomEvent("pp:theme:updated", { detail: { ...theme } }));
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(""), 3000);
    }
  }

  function onColorChange(key: "primaryColor" | "secondaryColor" | "textColor", value: string) {
    setTheme((t) => ({ ...t, [key]: clampColor(value, (THEME_DEFAULTS as any)[key]) }));
  }

  async function onUpload(key: "brandLogoUrl" | "brandFaviconUrl" | "receiptBackgroundUrl", file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError(null);
    setStatus("Uploading...");
    const { url, error } = await uploadImage(file);
    if (error) {
      setError(error);
      setStatus("");
      return;
    }
    setTheme((t) => ({ ...t, [key]: url || "" }));
    setStatus("Uploaded");
    try {
      if (key === "brandLogoUrl" && url) {
        setStatus("Generating favicon...");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (wallet) headers["x-wallet"] = wallet;
        const shape = (theme.brandLogoShape || "square");
        const resFav = await fetch(`/api/media/favicon${wallet ? `?wallet=${encodeURIComponent(wallet)}` : ""}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ url, shape }),
        });
        const jFav = await resFav.json().catch(() => ({}));
        if (resFav.ok && typeof jFav?.favicon32 === "string") {
          setTheme((t) => ({ ...t, brandFaviconUrl: jFav.favicon32 }));
          setStatus("Uploaded + favicon generated");
        } else {
          setStatus("Uploaded");
        }
      }
    } catch {
      // ignore favicon generation errors
    }
    setTimeout(() => setStatus(""), 2000);
  }

  // Demo receipt for Console preview (uses /api/receipts/TEST)
  const [demoReceipt, setDemoReceipt] = useState<{ lineItems: { label: string; priceUsd: number; qty?: number }[]; totalUsd: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = wallet || getRecipientAddress();
        const url = buildTestReceiptEndpoint(w);
        const init = { cache: "no-store", ...buildReceiptFetchInit(w) } as RequestInit;
        const r = await fetch(url, init);
        const j = await r.json().catch(() => ({}));
        const rec = j?.receipt;
        if (!cancelled && rec && Array.isArray(rec.lineItems)) {
          setDemoReceipt({ lineItems: rec.lineItems, totalUsd: Number(rec.totalUsd || 0) });
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Demo checkout preview support
  const [rates, setRates] = useState<EthRates>({});
  useEffect(() => {
    fetchEthRates().then((r) => setRates(r)).catch(() => setRates({}));
  }, []);
  const usdRate = Number(rates["USD"] || 0);
  const demoUsd = 5;
  const demoEth = useMemo(() => {
    if (!usdRate || usdRate <= 0) return 0;
    return +(demoUsd / usdRate).toFixed(6);
  }, [usdRate]);
  const amountReady = demoEth > 0;
  const recipient = getRecipientAddress();
  const hasRecipient = isValidHexAddress(recipient);

  // Resolve seller: prefer per-merchant split address if configured
  const [sellerAddress, setSellerAddress] = useState<`0x${string}` | undefined>(undefined);
  useEffect(() => {
    (async () => {
      try {
        if (!hasRecipient) {
          setSellerAddress(undefined);
          return;
        }
        const r = await fetch(`/api/site/config?wallet=${encodeURIComponent(recipient)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({} as any));
        const splitAddr = (j?.config?.splitAddress || j?.config?.split?.address || "") as string;
        if (isValidHexAddress(String(splitAddr || ""))) {
          setSellerAddress(splitAddr as `0x${string}`);
        } else {
          setSellerAddress(recipient as `0x${string}`);
        }
      } catch {
        setSellerAddress(recipient as `0x${string}`);
      }
    })();
  }, [recipient, hasRecipient]);
  const chainId = (chain as any)?.id ?? 0;
  const hasClientId = !!(process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "");
  const widgetSupported = chainId === 8453; // Base mainnet demo

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Console</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Configure your payment portal's theme and branding. Upload your logo, set colors, and preview the portal.
      </p>

      {/* Owner gating notice */}
      {!isOwner && (
        <div className="glass-pane rounded-xl border p-4 mb-6 bg-yellow-500/10 border-yellow-500/50">
          <div className="text-sm">
            <span className="font-semibold">Read-only preview.</span>{" "}
            Connect your wallet to save changes to your portal theme.
          </div>
        </div>
      )}

      {loading ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="glass-pane rounded-xl border p-5 space-y-5">
            <h2 className="text-lg font-semibold">Theme & Branding</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="microtext text-muted-foreground">Color input</span>
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setColorMode("hex")}
                  className={`px-2 py-1 text-xs ${colorMode === "hex" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                  title="Use HEX format"
                >
                  HEX
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode("rgb")}
                  className={`px-2 py-1 text-xs ${colorMode === "rgb" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                  title="Use RGB format"
                >
                  RGB
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Brand Name</label>
              <input
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                placeholder="Your Brand"
                value={theme.brandName}
                onChange={(e) => setTheme((t) => ({ ...t, brandName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-start gap-3 mt-1 min-w-0">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-md border shadow-sm shrink-0"
                    value={theme.primaryColor}
                    onChange={(e) => onColorChange("primaryColor", e.target.value)}
                    title="Pick primary color"
                  />
                  <input
                    className="h-9 px-3 py-1 border rounded-md bg-background"
                    style={{ width: colorMode === "hex" ? "104px" : "160px" }}
                    value={colorMode === "hex" ? theme.primaryColor : hexToRgbString(theme.primaryColor)}
                    onChange={(e) => {
                      const v = e.target.value;
                      const hex = colorMode === "hex"
                        ? clampColor(v, THEME_DEFAULTS.primaryColor)
                        : (rgbStringToHex(v) || THEME_DEFAULTS.primaryColor);
                      onColorChange("primaryColor", hex);
                    }}
                    placeholder={colorMode === "hex" ? "#1f2937" : "rgb(31, 41, 55)"}
                    maxLength={colorMode === "hex" ? 7 : 18}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for header backgrounds and accents.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Secondary Color</label>
                <div className="flex items-start gap-3 mt-1 min-w-0">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-md border shadow-sm shrink-0"
                    value={theme.secondaryColor}
                    onChange={(e) => onColorChange("secondaryColor", e.target.value)}
                    title="Pick secondary color"
                  />
                  <input
                    className="h-9 px-3 py-1 border rounded-md bg-background"
                    style={{ width: colorMode === "hex" ? "104px" : "160px" }}
                    value={colorMode === "hex" ? theme.secondaryColor : hexToRgbString(theme.secondaryColor)}
                    onChange={(e) => {
                      const v = e.target.value;
                      const hex = colorMode === "hex"
                        ? clampColor(v, THEME_DEFAULTS.secondaryColor)
                        : (rgbStringToHex(v) || THEME_DEFAULTS.secondaryColor);
                      onColorChange("secondaryColor", hex);
                    }}
                    placeholder={colorMode === "hex" ? "#F54029" : "rgb(245, 64, 41)"}
                    maxLength={colorMode === "hex" ? 7 : 18}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for buttons, highlights, and emphasis.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Header Text Color</label>
                <div className="flex items-start gap-3 mt-1 min-w-0">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-md border shadow-sm shrink-0"
                    value={theme.headerTextColor || theme.textColor || "#ffffff"}
                    onChange={(e) => setTheme((t) => ({ ...t, headerTextColor: clampColor(e.target.value, THEME_DEFAULTS.headerTextColor || "#ffffff"), textColor: clampColor(e.target.value, THEME_DEFAULTS.textColor || "#ffffff") }))}
                    title="Pick header text color"
                  />
                  <input
                    className="h-9 px-3 py-1 border rounded-md bg-background"
                    style={{ width: colorMode === "hex" ? "104px" : "160px" }}
                    value={colorMode === "hex" ? (theme.headerTextColor || theme.textColor || "#ffffff") : hexToRgbString(theme.headerTextColor || theme.textColor || "#ffffff")}
                    onChange={(e) => {
                      const v = e.target.value;
                      const hex = colorMode === "hex"
                        ? clampColor(v, THEME_DEFAULTS.headerTextColor || "#ffffff")
                        : (rgbStringToHex(v) || (THEME_DEFAULTS.headerTextColor || "#ffffff"));
                      setTheme((t) => ({ ...t, headerTextColor: hex, textColor: hex }));
                    }}
                    placeholder={colorMode === "hex" ? "#ffffff" : "rgb(255, 255, 255)"}
                    maxLength={colorMode === "hex" ? 7 : 18}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for text over primary backgrounds (header/footer).</p>
              </div>
              <div>
                <label className="text-sm font-medium">Body Text Color</label>
                <div className="flex items-start gap-3 mt-1 min-w-0">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-md border shadow-sm shrink-0"
                    value={theme.bodyTextColor || "#e5e7eb"}
                    onChange={(e) => setTheme((t) => ({ ...t, bodyTextColor: clampColor(e.target.value, THEME_DEFAULTS.bodyTextColor || "#e5e7eb") }))}
                    title="Pick body text color"
                  />
                  <input
                    className="h-9 px-3 py-1 border rounded-md bg-background"
                    style={{ width: colorMode === "hex" ? "104px" : "160px" }}
                    value={colorMode === "hex" ? (theme.bodyTextColor || "#e5e7eb") : hexToRgbString(theme.bodyTextColor || "#e5e7eb")}
                    onChange={(e) => {
                      const v = e.target.value;
                      const hex = colorMode === "hex"
                        ? clampColor(v, THEME_DEFAULTS.bodyTextColor || "#e5e7eb")
                        : (rgbStringToHex(v) || (THEME_DEFAULTS.bodyTextColor || "#e5e7eb"));
                      setTheme((t) => ({ ...t, bodyTextColor: hex }));
                    }}
                    placeholder={colorMode === "hex" ? "#e5e7eb" : "rgb(229, 231, 235)"}
                    maxLength={colorMode === "hex" ? 7 : 18}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for body content in the portal and preview.</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-medium mb-1">Contrast Preview</div>
              <div className="flex gap-3">
                <div className="rounded-md px-3 py-2 text-xs" style={{ background: "var(--pp-primary)", color: "var(--pp-text)" }}>
                  Text on Primary
                </div>
                <div className="rounded-md px-3 py-2 text-xs" style={{ background: "var(--pp-secondary)", color: "var(--pp-text)" }}>
                  Text on Secondary
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Font Family</label>
              <select
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                value={theme.fontFamily}
                onChange={(e) => setTheme((t) => ({ ...t, fontFamily: e.target.value }))}
              >
                {FONT_PRESETS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Applied to all portal text.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Brand Logo</label>
                <div className="mt-1 flex flex-col gap-2">
                  <div className="h-24 border rounded-md bg-background flex items-center justify-center overflow-hidden">
                    {theme.brandLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="logo" src={theme.brandLogoUrl} className="max-h-24 object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No logo</span>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget;
                      const file = e.target.files?.[0] || null;
                      if (file) await onUpload("brandLogoUrl", file);
                      if (inputEl) inputEl.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-foreground/5"
                    title="Upload logo"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M5 20h14a1 1 0 0 0 1-1v-7h-2v6H6V6h6V4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1z"></path>
                      <path d="M21 7h-4V3h-2v4h-4v2h4v4h2V9h4z"></path>
                    </svg>
                    <span className="sr-only">Upload Logo</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Shown in the portal header.</p>
                <div className="mt-2">
                  <label className="text-sm font-medium">Logo shape</label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme((t) => ({ ...t, brandLogoShape: "square" }))}
                      className={`px-2 py-1 rounded-md border text-xs ${theme.brandLogoShape === "square" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                      title="Square crop"
                    >
                      Square
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme((t) => ({ ...t, brandLogoShape: "round" }))}
                      className={`px-2 py-1 rounded-md border text-xs ${theme.brandLogoShape === "round" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                      title="Round crop"
                    >
                      Round
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Favicon</label>
                <div className="mt-1 flex flex-col gap-2">
                  <div className="h-24 border rounded-md bg-background flex items-center justify-center overflow-hidden">
                    {theme.brandFaviconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="favicon" src={theme.brandFaviconUrl} className="max-h-20 object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No favicon</span>
                    )}
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget;
                      const file = e.target.files?.[0] || null;
                      if (file) await onUpload("brandFaviconUrl", file);
                      if (inputEl) inputEl.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-foreground/5"
                    title="Upload favicon"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M5 20h14a1 1 0 0 0 1-1v-7h-2v6H6V6h6V4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1z"></path>
                      <path d="M21 7h-4V3h-2v4h-4v2h4v4h2V9h4z"></path>
                    </svg>
                    <span className="sr-only">Upload Favicon</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Small icon used by browsers.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Receipt Background</label>
                <div className="mt-1 flex flex-col gap-2">
                  <div className="h-24 border rounded-md bg-background flex items-center justify-center overflow-hidden">
                    {theme.receiptBackgroundUrl && theme.receiptBackgroundUrl !== "/manifest.webmanifest" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="receipt-bg" src={theme.receiptBackgroundUrl} className="max-h-24 object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </div>
                  <input
                    ref={receiptBgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget;
                      const file = e.target.files?.[0] || null;
                      if (file) await onUpload("receiptBackgroundUrl", file);
                      if (inputEl) inputEl.value = "";
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => receiptBgInputRef.current?.click()}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-foreground/5"
                      title="Upload receipt background"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M5 20h14a1 1 0 0 0 1-1v-7h-2v6H6V6h6V4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1z"></path>
                        <path d="M21 7h-4V3h-2v4h-4v2h4v4h2V9h4z"></path>
                      </svg>
                      <span className="sr-only">Upload Receipt Background</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme((t) => ({ ...t, receiptBackgroundUrl: "" }));
                        setStatus("Background cleared");
                        setTimeout(() => setStatus(""), 2000);
                      }}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-foreground/5"
                      title="Remove receipt background"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M3 6h18"></path>
                        <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6h6l-1-2h-4z"></path>
                      </svg>
                      <span className="sr-only">Remove Receipt Background</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Optional background for the digital receipt.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                className="px-5 py-2.5 rounded-md text-white font-semibold shadow-sm hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--pp-secondary)" }}
                onClick={saveTheme}
                disabled={!isOwner || saving}
                title={!isOwner ? "Connect your wallet to submit" : "Submit theme & branding"}
              >
                {saving ? "Submitting..." : "Submit Branding"}
              </button>
              {status && <span className="microtext text-muted-foreground">{status}</span>}
              {error && <span className="microtext text-red-500">{error}</span>}
            </div>
          </div>

          {/* Live Preview */}
          <div className="glass-pane rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Live Portal Preview</h2>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md border text-xs hover:bg-foreground/5"
                onClick={async () => {
                  try {
                    setStatus("Opening preview...");
                    const recipientAddr = wallet || getRecipientAddress();
                    const url = buildPortalUrlForTest(recipientAddr);
                    window.open(url, "_blank", "width=428,height=780,menubar=no,toolbar=no,resizable=yes,scrollbars=yes");
                    setStatus("");
                  } catch {
                    const recipientAddr = wallet || getRecipientAddress();
                    const url = buildPortalUrlForTest(recipientAddr);
                    window.open(url, "_blank", "width=428,height=780,menubar=no,toolbar=no,resizable=yes,scrollbars=yes");
                    setStatus("");
                  }
                }}
                title="Open a live portal in a mobile-sized window"
              >
                Open Mobile Preview
              </button>
            </div>
            <PortalPreviewEmbedded
              theme={theme}
              demoReceipt={demoReceipt}
              recipient={recipient}
              sellerAddress={sellerAddress}
            />
          </div>
        </div>
      )}

      {/* Help */}
      <div className="mt-6 glass-pane rounded-xl border p-4">
        <h3 className="text-sm font-semibold mb-1">Next</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Use Portal Preview to test a live $5 checkout with all currencies.</li>
          <li>QR scans will load the payment portal with this theme and branding.</li>
        </ul>
      </div>
    </div>
  );
}
