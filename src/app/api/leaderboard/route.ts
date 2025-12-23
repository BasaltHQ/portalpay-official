import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

function toHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h, m, s: sec, text: `${h}h ${m}m ${sec}s` };
}

/**
 * PortalPay Loyalty Leaderboard
 * XP is calculated as xpPerDollar * USD spent. Show both xp and amountSpentUsd.
 * Data source: Cosmos 'user_merchant' ledger persisted per buyer and merchant.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
    const queryWallet = String(url.searchParams.get("merchant") || url.searchParams.get("wallet") || "").toLowerCase();
    const isHex = (s: string) => /^0x[a-f0-9]{40}$/i.test(String(s || "").trim());
    const merchant = [headerWallet, queryWallet].find((x) => isHex(x)) || "";

    if (!merchant) {
      // Scope required: only show leaderboard for a specific merchant
      return NextResponse.json({ top: [], reason: "merchant_required" }, { status: 200 });
    }

    const container = await getContainer(); // defaults: cb_billing / events

    // Resolve merchant-specific loyalty multiplier (xpPerDollar) from shop config
    let xpPerDollar = 1;
    try {
      const { resource } = await container.item("shop:config", merchant).read<any>();
      const v = Number(resource?.xpPerDollar);
      if (Number.isFinite(v) && v >= 0) xpPerDollar = Math.min(1000, v);
    } catch {
      // Default to 1 if not configured
      xpPerDollar = 1;
    }

    // Read persisted per-merchant buyer XP ledger for this merchant recipient
    const spec = {
      query: `
        SELECT c.wallet, c.xp, c.amountSpentUsd, c.purchasedSeconds, c.usedSeconds, c.lastSeen
        FROM c
        WHERE c.type='user_merchant' AND IS_DEFINED(c.wallet) AND c.merchant = @recipient
      `,
      parameters: [{ name: "@recipient", value: merchant }],
    } as { query: string; parameters: { name: string; value: string }[] };

    const { resources } = await container.items.query(spec).fetchAll();
    const rows = Array.isArray(resources) ? resources : [];

    const normalized = rows
      .map((r: any) => {
        const wallet = String(r.wallet || "").toLowerCase();
        if (!/^0x[a-f0-9]{40}$/.test(wallet)) return null;

        const purchasedSeconds = Number(r.purchasedSeconds || 0);
        const usedSeconds = Number(r.usedSeconds || 0);
        const balanceSeconds = Math.max(0, purchasedSeconds - usedSeconds);

        const amountSpentUsd = Number(r.amountSpentUsd || 0);
        const xp = Math.floor(Math.max(0, Number(r.xp || 0)));

        return {
          wallet,
          xp,
          amountSpentUsd,
          purchasedSeconds,
          usedSeconds,
          purchasedHMS: toHMS(purchasedSeconds),
          usedHMS: toHMS(usedSeconds),
          balanceSeconds,
          balanceHMS: toHMS(balanceSeconds),
          lastSeen: r.lastSeen,
        };
      })
      .filter(Boolean) as {
        wallet: string;
        xp: number;
        amountSpentUsd: number;
        purchasedSeconds: number;
        usedSeconds: number;
        purchasedHMS: { h: number; m: number; s: number; text: string };
        usedHMS: { h: number; m: number; s: number; text: string };
        balanceSeconds: number;
        balanceHMS: { h: number; m: number; s: number; text: string };
        lastSeen?: number;
      }[];

    // Sort by XP descending
    normalized.sort((a, b) => b.xp - a.xp);

    const top = normalized.slice(0, 100);
    return NextResponse.json({ top, xpPerDollar, merchant });
  } catch (e: any) {
    return NextResponse.json(
      { top: [], degraded: true, reason: e?.message || "leaderboard_unavailable" },
      { status: 200 }
    );
  }
}
