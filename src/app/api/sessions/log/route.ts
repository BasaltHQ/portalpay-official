import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authed = await getAuthenticatedWallet(req);
    const bodyWallet = String(body.wallet || '').toLowerCase();
    const headerWallet = String(req.headers.get('x-wallet') || '').toLowerCase();
    let wallet = (authed || bodyWallet || headerWallet).toLowerCase();
    // Accept x-wallet/body wallet when not yet authed (to avoid dropping early session events)
    if (authed) {
      wallet = authed.toLowerCase();
    } else if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const sessionId = String(body.sessionId || '').slice(0, 80);
    const type = String(body.type || '').slice(0, 64);
    const data = typeof body.data === 'object' && body.data ? body.data : undefined;
    const ts = Number(body.ts || Date.now());
    if (!/^0x[a-f0-9]{40}$/i.test(wallet) || !type) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    const id = `${wallet}:sess:${sessionId || 'none'}:${ts}:${Math.random().toString(36).slice(2)}`;
    try {
      const container = await getContainer();
      const doc = { id, type: 'session_event', wallet, sessionId: sessionId || undefined, eventType: type, data, ts } as any;
      await container.items.upsert(doc);
      // Opportunistic user metrics update
      try {
        const userId = `${wallet}:user`;
        const { resource } = await container.item(userId, wallet).read<any>();
        const metrics = resource?.metrics || {} as any;
        const m = { ...metrics } as any;
        // Counters
        m.sessions = Number(m.sessions || 0) + (type === 'session_start' ? 1 : 0);
        m.promptRolls = Number(m.promptRolls || 0) + (type === 'prompt_roll' ? 1 : 0);
        m.promptApplies = Number(m.promptApplies || 0) + (type === 'prompt_apply' ? 1 : 0);
        m.paramChanges = Number(m.paramChanges || 0) + (type === 'param_change' ? 1 : 0);
        // Track languages/topics/styles used
        if (type === 'param_change' && data && typeof data.key === 'string') {
          if (data.key === 'language' && typeof data.value === 'string') {
            m.languages = m.languages || {};
            m.languages[data.value] = Number(m.languages[data.value] || 0) + 1;
          }
          if (data.key === 'domain' && typeof data.value === 'string') {
            const d = String(data.value || '').trim();
            if (d && !/^(auto)$/i.test(d)) {
              m.domains = m.domains || {};
              m.domains[d] = Number(m.domains[d] || 0) + 1;
            }
          }
        }
        if ((type === 'prompt_roll' || type === 'prompt_apply') && data && typeof data === 'object') {
          const topics: string[] = [];
          const fields = ['theme','domain'];
          for (const f of fields) { const v = String(data[f] || '').trim(); if (v && v.length >= 3 && !/^(auto|generalist)$/i.test(v)) topics.push(v); }
          if (Array.isArray((data as any).topics)) {
            for (const t of (data as any).topics as string[]) { const tv = String(t||'').trim(); if (tv) topics.push(tv); }
          }
          if (topics.length) {
            m.topics = m.topics || {};
            for (const t of topics) m.topics[t] = Number(m.topics[t] || 0) + 1;
          }
          // If a domain was selected, accumulate it separately for Top domains
          const dom = String((data as any).domain || '').trim();
          if (dom && !/^(auto)$/i.test(dom)) {
            m.domains = m.domains || {};
            m.domains[dom] = Number(m.domains[dom] || 0) + 1;
          }
          const style = String((data.style || data.formatting || '')).trim();
          if (style) { m.styles = m.styles || {}; m.styles[style] = Number(m.styles[style] || 0) + 1; }
        }
        // Session end summary -> compute xp bonus and rating, and store a summary doc
        if (type === 'session_end') {
          const duration = Number((data && (data.seconds || data.duration)) || 0);
          const languages = Array.isArray((data as any)?.languages) ? (data as any).languages as string[] : [];
          const languageCount = Number((data as any)?.languageCount || languages.length || 0);
          const rollsCount = Number((data as any)?.rollsCount || 0);
          const guestsCount = Number((data as any)?.guestsCount || 0);
          const platform = typeof (data as any)?.platform === 'string' ? String((data as any).platform) : undefined;
          const agentRole = typeof (data as any)?.agentRole === 'string' ? String((data as any).agentRole) : undefined;
          const topicsArr: string[] = Array.isArray((data as any)?.topics) ? (data as any).topics as string[] : [];
          const domainSel = typeof (data as any)?.domain === 'string' ? String((data as any).domain) : undefined;
          // XP bonus heuristic
          let xpBonus = 0;
          xpBonus += Math.floor(Math.max(0, duration) / 300) * 2; // 2 XP per 5 minutes
          if (languageCount > 1) xpBonus += 5;
          if (platform && platform !== 'auto') xpBonus += 3;
          xpBonus += Math.min(10, Math.max(0, guestsCount));
          xpBonus += Math.min(10, Math.max(0, rollsCount));
          if (topicsArr.length >= 3) xpBonus += 3;
          const ratingRaw = 1 + (Math.max(0, duration) / 600) + (rollsCount > 0 ? 1 : 0) + (guestsCount >= 2 ? 1 : 0) + (languageCount > 1 ? 0.5 : 0) + (topicsArr.length > 2 ? 0.5 : 0);
          const rating = Math.max(1, Math.min(5, Math.round(ratingRaw * 2) / 2));
          try {
            const sumId = `${wallet}:sesssum:${sessionId || 'none'}:${ts}`;
            const summary = { id: sumId, type: 'session_summary', wallet, sessionId: sessionId || undefined, durationSeconds: duration, rating, xpBonus, platform, agentRole, languages, domain: domainSel, topics: topicsArr, rollsCount, guestsCount, ts } as any;
            await container.items.upsert(summary);
          } catch {}
          // Increment XP
          const currentXp = Number(resource?.xp || 0);
          resource.xp = currentXp + xpBonus;
          // Track totals
          m.totalSeconds = Number(m.totalSeconds || 0) + Math.max(0, duration);
          if (platform) { m.platforms = m.platforms || {}; m.platforms[platform] = Number(m.platforms[platform] || 0) + 1; }
          if (domainSel && !/^(auto)$/i.test(domainSel)) { m.domains = m.domains || {}; m.domains[domainSel] = Number(m.domains[domainSel] || 0) + 1; }
        }
        const next = { ...resource, id: userId, type: 'user', wallet, metrics: m, lastSeen: Date.now() };
        await container.items.upsert(next);
      } catch {}
      return NextResponse.json({ ok: true, id });
    } catch (e: any) {
      return NextResponse.json({ ok: true, degraded: true, reason: e?.message || 'cosmos_unavailable' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


