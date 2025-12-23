"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { FloorPreset } from '@/lib/host/types';
import { getAllWallSegments } from '@/lib/host/floor-mapper';

type TableState = Record<string, boolean>; // occupied map

export default function FloorMap({
  preset,
  occupied = {},
  highlightDomains = [] as string[],
  onPick,
  showDomains = true,
  assignments,
  servers,
  walls,
  labels,
  manualMode = false,
  onManualPick,
  flashTableId,
  quickSeatMode,
  selectedQuickSeatTable,
  onQuickSeatPick,
}: {
  preset: FloorPreset;
  occupied?: TableState;
  highlightDomains?: string[]; // domain ids to emphasize
  onPick?: (tableId: string) => void;
  showDomains?: boolean;
  assignments?: Array<{ serverId: string; domainIds: string[] }>;
  servers?: Array<{ id: string; name: string }>;
  walls?: Array<{ x1: number; y1: number; x2: number; y2: number; thickness?: number }>;
  labels?: Array<{ x: number; y: number; text: string; size?: number }>;
  manualMode?: boolean;
  onManualPick?: (tableId: string) => void;
  flashTableId?: string;
  quickSeatMode?: boolean;
  selectedQuickSeatTable?: string | null;
  onQuickSeatPick?: (tableId: string) => void;
}) {
  const w = preset.width || 1200;
  const h = preset.height || 760;
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const [ordersByTable, setOrdersByTable] = React.useState<Record<string, { serverName?: string; checks: number; total?: number }>>({});
  const domainOfTable = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    for (const d of preset.domains) {
      for (const tid of d.tableIds) map.set(tid, { id: d.id, name: d.name, color: d.color });
    }
    return map;
  }, [preset]);

  // Map domain -> assigned server name
  const assignedServerByDomain = React.useMemo(() => {
    const map = new Map<string, string>();
    if (assignments && servers) {
      for (const a of assignments) {
        const nm = servers.find(s => String(s.id) === String(a.serverId))?.name;
        if (nm) for (const d of (a.domainIds || [])) map.set(d, nm);
      }
    }
    return map;
  }, [assignments, servers]);

  // Fetch open orders periodically and map to table externalId if present
  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const end = now.toISOString();
        const res = await fetch(`/api/toast/orders?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
        const js = await res.json();
        if (!js?.success) return;
        const byTable: Record<string, { serverName?: string; checks: number; total?: number }> = {};
        for (const o of (js.data || [])) {
          const tableId = o?.table?.externalId || '';
          if (!tableId) continue;
          if (!byTable[tableId]) byTable[tableId] = { serverName: o?.server?.externalId || undefined, checks: 0, total: 0 } as any;
          byTable[tableId].checks += (Array.isArray(o.checks) ? o.checks.length : 1);
          byTable[tableId].total = (byTable[tableId].total || 0) + (o.totalAmount || o.amount || 0);
        }
        if (active) setOrdersByTable(byTable);
      } catch {}
    }
    load();
    const t = setInterval(load, 15000);
    return () => { active = false; clearInterval(t); };
  }, []);

  // Helper retained for clarity but not used in template titles directly
  const getAssignedServerName = React.useCallback((tableId: string) => {
    const dom = domainOfTable.get(tableId);
    if (!dom) return undefined;
    return assignedServerByDomain.get(dom.id);
  }, [domainOfTable, assignedServerByDomain]);

  const tableNodes = preset.tables.map((t, idx) => {
    const x = t.x ?? (80 + (idx % 10) * 100);
    const y = t.y ?? (120 + Math.floor(idx / 10) * 90);
    const wRect = t.w ?? 48;
    const hRect = t.h ?? (t.type === 'barSeat' ? 22 : 32);
    const dom = domainOfTable.get(t.id);
    const isHighlighted = highlightDomains.length === 0 || (dom && highlightDomains.includes(dom.id));
    const tint = showDomains && dom ? dom.color : undefined;
    const isFlash = flashTableId === t.id;
    const isQuickSeatSelected = quickSeatMode && selectedQuickSeatTable === t.id;
    const stroke = (occupied[t.id] || isFlash) ? '#ef4444' : (isQuickSeatSelected ? '#22c55e' : 'rgba(15,23,42,0.35)');
    const dashed = {};
    const isClickable = quickSeatMode ? !occupied[t.id] : manualMode;
    const glassFill = 'rgba(255,255,255,0.42)';
    function hexToRgb(hex?: string): { r: number; g: number; b: number } | null {
      if (!hex) return null;
      const v = hex.replace('#','');
      const full = v.length === 3 ? v.split('').map(c=>c+c).join('') : v;
      const num = parseInt(full, 16);
      const r = (num >> 16) & 255; const g = (num >> 8) & 255; const b = num & 255; return { r, g, b };
    }
    function rgbToHsl(r: number, g: number, b: number): {h: number; s: number; l: number} {
      r/=255; g/=255; b/=255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      let h=0, s=0, l=(max+min)/2;
      if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){ case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; default: h=(r-g)/d+4; }
        h/=6;
      }
      return { h: h*360, s: s*100, l: l*100 };
    }
    function hslToHex(h: number, s: number, l: number): string {
      s/=100; l/=100; const k=(n: number)=> (n + h/30)%12;
      const a=s*Math.min(l,1-l); const f=(n:number)=> l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)));
      const toHex=(x:number)=> Math.round(255*x).toString(16).padStart(2,'0');
      return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
    }
    function getLabelColorFromTint(hex?: string): string {
      if (!hex) return '#0b1220';
      const rgb = hexToRgb(hex); if (!rgb) return '#0b1220';
      const {h,s,l} = rgbToHsl(rgb.r, rgb.g, rgb.b);
      if (isDarkTheme) {
        // Dark mode: lighter variant of the tint so it pops on dark background
        const ll = Math.min(88, l + 30);
        const ss = Math.min(95, s + 12);
        return hslToHex(h, ss, ll);
      } else {
        // Light mode: bolder/darker variant of the tint
        const ll = Math.max(28, l - 20);
        const ss = Math.min(96, s + 10);
        return hslToHex(h, ss, ll);
      }
    }
    // Use CSS variable for instant theme switch without recompute
    const textColor = getLabelColorFromTint(tint);
    const tintAlpha = (hex?: string) => hex ? `${hex}66` : undefined; // ~40%
    const common = {
      onClick: () => {
        if (quickSeatMode && !occupied[t.id]) {
          onQuickSeatPick?.(t.id);
        } else if (manualMode) {
          onManualPick?.(t.id);
        } else {
          onPick?.(t.id);
        }
      },
      style: { cursor: isClickable ? 'pointer' : 'default' }
    } as any;
    const orderInfo = ordersByTable[t.id];
    const domInfo = domainOfTable.get(t.id);
    const assignedName = domInfo ? assignedServerByDomain.get(domInfo.id) : undefined;
    const serverMatch = orderInfo?.serverName && assignedName && (String(orderInfo.serverName).toLowerCase() === String(assignedName).toLowerCase()) ? ' ✓' : '';

    // Render by shape type to match reference floor plan
    if (t.type === 'barSeat') {
      return (
        <g key={t.id} transform={`translate(${x}, ${y})`} className="cursor-pointer" {...common}>
          <rect width={30} height={20} rx={8} ry={8} fill={glassFill} stroke={stroke} strokeWidth={(occupied[t.id] || isFlash) ? 4 : (isQuickSeatSelected ? 3 : 1.5)} className={isFlash ? 'table-flash-stroke' : ''} style={{ backdropFilter: 'blur(8px)' as any, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }} />
          {tint && (<rect width={30} height={20} rx={8} ry={8} fill={tintAlpha(tint)} />)}
          <title>{`Table ${t.id}${serverMatch}\nChecks: ${orderInfo?.checks ?? 0}${orderInfo?.total ? `\nTotal: $${(orderInfo.total/100).toFixed(2)}` : ''}`}</title>
          <text x={15} y={14} fontSize={10} textAnchor="middle" fill={textColor} style={{ userSelect: 'none' }}>{t.id}</text>
        </g>
      );
    }

    // Circles (24, 34) in the map
    if (['24','34'].includes(t.id)) {
      const r = Math.min(wRect, hRect) / 2;
      return (
        <g key={t.id} transform={`translate(${x}, ${y})`} className="cursor-pointer" {...common}>
          <circle cx={r} cy={r} r={r} fill={glassFill} stroke={stroke} strokeWidth={(occupied[t.id] || isFlash) ? 4 : (isQuickSeatSelected ? 3 : 1.5)} className={isFlash ? 'table-flash-stroke' : ''} style={{ backdropFilter: 'blur(8px)' as any, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }} />
          {tint && (<circle cx={r} cy={r} r={r} fill={tintAlpha(tint)} />)}
          <title>{`Table ${t.id}${serverMatch}\nChecks: ${orderInfo?.checks ?? 0}${orderInfo?.total ? `\nTotal: $${(orderInfo.total/100).toFixed(2)}` : ''}`}</title>
          <text x={r} y={r + 4} fontSize={12} textAnchor="middle" fill={textColor} style={{ userSelect: 'none' }}>{t.id}</text>
        </g>
      );
    }

    // Diamonds (51,52,53,61,62,63)
    if (['51','52','53','61','62','63'].includes(t.id)) {
      const cx = x + wRect / 2; const cy = y + hRect / 2; const half = Math.min(wRect, hRect) / 2;
      const points = `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;
      return (
        <g key={t.id} className="cursor-pointer" {...common}>
          <polygon points={points} fill={glassFill} stroke={stroke} strokeWidth={(occupied[t.id] || isFlash) ? 4 : (isQuickSeatSelected ? 3 : 1.5)} className={isFlash ? 'table-flash-stroke' : ''} style={{ backdropFilter: 'blur(8px)' as any, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }} />
          {tint && (<polygon points={points} fill={tintAlpha(tint)} />)}
          <title>{`Table ${t.id}${serverMatch}\nChecks: ${orderInfo?.checks ?? 0}${orderInfo?.total ? `\nTotal: $${(orderInfo.total/100).toFixed(2)}` : ''}`}</title>
          <text x={cx} y={cy + 4} fontSize={12} textAnchor="middle" fill={textColor} style={{ userSelect: 'none' }}>{t.id}</text>
        </g>
      );
    }

    // Default rectangle
    return (
      <g key={t.id} transform={`translate(${x}, ${y})`} className="cursor-pointer" {...common}>
        <rect rx={10} ry={10} width={wRect} height={hRect} fill={glassFill} stroke={stroke} strokeWidth={(occupied[t.id] || isFlash) ? 4 : (isQuickSeatSelected ? 3 : 1.5)} className={isFlash ? 'table-flash-stroke' : ''} style={{ backdropFilter: 'blur(8px)' as any, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))' }} />
        {tint && (<rect rx={10} ry={10} width={wRect} height={hRect} fill={tintAlpha(tint)} />)}
        <title>{`Table ${t.id}${serverMatch}\nChecks: ${orderInfo?.checks ?? 0}${orderInfo?.total ? `\nTotal: $${(orderInfo.total/100).toFixed(2)}` : ''}`}</title>
        <text x={wRect / 2} y={hRect / 2 + 4} textAnchor="middle" fontSize={12} fill={textColor} style={{ userSelect: 'none' }}>{t.id}</text>
      </g>
    );
  });

  return (
    <div className="w-full rounded-xl border p-0">
      <div className="relative">
        <div className="absolute inset-0 -z-10 opacity-90">
          <div className="absolute inset-0 animate-gradient-drift" style={{ background: 'radial-gradient(900px 500px at 20% 30%, rgba(59,130,246,0.10), transparent)' }} />
          <div className="absolute inset-0 animate-gradient-drift-slow" style={{ background: 'radial-gradient(900px 500px at 80% 70%, rgba(16,185,129,0.10), transparent)' }} />
          <div className="absolute inset-0 animate-float-diagonal" style={{ background: 'radial-gradient(700px 400px at 50% 10%, rgba(236,72,153,0.08), transparent)' }} />
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="xMidYMid meet">
        <style>{`
          .table-flash-stroke {
            stroke: #ef4444;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
            animation: table-glow 600ms ease-out forwards;
          }
          @keyframes table-glow {
            0% {
              stroke-width: 1;
              opacity: 0.3;
              filter: drop-shadow(0 0 0 rgba(239,68,68,0));
            }
            30% {
              stroke-width: 2;
              opacity: 0.7;
              filter: drop-shadow(0 0 6px rgba(239,68,68,0.4));
            }
            60% {
              stroke-width: 3;
              opacity: 1;
              filter: drop-shadow(0 0 10px rgba(239,68,68,0.7));
            }
            100% {
              stroke-width: 4;
              opacity: 1;
              filter: drop-shadow(0 0 0 rgba(239,68,68,0));
            }
          }
        `}</style>
        <defs>
          <pattern id="minorGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(100,116,139,0.12)" strokeWidth="1" />
          </pattern>
          <pattern id="majorGrid" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill="url(#minorGrid)" />
        <rect x={0} y={0} width={w} height={h} fill="url(#majorGrid)" />
        {/* Walls: prefer provided layout walls; fallback to reference mapper */}
        <g stroke="#1f2937" fill="none">
          {(Array.isArray(walls) && walls.length ? walls : getAllWallSegments()).map((wall, idx) => (
            <line
              key={idx}
              x1={wall.x1}
              y1={wall.y1}
              x2={wall.x2}
              y2={wall.y2}
              strokeWidth={(wall as any).thickness || 6}
            />
          ))}
        </g>
        {/* Labels from layout if provided */}
        {Array.isArray(labels) && labels.length ? (
          <g>
            {labels.map((l, i) => (
              <text key={i} x={l.x} y={l.y} fontSize={(l as any).size || 12} textAnchor="middle" fill="#64748b">{l.text}</text>
            ))}
          </g>
        ) : null}
        {tableNodes}
        </svg>
      </div>
    </div>
  );
}


