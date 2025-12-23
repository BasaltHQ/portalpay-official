import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";

type DiscountRule = { minMinutes: number; discountPct: number };
type PricingConfig = {
  ethPer2Min: number;
  minMinutes: number;
  discountRules: DiscountRule[];
};

const DEFAULT_CONFIG: PricingConfig = {
  ethPer2Min: 0.001,
  minMinutes: 2,
  discountRules: [
    { minMinutes: 30, discountPct: 0.10 },
    { minMinutes: 60, discountPct: 0.20 },
  ],
};

async function isOwner(req: NextRequest): Promise<boolean> {
  // UI-only: rely strictly on JWT cookie; ignore any client-provided x-wallet header
  const owner = (process.env.NEXT_PUBLIC_OWNER_WALLET || "").toLowerCase();
  const authed = await getAuthenticatedWallet(req);
  const w = String(authed || "").toLowerCase();
  return !!owner && !!w && w === owner;
}

export async function GET(_req: NextRequest) {
  try {
    const c = await getContainer();
    try {
      const { resource } = await c.item("config:pricing", "config").read<any>();
      const cfg = resource || {};
      const out: PricingConfig = {
        ethPer2Min: typeof cfg.ethPer2Min === "number" && cfg.ethPer2Min > 0 ? cfg.ethPer2Min : DEFAULT_CONFIG.ethPer2Min,
        minMinutes: Math.max(1, Number(cfg.minMinutes || DEFAULT_CONFIG.minMinutes)),
        discountRules: Array.isArray(cfg.discountRules)
          ? cfg.discountRules
              .map((r: any) => ({
                minMinutes: Math.max(1, Number(r?.minMinutes || 0)),
                discountPct: Math.max(0, Math.min(0.95, Number(r?.discountPct || 0))),
              }))
              .filter((r: DiscountRule) => r.minMinutes >= 1 && r.discountPct >= 0)
              .sort((a: DiscountRule, b: DiscountRule) => a.minMinutes - b.minMinutes)
          : DEFAULT_CONFIG.discountRules,
      };
      return NextResponse.json({ config: out });
    } catch {
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }
  } catch (e: any) {
    return NextResponse.json({ config: DEFAULT_CONFIG, degraded: true, reason: e?.message || "cosmos_unavailable" });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isOwner(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const ethPer2Min = Number(body.ethPer2Min);
    const minMinutes = Math.max(1, Number(body.minMinutes || 1));
    const rules = Array.isArray(body.discountRules) ? body.discountRules : [];
    const discountRules: DiscountRule[] = rules
      .map((r: any) => ({ minMinutes: Math.max(1, Number(r?.minMinutes || 0)), discountPct: Math.max(0, Math.min(0.95, Number(r?.discountPct || 0))) }))
      .filter((r: DiscountRule) => r.minMinutes >= 1)
      .sort((a: DiscountRule, b: DiscountRule) => a.minMinutes - b.minMinutes)
      .slice(0, 8);

    if (!Number.isFinite(ethPer2Min) || ethPer2Min <= 0) {
      return NextResponse.json({ error: "invalid_rate" }, { status: 400 });
    }

    const doc = {
      id: "config:pricing",
      type: "config_pricing",
      wallet: "config", // partition key
      ethPer2Min,
      minMinutes,
      discountRules,
      updatedAt: Date.now(),
    } as any;

    try {
      const c = await getContainer();
      await c.items.upsert(doc);
      return NextResponse.json({ ok: true, config: { ethPer2Min, minMinutes, discountRules } });
    } catch (e: any) {
      return NextResponse.json({ ok: true, degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
