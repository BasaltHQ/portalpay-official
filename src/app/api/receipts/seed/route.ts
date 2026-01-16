import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getSiteConfig } from "@/lib/site-config";
import { pushReceipts, getReceipts } from "@/lib/receipts-mem";

type ReceiptLineItem = {
  label: string;
  priceUsd: number;
  qty?: number;
};

export type Receipt = {
  receiptId: string;
  totalUsd: number;
  currency: "USD";
  lineItems: ReceiptLineItem[];
  createdAt: number;
  brandName?: string;
  status?: string;
};

function toCents(n: number) {
  return Math.round(n * 100);
}
function fromCents(c: number) {
  return Math.round(c) / 100;
}

function buildSample(i: number, brandName: string, wallet: string, cfg?: any) {
  const ts = Date.now() - i * 60_000; // spread by minutes
  const baseId = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  const receiptId = `R-${baseId}`;

  // Sample line items (Toast-style)
  const items: ReceiptLineItem[] = [
    { label: i % 2 === 0 ? "Chicken Bowl" : "Veggie Bowl", priceUsd: i % 2 === 0 ? 10.49 : 9.99 },
    { label: "Iced Tea", priceUsd: 1.99 },
  ];
  const subtotalCents = items.reduce((s, it) => s + toCents(it.priceUsd), 0);
  const taxRate = (() => {
    try {
      const tc = cfg?.taxConfig;
      const defCode = typeof tc?.defaultJurisdictionCode === "string" ? tc.defaultJurisdictionCode : "";
      const list = Array.isArray(tc?.jurisdictions) ? tc.jurisdictions : [];
      const j = list.find((x: any) => String(x.code || "").toLowerCase() === String(defCode || "").toLowerCase());
      const comps = Array.isArray((j as any)?.components) ? (j as any).components : [];
      if (comps.length > 0) {
        const sum = comps.reduce((s: number, c: any) => s + Math.max(0, Math.min(1, Number(c.rate || 0))), 0);
        return Math.max(0, Math.min(1, sum));
      }
      const r = Number((j as any)?.rate || 0);
      if (Number.isFinite(r) && r >= 0 && r <= 1) return r;
      return 0;
    } catch { return 0; }
  })();
  const taxCents = Math.round(subtotalCents * Math.max(0, Math.min(1, taxRate)));
  const baseWithoutFeeCents = subtotalCents + taxCents;
  const basePlatformFeePct = typeof cfg?.basePlatformFeePct === "number" ? Math.max(0, cfg.basePlatformFeePct) : 0.5;
  const merchantAddOnPct = Math.max(0, Number(cfg?.processingFeePct || 0));
  const totalFeePct = Math.max(0, basePlatformFeePct + merchantAddOnPct);
  const processingFeeCents = Math.round(baseWithoutFeeCents * (totalFeePct / 100));
  const lineItems: ReceiptLineItem[] = [
    ...items,
    ...(taxCents > 0 ? [{ label: "Tax", priceUsd: fromCents(taxCents) }] : []),
    ...(processingFeeCents > 0 ? [{ label: "Processing Fee", priceUsd: fromCents(processingFeeCents) }] : []),
  ];
  const totalUsd = fromCents(baseWithoutFeeCents + processingFeeCents);

  const doc = {
    id: `receipt:${receiptId}`,
    type: "receipt",
    wallet, // container partition key (merchant)
    receiptId,
    totalUsd,
    currency: "USD",
    lineItems,
    createdAt: ts,
    brandName,
    status: "generated",
    statusHistory: [{ status: "generated", ts }],
  };

  const receipt: Receipt = {
    receiptId,
    totalUsd,
    currency: "USD",
    lineItems,
    createdAt: ts,
    brandName,
    status: "generated",
  };

  return { doc, receipt };
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);

  const merchant = String(req.headers.get("x-wallet") || "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/i.test(merchant)) {
    return NextResponse.json({ ok: false, error: "merchant_required" }, { status: 400, headers: { "x-correlation-id": correlationId } });
  }

  // Superadmin gating: only NEXT_PUBLIC_RECIPIENT_ADDRESS may seed
  const superadmin = (process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "").toLowerCase();
  if (!superadmin || merchant !== superadmin) {
    return NextResponse.json(
      { ok: false, error: "forbidden_superadmin_only" },
      { status: 403, headers: { "x-correlation-id": correlationId } }
    );
  }

  const count = 1;

  try {
    const container = await getContainer();

    let cfg: any = null;
    try {
      const { resource: resWallet } = await container.item("site:config", merchant).read<any>();
      cfg = resWallet || null;
    } catch { }
    if (!cfg) {
      try {
        const { resource: resGlobal } = await container.item("site:config", "site:config").read<any>();
        cfg = resGlobal || null;
      } catch { }
    }

    let brandName = cfg?.theme?.brandName || "Your Brand";
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.brandName) brandName = String(body.brandName).trim();
    } catch { }

    // Disallow reseeding if this merchant already has any receipts
    const specChk = { query: "SELECT VALUE COUNT(1) FROM c WHERE c.type='receipt' AND c.wallet=@w", parameters: [{ name: "@w", value: merchant }] } as any;
    const { resources: rChk } = await container.items.query(specChk).fetchAll();
    const existing = Number((Array.isArray(rChk) && rChk[0]) || 0);
    if (existing > 0) {
      return NextResponse.json(
        { ok: false, error: "seed_disabled", reason: "already_seeded" },
        { status: 409, headers: { "x-correlation-id": correlationId } }
      );
    }

    const receipts: Receipt[] = [];
    for (let i = 0; i < count; i++) {
      const { doc, receipt } = buildSample(i, brandName, merchant, cfg);
      await container.items.upsert(doc as any);
      receipts.push(receipt);
    }

    // Also cache in memory for degraded/local mode UIs
    pushReceipts(receipts as any);

    return NextResponse.json(
      { ok: true, count: receipts.length, receipts },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    // Graceful degrade when Cosmos isn't configured/available
    const cfg = await getSiteConfig().catch(() => null as any);
    const brandName = cfg?.theme?.brandName || "Your Brand";

    // Disallow reseeding if this merchant already has any receipts (in-memory)
    const existing = (getReceipts(undefined, merchant) || []).length;
    if (existing > 0) {
      return NextResponse.json(
        { ok: false, error: "seed_disabled", reason: "already_seeded", degraded: true },
        { status: 409, headers: { "x-correlation-id": correlationId } }
      );
    }

    const receipts: Receipt[] = [];
    for (let i = 0; i < count; i++) {
      const { receipt } = buildSample(i, brandName, merchant, cfg);
      receipts.push(receipt);
    }

    // Persist to in-memory store so Admin table can read them even without Cosmos
    pushReceipts(receipts.map((r) => ({ ...r, wallet: merchant })) as any);

    return NextResponse.json(
      {
        ok: true,
        count: receipts.length,
        receipts,
        degraded: true,
        reason: e?.message || "cosmos_unavailable",
      },
      { status: 200, headers: { "x-correlation-id": correlationId } }
    );
  }
}
