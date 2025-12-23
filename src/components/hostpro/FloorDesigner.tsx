"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { FloorPreset, TableSpec } from '@/lib/host/types';
import { getAllWallSegments } from '@/lib/host/floor-mapper';
import { RefreshCw, CheckCircle, AlertCircle, Eraser, Save, Plus, Trash, Ruler, MousePointer2, BoxSelect, LassoSelect, Move, Type } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

export type Tool =
  | 'pointer' | 'rect' | 'lasso' // selection and domain tools
  | 'wallDraw' | 'wallEdit' | 'wallErase' // wall tools
  | 'textAdd' | 'textMove'; // text tools

interface Region {
  id: string;
  name: string;
  color: string;
  tableIds: string[];
}

const defaultColors = ['#22c55e','#3b82f6','#eab308','#f97316','#ef4444','#8b5cf6','#14b8a6','#a3e635'];

export default function FloorDesigner({ preset, showRegionColors = false, hideToolSections = false, tool: controlledTool, onToolChange }: { preset: FloorPreset; showRegionColors?: boolean; hideToolSections?: boolean; tool?: Tool; onToolChange?: (t: Tool) => void }) {
  const { resolvedTheme } = (typeof window !== 'undefined' ? useTheme() : ({ resolvedTheme: 'light' } as any));
  const isDarkTheme = resolvedTheme === 'dark';
  const [regions, setRegions] = useState<Region[]>([{ id: 'r1', name: 'Region 1', color: defaultColors[0], tableIds: [] }]);
  const [activeRegionId, setActiveRegionId] = useState('r1');
  const [internalTool, setInternalTool] = useState<Tool>('pointer');
  const tool: Tool = (controlledTool ?? internalTool);
  function setToolState(next: Tool | ((prev: Tool) => Tool)) {
    if (typeof next === 'function') {
      const computed = (next as any)(tool);
      if (onToolChange) onToolChange(computed); else setInternalTool(computed);
    } else {
      if (onToolChange) onToolChange(next); else setInternalTool(next);
    }
  }
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [lasso, setLasso] = useState<Array<{ x: number; y: number }>>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Editing state
  const [isSaving, setIsSaving] = useState(false);
  const [walls, setWalls] = useState(getAllWallSegments());
  const [labels, setLabels] = useState<Array<{ x: number; y: number; text: string }>>([
    { x: 300, y: 750, text: 'HOST' },
    { x: 650, y: 680, text: 'BARTOP' },
  ]);
  // Editable tables state
  const [tables, setTables] = useState<TableSpec[]>(preset.tables);
  useEffect(() => { setTables(preset.tables); }, [preset.tables]);
  // Selection / dragging / resizing
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggingTable, setDraggingTable] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingTable, setResizingTable] = useState<{ id: string; originX: number; originY: number } | null>(null);
  // Label dragging
  const [dragLabelIdx, setDragLabelIdx] = useState<number | null>(null);
  const [labelOffset, setLabelOffset] = useState<{ x: number; y: number } | null>(null);
  const [selectedLabelIdx, setSelectedLabelIdx] = useState<number | null>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  // Multi-select and group transforms
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupDrag, setGroupDrag] = useState<null | { startX: number; startY: number; snapshot: Record<string, { x: number; y: number; w: number; h: number }> }>(null);
  const [groupResize, setGroupResize] = useState<null | { startBox: { left: number; top: number; width: number; height: number }; startX: number; startY: number; shiftKey?: boolean; altKey?: boolean; snapshot: Record<string, { x: number; y: number; w: number; h: number }> }>(null);
  // Marquee selection state
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  // Wall drawing
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallHover, setWallHover] = useState<{ x: number; y: number } | null>(null);
  const [selectedWallIdx, setSelectedWallIdx] = useState<number | null>(null);
  const [dragWallEnd, setDragWallEnd] = useState<null | { idx: number; which: 'start' | 'end'; offsetX: number; offsetY: number }>(null);

  const w = preset.width || 1200;
  const h = preset.height || 760;

  const tableMap = useMemo(() => new Map(tables.map(t => [t.id, t])), [tables]);

  function screenToSvg(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    const transformed = pt.matrixTransform((ctm as any).inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function addRegion() {
    const idx = regions.length;
    const r: Region = { id: `r${idx + 1}`, name: `Region ${idx + 1}`, color: defaultColors[idx % defaultColors.length], tableIds: [] };
    setRegions([...regions, r]);
    setActiveRegionId(r.id);
    setToolState('pointer');
  }
  function removeRegion() {
    if (regions.length <= 1) return;
    const last = regions[regions.length - 1];
    const rest = regions.slice(0, -1);
    // Unassign its tables (no overlap rule)
    setRegions(rest);
    if (activeRegionId === last.id) { setActiveRegionId(rest[rest.length - 1].id); setToolState('pointer'); }
  }

  function activateRegion(id: string) {
    setActiveRegionId(id);
    setToolState('pointer');
  }

  function assignTables(regionId: string, tableIds: string[]) {
    // Remove from other regions first (no overlap)
    const updated = regions.map(r => r.id === regionId
      ? { ...r, tableIds: Array.from(new Set([...(r.tableIds || []), ...tableIds])) }
      : { ...r, tableIds: (r.tableIds || []).filter(id => !tableIds.includes(id)) });
    setRegions(updated);
  }

  function toggleTable(regionId: string, tableId: string) {
    // Remove from all others, toggle in active
    setRegions(prev => prev.map(r => {
      if (r.id === regionId) {
        const has = r.tableIds.includes(tableId);
        return { ...r, tableIds: has ? r.tableIds.filter(id => id !== tableId) : [...r.tableIds, tableId] };
      }
      return { ...r, tableIds: r.tableIds.filter(id => id !== tableId) };
    }));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (tool === 'rect') {
      setDragStart(screenToSvg(e));
      setDragEnd(screenToSvg(e));
    } else if (tool === 'lasso') {
      const p = screenToSvg(e);
      setLasso([p]);
    } else if (tool === 'pointer') {
      // Start marquee select on canvas when clicking empty space
      const node = (e.target as any)?.nodeName?.toLowerCase?.();
      if (node === 'svg' || node === 'g') {
        const p = screenToSvg(e);
        setSelectedTableId(null);
        setSelectedIds(new Set());
        setMarqueeStart(p);
        setMarqueeEnd(p);
      }
    } else if (tool === 'wallDraw') {
      const p = screenToSvg(e);
      if (!wallStart) {
        setWallStart(p);
        setWallHover(p);
      } else {
        setWalls(prev => [...prev, { x1: wallStart.x, y1: wallStart.y, x2: p.x, y2: p.y, thickness: 6 }]);
        setWallStart(null); setWallHover(null);
      }
    } else if (tool === 'wallEdit' || tool === 'wallErase') {
      const p = screenToSvg(e);
      const hit = hitTestWall(p.x, p.y);
      if (hit) {
        setSelectedWallIdx(hit.idx);
        if (tool === 'wallErase') {
          setWalls(prev => prev.filter((_, i) => i !== hit.idx));
          setSelectedWallIdx(null);
        } else if (hit.which) {
          const wall = walls[hit.idx];
          const baseX = hit.which === 'start' ? wall.x1 : wall.x2;
          const baseY = hit.which === 'start' ? wall.y1 : wall.y2;
          setDragWallEnd({ idx: hit.idx, which: hit.which, offsetX: p.x - baseX, offsetY: p.y - baseY });
        }
      } else {
        setSelectedWallIdx(null);
      }
    } else if (tool === 'textAdd') {
      const p = screenToSvg(e);
      setLabels(prev => [...prev, { x: p.x, y: p.y, text: 'Label' }]);
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    const p = screenToSvg(e);
    if (tool === 'rect' && dragStart) setDragEnd(p);
    if (tool === 'lasso' && lasso.length) setLasso(q => [...q, p]);
    if (tool === 'wallDraw' && wallStart) {
      // Shift to lock angle to 0/45/90/135 degrees for cleaner walls
      if ((e as any).shiftKey) {
        const dx = p.x - wallStart.x;
        const dy = p.y - wallStart.y;
        const angle = Math.atan2(dy, dx); // radians
        const step = Math.PI / 4; // 45°
        const snapped = Math.round(angle / step) * step;
        const len = Math.hypot(dx, dy);
        const sx = wallStart.x + Math.cos(snapped) * len;
        const sy = wallStart.y + Math.sin(snapped) * len;
        setWallHover({ x: Math.max(0, Math.min(w, sx)), y: Math.max(0, Math.min(h, sy)) });
      } else {
        setWallHover(p);
      }
    }
    if (groupDrag) {
      const dx = p.x - groupDrag.startX;
      const dy = p.y - groupDrag.startY;
      setTables(prev => prev.map(t => {
        const s = groupDrag.snapshot[t.id];
        if (!s) return t;
        return { ...t, x: Math.max(0, s.x + dx), y: Math.max(0, s.y + dy) };
      }));
    }
    if (resizingTable) {
      setTables(prev => prev.map(t => t.id === resizingTable.id ? { ...t, w: Math.max(16, (p.x - resizingTable.originX)), h: Math.max(12, (p.y - resizingTable.originY)) } : t));
    }
    if (dragLabelIdx !== null && labelOffset) {
      setLabels(prev => prev.map((l, i) => i === dragLabelIdx ? { ...l, x: p.x - labelOffset.x, y: p.y - labelOffset.y } : l));
    }
    if (tool === 'wallEdit' && dragWallEnd) {
      setWalls(prev => prev.map((w, i) => {
        if (i !== dragWallEnd.idx) return w;
        const nx = p.x - dragWallEnd.offsetX;
        const ny = p.y - dragWallEnd.offsetY;
        return dragWallEnd.which === 'start' ? { ...w, x1: nx, y1: ny } : { ...w, x2: nx, y2: ny };
      }));
    }
    if (groupResize) {
      const bx = groupResize.startBox.left;
      const by = groupResize.startBox.top;
      const bw = Math.max(1, groupResize.startBox.width);
      const bh = Math.max(1, groupResize.startBox.height);
      const curW = Math.max(10, bw + (p.x - groupResize.startX));
      const curH = Math.max(10, bh + (p.y - groupResize.startY));
      const sx0 = curW / bw;
      const sy0 = curH / bh;
      const sUni = Math.max(sx0, sy0);
      const sx = groupResize.shiftKey ? sUni : sx0;
      const sy = groupResize.shiftKey ? sUni : sy0;
      const anchorX = groupResize.altKey ? bx + bw / 2 : bx;
      const anchorY = groupResize.altKey ? by + bh / 2 : by;
      setTables(prev => prev.map(t => {
        const s = groupResize.snapshot[t.id];
        if (!s) return t;
        const relX = s.x - anchorX;
        const relY = s.y - anchorY;
        const nx = anchorX + relX * sx;
        const ny = anchorY + relY * sy;
        const nw = Math.max(16, s.w * sx);
        const nh = Math.max(12, s.h * sy);
        return { ...t, x: nx, y: ny, w: nw, h: nh };
      }));
    }
  }
  function onPointerUp() {
    if (tool === 'rect' && dragStart && dragEnd) {
      const minx = Math.min(dragStart.x, dragEnd.x); const miny = Math.min(dragStart.y, dragEnd.y);
      const maxx = Math.max(dragStart.x, dragEnd.x); const maxy = Math.max(dragStart.y, dragEnd.y);
      const picked = tables.filter(t => inRect(centerOf(t), { x1: minx, y1: miny, x2: maxx, y2: maxy })).map(t => t.id);
      if (picked.length) assignTables(activeRegionId, picked);
    }
    if (tool === 'lasso' && lasso.length > 2) {
      const picked = tables.filter(t => pointInPolygon(centerOf(t), lasso)).map(t => t.id);
      if (picked.length) assignTables(activeRegionId, picked);
    }
    if (marqueeStart && marqueeEnd) {
      const minx = Math.max(0, Math.min(marqueeStart.x, marqueeEnd.x));
      const miny = Math.max(0, Math.min(marqueeStart.y, marqueeEnd.y));
      const maxx = Math.min(w, Math.max(marqueeStart.x, marqueeEnd.x));
      const maxy = Math.min(h, Math.max(marqueeStart.y, marqueeEnd.y));
      // Select tables whose rectangles intersect the marquee, not just centers
      const picked = tables.filter(t => {
        const tx1 = t.x || 0, ty1 = t.y || 0, tx2 = tx1 + (t.w || 0), ty2 = ty1 + (t.h || 0);
        return !(tx2 < minx || tx1 > maxx || ty2 < miny || ty1 > maxy);
      }).map(t => t.id);
      setSelectedIds(new Set(picked));
      setMarqueeStart(null); setMarqueeEnd(null);
    }
    setDragStart(null); setDragEnd(null); setLasso([]);
    setDraggingTable(null); setResizingTable(null); setDragLabelIdx(null); setLabelOffset(null);
    setDragWallEnd(null);
    setGroupDrag(null);
    setGroupResize(null);
  }

  function onTableClick(e: React.MouseEvent, t: TableSpec) {
    e.stopPropagation();
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    if (isShift) {
      const group = contiguousTables(t, tables);
      assignTables(activeRegionId, group.map(x => x.id));
      setToolState('pointer');
      return;
    }
    if (isCtrl) {
      toggleTable(activeRegionId, t.id);
      // also toggle visual selection without affecting domains when dragging
      setSelectedIds(prev => { const n = new Set(prev); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; });
      setSelectedTableId(t.id);
      setToolState('pointer');
      return;
    }
    assignTables(activeRegionId, [t.id]);
    setSelectedTableId(t.id);
    setSelectedIds(new Set([t.id]));
    setToolState('pointer');
  }

  const regionByTable = useMemo(() => {
    const map = new Map<string, Region>();
    for (const r of regions) for (const id of r.tableIds) map.set(id, r);
    return map;
  }, [regions]);

  function centerOf(t: TableSpec) { return { x: (t.x || 0) + (t.w || 40) / 2, y: (t.y || 0) + (t.h || 32) / 2 }; }

  // Remove OCR flow; map is fully manual/dynamic now

  // Load most recent saved layout for tables/walls/labels immediately
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hostpro/scan-layout');
        const js = await res.json();
        if (js?.success && js?.data) {
          const saved = js.data as { width?: number; height?: number; tables?: Array<{ id: string; x: number; y: number; w: number; h: number; type?: string }>; walls?: any[]; labels?: any[] };
          if (Array.isArray(saved.tables) && saved.tables.length) {
            const map = new Map(saved.tables.map((t: any) => [String(t.id), t]));
            setTables(prev => prev.map(t => {
              const s = map.get(String(t.id));
              return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: (s.type as any) || t.type } : t;
            }));
          }
          if (Array.isArray(saved.walls)) setWalls(saved.walls as any);
          if (Array.isArray(saved.labels)) setLabels(saved.labels as any);
        }
      } catch {}
    })();
  }, []);

  // Sync current regions to localStorage so Assign panel can reflect live domains
  useEffect(() => {
    try { if (typeof window !== 'undefined') localStorage.setItem('hostpro:regions', JSON.stringify(regions)); } catch {}
  }, [regions]);

  // Load last saved layout (tables/walls/labels) and merge into current preset
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hostpro/scan-layout');
        const js = await res.json();
        if (js?.success && js?.data) {
          const saved = js.data as { tables?: Array<{ id: string; x: number; y: number; w: number; h: number; type?: string }>; walls?: any[]; labels?: any[] };
          if (Array.isArray(saved.tables) && saved.tables.length) {
            const map = new Map(saved.tables.map((t: any) => [String(t.id), t]));
            setTables(prev => prev.map(t => {
              const s = map.get(String(t.id));
              return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: (s.type as any) || t.type } : t;
            }));
          }
          if (Array.isArray(saved.walls)) setWalls(saved.walls as any);
          if (Array.isArray(saved.labels)) setLabels(saved.labels as any);
        }
      } catch {}
    })();
  }, []);

  // Save layout (tables + walls + regions as domains)
  async function saveLayout() {
    setIsSaving(true);
    try {
      await fetch('/api/hostpro/scan-layout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: 'default', width: w, height: h, tables, walls, labels }) });
      // Reload just to be sure we reflect the latest persisted layout on next open
      try {
        const res = await fetch('/api/hostpro/scan-layout');
        const js = await res.json();
        if (js?.success && js?.data?.tables) {
          const map = new Map((js.data.tables as any[]).map((t: any) => [String(t.id), t]));
          setTables(prev => prev.map(t => {
            const s = map.get(String(t.id));
            return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: (s.type as any) || t.type } : t;
          }));
        }
        if (js?.success && Array.isArray(js?.data?.walls)) setWalls(js.data.walls as any);
        if (js?.success && Array.isArray(js?.data?.labels)) setLabels(js.data.labels as any);
      } catch {}
    } finally {
      setIsSaving(false);
    }
  }

  function resetDomain(domainId: string) {
    setRegions(prev => prev.map(r => r.id === domainId ? { ...r, tableIds: [] } : r));
  }

  function resetAllDomains() {
    setRegions(prev => prev.map(r => ({ ...r, tableIds: [] })));
  }

  function dist(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function hitTestWall(px: number, py: number): null | { idx: number; which?: 'start' | 'end' } {
    const pt = { x: px, y: py };
    const EP = 10; // endpoint radius
    const LINE_EPS = 6; // line picking width
    for (let i = walls.length - 1; i >= 0; i--) {
      const w = walls[i];
      const s = { x: w.x1, y: w.y1 }; const e = { x: w.x2, y: w.y2 };
      if (dist(pt, s) <= EP) return { idx: i, which: 'start' };
      if (dist(pt, e) <= EP) return { idx: i, which: 'end' };
      // distance from point to segment
      const d = distanceToSegment(px, py, w.x1, w.y1, w.x2, w.y2);
      if (d <= LINE_EPS) return { idx: i };
    }
    return null;
  }
  function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const A = px - x1; const B = py - y1; const C = x2 - x1; const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D || 1e-6;
    let t = dot / lenSq; t = Math.max(0, Math.min(1, t));
    const nx = x1 + t * C; const ny = y1 + t * D;
    return Math.hypot(px - nx, py - ny);
  }

  // Toggle helper: clicking the active tool again returns to pointer
  function toggleTool(next: Tool) { setToolState(prev => (prev === next ? 'pointer' : next)); }

  // Clear transient states when switching tools
  useEffect(() => {
    setDragStart(null); setDragEnd(null); setLasso([]);
    setWallStart(null); setWallHover(null); setDragWallEnd(null); setSelectedWallIdx(null);
    setDraggingTable(null); setResizingTable(null); setDragLabelIdx(null); setLabelOffset(null);
    setMarqueeStart(null); setMarqueeEnd(null);
  }, [tool]);

  // Keyboard shortcuts: Esc cancels wall drawing and marquee; Delete removes selected label/wall
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setWallStart(null); setWallHover(null); setDragWallEnd(null);
        setMarqueeStart(null); setMarqueeEnd(null); setDragStart(null); setDragEnd(null); setLasso([]);
        setToolState('pointer');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLabelIdx !== null) {
          setLabels(prev => prev.filter((_, idx) => idx !== selectedLabelIdx));
          setSelectedLabelIdx(null);
        } else if (selectedWallIdx !== null) {
          setWalls(prev => prev.filter((_, idx) => idx !== selectedWallIdx));
          setSelectedWallIdx(null);
        }
      }
    }
    window.addEventListener('keydown', onKey as any);
    return () => window.removeEventListener('keydown', onKey as any);
  }, [selectedLabelIdx, selectedWallIdx]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      {/* Sidebar */}
      <Card className="p-3 border bg-card">
        {/* Builder actions */}
        <div className="mb-4 border-b border-white/10 pb-3">
          <div className="font-semibold mb-2">Map Builder</div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveLayout} disabled={isSaving}><Save className="h-3 w-3 mr-1" />{isSaving ? 'Saving...' : 'Save Layout'}</Button>
            <Button size="sm" variant="outline" onClick={() => setLabels(l => [...l, { x: w/2, y: h/2, text: 'Label' }])}><Plus className="h-3 w-3 mr-1" />Add Label</Button>
          </div>
          {/* Layout selector - responsive & contained */}
          <div className="mt-2">
          <LayoutSelector onLoad={async (slug) => {
            try {
              const res = await fetch(`/api/hostpro/scan-layout?slug=${encodeURIComponent(slug)}`);
              const js = await res.json();
              if (js?.success && js?.data) {
                const d = js.data;
                if (Array.isArray(d.tables)) setTables(prev => prev.map(t => {
                  const s = d.tables.find((x: any) => String(x.id) === String(t.id));
                  return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: (s.type as any) || t.type } : t;
                }));
                if (Array.isArray(d.walls)) setWalls(d.walls as any);
                if (Array.isArray(d.labels)) setLabels(d.labels as any);
                try { if (typeof window !== 'undefined') localStorage.setItem('hostpro:domainsPresetName', String(d.slug || '')); } catch {}
              }
            } catch {}
          }} onDelete={async (slug) => {
            try {
              await fetch(`/api/hostpro/scan-layout?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
            } catch {}
          }} onNew={async () => {
            const now = new Date();
            const slug = `layout-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
            try {
              await fetch('/api/hostpro/scan-layout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, width: w, height: h, tables, walls, labels }) });
            } catch {}
          }} />
          </div>
          <DomainPresetControls regions={regions} onApply={(preset) => { setRegions(preset.regions as any); setActiveRegionId(((preset.regions || [])[0]?.id as any) || ''); }} />
          <div className="text-xs text-muted-foreground mt-2">Drag, resize, and assign domains. Save persists to DB.</div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Regions</div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={removeRegion}>−</Button>
            <Button size="sm" onClick={addRegion}>＋</Button>
            <Button size="sm" variant="ghost" onClick={resetAllDomains} title="Clear all">Clear</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-auto" style={{ maxHeight: 200 }}>
          {regions.map(r => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => activateRegion(r.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') activateRegion(r.id); }}
              className={`w-full rounded-lg border px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeRegionId===r.id?'bg-primary/10 border-primary':'bg-background/60'}`}
            >
              <span className="inline-block size-3 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="font-medium text-sm">{r.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{r.tableIds.length} tables</span>
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); resetDomain(r.id); }} title="Reset domain"><Eraser className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
        {!hideToolSections && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Domains / Selection</div>
          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <Button className="w-full" size="sm" variant={tool==='pointer'?'default':'outline'} onClick={() => toggleTool('pointer')}><MousePointer2 className="h-3 w-3 mr-1" />Select</Button>
            <Button className="w-full" size="sm" variant={tool==='rect'?'default':'outline'} onClick={() => toggleTool('rect')}><BoxSelect className="h-3 w-3 mr-1" />Box</Button>
            <Button className="w-full" size="sm" variant={tool==='lasso'?'default':'outline'} onClick={() => toggleTool('lasso')}><LassoSelect className="h-3 w-3 mr-1" />Lasso</Button>
          </div>
          <div className="font-semibold mb-2">Walls</div>
          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <Button className="w-full" size="sm" variant={tool==='wallDraw'?'default':'outline'} onClick={() => toggleTool('wallDraw')}><Ruler className="h-3 w-3 mr-1" />Draw</Button>
            <Button className="w-full" size="sm" variant={tool==='wallEdit'?'default':'outline'} onClick={() => toggleTool('wallEdit')}><Move className="h-3 w-3 mr-1" />Edit</Button>
            <Button className="w-full" size="sm" variant={tool==='wallErase'?'default':'outline'} onClick={() => toggleTool('wallErase')}><Eraser className="h-3 w-3 mr-1" />Erase</Button>
          </div>
          <div className="font-semibold mb-2">Text</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <Button className="w-full" size="sm" variant={tool==='textAdd'?'default':'outline'} onClick={() => toggleTool('textAdd')}><Type className="h-3 w-3 mr-1" />Add</Button>
            <Button className="w-full" size="sm" variant={tool==='textMove'?'default':'outline'} onClick={() => toggleTool('textMove')}><Move className="h-3 w-3 mr-1" />Move</Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <div>Shift: contiguous group</div>
            <div>Ctrl/Cmd: toggle table</div>
          </div>
        </div>
        )}
      </Card>

      {/* Canvas */}
      <div className="relative rounded-2xl border bg-card p-2">
        <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} width="100%" height={Math.min(620,h)} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          {/* Precise wall mapping from reference image */}
          <g stroke="#1f2937" fill="none">
            {walls.map((wall, idx) => (
              <g key={idx}>
                <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} strokeWidth={wall.thickness || 6} stroke={selectedWallIdx===idx?'#0ea5e9':'#1f2937'} />
                {selectedWallIdx===idx && (
                  <>
                    <circle cx={wall.x1} cy={wall.y1} r={6} fill="#0ea5e9" />
                    <circle cx={wall.x2} cy={wall.y2} r={6} fill="#0ea5e9" />
                  </>
                )}
              </g>
            ))}
            {wallStart && wallHover && (
              <line x1={wallStart.x} y1={wallStart.y} x2={wallHover.x} y2={wallHover.y} stroke="#94a3b8" strokeDasharray="6 4" strokeWidth={4} />
            )}
            {/* Labels */}
            {labels.map((l, i) => (
              <g key={i}>
                <text x={l.x} y={l.y} fontSize={(l as any).size || 12} textAnchor="middle" fill="#94a3b8"
                  onPointerDown={(e) => {
                    if (tool !== 'textMove') return;
                    e.stopPropagation();
                    setSelectedLabelIdx(i);
                    const p = screenToSvg(e as any);
                    setDragLabelIdx(i);
                    setLabelOffset({ x: p.x - l.x, y: p.y - l.y });
                  }}
                  onDoubleClick={(e) => { e.stopPropagation(); setSelectedLabelIdx(i); setLabelDraft(l.text); setIsLabelDialogOpen(true); }}
                >{l.text}</text>
                {selectedLabelIdx===i && tool==='textMove' && (
                  <g onPointerDown={(e) => { e.stopPropagation(); setLabels(prev => prev.filter((_, idx) => idx !== i)); setSelectedLabelIdx(null); }}>
                    <circle cx={l.x + 18} cy={l.y - 12} r={7} fill="#0f172a" stroke="#ef4444" />
                    <text x={l.x + 18} y={l.y - 9} fontSize="10" textAnchor="middle" fill="#ef4444">×</text>
                  </g>
                )}
              </g>
            ))}
          </g>
          {tables.map(t => {
            const fillRegion = regionByTable.get(t.id);
            // Glassmorphism with domain tint for designer preview
            const tint = showRegionColors && fillRegion ? (fillRegion.color as string) : undefined;
            const glassFill = 'rgba(255,255,255,0.42)';
            const stroke = tint ? tint : '#0f172a';
            const tintAlpha = (hex?: string) => hex ? `${hex}66` : undefined;
            function hexToRgb(hex?: string) {
              if (!hex) return null as any; const v = hex.replace('#','');
              const f = v.length===3? v.split('').map(c=>c+c).join('') : v; const n=parseInt(f,16);
              return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
            }
            function rgbToHsl(r:number,g:number,b:number){ r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b); let h=0,s=0,l=(mx+mn)/2; if(mx!==mn){const d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn); switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;} h/=6;} return {h:h*360,s:s*100,l:l*100}; }
            function hslToHex(h:number,s:number,l:number){ s/=100; l/=100; const k=(n:number)=>(n+h/30)%12; const a=s*Math.min(l,1-l); const f=(n:number)=> l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1))); const toHex=(x:number)=> Math.round(255*x).toString(16).padStart(2,'0'); return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`; }
            function labelColor(hex?: string){ if(!hex) return '#0b1220'; const rgb=hexToRgb(hex); if(!rgb) return '#0b1220'; const {h,s,l}=rgbToHsl(rgb.r,rgb.g,rgb.b); if(isDarkTheme){ return hslToHex(h, Math.min(95, s+12), Math.min(88, l+30)); } else { return hslToHex(h, Math.min(96, s+10), Math.max(28, l-20)); } }
            const textColor = labelColor(tint);
            const common = { onClick: (e: any) => onTableClick(e, t), onPointerDown: (e: any) => {
              if (tool !== 'pointer') return;
              const p = screenToSvg(e);
              // selection management
              if (e.ctrlKey || (e as any).metaKey) {
                setSelectedIds(prev => { const n = new Set(prev); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; });
              } else {
                setSelectedIds(prev => (prev.size ? prev : new Set([t.id])));
              }
              setSelectedTableId(t.id);
              const sel = new Set(selectedIds.size ? Array.from(selectedIds) : [t.id]);
              const snap: Record<string, { x: number; y: number; w: number; h: number }> = {};
              for (const it of tables) if (sel.has(it.id)) snap[it.id] = { x: it.x || 0, y: it.y || 0, w: it.w || 0, h: it.h || 0 };
              setGroupDrag({ startX: p.x, startY: p.y, snapshot: snap });
            } } as any;
            // Shape drawing
            const rx = t.w || 48; const ry = t.h || 32; const x = t.x || 0; const y = t.y || 0;
            if (t.type === 'barSeat') {
              return (
                <g key={t.id} transform={`translate(${x},${y})`} className="cursor-pointer" {...common}>
                  <rect width={30} height={20} rx={8} ry={8} fill={glassFill} stroke={stroke} style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }} />
                  {tint && (<rect width={30} height={20} rx={8} ry={8} fill={tintAlpha(tint)} />)}
                  <text x={15} y={14} fontSize={10} textAnchor="middle" fill={textColor}>{t.id}</text>
                  {selectedIds.size<=1 && selectedTableId===t.id && tool==='pointer' && (
                    <rect x={rx-6} y={ry-6} width={12} height={12} fill="#0ea5e9" stroke="#0c4a6e" onPointerDown={(e) => { e.stopPropagation(); const p = screenToSvg(e as any); setResizingTable({ id: t.id, originX: x, originY: y }); }} />
                  )}
                </g>
              );
            }
            if (['24','34'].includes(t.id)) {
              const r = Math.min(rx, ry) / 2;
              return (
                <g key={t.id} transform={`translate(${x},${y})`} className="cursor-pointer" {...common}>
                  <circle cx={r} cy={r} r={r} fill={glassFill} stroke={stroke} style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }} />
                  {tint && (<circle cx={r} cy={r} r={r} fill={tintAlpha(tint)} />)}
                  <text x={r} y={r+4} fontSize={12} textAnchor="middle" fill={textColor}>{t.id}</text>
                  {selectedIds.size<=1 && selectedTableId===t.id && tool==='pointer' && (
                    <rect x={rx-6} y={ry-6} width={12} height={12} fill="#0ea5e9" stroke="#0c4a6e" onPointerDown={(e) => { e.stopPropagation(); setResizingTable({ id: t.id, originX: x, originY: y }); }} />
                  )}
                </g>
              );
            }
            if (['51','52','53','61','62','63'].includes(t.id)) {
              const cx = x + rx/2; const cy = y + ry/2; const half = Math.min(rx, ry)/2;
              const points = `${cx},${cy-half} ${cx+half},${cy} ${cx},${cy+half} ${cx-half},${cy}`;
              return (
                <g key={t.id} className="cursor-pointer" {...common}>
                  <polygon points={points} fill={glassFill} stroke={stroke} style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }} />
                  {tint && (<polygon points={points} fill={tintAlpha(tint)} />)}
                  <text x={cx} y={cy+4} fontSize={12} textAnchor="middle" fill={textColor}>{t.id}</text>
                  {selectedIds.size<=1 && selectedTableId===t.id && tool==='pointer' && (
                    <rect x={rx-6} y={ry-6} width={12} height={12} fill="#0ea5e9" stroke="#0c4a6e" onPointerDown={(e) => { e.stopPropagation(); setResizingTable({ id: t.id, originX: x, originY: y }); }} />
                  )}
                </g>
              );
            }
            return (
              <g key={t.id} transform={`translate(${x},${y})`} className="cursor-pointer" {...common}>
                <rect width={rx} height={ry} rx={10} ry={10} fill={glassFill} stroke={stroke} style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))' }} />
                {tint && (<rect width={rx} height={ry} rx={10} ry={10} fill={tintAlpha(tint)} />)}
                <text x={rx/2} y={ry/2+4} fontSize={12} textAnchor="middle" fill={textColor}>{t.id}</text>
                {selectedIds.size<=1 && selectedTableId===t.id && tool==='pointer' && (
                  <rect x={rx-6} y={ry-6} width={12} height={12} fill="#0ea5e9" stroke="#0c4a6e" onPointerDown={(e) => { e.stopPropagation(); setResizingTable({ id: t.id, originX: x, originY: y }); }} />
                )}
              </g>
            );
          })}

          {/* Rectangle drag preview */}
          {dragStart && dragEnd && tool==='rect' && (
            <rect x={Math.min(dragStart.x, dragEnd.x)} y={Math.min(dragStart.y, dragEnd.y)} width={Math.abs(dragEnd.x-dragStart.x)} height={Math.abs(dragEnd.y-dragStart.y)} fill="#3b82f633" stroke="#3b82f6" strokeDasharray="6 4" />
          )}
          {/* Lasso preview */}
          {lasso.length>1 && (
            <polyline points={lasso.map(p=>`${p.x},${p.y}`).join(' ')} fill="#3b82f633" stroke="#3b82f6" strokeDasharray="6 4" />
          )}
        </svg>
      </div>
      {/* Marquee preview (touch-friendly thick border) */}
      {marqueeStart && marqueeEnd && (() => {
        const left = Math.max(0, Math.min(marqueeStart.x, marqueeEnd.x));
        const top = Math.max(0, Math.min(marqueeStart.y, marqueeEnd.y));
        const right = Math.min(w, Math.max(marqueeStart.x, marqueeEnd.x));
        const bottom = Math.min(h, Math.max(marqueeStart.y, marqueeEnd.y));
        return (
          <div
            style={{
              position: 'absolute',
              left, top,
              width: Math.max(0, right-left),
              height: Math.max(0, bottom-top),
              pointerEvents: 'none',
              border: '2px dashed rgba(56,189,248,0.9)',
              borderRadius: '8px',
              boxShadow: '0 0 0 2px rgba(56,189,248,0.3) inset',
            }}
          />
        );
      })()}
      {/* Group selection overlay and resize handle */}
      {tool==='pointer' && selectedIds.size>1 && (() => {
        const sel = tables.filter(t => selectedIds.has(t.id));
        if (!sel.length) return null;
        const left = Math.min(...sel.map(t => (t.x||0)));
        const top = Math.min(...sel.map(t => (t.y||0)));
        const right = Math.max(...sel.map(t => (t.x||0)+(t.w||0)));
        const bottom = Math.max(...sel.map(t => (t.y||0)+(t.h||0)));
        const width = right-left; const height = bottom-top;
        return (
          <svg viewBox={`0 0 ${w} ${h}`} width="0" height="0" style={{ position:'absolute', inset:0 }}>
            <g>
              <rect x={left} y={top} width={width} height={height} fill="none" stroke="#0ea5e9" strokeDasharray="6 4" />
              <rect x={left+width-10} y={top+height-10} width={12} height={12} fill="#0ea5e9" stroke="#0c4a6e"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const snapshot: Record<string,{x:number;y:number;w:number;h:number}> = {};
                  for (const it of tables) if (selectedIds.has(it.id)) snapshot[it.id] = { x: it.x||0, y: it.y||0, w: it.w||0, h: it.h||0 };
                  setGroupResize({ startBox: { left, top, width, height }, startX: left+width, startY: top+height, shiftKey: (e as any).shiftKey, altKey: (e as any).altKey, snapshot });
                }} />
            </g>
          </svg>
        );
      })()}
      {/* Label edit modal */}
      <Dialog open={isLabelDialogOpen} onOpenChange={(o)=>{ setIsLabelDialogOpen(o); if(!o) { setSelectedLabelIdx(null); } }}>
        <DialogContent className="backdrop-blur-xl bg-white/10 dark:bg-slate-900/30 border-white/20">
          <DialogHeader>
            <DialogTitle>Edit Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Enter text" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Size</span>
              <input type="range" min={8} max={28} step={1} value={selectedLabelIdx!==null ? ((labels[selectedLabelIdx] as any).size || 12) : 12}
                onChange={(e)=>{ const v = Number(e.target.value||12); if(selectedLabelIdx!==null) setLabels(prev => prev.map((ll, idx) => idx===selectedLabelIdx ? { ...ll, size: v } as any : ll)); }} className="flex-1" />
              <span className="text-xs w-6 text-right">{selectedLabelIdx!==null ? ((labels[selectedLabelIdx] as any).size || 12) : 12}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsLabelDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { if (selectedLabelIdx!==null) setLabels(prev => prev.map((ll, idx) => idx===selectedLabelIdx ? { ...(ll as any), text: labelDraft } : ll)); setIsLabelDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function inRect(pt: { x: number; y: number }, r: { x1: number; y1: number; x2: number; y2: number }) {
  return pt.x >= r.x1 && pt.x <= r.x2 && pt.y >= r.y1 && pt.y <= r.y2;
}

function pointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-6) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function contiguousTables(seed: TableSpec, all: TableSpec[]): TableSpec[] {
  const threshold = 70; // px center-to-center proximity
  const centers = new Map(all.map(t => [t.id, { x: (t.x||0)+(t.w||40)/2, y: (t.y||0)+(t.h||32)/2 }]));
  const adj = new Map<string, string[]>();
  for (const a of all) {
    const ca = centers.get(a.id)!;
    const neighbors: string[] = [];
    for (const b of all) if (a !== b) {
      const cb = centers.get(b.id)!;
      const dist = Math.hypot(ca.x - cb.x, ca.y - cb.y);
      if (dist <= threshold) neighbors.push(b.id);
    }
    adj.set(a.id, neighbors);
  }
  const res: string[] = [];
  const seen = new Set<string>();
  const stack = [seed.id];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id); res.push(id);
    for (const n of (adj.get(id) || [])) if (!seen.has(n)) stack.push(n);
  }
  return all.filter(t => res.includes(t.id));
}


function DomainPresetControls({ regions, onApply }: { regions: any[]; onApply: (p: { name: string; regions: any[] }) => void }) {
  const [name, setName] = React.useState('');
  const [list, setList] = React.useState<Array<{ _id: string; name: string; regions: any[] }>>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    try {
      const r = await fetch('/api/hostpro/domain-presets');
      const j = await r.json();
      if (j?.success) setList(j.data || []);
    } catch {}
  }
  React.useEffect(() => { load(); }, []);

  async function save() {
    setLoading(true);
    try {
      await fetch('/api/hostpro/domain-presets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || `Preset ${new Date().toLocaleTimeString()}`, regions }) });
      setName('');
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preset name" className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
      <Button className="w-full" size="sm" variant="outline" onClick={save} disabled={loading}>Save Domains</Button>
      <select className="w-full rounded-md border bg-background px-2 py-1 text-xs" onChange={(e) => {
        const v = e.target.value;
        if (v === '__new__') {
          setName('');
          onApply({ name: '', regions: [] });
          return;
        }
        const sel = list.find(x => x._id === v);
        if (sel) onApply(sel as any);
      }}>
        <option value="">Load preset…</option>
        <option value="__new__">+ New preset…</option>
        {list.map(x => <option key={x._id} value={x._id}>{x.name}</option>)}
      </select>
    </div>
  );
}

function LayoutSelector({ onLoad, onDelete, onNew }: { onLoad: (slug: string) => void; onDelete: (slug: string) => void; onNew: () => void }) {
  const [list, setList] = React.useState<Array<{ slug: string; updatedAt?: string }>>([]);
  const [sel, setSel] = React.useState<string>('');

  async function refresh() {
    try {
      const res = await fetch('/api/hostpro/scan-layout?all=1');
      const js = await res.json();
      if (js?.success) {
        // Include the most recent layout as the first option (Default)
        const arr = (js.data || []).map((x: any) => ({ slug: x.slug, updatedAt: x.updatedAt })) as Array<{ slug: string; updatedAt?: string }>;
        setList(arr);
        if (arr.length && !sel) setSel(arr[0].slug);
      }
    } catch {}
  }
  React.useEffect(() => { refresh(); }, []);

  return (
    <div className="flex flex-col gap-2">
      <select className="w-full rounded-md border bg-background px-2 py-1 text-sm" value={sel || (list[0]?.slug || '')} onChange={(e) => { setSel(e.target.value); if (e.target.value) onLoad(e.target.value); }}>
        {list.map((l, idx) => {
          const label = idx === 0 ? 'Default' : (l.updatedAt ? new Date(l.updatedAt).toLocaleString() : l.slug);
          return <option key={l.slug} value={l.slug}>{label}</option>;
        })}
      </select>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
        <Button size="sm" variant="ghost" onClick={onNew}>New</Button>
        <Button size="sm" variant="destructive" onClick={() => sel && onDelete(sel)} disabled={sel===list[0]?.slug}>Delete</Button>
      </div>
    </div>
  );
}
