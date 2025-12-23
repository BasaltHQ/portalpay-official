import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { parseJsonBody } from "@/lib/validation";
import { auditEvent } from "@/lib/audit";
import { applyBrandDefaults, type ApimCatalogEntry } from "@/config/brands";
import { readFile } from "fs/promises";
import { join } from "path";
import { listProducts } from "@/lib/azure-management";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BrandConfigDoc = {
  id: string; // "brand:config"
  wallet: string; // partition key = brandKey
  type: "brand_config";
  apimCatalog?: ApimCatalogEntry[];
  updatedAt?: number;
};

function headerJson(obj: any, init?: { status?: number; headers?: Record<string, string> }) {
  try {
    const json = JSON.stringify(obj);
    const len = new TextEncoder().encode(json).length;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    };
    headers["Content-Length"] = String(len);
    return new NextResponse(json, { status: init?.status ?? 200, headers });
  } catch {
    return NextResponse.json(obj, init as any);
  }
}

async function readBrandOverrides(brandKey: string): Promise<BrandConfigDoc | null> {
  try {
    const c = await getContainer();
    const { resource } = await c.item("brand:config", brandKey).read<BrandConfigDoc>();
    return resource || null;
  } catch {
    return null;
  }
}

function normalizeEntries(input: any): ApimCatalogEntry[] {
  if (!Array.isArray(input)) return [];
  const out: ApimCatalogEntry[] = [];
  for (const e of input) {
    if (!e || typeof e !== "object") continue;
    const productId = String((e as any).productId || "").trim();
    if (!productId) continue;
    const aliasName = typeof (e as any).aliasName === "string" ? String((e as any).aliasName) : undefined;
    const aliasDescription = typeof (e as any).aliasDescription === "string" ? String((e as any).aliasDescription) : undefined;
    const visible = (e as any).visible === undefined ? true : Boolean((e as any).visible);
    const docsSlug = typeof (e as any).docsSlug === "string" ? String((e as any).docsSlug) : undefined;
    out.push({ productId, aliasName, aliasDescription, visible, docsSlug });
  }
  return out;
}

function mergedApimCatalog(brandKey: string, overrides?: BrandConfigDoc | null): ApimCatalogEntry[] {
  // Neutral base avoids hardcoded BRANDS; defaults hydrate via env, base catalog empty by default
  const stub = { key: brandKey, apimCatalog: [] } as any;
  const baseWithDefaults = applyBrandDefaults(stub);
  const baseList = Array.isArray(baseWithDefaults.apimCatalog) ? baseWithDefaults.apimCatalog : [];
  const overrideList = Array.isArray(overrides?.apimCatalog) ? overrides!.apimCatalog! : [];
  // Merge by productId with overrides taking precedence
  const map = new Map<string, ApimCatalogEntry>();
  for (const e of baseList) {
    map.set(e.productId, { ...e, visible: e.visible ?? true });
  }
  for (const e of overrideList) {
    map.set(e.productId, { ...e, visible: e.visible ?? true });
  }
  return Array.from(map.values());
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ brandKey: string }> }) {
  const { brandKey } = await ctx.params;
  const key = String(brandKey || "").toLowerCase();
  try {
    const overrides = await readBrandOverrides(key);
    const list = mergedApimCatalog(key, overrides);
    const url = new URL(req.url);
    const onlyVisible = url.searchParams.get("onlyVisible") === "1";
    let filtered = onlyVisible ? list.filter((e) => e.visible !== false) : list;

    // Fallback: if brand-level catalog is empty, surface platform-level products from Cosmos overrides if available
    if (filtered.length === 0 && key !== "portalpay") {
      try {
        const platformOverrides = await readBrandOverrides("portalpay");
        const platformList = Array.isArray(platformOverrides?.apimCatalog) ? platformOverrides!.apimCatalog! : [];
        const platformFiltered = onlyVisible ? platformList.filter((e) => e.visible !== false) : platformList;
        filtered = platformFiltered;
      } catch {}
    }

    // Final fallback: if still empty, populate from real APIM products (no dummy data)
    if (filtered.length === 0) {
      try {
        const apim = await listProducts();
        const apimList = Array.isArray(apim?.value) ? apim.value : [];
        const mapped: ApimCatalogEntry[] = apimList
          .map((p: any) => {
            const productId = String(p?.name || p?.id || "").trim();
            if (!productId) return null;
            const aliasName =
              typeof p?.properties?.displayName === "string"
                ? String(p.properties.displayName)
                : productId;
            const aliasDescription =
              typeof p?.properties?.description === "string"
                ? String(p.properties.description)
                : undefined;
            return { productId, aliasName, aliasDescription, visible: true } as ApimCatalogEntry;
          })
          .filter(Boolean) as ApimCatalogEntry[];
        filtered = onlyVisible ? mapped.filter((e) => e.visible !== false) : mapped;
      } catch {
        // Leave filtered as-is (empty) if APIM call fails
      }
    }

    return headerJson({ brandKey: key, apimCatalog: filtered });
  } catch (e: any) {
    // Degraded: attempt APIM product list; otherwise empty list
    try {
      const apim = await listProducts();
      const apimList = Array.isArray(apim?.value) ? apim.value : [];
      const mapped: ApimCatalogEntry[] = apimList
        .map((p: any) => {
          const productId = String(p?.name || p?.id || "").trim();
          if (!productId) return null;
          const aliasName =
            typeof p?.properties?.displayName === "string"
              ? String(p.properties.displayName)
              : productId;
          const aliasDescription =
            typeof p?.properties?.description === "string"
              ? String(p.properties.description)
              : undefined;
          return { productId, aliasName, aliasDescription, visible: true } as ApimCatalogEntry;
        })
        .filter(Boolean) as ApimCatalogEntry[];
      return headerJson({ brandKey: key, apimCatalog: mapped, degraded: true, reason: e?.message || "cosmos_unavailable" });
    } catch {
      return headerJson({ brandKey: key, apimCatalog: [], degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  }
}

/**
 * Admin PATCH to upsert/remove APIM catalog aliases.
 * Body supports three forms:
 * 1) { apimCatalog: ApimCatalogEntry[] } -> Replace entire list
 * 2) { entries: ApimCatalogEntry[] } -> Upsert these entries by productId
 * 3) { removeProductIds: string[] } -> Remove entries by productId
 * Can combine (2) and (3) in a single call (upserts applied after removals).
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ brandKey: string }> }) {
  const correlationId = crypto.randomUUID();
  const { brandKey } = await ctx.params;
  const key = String(brandKey || "").toLowerCase();

  // Admin-only: require JWT with admin role
  let caller: { wallet: string; roles: string[] };
  try {
    const c = await requireThirdwebAuth(req);
    const roles = Array.isArray(c.roles) ? c.roles : [];
    if (!roles.includes("admin")) {
      return NextResponse.json(
        { error: "forbidden", correlationId },
        { status: 403, headers: { "x-correlation-id": correlationId } }
      );
    }
    caller = { wallet: c.wallet, roles };
  } catch {
    return NextResponse.json(
      { error: "unauthorized", correlationId },
      { status: 401, headers: { "x-correlation-id": correlationId } }
    );
  }

  // CSRF + write rate limit
  try {
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, "brand_catalog_write", key), 30, 60_000);
  } catch (e: any) {
    const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_catalog_update",
        target: key,
        correlationId,
        ok: false,
        metadata: { error: e?.message || "rate_limited", resetAt }
      });
    } catch {}
    return NextResponse.json(
      { error: e?.message || "rate_limited", resetAt, correlationId },
      { status: e?.status || 429, headers: { "x-correlation-id": correlationId, "x-ratelimit-reset": resetAt ? String(resetAt) : "" } }
    );
  }

  // Parse body
  let body: any;
  try {
    body = await parseJsonBody(req);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "invalid_body", correlationId },
      { status: 400, headers: { "x-correlation-id": correlationId } }
    );
  }

  const replaceList = Array.isArray(body?.apimCatalog) ? normalizeEntries(body.apimCatalog) : null;
  const upserts = Array.isArray(body?.entries) ? normalizeEntries(body.entries) : [];
  const removals = Array.isArray(body?.removeProductIds) ? (body.removeProductIds as any[]).map((s) => String(s || "")).filter(Boolean) : [];

  if (!replaceList && upserts.length === 0 && removals.length === 0) {
    return NextResponse.json(
      { error: "no_changes", correlationId },
      { status: 400, headers: { "x-correlation-id": correlationId } }
    );
  }

  // Read current overrides doc
  let doc: BrandConfigDoc = {
    id: "brand:config",
    wallet: key,
    type: "brand_config",
    apimCatalog: [],
  };
  try {
    const prev = await readBrandOverrides(key);
    if (prev) doc = { ...prev };
  } catch {}

  // Apply mutations
  if (replaceList) {
    doc.apimCatalog = replaceList;
  } else {
    const map = new Map<string, ApimCatalogEntry>();
    for (const e of Array.isArray(doc.apimCatalog) ? doc.apimCatalog : []) {
      map.set(e.productId, { ...e, visible: e.visible ?? true });
    }
    // removals first
    for (const id of removals) {
      map.delete(id);
    }
    // upserts
    for (const e of upserts) {
      map.set(e.productId, { ...e, visible: e.visible ?? true });
    }
    doc.apimCatalog = Array.from(map.values());
  }
  doc.updatedAt = Date.now();

  try {
    const c = await getContainer();
    await c.items.upsert(doc);
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_catalog_update",
        target: key,
        correlationId,
        ok: true,
      });
    } catch {}
    const list = mergedApimCatalog(key, doc);
    return NextResponse.json(
      { ok: true, brandKey: key, apimCatalog: list, overrides: { apimCatalog: doc.apimCatalog }, correlationId },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_catalog_update",
        target: key,
        correlationId,
        ok: true,
        metadata: { degraded: true, reason: e?.message || "cosmos_unavailable" }
      });
    } catch {}
    const list = mergedApimCatalog(key, doc);
    return NextResponse.json(
      { ok: true, degraded: true, reason: e?.message || "cosmos_unavailable", brandKey: key, apimCatalog: list, overrides: { apimCatalog: doc.apimCatalog }, correlationId },
      { headers: { "x-correlation-id": correlationId } }
    );
  }
}
