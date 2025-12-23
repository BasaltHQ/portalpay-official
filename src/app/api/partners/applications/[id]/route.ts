import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

/**
 * Public PATCH: attach logos and upload tracking to a partner application after successful submission.
 * This allows deferring uploads until the application is created.
 *
 * Body:
 * {
 *   logos?: { app?: string; favicon?: string; symbol?: string; footer?: string },
 *   uploadAudit?: {
 *     appCorrelationId?: string;
 *     faviconCorrelationId?: string;
 *     symbolCorrelationId?: string;
 *     uploadedAt?: number;
 *   }
 * }
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const correlationId = cryptoRandomUUID();
  // CSRF + anti-abuse rate limit (global bucket)
  try {
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, "partner_applications_patch", "global"), 30, 60_000);
  } catch (e: any) {
    const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
    return json(
      { error: e?.message || "rate_limited", resetAt, correlationId },
      { status: e?.status || 429, headers: { "x-correlation-id": correlationId, "x-ratelimit-reset": resetAt ? String(resetAt) : "" } }
    );
  }

  // Parse path id
  const { id } = await ctx.params;
  const idStr = String(id || "").trim();
  if (!idStr) {
    return json({ error: "id_required", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
  }

  // Parse body
  let body: any = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    return json({ error: "invalid_body", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
  }

  const logos = body?.logos && typeof body.logos === "object" ? body.logos : undefined;
  const uploadAudit = body?.uploadAudit && typeof body.uploadAudit === "object" ? body.uploadAudit : undefined;

  if (!logos && !uploadAudit) {
    return json({ error: "nothing_to_update", correlationId }, { status: 400, headers: { "x-correlation-id": correlationId } });
  }

  try {
    const c = await getContainer();

    // Load application by id (cross-partition)
    const { resources } = await c.items
      .query({
        query: "SELECT * FROM c WHERE c.type = @type AND c.id = @id",
        parameters: [
          { name: "@type", value: "partner_application" },
          { name: "@id", value: idStr },
        ],
      }, { maxItemCount: 1 })
      .fetchAll();

    const app = Array.isArray(resources) && resources.length ? resources[0] : null;
    if (!app) {
      return json({ error: "not_found", correlationId }, { status: 404, headers: { "x-correlation-id": correlationId } });
    }

    const now = Date.now();
    const updated: any = {
      ...app,
      updatedAt: now,
    };

    if (logos) {
      const current = typeof app.logos === "object" ? app.logos : {};
      updated.logos = {
        ...current,
        app: typeof logos.app === "string" && logos.app.trim() ? String(logos.app) : current.app,
        favicon: typeof logos.favicon === "string" && logos.favicon.trim() ? String(logos.favicon) : current.favicon,
        symbol: typeof logos.symbol === "string" && logos.symbol.trim() ? String(logos.symbol) : current.symbol,
        footer: typeof logos.footer === "string" && logos.footer.trim() ? String(logos.footer) : current.footer,
      };
    }

    if (uploadAudit) {
      // Attach tracking under a dedicated field
      updated.uploadAudit = {
        ...(typeof app.uploadAudit === "object" ? app.uploadAudit : {}),
        appCorrelationId: typeof uploadAudit.appCorrelationId === "string" ? uploadAudit.appCorrelationId : (app.uploadAudit?.appCorrelationId ?? undefined),
        faviconCorrelationId: typeof uploadAudit.faviconCorrelationId === "string" ? uploadAudit.faviconCorrelationId : (app.uploadAudit?.faviconCorrelationId ?? undefined),
        symbolCorrelationId: typeof uploadAudit.symbolCorrelationId === "string" ? uploadAudit.symbolCorrelationId : (app.uploadAudit?.symbolCorrelationId ?? undefined),
        uploadedAt: typeof uploadAudit.uploadedAt === "number" ? uploadAudit.uploadedAt : (app.uploadAudit?.uploadedAt ?? now),
        patchedCorrelationId: correlationId,
      };
    }

    await c.items.upsert(updated);

    const brandKey = String(app.brandKey || app.wallet || "").toLowerCase();
    return json({ ok: true, id: idStr, brandKey, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    return json(
      { error: e?.message || "cosmos_error", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

function cryptoRandomUUID(): string {
  // Minimal polyfill (node:crypto randomUUID may be unavailable in some edge runtimes)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require("node:crypto");
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
