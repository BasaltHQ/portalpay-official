"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

export function FollowClient({ wallet }: { wallet: string }) {
  const account = useActiveAccount();
  const viewer = (account?.address || "").toLowerCase();
  const [counts, setCounts] = useState<{ followersCount: number; followingCount: number; viewerFollows: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const v = (account?.address || "").toLowerCase();
    const load = async () => {
      try {
        const r = await fetch(`/api/users/follows?wallet=${encodeURIComponent(wallet)}&viewer=${encodeURIComponent(v)}`, { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        setCounts({ followersCount: Number(j.followersCount || 0), followingCount: Number(j.followingCount || 0), viewerFollows: !!j.viewerFollows });
      } catch { setCounts({ followersCount: 0, followingCount: 0, viewerFollows: false }); }
    };
    load();
  }, [account?.address, wallet]);

  async function toggleFollow() {
    if (!viewer || viewer === wallet || busy) return;
    setBusy(true);
    try {
      const action = counts?.viewerFollows ? 'unfollow' : 'follow';
      const r = await fetch('/api/users/follow', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-wallet': viewer }, body: JSON.stringify({ target: wallet, action }) });
      await r.json().catch(()=>({}));
      setCounts(c => c ? { ...c, viewerFollows: !c.viewerFollows, followersCount: Math.max(0, c.followersCount + (action==='follow'?1:-1)) } : c);
    } catch {}
    setBusy(false);
  }

  if (!counts) return null;
  return (
    <div className="mt-2 flex items-center gap-3 text-xs">
      <span className="px-2 py-0.5 rounded-md border bg-foreground/5">Followers: <b>{counts.followersCount}</b></span>
      <span className="px-2 py-0.5 rounded-md border bg-foreground/5">Following: <b>{counts.followingCount}</b></span>
      {viewer && viewer !== wallet && (
        <button className="px-2 py-1 rounded-md border" onClick={toggleFollow} disabled={busy}>
          {counts.viewerFollows ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
}


