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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <button
          className="px-3 py-1.5 rounded-md border text-sm"
          onClick={fetchTransactions}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {splitAddress && (
        <div className="microtext text-muted-foreground">
          Split Contract:{" "}
          <a
            href={`https://base.blockscout.com/address/${splitAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {splitAddress.slice(0, 10)}…{splitAddress.slice(-8)}
          </a>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-md border p-3 glass-pane">
          <div className="text-xs font-medium text-muted-foreground mb-2">Payments Received</div>
          {Object.entries(cumulative.payments).map(([token, amount]) => (
            <div key={token} className="flex items-center justify-between text-sm">
              <span>{token}</span>
              <span className="font-semibold">{Number(amount || 0).toFixed(4)}</span>
            </div>
          ))}
          {Object.keys(cumulative.payments).length === 0 && (
            <div className="text-sm text-muted-foreground">No payments yet</div>
          )}
        </div>

        <div className="rounded-md border p-3 glass-pane">
          <div className="text-xs font-medium text-muted-foreground mb-2">Merchant Releases</div>
          {Object.entries(cumulative.merchantReleases).map(([token, amount]) => (
            <div key={token} className="flex items-center justify-between text-sm">
              <span>{token}</span>
              <span className="font-semibold">{Number(amount || 0).toFixed(4)}</span>
            </div>
          ))}
          {Object.keys(cumulative.merchantReleases).length === 0 && (
            <div className="text-sm text-muted-foreground">No releases yet</div>
          )}
        </div>

        <div className="rounded-md border p-3 glass-pane">
          <div className="text-xs font-medium text-muted-foreground mb-2">Platform Releases</div>
          {Object.entries(cumulative.platformReleases).map(([token, amount]) => (
            <div key={token} className="flex items-center justify-between text-sm">
              <span>{token}</span>
              <span className="font-semibold">{Number(amount || 0).toFixed(4)}</span>
            </div>
          ))}
          {Object.keys(cumulative.platformReleases).length === 0 && (
            <div className="text-sm text-muted-foreground">No releases yet</div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-md border glass-pane p-4">
        <div className="text-sm font-medium mb-3">
          Recent Transactions {transactions.length > 0 && `(${transactions.length})`}
        </div>
        
        {transactions.length > 0 ? (
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {transactions.map((tx: any, idx: number) => {
              const txType = tx?.type || 'unknown';
              const releaseType = tx?.releaseType;
              const isPayment = txType === 'payment';
              const isRelease = txType === 'release';
              
              return (
                <div 
                  key={idx} 
                  className={`p-3 rounded border text-xs ${
                    isRelease 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        <a
                          href={`https://base.blockscout.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-600"
                        >
                          {String(tx.hash || "").slice(0, 10)}…{String(tx.hash || "").slice(-8)}
                        </a>
                      </span>
                      {isPayment && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium">
                          Payment
                        </span>
                      )}
                      {isRelease && releaseType === 'merchant' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium">
                          Merchant Release
                        </span>
                      )}
                      {isRelease && releaseType === 'platform' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-medium">
                          Platform Release
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-sm">
                      {Number(tx.value || 0).toFixed(4)} {String(tx.token || 'ETH').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between microtext text-muted-foreground">
                    <span>
                      {isPayment ? 'From' : 'To'}: {String(isPayment ? tx.from : tx.to || "").slice(0, 10)}…
                    </span>
                    <span>{new Date(Number(tx.timestamp || 0)).toLocaleString()}</span>
                  </div>
                  {tx.blockNumber && (
                    <div className="microtext text-muted-foreground mt-1">
                      Block: {Number(tx.blockNumber || 0).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No transactions found</div>
            <div className="microtext mt-1">
              Transactions will appear here once payments are received or withdrawals are made.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
