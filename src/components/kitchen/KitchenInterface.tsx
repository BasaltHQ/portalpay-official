"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Capacitor } from "@capacitor/core";
import { networkPrint, buildExpoTicketText } from "@/lib/hardware/network-print";
import { WebUSBPrinter } from "@/lib/hardware/WebUSBPrinter";
import { UsbPrinter, ExternalPrinter } from "@/lib/hardware/useHardwareHooks";
import { buildRawEscPosTicket } from "@/lib/hardware/escpos";
import { useKDSOrientation } from "@/lib/hardware/useKDSOrientation";
import { useApplyTheme, resolveThemeId } from "@/lib/themes";
import { useBrand } from "@/contexts/BrandContext";
import { ExpoView } from "@/components/kitchen/ExpoView";
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    rectIntersection,
    useDroppable
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function formatElapsedTime(startTimestamp: number): string {
    const elapsed = Date.now() - startTimestamp;
    const minutes = Math.floor(elapsed / 60000);

    if (minutes < 1) return "< 1 min";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
}

// -- TICKET COMPONENT (Draggable) --
function KitchenTicket({ order, isOverlay, onClear, onMarkItemReady }: { order: KitchenOrder; isOverlay?: boolean; onClear?: (id: string, uberId?: string) => void; onMarkItemReady?: (id: string, idx: number) => void; }) {
    const [isPrinting, setIsPrinting] = useState(false);

    // 1. Filter out Processing Fees
    const filteredItems = order.lineItems.map((item, idx) => ({ ...item, originalIndex: idx })).filter(i =>
        !i.label.toLowerCase().includes("processing fee") &&
        !i.label.toLowerCase().includes("service fee")
    );

    const enteredAt = order.kitchenMetadata?.enteredKitchenAt || order.createdAt;
    const elapsed = formatElapsedTime(enteredAt);
    const elapsedMinutes = Math.floor((Date.now() - enteredAt) / 60000);

    // 2. Dynamic Time-based Coloring (Green -> Yellow -> Orange -> Red)
    let colorClass = "border-l-4 border-l-emerald-500 bg-neutral-50 dark:bg-[#1a1a1a]"; // Default / Fresh
    let timeTextColor = "text-emerald-600 dark:text-emerald-400";

    if (order.status === 'cancelled') {
        colorClass = "border-l-4 border-l-red-600 bg-red-950/20";
        timeTextColor = "text-red-500 animate-pulse";
    } else if (order.kitchenStatus === 'completed') {
        // Completed orders - grayed out
        colorClass = "border-l-4 border-l-neutral-500 bg-neutral-50 dark:bg-neutral-900/40 opacity-70";
        timeTextColor = "text-neutral-500";
    } else if (elapsedMinutes >= 5 && elapsedMinutes < 15) {
        colorClass = "border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10";
        timeTextColor = "text-yellow-600 dark:text-yellow-400";
    } else if (elapsedMinutes >= 15 && elapsedMinutes < 25) {
        colorClass = "border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-900/10";
        timeTextColor = "text-orange-600 dark:text-orange-400";
    } else if (elapsedMinutes >= 25) {
        colorClass = "border-l-4 border-l-red-600 bg-red-50/30 dark:bg-red-900/10 animate-pulse-slow";
        timeTextColor = "text-red-600 dark:text-red-400";
    }

    // 3. Robust Server Name Parsing & Cleaning
    let displayNotes = order.specialInstructions || "";
    let extractedServerName = null;

    const serverMatch = displayNotes.match(/Server:\s*([^\n]+)/i);
    if (serverMatch) {
        extractedServerName = serverMatch[1].trim();
        displayNotes = displayNotes.replace(/Server:\s*[^\n]+(\n)?/i, "").trim();
    }

    let displayServerName = order.serverName || extractedServerName;
    if (displayServerName && displayServerName.includes('•')) {
        displayServerName = displayServerName.split('•')[0].trim();
    }

    return (
        <div className={`relative rounded-r-lg border-y border-r border-neutral-200 dark:border-neutral-800 p-4 shadow-sm select-none touch-manipulation transition-all ${colorClass} ${isOverlay ? 'shadow-2xl scale-105 rotate-1 z-50' : 'hover:shadow-md'}`}>

            {/* Clear Button (Only for Completed or Cancelled) */}
            {onClear && (order.kitchenStatus === 'completed' || order.status === 'cancelled') && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear(order.receiptId, order.uberOrderId);
                    }}
                    className="absolute -top-2 -right-2 bg-neutral-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-neutral-500 z-10"
                    title="Archive Order"
                >
                    ✕
                </button>
            )}

            {/* Header Row: ID + Timer */}
            <div className="flex items-start justify-between mb-3 border-b border-neutral-200 dark:border-neutral-800/50 pb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xl tracking-wide text-neutral-900 dark:text-white">#{order.receiptId.slice(-6)}</span>
                        {order.status === "cancelled" && (
                            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-red-600 text-white rounded flex items-center gap-1 shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                Cancelled
                            </span>
                        )}
                        {order.source === "ubereats" && (
                            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-green-600 text-white rounded flex items-center gap-1">
                                Uber
                            </span>
                        )}
                    </div>
                    <div className="text-xs opacity-60 mt-0.5 dark:text-neutral-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-lg font-bold tabular-nums ${timeTextColor}`}>
                        {order.kitchenStatus === 'completed' ? 'Done' : elapsed}
                    </div>
                </div>
            </div>

            {/* Info Row: Table + Server */}
            <div className="flex flex-wrap gap-x-4 mb-4 text-sm">
                {order.tableNumber && (
                    <div className="font-bold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        Table {order.tableNumber}
                    </div>
                )}
                {displayServerName ? (
                    <div className="flex items-center gap-1 opacity-90 text-neutral-700 dark:text-neutral-300">
                        <span className="opacity-60 text-xs uppercase font-bold">Server:</span>
                        <span className="font-bold">{displayServerName}</span>
                    </div>
                ) : (
                    order.customerName && (
                        <div className="flex items-center gap-1 opacity-90 text-neutral-700 dark:text-neutral-300">
                            <span className="opacity-60 text-xs uppercase font-bold">Guest:</span>
                            <span className="font-medium truncate max-w-[100px]">{order.customerName}</span>
                        </div>
                    )
                )}
            </div>

            {/* Line Items */}
            <div className="space-y-3">
                {filteredItems.map((item, idx) => {
                    let modGroups = item.attributes?.modifierGroups || [];
                    if ((!modGroups || modGroups.length === 0) && Array.isArray(item.modifiers) && item.modifiers.length > 0) {
                        modGroups = [{ name: "Modifiers", modifiers: item.modifiers }];
                    }
                    const hasModifiers = Array.isArray(modGroups) && modGroups.length > 0;

                    const isNew = item.addedAt && item.addedAt > order.createdAt;

                    return (
                        <div key={idx} className={`text-sm ${item.cancelled ? 'opacity-50 grayscale' : ''}`}>
                            <div className="font-bold flex justify-between items-start text-base text-neutral-800 dark:text-neutral-100">
                                <span className={`leading-snug ${item.cancelled ? 'line-through text-neutral-500' : ''}`}>
                                    {item.qty && item.qty > 1 && (
                                        <span className="inline-flex items-center justify-center bg-neutral-900 text-white dark:bg-white dark:text-black rounded px-1.5 py-0.5 text-xs font-bold mr-2 align-middle">
                                            {item.qty}x
                                        </span>
                                    )}
                                    {item.label}
                                </span>
                                {isNew && !item.cancelled && (
                                    <div className="flex items-center">
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-1 py-0.5 rounded ml-2">NEW</span>
                                        {!item.readyAt ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onMarkItemReady) onMarkItemReady(order.receiptId, item.originalIndex);
                                                }}
                                                className="ml-2 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider rounded shadow-sm active:scale-95 transition-all"
                                                title="Mark Item Ready"
                                            >
                                                Ready?
                                            </button>
                                        ) : (
                                            <span className="ml-2 text-emerald-500 font-bold" title="Item Ready">✓</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modifiers */}
                            {hasModifiers && (
                                <div className="mt-1 ml-1 pl-3 border-l-2 border-neutral-300 dark:border-neutral-700 space-y-1 text-xs opacity-90 text-neutral-600 dark:text-neutral-400">
                                    {modGroups.map((group: any, gidx: number) => {
                                        const selectedMods = Array.isArray(group.modifiers)
                                            ? group.modifiers.filter((m: any) => m.selected || m.default || (m.quantity && m.quantity > 0))
                                            : [];

                                        return selectedMods.map((mod: any, midx: number) => (
                                            <div key={`${gidx}-${midx}`} className="flex items-center gap-1 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                                                {mod.quantity > 1 ? `${mod.quantity}x ` : ""}
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

            {/* Special Instructions (Notes) */}
            {displayNotes && (
                <div className="mt-4 p-3 rounded-md text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70 flex items-center gap-1">
                        ⚠️ Special Request
                    </div>
                    <div className="font-medium italic leading-relaxed">"{displayNotes}"</div>
                </div>
            )}

            {order.orderType && order.orderType !== "dine-in" && (
                <div className="absolute top-2 right-2 opacity-5 font-black text-6xl pointer-events-none uppercase tracking-tighter">
                    {order.orderType === 'takeout' ? 'TO' : order.orderType === 'delivery' ? 'DL' : ''}
                </div>
            )}

            {/* Print Expo Ticket */}
            {order.kitchenStatus !== 'completed' && (
                <>
                    <button
                        disabled={isPrinting}
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (isPrinting) return;
                            setIsPrinting(true);

                            try {
                                // Tier 0: Direct WebUSB (OTG) to Generic Thermal Printer Mode
                                if (WebUSBPrinter.isSupported()) {
                                    try {
                                        const rawBuffer = buildRawEscPosTicket(order);
                                        const success = await WebUSBPrinter.print(rawBuffer);
                                        if (success) {
                                            console.log('[KDS] WebUSB OTG Direct Printer Job dispatched.');
                                            return;
                                        }
                                    } catch(err) {
                                        console.warn('[KDS] WebUSB Print Overridden or failed:', err);
                                    }
                                }

                                const ticketText = buildExpoTicketText(order);
                                // Tier 1: Try native printer (Capacitor)
                                try {
                                    if (Capacitor.isNativePlatform()) {
                                        const localWifiIp = localStorage.getItem("kds_wifi_printer_ip");
                                        if (localWifiIp) {
                                            try {
                                                await ExternalPrinter.printText({ 
                                                    text: ticketText, 
                                                    ipAddress: localWifiIp, 
                                                    port: 9100 
                                                });
                                                return;
                                            } catch (e) {
                                                console.warn("Native ExternalPrinter rejected:", e);
                                            }
                                        } else {
                                            // Attempt true native USB plugin print
                                            try {
                                                await UsbPrinter.printText({ text: ticketText });
                                                return;
                                            } catch (e) {
                                              console.warn("Native UsbPrinter rejected:", e);
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.warn('[KDS] Native print failed:', err);
                                }
                                // Tier 2: DeviceHub network print
                                const netResult = await networkPrint({ text: ticketText });
                                if (netResult.ok) return;
                                // Tier 3: Browser print
                                window.print();
                            } finally {
                                setTimeout(() => setIsPrinting(false), 2000);
                            }
                        }}
                        className={`mt-3 w-full h-9 rounded-lg ${isPrinting ? 'bg-neutral-600 opacity-70 cursor-not-allowed' : 'bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 active:scale-95'} text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all`}
                    >
                        {isPrinting ? '🖨 Printing...' : '🖨 Print Expo Ticket'}
                    </button>
                    <div className="flex gap-2 w-full mt-2">
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (WebUSBPrinter.isSupported()) {
                                    const { status } = await WebUSBPrinter.requestStatus(1);
                                    alert(`[WebUSB] Hardware Status Code Formatted (n=1): ${status}`);
                                } else if (Capacitor.isNativePlatform() && UsbPrinter.requestStatus) {
                                    try {
                                        const { status } = await UsbPrinter.requestStatus({ n: 1 });
                                        alert(`[Native] Hardware Status Code: ${status}`);
                                    } catch (err: any) {
                                        alert(`Status Fetch Error: ${err.message || err}`);
                                    }
                                } else {
                                    alert("Bidirectional polling is not supported natively in this environment.");
                                }
                            }}
                            className="flex-1 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-all"
                        >
                            Poll Status
                        </button>
                        <button
                            className="flex-1 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center transition-all"
                            onClick={(e) => { e.stopPropagation(); window.print(); }}
                        >
                            Force OS Print
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function SortableTicket({ order, onClear, onMarkItemReady }: { order: KitchenOrder; onClear?: (id: string, uberId?: string) => void; onMarkItemReady?: (id: string, idx: number) => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.receiptId, data: { order } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : 1,
        position: 'relative' as const,
        touchAction: 'none',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <KitchenTicket order={order} onClear={onClear} onMarkItemReady={onMarkItemReady} />
        </div>
    );
}

function KitchenColumn({ id, title, orders, colorClass, onArchive, onMarkItemReady }: { id: string, title: string, orders: KitchenOrder[], colorClass: string, onArchive?: (id: string, uberId?: string) => void; onMarkItemReady?: (id: string, idx: number) => void; }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className={`flex flex-col h-full min-w-[280px] rounded-xl transition-all duration-200 ${isOver ? 'scale-[1.02]' : ''}`}>
            {/* Column Header */}
            <div className={`mb-3 px-3 py-2.5 rounded-lg bg-white/5 dark:bg-white/5 border border-white/10 flex justify-between items-center backdrop-blur-sm ${isOver ? 'bg-white/10 border-white/20' : ''}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colorClass.replace('bg-', 'bg-').split(' ')[0]}`}></div>
                    <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200 uppercase tracking-wide text-sm">{title}</h3>
                </div>
                <span className="text-xs font-mono font-bold bg-black/10 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 px-2.5 py-1 rounded-full">{orders.length}</span>
            </div>

            <SortableContext items={orders.map(o => o.receiptId)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className={`flex-1 bg-neutral-100/50 dark:bg-[#111]/50 rounded-xl p-2 border-2 border-dashed transition-all overflow-y-auto no-scrollbar max-h-[calc(100vh-180px)] ${isOver ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'}`}>
                    {orders.map(order => (
                        <SortableTicket key={order.receiptId} order={order} onClear={onArchive} onMarkItemReady={onMarkItemReady} />
                    ))}
                    {orders.length === 0 && (
                        <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 text-sm italic opacity-50">
                            <span>{isOver ? "Drop to Move" : "No items"}</span>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export function KitchenInterface({ wallet, onLogout }: { wallet?: string; onLogout?: () => void; }) {
    const account = useActiveAccount();
    const activeWallet = wallet || account?.address;
    const brand = useBrand();

    const [orders, setOrders] = useState<KitchenOrder[]>([]);

    // Resolve and apply touchpoint theme for KDS
    const kdsThemeId = resolveThemeId("kds");
    const tpTheme = useApplyTheme(kdsThemeId);
    
    // KDS Physical Screen Orientation Hook
    const { orientation, setSoftRotation, setHardRotation, isNative } = useKDSOrientation();
    const [showRotationSettings, setShowRotationSettings] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const pollIntervalRef = useRef<number | null>(null);
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [shopConfig, setShopConfig] = useState<any>(null);

    // View Mode: "board" (Kanban) or "expo" (Expeditor cards)
    const [viewMode, setViewMode] = useState<"board" | "expo">(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("kds_view_mode") as any) || "board";
        }
        return "board";
    });
    useEffect(() => { localStorage.setItem("kds_view_mode", viewMode); }, [viewMode]);

    
    // Settings Modal State
    const [showSettings, setShowSettings] = useState(false);
    const [wifiIpInput, setWifiIpInput] = useState("");

    useEffect(() => {
        setWifiIpInput(localStorage.getItem("kds_wifi_printer_ip") || "");
    }, []);

    // Ref to track drag state immediately for polling logic
    const isDraggingRef = useRef(false);

    async function fetchOrders() {
        if (!activeWallet) return;
        // Skip updates if user is dragging to prevent layout shift / drop cancellation
        if (isDraggingRef.current) return;

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`/api/kitchen/orders?wallet=${activeWallet}&status=new,preparing,ready,completed,cancelled`, {
                headers: { "x-wallet": activeWallet },
                cache: "no-store",
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.error || "Failed to fetch orders");
                return;
            }

            const newOrders = (data.orders || []).filter((o: any) => {
                if (o.status === "cancelled") {
                    const cancelTime = o.cancelledAt || o.createdAt;
                    if (Date.now() - cancelTime > 5 * 60 * 1000) return false;
                }
                return true;
            });

            if (orders.length > 0) {
                const existingIds = new Set(orders.map(o => o.receiptId));
                const hasIncoming = newOrders.some((o: KitchenOrder) => !existingIds.has(o.receiptId) && o.kitchenStatus === 'new' && o.status !== 'cancelled');
                if (hasIncoming) {
                    try {
                        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZQQ0PVqzn77JfGAg+ltrzxnMpBSp+zPLaizsIGGS57OihUhELTKXh8bllHAU2jtX0zn8uBSh1xPDek0ELElyx5/CrWBgIOZrb88l3LQUme8rx2o08CBlpvO7mnkwPCFWr5O+0YxoGPJfY88yAMgYeb8Tv45xEDQ9XrujwsmEaCT6W2vTIdjAFKn/M8dqLPQgZZbzs6aJRDwpLpODyuWQdBTSL0/XPgTEFKXXE8N+UQgwQV6/n8LFdGgg7mtv1y3oxBSl+zPPaizsIG2m97OmiUQ8KTKXh8bllHAU2j9X0z4ExBil1xe/flkEMElez5/GsWhgJO5na88h1MAUoesy+fkLPg==");
                        audio.volume = 0.3;
                        audio.play().catch(() => { });
                    } catch { }
                }
            }

            setOrders(newOrders);
            setShopConfig(data.shop || null);
            setLastUpdate(Date.now());
        } catch (e: any) {
            setError(e?.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    }

    async function updateOrderStatus(receiptId: string, newStatus: string, uberOrderId?: string) {
        if (!activeWallet) return;

        setOrders(prev => prev.map(o => o.receiptId === receiptId ? { ...o, kitchenStatus: newStatus as any } : o));

        try {
            const response = await fetch("/api/kitchen/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-wallet": activeWallet },
                body: JSON.stringify({ receiptId, kitchenStatus: newStatus, uberOrderId }),
            });

            if (!response.ok) throw new Error("Failed to update status");
            // Delay fetch slightly to allow DB propagation, but check drag state inside fetchOrders
            setTimeout(fetchOrders, 1000);
        } catch (e: any) {
            console.error("Failed to update order status:", e);
            fetchOrders();
        }
    }

    useEffect(() => {
        fetchOrders();
        pollIntervalRef.current = window.setInterval(fetchOrders, 5000);
        return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    }, [activeWallet]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        isDraggingRef.current = true;
        setActiveId(event.active.id as string);
    };
    const handleDragEnd = (event: DragEndEvent) => {
        isDraggingRef.current = false;
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeOrder = orders.find(o => o.receiptId === active.id);
        if (!activeOrder) return;
        const overId = over.id as string;

        let targetStatus: string | null = null;
        if (["new", "preparing", "ready", "completed"].includes(overId)) {
            targetStatus = overId;
        } else {
            const overOrder = orders.find(o => o.receiptId === overId);
            if (overOrder) targetStatus = overOrder.kitchenStatus;
        }

        if (targetStatus && targetStatus !== activeOrder.kitchenStatus) {
            updateOrderStatus(activeOrder.receiptId, targetStatus, activeOrder.uberOrderId);
        }
    };

    const handleArchive = (id: string, uberOrderId?: string) => {
        updateOrderStatus(id, 'archived', uberOrderId);
    };

    // Bump handler for Expo view — advances order to next status
    const handleBump = (id: string, nextStatus: string, uberOrderId?: string) => {
        updateOrderStatus(id, nextStatus, uberOrderId);
    };

    const handleMarkItemReady = async (receiptId: string, itemIndex: number) => {
        if (!activeWallet) return;
        setOrders(prev => prev.map(o => {
            if (o.receiptId === receiptId) {
                const newItems = [...o.lineItems];
                newItems[itemIndex] = { ...newItems[itemIndex], readyAt: Date.now() };
                return { ...o, lineItems: newItems };
            }
            return o;
        }));
        try {
            const response = await fetch(`/api/orders/${receiptId}/edit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-wallet": activeWallet },
                body: JSON.stringify({ action: "mark_item_ready", itemIndex })
            });
            if (response.ok) fetchOrders();
        } catch (e) {
            console.error(e);
        }
    };

    const activeOrder = activeId ? orders.find(o => o.receiptId === activeId) : null;

    const cols = {
        new: orders.filter(o => o.kitchenStatus === 'new' || !o.kitchenStatus),
        preparing: orders.filter(o => o.kitchenStatus === 'preparing'),
        ready: orders.filter(o => o.kitchenStatus === 'ready'),
        completed: orders.filter(o => {
            if (o.kitchenStatus !== 'completed') return false;
            const completionTime = o.kitchenMetadata?.completedAt || o.createdAt;
            if (!completionTime) return true;
            const age = Date.now() - completionTime;
            return age < 30 * 60 * 1000;
        }),
    };

    if (!activeWallet) return <div className="p-8 text-center text-muted-foreground border rounded-xl bg-neutral-900/50 mt-20 mx-auto max-w-md">Connect wallet or access via /kitchen/[wallet] to view KDS</div>;

    return (
        <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
                className="h-screen w-full flex flex-col p-4 text-white"
                style={{
                    backgroundColor: tpTheme.primaryBg,
                    fontFamily: tpTheme.fontFamily || undefined,
                }}
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between px-2 mb-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            {shopConfig?.theme?.brandLogoUrl ? (
                                <img src={shopConfig.theme.brandLogoUrl} alt="Logo" className="h-8 object-contain rounded" />
                            ) : brand?.logos?.symbol || brand?.logos?.app ? (
                                <img src={brand.logos.symbol || brand.logos.app} alt="KDS" className="h-8 object-contain rounded" />
                            ) : (
                                <span className="text-emerald-500">◆</span>
                            )}
                            {shopConfig?.name ? `${shopConfig.name} Kitchen Display` : "Kitchen Display"}
                        </h2>
                        <div className="text-sm text-neutral-400 font-medium mt-1">
                            Live • {orders.length} Orders • Last Sync: {new Date(lastUpdate).toLocaleTimeString()}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex rounded-xl border border-white/10 overflow-hidden">
                            <button
                                onClick={() => setViewMode("board")}
                                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                                    viewMode === "board"
                                        ? "bg-white/10 text-white"
                                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                                    </svg>
                                    Board
                                </span>
                            </button>
                            <button
                                onClick={() => setViewMode("expo")}
                                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-l border-white/10 ${
                                    viewMode === "expo"
                                        ? "bg-white/10 text-white"
                                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Expo
                                </span>
                            </button>
                        </div>
                        {isNative && (
                            <button
                                onClick={() => setShowRotationSettings(true)}
                                className="px-4 py-3 text-sm font-bold uppercase tracking-wider border border-white/10 hover:bg-white/5 text-neutral-300 rounded-xl transition-colors hidden sm:flex items-center gap-2"
                                title={`Screen is currently: ${orientation}`}
                            >
                                🔄 Rotate
                            </button>
                        )}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="px-4 py-3 text-sm font-bold uppercase tracking-wider border border-white/10 hover:bg-white/5 text-neutral-300 rounded-xl transition-colors hidden sm:block"
                        >
                            ⚙️ Settings
                        </button>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="px-6 py-3 text-sm font-bold uppercase tracking-wider border border-red-900/40 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl transition-colors"
                            >
                                Lock KDS
                            </button>
                        )}
                        <button onClick={fetchOrders} className="px-6 py-3 text-sm font-bold uppercase tracking-wider border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white">
                            Sync
                        </button>
                    </div>
                </div>

                {/* Conditional View: Kanban Board or Expo View */}
                {viewMode === "expo" ? (
                    <ExpoView
                        orders={orders}
                        onBump={handleBump}
                        onArchive={handleArchive}
                    />
                ) : (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                        <KitchenColumn id="new" title="New" orders={cols.new} colorClass="bg-orange-500 text-orange-500" onMarkItemReady={handleMarkItemReady} />
                        <KitchenColumn id="preparing" title="Prep" orders={cols.preparing} colorClass="bg-yellow-500 text-yellow-500" onMarkItemReady={handleMarkItemReady} />
                        <KitchenColumn id="ready" title="Ready" orders={cols.ready} colorClass="bg-green-500 text-green-500" onMarkItemReady={handleMarkItemReady} />
                        <KitchenColumn id="completed" title="Served" orders={cols.completed} colorClass="bg-neutral-500 text-neutral-500" onArchive={handleArchive} onMarkItemReady={handleMarkItemReady} />
                    </div>
                )}

                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeOrder ? <KitchenTicket order={activeOrder} isOverlay onMarkItemReady={handleMarkItemReady} /> : null}
                </DragOverlay>

                {/* Local Hardware Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                ⚙️ Local Hardware Settings
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">✕</button>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Wi-Fi Printer IP Address</label>
                                    <input 
                                        type="text" 
                                        value={wifiIpInput}
                                        onChange={e => setWifiIpInput(e.target.value)}
                                        placeholder="e.g. 192.168.1.100"
                                        className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                                    />
                                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                                        If provided, the KDS will attempt to send expo tickets directly to this Wi-Fi IP address over the local network via Port 9100. If left blank, it will attempt to use a direct USB-connected printer.
                                    </p>
                                </div>

                                <button 
                                    onClick={() => {
                                        if (wifiIpInput.trim()) {
                                            localStorage.setItem("kds_wifi_printer_ip", wifiIpInput.trim());
                                        } else {
                                            localStorage.removeItem("kds_wifi_printer_ip");
                                        }
                                        setShowSettings(false);
                                    }}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
                                >
                                    Save Config
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local Hardware Screen Orientation Modal */}
                {showRotationSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                Screen Orientation Settings
                            </h3>
                            <button onClick={() => setShowRotationSettings(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">✕</button>

                            <div className="space-y-6">
                                {/* Soft API for Standard Tablets */}
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider">Standard Devices (Instant)</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setSoftRotation('auto')} className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${orientation === 'auto' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black border-neutral-800 text-neutral-300 hover:bg-neutral-900'}`}>Auto</button>
                                        <button onClick={() => setSoftRotation('portrait')} className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${orientation === 'portrait' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black border-neutral-800 text-neutral-300 hover:bg-neutral-900'}`}>Portrait</button>
                                        <button onClick={() => setSoftRotation('landscape')} className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${orientation === 'landscape' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black border-neutral-800 text-neutral-300 hover:bg-neutral-900'}`}>Landscape</button>
                                    </div>
                                </div>

                                <hr className="border-neutral-800" />

                                {/* Hard API for KDS & Firmware Locks */}
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Fixed Hardware Support
                                    </h4>
                                    <p className="text-[10px] text-amber-500/80 mb-3 font-semibold uppercase tracking-wider">⚠️ Requires OS Reboot</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => { if(window.confirm("This will physically reboot the operating system to commit the new orientation. Continue?")) { setHardRotation(0); setShowRotationSettings(false); } }} className="py-3 bg-black border border-neutral-800 hover:border-amber-500/50 hover:bg-amber-900/10 text-neutral-300 rounded-xl text-sm font-semibold transition-all">Force 0°</button>
                                        <button onClick={() => { if(window.confirm("This will physically reboot the operating system to commit the new orientation. Continue?")) { setHardRotation(1); setShowRotationSettings(false); } }} className="py-3 bg-black border border-neutral-800 hover:border-amber-500/50 hover:bg-amber-900/10 text-neutral-300 rounded-xl text-sm font-semibold transition-all">Force 90°</button>
                                        <button onClick={() => { if(window.confirm("This will physically reboot the operating system to commit the new orientation. Continue?")) { setHardRotation(2); setShowRotationSettings(false); } }} className="py-3 bg-black border border-neutral-800 hover:border-amber-500/50 hover:bg-amber-900/10 text-neutral-300 rounded-xl text-sm font-semibold transition-all">Force 180°</button>
                                        <button onClick={() => { if(window.confirm("This will physically reboot the operating system to commit the new orientation. Continue?")) { setHardRotation(3); setShowRotationSettings(false); } }} className="py-3 bg-black border border-neutral-800 hover:border-amber-500/50 hover:bg-amber-900/10 text-neutral-300 rounded-xl text-sm font-semibold transition-all">Force 270°</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DndContext>
    );
}
