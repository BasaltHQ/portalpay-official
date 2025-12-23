import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { clearReceiptsForWallet } from "@/lib/receipts-mem";
import { requireRole } from "@/lib/auth";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";
import { verifyAdminActionSignature } from "@/lib/eip712";
import crypto from "node:crypto";

/**
 * Purge Receipts API
 * - POST: deletes all receipts for the merchant (x-wallet partition)
 * - Cosmos mode: deletes receipt documents by id within the wallet partition
 * - Degraded mode: clears in-memory receipts for the wallet
 *
 * Headers:
 *   x-wallet: merchant wallet (partition key, 0x...)
 *
 * Response:
 *   { ok: true, deleted: number }
 */
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  const wallet = String(req.headers.get("x-wallet") || "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
    return NextResponse.json(
      { ok: false, error: "merchant_required" },
      { status: 400, headers: { "x-correlation-id": correlationId } }
    );
  }

  // AuthZ: admin-only via Thirdweb JWT + CSRF + rate limiting
  const caller = await requireRole(req, "admin");
  requireCsrf(req);
  try {
    rateLimitOrThrow(req, rateKey(req, "receipts_purge", wallet), 5, 60 * 60 * 1000);
  } catch (e: any) {
    const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "receipts_purge",
        target: wallet,
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

  // Optional typed signature gating for destructive admin action
  const requireTyped = process.env.ADMIN_TYPED_SIG_REQUIRED !== "false";
  if (requireTyped) {
    let signature = "";
    let nonce: any = 0;
    try {
      const body = await req.json().catch(() => ({}));
      signature = String(body.signature || "");
      nonce = body.nonce ?? 0;
    } catch {}
    const ok = !!signature && (await verifyAdminActionSignature({
      signature: signature as `0x${string}`,
      address: caller.wallet,
      action: "receipts_purge",
      target: wallet,
      correlationId,
      nonce
    }));
    if (!ok) {
      try {
        await auditEvent(req, {
          who: caller.wallet,
          roles: caller.roles,
          what: "receipts_purge",
          target: wallet,
          correlationId,
          ok: false,
          metadata: { error: "bad_signature" }
        });
      } catch {}
      return NextResponse.json(
        { error: "bad_signature", correlationId },
        { status: 403, headers: { "x-correlation-id": correlationId } }
      );
    }
  }

  try {
    const container = await getContainer();

    // Fetch ids of all receipts for this wallet partition
    const spec = {
      query: "SELECT c.id FROM c WHERE c.type='receipt' AND c.wallet=@wallet",
      parameters: [{ name: "@wallet", value: wallet }],
    } as { query: string; parameters: { name: string; value: any }[] };

    const { resources } = await container.items.query(spec).fetchAll();
    const ids: string[] = Array.isArray(resources) ? resources.map((row: any) => String(row.id)) : [];

    let deleted = 0;
    for (const id of ids) {
      try {
        await container.item(id, wallet).delete();
        deleted++;
      } catch {
        // continue on individual delete failures
      }
    }

    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "receipts_purge",
        target: wallet,
        correlationId,
        ok: true,
        metadata: { deleted, idsCount: ids.length }
      });
    } catch {}
    return NextResponse.json(
      { ok: true, deleted },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    // Degraded/local mode: clear in-memory receipts for this wallet
    try {
      clearReceiptsForWallet(wallet);
    } catch {}
    try {
      await auditEvent(req, {
        who: caller.wallet,
        roles: caller.roles,
        what: "receipts_purge",
        target: wallet,
        correlationId,
        ok: true,
        metadata: { degraded: true, reason: e?.message || "cosmos_unavailable" }
      });
    } catch {}
    return NextResponse.json(
      { ok: true, deleted: 0, degraded: true, reason: e?.message || "cosmos_unavailable" },
      { headers: { "x-correlation-id": correlationId } }
    );
  }
}
