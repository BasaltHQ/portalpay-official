import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireApimOrJwt } from "@/lib/gateway-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Comprehensive Orders Diagnosis
 * GET /api/debug/diagnose?wallet=0x...[,0x...]&limit=10
 *
 * For each provided wallet:
 * - Lists all site_config documents (legacy and brand-scoped) ordered by updatedAt DESC
 * - Highlights latest doc, brandKey, splitAddress/split.address, recipients and counts
 * - Detects mismatches (e.g., latest doc has brandKey=portalpay with no split while legacy doc has split)
 * - Provides remediation guidance to prevent recurrence
 *
 * Auth: APIM/JWT token is required (site_config_read or orders:create).
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
    const walletParam = String(url.searchParams.get("wallet") || "").toLowerCase();
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(50, Number(limitRaw || 10)));

    const wallets = walletParam
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^0x[a-f0-9]{40}$/i.test(w));

    if (wallets.length === 0) {
      return NextResponse.json(
        { error: "invalid_wallet", message: "Provide one or more 0x wallets via wallet=0x...,0x...", correlationId },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const c = await getContainer();

    const results: any[] = [];
    for (const wallet of wallets) {
      // Query site_config docs for wallet
      const spec = {
        query:
          "SELECT TOP @limit c FROM c WHERE c.type=@type AND c.wallet=@wallet ORDER BY c.updatedAt DESC",
        parameters: [
          { name: "@limit", value: limit },
          { name: "@type", value: "site_config" },
          { name: "@wallet", value: wallet },
        ],
      } as { query: string; parameters: { name: string; value: any }[] };

      const { resources } = await c.items.query(spec).fetchAll();
      const docs = Array.isArray(resources) ? resources : [];

      const isHex = (s: any) => /^0x[a-fA-F0-9]{40}$/.test(String(s || "").trim());
      const normalize = (raw: any) => {
        const splitAddress = isHex(raw?.splitAddress) ? String(raw.splitAddress) : undefined;
        const split = raw?.split && typeof raw.split === "object" ? raw.split : undefined;
        const splitAddr2 = isHex(split?.address) ? String(split?.address) : undefined;
        const recs = Array.isArray(split?.recipients) ? split.recipients : [];
        const brandKey = String(raw?.brandKey || "").toLowerCase() || undefined;
        const updatedAt = Number(raw?.updatedAt || 0) || undefined;
        const id = String(raw?.id || "");
        const recipients = Array.isArray(recs)
          ? recs.map((r: any) => ({
              address: String(r?.address || ""),
              sharesBps: Number(r?.sharesBps || 0),
            }))
          : [];
        return {
          id,
          brandKey,
          updatedAt,
          splitAddress: splitAddress || splitAddr2 || undefined,
          recipientsCount: recipients.length,
          recipients,
        };
      };

      const summary = docs.map((d) => normalize(d));
      const latest = summary[0] || undefined;

      // Detect conditions
      const hasSplitAny = summary.some((s) => isHex(s.splitAddress));
      const legacyDoc = summary.find((s) => s.id === "site:config");
      const brandScopedDoc = summary.find((s) => /^site:config:/.test(s.id));

      const issues: string[] = [];

      if (!latest) {
        issues.push("no_site_config_docs_for_wallet");
      } else {
        if (!isHex(latest.splitAddress)) {
          issues.push("latest_doc_has_no_bound_split_address");
        }
        if (!latest.brandKey) {
          issues.push("latest_doc_missing_brandKey");
        }
        // If legacy doc has split but latest brand-scoped doc lacks split, flag mismatch
        if (legacyDoc && isHex(legacyDoc.splitAddress) && latest && !isHex(latest.splitAddress)) {
          issues.push("legacy_doc_has_split_but_latest_lacks_split");
        }
      }

      if (!hasSplitAny) {
        issues.push("no_split_bound_in_any_doc_for_wallet");
      }

      // Remediation guidance
      const remediation: string[] = [];
      if (latest && !isHex(latest.splitAddress)) {
        remediation.push(
          "Bind splitAddress into the latest site_config doc (brand-scoped id) for this wallet. Use /api/split/deploy POST with x-wallet and splitAddress to upsert."
        );
      }
      if (!latest || !latest.brandKey) {
        remediation.push(
          "Ensure brandKey is present on the latest site_config doc. If this wallet belongs to a partner brand, persist brandKey=<partner> when upserting site_config."
        );
      }
      if (legacyDoc && isHex(legacyDoc.splitAddress) && brandScopedDoc && !isHex(brandScopedDoc.splitAddress)) {
        remediation.push(
          "Copy splitAddress and recipients from legacy doc into brand-scoped site_config doc to avoid brand/key scoping mismatches."
        );
      }
      if (issues.length === 0) {
        remediation.push("No issues detected with site_config split binding.");
      }

      results.push({
        wallet,
        count: summary.length,
        latest,
        legacy: legacyDoc || null,
        brandScoped: brandScopedDoc || null,
        docs: summary,
        issues,
        remediation,
      });
    }

    return NextResponse.json(
      { ok: true, correlationId, results },
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
