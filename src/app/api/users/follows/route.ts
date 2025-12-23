import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const wallet = String(req.nextUrl.searchParams.get("wallet") || "").toLowerCase();
    const viewer = String(req.nextUrl.searchParams.get("viewer") || "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    try {
      const container = await getContainer();
      const id = `${wallet}:user`;
      const { resource } = await container.item(id, wallet).read<any>();
      const followersCount = Number(resource?.followersCount || 0);
      const followingCount = Number(resource?.followingCount || 0);
      let viewerFollows = false;
      if (/^0x[a-f0-9]{40}$/i.test(viewer) && viewer !== wallet) {
        const followId = `${viewer}:follow:${wallet}`;
        try {
          const { resource: rel } = await container.item(followId, viewer).read<any>();
          viewerFollows = !!rel;
        } catch {}
      }
      return NextResponse.json({ followersCount, followingCount, viewerFollows });
    } catch (e: any) {
      return NextResponse.json({ followersCount: 0, followingCount: 0, viewerFollows: false, degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


