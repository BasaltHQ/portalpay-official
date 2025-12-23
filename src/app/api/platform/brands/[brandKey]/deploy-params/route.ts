import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { parseJsonBody } from "@/lib/validation";
import { auditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BrandDeployParamsDoc = {
  id: string; // "brand:deployParams"
  wallet: string; // partition key = brandKey
  type: "brand_deploy_params";
  params: {
    // core inputs
    target?: "containerapps" | "appservice" | "k8s";
    image?: string;
    resourceGroup?: string;
    name?: string;
    location?: string;
    domains?: string[];
    // env inputs (only values used by UI)
    PORTALPAY_API_BASE?: string;
    PORTALPAY_SUBSCRIPTION_KEY?: string;
    PORT?: string;
    WEBSITES_PORT?: string;
    NEXT_PUBLIC_PLATFORM_WALLET?: string;
    // azure hints
    azure?: {
      subscriptionId?: string;
      resourceGroup?: string;
      apimName?: string;
      afdProfileName?: string;
      containerAppsEnvId?: string;
    };
  };
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

async function readDeployParams(brandKey: string): Promise<BrandDeployParamsDoc | null> {
  try {
    const c = await getContainer();
    const { resource } = await c.item("brand:deployParams", brandKey).read<BrandDeployParamsDoc>();
    return resource || null;
  } catch {
    return null;
  }
}

/**
 * GET: Return last saved deployment parameters for the brand.
 * Admin-only to avoid exposing internal configuration.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ brandKey: string }> }) {
  const { brandKey } = await ctx.params;
  const key = String(brandKey || "").toLowerCase();

  // Admin-only
  try {
    const c = await requireThirdwebAuth(_req);
    const roles = Array.isArray(c.roles) ? c.roles : [];
    if (!roles.includes("admin")) {
      return headerJson({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return headerJson({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const doc = await readDeployParams(key);
    return headerJson({ brandKey: key, params: doc?.params || undefined, updatedAt: doc?.updatedAt || undefined });
  } catch (e: any) {
    return headerJson({ brandKey: key, degraded: true, reason: e?.message || "cosmos_unavailable" });
  }
}

/**
 * PATCH: Save deployment parameters (used by UI to prefill for future runs).
 * Admin-only write.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ brandKey: string }> }) {
  const correlationId = crypto.randomUUID();
  const { brandKey } = await ctx.params;
  const key = String(brandKey || "").toLowerCase();

  // Admin-only
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
    rateLimitOrThrow(req, rateKey(req, "brand_deploy_params_write", key), 30, 60_000);
  } catch (e: any) {
    const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_deploy_params_update",
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

  // Validate body: accept known fields and coerce to strings
  let raw: any;
  try {
    raw = await parseJsonBody(req);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "invalid_body", correlationId },
      { status: 400, headers: { "x-correlation-id": correlationId } }
    );
  }

  const params: BrandDeployParamsDoc["params"] = {
    target: (raw?.target as any) || undefined,
    image: typeof raw?.image === "string" ? String(raw.image) : undefined,
    resourceGroup: typeof raw?.resourceGroup === "string" ? String(raw.resourceGroup) : undefined,
    name: typeof raw?.name === "string" ? String(raw.name) : undefined,
    location: typeof raw?.location === "string" ? String(raw.location) : undefined,
    domains: Array.isArray(raw?.domains) ? raw.domains.filter((d: any) => typeof d === "string" && d) : undefined,
    PORTALPAY_API_BASE: typeof raw?.PORTALPAY_API_BASE === "string" ? String(raw.PORTALPAY_API_BASE) : undefined,
    PORTALPAY_SUBSCRIPTION_KEY: typeof raw?.PORTALPAY_SUBSCRIPTION_KEY === "string" ? String(raw.PORTALPAY_SUBSCRIPTION_KEY) : undefined,
    PORT: typeof raw?.PORT === "string" ? String(raw.PORT) : undefined,
    WEBSITES_PORT: typeof raw?.WEBSITES_PORT === "string" ? String(raw.WEBSITES_PORT) : undefined,
    NEXT_PUBLIC_PLATFORM_WALLET: typeof raw?.NEXT_PUBLIC_PLATFORM_WALLET === "string" ? String(raw.NEXT_PUBLIC_PLATFORM_WALLET) : undefined,
    azure: {
      subscriptionId: typeof raw?.azure?.subscriptionId === "string" ? String(raw.azure.subscriptionId) : undefined,
      resourceGroup: typeof raw?.azure?.resourceGroup === "string" ? String(raw.azure.resourceGroup) : undefined,
      apimName: typeof raw?.azure?.apimName === "string" ? String(raw.azure.apimName) : undefined,
      afdProfileName: typeof raw?.azure?.afdProfileName === "string" ? String(raw.azure.afdProfileName) : undefined,
      containerAppsEnvId: typeof raw?.azure?.containerAppsEnvId === "string" ? String(raw.azure.containerAppsEnvId) : undefined,
    },
  };

  // Upsert doc
  const doc: BrandDeployParamsDoc = {
    id: "brand:deployParams",
    wallet: key,
    type: "brand_deploy_params",
    params,
    updatedAt: Date.now(),
  };

  try {
    const c = await getContainer();
    await c.items.upsert(doc);
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_deploy_params_update",
        target: key,
        correlationId,
        ok: true
      });
    } catch {}
    return NextResponse.json({ ok: true, brandKey: key, params, updatedAt: doc.updatedAt, correlationId });
  } catch (e: any) {
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_deploy_params_update",
        target: key,
        correlationId,
        ok: true,
        metadata: { degraded: true, reason: e?.message || "cosmos_unavailable" }
      });
    } catch {}
    return NextResponse.json(
      { ok: true, degraded: true, reason: e?.message || "cosmos_unavailable", brandKey: key, params, updatedAt: doc.updatedAt, correlationId },
      { headers: { "x-correlation-id": correlationId } }
    );
  }
}
