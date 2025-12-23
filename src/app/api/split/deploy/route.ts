import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireApimOrJwt } from "@/lib/gateway-auth";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf } from "@/lib/security";
import { getBrandKey, applyBrandDefaults } from "@/config/brands";
import { isPartnerContext, getSanitizedSplitBps } from "@/lib/env";

/**
 * Per-merchant Split configuration API.
 *
 * POST:
 *  - Idempotently persists a per-merchant splitAddress and recipients in the site config doc partitioned by merchant wallet.
 *  - If splitAddress is already set, returns it.
 *  - If splitAddress is provided in the request body, validates and saves it along with recipients.
 *  - If splitAddress is not provided, persists recipients and returns degraded=true (deployment not implemented in this route).
 *
 * GET:
 *  - Returns the split configuration for a merchant wallet (address + recipients).
 *
 * Notes:
 *  - This route does NOT deploy contracts on-chain. It persists metadata needed by the portal to route payments to the split.
 *  - Contract deployment can be implemented in a future iteration using Thirdweb or a compiled PaymentSplitter artifact.
 */

function getDocId(brandKey?: string): string {
  // Legacy splits (no brand) use base doc ID
  if (!brandKey) return "site:config";
  // Brand-scoped splits use prefixed doc ID
  return `site:config:${brandKey}`;
}

function isHexAddress(addr?: string): addr is `0x${string}` {
  try {
    return !!addr && /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim());
  } catch {
    return false;
  }
}

// Special-case brand aliasing for containers whose subdomain differs from intended brand key
function aliasBrandKey(k?: string): string {
  const key = String(k || "").toLowerCase();
  return key === "icunow" ? "icunow-store" : key;
}

function toBps(percent: number): number {
  // Convert percent (e.g., 0.5) to basis points (e.g., 50)
  const v = Math.max(0, Math.min(100, Number(percent)));
  return Math.round(v * 100);
}

function resolveOrigin(req: NextRequest): string {
  try {
    const xfProto = req.headers.get("x-forwarded-proto");
    const xfHost = req.headers.get("x-forwarded-host");
    const host = req.headers.get("host");
    const proto = xfProto || (process.env.NODE_ENV === "production" ? "https" : "http");
    const h = xfHost || host || "";
    if (h && h !== "0.0.0.0") return `${proto}://${h}`;
    const app = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
    if (app) return app.replace(/\/+$/, "");
    return new URL(req.url).origin; // last resort
  } catch {
    const app = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
    return app ? app.replace(/\/+$/, "") : new URL(req.url).origin;
  }
}

/** Clamp a number to [0,10000] basis points */
function clampBps(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10000, Math.floor(n)));
}

/** Resolve platform shares bps using brand overrides, brand config, env, or defaults.
 * No longer using static BRANDS map - all brand data should come from Cosmos DB via /api/platform/brands/{key}/config
 */
function resolvePlatformBpsFromBrand(bKey: string | undefined, brand: any, overrides?: any): number {
  try {
    const sanitized = getSanitizedSplitBps();
    const envPlat = typeof sanitized?.platform === "number" ? clampBps(sanitized.platform) : 0;
    const basePlat =
      typeof (overrides as any)?.platformFeeBps === "number"
        ? clampBps((overrides as any).platformFeeBps)
        : (typeof brand?.platformFeeBps === "number" ? clampBps(brand.platformFeeBps) : 0);
    const defaultPlat = 50;
    return basePlat > 0 ? basePlat : (envPlat > 0 ? envPlat : defaultPlat);
  } catch {
    return 50;
  }
}

export async function GET(req: NextRequest) {
  try {
    let caller: any;
    try {
      caller = await requireApimOrJwt(req, ["split:read"]);
    } catch (e: any) {
      // Fallback: allow x-wallet header for read access (consistent with POST)
      const xw = req.headers.get("x-wallet");
      if (xw && /^0x[a-fA-F0-9]{40}$/.test(xw)) {
        caller = { wallet: xw };
      } else {
        // Fallback: unauthenticated preview synthesis for partner containers
        try {
          const url = new URL(req.url);
          const forwardedHost = req.headers.get("x-forwarded-host");
          const hostHeader = forwardedHost || req.headers.get("host") || "";
          const host = hostHeader || url.hostname || "";
          // Resolve brandKey similar to authenticated path
          let bKey: string | undefined = url.searchParams.get("brandKey") || undefined;
          if (!bKey && host.endsWith(".azurewebsites.net")) {
            const parts = host.split(".");
            if (parts.length >= 3) bKey = aliasBrandKey(parts[0].toLowerCase());
          }
          if (!bKey) {
            try { bKey = getBrandKey(); } catch { bKey = undefined; }
          }
          const origin = resolveOrigin(req);
          let brand: any = {};
          let overrides: any = {};
          if (bKey) {
            try {
              const r = await fetch(`${origin}/api/platform/brands/${encodeURIComponent(bKey)}/config`, { cache: "no-store" });
              const j = await r.json().catch(() => ({}));
              brand = j?.brand || {};
              overrides = j?.overrides || {};
            } catch { }
          }
          const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
          const envPartnerWallet = String(process.env.PARTNER_WALLET || "").toLowerCase();
          const partnerWallet = String((overrides as any)?.partnerWallet || brand?.partnerWallet || envPartnerWallet || "").toLowerCase();
          const sanitized = getSanitizedSplitBps();
          const envPartnerBps = typeof sanitized?.partner === "number" ? Math.max(0, Math.min(10000, sanitized.partner)) : 0;
          const basePartnerBps = typeof (overrides as any)?.partnerFeeBps === "number"
            ? Math.max(0, Math.min(10000, (overrides as any).partnerFeeBps))
            : (typeof brand?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand.partnerFeeBps)) : 0);
          const fallbackPartnerBps = 0;
          const defaultPartnerBps = 50;
          const partnerFeeBps = basePartnerBps > 0
            ? basePartnerBps
            : (envPartnerBps > 0
              ? envPartnerBps
              : ((fallbackPartnerBps && fallbackPartnerBps > 0) ? Math.max(0, Math.min(10000, fallbackPartnerBps)) : defaultPartnerBps));
          const platformSharesBps = resolvePlatformBpsFromBrand(bKey, brand, overrides);
          const isPartnerBrand = !!bKey && bKey !== "portalpay";
          // Use merchant from query param only for unauthenticated preview
          const urlWallet = new URL(req.url);
          const queryWallet = String(urlWallet.searchParams.get("wallet") || "").toLowerCase();
          const mWallet = /^0x[a-f0-9]{40}$/i.test(queryWallet) ? queryWallet : "" as any;
          const split: any = { address: undefined, recipients: [] as any[] };
          try {
            console.log("[split/deploy] unauthenticated_preview", { brandKey: bKey, partnerWallet, partnerFeeBps, platformRecipient, wallet: mWallet });
          } catch { }
          if (isPartnerBrand && /^0x[a-f0-9]{40}$/i.test(platformRecipient) && /^0x[a-f0-9]{40}$/i.test(partnerWallet) && partnerFeeBps > 0 && /^0x[a-f0-9]{40}$/i.test(mWallet)) {
            const partnerShares = Math.max(0, Math.min(10000 - platformSharesBps, partnerFeeBps));
            const merchantShares = Math.max(0, 10000 - platformSharesBps - partnerShares);
            split.recipients = [
              { address: mWallet as `0x${string}`, sharesBps: merchantShares },
              { address: partnerWallet as `0x${string}`, sharesBps: partnerShares },
              { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
            ];
            return NextResponse.json({ split, brandKey: bKey, requiresDeploy: true, reason: "unauthenticated_preview" });
          }
          return NextResponse.json({ split, brandKey: bKey, requiresDeploy: true, reason: "partner_config_missing" });
        } catch (e: any) {
          return NextResponse.json({ error: e?.message || "unauthorized" }, { status: e?.status || 401 });
        }
      }
    }
    // Allow explicit wallet override via query param for split preview on partner portals
    // Falls back to authenticated wallet if query param is not a valid hex address.
    const urlWallet = new URL(req.url);
    const queryWallet = String(urlWallet.searchParams.get("wallet") || "").toLowerCase();
    const wallet = ((/^0x[a-f0-9]{40}$/i.test(queryWallet) ? queryWallet : String(caller.wallet || ""))).toLowerCase() as `0x${string}`;

    // Get brand from query param for brand-scoped lookups
    const url = new URL(req.url);
    const forwardedHost = req.headers.get("x-forwarded-host");
    const hostHeader = forwardedHost || req.headers.get("host") || "";
    const host = hostHeader || url.hostname || "";
    let brandKey: string | undefined = url.searchParams.get("brandKey") || undefined;
    if (!brandKey && host.endsWith(".azurewebsites.net")) {
      const parts = host.split(".");
      if (parts.length >= 3) brandKey = aliasBrandKey(parts[0].toLowerCase());
    }
    if (!brandKey) {
      try {
        brandKey = getBrandKey();
      } catch {
        brandKey = undefined;
      }
    }
    try { console.log("[split/deploy] brandKeyResolved", { brandKey, host }); } catch { }
    try { console.log("[split/deploy] originResolved", { origin: resolveOrigin(req) }); } catch { }

    const c = await getContainer();

    // ALWAYS check legacy doc first for ALL brands (legacy docs may exist without brandKey)
    // This ensures backwards compatibility for merchants created before brand-scoping
    let legacyDoc: any | undefined;
    try {
      const { resource } = await c.item("site:config", wallet).read<any>();
      if (resource) {
        legacyDoc = resource;
      }
    } catch {
      // Legacy doc not found
    }

    // For platform/portalpay brand OR when legacy doc exists with splitAddress, use legacy handling
    if (legacyDoc && (legacyDoc.splitAddress || legacyDoc.split?.address) && (!brandKey || String(brandKey).toLowerCase() === "portalpay")) {
      const resource = legacyDoc;
      // Legacy doc found with split data
      const split = resource?.split || (resource?.splitAddress ? { address: resource.splitAddress } : undefined);
      // IMPORTANT: Honor the requested brandKey parameter over the stored legacy brandKey
      // This fixes the issue where merchants with legacy xoinpay docs get wrong brandKey on paynex
      const payload: any = { split: (split ? { ...(split as any), brandKey: String(brandKey || resource?.brandKey || "").toLowerCase() } : split), brandKey: brandKey || resource?.brandKey, legacy: true };
          try {
            const origin = resolveOrigin(req);
            const bKey = String(resource?.brandKey || brandKey || "").toLowerCase();
            const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
            if (bKey && bKey !== "portalpay") {
              const bRes = await fetch(`${origin}/api/platform/brands/${encodeURIComponent(bKey)}/config`, { cache: "no-store" });
              const bj = await bRes.json().catch(() => ({}));
              const brand = bj?.brand || {};
              const overrides = bj?.overrides || {};
              const envPartnerWallet = String(process.env.PARTNER_WALLET || "").toLowerCase();
              const partnerEffective = String((overrides as any)?.partnerWallet || brand?.partnerWallet || envPartnerWallet || "").toLowerCase();
              const sanitized = getSanitizedSplitBps();
              const envPartnerBps = typeof sanitized?.partner === "number" ? Math.max(0, Math.min(10000, sanitized.partner)) : 0;
              const basePartnerBps = typeof (overrides as any)?.partnerFeeBps === "number"
                ? Math.max(0, Math.min(10000, (overrides as any).partnerFeeBps))
                : (typeof brand?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand.partnerFeeBps)) : 0);
              const fallbackPartnerBps = 0;
              const defaultPartnerBps = 50;
              const partnerBps = basePartnerBps > 0
                ? basePartnerBps
                : (envPartnerBps > 0
                  ? envPartnerBps
                  : ((fallbackPartnerBps && fallbackPartnerBps > 0)
                    ? Math.max(0, Math.min(10000, fallbackPartnerBps))
                    : defaultPartnerBps));
              // In partner containers, require at least 3 recipients when a split address exists
              const baseExpected = /^0x[a-f0-9]{40}$/i.test(partnerEffective) && partnerBps > 0 ? 3 : 2;
              const expected = isPartnerContext() ? Math.max(baseExpected, 3) : baseExpected;
              try { console.log("[split/deploy] calc", { bKey, partnerWallet: partnerEffective, partnerBps, expected }); } catch { }
              const actual = Array.isArray((split as any)?.recipients) ? (split as any).recipients.length : 0;
          if (((split as any)?.address && actual < expected)) {
            payload.misconfiguredSplit = {
              expectedRecipients: expected,
              actualRecipients: actual,
              reason: "missing_partner_recipient",
              needsRedeploy: true,
              brandKey: bKey,
            };
            // Synthesize a correct 3-recipient preview for partner brands without modifying storage
            try {
              const platformSharesBps = resolvePlatformBpsFromBrand(bKey, brand, overrides);
              if (isHexAddress(platformRecipient) && isHexAddress(partnerEffective) && partnerBps > 0) {
                const partnerSharesBps = Math.max(0, Math.min(10000 - platformSharesBps, partnerBps));
                const merchantSharesBps = Math.max(0, 10000 - platformSharesBps - partnerSharesBps);
                const recipientsPreview = [
                  { address: wallet, sharesBps: merchantSharesBps },
                  { address: partnerEffective as `0x${string}`, sharesBps: partnerSharesBps },
                  { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
                ];
                if (!payload.split) {
                  payload.split = { address: (split as any)?.address, recipients: recipientsPreview };
                } else {
                  (payload.split as any).recipients = recipientsPreview;
                }
              }
            } catch {}
          }
            }
          } catch { }
          try {
            const origin2 = resolveOrigin(req);
            const bKey2 = String(resource?.brandKey || brandKey || "").toLowerCase();
            let brand2: any = {};
            let overrides2: any = {};
            if (bKey2) {
              try {
                const bRes2 = await fetch(`${origin2}/api/platform/brands/${encodeURIComponent(bKey2)}/config`, { cache: "no-store" });
                const bj2 = await bRes2.json().catch(() => ({}));
                brand2 = bj2?.brand || {};
                overrides2 = bj2?.overrides || {};
              } catch { }
            }
            const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
            if (isHexAddress(platformRecipient)) {
              const envPartnerWallet = String(process.env.PARTNER_WALLET || "").toLowerCase();
              const partnerWallet2 = String((overrides2 as any)?.partnerWallet || brand2?.partnerWallet || resource?.partnerWallet || envPartnerWallet || "").toLowerCase();
              const basePartnerBps2 = typeof (overrides2 as any)?.partnerFeeBps === "number"
                ? Math.max(0, Math.min(10000, (overrides2 as any).partnerFeeBps))
                : (typeof brand2?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand2.partnerFeeBps)) : 0);
              const sanitized2 = getSanitizedSplitBps();
              const envPartnerBps2 = typeof sanitized2?.partner === "number" ? Math.max(0, Math.min(10000, sanitized2.partner)) : 0;
              const fallbackPartnerBps2 = 0;
              const defaultPartnerBps2 = 50;
              const partnerFeeBps2 = basePartnerBps2 > 0
                ? basePartnerBps2
                : (envPartnerBps2 > 0
                  ? envPartnerBps2
                  : ((fallbackPartnerBps2 && fallbackPartnerBps2 > 0)
                    ? Math.max(0, Math.min(10000, fallbackPartnerBps2))
                    : defaultPartnerBps2));
              try {
                console.log("[split/deploy] inputs", {
                  brandKey: bKey2,
                  partnerWallet: partnerWallet2,
                  partnerFeeBps: partnerFeeBps2,
                  platformRecipient,
                  source: { overrides: !!overrides2, brand: !!brand2 }
                });
              } catch { }
              const platformSharesBps = resolvePlatformBpsFromBrand(bKey2, brand2, overrides2);
              const isPartnerBrand2 = bKey2 !== "portalpay";
              if (isPartnerBrand2) {
                if (isHexAddress(partnerWallet2) && partnerFeeBps2 > 0) {
                  const partnerSharesBps2 = Math.max(0, Math.min(10000 - platformSharesBps, partnerFeeBps2));
                  const merchantSharesBps2 = Math.max(0, 10000 - platformSharesBps - partnerSharesBps2);
                  const recipients2 = [
                    { address: wallet, sharesBps: merchantSharesBps2 },
                    { address: partnerWallet2 as `0x${string}`, sharesBps: partnerSharesBps2 },
                    { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
                  ];
                  if (!payload.split) payload.split = { address: undefined, recipients: recipients2 };
                  else {
                    const existingCount = Array.isArray((payload.split as any).recipients) ? ((payload.split as any).recipients || []).length : 0;
                    // Override preview recipients when misconfigured (e.g., only 2 recipients) to show expected partner+platform
                    if (existingCount === 0 || existingCount < 3) {
                      (payload.split as any).recipients = recipients2;
                    }
                  }
                  const hasAddress = !!((payload as any).split?.address) && /^0x[a-f0-9]{40}$/i.test(String((payload as any).split.address));
                  if (!hasAddress) {
                    (payload as any).requiresDeploy = true;
                    (payload as any).reason = "no_split_for_partner_brand";
                  } else {
                    (payload as any).requiresDeploy = false;
                    (payload as any).reason = undefined;
                  }
                } else {
                  (payload as any).requiresDeploy = true;
                  (payload as any).reason = "partner_config_missing";
                  if (!payload.split) payload.split = { address: undefined, recipients: [] };
                  else if (!Array.isArray((payload.split as any).recipients) || ((payload.split as any).recipients || []).length === 0) {
                    (payload.split as any).recipients = [];
                  } else {
                    (payload.split as any).recipients = [];
                  }
                }
              } else {
                // Platform container: synthesize merchant + platform
                const merchantSharesBps2 = Math.max(0, 10000 - platformSharesBps);
                const recipients2 = [
                  { address: wallet, sharesBps: merchantSharesBps2 },
                  { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
                ];
                if (!payload.split) payload.split = { address: undefined, recipients: recipients2 };
                else {
                  const existingCount = Array.isArray((payload.split as any).recipients) ? ((payload.split as any).recipients || []).length : 0;
                  // Override preview recipients when misconfigured (e.g., only 2 recipients) to show expected partner+platform
                  if (existingCount === 0 || existingCount < 3) {
                    (payload.split as any).recipients = recipients2;
                  }
                }
              }
            }
          } catch { }
      return NextResponse.json(payload);
    }

    // Try brand-scoped doc
    const docId = getDocId(brandKey);
    try {
      const { resource } = await c.item(docId, wallet).read<any>();
      const split = resource?.split || (resource?.splitAddress ? { address: resource.splitAddress } : undefined);
      // IMPORTANT: Honor the requested brandKey parameter over the stored brandKey
      const payload: any = { split: (split ? { ...(split as any), brandKey: String(brandKey || resource?.brandKey || "").toLowerCase() } : split), brandKey: brandKey || resource?.brandKey };
      try {
        const origin = resolveOrigin(req);
        const bKey = String(resource?.brandKey || brandKey || "").toLowerCase();
        if (bKey && bKey !== "portalpay") {
          const bRes = await fetch(`${origin}/api/platform/brands/${encodeURIComponent(bKey)}/config`, { cache: "no-store" });
          const bj = await bRes.json().catch(() => ({}));
          const brand = bj?.brand || {};
          const overrides3 = bj?.overrides || {};
          const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
          const envPartnerWallet = String(process.env.PARTNER_WALLET || "").toLowerCase();
          const partnerEffective = String((overrides3 as any)?.partnerWallet || brand?.partnerWallet || envPartnerWallet || "").toLowerCase();
          const sanitized3 = getSanitizedSplitBps();
          const envPartnerBps3 = typeof sanitized3?.partner === "number" ? Math.max(0, Math.min(10000, sanitized3.partner)) : 0;
          const basePartnerBps3 = typeof (overrides3 as any)?.partnerFeeBps === "number"
            ? Math.max(0, Math.min(10000, (overrides3 as any).partnerFeeBps))
            : (typeof brand?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand.partnerFeeBps)) : 0);
          const fallbackPartnerBps3 = 0;
          const defaultPartnerBps3 = 50;
          const partnerBps = basePartnerBps3 > 0
            ? basePartnerBps3
            : (envPartnerBps3 > 0
              ? envPartnerBps3
              : ((fallbackPartnerBps3 && fallbackPartnerBps3 > 0)
                ? Math.max(0, Math.min(10000, fallbackPartnerBps3))
                : defaultPartnerBps3));
          try {
            console.log("[split/deploy] brand-scoped", {
              brandKey: bKey,
              partnerWallet: partnerEffective,
              partnerFeeBps: partnerBps,
              source: { overrides: !!overrides3, brand: !!brand }
            });
          } catch { }
          const baseExpected = /^0x[a-f0-9]{40}$/i.test(partnerEffective) && partnerBps > 0 ? 3 : 2;
          const expected = isPartnerContext() ? Math.max(baseExpected, 3) : baseExpected;
          const actual = Array.isArray((split as any)?.recipients) ? (split as any).recipients.length : 0;
          if (((split as any)?.address && actual < expected)) {
            payload.misconfiguredSplit = {
              expectedRecipients: expected,
              actualRecipients: actual,
              reason: "missing_partner_recipient",
              needsRedeploy: true,
              brandKey: bKey,
            };
            // Synthesize a correct 3-recipient preview for partner brands without modifying storage
            try {
              const platformSharesBps = resolvePlatformBpsFromBrand(bKey, brand, overrides3);
              if (isHexAddress(platformRecipient) && isHexAddress(partnerEffective) && partnerBps > 0) {
                const partnerSharesBps = Math.max(0, Math.min(10000 - platformSharesBps, partnerBps));
                const merchantSharesBps = Math.max(0, 10000 - platformSharesBps - partnerSharesBps);
                const recipientsPreview = [
                  { address: wallet, sharesBps: merchantSharesBps },
                  { address: partnerEffective as `0x${string}`, sharesBps: partnerSharesBps },
                  { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
                ];
                if (!payload.split) {
                  payload.split = { address: (split as any)?.address, recipients: recipientsPreview };
                } else {
                  (payload.split as any).recipients = recipientsPreview;
                }
              }
            } catch {}
          }
          // Validate platform recipient presence and shares against expected platform bps
          try {
            const recs = Array.isArray((split as any)?.recipients) ? (split as any).recipients : [];
            const expectedPlatformBps = resolvePlatformBpsFromBrand(bKey, brand, overrides3);
            const platAddr = String(platformRecipient).toLowerCase();
            const platRec = recs.find((r: any) => String(r?.address || "").toLowerCase() === platAddr);
            const actualPlatBps = clampBps(Number(platRec?.sharesBps || 0));
            if ((split as any)?.address) {
              if (!platRec) {
                payload.misconfiguredSplit = {
                  expectedRecipients: Math.max(3, expected),
                  actualRecipients: actual,
                  reason: "missing_platform_recipient",
                  needsRedeploy: true,
                  brandKey: bKey,
                  expectedPlatformBps,
                };
              } else if (actualPlatBps !== expectedPlatformBps) {
                payload.misconfiguredSplit = {
                  expectedRecipients: expected,
                  actualRecipients: actual,
                  reason: "platform_bps_mismatch",
                  needsRedeploy: true,
                  brandKey: bKey,
                  expectedPlatformBps,
                  actualPlatformBps: actualPlatBps,
                };
              }
            }
          } catch { }
        }
      } catch { }
      // If no recipients are persisted yet (no split deployed or empty doc), synthesize brand-default recipients
      // so client UIs (Paynex/DigiBazaar) can render the correct expected split preview.
      try {
        const origin2 = resolveOrigin(req);
        const bKey2 = String(resource?.brandKey || brandKey || "").toLowerCase();
        let brand2: any = {};
        if (bKey2) {
          try {
            const bRes2 = await fetch(`${origin2}/api/platform/brands/${encodeURIComponent(bKey2)}/config`, { cache: "no-store" });
            const bj2 = await bRes2.json().catch(() => ({}));
            brand2 = bj2?.brand || {};
          } catch { }
        }
        const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
        if (isHexAddress(platformRecipient)) {
          const envPartnerWallet = String(process.env.PARTNER_WALLET || "").toLowerCase();
          const partnerWallet2 = String(brand2?.partnerWallet || resource?.partnerWallet || envPartnerWallet || "").toLowerCase();
          const envPartnerSplitRaw2 = String(process.env.PARTNER_SPLIT_BPS || "").trim();
          const partnerFeeBps2 = (() => {
            const base = typeof brand2?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand2.partnerFeeBps)) : 0;
            const envBps = envPartnerSplitRaw2 ? Math.max(0, Math.min(10000, Number(envPartnerSplitRaw2))) : 0;
            return base > 0 ? base : (isPartnerContext() ? envBps : base);
          })();
          const platformSharesBps = resolvePlatformBpsFromBrand(bKey2, brand2, undefined);
          const isPartnerBrand2 = bKey2 !== "portalpay";
          if (isPartnerBrand2) {
            if (isHexAddress(partnerWallet2) && partnerFeeBps2 > 0) {
              const partnerSharesBps2 = Math.max(0, Math.min(10000 - platformSharesBps, partnerFeeBps2));
              const merchantSharesBps2 = Math.max(0, 10000 - platformSharesBps - partnerSharesBps2);
              const recipients2 = [
                { address: wallet, sharesBps: merchantSharesBps2 },
                { address: partnerWallet2 as `0x${string}`, sharesBps: partnerSharesBps2 },
                { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
              ];
              const hasAddress = !!((payload as any).split?.address) && /^0x[a-f0-9]{40}$/i.test(String((payload as any).split.address));
              if (!hasAddress) {
                if (!payload.split) payload.split = { address: undefined, recipients: recipients2 };
                else if (!Array.isArray((payload.split as any).recipients) || ((payload.split as any).recipients || []).length === 0) {
                  (payload.split as any).recipients = recipients2;
                }
                (payload as any).requiresDeploy = true;
                (payload as any).reason = "no_split_for_partner_brand";
              } else {
                // Address exists; do not override recipients. Use persisted recipients only.
                (payload as any).requiresDeploy = false;
                (payload as any).reason = undefined;
              }
            } else {
              (payload as any).requiresDeploy = true;
              (payload as any).reason = "partner_config_missing";
              if (!payload.split) payload.split = { address: undefined, recipients: [] };
              else if (!Array.isArray((payload.split as any).recipients) || ((payload.split as any).recipients || []).length === 0) {
                (payload.split as any).recipients = [];
              } else {
                (payload.split as any).recipients = [];
              }
            }
          } else {
            // Platform container: synthesize merchant + platform
            const merchantSharesBps2 = Math.max(0, 10000 - platformSharesBps);
            const recipients2 = [
              { address: wallet, sharesBps: merchantSharesBps2 },
              { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
            ];
            const hasAddress = !!((payload as any).split?.address) && /^0x[a-f0-9]{40}$/i.test(String((payload as any).split.address));
            if (!hasAddress) {
              if (!payload.split) payload.split = { address: undefined, recipients: recipients2 };
              else if (!Array.isArray((payload.split as any).recipients) || ((payload.split as any).recipients || []).length === 0) {
                (payload.split as any).recipients = recipients2;
              }
            }
          }
        }
      } catch { }
      return NextResponse.json(payload);
    } catch {
      try {
        const origin = resolveOrigin(req);
        const bKey = String(brandKey || "").toLowerCase();
        let brand: any = {};
        if (bKey) {
          try {
            const bRes = await fetch(`${origin}/api/platform/brands/${encodeURIComponent(bKey)}/config`, { cache: "no-store" });
            const bj = await bRes.json().catch(() => ({}));
            brand = bj?.brand || {};
          } catch { }
        }
        const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
        const platformSharesBps = resolvePlatformBpsFromBrand(bKey, brand, undefined);
        const envPartnerWallet = String(process.env.PARTNER_WALLET || "").toLowerCase();
        const partnerWallet = String(brand?.partnerWallet || envPartnerWallet || "").toLowerCase();
        const sanitized4 = getSanitizedSplitBps();
        const envPartnerBps4 = typeof sanitized4?.partner === "number" ? Math.max(0, Math.min(10000, sanitized4.partner)) : 0;
        const basePartnerBps4 = typeof brand?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand.partnerFeeBps)) : 0;
        const fallbackPartnerBps4 = 0;
        const defaultPartnerBps4 = 50;
        const partnerFeeBps = basePartnerBps4 > 0
          ? basePartnerBps4
          : (envPartnerBps4 > 0
            ? envPartnerBps4
            : ((fallbackPartnerBps4 && fallbackPartnerBps4 > 0)
              ? Math.max(0, Math.min(10000, fallbackPartnerBps4))
              : defaultPartnerBps4));
        const isPartnerBrand = !!bKey && bKey !== "portalpay";
        try {
          console.log("[split/deploy] synth/fallback", {
            brandKey: bKey,
            partnerWallet,
            partnerFeeBps,
            platformRecipient,
            isPartnerBrand
          });
        } catch { }
        if (isPartnerBrand) {
          if (isHexAddress(platformRecipient) && isHexAddress(partnerWallet) && partnerFeeBps > 0) {
            const partnerSharesBps = Math.max(0, Math.min(10000 - platformSharesBps, partnerFeeBps));
            const merchantSharesBps = Math.max(0, 10000 - platformSharesBps - partnerSharesBps);
            const recipients = [
              { address: wallet, sharesBps: merchantSharesBps },
              { address: partnerWallet as `0x${string}`, sharesBps: partnerSharesBps },
              { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
            ];
            return NextResponse.json({ split: { address: undefined, recipients }, brandKey, requiresDeploy: true, reason: "no_split_for_partner_brand" });
          } else {
            return NextResponse.json({ split: { address: undefined, recipients: [] }, brandKey, requiresDeploy: true, reason: "partner_config_missing" });
          }
        } else {
          // Platform container
          const merchantSharesBps = Math.max(0, 10000 - platformSharesBps);
          const recipients = isHexAddress(platformRecipient)
            ? [
              { address: wallet, sharesBps: merchantSharesBps },
              { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
            ]
            : [{ address: wallet, sharesBps: merchantSharesBps }];
          return NextResponse.json({ split: { address: undefined, recipients }, brandKey });
        }
      } catch {
        return NextResponse.json({ split: undefined, brandKey });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Admin-only write via JWT; allow APIM/JWT as secondary auth; fallback to x-wallet when splitAddress provided
    let caller: any;
    try {
      caller = await requireThirdwebAuth(req);
    } catch {
      try {
        caller = await requireApimOrJwt(req, ["split:write"]);
      } catch {
        // Fallback: use x-wallet header when present and valid to permit idempotent address binding from deployment pipeline
        caller = { wallet: String(req.headers.get("x-wallet") || "") };
        const w = String(caller.wallet || "").toLowerCase();
        if (!isHexAddress(w)) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
      }
    }
    // Use authenticated wallet or x-wallet header as the merchant deploying the split
    const walletHeader = String(req.headers.get("x-wallet") || "").toLowerCase();
    const wallet = (isHexAddress(walletHeader) ? walletHeader : String(caller.wallet || "")).toLowerCase() as `0x${string}`;
    // CSRF for UI writes (allow x-wallet + provided splitAddress to bind without CSRF for partner deploy flow)
    try {
      const provided = String((body as any)?.splitAddress || "").toLowerCase();
      const xw = String(req.headers.get("x-wallet") || "").toLowerCase();
      const hasProvided = /^0x[a-f0-9]{40}$/i.test(provided);
      const hasHeaderWallet = /^0x[a-f0-9]{40}$/i.test(xw);
      const skipCsrf = hasProvided && hasHeaderWallet;
      if (!skipCsrf) requireCsrf(req);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "bad_origin" }, { status: e?.status || 403 });
    }

    // Resolve brand-aware split recipients (prefer override from body or query)
    let brandKey: string;
    try {
      const urlBrand = req.nextUrl.searchParams.get("brandKey") || undefined;
      const bodyBrandRaw = (body && typeof (body as any).brandKey === "string") ? String((body as any).brandKey) : undefined;
      const bodyBrand = bodyBrandRaw ? bodyBrandRaw.toLowerCase().trim() : undefined;
      brandKey = (bodyBrand || urlBrand || getBrandKey());
      // Fallback: when no brandKey provided, derive from host and apply alias mapping for specific containers
      if (!bodyBrand && !urlBrand) {
        const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
        if (forwardedHost.endsWith(".azurewebsites.net")) {
          const sub = forwardedHost.split(".")[0].toLowerCase();
          brandKey = aliasBrandKey(brandKey || sub);
        } else {
          brandKey = aliasBrandKey(brandKey);
        }
      } else {
        brandKey = aliasBrandKey(brandKey);
      }
    } catch {
      return NextResponse.json({ error: "brand_not_configured" }, { status: 400 });
    }

    // Fetch effective brand config (with Cosmos overrides) to get current partnerFeeBps and partnerWallet
    let brand: any;
    try {
      const origin = resolveOrigin(req);
      const r = await fetch(`${origin}/api/platform/brands/${encodeURIComponent(brandKey)}/config`, { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      brand = j?.brand ? j.brand : (() => {
        // Neutral fallback avoids static BRANDS
        const stub = {
          key: brandKey,
          name: "",
          colors: { primary: "#0a0a0a", accent: "#6b7280" },
          logos: { app: "", favicon: "/favicon-32x32.png" },
          meta: {},
          appUrl: undefined,
          platformFeeBps: 50,
          partnerFeeBps: 50,
          defaultMerchantFeeBps: 0,
          partnerWallet: "",
          apimCatalog: [],
        };
        return applyBrandDefaults(stub as any);
      })();
    } catch {
      const stub = {
        key: brandKey,
        name: "",
        colors: { primary: "#0a0a0a", accent: "#6b7280" },
        logos: { app: "", favicon: "/favicon-32x32.png" },
        meta: {},
        appUrl: undefined,
        platformFeeBps: 50,
        partnerFeeBps: 50,
        defaultMerchantFeeBps: 0,
        partnerWallet: "",
        apimCatalog: [],
      };
      brand = applyBrandDefaults(stub as any);
    }

    const platformRecipient = String(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.PLATFORM_WALLET || "").toLowerCase();
    if (!isHexAddress(platformRecipient)) {
      return NextResponse.json({ error: "platform_recipient_not_configured" }, { status: 400 });
    }
    const partnerWalletBrand = String(brand?.partnerWallet || "").toLowerCase();
    // Platform share derived from brand config/env/static defaults
    const platformSharesBps = resolvePlatformBpsFromBrand(brandKey, brand, undefined);
    // Partner recipient present when brandKey !== 'portalpay' and partner is configured
    const isPartnerBrand = String(brandKey || "").toLowerCase() !== "portalpay";

    // Prepare container and read existing site config to allow partner fallback
    const c = await getContainer();
    const docId = getDocId(brandKey);
    let prev: any | undefined;
    try {
      const { resource } = await c.item(docId, wallet).read<any>();
      prev = resource;
    } catch {
      prev = undefined;
    }

    const partnerWalletPrev = String((prev as any)?.partnerWallet || "").toLowerCase();
    const partnerWallet = isHexAddress(partnerWalletBrand)
      ? (partnerWalletBrand as `0x${string}`)
      : (isHexAddress(partnerWalletPrev) ? (partnerWalletPrev as `0x${string}`) : ("" as any));

    const sanitizedPost = getSanitizedSplitBps();
    const envPartnerBpsPost = typeof sanitizedPost?.partner === "number" ? Math.max(0, Math.min(10000, sanitizedPost.partner)) : 0;
    const basePartnerBpsPost = typeof brand?.partnerFeeBps === "number" ? Math.max(0, Math.min(10000, brand.partnerFeeBps)) : 0;
    const defaultPartnerBpsPost = 50;
    const partnerFeeBpsPost = basePartnerBpsPost > 0 ? basePartnerBpsPost : (envPartnerBpsPost > 0 ? envPartnerBpsPost : defaultPartnerBpsPost);

    const partnerSharesBps = !isPartnerBrand ? 0 : (isHexAddress(partnerWallet) && partnerFeeBpsPost > 0)
      ? Math.max(0, Math.min(10000 - platformSharesBps, partnerFeeBpsPost))
      : 0;
    try {
      console.log("[split/deploy:POST] synth", { brandKey, partnerWallet, partnerFeeBps: partnerFeeBpsPost, platformRecipient });
    } catch { }
    const merchantSharesBps = Math.max(0, 10000 - platformSharesBps - partnerSharesBps);
    const recipients = [
      { address: wallet, sharesBps: merchantSharesBps },
      ...(partnerSharesBps > 0 ? [{ address: partnerWallet as `0x${string}`, sharesBps: partnerSharesBps }] : []),
      { address: platformRecipient as `0x${string}`, sharesBps: platformSharesBps },
    ];

    /* Optional override: splitAddress provided by caller (e.g., from a deployment pipeline)
      In partner container, ignore caller-provided address (immutability); platform binds addresses. */
    const providedSplitAddress = String(body.splitAddress || "").toLowerCase();
    const splitAddress = isHexAddress(providedSplitAddress) ? providedSplitAddress : undefined;
    const isPartner = isPartnerContext();
    // Allow partner containers to bind provided splitAddress (was previously immutable)
    const effectiveSplitAddress = splitAddress;


    // Idempotency with partner remediation:
    // If a valid splitAddress exists, allow override when:
    // - A new splitAddress is provided (redeploy), or
    // - Recipients are misconfigured for the partner brand (e.g., only 2 recipients)
    if (prev && isHexAddress(prev.splitAddress)) {
      const prevRecipients = Array.isArray(prev.split?.recipients) ? prev.split.recipients : [];
      const expectedBase = (isHexAddress(partnerWallet) && typeof brand.partnerFeeBps === "number") ? 3 : 2;
      const expectedRecipients = isPartnerBrand ? Math.max(expectedBase, 3) : expectedBase;
      const misconfiguredPrev = prevRecipients.length > 0 && prevRecipients.length < expectedRecipients;
      const platformPrevRec = prevRecipients.find((r: any) => String(r?.address || "").toLowerCase() === String(platformRecipient));
      const actualPlatformBpsPrev = clampBps(Number(platformPrevRec?.sharesBps || 0));
      const platformBpsMismatchPrev = !platformPrevRec || actualPlatformBpsPrev !== platformSharesBps;
      const providedIsNew = !!(splitAddress && splitAddress !== String(prev.splitAddress || "").toLowerCase());

      if (providedIsNew) {
        // IMPORTANT: Explicitly preserve theme and other merchant-specific data when updating split
        const nextConfigOverride: any = {
          ...(prev || {}),
          id: docId,
          wallet,
          brandKey,
          type: "site_config",
          updatedAt: Date.now(),
          splitAddress: splitAddress || prev.splitAddress,
          partnerWallet: partnerWallet || undefined,
          split: {
            address: splitAddress || prev.splitAddress,
            recipients,
            brandKey,
          },
          // Explicitly preserve theme to prevent data loss when updating split config
          theme: (prev as any)?.theme || undefined,
          // Preserve other merchant-specific fields
          story: (prev as any)?.story || undefined,
          storyHtml: (prev as any)?.storyHtml || undefined,
          defiEnabled: (prev as any)?.defiEnabled,
          processingFeePct: (prev as any)?.processingFeePct,
          reserveRatios: (prev as any)?.reserveRatios,
          defaultPaymentToken: (prev as any)?.defaultPaymentToken,
          storeCurrency: (prev as any)?.storeCurrency,
          accumulationMode: (prev as any)?.accumulationMode,
          taxConfig: (prev as any)?.taxConfig,
          appUrl: (prev as any)?.appUrl,
        };
        // Write brand-scoped doc
        // Mirror nested config.* fields for robust readers
        nextConfigOverride.config = {
          ...(nextConfigOverride.config || {}),
          splitAddress: nextConfigOverride.splitAddress,
          split: { address: nextConfigOverride.split.address, recipients },
          recipients,
        };
        await c.items.upsert(nextConfigOverride);
        // Also write legacy mirror (site:config) to prevent latest-doc selection mismatches
        const legacyMirrorOverride: any = {
          ...nextConfigOverride,
          id: "site:config",
          brandKey, // persist brand
          type: "site_config",
          updatedAt: nextConfigOverride.updatedAt,
        };
        legacyMirrorOverride.config = {
          ...(legacyMirrorOverride.config || {}),
          splitAddress: legacyMirrorOverride.splitAddress,
          split: { address: legacyMirrorOverride.split.address, recipients },
          recipients,
        };
        await c.items.upsert(legacyMirrorOverride);

        return NextResponse.json({
          ok: true,
          split: {
            address: nextConfigOverride.split.address,
            recipients: nextConfigOverride.split.recipients,
          },
          updated: true,
        });
      }
      if (misconfiguredPrev || platformBpsMismatchPrev) {
        // Do NOT rewrite recipients on a legacy/misconfigured address without a new address.
        // Signal the client to redeploy a new split with correct recipients and platform bps.
        return NextResponse.json({
          ok: true,
          requiresRedeploy: true,
          split: {
            address: prev.splitAddress,
            recipients: prevRecipients,
          },
          brandKey,
          idempotent: false,
        });
      }

      return NextResponse.json({
        ok: true,
        split: {
          address: prev.splitAddress,
          recipients: prevRecipients.length ? prevRecipients : recipients,
        },
        brandKey: prev.brandKey,
        idempotent: true,
      });
    }

    // Build updated config document
    // IMPORTANT: Explicitly preserve theme and other merchant-specific data to prevent data loss
    const nextConfig: any = {
      ...(prev || {}),
      id: docId,
      wallet,
      brandKey, // persist brand scoping for isolation/indexers
      type: "site_config",
      updatedAt: Date.now(),
      splitAddress: effectiveSplitAddress || undefined,
      partnerWallet: partnerWallet || undefined,
      split: {
        address: effectiveSplitAddress || "",
        recipients,
        brandKey, // duplicate inside split for split_index generators
      },
      // Explicitly preserve theme to prevent data loss when updating split config
      theme: (prev as any)?.theme || undefined,
      // Preserve other merchant-specific fields
      story: (prev as any)?.story || undefined,
      storyHtml: (prev as any)?.storyHtml || undefined,
      defiEnabled: (prev as any)?.defiEnabled,
      processingFeePct: (prev as any)?.processingFeePct,
      reserveRatios: (prev as any)?.reserveRatios,
      defaultPaymentToken: (prev as any)?.defaultPaymentToken,
      storeCurrency: (prev as any)?.storeCurrency,
      accumulationMode: (prev as any)?.accumulationMode,
      taxConfig: (prev as any)?.taxConfig,
      appUrl: (prev as any)?.appUrl,
    };

    // Persist the updated document (even if splitAddress is undefined; recipients saved for later address binding)
    // Write brand-scoped doc (site:config:<brandKey>) and mirror nested config fields
    nextConfig.config = {
      ...(nextConfig.config || {}),
      splitAddress: nextConfig.splitAddress,
      split: { address: nextConfig.split.address, recipients },
      recipients,
    };
    await c.items.upsert(nextConfig);

    // Also write legacy mirror (site:config) with identical split fields and timestamps
    const legacyMirror: any = {
      ...nextConfig,
      id: "site:config",
      brandKey,
      type: "site_config",
      updatedAt: nextConfig.updatedAt,
    };
    legacyMirror.config = {
      ...(legacyMirror.config || {}),
      splitAddress: legacyMirror.splitAddress,
      split: { address: legacyMirror.split.address, recipients },
      recipients,
    };
    await c.items.upsert(legacyMirror);

    if (effectiveSplitAddress) {
      return NextResponse.json({
        ok: true,
        split: {
          address: effectiveSplitAddress,
          recipients: nextConfig.split.recipients,
        },
      });
    }

    // If we don't have an address, report degraded.
    // Partner container: immutable_partner_container (address must be bound by platform)
    // Platform/local: deployment_not_configured (no on-chain deploy in this route)
    return NextResponse.json({
      ok: true,
      degraded: true,
      reason: "deployment_not_configured",
      split: {
        address: undefined,
        recipients: nextConfig.split.recipients,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
