"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import ImageUploadField from "@/components/forms/ImageUploadField";

/** ---------------- Branding Panel (Partner Admin) ---------------- */
export default function BrandingPanel() {
  const account = useActiveAccount();
  const brand = useBrand();
  const { refetch } = useTheme();
  const [appUrl, setAppUrl] = useState<string>("");
  const [partnerFeeBps, setPartnerFeeBps] = useState<number>(0);
  const [platformFeeBps, setPlatformFeeBps] = useState<number>(50);
  const [defaultMerchantFeeBps, setDefaultMerchantFeeBps] = useState<number>(0);
  const [partnerWallet, setPartnerWallet] = useState<string>("");
  // Theme controls
  const [brandDisplayName, setBrandDisplayName] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState<string>("#0ea5e9");
  const [accentColor, setAccentColor] = useState<string>("#22c55e");
  const [logoAppUrl, setLogoAppUrl] = useState<string>("");
  const [logoFaviconUrl, setLogoFaviconUrl] = useState<string>("");
  const [logoSymbolUrl, setLogoSymbolUrl] = useState<string>("");
  const [socialDefaultUrl, setSocialDefaultUrl] = useState<string>("");
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState<string>("");
  const [ogTitle, setOgTitle] = useState<string>("");
  const [ogDescription, setOgDescription] = useState<string>("");
  const [brandLogoShape, setBrandLogoShape] = useState<"round" | "square" | "unmasked">("square");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconGenerating, setFaviconGenerating] = useState(false);
  // Container status (read-only snapshot for Partners panel awareness)
  const [containerAppName, setContainerAppName] = useState<string>("");
  const [containerFqdn, setContainerFqdn] = useState<string>("");
  const [containerState, setContainerState] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Fee edit lock for partner containers post-deploy
  const isPartnerContainer = String(process.env.CONTAINER_TYPE || process.env.NEXT_PUBLIC_CONTAINER_TYPE || "platform").toLowerCase() === "partner";

  async function load() {
    try {
      setLoading(true);
      setError("");
      setInfo("");
      let eff: any = {};
      let overrides: any = {};
      const isPortalPay = String(brand.key || "").toLowerCase() === "portalpay" || String(brand.key || "").toLowerCase() === "basaltsurge";
      const recipientEnv = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "").toLowerCase();

      if (isPortalPay) {
        const recipient = recipientEnv;
        const walletParam = recipient ? `?wallet=${encodeURIComponent(recipient)}` : "";
        const r = await fetch(`/api/site/config${walletParam}`, {
          cache: "no-store",
          headers: { "x-wallet": recipient || "" },
        });
        const j = await r.json().catch(() => ({}));
        const cfg = j?.config || {};

        // Map site config shape into branding fields
        eff = {
          appUrl: String(cfg?.appUrl || ""),
          partnerFeeBps: Number(cfg?.partnerFeeBps ?? 0),
          defaultMerchantFeeBps: Number(cfg?.defaultMerchantFeeBps ?? 0),
          partnerWallet: String(cfg?.partnerWallet || ""),
          name: String(cfg?.theme?.brandName || ""),
          colors: {
            primary: String(cfg?.theme?.primaryColor || cfg?.theme?.colors?.primary || ""),
            accent: String(cfg?.theme?.secondaryColor || cfg?.theme?.colors?.accent || ""),
          },
          logos: {
            app: String(cfg?.theme?.brandLogoUrl || cfg?.theme?.logos?.app || ""),
            favicon: String(cfg?.theme?.brandFaviconUrl || cfg?.theme?.logos?.favicon || ""),
            symbol: String(
              (cfg?.theme?.logos?.symbol) ||
              // fallback paths if symbol not explicitly present
              (cfg?.theme?.brandSymbolUrl as any) ||
              (cfg?.theme?.brandLogoUrl) ||
              (cfg?.theme?.logos?.app) ||
              ""
            ),
            socialDefault: String(((cfg?.theme?.logos as any)?.socialDefault) || ""),
          },
          appleTouchIconUrl: String(cfg?.theme?.appleTouchIconUrl || ""),
          meta: (cfg?.theme?.meta as any) || {},
        };
        overrides = {
          containerAppName: cfg?.containerAppName,
          containerFqdn: cfg?.containerFqdn,
          containerState: cfg?.containerState,
        };
      } else {
        const r = await fetch(`/api/platform/brands/${encodeURIComponent(brand.key)}/config`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        eff = j?.brand || {};
        overrides = j?.overrides || {};
      }
      try {
        const defaultAppUrl = (() => {
          try { return window.location.origin || ""; } catch { return ""; }
        })();
        setAppUrl(String(eff?.appUrl || defaultAppUrl || ""));
      } catch {
        setAppUrl(String(eff?.appUrl || ""));
      }
      const pf = Number(eff?.partnerFeeBps || 0);
      const dm = Number(eff?.defaultMerchantFeeBps || 0);
      const plat = Number(eff?.platformFeeBps || 50);
      setPartnerFeeBps(Number.isFinite(pf) ? pf : 0);
      setPlatformFeeBps(Number.isFinite(plat) ? plat : 50);
      setDefaultMerchantFeeBps(Number.isFinite(dm) ? dm : 0);
      setPartnerWallet(String(isPortalPay ? (((eff as any)?.partnerWallet || recipientEnv || "")) : ((eff as any)?.partnerWallet || "")));
      // Theme fields
      setBrandDisplayName(String(eff?.name || ""));
      try {
        const pc = String(eff?.colors?.primary || "").trim();
        const ac = String(eff?.colors?.accent || "").trim();
        setPrimaryColor(pc || "#0ea5e9");
        setAccentColor(ac || "#22c55e");
      } catch {
        setPrimaryColor("#0ea5e9");
        setAccentColor("#22c55e");
      }
      setLogoAppUrl(String(eff?.logos?.app || ""));
      setLogoFaviconUrl(String(eff?.logos?.favicon || ""));
      setLogoSymbolUrl(String(eff?.logos?.symbol || eff?.logos?.app || ""));
      setSocialDefaultUrl(String((eff as any)?.logos?.socialDefault || ""));
      setAppleTouchIconUrl(String((eff as any)?.appleTouchIconUrl || ""));
      setOgTitle(String(eff?.meta?.ogTitle || ""));
      setOgDescription(String(eff?.meta?.ogDescription || ""));
      // Shape
      try {
        const rawShape = (String((eff as any)?.theme?.brandLogoShape || (eff as any)?.brandLogoShape || "").toLowerCase());
        setBrandLogoShape(rawShape === "round" || rawShape === "square" || rawShape === "unmasked" ? (rawShape as any) : "square");
      } catch {
        setBrandLogoShape("square");
      }
      // Container status snapshot
      setContainerAppName(String(overrides?.containerAppName || ""));
      setContainerFqdn(String(overrides?.containerFqdn || ""));
      setContainerState(String(overrides?.containerState || ""));
    } catch (e: any) {
      setError(e?.message || "Failed to load brand");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [brand.key]);

  async function uploadLogoAndFavicon() {
    try {
      setError("");
      setInfo("");
      if (!logoFile) {
        setError("Select a logo file first");
        return;
      }

      // Upload logo (requires auth + CSRF; include credentials)
      const fd = new FormData();
      fd.append("file", logoFile);
      const uploadResp = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const uploadJson = await uploadResp.json().catch(() => ({}));
      if (!uploadResp.ok || uploadJson?.error) {
        setError(uploadJson?.error || "Upload failed");
        return;
      }
      const uploadedUrl = String(uploadJson?.url || "");
      if (uploadedUrl) {
        setLogoAppUrl(uploadedUrl);
        // If symbol empty, default to uploaded logo
        if (!logoSymbolUrl) setLogoSymbolUrl(uploadedUrl);
      }

      // Auto-generate favicons from the same file
      setFaviconGenerating(true);
      const fdf = new FormData();
      fdf.append("file", logoFile);
      fdf.append("shape", brandLogoShape === "round" ? "round" : "square"); // favicon supports round/square mask; "unmasked" maps to square
      const walletHeader = (process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "") || "";
      const favResp = await fetch("/api/media/favicon", {
        method: "POST",
        body: fdf,
        headers: walletHeader ? { "x-wallet": walletHeader.toLowerCase() } : undefined,
      });
      const favJson = await favResp.json().catch(() => ({}));
      setFaviconGenerating(false);
      if (!favResp.ok || favJson?.error) {
        setError(favJson?.error || "Favicon generation failed");
        return;
      }
      if (favJson?.favicon32) setLogoFaviconUrl(String(favJson.favicon32));
      if (favJson?.appleTouchIcon) setAppleTouchIconUrl(String(favJson.appleTouchIcon));
      setInfo("Logo uploaded and favicons generated");

      // Live theme update for current session
      try {
        window.dispatchEvent(new CustomEvent("pp:theme:updated", {
          detail: {
            primaryColor,
            secondaryColor: accentColor,
            brandFaviconUrl: String(favJson?.favicon32 || logoFaviconUrl),
            brandLogoUrl: uploadedUrl || logoAppUrl,
            appleTouchIconUrl: String(favJson?.appleTouchIcon || appleTouchIconUrl),
            brandLogoShape,
          }
        }));
      } catch { }

      try { await refetch(); } catch { }
    } catch (e: any) {
      setFaviconGenerating(false);
      setError(e?.message || "Upload or favicon generation failed");
    }
  }

  async function save() {
    try {
      setSaving(true);
      setError("");
      setInfo("");
      const body: any = {};
      if (appUrl) body.appUrl = appUrl;
      body.partnerFeeBps = Math.max(0, Math.min(10000, Math.floor(Number(partnerFeeBps || 0))));
      body.platformFeeBps = Math.max(0, Math.min(10000, Math.floor(Number(platformFeeBps || 50))));
      body.defaultMerchantFeeBps = Math.max(0, Math.min(10000, Math.floor(Number(defaultMerchantFeeBps || 0))));
      if (partnerWallet) body.partnerWallet = partnerWallet;
      // Theme fields
      if (brandDisplayName.trim()) body.name = brandDisplayName.trim();
      body.colors = { primary: primaryColor || "#0ea5e9", accent: accentColor || undefined };
      body.logos = {
        ...(logoAppUrl ? { app: logoAppUrl } : {}),
        ...(logoFaviconUrl ? { favicon: logoFaviconUrl } : {}),
        ...(logoSymbolUrl ? { symbol: logoSymbolUrl } : {}),
        ...(socialDefaultUrl ? { socialDefault: socialDefaultUrl } : {}),
      };
      body.meta = {
        ...(ogTitle ? { ogTitle } : {}),
        ...(ogDescription ? { ogDescription } : {}),
      };
      let r: Response;
      let j: any;
      const isPortalPay = String(brand.key || "").toLowerCase() === "portalpay" || String(brand.key || "").toLowerCase() === "basaltsurge";

      if (isPortalPay) {
        // Determine platform recipient upfront for this PortalPay container
        const recipientEnv = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "").toLowerCase();
        const effectiveRecipient = String((partnerWallet || recipientEnv) || "").toLowerCase();

        // Map branding fields back into site config shape
        const payload: any = {};
        const effectiveAppUrl = body.appUrl || (typeof window !== "undefined" ? window.location.origin : "");
        if (effectiveAppUrl) payload.appUrl = effectiveAppUrl;
        payload.partnerFeeBps = body.partnerFeeBps;
        payload.defaultMerchantFeeBps = body.defaultMerchantFeeBps;
        // For PortalPay, partnerWallet should be the platform recipient address
        payload.partnerWallet = effectiveRecipient;

        const theme: any = {};
        if (body.name) theme.brandName = body.name;
        if (body.colors?.primary) theme.primaryColor = body.colors.primary;
        if (body.colors?.accent) theme.secondaryColor = body.colors.accent;
        if (body.logos?.app) theme.brandLogoUrl = body.logos.app;
        if (body.logos?.favicon) theme.brandFaviconUrl = body.logos.favicon;
        // Persist symbol logo under theme.logos.symbol for PortalPay site config
        if (body.logos?.symbol) {
          theme.logos = { ...(theme.logos || {}), symbol: body.logos.symbol };
        }
        if ((body.logos as any)?.socialDefault) {
          theme.logos = { ...(theme.logos || {}), socialDefault: (body.logos as any).socialDefault };
        }
        if (appleTouchIconUrl) theme.appleTouchIconUrl = appleTouchIconUrl;
        if (body.meta) theme.meta = body.meta;
        theme.brandLogoShape = brandLogoShape;
        if (Object.keys(theme).length > 0) payload.theme = theme;

        const walletParam = effectiveRecipient ? `?wallet=${encodeURIComponent(effectiveRecipient)}` : "";
        r = await fetch(`/api/site/config${walletParam}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-wallet": effectiveRecipient || "" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        j = await r.json().catch(() => ({}));
      } else {
        r = await fetch(`/api/platform/brands/${encodeURIComponent(brand.key)}/config`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        j = await r.json().catch(() => ({}));
      }

      if (!r.ok || j?.error) {
        setError(j?.error || "Failed to save brand");
        return;
      }
      setInfo("Brand updated");
      // Immediately update runtime theme for current session
      try {
        window.dispatchEvent(new CustomEvent("pp:theme:updated", {
          detail: {
            primaryColor,
            secondaryColor: accentColor,
            brandFaviconUrl: logoFaviconUrl,
            brandLogoUrl: logoAppUrl,
            appleTouchIconUrl,
            brandLogoShape,
          }
        }));
      } catch { }
      // Also refresh ThemeContext cache
      try { await refetch(); } catch { }
      // Refresh effective snapshot in panel
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to save brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-pane rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Branding</h2>
        <span className="microtext text-muted-foreground">Brand Key: {brand.key}</span>
      </div>
      {loading ? (
        <div className="microtext text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="microtext text-muted-foreground">App URL</label>
              <input
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                placeholder="https://partner.example.com"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
              />
              <div className="microtext text-muted-foreground mt-1">
                Custom domain base URL used in metadata, docs, and CTAs.
              </div>
            </div>
            <div>
              <label className="microtext text-muted-foreground">Partner Fee (bps)</label>
              <input
                type="number"
                min={0}
                max={10000}
                step={1}
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                value={partnerFeeBps}
                onChange={(e) => setPartnerFeeBps(Math.max(0, Math.min(10000, Math.floor(Number(e.target.value || 0)))))}
                disabled={isPartnerContainer && (Boolean(containerAppName) || Boolean(containerFqdn) || Boolean(containerState))}
                title={isPartnerContainer && (Boolean(containerAppName) || Boolean(containerFqdn) || Boolean(containerState)) ? "Fees locked after deploy" : undefined}
              />
              <div className="microtext text-muted-foreground mt-1">
                Partner share in basis points (e.g., 25 = 0.25%).
                {isPartnerContainer && (containerAppName || containerFqdn || containerState) ? (
                  <span className="text-amber-600"> • Locked after partner container deploy</span>
                ) : null}
              </div>
            </div>
            <div>
              <label className="microtext text-muted-foreground">Platform Fee (bps)</label>
              <input
                type="number"
                min={0}
                max={10000}
                step={1}
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                value={platformFeeBps}
                onChange={(e) => setPlatformFeeBps(Math.max(0, Math.min(10000, Math.floor(Number(e.target.value || 0)))))}
                disabled={isPartnerContainer}
                title={isPartnerContainer ? "Read-only in partner containers" : undefined}
              />
              <div className="microtext text-muted-foreground mt-1">
                Platform share in basis points (e.g., 50 = 0.5%). Defaults to 50 bps unless overridden here.
                {isPartnerContainer ? (
                  <span className="text-amber-600"> • Read-only in partner containers</span>
                ) : null}
              </div>
            </div>
            <div>
              <label className="microtext text-muted-foreground">Default Merchant Fee (bps)</label>
              <input
                type="number"
                min={0}
                max={10000}
                step={1}
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                value={defaultMerchantFeeBps}
                onChange={(e) => setDefaultMerchantFeeBps(Math.max(0, Math.min(10000, Math.floor(Number(e.target.value || 0)))))}
              />
              <div className="microtext text-muted-foreground mt-1">
                Default add‑on charged by merchants when not explicitly configured.
              </div>
            </div>
            <div>
              <label className="microtext text-muted-foreground">Partner Wallet (optional)</label>
              <input
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background font-mono"
                placeholder="0x…"
                value={partnerWallet}
                onChange={(e) => setPartnerWallet(e.target.value)}
              />
              <div className="microtext text-muted-foreground mt-1">
                Wallet to receive the partner share in split payouts (if applicable).
              </div>
            </div>

            {/* Theme Controls */}
            <div>
              <label className="microtext text-muted-foreground">Brand Name</label>
              <input
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                placeholder="e.g., Acme Pay"
                value={brandDisplayName}
                onChange={(e) => setBrandDisplayName(e.target.value)}
              />
              <div className="microtext text-muted-foreground mt-1">
                Display name shown across receipts, portal, and admin surfaces.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="microtext text-muted-foreground">Primary Color</label>
                <input
                  type="color"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
              <div>
                <label className="microtext text-muted-foreground">Accent Color</label>
                <input
                  type="color"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>
            {/* Logo shape selector */}
            <div>
              <label className="microtext text-muted-foreground">Logo Shape</label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  className={`px-2 py-1 rounded-md border text-xs ${brandLogoShape === "square" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                  onClick={() => setBrandLogoShape("square")}
                  title="Square mask"
                >
                  Square
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 rounded-md border text-xs ${brandLogoShape === "round" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                  onClick={() => setBrandLogoShape("round")}
                  title="Round mask"
                >
                  Round
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 rounded-md border text-xs ${brandLogoShape === "unmasked" ? "bg-foreground/10 border-foreground/20" : "hover:bg-foreground/5"}`}
                  onClick={() => setBrandLogoShape("unmasked")}
                  title="Logo only (no text in navbar)"
                >
                  Unmasked (logo only)
                </button>
              </div>
              <div className="microtext text-muted-foreground mt-1">
                Controls how the logo is masked in nav/receipts. "Unmasked" removes navbar text.
              </div>
            </div>

            <div>
              <ImageUploadField
                label="App Logo"
                value={logoAppUrl}
                onChange={(v) => setLogoAppUrl(String(v))}
                target="brand_logo_app"
                guidance="Recommended: PNG/WebP, 256×256 or larger"
                previewSize={112}
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="h-9"
                />
                <button
                  type="button"
                  onClick={uploadLogoAndFavicon}
                  className="px-3 py-1.5 rounded-md border text-sm"
                  disabled={faviconGenerating}
                  title="Upload logo and auto-generate favicons"
                >
                  {faviconGenerating ? "Generating…" : "Upload & Generate Favicon"}
                </button>
              </div>
              <div className="microtext text-muted-foreground mt-1">
                Upload a logo and auto-generate favicon and Apple touch icons from it.
              </div>
            </div>
            <div>
              <ImageUploadField
                label="Favicon"
                value={logoFaviconUrl}
                onChange={(v) => setLogoFaviconUrl(String(v))}
                target="logo_favicon"
                guidance="PNG/ICO recommended; 16×16 and 32×32. PNG will be converted to ICO automatically."
                previewSize={32}
              />
            </div>
            <div>
              <ImageUploadField
                label="Symbol Logo"
                value={logoSymbolUrl}
                onChange={(v) => setLogoSymbolUrl(String(v))}
                target="brand_logo_symbol"
                guidance="Recommended: square PNG/WebP, 128–256"
                previewSize={64}
              />
              <div className="mt-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border text-xs"
                  onClick={() => setLogoSymbolUrl(logoAppUrl || logoSymbolUrl)}
                  title="Use App Logo as Symbol"
                >
                  Use App Logo as Symbol
                </button>
              </div>
            </div>
            <div>
              <ImageUploadField
                label="Default Social Image"
                value={socialDefaultUrl}
                onChange={(v) => setSocialDefaultUrl(String(v))}
                target="brand_social_default"
                guidance="Recommended: 1200×630 PNG/JPG"
                previewSize={140}
              />
              <div className="mt-3">
                <div className="microtext text-muted-foreground mb-1">Current social image preview</div>
                {socialDefaultUrl ? (
                  <img
                    src={socialDefaultUrl}
                    alt="Social image preview"
                    className="w-full max-w-md border rounded-md"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">No default social image set. In partner containers a generative fallback will be used automatically for OG/Twitter images.</div>
                )}
              </div>
            </div>
            <div>
              <ImageUploadField
                label="Apple Touch Icon"
                value={appleTouchIconUrl}
                onChange={(v) => setAppleTouchIconUrl(String(v))}
                target="apple_touch_icon"
                guidance="Recommended: 180×180 PNG"
                previewSize={64}
              />
            </div>
            <div>
              <label className="microtext text-muted-foreground">OG Title</label>
              <input
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                placeholder="Acme Pay"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="microtext text-muted-foreground">OG Description</label>
              <input
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                placeholder="High‑risk payments & portals"
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
              />
            </div>

            {/* Container status snapshot */}
            <div className="md:col-span-2 rounded-md border p-3">
              <div className="text-sm font-medium">Container Deployment</div>
              <div className="microtext text-muted-foreground mt-1">
                Name: {containerAppName || "—"} • FQDN: {containerFqdn || "—"} • State: {containerState || "—"}
              </div>
              <div className="microtext text-muted-foreground mt-1">
                Use Partners panel to generate a provision plan or manage lifecycle actions (pause/restart/update).
              </div>
            </div>
          </div>
          {error && <div className="microtext text-red-500">{error}</div>}
          {info && <div className="microtext text-green-600">{info}</div>}
          <div className="flex items-center justify-end">
            <button className="px-3 py-1.5 rounded-md border text-sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save Branding"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
