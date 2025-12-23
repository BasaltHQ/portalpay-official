import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireApimOrJwt } from "@/lib/gateway-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isHexAddress(addr?: string): addr is `0x${string}` {
  try {
    return !!addr && /^0x[a-fA-F0-9]{40}$/i.test(String(addr).trim());
  } catch {
    return false;
  }
}

function getDocId(brandKey?: string): string {
  const k = String(brandKey || "").toLowerCase();
  if (!k || k === "portalpay") return "site:config";
  return `site:config:${k}`;
}

/**
 * Admin: Site Config Normalizer
 * POST /api/admin/site-config/normalize
 * Body:
 *  {
 *    wallet: "0x...",            // required merchant wallet
 *    brandKey?: "portalpay|..."  // optional; inferred if omitted
 *  }
 *
 * Function:
 *  - Finds the split-bearing site_config for a wallet (top-level splitAddress/split.address or nested under config.*)
 *  - Mirrors the normalized split into BOTH:
 *      * brand-scoped doc:   id => site:config:<brandKey>
 *      * legacy doc mirror:  id => site:config
 *    including nested config.* mirrors (config.splitAddress, config.split.address, config.recipients)
 *  - Ensures brandKey is persisted on both docs
 *  - Idempotent
 */
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    // Require admin or split write scope
    try {
      await requireApimOrJwt(req, ["site_config:normalize", "split:write"]);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "forbidden", correlationId },
        { status: e?.status || 403, headers: { "x-correlation-id": correlationId } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const walletRaw = String(body?.wallet || "").toLowerCase();
    if (!isHexAddress(walletRaw)) {
      return NextResponse.json(
        { error: "invalid_wallet", correlationId },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }
    const brandKeyReq = body?.brandKey ? String(body.brandKey).toLowerCase() : undefined;

    const c = await getContainer();

    // Locate any split-bearing doc for this wallet (top-level or nested)
    const spec = {
      query:
        "SELECT TOP 1 VALUE c FROM c WHERE c.type=@type AND c.wallet=@wallet AND (IS_DEFINED(c.splitAddress) OR (IS_DEFINED(c.split.address) AND LENGTH(c.split.address) > 0) OR IS_DEFINED(c.config.splitAddress) OR (IS_DEFINED(c.config.split.address) AND LENGTH(c.config.split.address) > 0)) ORDER BY c.updatedAt DESC",
      parameters: [
        { name: "@type", value: "site_config" },
        { name: "@wallet", value: walletRaw },
      ],
    } as { query: string; parameters: { name: string; value: any }[] };

    const { resources } = await c.items.query(spec).fetchAll();
    const found = Array.isArray(resources) && resources[0] ? resources[0] : null;

    // Resolve fields
    const cfg = found && typeof found === "object" && typeof found.config === "object" ? found.config : undefined;
    const splitTop = String(found?.splitAddress || "").toLowerCase();
    const splitObj = String(found?.split?.address || "").toLowerCase();
    const splitCfgTop = String(cfg?.splitAddress || "").toLowerCase();
    const splitCfgObj = String(cfg?.split?.address || "").toLowerCase();
    const resolvedAddrRaw = splitTop || splitObj || splitCfgTop || splitCfgObj || "";

    const hasAddress = isHexAddress(resolvedAddrRaw);
    const resolvedAddr = hasAddress ? (resolvedAddrRaw as `0x${string}`) : undefined;

    const recsTop = Array.isArray(found?.split?.recipients) ? found.split.recipients : undefined;
    const recsCfg = Array.isArray(cfg?.split?.recipients) ? cfg.split.recipients : (Array.isArray(cfg?.recipients) ? cfg.recipients : undefined);
    const resolvedRecipients = Array.isArray(recsTop) ? recsTop : (Array.isArray(recsCfg) ? recsCfg : []);

    const brandKey = String(brandKeyReq || found?.brandKey || "portalpay").toLowerCase();

    // Build normalized brand-scoped document
    const ts = Date.now();
    const brandDocId = getDocId(brandKey);
    const normalizedBrandScoped: any = {
      ...(found || {}),
      id: brandDocId,
      wallet: walletRaw,
      brandKey,
      type: "site_config",
      updatedAt: ts,
      splitAddress: resolvedAddr || undefined,
      split: {
        address: resolvedAddr || "",
        recipients: Array.isArray(resolvedRecipients) ? resolvedRecipients : [],
        brandKey,
      },
      // Mirror into nested config.* for robust readers
      config: {
        ...(found?.config || {}),
        splitAddress: resolvedAddr || undefined,
        split: {
          address: resolvedAddr || "",
          recipients: Array.isArray(resolvedRecipients) ? resolvedRecipients : [],
        },
        recipients: Array.isArray(resolvedRecipients) ? resolvedRecipients : [],
      },
    };

    // Build normalized legacy mirror (site:config)
    const normalizedLegacy: any = {
      ...normalizedBrandScoped,
      id: "site:config",
      brandKey,
      type: "site_config",
      updatedAt: ts,
    };

    // Upsert both
    await c.items.upsert(normalizedBrandScoped);
    await c.items.upsert(normalizedLegacy);

    return NextResponse.json(
      {
        ok: true,
        correlationId,
        wallet: walletRaw,
        brandKey,
        splitAddress: resolvedAddr,
        recipientsCount: Array.isArray(resolvedRecipients) ? resolvedRecipients.length : 0,
        docs: [
          { id: normalizedBrandScoped.id, updatedAt: normalizedBrandScoped.updatedAt },
          { id: normalizedLegacy.id, updatedAt: normalizedLegacy.updatedAt },
        ],
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
