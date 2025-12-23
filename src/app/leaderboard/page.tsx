"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { DefaultAvatar } from "@/components/default-avatar";
import { Ellipsis, Dot, Minus } from "lucide-react";

type Row = {
  wallet: string;
  xp: number;
  amountSpentUsd?: number;
  purchasedSeconds?: number;
  usedSeconds?: number;
  purchasedHMS?: { h: number; m: number; s: number; text: string };
  usedHMS?: { h: number; m: number; s: number; text: string };
  balanceSeconds?: number;
  balanceHMS?: { h: number; m: number; s: number; text: string };
  displayName?: string;
  pfpUrl?: string;
  lastSeen?: number;
};


export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const account = useActiveAccount();
  const [xpPerDollar, setXpPerDollar] = useState<number>(1);
  const merchant = (account?.address || "").toLowerCase();

  useEffect(() => {
    const m = merchant;
    if (!m) { setRows([]); setLoading(false); return; }
    setLoading(true);
    fetch('/api/leaderboard', { headers: { 'x-wallet': m } })
      .then(r => r.json())
      .then(async (j) => {
        const base: Row[] = j.top || [];
        setXpPerDollar(Number(j.xpPerDollar || 1));
        // Enrich with profile data (best effort in parallel)
        const enriched = await Promise.all(base.map(async (r: Row) => {
          try {
            const pr = await fetch(`/api/users/profile?wallet=${encodeURIComponent(r.wallet)}`).then(x=>x.json()).catch(()=>({}));
            const p = pr?.profile || {};
            return { ...r, displayName: p.displayName || '', pfpUrl: p.pfpUrl || '', lastSeen: p.lastSeen || 0 } as Row;
          } catch { return r; }
        }));
        setRows(enriched);
      })
      .finally(() => setLoading(false));
  }, [merchant]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loyalty Leaderboard</h1>
        <span className="microtext badge-soft">
          {loading ? (<><span className="mr-1">Loading</span><Ellipsis className="inline h-3 w-3 align-[-2px]" /></>) : `${rows.length} players`}
        </span>
      </div>
      <div className="glass-pane rounded-xl border p-6 max-w-full">
        <ol className="divide-y">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <li key={`skeleton-${i}`} className="flex items-center justify-between gap-3 py-2 animate-pulse">
                <div className="inline-flex items-center gap-3 min-w-0">
                  <span className="w-6 text-right font-semibold hidden xs:inline-block sm:inline-block">{i + 1}</span>
                  <span className="w-8 h-8 rounded-full bg-foreground/10 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="h-4 w-32 bg-foreground/10 rounded mb-1" />
                    <span className="h-3 w-24 bg-foreground/10 rounded" />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="h-4 w-12 bg-foreground/10 rounded mb-1" />
                  <div className="h-3 w-24 bg-foreground/10 rounded mb-1" />
                  <div className="h-3 w-40 bg-foreground/10 rounded mb-1" />
                  <div className="h-3 w-16 bg-foreground/10 rounded" />
                </div>
              </li>
            ))
          ) : rows.length === 0 ? (
            <li className="py-8 text-center text-muted-foreground">
              <div className="text-lg font-medium mb-1">No buyers yet</div>
              <div className="microtext">Share your shop link to start earning Loyalty XP from your buyers!</div>
            </li>
          ) : (
            rows.map((r, i) => {
              const name = r.displayName || `${r.wallet.slice(0,6)}...${r.wallet.slice(-4)}`;
              return (
                <li key={`${r.wallet}-${i}`} className="flex items-center justify-between gap-3 py-2">
                  <a href={`/u/${r.wallet}`} className="inline-flex items-center gap-3 min-w-0">
                    <span className="w-6 text-right font-semibold hidden xs:inline-block sm:inline-block">{i+1}</span>
                    <span className="w-8 h-8 rounded-full overflow-hidden bg-foreground/10 flex-shrink-0">
                      {r.pfpUrl ? (
                        <img src={r.pfpUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <DefaultAvatar seed={r.wallet} size={32} className="w-8 h-8" />
                      )}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium leading-tight truncate">{name}</span>
                      <span className="microtext text-muted-foreground truncate">
                        {r.wallet.slice(0,10)}... <Dot className="inline h-3 w-3 mx-1" /> {r.lastSeen ? new Date(r.lastSeen).toLocaleDateString() : (<Minus className="inline h-3 w-3" />)}
                      </span>
                    </div>
                  </a>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold whitespace-nowrap">{r.xp} XP</div>
                    <div className="microtext text-muted-foreground whitespace-nowrap">
                      Spent ${Number(r.amountSpentUsd || 0).toFixed(2)}
                    </div>
                    <div className="microtext text-muted-foreground whitespace-nowrap">
                      Purch {r.purchasedHMS?.text || (<Minus className="inline h-3 w-3" />)} <Dot className="inline h-3 w-3 mx-1" /> Used {r.usedHMS?.text || (<Minus className="inline h-3 w-3" />)} <Dot className="inline h-3 w-3 mx-1" /> Bal {r.balanceHMS?.text || (<Minus className="inline h-3 w-3" />)}
                    </div>
                    <div className="microtext text-muted-foreground whitespace-nowrap">rank #{i+1}</div>
                  </div>
                </li>
              );
            })
          )}
        </ol>
        <p className="microtext text-muted-foreground mt-3">Top buyers for your shop. XP = {xpPerDollar} per USD spent.</p>
      </div>
    </div>
  );
}
