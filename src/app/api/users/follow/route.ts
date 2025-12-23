import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";

type FollowBody = { follower?: string; target?: string; action?: "follow" | "unfollow" };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as FollowBody;
    const authed = await getAuthenticatedWallet(req);
    const followerHeader = String((body.follower || req.headers.get("x-wallet") || "")).toLowerCase();
    const follower = (authed || followerHeader).toLowerCase();
    if (!authed || follower !== (authed || '').toLowerCase()) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const target = String(body.target || "").toLowerCase();
    const action = body.action === "unfollow" ? "unfollow" : "follow";
    if (!/^0x[a-f0-9]{40}$/i.test(follower) || !/^0x[a-f0-9]{40}$/i.test(target) || follower === target) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const id = `${follower}:follow:${target}`;
    const now = Date.now();
    try {
      const container = await getContainer();
      if (action === "follow") {
        await container.items.upsert({ id, type: "follow", wallet: follower, follower, target, ts: now } as any);
      } else {
        try { await container.item(id, follower).delete(); } catch {}
      }
      // Update simple counters on both users (best-effort)
      try {
        const followerId = `${follower}:user`;
        const { resource: a } = await container.item(followerId, follower).read<any>();
        const followingCount = Math.max(0, Number(a?.followingCount || 0) + (action === "follow" ? 1 : -1));
        await container.items.upsert({ ...(a || {}), id: followerId, type: "user", wallet: follower, followingCount, lastSeen: now } as any);
      } catch {}
      try {
        const targetId = `${target}:user`;
        const { resource: b } = await container.item(targetId, target).read<any>();
        const followersCount = Math.max(0, Number(b?.followersCount || 0) + (action === "follow" ? 1 : -1));
        await container.items.upsert({ ...(b || {}), id: targetId, type: "user", wallet: target, followersCount, lastSeen: now } as any);
      } catch {}
      return NextResponse.json({ ok: true, action });
    } catch (e: any) {
      return NextResponse.json({ ok: true, degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


