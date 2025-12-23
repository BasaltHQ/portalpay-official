import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet, isOwnerWallet } from "@/lib/auth";

type PresenceUpdate = {
  wallet?: string;
  live?: boolean;
  spaceUrl?: string;
  spacePublic?: boolean;
  sessionId?: string;
  language?: string;
  domain?: string;
  platform?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PresenceUpdate;
    const authed = await getAuthenticatedWallet(req);
    const headerWallet = String((body.wallet || req.headers.get("x-wallet") || "")).toLowerCase();
    let wallet = String(authed || headerWallet).toLowerCase();
    if (authed) {
      if (wallet !== authed.toLowerCase()) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    } else {
      // Live Now presence should not require admin auth.
      // Accept a valid x-wallet header (connected wallet) from the Console client for this endpoint.
      if (!/^0x[a-f0-9]{40}$/i.test(headerWallet)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      wallet = headerWallet;
    }
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
    }

    const now = Date.now();
    const live = !!body.live;
    const spaceUrl = typeof body.spaceUrl === "string" ? body.spaceUrl.slice(0, 512) : undefined;
    const spacePublic = typeof body.spacePublic === "boolean" ? body.spacePublic : undefined;
    const language = typeof body.language === "string" ? body.language.slice(0, 80) : undefined;
    const domain = typeof body.domain === "string" ? body.domain.slice(0, 80) : undefined;
    const platform = typeof body.platform === "string" ? body.platform.slice(0, 64) : undefined;

    try {
      const container = await getContainer();
      const userId = `${wallet}:user`;
      let current: any = null;
      try {
        const { resource } = await container.item(userId, wallet).read<any>();
        current = resource || { id: userId, type: "user", wallet, firstSeen: now };
      } catch {
        current = { id: userId, type: "user", wallet, firstSeen: now };
      }

      const next: any = { ...current, id: userId, type: "user", wallet, lastSeen: now };
      // Apply presence updates
      next.lastHeartbeat = now;
      if (live) {
        next.live = true;
        if (!current?.liveSince) next.liveSince = now;
        if (typeof spaceUrl === "string") next.spaceUrl = spaceUrl;
        if (typeof spacePublic === "boolean") next.spacePublic = spacePublic;
        if (typeof body.sessionId === "string") next.currentSessionId = String(body.sessionId).slice(0, 80);
        if (typeof language === "string") next.currentLanguage = language;
        if (typeof domain === "string") next.currentDomain = domain;
        if (typeof platform === "string") next.currentPlatform = platform;
      } else {
        next.live = false;
        next.spacePublic = false;
        next.currentSessionId = undefined;
        // Keep spaceUrl but hide via spacePublic=false
      }

      await container.items.upsert(next);
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json({ ok: true, degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const w = String((req.nextUrl.searchParams.get("wallet") || req.headers.get("x-wallet") || "")).toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(w)) return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
    try {
      const container = await getContainer();
      const id = `${w}:user`;
      const { resource } = await container.item(id, w).read<any>();
      const p = resource || {};
      const presence = {
        live: !!p.live,
        spaceUrl: typeof p.spaceUrl === "string" ? p.spaceUrl : undefined,
        spacePublic: !!p.spacePublic,
        liveSince: typeof p.liveSince === "number" ? p.liveSince : undefined,
        lastHeartbeat: typeof p.lastHeartbeat === "number" ? p.lastHeartbeat : undefined,
      };
      return NextResponse.json({ presence });
    } catch (e: any) {
      return NextResponse.json({ presence: { live: false }, degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


