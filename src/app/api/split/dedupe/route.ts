import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import crypto from "node:crypto";
import { requireApimOrJwt } from "@/lib/gateway-auth";
import { requireRole } from "@/lib/auth";

/**
 * POST /api/split/dedupe
 * Admin/server-only endpoint to detect duplicate splitAddress bindings across merchants
 * and clean up the incorrect entries to allow re-deployment.
 *
 * Process:
 * 1. Scan all site_config docs with splitAddress (legacy) or split.address (nested)
 * 2. Group by split address; find duplicates (same split bound to multiple merchant wallets)
 * 3. For each duplicate group:
 *    - Determine the "actual" merchant by inspecting split.recipients:
 *      * Prefer the doc where recipients include the merchant wallet (sharesBps > 0), ideally recipients[0]
 *      * If multiple match, prefer recipients[0] match; else fall back to the first match
 *      * If none match, retain the first doc and mark others for cleanup
 *    - For all other docs in the group (not the actual merchant):
 *      * Remove partner split configuration by clearing splitAddress and split fields
 *      * This makes the container detect no split or a misconfigured split and prompt re-deploy
 * 4. Return a report of actions
 *
 * Note:
 * - This endpoint does NOT call on-chain payee(0) due to RPC/ABI constraints; it uses persisted recipients
 *   as a proxy to identify the correct merchant. This aligns with the UI detection logic and enables re-deploy.
 * - If strict on-chain verification is needed later, we can extend this to fetch ABI and perform an eth_call.
 */

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  // Authorize: allow APIM/JWT with write scope or admin JWT; fall back to 403 if neither is present
  let caller: any = undefined;
  try {
    caller = await requireApimOrJwt(req, ["site_config_write", "split:write"]);
  } catch (e1: any) {
    try {
      caller = await requireRole(req, "admin");
    } catch (e2: any) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  try {
    const c = await getContainer();

    // Fetch all site_config docs that contain split addresses
    const spec = {
      query: `
        SELECT c.id, c.wallet, c.brandKey, c.splitAddress, c.split
        FROM c
        WHERE c.type='site_config' AND (IS_DEFINED(c.splitAddress) OR IS_DEFINED(c.split.address))
      `,
    } as { query: string };

    const { resources } = await c.items.query(spec).fetchAll();
    const rows = Array.isArray(resources) ? (resources as any[]) : [];

    // Build groups by normalized split address
    type Row = {
      id: string;
      wallet: string;
      brandKey?: string;
      splitAddress?: string;
      split?: { address?: string; recipients?: { address: string; sharesBps: number }[]; brandKey?: string };
    };
    const groups = new Map<string, Row[]>();

    for (const r of rows) {
      try {
        const wallet = String(r?.wallet || "").toLowerCase();
        const a1 = String(r?.splitAddress || "").toLowerCase();
        const a2 = String(r?.split?.address || "").toLowerCase();
        const addr = /^0x[a-f0-9]{40}$/i.test(a1) ? a1 : ( /^0x[a-f0-9]{40}$/i.test(a2) ? a2 : "" );
        if (!addr || !/^0x[a-f0-9]{40}$/i.test(wallet)) continue;
        const list = groups.get(addr) || [];
        list.push({
          id: String(r?.id || ""),
          wallet,
          brandKey: typeof r?.brandKey === "string" ? String(r.brandKey).toLowerCase() : undefined,
          splitAddress: a1 || a2,
          split: (r?.split && typeof r.split === "object") ? {
            address: a2 || a1,
            recipients: Array.isArray(r?.split?.recipients) ? r.split.recipients : [],
            brandKey: typeof r?.split?.brandKey === "string" ? String(r.split.brandKey).toLowerCase() : undefined,
          } : undefined,
        });
        groups.set(addr, list);
      } catch {}
    }

    const actions: any[] = [];
    let duplicatesFound = 0;
    let cleanedEntries = 0;

    // Helper to score which doc looks like the "actual" merchant
    const scoreDoc = (row: Row): number => {
      try {
        const wallet = String(row.wallet || "").toLowerCase();
        const recs = Array.isArray(row.split?.recipients) ? (row.split!.recipients as any[]) : [];
        const count = recs.length;
        const hasWallet = recs.some((r: any) => String(r?.address || "").toLowerCase() === wallet && Number(r?.sharesBps || 0) > 0);
        const isFirst = recs.length > 0 && String(recs[0]?.address || "").toLowerCase() === wallet;
        // Prefer first recipient match, then any match, then more recipients
        return (isFirst ? 1000 : 0) + (hasWallet ? 100 : 0) + count;
      } catch { return 0; }
    };

    for (const [splitAddr, list] of groups.entries()) {
      if (!Array.isArray(list) || list.length <= 1) continue; // only duplicates
      duplicatesFound++;

      // Determine the "actual" merchant row by scoring recipients alignment
      const scored = [...list].map((row) => ({ row, score: scoreDoc(row) }));
      scored.sort((a, b) => b.score - a.score);
      const actual = scored[0].row;
      const wrong = scored.slice(1).map((s) => s.row);

      const groupReport: any = {
        splitAddress: splitAddr,
        totalBindings: list.length,
        actualMerchant: actual.wallet,
        actualDocId: actual.id,
        wrongBindings: wrong.map((w) => ({ wallet: w.wallet, docId: w.id })),
      };

      // Cleanup wrong entries: clear splitAddress and split to enable re-deploy
      for (const w of wrong) {
        try {
          const { resource } = await c.item(String(w.id || ""), String(w.wallet || "")).read<any>();
          const prev = resource || {};
          const cleaned = {
            ...prev,
            id: String(w.id || ""),
            wallet: String(w.wallet || "").toLowerCase(),
            type: "site_config",
            updatedAt: Date.now(),
            // Remove any bound split to force re-detection/redeployment
            splitAddress: undefined,
            split: undefined,
            // Keep partnerWallet/brandKey unchanged; UI/GET route will synthesize expected recipients for preview
          };
          await c.items.upsert(cleaned);
          cleanedEntries++;
          actions.push({
            action: "cleared_split",
            docId: w.id,
            wallet: w.wallet,
            splitAddress: splitAddr,
            reason: "duplicate_binding_cleanup",
          });
        } catch (e: any) {
          actions.push({
            action: "error_clearing",
            docId: w.id,
            wallet: w.wallet,
            splitAddress: splitAddr,
            error: e?.message || "cosmos_upsert_failed",
          });
        }
      }

      actions.push({ action: "retained_actual", docId: actual.id, wallet: actual.wallet, splitAddress: splitAddr });
      actions.push({ action: "group_processed", ...groupReport });
    }

    return NextResponse.json({
      ok: true,
      correlationId,
      duplicatesFound,
      cleanedEntries,
      actions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "dedupe_failed", correlationId },
      { status: 500 }
    );
  }
}
