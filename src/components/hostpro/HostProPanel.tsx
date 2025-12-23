"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FloorMap from './FloorMap';
import AssignSplitPane from './AssignSplitPane';
import FloorDesigner, { Tool as DesignerTool } from './FloorDesigner';
import { getPreset } from '@/lib/host/presets';
import { FloorPreset } from '@/lib/host/types';
import { Play, Pause, RotateCcw, MousePointer2, BoxSelect, LassoSelect, Ruler, Move, Eraser, Type, Maximize2, Minimize2 } from 'lucide-react';

export default function HostProPanel() {
  const [presets, setPresets] = useState<FloorPreset[]>([]);
  const [preset, setPreset] = useState<FloorPreset | null>(null);
  const [session, setSession] = useState<any>(null);
  const [servers, setServers] = useState<Array<{ id: string; name: string; department?: string; role?: string; isActive?: boolean; range?: string; start?: string; end?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'domains' | 'servers'>('domains');
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({});
  const [ordersByTable, setOrdersByTable] = useState<Record<string, { serverName?: string; checks: number; total?: number }>>({});
  const [layouts, setLayouts] = useState<Array<{ slug: string; updatedAt?: string }>>([]);
  const [layoutSlug, setLayoutSlug] = useState<string>('');
  const [layoutData, setLayoutData] = useState<any | null>(null);
  const [designerTool, setDesignerTool] = useState<DesignerTool>('pointer');
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [manualTableId, setManualTableId] = useState<string>('');
  const [manualServerId, setManualServerId] = useState<string>('');
  const [manualPartySize, setManualPartySize] = useState<number>(2);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [pendingServerId, setPendingServerId] = useState<string>('');
  const [pendingAvailableTables, setPendingAvailableTables] = useState<string[]>([]);
  const [pendingTableId, setPendingTableId] = useState<string>('');
  const [pendingPartySize, setPendingPartySize] = useState<number>(2);
  const [modalAdvancePointer, setModalAdvancePointer] = useState<boolean>(true);
  const [temporaryOverlayHidden, setTemporaryOverlayHidden] = useState<boolean>(false);
  const [flashTableId, setFlashTableId] = useState<string | undefined>(undefined);
  const [quickSeatMode, setQuickSeatMode] = useState<boolean>(false);
  const [selectedQuickSeatTable, setSelectedQuickSeatTable] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Load presets and active servers
  useEffect(() => {
    (async () => {
      const p = await fetch('/api/hostpro/presets').then(r => r.json()).catch(() => null);
      if (p?.success) setPresets(p.data || []);
    })();
  }, []);

  // Poll Toast for open orders to reflect live occupancy and counts
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const s = await fetch('/api/hostpro/session').then(r => r.json());
        if (s?.success && active) {
          const occ = s.data?.tableOccupied || {};
          setOpenTables(occ);
        }
      } catch {}
    }
    load();
    const t = setInterval(load, 15000);
    return () => { active = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/7shifts/active-shifts');
        const j = await r.json();
        const grouped = j?.grouped as Record<string, any[]> | undefined;
        const list: any[] = [];
        if (grouped) {
          for (const [_dept, arr] of Object.entries(grouped)) for (const it of arr as any[]) list.push(it);
        } else if (Array.isArray(j?.data)) list.push(...j.data);
        function normRole(r?: string) {
          const v = (r || '').toLowerCase();
          if (v.includes('bart')) return 'Bartender';
          if (v.includes('host')) return 'Host';
          if (v.includes('server') || v.includes('wait')) return 'Server';
          return r || 'Staff';
        }
        const mapped = list
          .filter((x: any) => {
            const v = `${x.department || ''} ${x.role || ''}`.toLowerCase();
            return v.includes('server') || v.includes('bart') || v.includes('host');
          })
          .map((s: any) => ({ id: String(s.userId || s.id || s.name), name: s.name, department: s.department, role: normRole(s.role), isActive: s.isActive, range: s.range, start: s.start, end: s.end }));
        // Group by user id and expand to one entry per shift with Shift X tagging
        const byUser = new Map<string, any[]>();
        for (const m of mapped) {
          const key = String(m.id);
          if (!byUser.has(key)) byUser.set(key, []);
          byUser.get(key)!.push(m);
        }
        for (const arr of byUser.values()) {
          arr.sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));
        }
        const expanded: any[] = [];
        for (const arr of byUser.values()) {
          const count = arr.length;
          arr.forEach((m, idx) => expanded.push({ ...m, shiftIndex: idx + 1, shiftCount: count }));
        }
        setServers(expanded);
        // If team members changed and there was a previous submit, show hazard
        try {
          const el = document.getElementById('assign-tab');
          if (el && expanded.length && (session?.assignments?.length || 0)) {
            el.innerHTML = 'Assign ⚠️';
          }
        } catch {}
      } catch {}
    })();
  }, []);

  // Load available layouts and select most recent
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hostpro/scan-layout?all=1');
        const js = await res.json();
        if (js?.success) {
          const list = (js.data || []).map((x: any) => ({ slug: x.slug, updatedAt: x.updatedAt })) as Array<{ slug: string; updatedAt?: string }>;
          setLayouts(list);
          if (list.length && !layoutSlug) setLayoutSlug(list[0].slug);
        }
      } catch {}
    })();
  }, [layoutSlug]);

  // Load selected layout details
  useEffect(() => {
    (async () => {
      try {
        const url = layoutSlug ? `/api/hostpro/scan-layout?slug=${encodeURIComponent(layoutSlug)}` : '/api/hostpro/scan-layout';
        const res = await fetch(url);
        const js = await res.json();
        if (js?.success) setLayoutData(js.data || null);
      } catch {}
    })();
  }, [layoutSlug]);

  useEffect(() => {
    (async () => {
      const s = await fetch('/api/hostpro/session').then(r => r.json()).catch(() => null);
      if (s?.success && s.data) setSession(s.data);
    })();
  }, []);

  useEffect(() => {
    if (presets.length && !preset) setPreset(presets[0]);
  }, [presets, preset]);

  async function startSession() {
    if (!preset) return;
    setLoading(true);
    try {
      // Only include eligible servers (active Servers role) in rotation/session
      const eligibleServersBase = servers.filter(s => String(s.role) === 'Server' && s.isActive);
      // Deduplicate by base id in case multiple shift cards exist for same person
      const seen = new Set<string>();
      const eligibleServers = eligibleServersBase.filter(s => {
        const key = String(s.id).split('::')[0];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(s => ({ ...s, id: String(s.id).split('::')[0] }));
      const res = await fetch('/api/hostpro/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presetSlug: preset.slug, servers: eligibleServers }) });
      const json = await res.json();
      if (json?.success) setSession(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function updateAssignments(a: Array<{ serverId: string; domainIds: string[] }>) {
    await fetch('/api/hostpro/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignments: a }) });
    setSession((s: any) => ({ ...s, assignments: a, assignmentsLocked: true }));
  }

  async function autoAssign() {
    // Build domain list in the same order as shown in the Assign panel
    const domains = (livePreset?.domains || []) as Array<{ id: string; name: string }>;
    const domainIds = domains.map(d => d.id);

    // Partition team by role, include only active shift card per person (dedupe by base id)
    const team = computeTeamMembers(servers, session);
    function dedupeByBaseId(list: Array<any>) {
      const seen = new Set<string>();
      return list.filter(s => {
        const base = String(s.id).split('::')[0];
        if (seen.has(base)) return false;
        seen.add(base);
        return true;
      }).map(s => ({ ...s, id: String(s.id).split('::')[0] }));
    }
    const activeServers = dedupeByBaseId(team.filter(s => String(s.role) === 'Server' && s.isActive));
    const activeBartenders = dedupeByBaseId(team.filter(s => (String(s.role || '').includes('Bartender')) && s.isActive));

    // Fallbacks if one group is empty
    const serverPool = activeServers.length ? activeServers : activeBartenders;
    const bartenderPool = activeBartenders.length ? activeBartenders : activeServers;

    // Distribute: first three domains to servers; remaining to bartenders
    const serverDomainIds = domainIds.slice(0, 3);
    const bartenderDomainIds = domainIds.slice(3);

    const assignMap = new Map<string, Set<string>>();
    function pushAssign(id: string, d: string) {
      const set = assignMap.get(id) || new Set<string>();
      set.add(d);
      assignMap.set(id, set);
    }
    function rrAssign(domIds: string[], pool: Array<{ id: string }>) {
      if (!domIds.length || !pool.length) return;
      let i = 0;
      for (const d of domIds) {
        const target = pool[i % pool.length];
        pushAssign(String(target.id), d);
        i++;
      }
    }
    rrAssign(serverDomainIds, serverPool);
    rrAssign(bartenderDomainIds, bartenderPool);

    const nextAssignments = Array.from(assignMap.entries()).map(([serverId, set]) => ({ serverId, domainIds: Array.from(set) }));
    await updateAssignments(nextAssignments);
  }

  const presetName = preset?.name || 'Preset';
  const showMapAssignments = Boolean(session?.assignments?.length);
  // Build preset using selected layout tables (and size) + domains from localStorage
  const basePreset = useMemo(() => {
    if (!preset) return { slug: '', name: '', tables: [], domains: [] } as any;
    const tables = Array.isArray(layoutData?.tables) && layoutData.tables.length
      ? preset.tables.map((t: any) => {
          const s = layoutData.tables.find((x: any) => String(x.id) === String(t.id));
          return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: s.type || t.type } : t;
        })
      : preset.tables;
    const width = layoutData?.width || preset.width;
    const height = layoutData?.height || preset.height;
    return { ...preset, width, height, tables };
  }, [preset, layoutData]);
  const livePreset = computeLiveDomains(basePreset);
  const activeAssignableStaff = React.useMemo(() => servers.filter(s => (String(s.role) === 'Server' || String(s.role).includes('Bartender')) && s.isActive), [servers]);

  function inferAssignedServerIdForTable(tableId?: string): string | undefined {
    if (!tableId) return undefined;
    try {
      const dom = (livePreset?.domains || []).find((d: any) => (d.tableIds || []).includes(String(tableId)));
      if (!dom) return undefined;
      const a = (session?.assignments || []).find((x: any) => (x.domainIds || []).includes(dom.id));
      return a?.serverId ? String(a.serverId) : undefined;
    } catch { return undefined; }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">HostPro</h2>
          <p className="text-muted-foreground text-sm">Smart hosting with 7shifts-driven roster and domain mapping</p>
        </div>
      </div>

      {/* Hide module on small phones */}
      <div className="block md:hidden">
        <div className="relative overflow-hidden rounded-xl border">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />
          <div className="relative p-6 text-center text-white">
            <div className="text-lg font-semibold">HostPro is available on tablets and desktops</div>
            <div className="text-sm opacity-90 mt-1">Please use a larger device to access this module.</div>
          </div>
        </div>
      </div>
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'hidden md:block'}`}>
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </Button>
        </div>
        <Tabs defaultValue="servers">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="servers">Active Servers</TabsTrigger>
          <TabsTrigger value="domains" id="domains-tab">Domains & Map</TabsTrigger>
          <TabsTrigger value="assign" id="assign-tab">Assign</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>

        {/* Tab 1: Servers */}
        <TabsContent value="servers">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Current Active Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveStaff servers={servers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Domains & Map */}
        <TabsContent value="domains" className="space-y-4">
          <Card className="bg-card">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle>Domains & Map</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant={designerTool==='pointer'?'default':'outline'} onClick={() => setDesignerTool('pointer')}><MousePointer2 className="h-3 w-3 mr-1" />Select</Button>
                    <Button size="sm" variant={designerTool==='rect'?'default':'outline'} onClick={() => setDesignerTool('rect')}><BoxSelect className="h-3 w-3 mr-1" />Box</Button>
                    <Button size="sm" variant={designerTool==='lasso'?'default':'outline'} onClick={() => setDesignerTool('lasso')}><LassoSelect className="h-3 w-3 mr-1" />Lasso</Button>
                  </div>
                  <div className="flex items-center gap-1 pl-2 border-l">
                    <Button size="sm" variant={designerTool==='wallDraw'?'default':'outline'} onClick={() => setDesignerTool('wallDraw')}><Ruler className="h-3 w-3 mr-1" />Draw</Button>
                    <Button size="sm" variant={designerTool==='wallEdit'?'default':'outline'} onClick={() => setDesignerTool('wallEdit')}><Move className="h-3 w-3 mr-1" />Edit</Button>
                    <Button size="sm" variant={designerTool==='wallErase'?'default':'outline'} onClick={() => setDesignerTool('wallErase')}><Eraser className="h-3 w-3 mr-1" />Erase</Button>
                  </div>
                  <div className="flex items-center gap-1 pl-2 border-l">
                    <Button size="sm" variant={designerTool==='textAdd'?'default':'outline'} onClick={() => setDesignerTool('textAdd')}><Type className="h-3 w-3 mr-1" />Add Text</Button>
                    <Button size="sm" variant={designerTool==='textMove'?'default':'outline'} onClick={() => setDesignerTool('textMove')}><Move className="h-3 w-3 mr-1" />Move</Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <FloorDesigner preset={getPreset('3-plus-2-bar') || { slug:'', name:'', tables:[], domains:[] }} showRegionColors={true} hideToolSections={true} tool={designerTool} onToolChange={setDesignerTool} />
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { try { localStorage.removeItem('hostpro:regions'); } catch {} }}>Reset Regions</Button>
                <Button size="sm" onClick={async () => {
                  try {
                    // Ensure there is a live session before locking domains
                    if (!session) {
                      try {
                        const chosenPreset = preset || getPreset('3-plus-2-bar');
                        const eligibleServersBase = servers.filter(s => String(s.role) === 'Server' && s.isActive);
                        const seen = new Set<string>();
                        const eligibleServers = eligibleServersBase.filter(s => {
                          const key = String(s.id).split('::')[0];
                          if (seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        }).map(s => ({ ...s, id: String(s.id).split('::')[0] }));
                        const r0 = await fetch('/api/hostpro/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presetSlug: chosenPreset?.slug || '3-plus-2-bar', servers: eligibleServers }) });
                        const j0 = await r0.json();
                        if (j0?.success) setSession(j0.data);
                      } catch {}
                    }

                    const raw = typeof window !== 'undefined' ? localStorage.getItem('hostpro:regions') : null;
                    const regions = raw ? JSON.parse(raw) : [];
                    const payload = { domains: Array.isArray(regions) ? regions.map((r: any, idx: number) => ({ id: r.id || `D${idx+1}`, name: r.name || `Region ${idx+1}`, color: r.color || '#22c55e', tableIds: r.tableIds || [] })) : [], layoutSlug };
                    const res = await fetch('/api/hostpro/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const js = await res.json();
                    if (js?.success) {
                      const el = document.getElementById('domains-tab');
                      if (el) el.innerHTML = 'Domains & Map ✓';
                      setSession((s: any) => ({ ...(s || {}), domainsLocked: true }));
                    }
                  } catch {}
                }}>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Assign */}
        <TabsContent value="assign">
          <AssignSplitPane
            preset={computeLiveDomains(preset)}
            servers={computeTeamMembers(servers, session)}
            assignments={session?.assignments || computeTeamMembers(servers, session).map(s => ({ serverId: String(s.id), domainIds: [] }))}
            onChange={updateAssignments}
            onAuto={autoAssign}
            onSubmit={(assignments) => {
              updateAssignments(assignments);
              // Add green check to Assign tab
              const el = document.getElementById('assign-tab');
              if (el) el.innerHTML = 'Assign ✓';
            }}
          />
        </TabsContent>

        {/* Tab 4: Live */}
        <TabsContent value="live">
          <Card className="bg-card">
            <CardHeader className="flex-row items-center justify-between">
              <div>
              <CardTitle>Live Rotation</CardTitle>
                <div className="text-xs text-muted-foreground mt-0.5">Domains preset: {livePreset && (livePreset as any).domainsPresetName ? (livePreset as any).domainsPresetName : 'Custom'}</div>
              </div>
              <div className="flex gap-2">
                {/* Layout manager */}
                <select className="rounded-md border bg-background px-2 py-1 text-sm" value={layoutSlug || (layouts[0]?.slug || '')} onChange={async (e) => {
                  const slug = e.target.value;
                  setLayoutSlug(slug);
                  // Auto-load selected layout details
                  try {
                    const url = slug ? `/api/hostpro/scan-layout?slug=${encodeURIComponent(slug)}` : '/api/hostpro/scan-layout';
                    const res = await fetch(url);
                    const js = await res.json();
                    if (js?.success) setLayoutData(js.data || null);
                  } catch {}
                }}>
                  {layouts.map((l, idx) => {
                    const label = idx === 0 ? 'Default' : (l.updatedAt ? new Date(l.updatedAt).toLocaleString() : l.slug);
                    return <option key={l.slug} value={l.slug}>{label}</option>;
                  })}
                </select>
                <Button size="sm" variant="ghost" onClick={async () => {
                  const now = new Date();
                  const name = `layout-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
                  const payload = {
                    slug: name,
                    width: layoutData?.width || livePreset?.width,
                    height: layoutData?.height || livePreset?.height,
                    tables: Array.isArray(layoutData?.tables) ? layoutData.tables : livePreset?.tables,
                    walls: Array.isArray(layoutData?.walls) ? layoutData.walls : [],
                    labels: Array.isArray(layoutData?.labels) ? layoutData.labels : [],
                  };
                  await fetch('/api/hostpro/scan-layout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  const res = await fetch('/api/hostpro/scan-layout?all=1');
                  const js = await res.json();
                  if (js?.success) setLayouts((js.data || []).map((x: any) => ({ slug: x.slug, updatedAt: x.updatedAt })));
                  setLayoutSlug(name);
                }}>New</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const eligibleIds = servers.filter(s => String(s.role) === 'Server' && s.isActive).map(s => String(s.id));
                  const currentOrder: string[] = Array.isArray(session?.rotation?.order) ? (session.rotation.order as any).map((x: any) => String(x)) : [];
                  // Keep current order but drop ineligible; append any new eligible at the end
                  const filteredOrder: string[] = currentOrder.filter(id => eligibleIds.includes(String(id)));
                  for (const id of eligibleIds) if (!filteredOrder.includes(String(id))) filteredOrder.push(String(id));
                  const turningOn = !Boolean(session?.rotation?.isLive);
                  const canGoLive = filteredOrder.length > 0 && turningOn;
                  const nextIsLive = turningOn ? (canGoLive ? true : false) : false;
                  const nextPointer = Math.max(0, Math.min(Number(session?.rotation?.pointer || 0), Math.max(filteredOrder.length - 1, 0)));
                  const rot = { isLive: nextIsLive, order: filteredOrder, pointer: nextPointer } as any;
                  await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: rot }) });
                  setSession((s: any) => ({ ...s, rotation: rot }));
                }}>
                  {session?.rotation?.isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {session?.rotation?.isLive ? 'Pause' : 'Play'}
                </Button>
                <Button size="sm" variant={manualMode ? 'default' : 'outline'} onClick={() => setManualMode((v) => !v)}>
                  {manualMode ? 'Manual ✓' : 'Manual'}
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  const nextRotation = { ...(session?.rotation || {}), pointer: 0 };
                  await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: nextRotation, tableOccupied: {} }) });
                  setOpenTables({});
                  setFlashTableId(undefined);
                  setTemporaryOverlayHidden(false);
                  setSession((s: any) => ({ ...s, rotation: nextRotation, tableOccupied: {} }));
                }}><RotateCcw className="h-4 w-4" /> Reset</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await fetch('/api/hostpro/session?wipe=true', { method: 'DELETE' });
                  } catch {}
                  setOpenTables({});
                  setFlashTableId(undefined);
                  setTemporaryOverlayHidden(false);
                  setSession(null);
                }}>Reset All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const domainsLocked = Boolean(session?.domainsLocked);
                const assignmentsLocked = Boolean(session?.assignmentsLocked);
                const eligibleCount = servers.filter(s => String(s.role) === 'Server' && s.isActive).length;
                if (!domainsLocked || !assignmentsLocked || eligibleCount === 0) {
                  return (
                    <div className="relative">
                      <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/20 rounded-xl flex">
                        <div className="m-auto w-full max-w-xl rounded-lg border bg-background/80 p-4 text-center">
                          <div className="text-lg font-semibold mb-1">{eligibleCount === 0 ? 'No Servers Available' : 'Finish setup to go live'}</div>
                          <div className="text-sm text-muted-foreground">{eligibleCount === 0 ? 'There are no active Servers on the schedule.' : 'Complete both steps before starting the live rotation.'}</div>
                          <div className="grid grid-cols-1 gap-2 mt-3 text-sm">
                            <div className={`rounded-md border p-2 ${domainsLocked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>{domainsLocked ? 'Domains & Map: Complete' : 'Domains & Map: Pending (open the tab and Submit)'}</div>
                            <div className={`rounded-md border p-2 ${assignmentsLocked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>{assignmentsLocked ? 'Assign: Complete' : 'Assign: Pending (open the tab and Submit)'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="opacity-40 pointer-events-none">
                        {preset && (
                          <div className="relative">
                            {(() => {
                              const combined: Record<string, boolean> = { ...(session?.tableOccupied || {}) };
                              for (const [tid, val] of Object.entries(openTables)) if (val) combined[tid] = true;
                              return (
                                <FloorMap preset={livePreset} occupied={combined} showDomains={true} assignments={session?.assignments || []} servers={servers} walls={layoutData?.walls} labels={layoutData?.labels} />
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {(Boolean(session?.domainsLocked) && Boolean(session?.assignmentsLocked) && servers.some(s => String(s.role) === 'Server' && s.isActive)) && preset && (
                <div className="relative">
                  {/* Always render the FloorMap */}
                  {(() => {
                    const combined: Record<string, boolean> = { ...(session?.tableOccupied || {}) };
                    for (const [tid, val] of Object.entries(openTables)) if (val) combined[tid] = true;
                    return (
                      <FloorMap
                        preset={livePreset}
                        occupied={combined}
                        showDomains={true}
                        assignments={session?.assignments || []}
                        servers={servers}
                        walls={layoutData?.walls}
                        labels={layoutData?.labels}
                        flashTableId={flashTableId}
                        manualMode={manualMode}
                        quickSeatMode={quickSeatMode}
                        selectedQuickSeatTable={selectedQuickSeatTable}
                        onManualPick={(tid: string) => {
                          if (!manualMode) return;
                          setManualTableId(String(tid));
                          const inferred = inferAssignedServerIdForTable(String(tid));
                          setManualServerId(inferred || (activeAssignableStaff[0]?.id ? String(activeAssignableStaff[0].id) : ''));
                        }}
                        onQuickSeatPick={(tid: string) => {
                          if (!quickSeatMode) return;
                          if (selectedQuickSeatTable === tid) {
                            // Same table clicked - proceed to modal
                            setPendingAvailableTables([]);
                            setPendingTableId(tid);
                            setPendingServerId('');
                            setPendingPartySize(2);
                            setSeatModalOpen(true);
                          } else {
                            // Different table clicked - select it
                            setSelectedQuickSeatTable(tid);
                          }
                        }}
                      />
                    );
                  })()}

                  {/* Shared Legend */}
                  {(() => {
                    const domains: Array<{ id: string; name: string; color: string }> = (livePreset?.domains || []) as any;
                    const colorByServer = new Map<string, string>();
                    for (const a of (session?.assignments || []) as Array<{ serverId: string; domainIds: string[] }>) {
                      const first = (a.domainIds || [])[0];
                      const d = domains.find((x: any) => String(x.id) === String(first));
                      if (d) colorByServer.set(String(a.serverId), String(d.color));
                    }
                    const order: string[] = Array.isArray(session?.rotation?.order) ? (session!.rotation.order as any).map(String) : [];
                    const uniqueOrder = Array.from(new Set(order));
                    const bartMap = new Map<string, any>();
                    for (const s of servers) if (String(s.role || '').toLowerCase().includes('bart')) bartMap.set(String(s.id), s);
                    const bartenders = Array.from(bartMap.values());

                    return (
                      <div className={`absolute left-3 top-3 w-60 rounded-xl border backdrop-blur-md bg-white/60 dark:bg-slate-900/40 border-white/30 dark:border-slate-800/40 shadow p-3 ${session?.rotation?.isLive && !temporaryOverlayHidden ? 'z-30' : 'z-10'}`}>
                        <details open>
                          <summary className="cursor-pointer text-xs font-medium">Legend</summary>
                          <div className="mt-2 space-y-1">
                            {uniqueOrder.length === 0 && bartenders.length === 0 && (
                              <div className="text-xs text-muted-foreground">No rotation set</div>
                            )}
                            {uniqueOrder.map((sid) => {
                              const sv = servers.find(s => String(s.id) === String(sid)) || (Array.isArray(session?.servers) ? (session!.servers as any[]).find((s: any) => String(s.id) === String(sid)) : undefined);
                              const name = (sv as any)?.name || sid;
                              const dot = colorByServer.get(String(sid)) || '#64748b';
                              return (
                                <div key={`leg-${sid}`} className="flex items-center gap-2 text-xs">
                                  <span className="inline-block w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: dot, borderColor: dot }} />
                                  <span className="truncate">{name}</span>
                                </div>
                              );
                            })}
                            {bartenders.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-[10px] font-medium text-muted-foreground">Bartenders</div>
                                {bartenders.map((b: any) => {
                                  const dot = colorByServer.get(String(b.id)) || '#64748b';
                                  return (
                                    <div key={`leg-b-${b.id}`} className="flex items-center gap-2 text-xs">
                                      <span className="inline-block w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: dot, borderColor: dot }} />
                                      <span className="truncate">{b.name || b.id}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    );
                  })()}

                  {/* Quick Seat Button */}
                  <button
                    type="button"
                    className={`absolute right-3 bottom-3 text-white shadow-lg flex items-center justify-center transition-all duration-200 ${session?.rotation?.isLive && !temporaryOverlayHidden ? 'z-30' : 'z-10'} ${
                      quickSeatMode
                        ? 'bg-red hover:bg-red px-4 py-2 rounded-lg min-w-[200px] text-red-foreground'
                        : 'w-10 h-10 rounded-full bg-orange hover:bg-orange'
                    }`}
                    title={quickSeatMode ? "Cancel Quick Seat" : "Quick Seat"}
                    onClick={() => {
                      if (quickSeatMode) {
                        // Cancel quick seat mode
                        setQuickSeatMode(false);
                        setSelectedQuickSeatTable(null);
                      } else {
                        // Enter quick seat mode
                        setQuickSeatMode(true);
                        setSelectedQuickSeatTable(null);
                      }
                    }}
                  >
                    {quickSeatMode ? (
                      <>
                        <span className="text-sm mr-2">✕</span>
                        <span className="text-sm">Cancel</span>
                      </>
                    ) : (
                      <span>+</span>
                    )}
                  </button>

                  {/* Quick Seat Instruction Text */}
                  {quickSeatMode && (
                    <div className="absolute right-3 bottom-16 bg-background/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border">
                      <span className="text-sm font-medium">Pick the table you would like to seat</span>
                    </div>
                  )}

                  {session?.rotation?.isLive && !temporaryOverlayHidden && (
                    <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/20 rounded-xl flex">
                      <div className="m-auto w-full max-w-3xl rounded-lg border bg-background/80 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">Auto-rotation running</div>
                          <div className="text-xs">Preset: {(livePreset as any).domainsPresetName || 'Custom'}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="md:col-span-2 rounded-md border p-3 bg-background/60">
                            <div className="text-xs text-muted-foreground mb-1">Rotation Order</div>
                            <ol className="text-sm space-y-1">
                              {(session?.rotation?.order || []).map((id: string, idx: number) => (
                                <li key={`rot-${id}-${idx}`} className={`flex items-center justify-between rounded px-2 py-1 ${idx===session?.rotation?.pointer ? 'bg-primary/10 border border-primary/30' : ''}`}>
                                  <span>{idx+1}. {(
                                    servers.find(s => String(s.id) === String(id))?.name ||
                                    (Array.isArray(session?.servers) ? (session.servers as any[]).find((s: any) => String(s.id) === String(id))?.name : undefined) ||
                                    id
                                  )}</span>
                                  {idx===session?.rotation?.pointer && (<span className="text-xs text-primary">Next</span>)}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="rounded-md border p-3 bg-background/60">
                            <div className="text-xs text-muted-foreground mb-1">Next Seat</div>
                            {(() => {
                              const nextId = session?.rotation?.order?.[session?.rotation?.pointer || 0];
                              const a = (session?.assignments || []).find((x: any) => String(x.serverId) === String(nextId));
                              const domain = (livePreset?.domains || []).find((d: any) => (a?.domainIds || [])[0] === d.id);
                              const availableTables = (domain?.tableIds || []).filter((tid: string) => !session?.tableOccupied?.[tid]);
                              const suggestedTable = availableTables[0];
                              return (
                                <div className="text-center">
                                  <div
                                    className="text-5xl font-bold leading-tight relative pb-1"
                                    style={{
                                      borderBottom: `3px solid ${domain?.color || '#64748b'}`,
                                      display: 'inline-block'
                                    }}
                                  >
                                    {domain?.name || '—'}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                                    {domain ? `${availableTables.length}/${domain.tableIds?.length || 0} tables available` : 'No domain assigned'}
                                  </div>
                                  <div className="mt-3">
                                    <select className="rounded-md border bg-background px-2 py-1 text-sm" defaultValue={suggestedTable}>
                                      {availableTables.map((tid: string) => (
                                        <option key={tid} value={tid}>{tid}</option>
                                      ))}
                                    </select>
                                    {suggestedTable && (<span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 align-middle">auto-selected</span>)}
                                  </div>
                                  <div className="mt-3 flex items-center justify-center gap-2">
                                    <Button size="sm" onClick={async (e) => {
                                      const sel = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('select') as HTMLSelectElement | null);
                                      const tableId = (sel?.value || (availableTables[0] || '')) as string;
                                      setPendingAvailableTables(availableTables);
                                      setPendingTableId(tableId);
                                      setPendingServerId(String(nextId || ''));
                                      setPendingPartySize(2);
                                      setModalAdvancePointer(true);
                                      setSeatModalOpen(true);
                                    }}>Seat</Button>
                                    <Button size="sm" variant="outline" onClick={async () => {
                                      const nextOrder = session?.rotation?.order || [];
                                      const nextIdx = ((session?.rotation?.pointer || 0) + 1) % (nextOrder.length || 1);
                                      const nextServerId = nextOrder[nextIdx];
                                      if (!nextServerId) return;
                                      setPendingAvailableTables(availableTables);
                                      setPendingTableId(availableTables[0] || '');
                                      setPendingServerId(String(nextServerId));
                                      setPendingPartySize(2);
                                      setModalAdvancePointer(false);
                                      setSeatModalOpen(true);
                                    }}>Seat Next</Button>
                                    <Button size="sm" variant="outline" onClick={async () => {
                                      const nextOrder = session?.rotation?.order || [];
                                      const nextIdx = ((session?.rotation?.pointer || 0) + 1) % (nextOrder.length || 1);
                                      const nextServerId = nextOrder[nextIdx];
                                      if (!nextServerId) return;
                                      setPendingAvailableTables(availableTables);
                                      setPendingTableId(availableTables[0] || '');
                                      setPendingServerId(String(nextServerId));
                                      setPendingPartySize(2);
                                      setSeatModalOpen(true);
                                    }}>Skip</Button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact in-module Seat modal */}
                  {seatModalOpen && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto w-[260px] rounded-xl border bg-background/95 shadow-xl p-3">
                        <div className="text-center text-sm font-medium mb-2">Enter Guest Count</div>
                        <div className="text-center text-3xl font-bold mb-2 select-none">{pendingPartySize}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <Button key={n} variant="outline" onClick={()=> setPendingPartySize(ps => Math.min(20, Number(`${ps===0? '' : ps}${n}`)))}>{n}</Button>
                          ))}
                          <Button variant="outline" onClick={()=> setPendingPartySize(0)}>C</Button>
                          <Button variant="outline" onClick={()=> setPendingPartySize(ps => Math.min(20, Number(`${ps===0? '' : ps}0`)))}>0</Button>
                          <Button variant="outline" onClick={()=> setPendingPartySize(ps => Math.max(0, Math.floor(ps/10)))}>⌫</Button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <Button variant="ghost" onClick={()=>{
                            setSeatModalOpen(false);
                            if (quickSeatMode) {
                              // Return to table selection mode
                              setSelectedQuickSeatTable(null);
                            }
                          }}>Cancel</Button>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={()=> setPendingPartySize(ps => Math.min(20, ps + 1))}>+1</Button>
                            <Button className="bg-orange hover:bg-orange text-orange-foreground" onClick={async ()=>{
                              const partySize = Math.max(1, pendingPartySize || 1);
                              try {
                                const payload: any = { partySize };
                                if (pendingServerId) payload.preferredServerId = pendingServerId;
                                const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                                const j = await r.json();
                                const serverId = j?.data?.serverId || pendingServerId;
                                const tableId = pendingTableId || j?.data?.tableId;
                                if (serverId && tableId) {
                                  // Local rotation fallback update for smoother UX
                                  setSession((prev: any) => {
                                    if (!prev?.rotation?.order?.length) return prev;
                                    const order: string[] = Array.from(prev.rotation.order as any).map(String);
                                    let pointer = Number(prev.rotation.pointer || 0);
                                    if (modalAdvancePointer) {
                                      pointer = (pointer + 1) % Math.max(order.length, 1);
                                    } else if (pendingServerId) {
                                      const idx = order.findIndex(id => String(id) === String(pendingServerId));
                                      if (idx >= 0) {
                                        order.splice(idx, 1);
                                        order.push(String(pendingServerId));
                                      }
                                    }
                                    return { ...prev, rotation: { ...prev.rotation, order, pointer } };
                                  });
                                  await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId, tableId, partySize, advancePointer: modalAdvancePointer }) });
                                  setFlashTableId(tableId);
                                  setTemporaryOverlayHidden(true);
                                  setTimeout(async ()=>{
                                    setFlashTableId(undefined);
                                    setTemporaryOverlayHidden(false);
                                    const s = await fetch('/api/hostpro/session').then(r => r.json());
                                    if (s?.success) setSession(s.data);
                                  }, 1200);
                                }
                              } finally {
                                setSeatModalOpen(false);
                                if (quickSeatMode) {
                                  // Exit quick seat mode after successful seating
                                  setQuickSeatMode(false);
                                  setSelectedQuickSeatTable(null);
                                }
                              }
                            }}>Submit</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Next up card */}
                  {session?.rotation?.order?.length ? (
                    <div className="absolute top-3 right-3 rounded-xl border shadow p-3 bg-card/90 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div>
                      <div className="text-xs text-muted-foreground">Next Up</div>
                      <div className="font-semibold">{(
                        servers.find(s => String(s.id) === String(session.rotation.order[session.rotation.pointer]))?.name ||
                        (Array.isArray(session?.servers) ? (session.servers as any[]).find((s: any) => String(s.id) === String(session.rotation.order[session.rotation.pointer]))?.name : undefined) ||
                        '—'
                      )}</div>
                        </div>
                        <Button size="sm" onClick={async () => {
                          setPendingAvailableTables([]);
                          setPendingTableId('');
                          setPendingServerId('');
                          setPendingPartySize(2);
                          setSeatModalOpen(true);
                        }}>Seat</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          const nextOrder = session?.rotation?.order || [];
                          const nextIdx = ((session?.rotation?.pointer || 0) + 1) % (nextOrder.length || 1);
                          const nextServerId = nextOrder[nextIdx];
                          if (!nextServerId) return;
                          const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize: 2, preferredServerId: nextServerId }) });
                          const j = await r.json();
                          if (j?.data?.serverId && j.data.serverId === nextServerId && j.data.tableId) {
                            await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j.data.serverId, tableId: j.data.tableId, partySize: 2, advancePointer: false }) });
                            const order: string[] = Array.from(session.rotation.order as any);
                            const idx = order.findIndex((id) => String(id) === String(nextServerId));
                            if (idx >= 0) order.splice(idx, 1);
                            order.push(String(nextServerId));
                            const rot = { ...session.rotation, order, pointer: session.rotation.pointer };
                            await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: rot }) });
                            const s = await fetch('/api/hostpro/session').then(r => r.json());
                            if (s?.success) setSession(s.data);
                          } else if (typeof window !== 'undefined') {
                            window.alert('No table available for the next server.');
                          }
                        }}>Skip</Button>
                      </div>
                    </div>
                  ) : null}
                  {/* Manual seat panel */}
                  {manualMode && (
                    <div className="absolute bottom-3 right-3 rounded-xl border shadow p-3 bg-card/90 backdrop-blur w-[360px]">
                      <div className="text-sm font-medium mb-2">Manual Seat</div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Click a table on the map</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs w-20">Table</div>
                          <input className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" value={manualTableId} onChange={(e) => setManualTableId(e.target.value)} placeholder="Select from map" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs w-20">Guests</div>
                          <input type="number" min={1} max={20} className="w-24 rounded-md border bg-background px-2 py-1 text-sm" value={manualPartySize} onChange={(e) => setManualPartySize(Math.max(1, parseInt(e.target.value || '2', 10) || 2))} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs w-20">Server</div>
                          <select className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" value={manualServerId} onChange={(e) => setManualServerId(e.target.value)}>
                            {activeAssignableStaff.length === 0 ? (
                              <option value="">No active staff</option>
                            ) : null}
                            {activeAssignableStaff.map((s) => (
                              <option key={s.id} value={String(s.id)}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <Button size="sm" variant="ghost" onClick={() => { setManualMode(false); setManualTableId(''); setManualPartySize(2); setManualServerId(''); }}>Cancel</Button>
                          <Button size="sm" disabled={!manualTableId || !manualServerId} onClick={async () => {
                            if (!manualTableId || !manualServerId) return;
                            const partySize = manualPartySize;
                            // Mark seating on host session
                            await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: manualServerId, tableId: manualTableId, partySize, advancePointer: false }) });
                            // Create Toast order
                            try { await fetch('/api/toast/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: manualServerId, tableId: manualTableId, partySize }) }); } catch {}
                            // Refresh session
                            const s = await fetch('/api/hostpro/session').then(r => r.json());
                            if (s?.success) setSession(s.data);
                            setManualMode(false);
                            setManualTableId('');
                            setManualPartySize(2);
                            setManualServerId('');
                          }}>Start Order</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Inline legend and quick seat floating button */}
              {/* <div className="relative mt-4">
                <details className="absolute right-3 top-0 z-10 w-56 rounded-lg border bg-card/90 backdrop-blur p-3" open>
                  <summary className="cursor-pointer text-sm font-medium">Legend</summary>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-600" /> Available</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-red-500/30 border border-red-600" /> Occupied</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-primary/30 border border-primary" /> Assigned Domain</div>
                            </div>
                </details>
                <button
                  type="button"
                  className="absolute right-3 bottom-3 z-30 w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg flex items-center justify-center"
                  title="Quick Seat"
                  onClick={() => { setPendingAvailableTables([]); setPendingTableId(''); setPendingServerId(''); setPendingPartySize(2); setSeatModalOpen(true); }}
                >
                  +
                </button>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Legacy Quick Seat form removed; using floating quick seat button + keypad modal in Live panel

function ActiveStaff({ servers }: { servers: Array<{ id: string; name: string; role?: string; isActive?: boolean; range?: string; start?: string; end?: string; shiftIndex?: number; shiftCount?: number }> }) {
  const groups: Record<string, typeof servers> = { Server: [], Bartender: [], Host: [] };
  for (const s of servers) {
    const key = (s.role as any) || 'Server';
    if (!groups[key]) groups[key] = [] as any;
    groups[key].push(s);
  }
  const order = ['Server', 'Bartender', 'Host'];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {order.map((k) => (
        <div key={k} className="rounded-xl border bg-card p-3">
          <div className="font-semibold mb-2">{k}s</div>
          <div className="space-y-2">
            {(groups[k] || []).map((s) => (
              <div key={`${s.id}:${(s as any).shiftIndex || 0}:${s.start || s.range || ''}`} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-card/70 backdrop-blur">
                <div>
                  <div className="font-medium leading-tight flex items-center gap-2">
                    {s.name}
                    {Boolean((s as any).shiftIndex) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Shift {(s as any).shiftIndex}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.range || '—'}</div>
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 ${s.isActive ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'}`}>{s.isActive ? 'Active' : 'Scheduled'}</span>
              </div>
            ))}
            {(groups[k] || []).length === 0 && <div className="text-xs text-muted-foreground">No {k.toLowerCase()}s</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function computeLiveDomains(preset: any | null, layoutSlug?: string): any {
  if (!preset) return { slug: '', name: '', tables: [], domains: [] };
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('hostpro:regions') : null;
    if (raw) {
      const regions = JSON.parse(raw) as Array<{ id: string; name: string; color: string; tableIds: string[] }>;
      const domains = regions.map((r, idx) => ({ id: r.id || `D${idx+1}`, name: r.name || `Region ${idx+1}`, color: r.color || '#22c55e', tableIds: r.tableIds || [] }));
      return { ...preset, domains, domainsPresetName: 'Custom' };
    }
    // If no localStorage, try to load latest or selected layout from API and map tables
    // Note: For simplicity we only adopt tables coordinates; domains remain as-is unless regions are set via UI
    // The Live panel will still use domains from Assign to color map and legend
    // This ensures we never show old default layout if a saved layout exists
    if (typeof window !== 'undefined') {
      // Fire-and-forget fetch; component will re-render when session/preset updates elsewhere
      fetch(`/api/hostpro/scan-layout${layoutSlug ? `?slug=${encodeURIComponent(layoutSlug)}` : ''}`).then(r => r.json()).then(js => {
        if (js?.success && js?.data?.tables) {
          // Merge table positions into preset
          const map = new Map((js.data.tables as any[]).map((t: any) => [String(t.id), t]));
          preset.tables = preset.tables.map((t: any) => {
            const s = map.get(String(t.id));
            return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: s.type || t.type } : t;
          });
        }
      }).catch(() => {});
    }
  } catch {}
  return preset;
}

function mergeAssignments(assignments: Array<{ serverId: string; domainIds: string[] }>) {
  const map = new Map<string, Set<string>>();
  for (const a of assignments || []) {
    const id = String(a.serverId);
    if (!map.has(id)) map.set(id, new Set());
    const set = map.get(id)!;
    for (const d of a.domainIds || []) set.add(d);
  }
  return Array.from(map.entries()).map(([serverId, set]) => ({ serverId, domainIds: Array.from(set) }));
}

function computeTeamMembers(servers: Array<any>, session: any): Array<any> {
  const TTL_MINUTES = 30; // keep inactive assigned members visible for 30 minutes
  const now = Date.now();
  // Preserve multiple same-day shifts for the same person
  const visible = servers.filter(s => ['Server','Bartender'].includes((s.role as any) || 'Server'));
  const presentIds = new Set(visible.map(s => String(s.id)));
  const result = Array.from(visible);
  // Include previously assigned but now inactive staff for reassignment, preserve known names
  if (Array.isArray(session?.assignments)) {
    for (const a of session.assignments) {
      const id = String(a.serverId);
      if (!presentIds.has(id)) {
        const fallback = Array.isArray(session?.servers) ? (session.servers as any[]).find((s: any) => String(s.id) === id) : undefined;
        const lastActiveAt = fallback?.lastActiveAt ? new Date(fallback.lastActiveAt).getTime() : 0;
        const withinTtl = lastActiveAt > 0 ? (now - lastActiveAt) <= TTL_MINUTES * 60 * 1000 : false;
        if (withinTtl || ((a?.domainIds || []).length > 0)) {
          result.push({ id, name: fallback?.name || id, role: fallback?.role || 'Server', isActive: false });
        }
      }
    }
  }
  return result;
}


