import { NextRequest, NextResponse } from "next/server";
import { getContainer, type BillingEvent } from "@/lib/cosmos";
import { getAuthenticatedWallet, isOwnerWallet } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const body = await req.json().catch(() => ({}));
    const authed = await getAuthenticatedWallet(req);
    const bodyWallet = String(body.wallet || "").toLowerCase();
    const headerWallet = String(req.headers.get('x-wallet') || "").toLowerCase();
    const wallet = (authed || bodyWallet || headerWallet).toLowerCase();
    // Require either a valid auth cookie OR an explicit wallet provided (header or body).
    // Owner wallet bypass remains valid, but this now supports in-app social logins
    // where auth cookie may be delayed/not set yet.
    if (!authed && !bodyWallet && !headerWallet) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "x-correlation-id": correlationId } });
    }
    const seconds = Number(body.seconds || 0);
    const sessionId = body.sessionId ? String(body.sessionId) : undefined;
    const idem = body.idempotencyKey ? String(body.idempotencyKey) : undefined;

    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ error: "invalid wallet" }, { status: 400, headers: { "x-correlation-id": correlationId } });
    }
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60 * 15) { // limit 15m batch
      return NextResponse.json({ error: "invalid seconds" }, { status: 400, headers: { "x-correlation-id": correlationId } });
    }

    const evt: BillingEvent = {
      id: idem || `${wallet}:usage:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      type: "usage",
      wallet,
      seconds,
      sessionId,
      ts: Date.now(),
    };

    try {
      const container = await getContainer();
      // Upsert usage event
      await container.items.upsert(evt);
      // Update or upsert user stats doc
      const userId = `${wallet}:user`;
      try {
        const { resource } = await container.item(userId, wallet).read<any>();
        const used = Number(resource?.usedSeconds || 0) + seconds;
        const purchased = Number(resource?.purchasedSeconds || 0);
        // Do not overwrite XP here; XP is computed at session_end via xpBonus and recompute endpoints.
        await container.items.upsert({ ...resource, id: userId, type: 'user', wallet, usedSeconds: used, purchasedSeconds: purchased, lastSeen: Date.now() });
      } catch {
        const used = seconds;
        // Initialize XP to 0 for new users; bonuses/time will accrue via session_end summaries or recompute endpoints.
        await container.items.upsert({ id: userId, type: 'user', wallet, usedSeconds: used, purchasedSeconds: 0, xp: 0, firstSeen: Date.now(), lastSeen: Date.now() });
      }
      return NextResponse.json({ ok: true, event: evt }, { headers: { "x-correlation-id": correlationId } });
    } catch (e: any) {
      return NextResponse.json({ ok: true, degraded: true, reason: e?.message || "cosmos_unavailable", event: evt }, { status: 200, headers: { "x-correlation-id": correlationId } });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500, headers: { "x-correlation-id": correlationId } });
  }
}
