"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

export function TransactionsViewer() {
  const account = useActiveAccount();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cumulative, setCumulative] = useState<{ payments: Record<string, number>; merchantReleases: Record<string, number>; platformReleases: Record<string, number> }>({ 
    payments: {}, 
    merchantReleases: {}, 
    platformReleases: {} 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [splitAddress, setSplitAddress] = useState<string>("");

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError("");
      
      // First get the split address
      const balRes = await fetch("/api/reserve/balances", {
        headers: { "x-wallet": account?.address || "" },
        cache: "no-store",
      });
      const balData = await balRes.json().catch(() => ({}));
      const splitAddr = typeof balData?.splitAddressUsed === "string" ? balData.splitAddressUsed : "";
      const merchantWallet = balData?.merchantWallet || account?.address || "";
      
      if (!splitAddr || !/^0x[a-f0-9]{40}$/i.test(splitAddr)) {
        setError("Split address not configured");
        setTransactions([]);
        return;
      }
      
      setSplitAddress(splitAddr);
      
      const r = await fetch(
        `/api/split/transactions?splitAddress=${encodeURIComponent(splitAddr)}&merchantWallet=${encodeURIComponent(merchantWallet)}&limit=500`, 
        { cache: "no-store" }
      );
      const j = await r.json().catch(() => ({}));
      
      if (!r.ok || j?.error) {
        setError(j?.error || "Failed to load transactions");
        setTransactions([]);
        setCumulative({ payments: {}, merchantReleases: {}, platformReleases: {} });
      } else {
        const txs = Array.isArray(j?.transactions) ? j.transactions : [];
        const cumulativeData = j?.cumulative || { payments: {}, merchantReleases: {}, platformReleases: {} };
        setTransactions(txs);
        setCumulative(cumulativeData);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (account?.address) {
      fetchTransactions();
    }
  }, [account?.address]);

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-foreground/10 rounded" />
          <div className="h-8 w-24 bg-foreground/10 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-foreground/5 rounded-md border" />
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground italic mt-8">
          "Every transaction tells a story."
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border p-4 bg-red-50 dark:bg-red-950/20">
        <div className="text-sm font-medium text-red-700 dark:text-red-400">Error</div>
        <div className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      {/* Header Area */}
      <div className="md:col-span-12 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 mb-2">
        <div>
           <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--pp-secondary)]" /> 
             Transaction History
           </h3>
           <div className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-1">Split contract activity and historical payouts.</div>
        </div>
        <button
          className="px-5 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/[0.05] hover:bg-foreground/[0.06] hover:border-foreground/10 text-[9px] uppercase font-bold tracking-wider transition-all shadow-sm"
          onClick={fetchTransactions}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh History"}
        </button>
      </div>

      {splitAddress && (
        <div className="md:col-span-12 rounded-2xl border border-foreground/[0.05] bg-foreground/[0.02] p-4 flex items-center justify-between shadow-sm">
          <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80 ml-2">Active Split Contract</div>
          <a
            href={`https://base.blockscout.com/address/${splitAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-medium text-[var(--pp-secondary)] hover:underline mr-2"
          >
            {splitAddress.slice(0, 10)}…{splitAddress.slice(-8)}
          </a>
        </div>
      )}

      {/* Summary Stats */}
      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 shadow-sm h-full flex flex-col">
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-6">Payments Received</div>
          <div className="space-y-3 flex-1">
            {Object.entries(cumulative.payments).map(([token, amount]) => (
              <div key={token} className="flex items-center justify-between bg-foreground/[0.03] border border-foreground/[0.05] rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{token}</span>
                <span className="font-mono text-sm font-bold text-foreground/90">{Number(amount || 0).toFixed(4)}</span>
              </div>
            ))}
            {Object.keys(cumulative.payments).length === 0 && (
              <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/40 text-center py-6 h-full flex items-center justify-center">No payments yet</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.05] blur-[40px] pointer-events-none rounded-full" />
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-6 relative z-10">Merchant Releases</div>
          <div className="space-y-3 flex-1 relative z-10">
            {Object.entries(cumulative.merchantReleases).map(([token, amount]) => (
              <div key={token} className="flex items-center justify-between bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">{token}</span>
                <span className="font-mono text-sm font-bold text-emerald-500">{Number(amount || 0).toFixed(4)}</span>
              </div>
            ))}
            {Object.keys(cumulative.merchantReleases).length === 0 && (
              <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/40 text-center py-6 h-full flex items-center justify-center">No releases yet</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.05] blur-[40px] pointer-events-none rounded-full" />
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-6 relative z-10">Platform Releases</div>
          <div className="space-y-3 flex-1 relative z-10">
            {Object.entries(cumulative.platformReleases).map(([token, amount]) => (
              <div key={token} className="flex items-center justify-between bg-purple-500/[0.03] border border-purple-500/10 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500/70">{token}</span>
                <span className="font-mono text-sm font-bold text-purple-500">{Number(amount || 0).toFixed(4)}</span>
              </div>
            ))}
            {Object.keys(cumulative.platformReleases).length === 0 && (
              <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/40 text-center py-6 h-full flex items-center justify-center">No releases yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="md:col-span-12 rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 shadow-sm">
        <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-6 block ml-1">
          Recent Transactions {transactions.length > 0 && <span className="text-muted-foreground/50 ml-2">({transactions.length})</span>}
        </div>
        
        {transactions.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {transactions.map((tx: any, idx: number) => {
              const txType = tx?.type || 'unknown';
              const releaseType = tx?.releaseType;
              const isPayment = txType === 'payment';
              const isRelease = txType === 'release';
              
              return (
                <div 
                  key={idx} 
                  className={`p-4 md:p-5 rounded-2xl border transition-colors ${
                    isRelease 
                      ? releaseType === 'merchant'
                        ? 'bg-emerald-500/[0.02] border-emerald-500/10 hover:bg-emerald-500/[0.03]'
                        : 'bg-purple-500/[0.02] border-purple-500/10 hover:bg-purple-500/[0.03]'
                      : 'bg-foreground/[0.02] border-foreground/[0.05] hover:bg-foreground/[0.04]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-medium">
                        <a
                          href={`https://base.blockscout.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground/80 hover:text-[var(--pp-secondary)] transition-colors"
                        >
                          {String(tx.hash || "").slice(0, 10)}…{String(tx.hash || "").slice(-8)}
                        </a>
                      </span>
                      {isPayment && (
                        <span className="px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          Payment
                        </span>
                      )}
                      {isRelease && releaseType === 'merchant' && (
                        <span className="px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Merchant Release
                        </span>
                      )}
                      {isRelease && releaseType === 'platform' && (
                        <span className="px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                          Platform Release
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-sm text-foreground/90 shrink-0">
                      {Number(tx.value || 0).toFixed(4)} <span className="text-[10px] text-muted-foreground ml-1">{String(tx.token || 'ETH').toUpperCase()}</span>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    <span className="font-mono normal-case tracking-normal text-muted-foreground/80 text-xs">
                      {isPayment ? 'From' : 'To'}: {String(isPayment ? tx.from : tx.to || "").slice(0, 10)}…
                    </span>
                    <div className="flex items-center gap-4">
                      {tx.blockNumber && (
                        <span>
                          Block {Number(tx.blockNumber || 0).toLocaleString()}
                        </span>
                      )}
                      <span>{new Date(Number(tx.timestamp || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-foreground/10 bg-foreground/[0.01]">
            <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3">No transactions found</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/40 max-w-sm mx-auto leading-relaxed">
              Transactions will appear here once payments are received or withdrawals are made.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
