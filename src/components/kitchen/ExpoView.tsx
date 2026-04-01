"use client";

import React, { useState, useMemo } from "react";

type KitchenOrder = {
    receiptId: string;
    uberOrderId?: string;
    totalUsd: number;
    currency: string;
    createdAt: number;
    status: string;
    kitchenStatus: "new" | "preparing" | "ready" | "completed";
    lineItems: Array<{
        label: string;
        priceUsd: number;
        qty?: number;
        attributes?: Record<string, any>;
        modifiers?: any[];
        addedAt?: number;
        cancelled?: boolean;
        readyAt?: number;
    }>;
    brandName?: string;
    kitchenMetadata?: {
        enteredKitchenAt: number;
        startedPreparingAt?: number;
        markedReadyAt?: number;
        completedAt?: number;
    };
    orderType?: string;
    tableNumber?: string;
    customerName?: string;
    serverName?: string;
    specialInstructions?: string;
    source?: "pos" | "ubereats";
    estimatedPickup?: number;
    uberMetadata?: {
        storeId?: string;
        estimatedDelivery?: number;
        driverId?: string;
    };
};

// ── Helpers ──

function formatElapsed(startTimestamp: number): string {
    const elapsed = Date.now() - startTimestamp;
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "< 1m";
    return `${minutes}m`;
}

function getAgingTier(enteredAt: number): "fresh" | "warning" | "urgent" | "critical" {
    const minutes = Math.floor((Date.now() - enteredAt) / 60000);
    if (minutes >= 25) return "critical";
    if (minutes >= 15) return "urgent";
    if (minutes >= 5) return "warning";
    return "fresh";
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; fillTheme: string; badge: string; badgeText: string }> = {
    new:       { bg: "bg-blue-950/30",   border: "border-blue-500/40",   text: "text-blue-500/40",   fillTheme: "rgba(23, 37, 84, 0.3)", badge: "bg-blue-500",   badgeText: "NEW" },
    preparing: { bg: "bg-amber-950/30",  border: "border-amber-500/40",  text: "text-amber-500/40",  fillTheme: "rgba(67, 20, 7, 0.3)", badge: "bg-amber-500",  badgeText: "PREP" },
    ready:     { bg: "bg-emerald-950/30", border: "border-emerald-500/40", text: "text-emerald-500/40", fillTheme: "rgba(2, 44, 34, 0.3)", badge: "bg-emerald-500", badgeText: "READY" },
    completed: { bg: "bg-neutral-900/50", border: "border-neutral-700/40", text: "text-neutral-700/40", fillTheme: "rgba(23, 23, 23, 0.5)", badge: "bg-neutral-600", badgeText: "DONE" },
};

const AGING_STYLES: Record<string, string> = {
    fresh:    "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    warning:  "shadow-[0_0_16px_rgba(234,179,8,0.25)] animate-pulse-slow",
    urgent:   "shadow-[0_0_20px_rgba(249,115,22,0.35)] animate-pulse-slow",
    critical: "shadow-[0_0_24px_rgba(239,68,68,0.45)] animate-pulse",
};

const NEXT_STATUS: Record<string, string> = {
    new: "preparing",
    preparing: "ready",
    ready: "completed",
};

const BUMP_LABELS: Record<string, string> = {
    new: "START",
    preparing: "READY",
    ready: "SERVE",
};

// ── All-Day Summary ──

function AllDaySummary({ orders }: { orders: KitchenOrder[] }) {
    const activeOrders = orders.filter(o => o.kitchenStatus !== "completed" && o.status !== "cancelled");

    const itemCounts = useMemo(() => {
        const counts = new Map<string, number>();
        activeOrders.forEach(order => {
            order.lineItems.forEach(item => {
                if (item.cancelled) return;
                if (item.label.toLowerCase().includes("processing fee") || item.label.toLowerCase().includes("service fee")) return;
                const qty = item.qty || 1;
                const label = item.label.trim();
                counts.set(label, (counts.get(label) || 0) + qty);
            });
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); // top 20 items
    }, [activeOrders]);

    if (itemCounts.length === 0) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">All-Day Summary</span>
                <span className="text-[10px] text-neutral-600 font-mono">{activeOrders.length} active orders</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {itemCounts.map(([label, count]) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap"
                    >
                        <span className="font-bold text-white tabular-nums">{count}×</span>
                        <span className="text-neutral-300 truncate max-w-[140px]">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Expo Card (Receipt-Style) ──

function ExpoCard({
    order,
    onBump,
    onArchive,
    orientation,
}: {
    order: KitchenOrder;
    onBump: (id: string, nextStatus: string, uberId?: string) => void;
    onArchive: (id: string, uberId?: string) => void;
    orientation: "horizontal" | "vertical";
}) {
    const [bumping, setBumping] = useState(false);

    const enteredAt = order.kitchenMetadata?.enteredKitchenAt || order.createdAt;
    const elapsed = formatElapsed(enteredAt);
    const aging = order.kitchenStatus === "completed" || order.status === "cancelled" ? "fresh" : getAgingTier(enteredAt);
    const isCancelled = order.status === "cancelled";
    const isCompleted = order.kitchenStatus === "completed";
    const statusKey = isCancelled ? "completed" : order.kitchenStatus;
    const style = STATUS_STYLES[statusKey] || STATUS_STYLES.new;
    const agingStyle = AGING_STYLES[aging] || "";
    const nextStatus = NEXT_STATUS[order.kitchenStatus];
    const bumpLabel = BUMP_LABELS[order.kitchenStatus] || "BUMP";

    const filteredItems = order.lineItems.filter(i =>
        !i.label.toLowerCase().includes("processing fee") &&
        !i.label.toLowerCase().includes("service fee")
    );

    // Server name parsing (same logic as KitchenTicket)
    let displayNotes = order.specialInstructions || "";
    let displayServerName = order.serverName || null;
    const serverMatch = displayNotes.match(/Server:\s*([^\n]+)/i);
    if (serverMatch) {
        if (!displayServerName) displayServerName = serverMatch[1].trim();
        displayNotes = displayNotes.replace(/Server:\s*[^\n]+(\n)?/i, "").trim();
    }
    if (displayServerName && displayServerName.includes("•")) {
        displayServerName = displayServerName.split("•")[0].trim();
    }

    const handleBump = () => {
        if (!nextStatus || bumping) return;
        setBumping(true);
        onBump(order.receiptId, nextStatus, order.uberOrderId);
        setTimeout(() => setBumping(false), 800);
    };

    const cardWidth = orientation === "horizontal" ? "w-[320px] min-w-[320px]" : "w-full";

    return (
        <div
            className={`
                ${cardWidth} flex flex-col relative
                ${isCompleted ? "opacity-50 scale-[0.97]" : ""}
                ${bumping ? "scale-95 opacity-60" : ""}
                transition-all duration-300
            `}
        >
            {/* ── Perforated Receipt Top Edge (zigzag) ── */}
            <svg className={`w-full block relative z-10 overflow-visible ${style.text}`} style={{ height: "12px", marginBottom: "-1px" }} viewBox="0 0 320 12" preserveAspectRatio="none">
                <path
                    d="M1,12 L8,0 L16,12 L24,0 L32,12 L40,0 L48,12 L56,0 L64,12 L72,0 L80,12 L88,0 L96,12 L104,0 L112,12 L120,0 L128,12 L136,0 L144,12 L152,0 L160,12 L168,0 L176,12 L184,0 L192,12 L200,0 L208,12 L216,0 L224,12 L232,0 L240,12 L248,0 L256,12 L264,0 L272,12 L280,0 L288,12 L296,0 L304,12 L312,0 L319,12"
                    fill={style.fillTheme}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            {/* ── Card Body ── */}
            <div className={`flex flex-col flex-1 border-x-2 border-b-2 rounded-b-xl overflow-hidden ${style.bg} ${style.border} ${agingStyle}`}>

            {/* ── Header ── */}
            <div className="px-4 pt-3 pb-2 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-2xl text-white tracking-wide">
                            #{order.receiptId.slice(-6)}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-black text-white rounded-md ${style.badge} shadow-sm`}>
                            {isCancelled ? "VOID" : style.badgeText}
                        </span>
                        {order.source === "ubereats" && (
                            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-green-600 text-white rounded">
                                Uber
                            </span>
                        )}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {order.orderType && order.orderType !== "dine-in" && (
                            <span className="ml-2 uppercase font-bold text-neutral-400">
                                {order.orderType === "takeout" ? "TAKEOUT" : order.orderType === "delivery" ? "DELIVERY" : order.orderType.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Timer */}
                <div className={`text-right`}>
                    <div className={`text-2xl font-black tabular-nums ${
                        aging === "critical" ? "text-red-400 animate-pulse" :
                        aging === "urgent" ? "text-orange-400" :
                        aging === "warning" ? "text-yellow-400" :
                        "text-emerald-400"
                    }`}>
                        {isCompleted ? "✓" : isCancelled ? "✕" : elapsed}
                    </div>
                </div>
            </div>

            {/* ── Info Bar: Table + Server ── */}
            {(order.tableNumber || displayServerName || order.customerName) && (
                <div className="px-4 pb-2 flex flex-wrap gap-2 text-xs">
                    {order.tableNumber && (
                        <span className="font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                            Table {order.tableNumber}
                        </span>
                    )}
                    {displayServerName && (
                        <span className="text-neutral-400">
                            <span className="opacity-60 uppercase font-bold text-[10px]">Srv: </span>
                            <span className="font-bold text-neutral-200">{displayServerName}</span>
                        </span>
                    )}
                    {!displayServerName && order.customerName && (
                        <span className="text-neutral-400">
                            <span className="opacity-60 uppercase font-bold text-[10px]">Guest: </span>
                            <span className="font-medium text-neutral-300 truncate max-w-[100px]">{order.customerName}</span>
                        </span>
                    )}
                </div>
            )}

            {/* ── Dashed Perforation (Top) ── */}
            <div className={`mx-4 border-t-2 border-dashed ${style.border}`} style={{ borderSpacing: "8px" }} />

            {/* ── Line Items ── */}
            <div className="px-4 py-3 flex-1 space-y-2 overflow-y-auto max-h-[280px]">
                {filteredItems.map((item, idx) => {
                    let modGroups = item.attributes?.modifierGroups || [];
                    if ((!modGroups || modGroups.length === 0) && Array.isArray(item.modifiers) && item.modifiers.length > 0) {
                        modGroups = [{ name: "Modifiers", modifiers: item.modifiers }];
                    }
                    const hasModifiers = Array.isArray(modGroups) && modGroups.length > 0;
                    const isNew = item.addedAt && item.addedAt > order.createdAt;

                    return (
                        <div key={idx} className={`text-sm ${item.cancelled ? "opacity-40 line-through" : ""}`}>
                            <div className="font-bold flex items-start gap-2 text-[15px] text-white leading-snug">
                                {item.qty && item.qty > 1 && (
                                    <span className="inline-flex items-center justify-center bg-white text-black rounded px-1.5 py-0.5 text-xs font-black min-w-[24px] text-center">
                                        {item.qty}×
                                    </span>
                                )}
                                <span className="flex-1">{item.label}</span>
                                {isNew && !item.cancelled && (
                                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded uppercase">NEW</span>
                                )}
                            </div>

                            {/* Modifiers */}
                            {hasModifiers && (
                                <div className="mt-1 ml-1 pl-3 border-l-2 border-white/10 space-y-0.5 text-xs text-neutral-400">
                                    {modGroups.map((group: any, gidx: number) => {
                                        const selectedMods = Array.isArray(group.modifiers)
                                            ? group.modifiers.filter((m: any) => m.selected || m.default || (m.quantity && m.quantity > 0))
                                            : [];

                                        return selectedMods.map((mod: any, midx: number) => (
                                            <div key={`${gidx}-${midx}`} className="flex items-center gap-1 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                {mod.quantity > 1 ? `${mod.quantity}× ` : ""}
                                                {mod.priceAdjustment > 0 ? "+ " : ""}
                                                {mod.name}
                                            </div>
                                        ));
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Special Instructions ── */}
            {displayNotes && (
                <div className="mx-4 mb-2 p-2.5 rounded-lg text-sm bg-yellow-500/10 border border-yellow-500/20 text-yellow-200">
                    <div className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-yellow-500/70">⚠ Special Request</div>
                    <div className="font-medium italic leading-relaxed text-xs">"{displayNotes}"</div>
                </div>
            )}

            {/* ── Dashed Perforation (Bottom) ── */}
            <div className={`border-t-2 border-dashed ${style.border} opacity-80`} />

            {/* ── Footer: Bump Action ── */}
            <div className="p-2">
                {!isCompleted && !isCancelled && nextStatus ? (
                    <button
                        onClick={handleBump}
                        disabled={bumping}
                        className={`
                            w-full py-3 rounded-lg font-black text-lg uppercase tracking-widest transition-all
                            ${order.kitchenStatus === "new"
                                ? "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white"
                                : order.kitchenStatus === "preparing"
                                    ? "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white"
                            }
                            active:scale-[0.98] disabled:opacity-50
                        `}
                    >
                        {bumping ? "..." : `▶ ${bumpLabel}`}
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => onArchive(order.receiptId, order.uberOrderId)}
                        className="w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-all active:scale-[0.98]"
                    >
                        ✕ Archive
                    </button>
                ) : isCancelled ? (
                    <div className="w-full py-2.5 rounded-lg text-center font-bold text-sm uppercase tracking-wider bg-red-950/40 text-red-400">
                        CANCELLED
                    </div>
                ) : null}
            </div>
            </div>
        </div>
    );
}

// ── Main Expo View ──

export function ExpoView({
    orders,
    onBump,
    onArchive,
    rotated,
    onToggleRotate,
}: {
    orders: KitchenOrder[];
    onBump: (id: string, nextStatus: string, uberId?: string) => void;
    onArchive: (id: string, uberId?: string) => void;
    rotated: boolean;
    onToggleRotate: () => void;
}) {
    // Sort: active orders by age (oldest first), completed/cancelled at end
    const sortedOrders = useMemo(() => {
        const active = orders
            .filter(o => o.kitchenStatus !== "completed" && o.status !== "cancelled")
            .sort((a, b) => {
                const statusOrder: Record<string, number> = { new: 0, preparing: 1, ready: 2 };
                const aPri = statusOrder[a.kitchenStatus] ?? 3;
                const bPri = statusOrder[b.kitchenStatus] ?? 3;
                if (aPri !== bPri) return aPri - bPri;
                const aTime = a.kitchenMetadata?.enteredKitchenAt || a.createdAt;
                const bTime = b.kitchenMetadata?.enteredKitchenAt || b.createdAt;
                return aTime - bTime;
            });

        const completed = orders
            .filter(o => o.kitchenStatus === "completed" || o.status === "cancelled")
            .sort((a, b) => {
                const aTime = a.kitchenMetadata?.completedAt || a.createdAt;
                const bTime = b.kitchenMetadata?.completedAt || b.createdAt;
                return bTime - aTime;
            })
            .slice(0, 6);

        return [...active, ...completed];
    }, [orders]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* ── All-Day Summary ── */}
            <AllDaySummary orders={orders} />

            {/* ── Status Bar + Rotate Toggle ── */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest">
                    {sortedOrders.filter(o => o.kitchenStatus !== "completed" && o.status !== "cancelled").length} Active
                    {" · "}
                    {sortedOrders.filter(o => o.kitchenStatus === "new").length} New
                    {" · "}
                    {sortedOrders.filter(o => o.kitchenStatus === "preparing").length} Prep
                    {" · "}
                    {sortedOrders.filter(o => o.kitchenStatus === "ready").length} Ready
                </div>
                <button
                    onClick={onToggleRotate}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider ${
                        rotated
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white"
                    }`}
                    title={rotated ? "Return to landscape" : "Rotate to portrait"}
                >
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${rotated ? "rotate-90" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {rotated ? "Landscape" : "Portrait"}
                </button>
            </div>

            {/* ── Cards Scroll ── */}
            {sortedOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-neutral-600 text-lg italic">
                    No active orders
                </div>
            ) : (
                <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-4 px-1 no-scrollbar snap-x snap-mandatory">
                    {sortedOrders.map(order => (
                        <div key={order.receiptId} className="snap-start">
                            <ExpoCard
                                order={order}
                                onBump={onBump}
                                onArchive={onArchive}
                                orientation="horizontal"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

