import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { getBrandConfig } from "@/config/brands";

/**
 * Reviews API
 * - GET: list public reviews for a subject (brand-scoped)
 *   Query: subjectType=merchant|shop|inventory, subjectId=string, page?, limit?
 * - POST: create a review tied to a completed purchase (brand-scoped)
 *   Body: { subjectType, subjectId, receiptId, rating, title?, body? }
 *
 * Storage notes:
 * - Docs are stored with partition key = merchantWallet (same as receipts) for consistency.
 * - Doc shape:
 *   {
 *     id: "review:<uuid>",
 *     type: "review",
 *     wallet: "<merchantWallet>",               // Cosmos partition key
 *     brandKey: "<brand>",
 *     authorWallet: "<buyerWallet>",
 *     subject: { type: "merchant"|"shop"|"inventory", id: string },
 *     orderRef: { receiptId: string, merchantWallet: string },
 *     rating: number,
 *     title?: string,
 *     body?: string,
 *     visibility: "public",
 *     moderationStatus: "approved" | "pending" | "rejected",
 *     createdAt: number,
 *     updatedAt: number
 *   }
 */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Simple in-memory rate limiter (best-effort in serverless)
const RL_STORE = new Map<string, { count: number; resetAt: number }>();
function getClientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  const xr = req.headers.get("x-real-ip") || "";
  const ip = xf.split(",")[0].trim() || xr || "unknown";
  return ip;
}
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = RL_STORE.get(key);
  if (!bucket || now >= bucket.resetAt) {
    RL_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0, resetAt: now + windowMs };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { limited: true, retryAfter: Math.ceil((bucket.resetAt - now) / 1000), resetAt: bucket.resetAt };
  }
  RL_STORE.set(key, bucket);
  return { limited: false, retryAfter: 0, resetAt: bucket.resetAt };
}

export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const url = new URL(req.url);
    const subjectType = String(url.searchParams.get("subjectType") || "").toLowerCase();
    const subjectId = String(url.searchParams.get("subjectId") || "").toLowerCase();
    const page = Math.max(0, Math.floor(Number(url.searchParams.get("page") ?? "0")));
    const limit = clamp(Math.floor(Number(url.searchParams.get("limit") ?? "20")) || 20, 1, 100);

    // Rate limit: reviews listing by subject + IP
    {
      const ip = getClientIp(req);
      const rl = rateLimit(`reviews:GET:${subjectType}:${subjectId}:${ip}`, 60, 10 * 60000);
      if (rl.limited) {
        return NextResponse.json(
          { ok: false, error: "rate_limited" },
          { status: 429, headers: { "x-correlation-id": correlationId, "retry-after": String(rl.retryAfter) } }
        );
      }
    }

    if (!subjectType || !subjectId || !["merchant", "shop", "inventory"].includes(subjectType)) {
      return NextResponse.json(
        { ok: false, error: "invalid_subject" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const brandKey = String(getBrandConfig().key || "").toLowerCase();

    // Cross-partition query filtered by brand and subject
    const container = await getContainer();
    const spec = {
      query:
        "SELECT c.id, c.wallet, c.authorWallet, c.subject, c.orderRef, c.rating, c.title, c.body, c.createdAt, c.updatedAt " +
        "FROM c WHERE c.type = 'review' AND (c.brandKey = @brand OR NOT IS_DEFINED(c.brandKey) OR c.brandKey = null OR c.brandKey = '') AND c.visibility = 'public' " +
        "AND c.subject.type = @stype AND c.subject.id = @sid AND c.moderationStatus = 'approved'",
      parameters: [
        { name: "@brand", value: brandKey },
        { name: "@stype", value: subjectType },
        { name: "@sid", value: subjectId },
      ],
    } as { query: string; parameters: { name: string; value: any }[] };

    const { resources } = await container.items.query(spec).fetchAll();
    const rows = Array.isArray(resources) ? resources : [];
    rows.sort((a: any, b: any) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    const total = rows.length;
    const start = page * limit;
    const end = start + limit;
    const items = rows.slice(start, end);

    return NextResponse.json({ ok: true, items, total, page, pageSize: limit }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500, headers: { "x-correlation-id": crypto.randomUUID() } }
    );
  }
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const caller = await requireThirdwebAuth(req);
    const authorWallet = String(caller.wallet || "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(authorWallet)) {
      return NextResponse.json(
        { ok: false, error: "invalid_author" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const subjectType = String(body?.subjectType || "").toLowerCase();
    const subjectId = String(body?.subjectId || "").toLowerCase();
    const receiptId = String(body?.receiptId || "").trim();
    const rating = clamp(Number(body?.rating || 0), 1, 5);
    const title = typeof body?.title === "string" ? String(body.title).slice(0, 120) : undefined;
    const textBody = typeof body?.body === "string" ? String(body.body).slice(0, 5000) : undefined;

    if (!["merchant", "shop", "inventory"].includes(subjectType) || !subjectId) {
      return NextResponse.json(
        { ok: false, error: "invalid_subject" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }
    if (!receiptId) {
      return NextResponse.json(
        { ok: false, error: "receipt_id_required" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    // Rate limit: reviews create by author wallet
    {
      const rl = rateLimit(`reviews:POST:${authorWallet}`, 10, 60 * 60000);
      if (rl.limited) {
        return NextResponse.json(
          { ok: false, error: "rate_limited" },
          { status: 429, headers: { "x-correlation-id": correlationId, "retry-after": String(rl.retryAfter) } }
        );
      }
    }

    const brandKey = String(getBrandConfig().key || "").toLowerCase();
    const container = await getContainer();

    // Find the receipt for this buyer matching the subject (cross-partition)
    const receiptSpec = {
      query:
        "SELECT c.id, c.wallet, c.receiptId, c.lineItems, c.status, c.buyerWallet, c.shopSlug " +
        "FROM c WHERE c.type = 'receipt' AND c.receiptId = @rid AND c.buyerWallet = @buyer",
      parameters: [
        { name: "@rid", value: receiptId },
        { name: "@buyer", value: authorWallet },
      ],
    } as { query: string; parameters: { name: string; value: any }[] };

    const { resources: receiptRows } = await container.items.query(receiptSpec).fetchAll();
    const receipt = Array.isArray(receiptRows) ? receiptRows.find((r: any) => String(r?.receiptId || "") === receiptId) : undefined;

    if (!receipt) {
      return NextResponse.json(
        { ok: false, error: "purchase_not_found" },
        { status: 403, headers: { "x-correlation-id": correlationId } }
      );
    }

    // Validate subject against receipt details
    const merchantWallet = String(receipt.wallet || "").toLowerCase();
    const status = String(receipt.status || "").toLowerCase();
    const eligibleStatuses = new Set(["checkout_success", "paid", "tx_mined", "reconciled"]);

    if (!eligibleStatuses.has(status)) {
      return NextResponse.json(
        { ok: false, error: "receipt_not_completed" },
        { status: 403, headers: { "x-correlation-id": correlationId } }
      );
    }

    if (subjectType === "merchant") {
      if (subjectId !== merchantWallet) {
        return NextResponse.json(
          { ok: false, error: "subject_mismatch" },
          { status: 400, headers: { "x-correlation-id": correlationId } }
        );
      }
    } else if (subjectType === "shop") {
      const shopSlug = typeof receipt.shopSlug === "string" ? String(receipt.shopSlug).toLowerCase() : "";
      if (!shopSlug || shopSlug !== subjectId) {
        // Fallback: if receipt is missing shopSlug or differs, resolve slug -> wallet and verify it matches the receipt's merchant
        try {
          const fallbackSpec = {
            query: "SELECT TOP 1 c.wallet FROM c WHERE c.type='shop_config' AND c.slug=@slug",
            parameters: [{ name: "@slug", value: subjectId }],
          } as { query: string; parameters: { name: string; value: any }[] };
          const { resources: slugRows } = await container.items.query(fallbackSpec).fetchAll();
          const slugRow = Array.isArray(slugRows) && slugRows.length ? slugRows[0] : null;
          const slugWallet = String(slugRow?.wallet || "").toLowerCase();
          if (!slugWallet || slugWallet !== merchantWallet) {
            return NextResponse.json(
              { ok: false, error: "subject_mismatch" },
              { status: 400, headers: { "x-correlation-id": correlationId } }
            );
          }
          // If slug maps to this merchant, accept the review despite missing/mismatched receipt.shopSlug
        } catch {
          return NextResponse.json(
            { ok: false, error: "subject_mismatch" },
            { status: 400, headers: { "x-correlation-id": correlationId } }
          );
        }
      }
    } else if (subjectType === "inventory") {
      const items = Array.isArray(receipt.lineItems) ? receipt.lineItems : [];
      const found = items.some((li: any) => String(li?.itemId || "").toLowerCase() === subjectId);
      if (!found) {
        return NextResponse.json(
          { ok: false, error: "subject_not_in_order" },
          { status: 400, headers: { "x-correlation-id": correlationId } }
        );
      }
    }

    // Enforce only one review per subject per receipt by this author
    const dupSpec = {
      query:
        "SELECT c.id FROM c WHERE c.type='review' AND (c.brandKey=@brand OR NOT IS_DEFINED(c.brandKey) OR c.brandKey = null OR c.brandKey = '') AND c.authorWallet=@author " +
        "AND c.subject.type=@stype AND c.subject.id=@sid AND c.orderRef.receiptId=@rid",
      parameters: [
        { name: "@brand", value: brandKey },
        { name: "@author", value: authorWallet },
        { name: "@stype", value: subjectType },
        { name: "@sid", value: subjectId },
        { name: "@rid", value: receiptId },
      ],
    } as { query: string; parameters: { name: string; value: any }[] };
    const { resources: dupRows } = await container.items.query(dupSpec).fetchAll();
    if (Array.isArray(dupRows) && dupRows.length > 0) {
      return NextResponse.json(
        { ok: false, error: "already_reviewed" },
        { status: 409, headers: { "x-correlation-id": correlationId } }
      );
    }

    const ts = Date.now();
    const doc = {
      id: `review:${crypto.randomUUID()}`,
      type: "review",
      wallet: merchantWallet, // partition key
      brandKey,
      authorWallet,
      subject: { type: subjectType, id: subjectId },
      orderRef: { receiptId, merchantWallet },
      rating,
      title,
      body: textBody,
      visibility: "public",
      moderationStatus: "approved",
      createdAt: ts,
      updatedAt: ts,
    };

    await container.items.upsert(doc as any);
    return NextResponse.json({ ok: true, review: { ...doc, wallet: undefined } }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500, headers: { "x-correlation-id": crypto.randomUUID() } }
    );
  }
}
