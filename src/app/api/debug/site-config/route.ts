import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireApimOrJwt } from "@/lib/gateway-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Debug Site Config Inspector
 * GET /api/debug/site-config?wallet=0x...&limit=10
 *
 * Returns all site_config documents for the given wallet (legacy and brand-scoped),
 * ordered by updatedAt DESC, along with a summary of split status and brandKey.
 *
 * Auth: requires APIM/JWT (site_config_read) or Orders create privilege for debug use.
 */
export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    // Auth (prefer a dedicated read permission; fallback to orders:create for debug)
    try {
      await requireApimOrJwt(req, ["site_config_read"]);
    } catch {
      try {
        await requireApimOrJwt(req, ["orders:create"]);
      } catch (e: any) {
        return NextResponse.json(
          { error: e?.message || "forbidden", correlationId },
          { status: e?.status || 403, headers: { "x-correlation-id": correlationId } }
        );
      }
    }

    const url = new URL(req.url);
    const wallet = String(url.searchParams.get("wallet") || "").toLowerCase();
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(50, Number(limitRaw || 10)));

    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json(
        { error: "invalid_wallet", correlationId },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const c = await getContainer();

    // Optional: allow mapping by split address as well as wallet
    const splitAddr = String(url.searchParams.get("splitAddress") || "").toLowerCase();

    // Query all site_config docs (legacy and brand-scoped) for wallet or split address mapping
    let spec = {
      query:
        "SELECT TOP @limit VALUE c FROM c WHERE c.type=@type AND c.wallet=@wallet ORDER BY c.updatedAt DESC",
      parameters: [
        { name: "@limit", value: limit },
        { name: "@type", value: "site_config" },
        { name: "@wallet", value: wallet },
      ],
    } as { query: string; parameters: { name: string; value: any }[] };

    // If split address was provided, broaden query to match by wallet or split fields (top-level and nested under config)
    if (/^0x[a-f0-9]{40}$/i.test(splitAddr)) {
      spec = {
        query:
          "SELECT TOP @limit VALUE c FROM c WHERE c.type=@type AND (LOWER(c.wallet)=@addr OR LOWER(c.splitAddress)=@addr OR LOWER(c.split.address)=@addr OR LOWER(c.config.splitAddress)=@addr OR LOWER(c.config.split.address)=@addr) ORDER BY c.updatedAt DESC",
        parameters: [
          { name: "@limit", value: limit },
          { name: "@type", value: "site_config" },
          { name: "@addr", value: splitAddr },
        ],
      };
    }

    const { resources } = await c.items.query(spec).fetchAll();
    const docs = Array.isArray(resources) ? resources : [];

    // Build summary (supports top-level and nested under config.*)
    const normalize = (raw: any) => {
      const isHex = (s: any) => /^0x[a-fA-F0-9]{40}$/.test(String(s || "").trim());
      const cfg = raw && typeof raw === "object" && typeof raw.config === "object" ? raw.config : undefined;

      // Split address resolution
      const splitTop = isHex(raw?.splitAddress) ? String(raw.splitAddress) : undefined;
      const splitTopObj = raw?.split && typeof raw.split === "object" ? raw.split : undefined;
      const splitTopObjAddr = isHex(splitTopObj?.address) ? String(splitTopObj?.address) : undefined;

      const splitCfg = cfg?.split && typeof cfg.split === "object" ? cfg.split : undefined;
      const splitCfgAddrTop = isHex(cfg?.splitAddress) ? String(cfg?.splitAddress) : undefined;
      const splitCfgAddrObj = isHex(splitCfg?.address) ? String(splitCfg?.address) : undefined;

      const resolvedSplitAddr =
        splitTop ||
        splitTopObjAddr ||
        splitCfgAddrTop ||
        splitCfgAddrObj ||
        undefined;

      // Recipients from either top-level split or nested config.split/recipients or config.recipients
      const recsIn =
        (Array.isArray(splitTopObj?.recipients) ? splitTopObj?.recipients : undefined) ||
        (Array.isArray(splitCfg?.recipients) ? splitCfg?.recipients : undefined) ||
        (Array.isArray(cfg?.recipients) ? cfg?.recipients : undefined) ||
        [];
      const recs = Array.isArray(recsIn) ? recsIn : [];

      const brandKey = String(raw?.brandKey || "").toLowerCase() || undefined;
      const updatedAt = Number(raw?.updatedAt || 0) || undefined;

      return {
        id: String(raw?.id || ""),
        brandKey,
        updatedAt,
        splitAddress: resolvedSplitAddr,
        recipientsCount: recs.length,
        recipients: recs.map((r: any) => ({
          address: String(r?.address || ""),
          sharesBps: Number(r?.sharesBps || 0),
        })),
      };
    };

    const summary = docs.map((d) => normalize(d));

    // Determine effective latest doc
    const latest = summary[0] || undefined;

    return NextResponse.json(
      {
        ok: true,
        correlationId,
        wallet,
        count: summary.length,
        latest,
        docs: summary,
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

declare const crypto: {
  randomUUID: () => string;
};
