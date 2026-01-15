import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { auditEvent } from "@/lib/audit";
import { fetchEthUsd, fetchBtcUsd, fetchXrpUsd } from "@/lib/eth";
import { getBrandKey } from "@/config/brands";

/**
 * POST /api/orders/reindex
 * Buyer-initiated reindexing of on-chain purchases
 * - Scans all split contracts where the buyer made payments
 * - Generates synthetic receipts for unlinked transactions
 * - Ensures all immutable on-chain payments are reflected in purchase history
 * - Maintains brand/tenant isolation
 */

function isHexAddr(s: string): boolean {
  return /^0x[a-f0-9]{40}$/i.test(String(s || "").trim());
}

function isTxHash(s: string): boolean {
  return /^0x[a-f0-9]{64}$/i.test(String(s || "").trim());
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  try {
    // Authenticate buyer
    const caller = await requireThirdwebAuth(req);
    const buyerWallet = String(caller.wallet || "").toLowerCase();

    if (!isHexAddr(buyerWallet)) {
      return NextResponse.json(
        { ok: false, error: "invalid_buyer_wallet" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    console.log(`[REINDEX] Starting reindex for buyer ${buyerWallet.slice(0, 10)}...`);

    const container = await getContainer();
    const brandKey = getBrandKey();
    const baseOrigin = req.nextUrl.origin;

    // Find all merchants this buyer has transacted with
    // Query user_merchant docs for this buyer's wallet partition
    const merchantsSet = new Set<string>();

    try {
      const spec = {
        query: "SELECT c.merchant FROM c WHERE c.type='user_merchant' AND c.wallet=@buyer",
        parameters: [{ name: "@buyer", value: buyerWallet }]
      };
      const { resources } = await container.items.query(spec).fetchAll();

      for (const row of resources || []) {
        const m = String(row?.merchant || "").toLowerCase();
        if (isHexAddr(m)) merchantsSet.add(m);
      }
    } catch (e) {
      console.error('[REINDEX] Error querying user_merchant:', e);
    }

    // Also query split_index docs to find any merchants (within brand scope)
    try {
      const spec = {
        query: "SELECT c.merchantWallet FROM c WHERE c.type='split_index' AND c.brandKey=@brand",
        parameters: [{ name: "@brand", value: brandKey }]
      };
      const { resources } = await container.items.query(spec).fetchAll();

      for (const row of resources || []) {
        const m = String(row?.merchantWallet || "").toLowerCase();
        if (isHexAddr(m)) merchantsSet.add(m);
      }
    } catch (e) {
      console.error('[REINDEX] Error querying split_index:', e);
    }

    const merchants = Array.from(merchantsSet);
    console.log(`[REINDEX] Found ${merchants.length} merchants to scan`);

    // Dynamic USD pricing from Coinbase (no hardcoded constants)
    const [ethUsd, btcUsd, xrpUsd] = await Promise.all([
      fetchEthUsd().catch(() => 0),
      fetchBtcUsd().catch(() => 0),
      fetchXrpUsd().catch(() => 0),
    ]);
    function toUsd(token: string, value: number): number {
      const t = String(token || "").toUpperCase();
      const price =
        t === "ETH" ? ethUsd :
          t === "USDC" ? 1.0 :
            t === "USDT" ? 1.0 :
              t === "CBBTC" ? btcUsd :
                t === "CBXRP" ? xrpUsd :
                  1.0;
      const usd = Number(value || 0) * Number(price || 0);
      return +usd.toFixed(2);
    }

    // Load inventory items for a merchant (scoped by brandKey when present)
    async function loadInventoryForMerchant(container: any, merchantWallet: string, brandKey?: string) {
      try {
        const baseSelect =
          "SELECT c.id, c.wallet, c.sku, c.name, c.priceUsd, c.updatedAt FROM c WHERE c.type='inventory_item' AND c.wallet=@wallet";
        const spec = brandKey
          ? {
            query:
              baseSelect +
              " AND (LOWER(c.brandKey)=@brandKey OR NOT IS_DEFINED(c.brandKey)) ORDER BY c.updatedAt DESC",
            parameters: [
              { name: "@wallet", value: merchantWallet },
              { name: "@brandKey", value: String(brandKey).toLowerCase() },
            ],
          }
          : {
            query: baseSelect + " ORDER BY c.updatedAt DESC",
            parameters: [{ name: "@wallet", value: merchantWallet }],
          };
        const { resources } = await container.items.query(spec as any).fetchAll();
        return Array.isArray(resources) ? resources : [];
      } catch {
        return [];
      }
    }

    // Correlate purchase line items to inventory by SKU/name/price tolerance and stamp itemId/sku/name
    function correlateLineItems(purchase: any[], inventory: any[]) {
      try {
        const invBySku = new Map<string, any>();
        const invByName = new Map<string, any>();
        for (const it of Array.isArray(inventory) ? inventory : []) {
          const sku = String(it?.sku || "").trim().toLowerCase();
          const name = String(it?.name || "").trim().toLowerCase();
          if (sku) invBySku.set(sku, it);
          if (name) invByName.set(name, it);
        }

        const norm = (s: any) => String(s || "").trim().toLowerCase();
        const similar = (a: string, b: string) =>
          !!a && !!b && (a === b || a.includes(b) || b.includes(a));

        const out: any[] = [];
        for (const p of Array.isArray(purchase) ? purchase : []) {
          const sku = norm(p?.sku);
          const name = norm(p?.label || p?.name);
          const price = Number(p?.priceUsd || 0);
          let match: any = null;

          if (sku && invBySku.has(sku)) {
            match = invBySku.get(sku);
          } else if (name && invByName.has(name)) {
            match = invByName.get(name);
          } else if (name) {
            // Loose name/price tolerance
            match = (inventory || []).find((it: any) => {
              const iname = norm(it?.name);
              const iprice = Number(it?.priceUsd || 0);
              return similar(iname, name) && Math.abs(iprice - price) <= 1.0;
            });
          }

          if (match) {
            out.push({
              ...p,
              itemId: match.id || p.itemId,
              sku: match.sku || p.sku,
              label: match.name || p.label,
            });
          } else {
            out.push(p);
          }
        }
        return out;
      } catch {
        return Array.isArray(purchase) ? purchase : [];
      }
    }

    // Create a recovered tracking receipt to preserve pre-checkout itemization for correlation
    async function upsertRecoveredTrackingReceipt(
      container: any,
      merchantWallet: string,
      buyerWallet: string,
      txHash: string,
      timestamp: number,
      purchaseData: any,
      token: string,
      value: number
    ) {
      try {
        const hashKey = String(txHash || "nohash").toLowerCase();
        const rid = `R-RECOVERED-${hashKey.slice(0, 10).toUpperCase()}-${timestamp}`;
        let lineItems: any[] = [];
        try {
          if (purchaseData && Array.isArray((purchaseData as any).items)) {
            lineItems = (purchaseData as any).items
              .slice(0, 50)
              .map((it: any) => ({
                label: String(it?.label || it?.name || "Item"),
                priceUsd: Number(it?.priceUsd || it?.amountUsd || 0),
                qty: Number.isFinite(Number(it?.qty)) ? Number(it?.qty) : undefined,
                sku: typeof it?.sku === "string" ? it.sku : undefined,
                itemId: typeof it?.itemId === "string" ? it.itemId : undefined,
              }))
              .filter((it: any) => Number(it.priceUsd || 0) >= 0);
          }
        } catch { }
        if (!Array.isArray(lineItems) || lineItems.length === 0) {
          const amtUsd = toUsd(String(token || "").toUpperCase(), Number(value || 0));
          lineItems = [
            { label: `On-chain Payment (${String(token || "").toUpperCase()})`, priceUsd: amtUsd > 0 ? amtUsd : Number(value || 0) }
          ];
        }
        const totalUsd = lineItems.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0);
        await container.items.upsert({
          id: `receipt:${rid}`,
          type: "receipt",
          wallet: merchantWallet,
          receiptId: rid,
          totalUsd: +totalUsd.toFixed(2),
          currency: "USD",
          lineItems,
          createdAt: timestamp,
          status: "buyer_logged_in",
          buyerWallet,
          brandKey,
          metadata: {
            archived: true,
            source: "tracking_recovery",
            token: String(token || "").toUpperCase(),
            tokenValue: Number(value || 0),
            ...(purchaseData ? { purchaseData } : {}),
          },
          lastUpdatedAt: Date.now(),
        });
        const txKey = hashKey
          ? hashKey
          : `nohash:${String(token || "").toUpperCase()}:${Number(value || 0)}:${buyerWallet}:${merchantWallet}:${timestamp}`;
        await container.items.upsert({
          id: `buyer_tx_link:${buyerWallet}:${txKey}`,
          type: "buyer_tx_link",
          txHash: txKey,
          buyerWallet,
          merchantWallet,
          brandKey,
          receiptId: rid,
          linkedAt: Date.now(),
        });
        console.log(`[REINDEX] Upserted recovered tracking receipt ${rid}`);
      } catch (e) {
        console.error(`[REINDEX] Failed to upsert recovered tracking receipt:`, e);
      }
    }

    // Guess inventory items by total USD when purchaseData/tracking are unavailable
    function guessInventoryItemsByTotal(inventory: any[], targetUsd: number): any[] {
      try {
        const target = Math.max(0, Number(targetUsd || 0));
        const tol = Math.max(0.5, target * 0.20); // 20% tolerance

        const items = (Array.isArray(inventory) ? inventory : [])
          .filter((it: any) => Number(it?.priceUsd || 0) > 0)
          .sort((a: any, b: any) => Number(b?.priceUsd || 0) - Number(a?.priceUsd || 0));

        // Single item exact-ish match
        const single = items.find((it: any) => Math.abs(Number(it.priceUsd || 0) - target) <= tol);
        if (single) {
          return [{
            label: String(single?.name || single?.sku || "Item"),
            priceUsd: Number(single?.priceUsd || 0),
            sku: typeof single?.sku === "string" ? single.sku : undefined,
            itemId: typeof single?.id === "string" ? single.id : undefined,
          }];
        }

        // Try pairs
        const cap = Math.min(items.length, 50);
        for (let i = 0; i < cap; i++) {
          const a = items[i];
          for (let j = i + 1; j < cap; j++) {
            const b = items[j];
            const sum = Number(a?.priceUsd || 0) + Number(b?.priceUsd || 0);
            if (Math.abs(sum - target) <= tol) {
              return [
                {
                  label: String(a?.name || a?.sku || "Item"),
                  priceUsd: Number(a?.priceUsd || 0),
                  sku: typeof a?.sku === "string" ? a.sku : undefined,
                  itemId: typeof a?.id === "string" ? a.id : undefined,
                },
                {
                  label: String(b?.name || b?.sku || "Item"),
                  priceUsd: Number(b?.priceUsd || 0),
                  sku: typeof b?.sku === "string" ? b.sku : undefined,
                  itemId: typeof b?.id === "string" ? b.id : undefined,
                },
              ];
            }
          }
        }

        // Fallback: closest single item
        if (items.length) {
          let best: any = null;
          let bestDiff = Number.POSITIVE_INFINITY;
          for (const it of items) {
            const diff = Math.abs(Number(it?.priceUsd || 0) - target);
            if (diff < bestDiff) {
              bestDiff = diff;
              best = it;
            }
          }
          if (best) {
            return [{
              label: String(best?.name || best?.sku || "Item"),
              priceUsd: Number(best?.priceUsd || 0),
              sku: typeof best?.sku === "string" ? best.sku : undefined,
              itemId: typeof best?.id === "string" ? best.id : undefined,
            }];
          }
        }
      } catch { }
      return [];
    }

    let receiptsGenerated = 0;
    let receiptsLinked = 0;
    let transactionsFound = 0;
    const processedMerchants: string[] = [];

    // Process each merchant
    for (const merchantWallet of merchants) {
      try {
        // Resolve split address
        let splitAddress = "";
        try {
          const { resource: siteCfg } = await container.item("site:config", merchantWallet).read<any>();
          const resolved = String(siteCfg?.splitAddress || siteCfg?.split?.address || "").toLowerCase();
          if (isHexAddr(resolved)) {
            splitAddress = resolved;
          }
        } catch { }

        if (!isHexAddr(splitAddress)) {
          console.log(`[REINDEX] Merchant ${merchantWallet.slice(0, 10)}... has no split configured, skipping`);
          continue;
        }

        console.log(`[REINDEX] Processing merchant ${merchantWallet.slice(0, 10)}... split ${splitAddress.slice(0, 10)}...`);

        // Fetch split transactions
        const txUrl = `${baseOrigin}/api/split/transactions?splitAddress=${encodeURIComponent(splitAddress)}&merchantWallet=${encodeURIComponent(merchantWallet)}&limit=1000`;
        const txRes = await fetch(txUrl, { cache: "no-store" });
        const txData = await txRes.json().catch(() => ({}));

        if (!txRes.ok || !txData?.ok) {
          console.error(`[REINDEX] Failed to fetch transactions for ${merchantWallet.slice(0, 10)}...`);
          continue;
        }

        const transactions: any[] = Array.isArray(txData.transactions) ? txData.transactions : [];
        // Group by tx hash; compute effective payment per hash considering related token transfers
        const byHash = new Map<string, any[]>();
        for (const t of transactions) {
          if (String(t?.type || "") !== "payment") continue;
          const h = String(t?.hash || "").toLowerCase();
          if (!isTxHash(h)) continue;
          const arr = byHash.get(h) || [];
          arr.push(t);
          byHash.set(h, arr);
        }
        const paymentTxs: any[] = [];
        for (const [h, arr] of byHash.entries()) {
          // Prefer non-ETH token payment from buyer to split
          let chosen = arr
            .filter(x => String(x?.token || "ETH").toUpperCase() !== "ETH")
            .filter(x => String(x?.from || "").toLowerCase() === buyerWallet)
            .sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0))[0];

          if (!chosen) {
            // If only ETH payment present (possibly 0 ETH), try correlated token transfers
            const ethRec = arr.find(x => String(x?.token || "ETH").toUpperCase() === "ETH");
            const related = Array.isArray(ethRec?.relatedTokens) ? ethRec.relatedTokens : [];
            // Look for token transfer ending at split (aggregators may forward on behalf of buyer)
            const rel = related as Array<{ symbol: string; value: number; to: string; from: string }>;
            const rt = rel
              .filter((t) => String(t?.to || "").toLowerCase() === splitAddress)
              .sort((a: { value: number }, b: { value: number }) => Number(b?.value || 0) - Number(a?.value || 0))[0];
            if (rt) {
              chosen = { ...ethRec, token: rt.symbol, value: rt.value, from: String(ethRec?.from || "").toLowerCase(), to: splitAddress };
            }
          }
          if (!chosen) {
            // Fallback: any record from buyer within the group
            chosen = arr.find(x => String(x?.from || "").toLowerCase() === buyerWallet) || arr[0];
          }
          if (chosen && String(chosen?.from || "").toLowerCase() === buyerWallet) {
            paymentTxs.push(chosen);
          }
        }

        // Also include direct token payments to the split (aggregator → split) even if from != buyer or hash missing
        const directTokenPayments = transactions.filter((t: any) =>
          String(t?.type || "") === "payment" &&
          String(t?.token || "ETH").toUpperCase() !== "ETH" &&
          String(t?.to || "").toLowerCase() === splitAddress &&
          Number(t?.value || 0) > 0
        );

        // Deduplicate by composite key: hash|token|value|timestamp
        const seen = new Set<string>();
        for (const tx of paymentTxs) {
          const key = `${String(tx?.hash || "").toLowerCase()}|${String(tx?.token || "")}|${Number(tx?.value || 0)}|${Number(tx?.timestamp || 0)}`;
          seen.add(key);
        }
        for (const tx of directTokenPayments) {
          const key = `${String(tx?.hash || "").toLowerCase()}|${String(tx?.token || "")}|${Number(tx?.value || 0)}|${Number(tx?.timestamp || 0)}`;
          if (!seen.has(key)) {
            paymentTxs.push(tx);
            seen.add(key);
          }
        }

        console.log(`[REINDEX] Found ${paymentTxs.length} payment transactions (including aggregator token transfers) for ${merchantWallet.slice(0, 10)}...`);
        transactionsFound += paymentTxs.length;

        // Additionally, link merchant release events (token distributions) to existing receipts by time/amount
        try {
          const merchantReleaseTxs = (transactions || []).filter((t: any) =>
            String(t?.type || "") === "release" &&
            String(t?.releaseType || "") === "merchant" &&
            String(t?.token || "ETH").toUpperCase() !== "ETH" &&
            Number(t?.value || 0) > 0
          );

          for (const relTx of merchantReleaseTxs) {
            try {
              const relToken = String(relTx.token || "").toUpperCase();
              const relAmountUsd = toUsd(relToken, Number(relTx.value || 0));
              const relTs = Number(relTx.timestamp || Date.now());
              const windowMs = 2 * 60 * 60 * 1000; // ±2 hours
              const tolUsd = Math.max(5, relAmountUsd * 0.20); // 20% tolerance

              const specRel = {
                query:
                  "SELECT c.id, c.wallet, c.receiptId, c.totalUsd, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant ORDER BY c.createdAt DESC OFFSET 0 LIMIT 200",
                parameters: [
                  { name: "@merchant", value: merchantWallet }
                ]
              } as { query: string; parameters: { name: string; value: any }[] };

              const { resources: relRows } = await container.items.query(specRel).fetchAll();
              const candidates = Array.isArray(relRows) ? relRows : [];
              let best: any = null;
              let bestScore = Number.POSITIVE_INFINITY;
              for (const c of candidates) {
                const tUsd = Number(c?.totalUsd || 0);
                const tCreated = Number(c?.createdAt || 0);
                const diffUsd = Math.abs(tUsd - relAmountUsd);
                const diffTime = Math.abs(tCreated - relTs) / (5 * 60 * 1000); // per 5 minutes
                const score = diffUsd + diffTime;
                if (score < bestScore) {
                  bestScore = score;
                  best = c;
                }
              }
              if (best && best.receiptId) {
                try {
                  const did = `receipt:${String(best.receiptId)}`;
                  const { resource: rbest } = await container.item(did, merchantWallet).read<any>();
                  if (rbest) {
                    await container.items.upsert({
                      ...rbest,
                      buyerWallet, // stamp buyer since this buyer initiated the reindex
                      metadata: {
                        ...(rbest.metadata || {}),
                        source: "on_chain_release_link",
                        token: relToken,
                        tokenValue: Number(relTx.value || 0)
                      },
                      lastUpdatedAt: Date.now()
                    });
                    receiptsLinked++;
                    console.log(`[REINDEX] Linked merchant release (${relToken} ${Number(relTx.value || 0)}) to receipt ${best.receiptId}`);
                  }
                } catch { }
              }
            } catch (e) {
              console.error(`[REINDEX] Release linking failed:`, e);
            }
          }
        } catch (e) {
          console.error(`[REINDEX] Error scanning merchant releases:`, e);
        }

        // Process each payment transaction
        for (const tx of paymentTxs) {
          const txHash = String(tx.hash || "").toLowerCase();
          const tokenSym = String(tx.token || "ETH").toUpperCase();
          const isHashValid = isTxHash(txHash);
          if (!isHashValid && tokenSym === "ETH") continue;
          const txKey = isHashValid
            ? txHash
            : `nohash:${tokenSym}:${Number(tx.value || 0)}:${String(tx.from || "").toLowerCase()}:${String(tx.to || "").toLowerCase()}:${Number(tx.timestamp || 0)}`;

          // Skip zero-value ETH payments to avoid generating $0 synthetic receipts
          if (tokenSym === "ETH" && Number(tx.value || 0) <= 0) {
            continue;
          }

          // Check if receipt already exists with this transactionHash
          let existingReceipt: any = null;
          try {
            const spec = {
              query: "SELECT c.id, c.receiptId, c.buyerWallet, c.transactionHash FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.transactionHash=@txHash",
              parameters: [
                { name: "@merchant", value: merchantWallet },
                { name: "@txHash", value: txHash }
              ]
            };
            const { resources } = await container.items.query(spec).fetchAll();
            existingReceipt = resources && resources[0];
          } catch { }

          // If receipt exists, ensure buyerWallet is set and enrich inventory if minimal
          if (existingReceipt) {
            const receiptId = String(existingReceipt.receiptId || "").trim();
            if (receiptId) {
              try {
                const docId = `receipt:${receiptId}`;
                const { resource } = await container.item(docId, merchantWallet).read<any>();
                if (resource) {
                  const currentBuyer = String(resource.buyerWallet || "").toLowerCase();
                  let updated = false;
                  let patch: any = { ...resource };

                  if (currentBuyer !== buyerWallet) {
                    patch.buyerWallet = buyerWallet;
                    patch.lastUpdatedAt = Date.now();
                    updated = true;
                    receiptsLinked++;
                    console.log(`[REINDEX] Ensured buyer linkage on receipt ${receiptId} (was: ${currentBuyer || "unset"})`);
                  } else {
                    console.log(`[REINDEX] Receipt ${receiptId} already linked to buyer`);
                  }

                  // If receipt is minimal (no items or generic on-chain line) or zero total, try enriching from purchaseData
                  const isMinimal = !Array.isArray(resource.lineItems) || resource.lineItems.length === 0 ||
                    (resource.lineItems.length === 1 && String(resource.lineItems[0]?.label || "").toLowerCase().includes("on-chain payment"));
                  const totalZero = Number(resource.totalUsd || 0) <= 0;

                  if (isMinimal || totalZero) {
                    try {
                      const specEvent = {
                        query: "SELECT TOP 1 c.purchaseData, c.transactions FROM c WHERE c.type='payment_event_thirdweb' AND c.brandKey=@brand",
                        parameters: [{ name: "@brand", value: brandKey }]
                      } as { query: string; parameters: { name: string; value: any }[] };
                      const { resources: evs } = await container.items.query(specEvent).fetchAll();
                      const match = Array.isArray(evs) ? evs.find((e: any) => {
                        const arr = Array.isArray(e?.transactions) ? e.transactions : [];
                        return arr.some((t: any) => String(t?.transactionHash || "").toLowerCase() === txHash);
                      }) : null;
                      if (match && Array.isArray(match?.purchaseData?.items)) {
                        const items = match.purchaseData.items.slice(0, 50).map((it: any) => ({
                          label: String(it?.label || it?.name || "Item"),
                          priceUsd: Number(it?.priceUsd || it?.amountUsd || 0),
                          qty: Number.isFinite(Number(it?.qty)) ? Number(it?.qty) : undefined,
                          sku: typeof it?.sku === "string" ? it.sku : undefined,
                          itemId: typeof it?.itemId === "string" ? it.itemId : undefined,
                        }));
                        const newTotal = items.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0);
                        patch.lineItems = items;
                        patch.totalUsd = +newTotal.toFixed(2);
                        patch.lastUpdatedAt = Date.now();
                        updated = true;
                        console.log(`[REINDEX] Enriched receipt ${receiptId} with ${items.length} inventory items from purchaseData`);
                        // Preserve a recovered tracking receipt for correlation (in case tracking was previously deleted)
                        try {
                          await upsertRecoveredTrackingReceipt(
                            container,
                            merchantWallet,
                            buyerWallet,
                            txHash,
                            Number(tx.timestamp || Date.now()),
                            match.purchaseData,
                            tokenSym,
                            Number(tx.value || 0)
                          );
                        } catch { }
                      }
                    } catch (e) {
                      console.error(`[REINDEX] Error enriching receipt ${receiptId} from purchaseData:`, e);
                    }

                    // If purchaseData enrichment wasn't possible, copy items from nearby tracking receipt (same buyer/merchant; pick best by USD+time score)
                    if (!updated) {
                      try {
                        const amountUsdNearby = toUsd(tokenSym, Number(tx.value || 0));
                        const specTr2 = {
                          query:
                            "SELECT c.lineItems, c.totalUsd, c.receiptId, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND (LOWER(c.status)='checkout_initialized' OR LOWER(c.status)='buyer_logged_in' OR LOWER(c.status)='link_opened') ORDER BY c.createdAt DESC OFFSET 0 LIMIT 50",
                          parameters: [
                            { name: "@merchant", value: merchantWallet },
                            { name: "@buyer", value: buyerWallet }
                          ]
                        } as { query: string; parameters: { name: string; value: any }[] };
                        const { resources: trRows2 } = await container.items.query(specTr2).fetchAll();
                        const listTr = Array.isArray(trRows2) ? trRows2 : [];
                        let chosen: any = null;
                        let bestScore = Number.POSITIVE_INFINITY;
                        for (const cand of listTr) {
                          const li = Array.isArray(cand?.lineItems) ? cand.lineItems : [];
                          if (!li.length) continue;
                          const tUsd = Number(cand?.totalUsd || 0);
                          const tCreated = Number(cand?.createdAt || 0);
                          const diffUsd = Math.abs(tUsd - amountUsdNearby);
                          const diffTime = Math.abs(tCreated - Number(tx.timestamp || Date.now())) / (60 * 60 * 1000); // hours
                          const score = diffUsd + diffTime;
                          if (score < bestScore) {
                            bestScore = score;
                            chosen = cand;
                          }
                        }
                        if (chosen) {
                          patch.lineItems = chosen.lineItems;
                          patch.totalUsd = Number(chosen.totalUsd || amountUsdNearby);
                          patch.lastUpdatedAt = Date.now();
                          updated = true;
                          console.log(`[REINDEX] Enriched receipt ${receiptId} from tracking ${String(chosen?.receiptId || "")} (score ${bestScore.toFixed(2)})`);
                        }
                      } catch { }
                    }
                  }

                  if (updated) {
                    // Correlate to shop inventory and recompute total
                    try {
                      const invItems = await loadInventoryForMerchant(container, merchantWallet, brandKey);
                      const stamped = correlateLineItems(Array.isArray(patch.lineItems) ? patch.lineItems : [], invItems);
                      const newTotal = stamped.reduce(
                        (s: number, it: any) => s + Number(it.priceUsd || 0) * Number(it.qty || 1),
                        0
                      );
                      patch.lineItems = stamped;
                      patch.totalUsd = +newTotal.toFixed(2);
                    } catch { }

                    // Upgrade status to paid and lock to prevent deletion
                    if (String(patch.status || "").toLowerCase() !== "paid") {
                      const now = Date.now();
                      patch.status = "paid";
                      patch.statusHistory = Array.isArray(patch.statusHistory)
                        ? [...patch.statusHistory, { status: "paid", ts: now }]
                        : [{ status: "paid", ts: now }];
                    }
                    patch.metadata = { ...(patch.metadata || {}), locked: true };
                    await container.items.upsert({ ...patch, brandKey });
                  }
                }
              } catch (e) {
                console.error(`[REINDEX] Error ensuring buyer linkage for receipt ${receiptId}:`, e);
              }
            }
            continue;
          }

          // Attempt expectedToken/amount match for hashed payments (merchant receipts with expectedToken/expectedAmountToken)
          try {
            const amountTok = Number(tx.value || 0);
            const ts = Number(tx.timestamp || Date.now());
            const windowMsExact = 2 * 60 * 60 * 1000;
            const specExpectedAny = {
              query:
                "SELECT c.id, c.wallet, c.receiptId, c.createdAt, c.expectedToken, c.expectedAmountToken, c.metadata FROM c WHERE c.type='receipt' AND c.wallet=@merchant ORDER BY c.createdAt DESC OFFSET 0 LIMIT 200",
              parameters: [
                { name: "@merchant", value: merchantWallet }
              ]
            } as { query: string; parameters: { name: string; value: any }[] };
            const { resources: rowsExpAny } = await container.items.query(specExpectedAny).fetchAll();
            const listExpAny = Array.isArray(rowsExpAny) ? rowsExpAny : [];
            let bestHashed: any = null;
            let bestHashedScore = Number.POSITIVE_INFINITY;
            for (const c of listExpAny) {
              const created = Number(c?.createdAt || 0);
              if (Math.abs(created - ts) > windowMsExact) continue;
              const expToken = String(c?.expectedToken ?? c?.metadata?.expectedToken ?? c?.metadata?.token ?? "").toUpperCase();
              const expAmt = Number(c?.expectedAmountToken ?? c?.metadata?.expectedAmountToken ?? c?.metadata?.tokenValue ?? 0);
              if (expToken !== tokenSym) continue;
              const diffAmt = Math.abs(expAmt - amountTok);
              const diffTime = Math.abs(created - ts) / (10 * 60 * 1000);
              const score = diffAmt + diffTime;
              if (score < bestHashedScore) {
                bestHashedScore = score;
                bestHashed = c;
              }
            }
            if (bestHashed && bestHashed.receiptId) {
              const did = `receipt:${String(bestHashed.receiptId)}`;
              const { resource: rHashed } = await container.item(did, merchantWallet).read<any>();
              if (rHashed) {
                // Build local enrichment independent of later declarations
                let hashedPurchaseData: any = null;
                try {
                  const specEvent = {
                    query: "SELECT TOP 1 c.purchaseData, c.transactions FROM c WHERE c.type='payment_event_thirdweb' AND c.brandKey=@brand",
                    parameters: [{ name: "@brand", value: brandKey }]
                  } as { query: string; parameters: { name: string; value: any }[] };
                  const { resources: evs } = await container.items.query(specEvent).fetchAll();
                  const match = Array.isArray(evs) ? evs.find((e: any) => {
                    const arr = Array.isArray(e?.transactions) ? e.transactions : [];
                    return arr.some((t: any) => String(t?.transactionHash || "").toLowerCase() === txHash);
                  }) : null;
                  if (match && typeof match.purchaseData === "object") {
                    hashedPurchaseData = match.purchaseData;
                  }
                } catch { }

                let hashedLineItems: any[] = [];
                try {
                  if (hashedPurchaseData && Array.isArray((hashedPurchaseData as any).items)) {
                    hashedLineItems = (hashedPurchaseData as any).items
                      .slice(0, 50)
                      .map((it: any) => ({
                        label: String(it?.label || it?.name || "Item"),
                        priceUsd: Number(it?.priceUsd || it?.amountUsd || 0),
                        qty: Number.isFinite(Number(it?.qty)) ? Number(it?.qty) : undefined,
                        sku: typeof it?.sku === "string" ? it.sku : undefined,
                        itemId: typeof it?.itemId === "string" ? it.itemId : undefined,
                      }))
                      .filter((it: any) => Number(it.priceUsd || 0) >= 0);
                  }
                } catch { }
                if (!Array.isArray(hashedLineItems) || hashedLineItems.length === 0) {
                  // Prefer settlement/linked token metadata if present (e.g., USDT), otherwise use tx token/value
                  const metaToken = String(rHashed?.metadata?.token || "").toUpperCase();
                  const metaValue = Number(rHashed?.metadata?.tokenValue ?? 0);
                  const preferredToken = metaToken || tokenSym;
                  const preferredValue = metaValue > 0 ? metaValue : Number(tx.value || 0);
                  const vUsd = toUsd(preferredToken, preferredValue);
                  const fallbackLine = { label: `On-chain Payment (${preferredToken})`, priceUsd: vUsd > 0 ? vUsd : preferredValue };
                  const existingLi = Array.isArray(rHashed?.lineItems) ? rHashed.lineItems : [];
                  const existingUseful =
                    existingLi.length > 1 ||
                    (existingLi.length === 1 && Number(existingLi[0]?.priceUsd || 0) > 0);
                  // Guard: never overwrite useful items (e.g., USDT $25.63) with zero-value placeholder
                  if ((preferredToken === "ETH" && preferredValue <= 0) && existingUseful) {
                    hashedLineItems = existingLi;
                  } else {
                    hashedLineItems = [fallbackLine];
                  }
                }

                const newTotal = hashedLineItems.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0);
                await container.items.upsert({
                  ...rHashed,
                  buyerWallet,
                  brandKey,
                  transactionHash: txHash,
                  transactionTimestamp: ts,
                  lineItems: hashedLineItems,
                  totalUsd: +newTotal.toFixed(2),
                  status: "paid",
                  statusHistory: Array.isArray(rHashed.statusHistory)
                    ? [...rHashed.statusHistory, { status: "paid", ts: Date.now() }]
                    : [{ status: "paid", ts: Date.now() }],
                  metadata: {
                    ...(rHashed.metadata || {}),
                    locked: true,
                    source: "on_chain_reindex_expected_hashed",
                    token: tokenSym,
                    tokenValue: Number(tx.value || 0),
                    ...(hashedPurchaseData ? { purchaseData: hashedPurchaseData } : {})
                  },
                  lastUpdatedAt: Date.now()
                });
                // Preserve recovered tracking receipt for correlation (hashed match path)
                try {
                  await upsertRecoveredTrackingReceipt(container, merchantWallet, buyerWallet, txHash, ts, hashedPurchaseData, tokenSym, Number(tx.value || 0));
                } catch { }
                const linkIdExpHashed = `buyer_tx_link:${buyerWallet}:${txKey}`;
                await container.items.upsert({
                  id: linkIdExpHashed,
                  type: "buyer_tx_link",
                  txHash: txKey,
                  buyerWallet,
                  merchantWallet,
                  receiptId: bestHashed.receiptId,
                  linkedAt: Date.now(),
                  correlationId
                });
                receiptsLinked++;
                console.log(`[REINDEX] Linked existing merchant receipt ${bestHashed.receiptId} via expectedToken match (hashed)`);
                // Remove any synthetic ONCHAIN receipts that duplicate this tx (hashed or nohash)
                try {
                  if (txHash) {
                    const specDupHash = {
                      query: "SELECT c.receiptId FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.transactionHash=@tx AND STARTSWITH(c.receiptId, @prefix)",
                      parameters: [
                        { name: "@merchant", value: merchantWallet },
                        { name: "@tx", value: txHash },
                        { name: "@prefix", value: "R-ONCHAIN-" }
                      ]
                    } as { query: string; parameters: { name: string; value: any }[] };
                    const { resources: dupRowsH } = await container.items.query(specDupHash).fetchAll();
                    const dupsH = Array.isArray(dupRowsH) ? dupRowsH : [];
                    for (const d of dupsH) {
                      const drid = String(d?.receiptId || "");
                      if (!drid) continue;
                      try { await container.item(`receipt:${drid}`, merchantWallet).delete(); } catch { }
                    }
                  } else {
                    // Fallback: delete synthetic near time/amount when txHash is missing
                    const vUsd = toUsd(tokenSym, Number(tx.value || 0));
                    const windowMs = 2 * 60 * 60 * 1000; // ±2h
                    const specDupTime = {
                      query: "SELECT c.receiptId, c.createdAt, c.totalUsd FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND STARTSWITH(c.receiptId, @prefix)",
                      parameters: [
                        { name: "@merchant", value: merchantWallet },
                        { name: "@prefix", value: "R-ONCHAIN-" }
                      ]
                    } as { query: string; parameters: { name: string; value: any }[] };
                    const { resources: dupRowsT } = await container.items.query(specDupTime).fetchAll();
                    const dupsT = Array.isArray(dupRowsT) ? dupRowsT : [];
                    for (const d of dupsT) {
                      const drid = String(d?.receiptId || "");
                      const cAt = Number(d?.createdAt || 0);
                      const tUsd = Number(d?.totalUsd || 0);
                      if (!drid) continue;
                      const withinTime = Math.abs(cAt - ts) <= windowMs;
                      const withinAmt = Math.abs(tUsd - vUsd) <= 1; // $1 tolerance
                      if (withinTime && withinAmt) {
                        try { await container.item(`receipt:${drid}`, merchantWallet).delete(); } catch { }
                      }
                    }
                  }
                } catch { }
                continue;
              }
            }
          } catch { }

          // Heuristic match when tx hash is missing (token payment via aggregator)
          if (!isHashValid && tokenSym !== "ETH") {
            // Attempt 1: exact expectedToken/amount match within 2h window (uses expectedToken/expectedAmountToken set at checkout)
            try {
              const amountTok = Number(tx.value || 0);
              const ts = Number(tx.timestamp || Date.now());
              const windowMsExact = 2 * 60 * 60 * 1000; // ±2 hours
              const specExpected = {
                query:
                  "SELECT c.id, c.wallet, c.receiptId, c.createdAt, c.metadata FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.createdAt BETWEEN @start AND @end",
                parameters: [
                  { name: "@merchant", value: merchantWallet },
                  { name: "@start", value: ts - windowMsExact },
                  { name: "@end", value: ts + windowMsExact }
                ]
              } as { query: string; parameters: { name: string; value: any }[] };
              const { resources: rowsExp } = await container.items.query(specExpected).fetchAll();
              const listExp = Array.isArray(rowsExp) ? rowsExp : [];
              let bestExp: any = null;
              let bestExpScore = Number.POSITIVE_INFINITY;
              for (const c of listExp) {
                const md = c?.metadata || {};
                const expToken = String(md?.expectedToken || md?.token || "").toUpperCase();
                const expAmt = Number(md?.expectedAmountToken || md?.tokenValue || 0);
                if (expToken !== tokenSym) continue;
                // Score by token amount delta and time delta
                const diffAmt = Math.abs(expAmt - amountTok);
                const diffTime = Math.abs(Number(c?.createdAt || 0) - ts) / (10 * 60 * 1000); // per 10 minutes
                const score = diffAmt + diffTime;
                if (score < bestExpScore) {
                  bestExpScore = score;
                  bestExp = c;
                }
              }
              if (bestExp && bestExp.receiptId) {
                try {
                  const did = `receipt:${String(bestExp.receiptId)}`;
                  const { resource: rex } = await container.item(did, merchantWallet).read<any>();
                  if (rex) {
                    {
                      let patched = {
                        ...rex,
                        buyerWallet,
                        transactionTimestamp: ts,
                        status: "paid",
                        statusHistory: Array.isArray(rex.statusHistory)
                          ? [...rex.statusHistory, { status: "paid", ts: Date.now() }]
                          : [{ status: "paid", ts: Date.now() }],
                        metadata: {
                          ...(rex.metadata || {}),
                          locked: true,
                          source: "on_chain_reindex_expected",
                          token: tokenSym,
                          tokenValue: amountTok
                        },
                        lastUpdatedAt: Date.now()
                      } as any;

                      // Enrich line items from nearby tracking receipt (same buyer/merchant; choose best by USD+time score)
                      try {
                        const amountUsdExp = toUsd(tokenSym, Number(amountTok || 0));
                        const specTr2 = {
                          query:
                            "SELECT c.lineItems, c.totalUsd, c.receiptId, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND (LOWER(c.status)='checkout_initialized' OR LOWER(c.status)='buyer_logged_in' OR LOWER(c.status)='link_opened') ORDER BY c.createdAt DESC OFFSET 0 LIMIT 50",
                          parameters: [
                            { name: "@merchant", value: merchantWallet },
                            { name: "@buyer", value: buyerWallet }
                          ]
                        } as { query: string; parameters: { name: string; value: any }[] };
                        const { resources: trRows2 } = await container.items.query(specTr2).fetchAll();
                        const listTr = Array.isArray(trRows2) ? trRows2 : [];
                        let chosen: any = null;
                        let bestScore = Number.POSITIVE_INFINITY;
                        for (const cand of listTr) {
                          const li = Array.isArray(cand?.lineItems) ? cand.lineItems : [];
                          if (!li.length) continue;
                          const tUsd = Number(cand?.totalUsd || 0);
                          const tCreated = Number(cand?.createdAt || 0);
                          const diffUsd = Math.abs(tUsd - amountUsdExp);
                          const diffTime = Math.abs(tCreated - ts) / (60 * 60 * 1000); // hours
                          const score = diffUsd + diffTime;
                          if (score < bestScore) {
                            bestScore = score;
                            chosen = cand;
                          }
                        }
                        if (chosen) {
                          patched.lineItems = chosen.lineItems;
                          patched.totalUsd = Number(chosen.totalUsd || amountUsdExp);
                        }
                      } catch { }

                      await container.items.upsert(patched);
                    }
                    receiptsLinked++;
                    const linkIdExp = `buyer_tx_link:${buyerWallet}:${txKey}`;
                    await container.items.upsert({
                      id: linkIdExp,
                      type: "buyer_tx_link",
                      txHash: txKey,
                      buyerWallet,
                      merchantWallet,
                      receiptId: bestExp.receiptId,
                      linkedAt: Date.now(),
                      correlationId
                    });
                    continue;
                  }
                } catch { }
              }
            } catch { }
            // Attempt 2: nearest by time and USD amount tolerance when expected fields not present
            try {
              const amountUsd = toUsd(tokenSym, Number(tx.value || 0));
              const ts = Number(tx.timestamp || Date.now());
              const windowMs = 60 * 60 * 1000; // ±60 minutes
              const tolUsd = Math.max(5, amountUsd * 0.20); // 20% tolerance for amount match
              const specApprox = {
                query:
                  "SELECT c.id, c.wallet, c.receiptId, c.totalUsd, c.createdAt, c.status FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.createdAt BETWEEN @start AND @end AND c.totalUsd >= @minUsd AND c.totalUsd <= @maxUsd",
                parameters: [
                  { name: "@merchant", value: merchantWallet },
                  { name: "@start", value: ts - windowMs },
                  { name: "@end", value: ts + windowMs },
                  { name: "@minUsd", value: amountUsd - tolUsd },
                  { name: "@maxUsd", value: amountUsd + tolUsd },
                ],
              } as { query: string; parameters: { name: string; value: any }[] };
              const { resources: approxRows } = await container.items.query(specApprox).fetchAll();
              const candidates = Array.isArray(approxRows) ? approxRows : [];
              let best: any = null;
              let bestScore = Number.POSITIVE_INFINITY;
              for (const c of candidates) {
                const tUsd = Number(c?.totalUsd || 0);
                const tCreated = Number(c?.createdAt || 0);
                const diffUsd = Math.abs(tUsd - amountUsd);
                const diffTime = Math.abs(tCreated - ts) / (5 * 60 * 1000); // scale time by 5 minutes
                const score = diffUsd + diffTime;
                if (score < bestScore) {
                  bestScore = score;
                  best = c;
                }
              }
              if (best && best.receiptId) {
                try {
                  const did = `receipt:${String(best.receiptId)}`;
                  const { resource: rbest } = await container.item(did, merchantWallet).read<any>();
                  if (rbest) {
                    {
                      let patchedApprox = {
                        ...rbest,
                        buyerWallet,
                        transactionTimestamp: ts,
                        status: "paid",
                        statusHistory: Array.isArray(rbest.statusHistory)
                          ? [...rbest.statusHistory, { status: "paid", ts: Date.now() }]
                          : [{ status: "paid", ts: Date.now() }],
                        metadata: {
                          ...(rbest.metadata || {}),
                          locked: true,
                          source: "on_chain_reindex_approx",
                          token: tokenSym,
                          tokenValue: Number(tx.value || 0),
                        },
                        lastUpdatedAt: Date.now(),
                      } as any;

                      // Enrich line items from nearby tracking receipt (same buyer/merchant; choose best by USD+time score)
                      try {
                        const amountUsdApprox = toUsd(tokenSym, Number(tx.value || 0));
                        const specTr2 = {
                          query:
                            "SELECT c.lineItems, c.totalUsd, c.receiptId, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND (LOWER(c.status)='checkout_initialized' OR LOWER(c.status)='buyer_logged_in' OR LOWER(c.status)='link_opened') ORDER BY c.createdAt DESC OFFSET 0 LIMIT 50",
                          parameters: [
                            { name: "@merchant", value: merchantWallet },
                            { name: "@buyer", value: buyerWallet }
                          ]
                        } as { query: string; parameters: { name: string; value: any }[] };
                        const { resources: trRows2 } = await container.items.query(specTr2).fetchAll();
                        const listTr = Array.isArray(trRows2) ? trRows2 : [];
                        let chosen: any = null;
                        let bestScore = Number.POSITIVE_INFINITY;
                        for (const cand of listTr) {
                          const li = Array.isArray(cand?.lineItems) ? cand.lineItems : [];
                          if (!li.length) continue;
                          const tUsd = Number(cand?.totalUsd || 0);
                          const tCreated = Number(cand?.createdAt || 0);
                          const diffUsd = Math.abs(tUsd - amountUsdApprox);
                          const diffTime = Math.abs(tCreated - ts) / (60 * 60 * 1000); // hours
                          const score = diffUsd + diffTime;
                          if (score < bestScore) {
                            bestScore = score;
                            chosen = cand;
                          }
                        }
                        if (chosen) {
                          patchedApprox.lineItems = chosen.lineItems;
                          patchedApprox.totalUsd = Number(chosen.totalUsd || amountUsdApprox);
                        }
                      } catch { }

                      await container.items.upsert(patchedApprox);
                    }
                    receiptsLinked++;
                    const linkIdHeur = `buyer_tx_link:${buyerWallet}:${txKey}`;
                    await container.items.upsert({
                      id: linkIdHeur,
                      type: "buyer_tx_link",
                      txHash: txKey,
                      buyerWallet,
                      merchantWallet,
                      receiptId: best.receiptId,
                      linkedAt: Date.now(),
                      correlationId,
                    });
                    continue;
                  }
                } catch { }
              }
            } catch (e) {
              console.error(`[REINDEX] Heuristic match failed for token payment without hash:`, e);
            }
          }

          // Check if link doc exists (another receipt might be linked)
          const linkId = `buyer_tx_link:${buyerWallet}:${txKey}`;
          let linkDoc: any = null;
          try {
            const { resource } = await container.item(linkId, linkId).read<any>();
            linkDoc = resource || null;
          } catch { }

          if (linkDoc) {
            // Link already exists – ensure the referenced receipt is visible to the buyer
            try {
              const linkedReceiptId = String(linkDoc.receiptId || "").trim();
              const linkedMerchant = String(linkDoc.merchantWallet || merchantWallet).toLowerCase();
              if (linkedReceiptId && isHexAddr(linkedMerchant)) {
                const docId = `receipt:${linkedReceiptId}`;
                try {
                  const { resource } = await container.item(docId, linkedMerchant).read<any>();
                  if (resource) {
                    // If buyerWallet missing, set it so /api/orders/me will return it
                    if (!resource.buyerWallet || String(resource.buyerWallet).toLowerCase() !== buyerWallet) {
                      await container.items.upsert({
                        ...resource,
                        buyerWallet,
                        lastUpdatedAt: Date.now()
                      });
                      receiptsLinked++;
                      console.log(`[REINDEX] Ensured buyer linkage on receipt ${linkedReceiptId}`);
                    }
                  } else {
                    // Fallback: cross-partition search by txHash to find and link the receipt
                    const spec2 = {
                      query: "SELECT c.id, c.wallet, c.receiptId FROM c WHERE c.type='receipt' AND c.transactionHash=@tx",
                      parameters: [{ name: "@tx", value: txHash }]
                    } as { query: string; parameters: { name: string; value: any }[] };
                    const { resources: rows2 } = await container.items.query(spec2).fetchAll();
                    const found = Array.isArray(rows2) && rows2[0] ? rows2[0] : null;
                    if (found && found.wallet && found.receiptId) {
                      const did = `receipt:${String(found.receiptId)}`;
                      try {
                        const { resource: r2 } = await container.item(did, String(found.wallet).toLowerCase()).read<any>();
                        if (r2) {
                          await container.items.upsert({
                            ...r2,
                            buyerWallet,
                            lastUpdatedAt: Date.now()
                          });
                          receiptsLinked++;
                          console.log(`[REINDEX] Linked buyer to receipt ${found.receiptId} via cross-partition lookup`);
                        }
                      } catch { }
                    }
                  }
                } catch { }
              }
            } catch (e) {
              console.error(`[REINDEX] Error ensuring buyer linkage for linked tx ${txHash.slice(0, 10)}...:`, e);
            }
            console.log(`[REINDEX] Transaction ${txHash.slice(0, 10)}... already linked to another receipt`);
            continue;
          }

          // Generate synthetic receipt (try to enrich from Thirdweb payment event if present)
          const receiptId = `R-ONCHAIN-${txHash.slice(0, 10).toUpperCase()}-${Date.now()}`;
          const token = String(tx.token || "ETH").toUpperCase();
          const value = Number(tx.value || 0);
          const valueUsd = toUsd(token, value);
          const timestamp = Number(tx.timestamp || Date.now());

          // Get merchant brand name
          let brandName = "Merchant";
          try {
            const { resource: siteCfg } = await container.item("site:config", merchantWallet).read<any>();
            if (siteCfg?.theme?.brandName) {
              brandName = String(siteCfg.theme.brandName);
            }
          } catch { }

          // Optional: fetch Thirdweb payment event to enrich purchaseData and items
          let purchaseData: any = null;
          try {
            const specEvent = {
              query: "SELECT TOP 1 c.purchaseData, c.destinationToken, c.originToken, c.transactions FROM c WHERE c.type='payment_event_thirdweb' AND c.brandKey=@brand",
              parameters: [{ name: "@brand", value: brandKey }]
            } as { query: string; parameters: { name: string; value: any }[] };
            const { resources: evs } = await container.items.query(specEvent).fetchAll();
            const match = Array.isArray(evs) ? evs.find((e: any) => {
              const arr = Array.isArray(e?.transactions) ? e.transactions : [];
              return arr.some((t: any) => String(t?.transactionHash || "").toLowerCase() === txHash);
            }) : null;
            if (match && typeof match.purchaseData === "object") {
              purchaseData = match.purchaseData;
            }
          } catch { }

          // Build line items: prefer purchaseData.items if present; else single-row generic
          let lineItems: any[] = [];
          if (purchaseData && Array.isArray((purchaseData as any).items)) {
            try {
              lineItems = (purchaseData as any).items
                .slice(0, 50)
                .map((it: any) => ({
                  label: String(it?.label || it?.name || "Item"),
                  priceUsd: Number(it?.priceUsd || it?.amountUsd || 0),
                  qty: Number.isFinite(Number(it?.qty)) ? Number(it?.qty) : undefined,
                  sku: typeof it?.sku === "string" ? it.sku : undefined,
                  itemId: typeof it?.itemId === "string" ? it.itemId : undefined,
                }))
                .filter((it: any) => Number(it.priceUsd || 0) >= 0);
            } catch { }
          }
          if (!Array.isArray(lineItems) || lineItems.length === 0) {
            lineItems = [
              {
                label: `On-chain Payment (${token})`,
                priceUsd: valueUsd > 0 ? valueUsd : value
              }
            ];
          }

          // If purchaseData.receiptId exists, try to link/update merchant receipt instead of creating a synthetic one
          const pdReceiptId = purchaseData && typeof (purchaseData as any).receiptId === "string" ? String((purchaseData as any).receiptId) : "";
          if (pdReceiptId) {
            try {
              const existingId = `receipt:${pdReceiptId}`;
              const { resource: existing } = await container.item(existingId, merchantWallet).read<any>();
              if (existing) {
                try {
                  const invItems = await loadInventoryForMerchant(container, merchantWallet, brandKey);
                  lineItems = correlateLineItems(Array.isArray(lineItems) ? lineItems : [], invItems);
                } catch { }
                const newTotal = lineItems.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0);
                await container.items.upsert({
                  ...existing,
                  buyerWallet,
                  transactionHash: txHash,
                  transactionTimestamp: timestamp,
                  lineItems,
                  totalUsd: +newTotal.toFixed(2),
                  status: "paid",
                  statusHistory: Array.isArray(existing.statusHistory)
                    ? [...existing.statusHistory, { status: "paid", ts: Date.now() }]
                    : [{ status: "paid", ts: Date.now() }],
                  metadata: {
                    ...(existing.metadata || {}),
                    locked: true,
                    source: "on_chain_reindex",
                    token,
                    tokenValue: value,
                    ...(purchaseData ? { purchaseData } : {})
                  },
                  lastUpdatedAt: Date.now()
                });
                // Create link doc to prevent duplicate generation
                await container.items.upsert({
                  id: linkId,
                  type: "buyer_tx_link",
                  txHash,
                  buyerWallet,
                  merchantWallet,
                  receiptId: pdReceiptId,
                  linkedAt: Date.now(),
                  correlationId
                });
                receiptsLinked++;
                console.log(`[REINDEX] Linked existing merchant receipt ${pdReceiptId} for tx ${txHash.slice(0, 10)}...`);
                // Remove any synthetic ONCHAIN receipts for this tx to avoid duplicates
                try {
                  const specDup = {
                    query: "SELECT c.receiptId FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.transactionHash=@tx AND STARTSWITH(c.receiptId, @prefix)",
                    parameters: [
                      { name: "@merchant", value: merchantWallet },
                      { name: "@tx", value: txHash },
                      { name: "@prefix", value: "R-ONCHAIN-" }
                    ]
                  } as { query: string; parameters: { name: string; value: any }[] };
                  const { resources: dupRows } = await container.items.query(specDup).fetchAll();
                  const dups = Array.isArray(dupRows) ? dupRows : [];
                  for (const d of dups) {
                    const drid = String(d?.receiptId || "");
                    if (!drid) continue;
                    try { await container.item(`receipt:${drid}`, merchantWallet).delete(); } catch { }
                  }
                } catch { }
              } else {
                // Restore deleted merchant receipt using purchaseData.receiptId
                try {
                  const newTotal = lineItems.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0);
                  await container.items.upsert({
                    id: `receipt:${pdReceiptId}`,
                    type: "receipt",
                    wallet: merchantWallet,
                    receiptId: pdReceiptId,
                    totalUsd: +newTotal.toFixed(2),
                    currency: "USD",
                    lineItems,
                    createdAt: timestamp,
                    brandName,
                    status: "paid",
                    buyerWallet,
                    transactionHash: txHash,
                    transactionTimestamp: timestamp,
                    statusHistory: [{ status: "paid", ts: Date.now() }],
                    metadata: {
                      locked: true,
                      source: "on_chain_reindex_restore",
                      token,
                      tokenValue: value,
                      ...(purchaseData ? { purchaseData } : {})
                    },
                    lastUpdatedAt: Date.now()
                  });
                  // Link to buyer/tx to prevent duplicate regeneration
                  await container.items.upsert({
                    id: linkId,
                    type: "buyer_tx_link",
                    txHash,
                    buyerWallet,
                    merchantWallet,
                    receiptId: pdReceiptId,
                    linkedAt: Date.now(),
                    correlationId
                  });
                  receiptsLinked++;
                  console.log(`[REINDEX] Restored merchant receipt ${pdReceiptId} and linked to tx ${txHash.slice(0, 10)}...`);
                } catch (e) {
                  console.error(`[REINDEX] Failed to restore merchant receipt ${pdReceiptId}:`, e);
                }
              }
              continue;
            } catch { }
          }

          // Before creating a synthetic receipt, attempt time+USD match to existing receipts
          try {
            const amtUsd = toUsd(tokenSym, Number(tx.value || 0));
            const windowMs = 60 * 60 * 1000; // ±60 minutes
            const tolUsd = Math.max(5, amtUsd * 0.20); // 20% tolerance
            const specFind = {
              query:
                "SELECT c.id, c.wallet, c.receiptId, c.totalUsd, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant ORDER BY c.createdAt DESC OFFSET 0 LIMIT 200",
              parameters: [
                { name: "@merchant", value: merchantWallet }
              ]
            } as { query: string; parameters: { name: string; value: any }[] };
            const { resources: rowsFind } = await container.items.query(specFind).fetchAll();
            const candidates = Array.isArray(rowsFind) ? rowsFind : [];
            let bestAny: any = null;
            let bestAnyScore = Number.POSITIVE_INFINITY;
            for (const c of candidates) {
              const tUsd = Number(c?.totalUsd || 0);
              const tCreated = Number(c?.createdAt || 0);
              const withinTol = Math.abs(tUsd - amtUsd) <= tolUsd;
              if (!withinTol) continue;
              const diffUsd = Math.abs(tUsd - amtUsd);
              const diffTime = Math.abs(tCreated - timestamp) / (5 * 60 * 1000);
              const score = diffUsd + diffTime;
              if (score < bestAnyScore) {
                bestAnyScore = score;
                bestAny = c;
              }
            }
            if (bestAny && bestAny.receiptId) {
              try {
                const did = `receipt:${String(bestAny.receiptId)}`;
                const { resource: rAny } = await container.item(did, merchantWallet).read<any>();
                if (rAny) {
                  // Build local enrichment independent of later declarations
                  let timePurchaseData: any = null;
                  try {
                    const specEvent = {
                      query: "SELECT TOP 1 c.purchaseData, c.transactions FROM c WHERE c.type='payment_event_thirdweb' AND c.brandKey=@brand",
                      parameters: [{ name: "@brand", value: brandKey }]
                    } as { query: string; parameters: { name: string; value: any }[] };
                    const { resources: evs } = await container.items.query(specEvent).fetchAll();
                    const match = Array.isArray(evs) ? evs.find((e: any) => {
                      const arr = Array.isArray(e?.transactions) ? e.transactions : [];
                      return arr.some((t: any) => String(t?.transactionHash || "").toLowerCase() === txHash);
                    }) : null;
                    if (match && typeof match.purchaseData === "object") {
                      timePurchaseData = match.purchaseData;
                    }
                  } catch { }

                  let timeLineItems: any[] = [];
                  try {
                    if (timePurchaseData && Array.isArray((timePurchaseData as any).items)) {
                      timeLineItems = (timePurchaseData as any).items
                        .slice(0, 50)
                        .map((it: any) => ({
                          label: String(it?.label || it?.name || "Item"),
                          priceUsd: Number(it?.priceUsd || it?.amountUsd || 0),
                          qty: Number.isFinite(Number(it?.qty)) ? Number(it?.qty) : undefined,
                          sku: typeof it?.sku === "string" ? it.sku : undefined,
                          itemId: typeof it?.itemId === "string" ? it.itemId : undefined,
                        }))
                        .filter((it: any) => Number(it.priceUsd || 0) >= 0);
                    }
                  } catch { }
                  if (!Array.isArray(timeLineItems) || timeLineItems.length === 0) {
                    const metaToken = String(rAny?.metadata?.token || "").toUpperCase();
                    const metaValue = Number(rAny?.metadata?.tokenValue ?? 0);
                    const preferredToken = metaToken || tokenSym;
                    const preferredValue = metaValue > 0 ? metaValue : Number(tx.value || 0);
                    const vUsd = toUsd(preferredToken, preferredValue);
                    const fallbackLine = { label: `On-chain Payment (${preferredToken})`, priceUsd: vUsd > 0 ? vUsd : preferredValue };
                    const existingLi = Array.isArray(rAny?.lineItems) ? rAny.lineItems : [];
                    const existingUseful =
                      existingLi.length > 1 ||
                      (existingLi.length === 1 && Number(existingLi[0]?.priceUsd || 0) > 0);
                    if ((preferredToken === "ETH" && preferredValue <= 0) && existingUseful) {
                      timeLineItems = existingLi;
                    } else {
                      timeLineItems = [fallbackLine];
                    }
                  }

                  const newTotal = timeLineItems.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0);
                  await container.items.upsert({
                    ...rAny,
                    buyerWallet,
                    brandKey,
                    transactionHash: txHash,
                    transactionTimestamp: timestamp,
                    lineItems: timeLineItems,
                    totalUsd: +newTotal.toFixed(2),
                    status: "paid",
                    statusHistory: Array.isArray(rAny.statusHistory)
                      ? [...rAny.statusHistory, { status: "paid", ts: Date.now() }]
                      : [{ status: "paid", ts: Date.now() }],
                    metadata: {
                      ...(rAny.metadata || {}),
                      locked: true,
                      source: "on_chain_reindex_time_amount",
                      token: tokenSym,
                      tokenValue: Number(tx.value || 0),
                      ...(timePurchaseData ? { purchaseData: timePurchaseData } : {})
                    },
                    lastUpdatedAt: Date.now()
                  });
                  // Preserve recovered tracking receipt for correlation (time+USD match path)
                  try {
                    await upsertRecoveredTrackingReceipt(container, merchantWallet, buyerWallet, txHash, timestamp, timePurchaseData, tokenSym, Number(tx.value || 0));
                  } catch { }
                  const linkIdAny = `buyer_tx_link:${buyerWallet}:${txKey}`;
                  await container.items.upsert({
                    id: linkIdAny,
                    type: "buyer_tx_link",
                    txHash: txKey,
                    buyerWallet,
                    merchantWallet,
                    receiptId: bestAny.receiptId,
                    linkedAt: Date.now(),
                    correlationId
                  });
                  receiptsLinked++;
                  console.log(`[REINDEX] Linked existing merchant receipt ${bestAny.receiptId} via time+USD match`);
                  // Remove any synthetic ONCHAIN receipts that duplicate this tx (hashed or time+amount)
                  try {
                    if (txHash) {
                      const specDupHash = {
                        query: "SELECT c.receiptId FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.transactionHash=@tx AND STARTSWITH(c.receiptId, @prefix)",
                        parameters: [
                          { name: "@merchant", value: merchantWallet },
                          { name: "@tx", value: txHash },
                          { name: "@prefix", value: "R-ONCHAIN-" }
                        ]
                      } as { query: string; parameters: { name: string; value: any }[] };
                      const { resources: dupRowsH } = await container.items.query(specDupHash).fetchAll();
                      const dupsH = Array.isArray(dupRowsH) ? dupRowsH : [];
                      for (const d of dupsH) {
                        const drid = String(d?.receiptId || "");
                        if (!drid) continue;
                        try { await container.item(`receipt:${drid}`, merchantWallet).delete(); } catch { }
                      }
                    } else {
                      const vUsd = toUsd(tokenSym, Number(tx.value || 0));
                      const windowMs = 2 * 60 * 60 * 1000; // ±2h
                      const specDupTime = {
                        query: "SELECT c.receiptId, c.createdAt, c.totalUsd FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND STARTSWITH(c.receiptId, @prefix)",
                        parameters: [
                          { name: "@merchant", value: merchantWallet },
                          { name: "@prefix", value: "R-ONCHAIN-" }
                        ]
                      } as { query: string; parameters: { name: string; value: any }[] };
                      const { resources: dupRowsT } = await container.items.query(specDupTime).fetchAll();
                      const dupsT = Array.isArray(dupRowsT) ? dupRowsT : [];
                      for (const d of dupsT) {
                        const drid = String(d?.receiptId || "");
                        const cAt = Number(d?.createdAt || 0);
                        const tUsd = Number(d?.totalUsd || 0);
                        if (!drid) continue;
                        const withinTime = Math.abs(cAt - timestamp) <= windowMs;
                        const withinAmt = Math.abs(tUsd - vUsd) <= 1;
                        if (withinTime && withinAmt) {
                          try { await container.item(`receipt:${drid}`, merchantWallet).delete(); } catch { }
                        }
                      }
                    }
                  } catch { }
                  continue;
                }
              } catch { }
            }
          } catch (e) {
            console.error(`[REINDEX] Pre-synthetic time+USD match failed:`, e);
          }

          // Stamp items to current inventory (add itemId/sku/name labels)
          try {
            const invItems = await loadInventoryForMerchant(container, merchantWallet, brandKey);
            lineItems = correlateLineItems(Array.isArray(lineItems) ? lineItems : [], invItems);
          } catch { }

          // Create synthetic receipt
          const syntheticReceipt = {
            id: `receipt:${pdReceiptId || receiptId}`,
            type: "receipt",
            wallet: merchantWallet,
            brandKey,
            receiptId: pdReceiptId || receiptId,
            totalUsd: lineItems.reduce((s: number, it: any) => s + Number(it.priceUsd || 0) * (Number(it.qty || 1)), 0) || (valueUsd > 0 ? valueUsd : value),
            currency: "USD",
            lineItems,
            createdAt: timestamp,
            brandName,
            status: "reconciled",
            buyerWallet,
            transactionHash: txHash,
            transactionTimestamp: timestamp,
            statusHistory: [
              { status: "reconciled", ts: Date.now() }
            ],
            metadata: {
              synthetic: true,
              source: "on_chain_reindex",
              token,
              tokenValue: value,
              blockNumber: tx.blockNumber,
              ...(purchaseData ? { purchaseData } : {})
            },
            lastUpdatedAt: Date.now()
          };

          try {
            await container.items.upsert(syntheticReceipt);

            // Create link doc to prevent duplicate generation
            await container.items.upsert({
              id: linkId,
              type: "buyer_tx_link",
              txHash,
              buyerWallet,
              merchantWallet,
              receiptId,
              linkedAt: Date.now(),
              correlationId
            });

            receiptsGenerated++;
            console.log(`[REINDEX] Generated synthetic receipt ${receiptId} for tx ${txHash.slice(0, 10)}...`);

            // Audit event
            await auditEvent(req, {
              who: buyerWallet,
              roles: ['buyer'],
              what: 'receipt_generated_onchain',
              target: merchantWallet,
              correlationId,
              ok: true,
              metadata: { receiptId, txHash: txHash.slice(0, 10), token, valueUsd }
            });
          } catch (e) {
            console.error(`[REINDEX] Error generating synthetic receipt:`, e);
          }
        }

        // Post-pass enrichment: promote tracking line items into minimal canonical receipts
        try {
          // Get latest canonical receipts for this buyer/merchant
          const specCanon2 = {
            query:
              "SELECT c.receiptId, c.totalUsd, c.createdAt, c.lineItems, c.status, c.transactionHash FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND (LOWER(c.status)='paid' OR LOWER(c.status)='reconciled' OR IS_DEFINED(c.transactionHash)) ORDER BY c.createdAt DESC OFFSET 0 LIMIT 200",
            parameters: [
              { name: "@merchant", value: merchantWallet },
              { name: "@buyer", value: buyerWallet }
            ]
          } as { query: string; parameters: { name: string; value: any }[] };
          const { resources: canonRows2 } = await container.items.query(specCanon2).fetchAll();
          const canons = Array.isArray(canonRows2) ? canonRows2 : [];

          // Fetch recent tracking receipts
          const specTrack2 = {
            query:
              "SELECT c.lineItems, c.totalUsd, c.receiptId, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND (LOWER(c.status)='checkout_initialized' OR LOWER(c.status)='buyer_logged_in' OR LOWER(c.status)='link_opened') ORDER BY c.createdAt DESC OFFSET 0 LIMIT 200",
            parameters: [
              { name: "@merchant", value: merchantWallet },
              { name: "@buyer", value: buyerWallet }
            ]
          } as { query: string; parameters: { name: string; value: any }[] };
          const { resources: trackRows2 } = await container.items.query(specTrack2).fetchAll();
          const tracks = Array.isArray(trackRows2) ? trackRows2 : [];

          const isMinimalCanon = (r: any) => {
            const li = Array.isArray(r?.lineItems) ? r.lineItems : [];
            if (li.length === 0) return true;
            if (li.length === 1) {
              const label = String(li[0]?.label || "").toLowerCase();
              if (label.includes("on-chain")) return true;
            }
            return false;
          };

          for (const c of canons) {
            if (!isMinimalCanon(c)) continue;
            const cUsd = Number(c?.totalUsd || 0);
            const cTs = Number(c?.createdAt || 0);

            // Choose best tracking receipt by combined USD delta + time delta (hours)
            let chosen: any = null;
            let bestScore = Number.POSITIVE_INFINITY;
            for (const t of tracks) {
              const li = Array.isArray(t?.lineItems) ? t.lineItems : [];
              if (!li.length) continue;
              const tUsd = Number(t?.totalUsd || 0);
              const tTs = Number(t?.createdAt || 0);
              const diffUsd = Math.abs(tUsd - cUsd);
              const diffTimeH = Math.abs(tTs - cTs) / (60 * 60 * 1000);
              const score = diffUsd + diffTimeH;
              // Only consider reasonable matches: within ±$5 and ±7 days
              if (diffUsd <= 5 && diffTimeH <= 168 && score < bestScore) {
                bestScore = score;
                chosen = t;
              }
            }

            if (chosen && c?.receiptId) {
              try {
                const docId = `receipt:${String(c.receiptId)}`;
                const { resource: rdoc } = await container.item(docId, merchantWallet).read<any>();
                if (rdoc) {
                  await container.items.upsert({
                    ...rdoc,
                    brandKey,
                    lineItems: chosen.lineItems,
                    totalUsd: Number(chosen.totalUsd || cUsd),
                    status: "paid",
                    statusHistory: Array.isArray(rdoc.statusHistory)
                      ? [...rdoc.statusHistory, { status: "paid", ts: Date.now() }]
                      : [{ status: "paid", ts: Date.now() }],
                    metadata: {
                      ...(rdoc.metadata || {}),
                      locked: true,
                      source: "on_chain_reindex_postpass",
                    },
                    lastUpdatedAt: Date.now()
                  });
                  receiptsLinked++;
                  console.log(`[REINDEX] Post-pass enriched canonical ${String(c.receiptId)} from tracking ${String(chosen.receiptId)} (score ${bestScore.toFixed(2)})`);
                }
              } catch (e) {
                console.error(`[REINDEX] Post-pass enrichment failed for canonical ${String(c?.receiptId || "")}:`, e);
              }
            } else if (c?.receiptId) {
              // Fallback: if canonical still minimal and settlement metadata exists, set a non-zero line using that token/value
              try {
                const docId = `receipt:${String(c.receiptId)}`;
                const { resource: rdoc } = await container.item(docId, merchantWallet).read<any>();
                if (rdoc) {
                  const existingLi = Array.isArray(rdoc.lineItems) ? rdoc.lineItems : [];
                  const isMinimalNow =
                    existingLi.length === 0 ||
                    (existingLi.length === 1 &&
                      (String(existingLi[0]?.label || "").toLowerCase().includes("on-chain") ||
                        Number(existingLi[0]?.priceUsd || 0) <= 0));
                  const metaToken = String(rdoc?.metadata?.token || "").toUpperCase();
                  const metaValue = Number(rdoc?.metadata?.tokenValue ?? 0);

                  if (isMinimalNow) {
                    try {
                      // Attempt inventory-based itemization guess using current merchant inventory
                      const invItems = await loadInventoryForMerchant(container, merchantWallet, brandKey);
                      const guessed = guessInventoryItemsByTotal(invItems, Number(rdoc?.totalUsd || 0));
                      if (guessed.length) {
                        await container.items.upsert({
                          ...rdoc,
                          brandKey,
                          lineItems: guessed,
                          totalUsd: Number(rdoc?.totalUsd || 0),
                          status: "paid",
                          statusHistory: Array.isArray(rdoc.statusHistory)
                            ? [...rdoc.statusHistory, { status: "paid", ts: Date.now() }]
                            : [{ status: "paid", ts: Date.now() }],
                          metadata: {
                            ...(rdoc.metadata || {}),
                            locked: true,
                            source: "on_chain_reindex_postpass_inventory_guess",
                          },
                          lastUpdatedAt: Date.now()
                        });
                        receiptsLinked++;
                        console.log(`[REINDEX] Post-pass inventory guess populated canonical ${String(c.receiptId)}`);
                      } else if (metaToken && metaValue > 0) {
                        // Fallback to settlement token/value if inventory guess is not possible
                        const vUsd = toUsd(metaToken, metaValue);
                        const fallbackLineItems = [{ label: `On-chain Payment (${metaToken})`, priceUsd: vUsd > 0 ? vUsd : metaValue }];
                        await container.items.upsert({
                          ...rdoc,
                          brandKey,
                          lineItems: fallbackLineItems,
                          totalUsd: +(vUsd > 0 ? vUsd : metaValue).toFixed(2),
                          status: "paid",
                          statusHistory: Array.isArray(rdoc.statusHistory)
                            ? [...rdoc.statusHistory, { status: "paid", ts: Date.now() }]
                            : [{ status: "paid", ts: Date.now() }],
                          metadata: {
                            ...(rdoc.metadata || {}),
                            locked: true,
                            source: "on_chain_reindex_postpass_fallback",
                          },
                          lastUpdatedAt: Date.now()
                        });
                        receiptsLinked++;
                        console.log(`[REINDEX] Post-pass fallback set canonical ${String(c.receiptId)} to ${metaToken} ${metaValue}`);
                      }
                    } catch { }
                  }
                }
              } catch (e) {
                console.error(`[REINDEX] Post-pass fallback failed for canonical ${String(c?.receiptId || "")}:`, e);
              }
            }
          }
        } catch (e) {
          console.error(`[REINDEX] Post-pass enrichment error:`, e);
        }

        // Cleanup: remove synthetic zero-value receipts previously generated for this merchant
        try {
          const specZero = {
            query: "SELECT c.receiptId FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.totalUsd <= @zero AND STARTSWITH(c.receiptId, @prefix)",
            parameters: [
              { name: "@merchant", value: merchantWallet },
              { name: "@zero", value: 0 },
              { name: "@prefix", value: "R-ONCHAIN-" }
            ]
          } as { query: string; parameters: { name: string; value: any }[] };
          const { resources: zeroRows } = await container.items.query(specZero).fetchAll();
          const zeros = Array.isArray(zeroRows) ? zeroRows : [];
          for (const z of zeros) {
            const rid = String(z?.receiptId || "");
            if (!rid) continue;
            try {
              await container.item(`receipt:${rid}`, merchantWallet).delete();
              console.log(`[REINDEX] Deleted synthetic zero-value receipt ${rid}`);
            } catch (e) {
              console.error(`[REINDEX] Failed to delete zero-value receipt ${rid}:`, e);
            }
          }
        } catch (e) {
          console.error(`[REINDEX] Zero-value cleanup error:`, e);
        }

        // Cleanup: remove stale tracking-only receipts (no tx) for this buyer and merchant
        // Drops checkout_initialized / buyer_logged_in / link_opened that are zero-value or older than 6h
        try {
          const specTrack = {
            query:
              "SELECT c.receiptId, c.totalUsd, c.createdAt, c.status, c.transactionHash FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND (LOWER(c.status)='checkout_initialized' OR LOWER(c.status)='buyer_logged_in' OR LOWER(c.status)='link_opened')",
            parameters: [
              { name: "@merchant", value: merchantWallet },
              { name: "@buyer", value: buyerWallet },
            ],
          } as { query: string; parameters: { name: string; value: any }[] };
          const { resources: trackRows } = await container.items.query(specTrack).fetchAll();
          const list = Array.isArray(trackRows) ? trackRows : [];
          for (const t of list) {
            const rid = String(t?.receiptId || "");
            const total = Number(t?.totalUsd || 0);
            const createdAt = Number(t?.createdAt || 0);
            const hasTx = typeof t?.transactionHash === "string" && t.transactionHash;
            const stale = Date.now() - createdAt > 6 * 60 * 60 * 1000; // 6h
            if (!rid) continue;
            if (!hasTx && (total <= 0 || stale)) {
              try {
                // Archive tracking-only receipts instead of deleting; useful for item correlation
                await container.items.upsert({
                  id: `receipt:${rid}`,
                  type: "receipt",
                  wallet: merchantWallet,
                  receiptId: rid,
                  totalUsd: total,
                  status: t?.status || "checkout_initialized",
                  lineItems: Array.isArray((t as any)?.lineItems) ? (t as any).lineItems : [],
                  buyerWallet,
                  createdAt,
                  metadata: {
                    ...((t as any)?.metadata || {}),
                    archived: true,
                    source: "tracking_cleanup_archive",
                  },
                  lastUpdatedAt: Date.now(),
                });
                console.log(`[REINDEX] Archived stale tracking receipt ${rid}`);
              } catch (e) {
                console.error(`[REINDEX] Failed to archive tracking receipt ${rid}:`, e);
              }
            }
          }
        } catch (e) {
          console.error(`[REINDEX] Tracking-only cleanup error:`, e);
        }

        // Cleanup: remove synthetic duplicates when a canonical receipt exists for same buyer+merchant+amount
        try {
          const specSyn = {
            query: "SELECT c.receiptId, c.totalUsd, c.createdAt FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND STARTSWITH(c.receiptId, @prefix)",
            parameters: [
              { name: "@merchant", value: merchantWallet },
              { name: "@buyer", value: buyerWallet },
              { name: "@prefix", value: "R-ONCHAIN-" }
            ]
          } as { query: string; parameters: { name: string; value: any }[] };
          const { resources: synRows } = await container.items.query(specSyn).fetchAll();
          const syns = Array.isArray(synRows) ? synRows : [];
          for (const s of syns) {
            const sRid = String(s?.receiptId || "");
            const sTotal = Number(s?.totalUsd || 0);
            if (!sRid || sTotal <= 0) continue;
            try {
              const specCanon = {
                query: "SELECT TOP 1 c.receiptId FROM c WHERE c.type='receipt' AND c.wallet=@merchant AND c.buyerWallet=@buyer AND NOT STARTSWITH(c.receiptId, @prefix) AND ABS(c.totalUsd - @total) <= @tol ORDER BY c.createdAt DESC",
                parameters: [
                  { name: "@merchant", value: merchantWallet },
                  { name: "@buyer", value: buyerWallet },
                  { name: "@prefix", value: "R-ONCHAIN-" },
                  { name: "@total", value: sTotal },
                  { name: "@tol", value: 0.05 }
                ]
              } as { query: string; parameters: { name: string; value: any }[] };
              const { resources: canonRows } = await container.items.query(specCanon).fetchAll();
              const hasCanon = Array.isArray(canonRows) && !!(canonRows[0] && String(canonRows[0]?.receiptId || ""));
              if (hasCanon) {
                await container.item(`receipt:${sRid}`, merchantWallet).delete();
                console.log(`[REINDEX] Deleted synthetic duplicate ${sRid} (canonical exists)`);
              }
            } catch (e) {
              console.error(`[REINDEX] Failed synthetic duplicate cleanup for ${sRid}:`, e);
            }
          }
        } catch (e) {
          console.error(`[REINDEX] Synthetic duplicate cleanup error:`, e);
        }

        processedMerchants.push(merchantWallet);
      } catch (e) {
        console.error(`[REINDEX] Error processing merchant ${merchantWallet.slice(0, 10)}...:`, e);
      }
    }

    const summary = {
      ok: true,
      merchantsProcessed: processedMerchants.length,
      transactionsFound,
      receiptsGenerated,
      receiptsLinked,
      brandKey
    };

    console.log(`[REINDEX] Complete:`, summary);

    await auditEvent(req, {
      who: buyerWallet,
      roles: ['buyer'],
      what: 'buyer_reindex_complete',
      target: buyerWallet,
      correlationId,
      ok: true,
      metadata: summary
    });

    return NextResponse.json(summary, {
      headers: { "x-correlation-id": correlationId }
    });
  } catch (e: any) {
    console.error("[REINDEX] Error:", e);

    try {
      await auditEvent(req, {
        who: 'unknown',
        roles: [],
        what: 'buyer_reindex_failed',
        target: 'system',
        correlationId,
        ok: false,
        metadata: { error: e?.message || 'failed' }
      });
    } catch { }

    return NextResponse.json(
      { ok: false, error: e?.message || "reindex_failed" },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

/**
 * GET /api/orders/reindex
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "orders-reindex",
    status: "active"
  });
}
