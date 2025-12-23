import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

/**
 * GET /api/split/find-by-address?addr=0x...
 * Utility endpoint to list all site_config bindings that reference a given split address
 * and provide recipient alignment hints to determine the correct merchant.
 *
 * Query Params:
 *  - addr | address: The split contract address (0x...)
 *
 * Auth:
 *  - Read-only; does not require JWT/APIM. If needed later, we can add requireApimOrJwt(req, ["split:read"]).
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const addrRaw = (url.searchParams.get("addr") || url.searchParams.get("address") || "").toLowerCase().trim();
    const isHex = /^0x[a-f0-9]{40}$/i.test(addrRaw);
    if (!isHex) {
      return NextResponse.json({ ok: false, error: "invalid_address" }, { status: 400 });
    }

    const c = await getContainer();
    const spec = {
      query: `
        SELECT c.id, c.wallet, c.brandKey, c.splitAddress, c.split
        FROM c
        WHERE c.type='site_config' AND (LOWER(c.splitAddress)=@addr OR LOWER(c.split.address)=@addr)
      `,
      parameters: [{ name: "@addr", value: addrRaw }],
    } as { query: string; parameters: { name: string; value: any }[] };

    const { resources } = await c.items.query(spec).fetchAll();
    const rows = Array.isArray(resources) ? (resources as any[]) : [];

    const bindings = rows.map((r) => {
      try {
        const wallet: string = String(r?.wallet || "").toLowerCase();
        const id: string = String(r?.id || "");
        const brandKey: string | undefined = typeof r?.brandKey === "string" ? String(r.brandKey).toLowerCase() : undefined;
        const splitAddr = String(r?.splitAddress || r?.split?.address || "").toLowerCase();
        const recs = Array.isArray(r?.split?.recipients) ? (r.split.recipients as any[]) : [];
        const count = recs.length;
        const firstRecipient = count > 0 ? String(recs[0]?.address || "").toLowerCase() : "";
        const hasWalletRecipient = recs.some((x: any) => String(x?.address || "").toLowerCase() === wallet && Number(x?.sharesBps || 0) > 0);
        const firstMatchesWallet = firstRecipient === wallet;

        return {
          docId: id,
          wallet,
          brandKey,
          splitAddress: splitAddr,
          recipientsCount: count,
          firstRecipient,
          hasWalletRecipient,
          firstMatchesWallet,
          recipients: recs.map((x: any) => ({
            address: String(x?.address || "").toLowerCase(),
            sharesBps: Math.max(0, Math.min(10000, Number(x?.sharesBps || 0))),
          })),
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      ok: true,
      address: addrRaw,
      count: bindings.length,
      bindings,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
