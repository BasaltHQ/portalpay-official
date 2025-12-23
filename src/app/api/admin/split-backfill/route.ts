import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf } from "@/lib/security";

type SiteConfigDoc = {
  id: string;
  wallet: string;
  brandKey?: string;
  type?: string;
  updatedAt?: number;
  splitAddress?: string;
  split?: { address?: string; recipients?: { address: string; sharesBps: number }[]; brandKey?: string };
  partnerWallet?: string;
};

/**
 * Admin-only backfill to audit and correct site_config split metadata.
 *
 * GET: Returns an audit report
 *  - total: total site_config docs scanned
 *  - withSplitAddress: docs where splitAddress is defined
 *  - missingSplitSubdoc: docs where splitAddress is defined but split.address is missing/empty
 *  - mismatchedAddress: docs where splitAddress != split.address
 *  - brandIdMismatch: docs where id does not match brandKey (e.g. site:config vs site:config:<brandKey>)
 *
 * POST: Performs backfill
 *  - For missingSplitSubdoc or mismatchedAddress, updates split.address to splitAddress and preserves recipients/brandKey
 *  - For brandIdMismatch, writes a corrected doc under the computed id (site:config or site:config:<brandKey>)
 *
 * Notes:
 *  - Partition key is wallet; we always upsert under the merchant wallet partition.
 *  - Recipients are preserved if present; otherwise left as existing.
 *  - id normalization:
 *      portalpay (no brandKey or brandKey=="portalpay") => "site:config"
 *      partner brand => "site:config:<brandKey>"
 */

function computeDocId(brandKey?: string): string {
  const b = String(brandKey || "").toLowerCase();
  if (!b || b === "portalpay") return "site:config";
  return `site:config:${b}`;
}

function isHex(s: string | undefined): boolean {
  if (!s) return false;
  const v = String(s).toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(v);
}

async function auditDocs(container: any): Promise<{
  total: number;
  withSplitAddress: number;
  missingSplitSubdoc: number;
  mismatchedAddress: number;
  brandIdMismatch: number;
  samples: {
    missingSplitSubdoc: SiteConfigDoc[];
    mismatchedAddress: SiteConfigDoc[];
    brandIdMismatch: SiteConfigDoc[];
  };
}> {
  const query = {
    query: `
      SELECT c.id, c.wallet, c.brandKey, c.type, c.updatedAt, c.splitAddress, c.split, c.partnerWallet
      FROM c
      WHERE c.type = 'site_config'
    `,
  };
  const { resources } = await container.items.query(query as any).fetchAll();
  const docs: SiteConfigDoc[] = Array.isArray(resources) ? resources : [];

  let withSplitAddress = 0;
  let missingSplitSubdoc = 0;
  let mismatchedAddress = 0;
  let brandIdMismatch = 0;

  const samplesMissing: SiteConfigDoc[] = [];
  const samplesMismatch: SiteConfigDoc[] = [];
  const samplesBrandId: SiteConfigDoc[] = [];

  for (const d of docs) {
    const hasSplitAddr = isHex(d.splitAddress);
    if (hasSplitAddr) withSplitAddress += 1;

    const splitAddr = (d.splitAddress || "").toLowerCase();
    const splitSubAddr = ((d.split?.address || "") as string).toLowerCase();
    const splitSubDefined = isHex(d.split?.address);

    if (hasSplitAddr && !splitSubDefined) {
      missingSplitSubdoc += 1;
      if (samplesMissing.length < 10) samplesMissing.push(d);
    } else if (hasSplitAddr && splitSubDefined && splitSubAddr !== splitAddr) {
      mismatchedAddress += 1;
      if (samplesMismatch.length < 10) samplesMismatch.push(d);
    }

    const expectedId = computeDocId(d.brandKey);
    if (d.id !== expectedId) {
      brandIdMismatch += 1;
      if (samplesBrandId.length < 10) samplesBrandId.push(d);
    }
  }

  return {
    total: docs.length,
    withSplitAddress,
    missingSplitSubdoc,
    mismatchedAddress,
    brandIdMismatch,
    samples: {
      missingSplitSubdoc: samplesMissing,
      mismatchedAddress: samplesMismatch,
      brandIdMismatch: samplesBrandId,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const caller = await requireThirdwebAuth(req);
    // Simple admin gate: require ADMIN_WALLETS elevation inside requireThirdwebAuth
    // If stricter role system exists, swap to requireRole(req, 'admin')
    if (!caller || !Array.isArray(caller.roles) || !caller.roles.includes("admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const container = await getContainer();
    const report = await auditDocs(container);
    return NextResponse.json({ ok: true, report });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "audit_failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireThirdwebAuth(req);
    if (!caller || !Array.isArray(caller.roles) || !caller.roles.includes("admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    try {
      requireCsrf(req);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "bad_origin" }, { status: e?.status || 403 });
    }

    const container = await getContainer();
    const query = {
      query: `
        SELECT c.id, c.wallet, c.brandKey, c.type, c.updatedAt, c.splitAddress, c.split, c.partnerWallet
        FROM c
        WHERE c.type = 'site_config'
      `,
    };
    const { resources } = await container.items.query(query as any).fetchAll();
    const docs: SiteConfigDoc[] = Array.isArray(resources) ? resources : [];

    let fixedMissingSplitSubdoc = 0;
    let fixedMismatchedAddress = 0;
    let fixedBrandId = 0;

    for (const d of docs) {
      const hasSplitAddr = isHex(d.splitAddress);
      const splitAddr = (d.splitAddress || "").toLowerCase();
      const splitSubAddr = ((d.split?.address || "") as string).toLowerCase();
      const splitSubDefined = isHex(d.split?.address);
      const wallet = (d.wallet || "").toLowerCase();

      // Skip if no valid wallet (partition key) or no splitAddress
      if (!isHex(wallet as any)) continue;

      // 1) Backfill missing split subdoc or mismatched address
      if (hasSplitAddr && (!splitSubDefined || splitSubAddr !== splitAddr)) {
        const nextDoc: SiteConfigDoc = {
          ...d,
          id: computeDocId(d.brandKey),
          wallet,
          type: "site_config",
          updatedAt: Date.now(),
          splitAddress: splitAddr,
          split: {
            address: splitAddr,
            recipients: Array.isArray(d.split?.recipients) ? d.split!.recipients! : [],
            brandKey: d.brandKey,
          },
        };

        await container.items.upsert(nextDoc);
        if (!splitSubDefined) fixedMissingSplitSubdoc += 1;
        else fixedMismatchedAddress += 1;
      }

      // 2) Normalize doc id to match brandKey (portalpay => "site:config", partner => "site:config:<brandKey>")
      const expectedId = computeDocId(d.brandKey);
      if (d.id !== expectedId) {
        const nextDoc: SiteConfigDoc = {
          ...d,
          id: expectedId,
          updatedAt: Date.now(),
        };
        await container.items.upsert(nextDoc);
        fixedBrandId += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      fixedMissingSplitSubdoc,
      fixedMismatchedAddress,
      fixedBrandId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "backfill_failed" }, { status: 500 });
  }
}
