import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { getContainer } from "@/lib/cosmos";
import { createHash } from "crypto";

/**
 * Commit voice usage for a session.
 * Finalizes the provisional usage row created by /api/voice/session and records actual seconds used.
 *
 * POST body:
 * - id: usage document id returned by /api/voice/session (usageDocId)
 * - seconds: actual seconds used (will be clamped per session cap)
 *
 * Rules:
 * - Only the creator (same walletKey derived from auth or anon ip+ua) can finalize.
 * - Counts towards daily cap only after finalized=true.
 * - Caps:
 *   - Authenticated: per-session cap 1800s (30 minutes) (configurable via VOICE_PER_SESSION_CAP_AUTH)
 *   - Anonymous: per-session cap 300s (5 minutes) (configurable via VOICE_PER_SESSION_CAP_ANON)
 */
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || "").trim();
    const seconds = Math.max(0, Math.floor(Number(body?.seconds || 0)));

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "missing_usage_id" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const authed = await getAuthenticatedWallet(req);
    const ip = ((req as any).ip || req.headers.get("x-forwarded-for") || "").toString().split(",")[0].trim();
    const ua = String(req.headers.get("user-agent") || "");
    const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);
    const walletKey = (!!authed && typeof authed === "string" && authed.length > 0)
      ? String(authed).toLowerCase()
      : `anon:${hash(`${ip}|${ua}`)}`;

    const container = await getContainer();

    // Load the usage doc for this id + walletKey
    const spec = {
      query: "SELECT TOP 1 c.id, c.wallet, c.type, c.seconds, c.kind, c.day, c.finalized FROM c WHERE c.type=@t AND c.id=@id AND c.wallet=@w",
      parameters: [
        { name: "@t", value: "usage" },
        { name: "@id", value: id },
        { name: "@w", value: walletKey },
      ],
    } as { query: string; parameters: { name: string; value: string }[] };

    const { resources } = await container.items.query(spec).fetchAll();
    const doc = Array.isArray(resources) && resources.length ? (resources as any)[0] : null;
    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "usage_not_found" },
        { status: 404, headers: { "x-correlation-id": correlationId } }
      );
    }
    if (String(doc.wallet || "") !== walletKey) {
      return NextResponse.json(
        { ok: false, error: "not_owner" },
        { status: 403, headers: { "x-correlation-id": correlationId } }
      );
    }
    if (doc.finalized === true) {
      return NextResponse.json(
        { ok: true, alreadyFinalized: true, id },
        { headers: { "x-correlation-id": correlationId } }
      );
    }

    // Clamp seconds to per-session cap based on doc.kind; allow bypass for development
    const gatingDisabled = String(process.env.VOICE_GATING_DISABLED || "").trim() === "1";
    const MAX_SESSION_SEC = Number(process.env.VOICE_MAX_SESSION_SEC?.trim() || "") || 8 * 60 * 60; // default 8h cap when gating disabled
    const PER_SESSION_CAP_AUTH = Number(process.env.VOICE_PER_SESSION_CAP_AUTH?.trim() || "") || 4 * 60 * 60; // 4 hours (configurable)
    const PER_SESSION_CAP_ANON = Number(process.env.VOICE_PER_SESSION_CAP_ANON?.trim() || "") || 2 * 60 * 60;  // 2 hours (configurable)
    const kind = String(doc.kind || "");
    const cap = kind === "auth" ? PER_SESSION_CAP_AUTH : PER_SESSION_CAP_ANON;
    const used = gatingDisabled ? Math.min(seconds, MAX_SESSION_SEC) : Math.min(seconds, cap);

    const now = Date.now();
    const updated = {
      ...doc,
      seconds: used,
      finalized: true,
      updatedAt: now,
    };

    await container.items.upsert(updated as any);

    return NextResponse.json(
      { ok: true, id, usedSeconds: used, day: doc.day, kind },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500, headers: { "x-correlation-id": crypto.randomUUID() } }
    );
  }
}
