"use client";

import Link from "next/link";
import React from "react";

type LiveItem = {
  wallet: string;
  displayName?: string;
  pfpUrl?: string;
  spaceUrl?: string;
  liveSince?: number;
  lastHeartbeat?: number;
  languages?: string[];
  domains?: string[];
};

type Preview = {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
  favicon?: string;
};

export default function LiveListClient({ initialItems }: { initialItems: LiveItem[] }) {
  const [items, setItems] = React.useState<LiveItem[]>(initialItems || []);
  const [previews, setPreviews] = React.useState<Record<string, Preview | null>>({});
  const [loading, setLoading] = React.useState(false);
  const inFlightRef = React.useRef<AbortController | null>(null);

  const fetchLive = React.useCallback(async () => {
    if (inFlightRef.current) { try { inFlightRef.current.abort(); } catch {} }
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;
    const timeout = setTimeout(() => { try { ctrl.abort(); } catch {} }, 8000);
    setLoading(true);
    try {
      const r = await fetch('/api/users/live', { cache: 'no-store', signal: ctrl.signal });
      const j = await r.json().catch(() => ({}));
      const list: LiveItem[] = Array.isArray(j?.live) ? j.live : [];
      setItems(list);
      // Refresh previews for any changed links
      const urls = new Set(list.map(u => String(u.spaceUrl || '').trim()).filter(Boolean));
      const next: Record<string, Preview | null> = { ...previews };
      await Promise.all([...urls].map(async (url) => {
        try {
          const pctrl = new AbortController();
          const pt = setTimeout(() => { try { pctrl.abort(); } catch {} }, 6000);
          const pr = await fetch(`/api/link/preview?url=${encodeURIComponent(url)}`, { cache: 'no-store', signal: pctrl.signal }).then(r=>r.json()).catch(()=>({}));
          clearTimeout(pt);
          next[url] = pr?.preview || null;
        } catch { next[url] = null; }
      }));
      setPreviews(next);
    } catch {} finally {
      clearTimeout(timeout);
      if (inFlightRef.current === ctrl) inFlightRef.current = null;
      setLoading(false);
    }
  }, [previews]);

  // No auto-refresh: user-controlled only to avoid rate limits

  React.useEffect(() => {
    // Initial client-side preview fetch for SSR-provided items
    (async () => {
      const urls = new Set((initialItems||[]).map(u => String(u.spaceUrl || '').trim()).filter(Boolean));
      const next: Record<string, Preview | null> = {};
      await Promise.all([...urls].map(async (url) => {
        try {
          const pr = await fetch(`/api/link/preview?url=${encodeURIComponent(url)}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>({}));
          next[url] = pr?.preview || null;
        } catch { next[url] = null; }
      }));
      setPreviews(next);
    })();
  }, [initialItems]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Live Now</h1>
        <button className="px-3 h-9 rounded-md border glass-pane text-sm" onClick={fetchLive} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      {items.length === 0 ? (
        <div className="glass-pane rounded-xl border p-6 text-sm text-muted-foreground">No live sessions right now.</div>
      ) : (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
          {items.map((u) => {
            const url = String(u.spaceUrl || '').trim();
            const pv = url ? previews[url] : null;
            const site = pv?.siteName || pv?.domain || (()=>{ try { return new URL(url).hostname; } catch { return ''; } })();
            const title = pv?.title || u.displayName || 'Join the live session';
            const desc = pv?.description || '';
            return (
              <div key={u.wallet} className="glass-pane rounded-xl border p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-foreground/10 flex-shrink-0">
                      {u.pfpUrl ? <img src={u.pfpUrl} alt={u.displayName || u.wallet} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        <Link href={`/u/${u.wallet}`}>{u.displayName || `${u.wallet.slice(0,6)}…${u.wallet.slice(-4)}`}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(u.lastHeartbeat || Date.now()).toLocaleTimeString()} • Live</div>
                    </div>
                  </div>
                  {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-sm text-center">Join</a> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(u.domains) ? u.domains : []).slice(0,2).map((d) => (
                    <span key={`d-${u.wallet}-${d}`} className="badge-soft microtext">{d}</span>
                  ))}
                  {(Array.isArray(u.languages) ? u.languages : []).slice(0,2).map((l) => (
                    <span key={`l-${u.wallet}-${l}`} className="badge-soft microtext">{l}</span>
                  ))}
                </div>

                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg border overflow-hidden hover:opacity-95 transition-colors">
                    <div className="grid grid-cols-[96px,1fr] gap-3 p-3 items-center">
                      {pv?.image ? (
                        <div className="w-24 h-24 bg-foreground/10 rounded-md overflow-hidden">
                          <img src={pv.image} alt={title} className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                      <div className="min-w-0 col-span-1">
                        {site ? <div className="microtext mb-1 truncate">{site}</div> : null}
                        <div className="text-sm font-medium truncate">{title}</div>
                        {desc ? <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc}</div> : null}
                      </div>
                    </div>
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


