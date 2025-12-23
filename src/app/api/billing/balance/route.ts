import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
    const authed = await getAuthenticatedWallet(req);
    const wallet = (authed || headerWallet).toLowerCase();
    if (!wallet) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "x-correlation-id": correlationId } });
    }
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) return NextResponse.json({ error: "invalid wallet" }, { status: 400, headers: { "x-correlation-id": correlationId } });

    try {
      const container = await getContainer();
      const query = {
        query: "SELECT c.type, c.seconds FROM c WHERE c.wallet = @w",
        parameters: [{ name: "@w", value: wallet }],
      } as { query: string; parameters: { name: string; value: string }[] };

      const { resources } = await container.items.query(query).fetchAll();
      let purchased = 0;
      let used = 0;
      for (const r of resources as any[]) {
        if (r.type === "purchase") purchased += Number(r.seconds || 0);
        else if (r.type === "usage") used += Number(r.seconds || 0);
      }
      let balance = Math.max(0, purchased - used);
      // Consider subscription plan on user doc
      try {
        const userId = `${wallet}:user`;
        const { resource } = await container.item(userId, wallet).read<any>();
        const plan = resource?.plan;
        const planExpiry = Number(resource?.planExpiry || 0);
        const now = Date.now();
        if (plan === 'unlimited' && planExpiry && planExpiry > now) {
          return NextResponse.json({ balanceSeconds: 3600*24*365, purchasedSeconds: purchased, usedSeconds: used, unlimited: true, plan, planExpiry }, { headers: { "x-correlation-id": correlationId } });
        }
        if (plan === 'basic' && planExpiry && planExpiry > now) {
          // Basic plan grants daily minutes in addition to purchased balance (tracked client-side). Here we just return plan info.
          return NextResponse.json({ balanceSeconds: balance, purchasedSeconds: purchased, usedSeconds: used, plan, planExpiry }, { headers: { "x-correlation-id": correlationId } });
        }
      } catch {}
      return NextResponse.json({ balanceSeconds: balance, purchasedSeconds: purchased, usedSeconds: used }, { headers: { "x-correlation-id": correlationId } });
    } catch (e: any) {
      // Degraded: return zero balances but not hard fail
      return NextResponse.json({ balanceSeconds: 0, purchasedSeconds: 0, usedSeconds: 0, degraded: true, reason: e?.message || "cosmos_unavailable" }, { status: 200, headers: { "x-correlation-id": correlationId } });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500, headers: { "x-correlation-id": correlationId } });
  }
}
