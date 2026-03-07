"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { formatCurrency } from "@/lib/fx";
import { createPortal } from "react-dom";
import ReportsPanelv2 from "@/app/admin/panels/ReportsPanelv2";
import TeamManagementPanel from "@/components/admin/team/TeamManagementPanel";

interface AdminDashboardProps {
    merchantWallet: string;
    brandName?: string;
    logoUrl?: string;
    theme?: any;
    onLogout?: () => void;
    splitAddress?: string;
    reserveRatios?: Record<string, number>;
    accumulationMode?: "fixed" | "dynamic";
}

type ActiveTab = "activity" | "reports" | "team" | "settings";

export default function TerminalAdminDashboard({
    merchantWallet,
    brandName,
    logoUrl,
    theme,
    onLogout,
    splitAddress,
    reserveRatios,
    accumulationMode
}: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("activity");

    const tabStyle = (tab: ActiveTab) => ({
        borderBottom: activeTab === tab
            ? `2px solid var(--pp-secondary)`
            : "2px solid transparent",
        color: activeTab === tab
            ? `var(--pp-secondary)`
            : "#6b7280"
    });

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            className="h-10 w-10 object-contain rounded-lg"
                        />
                    )}
                    <div>
                        <h1 className="text-xl font-bold">{brandName || "Terminal"} Admin</h1>
                        <div className="text-xs text-muted-foreground font-mono">
                            {merchantWallet?.slice(0, 6)}...{merchantWallet?.slice(-4)}
                        </div>
                    </div>
                </div>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
                    >
                        Exit Admin
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border mb-6">
                {(["activity", "reports", "team", "settings"] as ActiveTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="term-admin-tab-menu-padding-inline py-3 text-sm font-semibold capitalize transition-colors hover:bg-muted/50"
                        style={tabStyle(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[60vh]">
                {activeTab === "activity" && (
                    <ActivityPanel merchantWallet={merchantWallet} theme={theme} />
                )}
                {activeTab === "reports" && (
                    <ReportsPanelv2 merchantWallet={merchantWallet} theme={theme} />
                )}
                {activeTab === "team" && (
                    <TeamManagementPanel merchantWallet={merchantWallet} theme={theme} />
                )}
                {activeTab === "settings" && (
                    <SettingsPanel
                        merchantWallet={merchantWallet}
                        theme={theme}
                        splitAddress={splitAddress}
                        reserveRatios={reserveRatios}
                        accumulationMode={accumulationMode}
                    />
                )}
            </div>
        </div>
    );
}

/* =========================
   ACTIVITY PANEL
   ========================= */
interface PanelProps {
    merchantWallet: string;
    theme?: any;
}

function ActivityPanel({ merchantWallet, theme }: PanelProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");

    useEffect(() => {
        loadOrders();
    }, [merchantWallet, dateRange]);

    async function loadOrders() {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date(now);

            if (dateRange === "today") {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === "week") {
                startDate.setDate(now.getDate() - 7);
            } else {
                startDate.setMonth(now.getMonth() - 1);
            }

            const startTs = Math.floor(startDate.getTime() / 1000);
            const endTs = Math.floor(now.getTime() / 1000);

            const res = await fetch(
                `/api/receipts?start=${startTs}&end=${endTs}&limit=100`,
                { headers: { "x-wallet": merchantWallet } }
            );
            const data = await res.json();
            // Map receipts to orders format
            const allOrders = (data.receipts || []).map((r: any) => ({
                id: r.receiptId,
                createdAt: r.createdAt,
                items: r.lineItems,
                status: r.status,
                totalUsd: r.totalUsd
            }));
            setOrders(allOrders);
        } catch (e) {
            console.error("Failed to load orders", e);
        } finally {
            setLoading(false);
        }
    }

    const stats = useMemo(() => {
        // Stats only reflect valid/paid transactions
        const valid = orders.filter(o => ["paid", "completed", "reconciled", "settled", "checkout_success", "confirmed", "tx_mined"].includes(o.status || ""));
        const total = valid.reduce((sum, o) => sum + (o.totalUsd || 0), 0);
        const count = valid.length;
        const avg = count > 0 ? total / count : 0;
        return { total, count, avg };
    }, [orders]);

    async function deleteOrder(id: string) {
        if (!confirm("Delete this receipt? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/receipts/${id}`, {
                method: "DELETE",
                headers: { "x-wallet": merchantWallet }
            });
            const j = await res.json();
            if (!res.ok || !j.ok) {
                alert(j.error || "Failed to delete");
                return;
            }
            loadOrders();
        } catch (e: any) {
            alert(e.message || "Failed to delete");
        }
    }

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-6">
                    <div className="text-sm text-muted-foreground mb-1">Total Sales</div>
                    <div className="text-3xl font-bold">{formatCurrency(stats.total, "USD")}</div>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <div className="text-sm text-muted-foreground mb-1">Transactions</div>
                    <div className="text-3xl font-bold">{stats.count}</div>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <div className="text-sm text-muted-foreground mb-1">Avg. Order</div>
                    <div className="text-3xl font-bold">{formatCurrency(stats.avg, "USD")}</div>
                </div>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                {(["today", "week", "month"] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${dateRange === range
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                            }`}
                        style={dateRange === range ? { backgroundColor: theme?.primaryColor } : {}}
                    >
                        {range === "today" ? "Today" : range === "week" ? "7 Days" : "30 Days"}
                    </button>
                ))}
                <button
                    onClick={loadOrders}
                    className="ml-auto px-3 py-1.5 text-sm border rounded-lg hover:bg-muted"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : orders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No transactions found for this period.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Time</th>
                                    <th className="px-4 py-3 text-left font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left font-medium">Items</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((order) => {
                                    const isPaid = ["paid", "completed", "reconciled", "settled", "checkout_success", "confirmed", "tx_mined"].includes(order.status || "");
                                    return (
                                        <tr key={order.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleString([], {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {order.id?.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3">
                                                {order.items?.length || 0} item(s)
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${isPaid
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : order.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                {formatCurrency(order.totalUsd || 0, "USD")}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => deleteOrder(order.id)}
                                                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                                                        title="Delete pending receipt"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================
   REPORTS PANEL
   ========================= */


/* =========================
   TEAM PANEL
   ========================= */
// TeamPanel logic moved to src/components/admin/team/TeamManagementPanel.tsx

// TeamMemberModal moved to src/components/admin/team/TeamManagementPanel.tsx

/* =========================
   SETTINGS PANEL
   ========================= */
/* =========================
   SETTINGS PANEL
   ========================= */
/* =========================
   SETTINGS PANEL
   ========================= */
import { ensureSplitForWallet } from "@/lib/thirdweb/split";
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { getContract, prepareContractCall, sendTransaction, prepareTransaction, readContract } from "thirdweb";
import { client, chain } from "@/lib/thirdweb/client";
import { getRpcClient, eth_getBalance } from "thirdweb/rpc";
// Removed duplicate React imports

function SettingsPanel({ merchantWallet, theme, splitAddress, reserveRatios, accumulationMode }: PanelProps & { splitAddress?: string; reserveRatios?: Record<string, number>; accumulationMode?: "fixed" | "dynamic" }) {
    const [subTab, setSubTab] = useState<"general" | "reserves">("general");

    const tabStyle = (tab: "general" | "reserves") => ({
        borderBottom: subTab === tab
            ? `2px solid var(--pp-secondary)`
            : "2px solid transparent",
        color: subTab === tab
            ? `var(--pp-secondary)`
            : "#6b7280"
    });

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex border-b border-border mb-6">
                <button
                    onClick={() => setSubTab("general")}
                    className="px-6 py-3 text-sm font-semibold capitalize transition-colors hover:bg-muted/50"
                    style={tabStyle("general")}
                >
                    General
                </button>
                <button
                    onClick={() => setSubTab("reserves")}
                    className="px-6 py-3 text-sm font-semibold capitalize transition-colors hover:bg-muted/50"
                    style={tabStyle("reserves")}
                >
                    Reserves
                </button>
            </div>

            {subTab === "general" && (
                <GeneralSettings
                    merchantWallet={merchantWallet}
                    theme={theme}
                    splitAddress={splitAddress}
                />
            )}

            {subTab === "reserves" && (
                <ReserveSettings
                    merchantWallet={merchantWallet}
                    theme={theme}
                    reserveRatios={reserveRatios}
                    accumulationMode={accumulationMode}
                    splitAddress={splitAddress}
                />
            )}
        </div>
    );
}

function GeneralSettings({ merchantWallet, theme, splitAddress }: { merchantWallet: string; theme: any; splitAddress?: string }) {
    const explorerUrl = "https://base.blockscout.com/address";
    const account = useActiveAccount();
    const [deploying, setDeploying] = useState(false);

    const handleDeploy = async () => {
        if (!account) return;
        if (confirm("This will deploy a new Revenue Split contract for your wallet. It may take a minute. Continue?")) {
            setDeploying(true);
            try {
                const addr = await ensureSplitForWallet(account);
                if (addr) {
                    alert("Split Deployed! The page will now reload.");
                    window.location.reload();
                } else {
                    alert("Deployment failed or was cancelled.");
                }
            } catch (e: any) {
                alert("Error: " + (e.message || "Unknown error"));
            } finally {
                setDeploying(false);
            }
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Terminal Settings</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p className="text-sm">
                        Configure default currency, receipt options, and more.
                    </p>
                    <div className="p-4 bg-muted/30 rounded-lg text-xs font-mono">
                        Terminal Version: 2.1.0 (Embedded)
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Wallet Configuration</h2>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Merchant Wallet (Owner)</label>
                        <div className="font-mono text-sm bg-muted/50 px-4 py-3 rounded-lg break-all flex items-center justify-between gap-4">
                            <span>{merchantWallet}</span>
                            <a
                                href={`${explorerUrl}/${merchantWallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium hover:underline shrink-0"
                                style={{ color: "var(--pp-secondary)" }}
                            >
                                View on Blockscout ↗
                            </a>
                        </div>
                    </div>

                    {splitAddress ? (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Split Address (Revenue Share)</label>
                            <div className="font-mono text-sm bg-muted/50 px-4 py-3 rounded-lg break-all flex items-center justify-between gap-4">
                                <span>{splitAddress}</span>
                                <a
                                    href={`${explorerUrl}/${splitAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium hover:underline shrink-0"
                                    style={{ color: "var(--pp-secondary)" }}
                                >
                                    View on Blockscout ↗
                                </a>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                * Payments are automatically split to this address.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Split Address (Revenue Share)</label>
                            <div className="p-4 bg-yellow-900/10 border border-yellow-900/20 rounded-lg">
                                <p className="text-sm mb-4 text-yellow-600 dark:text-yellow-400">
                                    No split contract deployed. Payments will go directly to your wallet.
                                    Deploy a split contract to enable automatic revenue sharing logic.
                                </p>
                                <button
                                    onClick={handleDeploy}
                                    disabled={deploying || !account}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
                                    style={{ backgroundColor: theme?.primaryColor }}
                                >
                                    {deploying ? "Deploying..." : "Deploy Split Contract"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ReserveSettingsProps {
    merchantWallet: string;
    theme: any;
    reserveRatios?: Record<string, number>;
    accumulationMode?: "fixed" | "dynamic";
    splitAddress?: string;
}

function ReserveSettings({ merchantWallet, theme, reserveRatios, accumulationMode = "fixed", splitAddress }: ReserveSettingsProps) {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);
    const [balances, setBalances] = useState<any>(null);
    const [splitInfo, setSplitInfo] = useState<{ merchantBps: number; feeBps: number } | null>(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [ratios, setRatios] = useState<Record<string, number>>(reserveRatios || {});
    const [mode, setMode] = useState<"fixed" | "dynamic">(accumulationMode);
    const [saving, setSaving] = useState(false);

    // Modulator / Risk Strategy Logic
    const [modulator, setModulator] = useState<number>(0.5);

    // Initialize modulator from ratios on load/edit
    useEffect(() => {
        if (isEditing && ratios) {
            setModulator(computeModulatorFromRatios(ratios));
        }
    }, [isEditing]);

    function computeTiltedRatios(base: Record<string, number>, mod: number): Record<string, number> {
        const stableTarget = Math.max(0, Math.min(1, 1 - mod));
        const growthTarget = Math.max(0, Math.min(1, mod));

        // Baseline weights if starting from scratch
        const sUSDC = Math.max(0, Number(base.USDC || 0.2));
        const sUSDT = Math.max(0, Number(base.USDT || 0.2));
        const sSum = sUSDC + sUSDT;
        // Normalize intra-group weights
        const sUSDCw = sSum > 0 ? sUSDC / sSum : 0.5;
        const sUSDTw = sSum > 0 ? sUSDT / sSum : 0.5;

        const gXRPb = Math.max(0, Number(base.cbXRP || 0.2));
        const gETHb = Math.max(0, Number(base.ETH || 0.2));
        const gBTCb = Math.max(0, Number(base.cbBTC || 0.2));
        const gSOLb = Math.max(0, Number(base.SOL || 0));

        // Weightings from main panel logic
        const wXRP = 1.2;
        const wETH = 1.0;
        const wBTC = 0.8;
        const wSOL = 1.0;

        let gXRPw = gXRPb * wXRP;
        let gETHw = gETHb * wETH;
        let gBTCw = gBTCb * wBTC;
        let gSOLw = gSOLb * wSOL;

        const gSum = gXRPw + gETHw + gBTCw + gSOLw;
        // Fallback defaults if group is empty
        if (gSum <= 0) {
            gXRPw = wXRP; gETHw = wETH; gBTCw = wBTC; gSOLw = wSOL;
        }
        const gNorm = gXRPw + gETHw + gBTCw + gSOLw;

        const newRatios: Record<string, number> = {
            USDC: +(stableTarget * sUSDCw).toFixed(4),
            USDT: +(stableTarget * sUSDTw).toFixed(4),
            cbXRP: +(growthTarget * (gXRPw / gNorm)).toFixed(4),
            ETH: +(growthTarget * (gETHw / gNorm)).toFixed(4),
            cbBTC: +(growthTarget * (gBTCw / gNorm)).toFixed(4),
            SOL: +(growthTarget * (gSOLw / gNorm)).toFixed(4),
        };

        // Normalize total to exactly 1.0
        const total = Object.values(newRatios).reduce((s, v) => s + v, 0);
        if (total > 0) {
            for (const k of Object.keys(newRatios)) newRatios[k] = +(newRatios[k] / total).toFixed(4);
        }
        return newRatios;
    }

    function computeModulatorFromRatios(next: Record<string, number>): number {
        const values = {
            USDC: Number(next.USDC || 0),
            USDT: Number(next.USDT || 0),
            cbBTC: Number(next.cbBTC || 0),
            cbXRP: Number(next.cbXRP || 0),
            ETH: Number(next.ETH || 0),
            SOL: Number(next.SOL || 0),
        };
        const stableShare = values.USDC + values.USDT;
        const wBtc = 0.8;
        const wEth = 1.0;
        const wXrp = 1.2;
        const wSol = 1.0;
        const weightedGrowth = values.cbBTC * wBtc + values.ETH * wEth + values.cbXRP * wXrp + values.SOL * wSol;
        const denom = stableShare + weightedGrowth;
        return denom > 0 ? +(weightedGrowth / denom).toFixed(2) : 0.5;
    }

    function handleSmartSliderChange(changedSymbol: string, newValue: number) {
        // "Smart Slider" logic matching main panel
        const tokens = ["USDC", "USDT", "cbBTC", "cbXRP", "ETH", "SOL"];
        const clampedValue = Math.max(0, Math.min(1, newValue));
        const remaining = 1 - clampedValue;

        const otherTokens = tokens.filter(t => t !== changedSymbol);
        const currentOthersSum = otherTokens.reduce((sum, t) => sum + (ratios[t] || 0), 0);

        const newRatios = { ...ratios, [changedSymbol]: clampedValue };

        if (currentOthersSum > 0) {
            otherTokens.forEach(token => {
                const proportion = (ratios[token] || 0) / currentOthersSum;
                newRatios[token] = +(remaining * proportion).toFixed(4);
            });
        } else {
            const equalShare = remaining / otherTokens.length;
            otherTokens.forEach(token => {
                newRatios[token] = +equalShare.toFixed(4);
            });
        }

        setRatios(newRatios);
        setModulator(computeModulatorFromRatios(newRatios));
    }

    // Handles the Risk Modulator slider
    function handleModulatorChange(val: number) {
        setModulator(val);
        const newRatios = computeTiltedRatios(ratios, val);
        setRatios(newRatios);
    }

    function applyPreset(type: "balanced" | "stable" | "growth" | "btc") {
        let target: Record<string, number> = {};
        if (type === "balanced") {
            target = { USDC: 0.2, USDT: 0.2, cbBTC: 0.15, cbXRP: 0.15, ETH: 0.15, SOL: 0.15 };
        } else if (type === "stable") {
            target = { USDC: 0.45, USDT: 0.45, cbBTC: 0.025, cbXRP: 0.025, ETH: 0.025, SOL: 0.025 };
        } else if (type === "growth") {
            target = { USDC: 0.1, USDT: 0.1, cbBTC: 0.2, cbXRP: 0.2, ETH: 0.2, SOL: 0.2 };
        } else if (type === "btc") {
            target = { USDC: 0.1, USDT: 0.1, cbBTC: 0.6, cbXRP: 0.05, ETH: 0.1, SOL: 0.05 };
        }
        setRatios(target);
        setModulator(computeModulatorFromRatios(target));
    }

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const fetchAll = async () => {
        try {
            // Fetch Analytics & Balances
            const res = await fetch(`/api/reserve/balances?wallet=${merchantWallet}`);
            const data = await res.json();
            if (data.indexedMetrics) {
                setAnalytics(data.indexedMetrics);
            }
            if (data.balances) {
                setBalances(data.balances);
            }

            // Fetch Split Config
            try {
                const splitRes = await fetch(`/api/split/deploy?wallet=${merchantWallet}`);
                const splitData = await splitRes.json();
                if (splitData?.split?.recipients && Array.isArray(splitData.split.recipients)) {
                    const recipients = splitData.split.recipients;
                    const merchantRec = recipients.find((r: any) => r.address.toLowerCase() === merchantWallet.toLowerCase());
                    const merchantBps = merchantRec ? Number(merchantRec.sharesBps || 0) : 0;
                    const feeBps = Math.max(0, 10000 - merchantBps);
                    setSplitInfo({ merchantBps, feeBps });
                }
            } catch (e) {
                console.error("Failed to fetch split config", e);
            }

        } catch (e) {
            console.error("Failed to load reserve data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [merchantWallet]);

    const handleSaveRatios = async () => {
        setSaving(true);
        try {
            // Validate sum <= 100%
            const total = Object.values(ratios).reduce((sum, v) => sum + v, 0);
            if (total > 1.0001) { // slight float tolerance
                alert(`Total reserve ratio cannot exceed 100% (Current: ${(total * 100).toFixed(1)}%)`);
                setSaving(false);
                return;
            }

            // Derive defaultPaymentToken from ratios if in fixed mode
            let defaultPaymentToken;
            if (mode === "fixed") {
                const found = Object.entries(ratios).find(([k, v]) => v >= 0.999);
                if (found) defaultPaymentToken = found[0];
            }

            const res = await fetch("/api/site/config", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": merchantWallet },
                body: JSON.stringify({
                    reserveRatios: ratios,
                    accumulationMode: mode,
                    defaultPaymentToken
                })
            });

            if (!res.ok) throw new Error("Failed to save configuration");

            setShowSuccessModal(true);
            // Don't reload immediately
        } catch (e: any) {
            alert(e.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------------------------------------
    // SEQUENTIAL WITHDRAWAL LOGIC
    // --------------------------------------------------------------------------------
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawQueue, setWithdrawQueue] = useState<string[]>([]);
    const [withdrawProcessed, setWithdrawProcessed] = useState(0);
    const [withdrawStatuses, setWithdrawStatuses] = useState<Record<string, { status: string; tx?: string; reason?: string }>>({});
    const [withdrawResults, setWithdrawResults] = useState<any[]>([]);
    const [isWithdrawingAll, setIsWithdrawingAll] = useState(false);

    // Formatter for modal messages
    function formatReleaseMessage(rr: { symbol?: string; status?: string; transactionHash?: string; reason?: string }): string {
        try {
            const sym = String(rr?.symbol || "").toUpperCase();
            const st = String(rr?.status || "");
            const statusLabel = st === "submitted" ? "Submitted" : st === "skipped" ? "Skipped" : st === "failed" ? "Failed" : st || "—";
            const parts: string[] = [`${sym}: ${statusLabel}`];
            if (rr?.reason) {
                const r = String(rr.reason || "");
                const friendly =
                    r === "not_due_payment" ? "No funds due" :
                        r === "signature_mismatch" ? "Method mismatch" :
                            r === "token_address_not_configured" ? "Address missing" : r;
                parts.push(friendly);
            }
            if (rr?.transactionHash) {
                parts.push(String(rr.transactionHash).slice(0, 10) + "…");
            }
            return parts.join(" • ");
        } catch {
            return `${String(rr?.symbol || "").toUpperCase()}: ${String(rr?.status || "")}`;
        }
    }

    // Helper: Identify preferred tokens for withdraw all
    function getWithdrawQueue(): string[] {
        if (!balances) return [];
        const preferred = ["ETH", "USDC", "USDT", "cbBTC", "cbXRP", "SOL"];
        return Object.entries(balances)
            .filter(([sym, info]: [string, any]) => preferred.includes(sym) && Number(info?.units || 0) > 0)
            .map(([sym]) => sym);
    }

    async function handleWithdrawAll() {
        if (!activeAccount) {
            alert("Wallet not connected");
            return;
        }

        // Ensure we have a split address
        let targetSplit = splitAddress;
        if (!targetSplit && balances?.splitAddressUsed) targetSplit = balances.splitAddressUsed;

        if (!targetSplit || !/^0x[a-f0-9]{40}$/i.test(targetSplit)) {
            alert("No split contract found settings.");
            return;
        }

        const queue = getWithdrawQueue();
        if (queue.length === 0) {
            alert("No balances available to withdraw.");
            return;
        }

        if (!confirm(`Ready to withdraw ${queue.join(", ")}?\n\nYou will be prompted to sign a transaction for each token.`)) {
            return;
        }

        // Initialize Modal State
        setIsWithdrawingAll(true);
        setWithdrawQueue(queue);
        setWithdrawProcessed(0);
        setWithdrawStatuses({});
        setWithdrawResults([]);
        setWithdrawModalOpen(true);

        const PAYMENT_SPLITTER_ABI = [
            { type: "function", name: "distribute", inputs: [], outputs: [], stateMutability: "nonpayable" },
            { type: "function", name: "distribute", inputs: [{ name: "token", type: "address" }], outputs: [], stateMutability: "nonpayable" },
        ] as const;

        const contract = getContract({
            client,
            chain,
            address: targetSplit as `0x${string}`,
            abi: PAYMENT_SPLITTER_ABI as any,
        });

        // Mapping for token addresses (using balances data or fallback)
        const getTokenAddr = (sym: string) => {
            if (balances?.[sym]?.address) return balances[sym].address;
            // Fallbacks if balances data missing address
            const envMap: Record<string, string | undefined> = {
                USDC: process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS,
                USDT: process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS,
                cbBTC: process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS,
                cbXRP: process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS,
                SOL: process.env.NEXT_PUBLIC_BASE_SOL_ADDRESS,
            };
            return envMap[sym] || undefined;
        };

        // Process Queue
        for (const symbol of queue) {
            try {
                let tx;
                if (symbol === "ETH") {
                    tx = (prepareContractCall as any)({
                        contract: contract as any,
                        method: "function distribute()",
                        params: [],
                    });
                } else {
                    const tAddr = getTokenAddr(symbol);
                    if (!tAddr || !/^0x[a-f0-9]{40}$/i.test(tAddr)) {
                        // Skip
                        const rr = { symbol, status: "skipped", reason: "token_address_not_configured" };
                        setWithdrawStatuses(prev => ({ ...prev, [symbol]: { status: rr.status, reason: rr.reason } }));
                        setWithdrawResults(prev => [...prev, rr]);
                        setWithdrawProcessed(p => p + 1);
                        continue;
                    }
                    tx = (prepareContractCall as any)({
                        contract: contract as any,
                        method: "function distribute(address token)",
                        params: [tAddr],
                    });
                }

                const sent = await sendTransaction({
                    account: activeAccount,
                    transaction: tx,
                });

                const txHash = (sent as any)?.transactionHash || (sent as any)?.hash;
                const rr = { symbol, transactionHash: txHash, status: "submitted" };

                setWithdrawStatuses(prev => ({ ...prev, [symbol]: { status: "submitted", tx: txHash } }));
                setWithdrawResults(prev => [...prev, rr]);

            } catch (err: any) {
                const raw = String(err?.message || err || "").toLowerCase();
                const isNotDue = raw.includes("not due payment");
                const stateStatus = isNotDue ? "skipped" : "failed";
                const reason = isNotDue ? "not_due_payment" : "error";

                setWithdrawStatuses(prev => ({ ...prev, [symbol]: { status: stateStatus, reason } }));
                setWithdrawResults(prev => [...prev, { symbol, status: stateStatus, reason }]);
            } finally {
                setWithdrawProcessed(p => p + 1);
            }
        }

        setIsWithdrawingAll(false);
        // Refresh after short delay
        setTimeout(() => fetchAll(), 2000);
    }


    const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});

    const handleWithdraw = async (symbol: string, tokenAddr?: string) => {
        if (!merchantWallet) return;

        // Ensure we have a split address
        let targetSplit = splitAddress;
        if (!targetSplit && balances?.splitAddressUsed) {
            targetSplit = balances.splitAddressUsed;
        }

        if (!targetSplit || !/^0x[a-f0-9]{40}$/i.test(targetSplit)) {
            alert("No split contract found. Please deploy one in General Settings first.");
            return;
        }

        if (!confirm(`Withdraw ${symbol}? This will distribute funds to your wallet and the platform.`)) return;

        setWithdrawing(prev => ({ ...prev, [symbol]: true }));

        try {
            // Minimal ABI for PaymentSplitter with distribute
            const PAYMENT_SPLITTER_ABI = [
                {
                    type: "function",
                    name: "distribute",
                    inputs: [],
                    outputs: [],
                    stateMutability: "nonpayable",
                },
                {
                    type: "function",
                    name: "distribute",
                    inputs: [{ name: "token", type: "address" }],
                    outputs: [],
                    stateMutability: "nonpayable",
                },
            ] as const;

            const contract = getContract({
                client,
                chain,
                address: targetSplit as `0x${string}`,
                abi: PAYMENT_SPLITTER_ABI as any,
            });

            const account = { address: merchantWallet } as any; // We need a signer, wait. useActiveAccount provides it? 
            // unique issue: merchantWallet prop might be different from connected account if admin is viewing? 
            // But in Terminal, we are usually the merchant. 
            // We should use the *connected* account to sign.

            // We need the ACTUAL signer from the hook, not just the address string passed as prop.
            // We don't have the signer object here easily unless we use the hook again or assume `client` handles it if we pass account?
            // `sendTransaction` needs the account object from `useActiveAccount`.
        } catch (e: any) {
            alert(e.message || "Withdrawal failed");
        } finally {
            setWithdrawing(prev => ({ ...prev, [symbol]: false }));
        }
    };

    // We need the active account object for signing
    const activeAccount = useActiveAccount();

    const executeWithdraw = async (symbol: string, tokenAddr?: string) => {
        if (!activeAccount) {
            alert("Wallet not connected");
            return;
        }

        // Verify ownership if needed, but contract will fail if not authorized usually (or allows anyone to distribute)
        // Split contracts usually allow anyone to call distribute/release.

        // Ensure we have a split address
        let targetSplit = splitAddress;
        if (!targetSplit && balances?.splitAddressUsed) {
            targetSplit = balances.splitAddressUsed;
        }

        if (!targetSplit || !/^0x[a-f0-9]{40}$/i.test(targetSplit)) {
            alert("No split contract found. Please deploy one in General Settings first.");
            return;
        }

        // if(!confirm(`Withdraw ${symbol}? This will distribute funds to your wallet and the platform.`)) return;

        setWithdrawing(prev => ({ ...prev, [symbol]: true }));

        try {
            const PAYMENT_SPLITTER_ABI = [
                {
                    type: "function",
                    name: "distribute",
                    inputs: [],
                    outputs: [],
                    stateMutability: "nonpayable",
                },
                {
                    type: "function",
                    name: "distribute",
                    inputs: [{ name: "token", type: "address" }],
                    outputs: [],
                    stateMutability: "nonpayable",
                },
            ] as const;

            const contract = getContract({
                client,
                chain,
                address: targetSplit as `0x${string}`,
                abi: PAYMENT_SPLITTER_ABI as any,
            });

            let tx;
            if (symbol === "ETH") {
                tx = (prepareContractCall as any)({
                    contract: contract as any,
                    method: "function distribute()",
                    params: [],
                });
            } else {
                if (!tokenAddr || !/^0x[a-f0-9]{40}$/i.test(tokenAddr)) {
                    throw new Error("Invalid token address for withdrawal");
                }
                tx = (prepareContractCall as any)({
                    contract: contract as any,
                    method: "function distribute(address token)",
                    params: [tokenAddr],
                });
            }

            await sendTransaction({
                account: activeAccount,
                transaction: tx,
            });

            alert("Withdrawal submitted! Balances will update shortly.");
            alert("Withdrawal submitted! Balances will update shortly.");

            setTimeout(() => {
                try { (window as any).triggerReserveRefresh?.(); } catch { }
                fetchAll();
            }, 2000);

        } catch (e: any) {
            console.error(e);
            alert(e.message || "Withdrawal failed");
        } finally {
            setWithdrawing(prev => ({ ...prev, [symbol]: false }));
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TRANSFER FEATURE — State, helpers, and wallet balance fetching
    // ────────────────────────────────────────────────────────────────────────────

    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferToken, setTransferToken] = useState<string>("ETH");
    const [transferRecipient, setTransferRecipient] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferStatus, setTransferStatus] = useState<string>("");
    const [transferError, setTransferError] = useState<string>("");
    const [walletBalances, setWalletBalances] = useState<Record<string, { raw: bigint; units: number; decimals: number }>>({});
    const [fetchingWalletBal, setFetchingWalletBal] = useState(false);
    const [qrScannerOpen, setQrScannerOpen] = useState(false);
    const [resolvingEns, setResolvingEns] = useState(false);

    // Token definitions — addresses from env vars
    const USDC_ADDR = process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "";
    const USDT_ADDR = process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS || "";
    const CBBTC_ADDR = process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS || "";
    const CBXRP_ADDR = process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS || "";
    const SOL_ADDR = process.env.NEXT_PUBLIC_BASE_SOL_ADDRESS || "";

    const USDC_DEC = Number(process.env.NEXT_PUBLIC_BASE_USDC_DECIMALS || 6);
    const USDT_DEC = Number(process.env.NEXT_PUBLIC_BASE_USDT_DECIMALS || 6);
    const CBBTC_DEC = Number(process.env.NEXT_PUBLIC_BASE_CBBTC_DECIMALS || 8);
    const CBXRP_DEC = Number(process.env.NEXT_PUBLIC_BASE_CBXRP_DECIMALS || 6);
    const SOL_DEC = Number(process.env.NEXT_PUBLIC_BASE_SOL_DECIMALS || 9);

    type TransferTokenDef = { symbol: string; type: "native" | "erc20"; address?: string; decimals: number };

    const transferTokenDefs: TransferTokenDef[] = useMemo(() => {
        const isValid = (a: string) => /^0x[a-fA-F0-9]{40}$/i.test(a);
        const defs: TransferTokenDef[] = [{ symbol: "ETH", type: "native", decimals: 18 }];
        if (isValid(USDC_ADDR)) defs.push({ symbol: "USDC", type: "erc20", address: USDC_ADDR, decimals: USDC_DEC });
        if (isValid(USDT_ADDR)) defs.push({ symbol: "USDT", type: "erc20", address: USDT_ADDR, decimals: USDT_DEC });
        if (isValid(CBBTC_ADDR)) defs.push({ symbol: "cbBTC", type: "erc20", address: CBBTC_ADDR, decimals: CBBTC_DEC });
        if (isValid(CBXRP_ADDR)) defs.push({ symbol: "cbXRP", type: "erc20", address: CBXRP_ADDR, decimals: CBXRP_DEC });
        if (isValid(SOL_ADDR)) defs.push({ symbol: "SOL", type: "erc20", address: SOL_ADDR, decimals: SOL_DEC });
        return defs;
    }, [USDC_ADDR, USDT_ADDR, CBBTC_ADDR, CBXRP_ADDR, SOL_ADDR]);

    function getTransferTokenDef(sym: string): TransferTokenDef | undefined {
        return transferTokenDefs.find(t => t.symbol === sym);
    }

    function parseToUnits(v: string, decimals: number): bigint {
        const n = Math.max(0, Number(v || 0));
        const s = n.toFixed(Math.max(0, Math.min(18, decimals)));
        const [w, f = ""] = s.split(".");
        const frac = (f + "0".repeat(decimals)).slice(0, decimals);
        return BigInt(w) * BigInt("1" + "0".repeat(decimals)) + BigInt(frac || "0");
    }

    function formatTokenUnits(raw: bigint, decimals: number): string {
        try {
            const n = Number(raw) / Math.pow(10, decimals);
            if (!isFinite(n)) return "~";
            return n.toLocaleString(undefined, { maximumFractionDigits: Math.min(6, decimals) });
        } catch { return "~"; }
    }

    function isValidAddress(addr: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(String(addr || ""));
    }

    // Fetch wallet balances for all supported tokens
    const fetchWalletBalances = async () => {
        if (!activeAccount?.address) return;
        setFetchingWalletBal(true);
        const newBals: Record<string, { raw: bigint; units: number; decimals: number }> = {};
        try {
            for (const tok of transferTokenDefs) {
                try {
                    let raw = BigInt(0);
                    if (tok.type === "native") {
                        const rpc = getRpcClient({ client, chain });
                        const hex = await eth_getBalance(rpc, { address: activeAccount.address as `0x${string}` });
                        raw = BigInt(hex);
                    } else if (tok.address) {
                        const contract = getContract({ client, chain, address: tok.address as `0x${string}` });
                        const res = await readContract({
                            contract,
                            method: "function balanceOf(address) view returns (uint256)",
                            params: [activeAccount.address as `0x${string}`],
                        });
                        raw = typeof res === "bigint" ? res : BigInt(String(res));
                    }
                    newBals[tok.symbol] = { raw, units: Number(raw) / Math.pow(10, tok.decimals), decimals: tok.decimals };
                } catch {
                    newBals[tok.symbol] = { raw: BigInt(0), units: 0, decimals: tok.decimals };
                }
            }
        } catch { }
        setWalletBalances(newBals);
        setFetchingWalletBal(false);
    };

    // Fetch wallet balances on mount and after withdrawals
    useEffect(() => {
        if (activeAccount?.address) fetchWalletBalances();
    }, [activeAccount?.address]);

    // Also refresh wallet balances when reserve balances change (after withdraw)
    useEffect(() => {
        if (activeAccount?.address && balances) {
            const timer = setTimeout(() => fetchWalletBalances(), 500);
            return () => clearTimeout(timer);
        }
    }, [balances]);

    // ENS resolution
    async function resolveEns(name: string): Promise<string | null> {
        try {
            setResolvingEns(true);
            const res = await fetch(`https://api.ensideas.com/ens/resolve/${encodeURIComponent(name)}`);
            const data = await res.json();
            return data?.address && isValidAddress(data.address) ? data.address : null;
        } catch { return null; } finally { setResolvingEns(false); }
    }

    function openTransferModal(symbol: string) {
        setTransferToken(symbol);
        setTransferRecipient("");
        setTransferAmount("");
        setTransferStatus("");
        setTransferError("");
        setTransferModalOpen(true);
    }

    // QR Scanner helpers — uses jsQR for universal canvas-based QR decoding
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    async function startQrScanner() {
        setQrScannerOpen(true);
        setTransferError("");
        try {
            if (!navigator?.mediaDevices?.getUserMedia) {
                setTransferError("Camera not available on this device.");
                setQrScannerOpen(false);
                return;
            }

            // Pre-check camera permissions if Permissions API is available
            if (navigator.permissions) {
                try {
                    const permStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
                    if (permStatus.state === "denied") {
                        setTransferError("Camera permission is blocked. Please enable camera access in your browser settings.");
                        setQrScannerOpen(false);
                        return;
                    }
                } catch {
                    // Permissions API may not support 'camera' query — proceed anyway
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Wait for video to be ready, then start scanning with jsQR
            const onReady = async () => {
                // Dynamically import jsQR to keep initial bundle smaller
                const jsQR = (await import("jsqr")).default;
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) return;

                // Scan loop at ~15fps
                scanIntervalRef.current = setInterval(() => {
                    const video = videoRef.current;
                    if (!video || !streamRef.current || video.readyState < 2) return;

                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });

                    if (code?.data) {
                        const val = code.data.trim();
                        // Extract address from ethereum: URI, raw address, or any text containing 0x
                        const match = val.match(/(?:ethereum:)?(0x[a-fA-F0-9]{40})/i);
                        if (match) {
                            setTransferRecipient(match[1]);
                            stopQrScanner();
                        }
                    }
                }, 66); // ~15fps
            };

            if (videoRef.current) {
                videoRef.current.addEventListener("loadeddata", onReady, { once: true });
            }
        } catch (e: any) {
            const msg = String(e?.message || "").toLowerCase();
            if (msg.includes("denied") || msg.includes("permission")) {
                setTransferError("Camera permission denied. Please allow camera access.");
            } else {
                setTransferError("Camera not available.");
            }
            setQrScannerOpen(false);
        }
    }

    function stopQrScanner() {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setQrScannerOpen(false);
    }

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getTokenIcon = (symbol: string) => {
        const ICONS: Record<string, string> = {
            ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
            USDC: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
            USDT: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
            cbBTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
            cbXRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
            SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
        };
        const url = ICONS[symbol];
        if (url) {
            return <img src={url} alt={symbol} className="w-8 h-8 rounded-full" />;
        }
        return (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                {symbol.slice(0, 3)}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                                style={{ backgroundColor: theme?.primaryColor ? `${theme.primaryColor}20` : '#22c55e20' }}
                            >
                                <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    style={{ color: theme?.primaryColor || '#22c55e' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-1">Configuration Saved</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your reserve strategy has been successfully updated and is now active.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setIsEditing(false);
                                    window.location.reload();
                                }}
                                className="w-full py-2.5 rounded-xl font-semibold text-primary-foreground hover:brightness-110 transition-all mt-2"
                                style={{ backgroundColor: theme?.primaryColor || '#22c55e' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Reserve Strategy</h2>
                        <p className="text-sm text-muted-foreground">Configure how your revenue is accumulated and diversified.</p>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-sm px-3 py-1.5 border rounded-lg hover:bg-muted font-medium transition-colors"
                        >
                            Edit Strategy
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setRatios(reserveRatios || {});
                                    setMode(accumulationMode || "fixed");
                                }}
                                className="text-sm px-3 py-1.5 hover:underline text-muted-foreground"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRatios}
                                disabled={saving}
                                className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:brightness-110 font-medium disabled:opacity-50 transition-all shadow-sm"
                                style={{ backgroundColor: theme?.primaryColor }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Strategy Config */}
                    <div className="space-y-6">
                        {/* Risk Strategy Controls (Only in Edit Mode) */}
                        {isEditing && (
                            <div className="p-4 rounded-xl border space-y-4 shadow-sm" style={{
                                backgroundColor: theme?.primaryColor ? `${theme.primaryColor}08` : "rgba(0,0,0,0.02)",
                                borderColor: theme?.primaryColor ? `${theme.primaryColor}20` : "var(--border)"
                            }}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">Risk Appetite</h3>
                                    <span className="text-xs font-mono bg-background border px-2 py-0.5 rounded">
                                        {(modulator * 100).toFixed(0)}% Growth
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={modulator}
                                    onChange={(e) => handleModulatorChange(parseFloat(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        accentColor: theme?.secondaryColor || theme?.primaryColor,
                                        background: `linear-gradient(to right, ${theme?.primaryColor || '#888'}40, ${theme?.secondaryColor || '#f00'}40)`
                                    }}
                                />
                                <div className="flex justify-between text-[10px] uppercase tracking-wider font-medium text-muted-foreground px-1">
                                    <span>Stable</span>
                                    <span>Balanced</span>
                                    <span>Growth</span>
                                </div>

                                <div className="flex gap-2 pt-2 overflow-x-auto pb-1">
                                    <button onClick={() => applyPreset("stable")} className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted whitespace-nowrap">Stable Focus</button>
                                    <button onClick={() => applyPreset("balanced")} className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted whitespace-nowrap">Balanced</button>
                                    <button onClick={() => applyPreset("growth")} className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted whitespace-nowrap">Growth</button>
                                    <button onClick={() => applyPreset("btc")} className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted whitespace-nowrap">BTC Max</button>
                                </div>
                            </div>
                        )}

                        {/* Mode Toggle */}
                        <div className="p-4 rounded-xl border space-y-3" style={{
                            backgroundColor: "rgba(0,0,0,0.2)",
                            borderColor: "var(--border)"
                        }}>
                            <div className="flex items-center justify-between">
                                <label className="font-medium text-sm">Accumulation Mode</label>
                                {isEditing ? (
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <button
                                            onClick={() => setMode("fixed")}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${mode === "fixed" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                                        >
                                            Fixed
                                        </button>
                                        <button
                                            onClick={() => setMode("dynamic")}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${mode === "dynamic" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                                        >
                                            Dynamic
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded capitalize">{mode}</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {mode === "fixed"
                                    ? "Revenue is settled entirely in the selected Default Payment Token."
                                    : "Revenue is intelligently rebalanced based on market volatility and portfolio targets."}
                            </p>
                        </div>

                        {/* Ratios */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Allocation</h3>
                                {isEditing && (
                                    <span className="text-xs text-muted-foreground">
                                        Total: <span className={`${Math.abs(Object.values(ratios).reduce((a, b) => a + b, 0) - 1) > 0.002 ? "text-amber-500" : "text-green-600"} font-bold`}>
                                            {(Object.values(ratios).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
                                        </span>
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* FIXED MODE: Single Token Selection */}
                                {mode === "fixed" ? (
                                    <div className="p-4 bg-muted/20 border border-muted rounded-xl space-y-3">
                                        <label className="text-sm font-medium">Default Payment Token</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["USDC", "USDT", "cbBTC", "cbXRP", "ETH", "SOL"].map((token) => {
                                                const val = isEditing ? (ratios[token] || 0) : (reserveRatios?.[token] || 0);
                                                const isSelected = val >= 0.99;
                                                return (
                                                    <button
                                                        key={token}
                                                        disabled={!isEditing}
                                                        onClick={() => {
                                                            const newRatios: Record<string, number> = {
                                                                USDC: 0, USDT: 0, cbBTC: 0, cbXRP: 0, ETH: 0, SOL: 0
                                                            };
                                                            newRatios[token] = 1;
                                                            setRatios(newRatios);
                                                        }}
                                                        className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${isSelected
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background " + (isEditing ? "hover:bg-muted" : "opacity-60")
                                                            }`}
                                                        style={isSelected ? { backgroundColor: theme?.primaryColor } : {}}
                                                    >
                                                        {getTokenIcon(token)}
                                                        <span className="font-semibold">{token}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            All revenue will be converted to the selected token.
                                        </p>
                                    </div>
                                ) : (
                                    /* DYNAMIC MODE: Sliders */
                                    <div className="space-y-4">
                                        {["USDC", "USDT", "cbBTC", "cbXRP", "ETH", "SOL"].map((token) => (
                                            <div key={token} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getTokenIcon(token)}
                                                        <span className="font-mono text-sm font-medium">{token}</span>
                                                    </div>
                                                    <span className="text-sm font-bold">
                                                        {isEditing
                                                            ? `${(ratios[token] ? ratios[token] * 100 : 0).toFixed(1)}%`
                                                            : `${(reserveRatios?.[token] ? reserveRatios[token] * 100 : 0).toFixed(1)}%`}
                                                    </span>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.001"
                                                        value={ratios[token] || 0}
                                                        onChange={(e) => handleSmartSliderChange(token, parseFloat(e.target.value))}
                                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                                        style={{ accentColor: theme?.secondaryColor || theme?.primaryColor }}
                                                    />
                                                ) : (
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all duration-500"
                                                            style={{
                                                                width: `${(reserveRatios?.[token] || 0) * 100}%`,
                                                                backgroundColor: theme?.secondaryColor || theme?.primaryColor || "#3b82f6"
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Fees & Summary */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Projected Fees</h3>
                            {splitInfo ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                        <span className="font-medium text-sm">Processing Fee</span>
                                        <span className="text-sm font-semibold text-red-500">{(splitInfo.feeBps / 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border-l-2 border-green-500">
                                        <span className="font-medium text-sm">Merchant Share</span>
                                        <span className="text-sm font-semibold text-green-600">{(splitInfo.merchantBps / 100).toFixed(2)}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 px-1">
                                        * Fee structure is determined by the deployed split contract and cannot be edited here.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
                                    {loading ? "Loading fee structure..." : "Fee structure unavailable."}
                                </div>
                            )}
                        </div>

                        {/* Help / Info Card */}
                        <div
                            className="p-4 rounded-xl border backdrop-blur-sm"
                            style={{
                                backgroundColor: theme?.primaryColor ? `${theme.primaryColor}10` : 'rgba(255, 255, 255, 0.05)',
                                borderColor: theme?.primaryColor ? `${theme.primaryColor}30` : 'rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <h4 className="font-semibold text-sm mb-2" style={{ color: theme?.primaryColor || 'inherit' }}>
                                About Reserves
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Reserves allow you to automatically accumulate revenue in a diversified portfolio.
                                <br /><br />
                                <strong className="text-foreground">Fixed Strategy</strong>: Revenue is settled entirely in the selected Default Payment Token.
                                <br />
                                <strong className="text-foreground">Dynamic Strategy</strong>: Revenue is rotated between assets to accumulate a portfolio matching your target ratios.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per Token Analytics */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Reserve Balances</h2>
                    <button
                        onClick={handleWithdrawAll}
                        disabled={isWithdrawingAll || loading || !balances}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
                        style={{ backgroundColor: theme?.primaryColor }}
                    >
                        {isWithdrawingAll ? "Processing..." : "Withdraw All"}
                    </button>
                </div>
                {loading ? (
                    <div className="text-sm text-muted-foreground">Loading balances...</div>
                ) : !balances ? (
                    <div className="text-sm text-muted-foreground">No balance data available.</div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(balances).map(([token, data]: [string, any]) => {
                            const wb = walletBalances[token];
                            const walletUnits = wb?.units || 0;
                            const tokDef = getTransferTokenDef(token);
                            return (
                                <div key={token} className="p-4 bg-muted/30 rounded-xl border hover:border-border/80 transition-colors space-y-3">
                                    {/* Token Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getTokenIcon(token)}
                                            <div className="font-bold text-base">{token}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatCurrency(data.usd || 0, "USD")}</div>
                                            {data.address && (
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    {data.address.slice(0, 6)}...{data.address.slice(-4)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reserve Balance Row */}
                                    <div className="flex items-center justify-between px-3 py-2 bg-background/50 rounded-lg">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Reserve Balance</div>
                                            <div className="text-sm font-mono font-semibold">
                                                {data.units?.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => executeWithdraw(token, data.address)}
                                            disabled={withdrawing[token] || !(data.units > 0)}
                                            className="text-[10px] px-3 py-1.5 bg-background border rounded-lg hover:bg-muted disabled:opacity-40 transition-colors font-medium"
                                        >
                                            {withdrawing[token] ? "Withdrawing..." : "Withdraw"}
                                        </button>
                                    </div>

                                    {/* My Wallet Balance Row */}
                                    <div className="flex items-center justify-between px-3 py-2 bg-background/50 rounded-lg">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">My Wallet</div>
                                            <div className="text-sm font-mono font-semibold">
                                                {fetchingWalletBal ? "..." : walletUnits.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openTransferModal(token)}
                                            disabled={!activeAccount || walletUnits <= 0 || !tokDef}
                                            className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-primary-foreground hover:brightness-110 disabled:opacity-40 transition-all"
                                            style={{ backgroundColor: theme?.primaryColor || '#3b82f6' }}
                                        >
                                            Transfer
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Lifetime Performance</h2>
                {loading ? (
                    <div className="text-sm text-muted-foreground">Loading analytics...</div>
                ) : !analytics ? (
                    <div className="text-sm text-muted-foreground">No analytics data available.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Volume</div>
                            <div className="text-xl font-bold">{formatCurrency(analytics.totalVolumeUsd || 0, "USD")}</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Earned (Net)</div>
                            <div className="text-xl font-bold" style={{ color: "var(--pp-secondary)" }}>{formatCurrency(analytics.merchantEarnedUsd || 0, "USD")}</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Customers</div>
                            <div className="text-xl font-bold">{analytics.customers || 0}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sequential Withdrawal Modal */}
            {
                withdrawModalOpen && typeof window !== "undefined" && createPortal(
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 transition-all duration-200"
                        onKeyDown={(e) => { if (e.key === "Escape" && !isWithdrawingAll) setWithdrawModalOpen(false); }}
                    >
                        <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold">Withdrawing Reserves</h3>
                                {!isWithdrawingAll && (
                                    <button
                                        onClick={() => setWithdrawModalOpen(false)}
                                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Progress Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{withdrawProcessed} / {Math.max(1, withdrawQueue.length)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-300 ease-out"
                                            style={{
                                                backgroundColor: theme?.primaryColor || '#22c55e',
                                                width: `${Math.min(100, Math.floor((withdrawProcessed / Math.max(1, withdrawQueue.length)) * 100))}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Status List */}
                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {withdrawQueue.map((sym, idx) => {
                                        const st = withdrawStatuses[sym];
                                        const isPending = !st && withdrawProcessed === idx;
                                        const isWaiting = !st && withdrawProcessed < idx;

                                        let statusColor = "text-muted-foreground";
                                        let icon = <div className="w-4 h-4 rounded-full border border-current opacity-30" />; // Empty circle

                                        if (isPending) {
                                            statusColor = "text-blue-500 animate-pulse";
                                            icon = (
                                                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                            );
                                        } else if (st?.status === "submitted") {
                                            statusColor = "text-green-500";
                                            icon = (
                                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">
                                                    ✓
                                                </div>
                                            );
                                        } else if (st?.status === "failed") {
                                            statusColor = "text-red-500";
                                            icon = <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">!</div>;
                                        } else if (st?.status === "skipped") {
                                            statusColor = "text-amber-500";
                                            icon = <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">-</div>;
                                        }

                                        return (
                                            <div key={sym} className={`flex items-center gap-3 p-2 rounded-lg border ${isPending ? "bg-muted/50 border-primary/20" : "bg-card border-transparent"}`}>
                                                <div className="shrink-0">{icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-medium ${isPending || st ? "text-foreground" : "text-muted-foreground"}`}>
                                                            Withdraw {sym}
                                                        </span>
                                                        {st?.tx && (
                                                            <a
                                                                href={`https://basescan.org/tx/${st.tx}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] hover:underline opacity-70"
                                                            >
                                                                View Tx ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className={`text-xs truncate ${statusColor}`}>
                                                        {st?.reason || (st?.status === "submitted" ? "Transaction Submitted" : isPending ? "Waiting for signature..." : isWaiting ? "Queued" : st?.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={() => setWithdrawModalOpen(false)}
                                        disabled={isWithdrawingAll}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted disabled:opacity-50 transition-colors"
                                    >
                                        {isWithdrawingAll ? "Processing..." : "Close"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* ── Transfer Modal ─────────────────────────────────────────────── */}
            {transferModalOpen && typeof window !== "undefined" && createPortal(
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 transition-all duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget && !qrScannerOpen) { setTransferModalOpen(false); stopQrScanner(); } }}
                >
                    <div className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                {getTokenIcon(transferToken)}
                                <h3 className="text-base font-bold">Transfer {transferToken}</h3>
                            </div>
                            <button
                                onClick={() => { setTransferModalOpen(false); stopQrScanner(); }}
                                className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-muted text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status Messages */}
                            {transferStatus && <div className="text-xs p-2 rounded-lg bg-green-500/10 text-green-600 font-medium">{transferStatus}</div>}
                            {transferError && <div className="text-xs p-2 rounded-lg bg-red-500/10 text-red-500 font-medium">{transferError}</div>}

                            {/* QR Scanner */}
                            {qrScannerOpen && (
                                <div className="relative rounded-xl overflow-hidden border bg-black aspect-square max-h-64 mx-auto">
                                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-48 border-2 border-white/40 rounded-xl" />
                                    </div>
                                    <button
                                        onClick={stopQrScanner}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                                    >
                                        ✕
                                    </button>
                                    <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
                                        Point at a wallet QR code
                                    </div>
                                </div>
                            )}

                            {/* Recipient Input */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Recipient</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={transferRecipient}
                                            onChange={(e) => { setTransferRecipient(e.target.value); setTransferError(""); }}
                                            onBlur={async () => {
                                                const v = transferRecipient.trim();
                                                if (v.endsWith(".eth") || v.endsWith(".xyz") || v.endsWith(".id")) {
                                                    const resolved = await resolveEns(v);
                                                    if (resolved) setTransferRecipient(resolved);
                                                    else setTransferError(`Could not resolve "${v}"`);
                                                }
                                            }}
                                            placeholder="0x... address or ENS name"
                                            className="w-full h-10 px-3 text-sm bg-background border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        {resolvingEns && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Paste Button */}
                                    <button
                                        onClick={async () => {
                                            try {
                                                const text = await navigator.clipboard.readText();
                                                if (text) setTransferRecipient(text.trim());
                                            } catch { }
                                        }}
                                        className="h-10 px-3 border rounded-lg hover:bg-muted transition-colors text-xs font-medium shrink-0"
                                        title="Paste from clipboard"
                                    >
                                        Paste
                                    </button>
                                    {/* QR Scan Button */}
                                    <button
                                        onClick={qrScannerOpen ? stopQrScanner : startQrScanner}
                                        className="h-10 w-10 border rounded-lg hover:bg-muted transition-colors shrink-0 flex items-center justify-center"
                                        title="Scan QR code"
                                    >
                                        {qrScannerOpen ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                                <circle cx="12" cy="13" r="4" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {isValidAddress(transferRecipient) && (
                                    <div className="text-[10px] text-green-600 mt-1 font-mono">
                                        ✓ Valid address: {transferRecipient.slice(0, 6)}...{transferRecipient.slice(-4)}
                                    </div>
                                )}
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Amount</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={transferAmount}
                                            onChange={(e) => { setTransferAmount(e.target.value); setTransferError(""); }}
                                            placeholder={`0.00 ${transferToken}`}
                                            className="w-full h-10 px-3 text-sm bg-background border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const wb = walletBalances[transferToken];
                                            if (wb) {
                                                // For ETH, leave a small amount for gas
                                                if (transferToken === "ETH") {
                                                    const gasReserve = BigInt("500000000000000"); // 0.0005 ETH for gas
                                                    const maxRaw = wb.raw > gasReserve ? wb.raw - gasReserve : BigInt(0);
                                                    setTransferAmount(formatTokenUnits(maxRaw, wb.decimals));
                                                } else {
                                                    setTransferAmount(formatTokenUnits(wb.raw, wb.decimals));
                                                }
                                            }
                                        }}
                                        className="h-10 px-3 border rounded-lg hover:bg-muted transition-colors text-xs font-medium shrink-0"
                                    >
                                        Max
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <div className="text-[10px] text-muted-foreground">
                                        Available: {fetchingWalletBal ? "..." : (walletBalances[transferToken] ? formatTokenUnits(walletBalances[transferToken].raw, walletBalances[transferToken].decimals) : "0")} {transferToken}
                                    </div>
                                    {(() => {
                                        const wb = walletBalances[transferToken];
                                        const tokDef = getTransferTokenDef(transferToken);
                                        if (wb && tokDef && transferAmount) {
                                            const desired = parseToUnits(transferAmount, tokDef.decimals);
                                            if (desired > wb.raw) return <div className="text-[10px] text-red-500 font-medium">Insufficient balance</div>;
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>

                            {/* Send Button */}
                            <TransactionButton
                                transaction={() => {
                                    const tokDef = getTransferTokenDef(transferToken);
                                    if (!tokDef) throw new Error("Unsupported token");
                                    if (!isValidAddress(transferRecipient)) throw new Error("Invalid recipient address");
                                    const units = parseToUnits(transferAmount, tokDef.decimals);
                                    if (units <= BigInt(0)) throw new Error("Enter a valid amount");

                                    if (tokDef.type === "native") {
                                        return prepareTransaction({
                                            client,
                                            chain,
                                            to: transferRecipient as `0x${string}`,
                                            value: units,
                                        });
                                    } else {
                                        if (!tokDef.address) throw new Error("Token address not configured");
                                        const contract = getContract({
                                            client,
                                            chain,
                                            address: tokDef.address as `0x${string}`,
                                        });
                                        return prepareContractCall({
                                            contract,
                                            method: "function transfer(address to, uint256 value)",
                                            params: [transferRecipient as `0x${string}`, units],
                                        });
                                    }
                                }}
                                style={{ backgroundColor: theme?.primaryColor || '#3b82f6', width: '100%' }}
                                className="w-full py-3 rounded-xl font-semibold text-primary-foreground hover:brightness-110 transition-all text-sm"
                                disabled={
                                    !activeAccount?.address ||
                                    !isValidAddress(transferRecipient) ||
                                    !transferAmount ||
                                    Number(transferAmount || 0) <= 0 ||
                                    (() => {
                                        const wb = walletBalances[transferToken];
                                        const tokDef = getTransferTokenDef(transferToken);
                                        if (wb && tokDef) return parseToUnits(transferAmount, tokDef.decimals) > wb.raw;
                                        return true;
                                    })()
                                }
                                onTransactionSent={() => {
                                    setTransferStatus("Transaction submitted. Awaiting confirmation...");
                                    setTransferError("");
                                }}
                                onError={(e) => {
                                    setTransferError(e?.message ? String(e.message).slice(0, 200) : "Transaction failed");
                                    setTransferStatus("");
                                }}
                                onTransactionConfirmed={() => {
                                    setTransferStatus("Transfer confirmed!");
                                    setTransferAmount("");
                                    setTransferRecipient("");
                                    // Refresh wallet balances
                                    setTimeout(() => fetchWalletBalances(), 1500);
                                    setTimeout(() => {
                                        setTransferModalOpen(false);
                                        setTransferStatus("");
                                    }, 2000);
                                }}
                            >
                                Send {transferToken}
                            </TransactionButton>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
}
