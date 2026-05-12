"use client";

import React, { useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { sendTransaction, prepareContractCall, getContract } from "thirdweb";
import { client, chain } from "@/lib/thirdweb/client";
import { createPortal } from "react-dom";
import TruncatedAddress from "@/components/truncated-address";
import { useBrand } from "@/contexts/BrandContext";

type ReserveBalancesResponse = {
  degraded?: boolean;
  reason?: string;
  balances?: Record<
    string,
    {
      units?: number;
      usd?: number;
      address?: string | null;
    }
  >;
  totalUsd?: number;
  wallet?: string;
  merchantWallet?: string;
  sourceWallet?: string;
  splitAddressUsed?: string | null;
  indexedMetrics?: {
    totalVolumeUsd: number;
    merchantEarnedUsd: number;
    platformFeeUsd: number;
    customers: number;
    totalCustomerXp: number;
    transactionCount: number;
  };
  splitHistory?: Array<{
    address: string;
    deployedAt: number;
  }>;
};

export function ReserveAnalytics() {
  const [data, setData] = useState<ReserveBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [selectedSplitVersion, setSelectedSplitVersion] = useState<string>("");
  const account = useActiveAccount();
  const brand = useBrand();


  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawResults, setWithdrawResults] = useState<any[]>([]);

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawQueue, setWithdrawQueue] = useState<string[]>([]);
  const [withdrawProcessed, setWithdrawProcessed] = useState(0);
  const [withdrawStatuses, setWithdrawStatuses] = useState<Record<string, { status: string; tx?: string; reason?: string }>>({});

  function formatReleaseMessage(rr: { symbol?: string; status?: string; transactionHash?: string; reason?: string }): string {
    try {
      const sym = String(rr?.symbol || "").toUpperCase();
      const st = String(rr?.status || "");
      const statusLabel = st === "submitted" ? "Submitted" : st === "skipped" ? "Skipped" : st === "failed" ? "Failed" : st || "—";
      const parts: string[] = [`${sym}: ${statusLabel}`];
      if (rr?.reason) {
        const r = String(rr.reason || "");
        const friendly =
          r === "not_due_payment"
            ? "No funds due to this account"
            : r === "signature_mismatch"
              ? "Contract method signature mismatch (overload)"
              : r === "token_address_not_configured"
                ? "Token address not configured"
                : r;
        parts.push(friendly);
      }
      if (rr?.transactionHash) {
        parts.push(String(rr.transactionHash).slice(0, 10) + "…");
      }
      return parts.join(" • ");
    } catch {
      return `${String(rr?.symbol || "").toUpperCase()}: ${String(rr?.status || "")}`;
    }
  }

  function statusClassFor(rr: { status?: string }): string {
    const st = String(rr?.status || "");
    return st === "failed" ? "text-red-500" : st === "skipped" ? "text-amber-600" : "text-muted-foreground";
  }

  async function withdrawMerchant(onlySymbol?: string) {
    try {
      setWithdrawError("");
      if (!account?.address) {
        setWithdrawError("Connect your wallet");
        return;
      }
      const isHex = (s: string) => /^0x[a-f0-9]{40}$/i.test(String(s || "").trim());
      const merchant = String((data?.merchantWallet || account?.address || "")).toLowerCase();
      const split = String(data?.splitAddressUsed || "").toLowerCase();
      if (!isHex(merchant)) {
        setWithdrawError("merchant_wallet_required");
        return;
      }
      if (!isHex(split)) {
        setWithdrawError("split_address_not_configured");
        return;
      }

      const preferred = ["ETH", "USDC", "USDT", "cbBTC", "cbXRP", "SOL"];
      const balEntries = Object.entries((data?.balances || {}) as Record<string, any>);
      const nonZero = balEntries
        .filter(([sym, info]) => preferred.includes(sym) && Number(info?.units || 0) > 0)
        .map(([sym]) => sym as string);
      let queue = nonZero.length ? nonZero : preferred;
      if (onlySymbol) queue = [onlySymbol];

      const envTokens: Record<string, { address?: `0x${string}`; decimals?: number }> = {
        ETH: { address: undefined, decimals: 18 },
        USDC: {
          address: (data?.balances?.["USDC"]?.address || process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913").toLowerCase() as any,
          decimals: Number(process.env.NEXT_PUBLIC_BASE_USDC_DECIMALS || 6),
        },
        USDT: {
          address: (data?.balances?.["USDT"]?.address || process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS || "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2").toLowerCase() as any,
          decimals: Number(process.env.NEXT_PUBLIC_BASE_USDT_DECIMALS || 6),
        },
        cbBTC: {
          address: (data?.balances?.["cbBTC"]?.address || process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS || "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf").toLowerCase() as any,
          decimals: Number(process.env.NEXT_PUBLIC_BASE_CBBTC_DECIMALS || 8),
        },
        cbXRP: {
          address: (data?.balances?.["cbXRP"]?.address || process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS || "0xcb585250f852C6c6bf90434AB21A00f02833a4af").toLowerCase() as any,
          decimals: Number(process.env.NEXT_PUBLIC_BASE_CBXRP_DECIMALS || 6),
        },
        SOL: {
          address: (data?.balances?.["SOL"]?.address || process.env.NEXT_PUBLIC_BASE_SOL_ADDRESS || "0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82").toLowerCase() as any,
          decimals: Number(process.env.NEXT_PUBLIC_BASE_SOL_DECIMALS || 9),
        },
      };

      const PAYMENT_SPLITTER_ABI = [
        {
          type: "function",
          name: "release",
          inputs: [{ name: "account", type: "address" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "release",
          inputs: [
            { name: "token", type: "address" },
            { name: "account", type: "address" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "distribute",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "distribute",
          inputs: [{ name: "token", type: "address" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ] as const;

      const contract = getContract({
        client,
        chain,
        address: split as `0x${string}`,
        abi: PAYMENT_SPLITTER_ABI as any,
      });

      setWithdrawLoading(true);
      setWithdrawError("");

      if (!onlySymbol) {
        setWithdrawResults([]);
        setWithdrawModal({ open: true, wallet: merchant, queue, processed: 0, statuses: {} });
      }

      for (const symbol of queue) {
        try {
          let tx: any;
          if (symbol === "ETH") {
            tx = (prepareContractCall as any)({
              contract: contract as any,
              method: "function distribute()",
              params: [],
            });
          } else {
            const t = envTokens[symbol];
            const tokenAddr = t?.address as `0x${string}` | undefined;
            if (!tokenAddr || !isHex(String(tokenAddr))) {
              const rr = { symbol, status: "skipped", reason: "token_address_not_configured" };
              if (!onlySymbol) {
                setWithdrawModalStatuses((prev) => ({ ...prev, [symbol]: { status: rr.status, reason: rr.reason } }));
              }
              setWithdrawResults((prev: any[]) => {
                const next = Array.isArray(prev) ? prev.slice() : [];
                next.push(rr as any);
                return next;
              });
              if (!onlySymbol) setWithdrawModalProcessed((p) => p + 1);
              continue;
            }
            tx = (prepareContractCall as any)({
              contract: contract as any,
              method: "function distribute(address token)",
              params: [tokenAddr],
            });
          }

          const sent = await sendTransaction({
            account: account as any,
            transaction: tx,
          });
          const transactionHash = (sent as any)?.transactionHash || (sent as any)?.hash || undefined;

          const rr = { symbol, transactionHash, status: "submitted" as const };
          if (!onlySymbol) {
            setWithdrawModalStatuses((prev) => ({ ...prev, [symbol]: { status: rr.status, tx: rr.transactionHash } }));
          }
          setWithdrawResults((prev: any[]) => {
            const next = Array.isArray(prev) ? prev.slice() : [];
            next.push(rr as any);
            return next;
          });
        } catch (err: any) {
          const raw = String(err?.message || err || "");
          const lower = raw.toLowerCase();
          const isNotDue =
            lower.includes("not due payment") || lower.includes("account is not due payment");
          const isOverload = lower.includes("number of parameters and values must match");
          const rr = {
            symbol,
            status: (isNotDue ? "skipped" : "failed") as "skipped" | "failed",
            reason: isNotDue ? "not_due_payment" : isOverload ? "signature_mismatch" : raw,
          };
          if (!onlySymbol) {
            setWithdrawModalStatuses((prev) => ({ ...prev, [symbol]: { status: rr.status, reason: rr.reason } }));
          }
          setWithdrawResults((prev: any[]) => {
            const next = Array.isArray(prev) ? prev.slice() : [];
            next.push(rr as any);
            return next;
          });
        } finally {
          if (!onlySymbol) {
            setWithdrawModalProcessed((p) => p + 1);
          }
        }
      }

      try { await fetchBalances(); } catch { }
    } catch (e: any) {
      setWithdrawError(e?.message || "Withdraw failed");
    } finally {
      setWithdrawLoading(false);
    }
  }

  function setWithdrawModal(val: { open: boolean; wallet?: string; queue: string[]; processed: number; statuses: Record<string, { status: string; tx?: string; reason?: string }> }) {
    setWithdrawModalOpen(val.open);
    setWithdrawQueue(val.queue);
    setWithdrawProcessed(val.processed);
    setWithdrawStatuses(val.statuses);
  }

  function setWithdrawModalStatuses(fn: (prev: Record<string, { status: string; tx?: string; reason?: string }>) => Record<string, { status: string; tx?: string; reason?: string }>) {
    setWithdrawStatuses(fn);
  }

  function setWithdrawModalProcessed(fn: (prev: number) => number) {
    setWithdrawProcessed(fn);
  }

  async function fetchBalances(overrideSplitAddress?: string) {
    try {
      setLoading(true);
      setError("");

      let url = "/api/reserve/balances";
      if (overrideSplitAddress) {
        url += `?splitAddress=${encodeURIComponent(overrideSplitAddress)}`;
      }
      if (brand?.key) {
        url += `${overrideSplitAddress ? "&" : "?"}brandKey=${encodeURIComponent(brand.key)}`;
      }

      const r = await fetch(url, {
        headers: {
          "x-wallet": account?.address || "",
        },
      });
      const j: ReserveBalancesResponse = await r.json().catch(() => ({} as any));
      if (j.degraded) {
        setError(j.reason || "Degraded data");
      }
      setData(j);

      // If we switched versions, ensure selectedSplitVersion matches
      if (overrideSplitAddress) {
        setSelectedSplitVersion(overrideSplitAddress);
      } else if (!selectedSplitVersion && j.splitAddressUsed) {
        setSelectedSplitVersion(j.splitAddressUsed);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIndexing(true);
        try {
          await fetch(`/api/site/metrics?range=24h`, {
            headers: { "x-wallet": account?.address || "" },
          });
        } catch { }
        await fetchBalances();
      } finally {
        if (!cancelled) setIndexing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [account?.address]);

  if (loading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-foreground/10 rounded" />
          <div className="h-8 w-24 bg-foreground/10 rounded" />
        </div>
        <div className="h-4 w-64 bg-foreground/10 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 rounded-md border glass-pane space-y-2">
              <div className="h-3 w-12 bg-foreground/10 rounded" />
              <div className="h-5 w-20 bg-foreground/10 rounded" />
              <div className="h-3 w-16 bg-foreground/10 rounded" />
            </div>
          ))}
        </div>
        <div className="p-4 rounded-md border glass-pane space-y-2">
          <div className="h-4 w-48 bg-foreground/10 rounded" />
          <div className="h-8 w-32 bg-foreground/10 rounded" />
        </div>
        <div className="text-center text-sm text-muted-foreground italic mt-8">
          "The best time to start was yesterday. The next best time is now."
        </div>
      </div>
    );
  }

  if (error && !data) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (!data || !data.balances) {
    return <div className="text-sm text-muted-foreground">No data available</div>;
  }

  const { balances, totalUsd, merchantWallet, sourceWallet, splitAddressUsed } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      {/* Header Area */}
      <div className="md:col-span-12 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 mb-2">
        <div>
           <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--pp-secondary)]" /> 
             Reserve Analytics
           </h3>
           <div className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-1">Live balances and multi-asset distributions.</div>
        </div>
        <div className="flex items-center gap-3">
          {/* Version Selector */}
          {(data?.splitAddressUsed || (data?.splitHistory && data.splitHistory.length > 0)) && (
            <select
              value={selectedSplitVersion}
              onChange={(e) => fetchBalances(e.target.value)}
              className="h-10 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs font-mono font-medium"
            >
              {data?.splitAddressUsed && (
                <option value={data.splitAddressUsed}>
                  Latest ({data.splitAddressUsed.slice(0, 6)}...)
                </option>
              )}
              {data?.splitHistory?.map((h, i) => (
                <option key={h.address} value={h.address}>
                  v{data.splitHistory!.length - i} ({h.address.slice(0, 6)}...)
                </option>
              ))}
            </select>
          )}

          {indexing && <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--pp-secondary)] animate-pulse hidden sm:inline-block">Indexing…</span>}
          <button
            onClick={() => fetchBalances(selectedSplitVersion)}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/[0.05] hover:bg-foreground/[0.06] hover:border-foreground/10 text-[9px] uppercase font-bold tracking-wider transition-all shadow-sm"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="md:col-span-12 lg:col-span-8 rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[240px]">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--pp-secondary)] opacity-[0.07] blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-1 block ml-1">Total Reserve Value (USD)</div>
          <div className="text-4xl md:text-5xl font-bold mt-2 ml-1 tracking-tight text-foreground/90">${Number(totalUsd || 0).toFixed(2)}</div>
        </div>
        
        <div className="mt-8 md:mt-12 relative z-10">
          <div className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3 ml-1">Reserve Distribution</div>
          <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner bg-foreground/5 border border-foreground/[0.02]">
            {Object.entries(balances).map(([symbol, info]: [string, any]) => {
              const pct = totalUsd ? (Number(info.usd || 0) / Number(totalUsd || 1)) : 0;
              const colors: Record<string, string> = {
                USDC: "#3b82f6",
                USDT: "#10b981",
                cbBTC: "#f59e0b",
                cbXRP: "#6366f1",
                SOL: "#14f195",
                ETH: "#8b5cf6",
              };
              const bg = colors[symbol] || "#999999";
              return (
                <div
                  key={symbol}
                  title={`${symbol} • ${Math.round(pct * 1000) / 10}%`}
                  style={{ width: `${Math.max(0, pct * 100)}%`, backgroundColor: bg }}
                  className="h-full transition-all duration-500 hover:opacity-80 border-r border-background/20 last:border-r-0"
                />
              );
            })}
          </div>
          <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80 mt-4 flex flex-wrap gap-4 ml-1">
            {Object.entries(balances).map(([symbol, info]: [string, any]) => {
              const pct = totalUsd ? (Number(info.usd || 0) / Number(totalUsd || 1)) : 0;
              if (pct < 0.001) return null;
              const colors: Record<string, string> = {
                USDC: "#3b82f6", USDT: "#10b981", cbBTC: "#f59e0b", cbXRP: "#6366f1", SOL: "#14f195", ETH: "#8b5cf6",
              };
              return (
                <span key={symbol} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: colors[symbol] || "#999999" }} />
                  {symbol}: <span className="text-foreground/80">{Math.round(pct * 1000) / 10}%</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="md:col-span-12 lg:col-span-4 rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex flex-col justify-between shadow-sm min-h-[240px]">
        <div>
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-4 block ml-1">Wallet Configuration</div>
          
          <div className="space-y-4">
            <div className="bg-foreground/[0.03] rounded-2xl border border-foreground/[0.05] p-4 flex flex-col gap-1">
              <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60">Merchant Wallet</div>
              <div className="text-xs font-mono font-medium text-foreground/90"><TruncatedAddress address={merchantWallet || ""} /></div>
            </div>
            
            {sourceWallet && sourceWallet !== merchantWallet && (
              <div className="bg-foreground/[0.03] rounded-2xl border border-foreground/[0.05] p-4 flex flex-col gap-1">
                <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60">Source Wallet</div>
                <div className="text-xs font-mono font-medium text-foreground/90"><TruncatedAddress address={sourceWallet || ""} /></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-foreground/5">
          <button
            onClick={() => withdrawMerchant()}
            disabled={withdrawLoading || !splitAddressUsed}
            className="w-full px-6 py-4 rounded-xl bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_0_20px_var(--pp-secondary)]/30 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            title={splitAddressUsed ? "Withdraw from split to your wallet" : "Split address not configured"}
          >
            {withdrawLoading ? "Withdrawing…" : "Withdraw All to Wallet"}
          </button>
          {withdrawError && <div className="text-[9px] uppercase font-bold tracking-wider text-red-500 mt-3 text-center">{withdrawError}</div>}
        </div>
      </div>

      <div className="md:col-span-12">
        <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-4 ml-2">Asset Balances</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Object.entries(balances).map(([symbol, info]: [string, any]) => (
            <div key={symbol} className="rounded-2xl border border-foreground/[0.05] bg-foreground/[0.02] p-5 shadow-sm group hover:bg-foreground/[0.03] transition-colors relative overflow-hidden flex flex-col justify-between h-full min-h-[140px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-[var(--pp-secondary)]/10 transition-colors" />
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">{symbol}</div>
                <div className="text-lg font-bold text-foreground/90 font-mono tracking-tight">{Number(info.units || 0).toFixed(4)}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
                  ${Number(info.usd || 0).toFixed(2)}
                </div>
              </div>

              <div className="mt-5 relative z-10">
                <button
                  onClick={() => withdrawMerchant(symbol)}
                  disabled={withdrawLoading || !splitAddressUsed}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/[0.05] bg-foreground/[0.03] hover:bg-[var(--pp-secondary)]/10 hover:border-[var(--pp-secondary)]/30 hover:text-[var(--pp-secondary)] text-[8px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  title={splitAddressUsed ? `Withdraw ${symbol} to your wallet` : "Split address not configured"}
                >
                  {withdrawLoading ? "Working…" : `Withdraw`}
                </button>
                {(() => {
                  try {
                    const rr = (withdrawResults || []).find((x: any) => String(x?.symbol || "") === String(symbol));
                    return rr ? (
                      <div className={`text-[8px] font-bold uppercase tracking-wider mt-2 text-center ${statusClassFor(rr)}`}>
                        {formatReleaseMessage(rr)}
                      </div>
                    ) : null;
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="md:col-span-12 text-[10px] uppercase font-bold tracking-wider text-amber-500 mt-2 ml-2">Warning: {error}</div>}

      {withdrawModalOpen && typeof window !== "undefined"
        ? createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onKeyDown={(e) => { if (e.key === "Escape") setWithdrawModalOpen(false); }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="w-full max-w-sm rounded-3xl border border-foreground/[0.05] bg-[#0a0a0a] p-8 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--pp-secondary)] opacity-10 blur-[60px] pointer-events-none" />
              <div className="text-xs uppercase font-bold tracking-[0.2em] text-foreground mb-4 flex items-center gap-2 relative z-10">
                <div className="w-2 h-2 rounded-full bg-[var(--pp-secondary)]" />
                Withdrawing to Wallet
              </div>
              <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80 mb-3 ml-1 relative z-10">
                {withdrawProcessed} / {Math.max(0, withdrawQueue.length)} processed
              </div>
              <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden relative z-10">
                <div
                  className="h-full bg-[var(--pp-secondary)] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.floor((withdrawProcessed / Math.max(1, withdrawQueue.length)) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-6 max-h-48 overflow-y-auto custom-scrollbar pr-2 relative z-10 space-y-2">
                {withdrawQueue.map((sym) => {
                  const st = withdrawStatuses[sym];
                  const cls = st
                    ? st.status === "failed"
                      ? "text-red-500 bg-red-500/5 border-red-500/10"
                      : st.status === "skipped"
                        ? "text-amber-500 bg-amber-500/5 border-amber-500/10"
                        : "text-emerald-500 bg-emerald-500/5 border-emerald-500/10"
                    : "text-muted-foreground bg-foreground/[0.02] border-foreground/5";
                  const fallback =
                    withdrawProcessed <= withdrawQueue.indexOf(sym) ? "queued" : "working…";
                  return (
                    <div key={sym} className={`text-[9px] font-bold uppercase tracking-wider p-3 rounded-xl border ${cls}`}>
                      {sym}: {st?.status || fallback}
                      {st?.tx ? ` • ${String(st.tx).slice(0, 10)}…` : ""}
                      {st?.reason ? ` • ${st.reason}` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-end gap-3 relative z-10">
                <button
                  className="px-6 py-3 rounded-xl border border-foreground/[0.05] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-[9px] font-bold uppercase tracking-wider transition-all"
                  onClick={() => setWithdrawModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}
    </div>
  );
}
