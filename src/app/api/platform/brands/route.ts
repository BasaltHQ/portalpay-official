import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BrandIndexDoc = {
  id: string;            // "brand:config"
  wallet: string;        // partition key = brandKey
  type: "brand_config";
  updatedAt?: number;
};

function json(obj: any, init?: { status?: number; headers?: Record<string, string> }) {
  try {
    const s = JSON.stringify(obj);
    const len = new TextEncoder().encode(s).length;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    };
    headers["Content-Length"] = String(len);
    return new NextResponse(s, { status: init?.status ?? 200, headers });
  } catch {
    return NextResponse.json(obj, init as any);
  }
}

// GET /api/platform/brands
// Returns a list of brand keys detected in Cosmos (reads brand_config docs)
export async function GET(_req: NextRequest) {
  try {
    const c = await getContainer();
    // Query all brand_config docs (only wallet is needed)
    const query = {
      query: "SELECT c.wallet FROM c WHERE c.type = @type",
      parameters: [{ name: "@type", value: "brand_config" }],
    };
    const { resources } = await c.items.query<{ wallet: string }>(query, { maxItemCount: 1000 }).fetchAll();
    const keys = Array.from(new Set((resources || []).map((r) => String(r.wallet || "").toLowerCase()).filter(Boolean)));
    return json({ brands: keys });
  } catch (e: any) {
    return json({ brands: [], degraded: true, reason: e?.message || "cosmos_unavailable" });
  }
}

// POST /api/platform/brands
// Body: { brandKey: string }
// Admin-only. Creates/ensures a brand_config doc for the key (no-op if exists)
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  // Admin-only auth
  let caller: { wallet: string; roles: string[] };
  try {
    const c = await requireThirdwebAuth(req);
    const roles = Array.isArray(c.roles) ? c.roles : [];
    if (!roles.includes("admin")) {
      return json({ error: "forbidden", correlationId }, { status: 403, headers: { "x-correlation-id": correlationId } });
    }
    caller = { wallet: c.wallet, roles };
  } catch {
    return json({ error: "unauthorized", correlationId }, { status: 401, headers: { "x-correlation-id": correlationId } });
  }

  // CSRF + rate limit
  try {
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, "brand_index_write", "global"), 30, 60_000);
  } catch (e: any) {
    const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
    return json(
      { error: e?.message || "rate_limited", resetAt, correlationId },
      { status: e?.status || 429, headers: { "x-correlation-id": correlationId, "x-ratelimit-reset": resetAt ? String(resetAt) : "" } }
    );
  }

  // Parse body
  let brandKey: string = "";
  try {
    const raw = await req.json().catch(() => ({}));
    const inKey = String(raw?.brandKey || "").trim().toLowerCase();
    // Normalize to slug (lowercase alphanum + dash)
    brandKey = inKey.replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    if (!brandKey) {
      return json({ error: "invalid_brand_key", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
    }
  } catch (e: any) {
    return json({ error: e?.message || "invalid_body", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
  }

  // Upsert minimal brand_config doc if not present
  try {
    const c = await getContainer();
    try {
      // Try read first
      const { resource } = await c.item("brand:config", brandKey).read<BrandIndexDoc>();
      if (!resource || resource.type !== "brand_config") {
        const doc: BrandIndexDoc = { id: "brand:config", wallet: brandKey, type: "brand_config", updatedAt: Date.now() };
        await c.items.upsert(doc);
      }
    } catch {
      const doc: BrandIndexDoc = { id: "brand:config", wallet: brandKey, type: "brand_config", updatedAt: Date.now() };
      await c.items.upsert(doc);
    }

    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_index_add",
        target: brandKey,
        correlationId,
        ok: true,
      });
    } catch {}

    return json({ ok: true, brandKey, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    return json({ error: e?.message || "cosmos_error", correlationId }, { status: 500, headers: { "x-correlation-id": correlationId } });
  }
}

// DELETE /api/platform/brands
// Body: { brandKey: string }
// Admin-only. Deletes the brand_config doc for the key (does not cascade other docs)
export async function DELETE(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  // Admin-only auth
  let caller: { wallet: string; roles: string[] };
  try {
    const c = await requireThirdwebAuth(req);
    const roles = Array.isArray(c.roles) ? c.roles : [];
    if (!roles.includes("admin")) {
      return json({ error: "forbidden", correlationId }, { status: 403, headers: { "x-correlation-id": correlationId } });
    }
    caller = { wallet: c.wallet, roles };
  } catch {
    return json({ error: "unauthorized", correlationId }, { status: 401, headers: { "x-correlation-id": correlationId } });
  }

  // CSRF + rate limit
  try {
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, "brand_index_write", "global"), 30, 60_000);
  } catch (e: any) {
    const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
    return json(
      { error: e?.message || "rate_limited", resetAt, correlationId },
      { status: e?.status || 429, headers: { "x-correlation-id": correlationId, "x-ratelimit-reset": resetAt ? String(resetAt) : "" } }
    );
  }

  // Parse body
  let brandKey: string = "";
  try {
    const raw = await req.json().catch(() => ({}));
    const inKey = String(raw?.brandKey || "").trim().toLowerCase();
    brandKey = inKey.replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    if (!brandKey) {
      return json({ error: "invalid_brand_key", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
    }
  } catch (e: any) {
    return json({ error: e?.message || "invalid_body", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
  }

  try {
    const c = await getContainer();
    // Remove the brand_config document (safe if missing)
    try {
      await c.item("brand:config", brandKey).delete();
    } catch {}
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "brand_index_remove",
        target: brandKey,
        correlationId,
        ok: true,
      });
    } catch {}
    return json({ ok: true, brandKey, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    return json({ error: e?.message || "cosmos_error", correlationId }, { status: 500, headers: { "x-correlation-id": correlationId } });
  }
}
