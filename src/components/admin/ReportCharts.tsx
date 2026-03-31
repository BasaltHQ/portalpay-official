"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/fx";

/* ═══════════════════════════════════════════════════════════════════════
   SHARED REPORT CHART COMPONENTS
   Pure SVG / CSS — no external charting dependencies.
   ═══════════════════════════════════════════════════════════════════════ */

const CHART_COLORS = [
    "#6366f1", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7",
    "#f43f5e", "#14b8a6", "#e879f9", "#fb923c", "#06b6d4",
];

/* ────────── Enhanced Stat Card ────────── */
export function EnhancedStatCard({ icon: Icon, label, value, sub, accent, trend, delta }: {
    icon?: any;
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
    trend?: "up" | "down" | "neutral";
    delta?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border bg-card p-5 hover:border-primary/30 transition-all group">
            {Icon && (
                <div className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-primary/10 grid place-items-center group-hover:bg-primary/15 transition">
                    <Icon className={`h-4 w-4 ${accent || "text-primary"}`} />
                </div>
            )}
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 leading-tight">{label}</div>
            <div className="text-2xl font-bold flex items-center gap-2">
                {value}
                {delta && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${trend === "up" ? "bg-green-500/10 text-green-500" : trend === "down" ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"}`}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {delta}
                    </span>
                )}
            </div>
            {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
            {/* Gradient shimmer on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        </div>
    );
}

/* ────────── Horizontal Bar Chart ────────── */
export function HorizontalBarChart({ data, maxBars = 8, valueKey = "value", labelKey = "label", currency = true }: {
    data: any[];
    maxBars?: number;
    valueKey?: string;
    labelKey?: string;
    currency?: boolean;
}) {
    if (!data?.length) return null;
    const sorted = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
    const display = sorted.slice(0, maxBars);
    const maxVal = Math.max(...display.map(d => d[valueKey] || 0), 1);

    return (
        <div className="space-y-2">
            {display.map((item, i) => (
                <div key={item[labelKey] || i} className="flex items-center gap-3 group">
                    <div className="w-28 text-xs text-muted-foreground truncate flex-shrink-0 group-hover:text-foreground transition" title={item[labelKey]}>
                        {item[labelKey]}
                    </div>
                    <div className="flex-1 h-7 bg-muted/20 rounded-md overflow-hidden relative">
                        <div
                            className="h-full rounded-md transition-all duration-700 ease-out"
                            style={{
                                width: `${Math.max(2, ((item[valueKey] || 0) / maxVal) * 100)}%`,
                                background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}cc, ${CHART_COLORS[i % CHART_COLORS.length]})`,
                            }}
                        />
                    </div>
                    <div className="w-24 text-right text-xs font-mono font-semibold tabular-nums">
                        {currency ? formatCurrency(item[valueKey] || 0, "USD") : (item[valueKey] || 0)}
                    </div>
                </div>
            ))}
            {sorted.length > maxBars && (
                <div className="text-xs text-muted-foreground text-center pt-1">+{sorted.length - maxBars} more</div>
            )}
        </div>
    );
}

/* ────────── Donut / Pie Chart ────────── */
export function DonutChart({ data, labelKey = "label", valueKey = "value", size = 120, currency = true }: {
    data: any[];
    labelKey?: string;
    valueKey?: string;
    size?: number;
    currency?: boolean;
}) {
    if (!data?.length) return null;
    const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0) || 1;
    const sorted = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
    const display = sorted.slice(0, 6);
    const otherVal = sorted.slice(6).reduce((s, d) => s + (d[valueKey] || 0), 0);

    let cumPercent = 0;
    const segments = display.map((d, i) => {
        const pct = ((d[valueKey] || 0) / total) * 100;
        const offset = cumPercent;
        cumPercent += pct;
        return { ...d, pct, offset, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    if (otherVal > 0) {
        segments.push({ [labelKey]: `+${sorted.length - 6} more`, [valueKey]: otherVal, pct: (otherVal / total) * 100, offset: cumPercent, color: "#71717a" } as any);
    }

    return (
        <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {segments.map((seg, i) => (
                        <circle
                            key={i}
                            r="15.5"
                            cx="18"
                            cy="18"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="4"
                            strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                            strokeDashoffset={`${-seg.offset}`}
                            strokeLinecap="round"
                            className="transition-all duration-700 hover:opacity-80"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">Total</span>
                    <span className="text-sm font-bold">{currency ? formatCurrency(total, "USD") : total}</span>
                </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs group">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10" style={{ background: seg.color }} />
                        <span className="truncate text-muted-foreground group-hover:text-foreground transition">{seg[labelKey]}</span>
                        <span className="ml-auto font-mono tabular-nums font-semibold whitespace-nowrap">{seg.pct.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ────────── Vertical Bar Chart (Hourly / Time Series) ────────── */
export function VerticalBarChart({ data, labelKey = "label", valueKey = "value", height = 200, currency = true, barColor }: {
    data: any[];
    labelKey?: string;
    valueKey?: string;
    height?: number;
    currency?: boolean;
    barColor?: string;
}) {
    if (!data?.length) return null;
    const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
    const color = barColor || "#6366f1";

    return (
        <div className="relative" style={{ height }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="border-t border-border/30 relative">
                        <span className="absolute -top-2.5 -left-1 text-[9px] text-muted-foreground/60 font-mono tabular-nums">
                            {currency ? formatCurrency(maxVal * (1 - i / 3), "USD") : Math.round(maxVal * (1 - i / 3))}
                        </span>
                    </div>
                ))}
            </div>
            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-[2px] pt-3 pb-5 pl-12">
                {data.map((item, i) => {
                    const pct = Math.max(1, ((item[valueKey] || 0) / maxVal) * 100);
                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end items-center group min-w-[8px] relative">
                            <div
                                className="w-full rounded-t-[3px] transition-all duration-500 ease-out cursor-pointer"
                                style={{
                                    height: `${pct}%`,
                                    background: `linear-gradient(180deg, ${color}, ${color}99)`,
                                    minHeight: 2,
                                }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border shadow-lg text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20 font-mono font-semibold transition-opacity">
                                {currency ? formatCurrency(item[valueKey] || 0, "USD") : item[valueKey] || 0}
                            </div>
                            {/* Label */}
                            <div className="absolute top-full mt-1 text-[9px] text-muted-foreground whitespace-nowrap">
                                {item[labelKey]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ────────── Spark Area ────────── */
export function SparkArea({ data, width = 200, height = 50, color = "#6366f1" }: {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
}) {
    if (!data?.length || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((v, i) => ({
        x: padding + (i / (data.length - 1)) * (width - 2 * padding),
        y: padding + (1 - (v - min) / range) * (height - 2 * padding),
    }));

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
            <defs>
                <linearGradient id={`spark-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#spark-grad-${color.replace("#", "")})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Endpoint dot */}
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
        </svg>
    );
}

/* ────────── Volume vs Tips Mini Comparison ────────── */
export function VolumeVsTipsBar({ volume, tips, fees, volumeLabel, tipsLabel, feesLabel }: {
    volume: number; tips: number; fees?: number;
    volumeLabel?: string; tipsLabel?: string; feesLabel?: string;
}) {
    const total = volume + tips + (fees || 0);
    if (total <= 0) return null;
    const volPct = (volume / total) * 100;
    const tipPct = (tips / total) * 100;
    const feePct = fees ? (fees / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="h-6 rounded-lg overflow-hidden flex bg-muted/20">
                <div className="h-full transition-all duration-700" style={{ width: `${volPct}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)" }} />
                <div className="h-full transition-all duration-700" style={{ width: `${tipPct}%`, background: "linear-gradient(90deg, #22c55e, #4ade80)" }} />
                {fees !== undefined && fees > 0 && (
                    <div className="h-full transition-all duration-700" style={{ width: `${feePct}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
                )}
            </div>
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-muted-foreground">{volumeLabel || "Sales"}</span>
                    <span className="font-mono font-semibold">{formatCurrency(volume, "USD")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">{tipsLabel || "Tips"}</span>
                    <span className="font-mono font-semibold">{formatCurrency(tips, "USD")}</span>
                </div>
                {fees !== undefined && fees > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">{feesLabel || "Fees"}</span>
                        <span className="font-mono font-semibold">{formatCurrency(fees, "USD")}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ────────── Payment Method Donut (specialized for paymentMethods[]) ────────── */
export function PaymentMethodDonut({ methods }: { methods: { method: string; total: number; count?: number }[] }) {
    if (!methods?.length) return null;
    return (
        <DonutChart
            data={methods.map(m => ({ label: m.method, value: m.total }))}
            labelKey="label"
            valueKey="value"
        />
    );
}

/* ────────── Merchant Treemap (proportional grid) ────────── */
export function MerchantGrid({ merchants, maxItems = 12 }: { merchants: any[]; maxItems?: number }) {
    if (!merchants?.length) return null;
    const sorted = [...merchants].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
    const display = sorted.slice(0, maxItems);
    const total = display.reduce((s, m) => s + (m.totalSales || 0), 0) || 1;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {display.map((m, i) => {
                const pct = ((m.totalSales || 0) / total) * 100;
                const color = CHART_COLORS[i % CHART_COLORS.length];
                return (
                    <div key={m.wallet || i} className="p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors group relative overflow-hidden">
                        {/* Background fill proportional to share */}
                        <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" style={{ background: color }} />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                                {m.logo && <img src={m.logo} alt="" className="w-5 h-5 rounded-full" />}
                                <span className="text-xs font-semibold truncate">{m.name || m.shopName || "Unknown"}</span>
                            </div>
                            <div className="text-sm font-bold font-mono">{formatCurrency(m.totalSales || 0, "USD")}</div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-muted-foreground">{m.transactionCount || 0} txns</span>
                                <span className="text-[10px] font-semibold" style={{ color }}>{pct.toFixed(1)}%</span>
                            </div>
                            {/* Mini bar */}
                            <div className="mt-1.5 h-1 bg-muted/30 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ────────── Revenue Breakdown Card ────────── */
export function RevenueBreakdown({ earned, fees, tips, volume }: { earned: number; fees: number; tips: number; volume: number }) {
    if (volume <= 0) return null;
    const entries = [
        { label: "Merchant Earned", value: earned, color: "#6366f1" },
        { label: "Platform Fees", value: fees, color: "#f59e0b" },
        { label: "Tips", value: tips, color: "#22c55e" },
    ].filter(e => e.value > 0);

    return (
        <div className="space-y-3">
            {entries.map((entry) => {
                const pct = ((entry.value / volume) * 100).toFixed(1);
                return (
                    <div key={entry.label}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                                <span className="text-xs text-muted-foreground">{entry.label}</span>
                            </div>
                            <div className="text-xs font-mono font-semibold tabular-nums">
                                {formatCurrency(entry.value, "USD")}
                                <span className="text-muted-foreground ml-1">({pct}%)</span>
                            </div>
                        </div>
                        <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.max(1, parseFloat(pct))}%`, background: entry.color }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ────────── Custom Multi-Line Time Series ────────── */
export function MultiLineChart({ data, lines, height = 280, currency = true }: {
    data: { label: string; [key: string]: any }[];
    lines: { key: string; name: string; color: string }[];
    height?: number;
    currency?: boolean;
}) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (!data?.length || !lines?.length) return null;
    
    let maxVal = 1;
    data.forEach(d => {
        lines.forEach(l => {
            const v = d[l.key] || 0;
            if (v > maxVal) maxVal = v;
        });
    });

    const plotMax = maxVal * 1.2;

    return (
        <div className="relative w-full select-none" style={{ height }}>
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[28px] pt-4">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="border-t border-border/30 relative w-full">
                         <span className="absolute -top-[10px] left-0 text-[10px] text-muted-foreground/60 font-mono tracking-tight bg-card pr-1 z-0">
                             {currency ? formatCurrency(plotMax * (1 - i / 3), "USD") : Math.round(plotMax * (1 - i / 3))}
                         </span>
                    </div>
                ))}
            </div>

            {/* Lines Layer (SVG absolute coordinates) */}
            <svg viewBox="0 0 1000 1000" className="absolute top-4 bottom-[28px] left-0 right-0 w-full h-[calc(100%-44px)] overflow-visible pointer-events-none z-10" preserveAspectRatio="none">
                {lines.map((line) => {
                    const pts = data.map((d, i) => {
                        const x = (i / Math.max(1, data.length - 1)) * 1000;
                        const val = d[line.key] || 0;
                        const y = 1000 - ((val / plotMax) * 1000);
                        return `${x},${y}`;
                    });
                    
                    return (
                        <g key={line.key}>
                            {/* Ambient Glow Track */}
                            <polyline
                                fill="none"
                                stroke={line.color}
                                strokeWidth="8"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pts.join(' ')}
                                style={{
                                    filter: 'blur(6px)',
                                    opacity: 0.4
                                }}
                                className="transition-all duration-700"
                            />
                            {/* Sharp Bright Core */}
                            <polyline
                                fill="none"
                                stroke={line.color}
                                strokeWidth="2.5"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pts.join(' ')}
                                style={{
                                    filter: `drop-shadow(0 0 6px ${line.color})`
                                }}
                                className="transition-all duration-700 opacity-100"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* HTML Based Hover Overlay Grid */}
            <div className="absolute inset-0 z-20 flex">
                {data.map((d, i) => {
                    // Reduce label clutter on X axis: Only show ~6 labels
                    const skipRatio = Math.max(1, Math.floor(data.length / 6));
                    const showLabel = i === 0 || i === data.length - 1 || i % skipRatio === 0;

                    return (
                        <div 
                            key={i} 
                            className="flex-1 h-full group relative cursor-crosshair flex flex-col justify-end"
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            {/* Selected Line Guide */}
                            {hoverIndex === i && <div className="absolute top-4 bottom-[25px] left-1/2 w-px bg-white/20 pointer-events-none" />}
                            
                            {/* X-axis label */}
                            <div className="relative w-full">
                                {showLabel && (
                                    <div className={`absolute -bottom-1 text-[10px] text-muted-foreground whitespace-nowrap pointer-events-none ${i === 0 ? 'left-0' : i === data.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                                        {d.label}
                                    </div>
                                )}
                            </div>
                             
                            {/* Hover Status Dots for each line */}
                            {hoverIndex === i && lines.map(line => {
                                 const val = d[line.key] || 0;
                                 if (val === 0) return null;
                                 const yPct = ((plotMax - val) / plotMax) * 100;
                                 
                                 return (
                                     <div 
                                         key={line.key}
                                         className="absolute left-1/2 -translate-x-1/2 -mt-1.5 h-3 w-3 rounded-full border-2 border-background shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none transition-all"
                                         style={{ top: `calc(${yPct}% + 16px)`, backgroundColor: line.color }}
                                     />
                                 );
                             })}
                        </div>
                    );
                })}
            </div>

            {/* Central Absolute Tooltip to avoid Edge Clipping */}
            {hoverIndex !== null && data[hoverIndex] && (
                <div 
                    className={`absolute top-4 z-50 bg-black/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-4 min-w-[200px] pointer-events-none transition-transform duration-100 hidden sm:block`}
                    style={{
                        left: `${(hoverIndex / Math.max(1, data.length - 1)) * 100}%`,
                        transform: `translateX(${hoverIndex > data.length / 2 ? '-110%' : '10%'})`
                    }}
                >
                    <div className="text-xs font-bold text-foreground border-b border-border/50 pb-2 mb-2">{data[hoverIndex].label}</div>
                    <div className="space-y-2">
                        {lines.map(l => {
                            const val = data[hoverIndex][l.key] || 0;
                            return (
                                <div key={l.key} className={`flex justify-between items-center text-xs ${val === 0 ? 'opacity-30' : 'opacity-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: l.color }} />
                                        <span className="text-muted-foreground truncate max-w-[120px] font-medium">{l.name}</span>
                                    </div>
                                    <span className="font-mono font-semibold tabular-nums text-right pl-3 text-white">
                                        {currency ? formatCurrency(val, "USD") : val}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
