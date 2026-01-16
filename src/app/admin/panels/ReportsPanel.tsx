"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Lock, FileText, Download, Calendar, User, Building2, ChevronRight, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/fx";

// Types
type MerchantProfile = {
    id: string; // team member id
    merchantWallet: string;
    role: string;
    name: string;
    merchantName?: string;
    logo?: string;
};

export default function ReportsPanel() {
    const account = useActiveAccount();

    // Multi-Org State
    const [profiles, setProfiles] = useState<MerchantProfile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<MerchantProfile | null>(null);

    // Auth State
    const [pin, setPin] = useState("");
    const [unlocked, setUnlocked] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // Report State
    const [reportType, setReportType] = useState("z-report");
    const [range, setRange] = useState("today"); // today, yesterday, week, month
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");

    // 1. Fetch Profiles on Load
    useEffect(() => {
        if (!account?.address) return;
        setLoadingProfiles(true);
        fetch(`/api/admin/reports/access?wallet=${account.address}`)
            .then(res => res.json())
            .then(data => {
                const list = data.profiles || [];
                setProfiles(list);
                // Auto-select if only one
                if (list.length === 1) {
                    setSelectedProfile(list[0]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingProfiles(false));
    }, [account?.address]);

    // 2. Unlock Handler
    async function handleUnlock(e?: React.FormEvent) {
        e?.preventDefault();
        if (!selectedProfile || !pin) return;

        setAuthLoading(true);
        setAuthError("");

        try {
            // Verify PIN by "mock login" against Auth API
            // We use the Terminal Auth route but with our intent
            const res = await fetch("/api/terminal/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pin,
                    merchantWallet: selectedProfile.merchantWallet
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Invalid PIN");

            // Access Granted
            if (data.role !== "manager") throw new Error("Only Managers can access reports.");

            setUnlocked(true);
            setPin(""); // Clear sensitive data
            loadDashboard(selectedProfile.merchantWallet);

        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    }

    // 3. Load Dashboard Stats
    async function loadDashboard(wallet: string) {
        setReportLoading(true);
        setReportError("");
        try {
            const { start, end } = getDateRange(range);
            // We need a session ID? No, the new report API supports "Admin Wallet" via headers too
            // But actually we are passing `x-wallet` (merchant) and relying on the implementation to verify via Linked Wallet
            // Let's pass `x-linked-wallet` header as per my API logic

            const res = await fetch(`/api/terminal/reports?type=${reportType}&start=${start}&end=${end}&format=json`, {
                headers: {
                    "x-wallet": wallet,
                    "x-linked-wallet": account?.address || ""
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load report");
            setDashboardStats(data);
        } catch (e: any) {
            setReportError(e.message);
        } finally {
            setReportLoading(false);
        }
    }

    // Utility: Date Ranges
    function getDateRange(r: string) {
        const now = new Date();
        let start = new Date();
        let end = new Date(); // now

        if (r === "today") {
            start.setHours(0, 0, 0, 0);
        } else if (r === "yesterday") {
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - 1);
            end.setHours(23, 59, 59, 999);
        } else if (r === "week") {
            start.setDate(now.getDate() - 7);
        } else if (r === "month") {
            start.setMonth(now.getMonth() - 1);
        }

        return {
            start: Math.floor(start.getTime() / 1000),
            end: Math.floor(end.getTime() / 1000)
        };
    }

    // Reload when range/type changes (if unlocked)
    useEffect(() => {
        if (unlocked && selectedProfile) {
            loadDashboard(selectedProfile.merchantWallet);
        }
    }, [range, reportType]);

    // 4. Download Handler
    async function handleDownload() {
        if (!selectedProfile) return;
        setReportLoading(true);
        try {
            const { start, end } = getDateRange(range);
            const url = `/api/terminal/reports?type=${reportType}&start=${start}&end=${end}&format=zip`;

            // We need to fetch with headers, so we can't just open the window.location
            // Using fetch-blob-download pattern
            const res = await fetch(url, {
                headers: {
                    "x-wallet": selectedProfile.merchantWallet,
                    "x-linked-wallet": account?.address || ""
                }
            });
            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const dUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = dUrl;
            a.download = `${reportType}-${range}-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();

        } catch (e: any) {
            setReportError(e.message);
        } finally {
            setReportLoading(false);
        }
    }


    // --- RENDERING ---

    if (loadingProfiles) {
        return <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2"><Loader2 className="animate-spin" /> Loading access...</div>;
    }

    // STEP 1: SELECT MERCHANT
    if (!selectedProfile) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Reports Access</h2>
                    <p className="text-muted-foreground">Select a merchant profile to view reports.</p>
                </div>

                {profiles.length === 0 ? (
                    <div className="p-8 border rounded-xl bg-muted/20 text-center">
                        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg">No Access Found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2">
                            Your wallet is not linked to any merchant profiles as a Manager.
                            Ask the business owner to add you as a Manager and link your wallet address.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profiles.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProfile(p)}
                                className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-background border flex items-center justify-center">
                                    {p.logo ? <img src={p.logo} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-muted-foreground" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold truncate">{p.merchantName || "Unknown Merchant"}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <User className="w-3 h-3" /> {p.name} ({p.role})
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // STEP 2: ENTER PIN
    if (!unlocked) {
        return (
            <div className="max-w-md mx-auto mt-12 space-y-6">
                <button onClick={() => setSelectedProfile(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to selection
                </button>

                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Enter PIN</h2>
                    <p className="text-muted-foreground">
                        Enter your secure PIN for <b>{selectedProfile.merchantName}</b>
                    </p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <input
                        type="password"
                        autoFocus
                        placeholder="••••"
                        className="w-full text-center text-3xl tracking-widest p-4 rounded-xl border bg-background"
                        maxLength={6}
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    />
                    {authError && <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{authError}</div>}
                    <button
                        type="submit"
                        disabled={authLoading || pin.length < 4}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:brightness-110 disabled:opacity-50"
                    >
                        {authLoading ? "Verifying..." : "Unlock Reports"}
                    </button>
                </form>
            </div>
        );
    }

    // STEP 3: DASHBOARD
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {selectedProfile.logo && <img src={selectedProfile.logo} className="w-6 h-6 rounded-full object-cover" />}
                        <span className="text-sm text-muted-foreground font-medium">{selectedProfile.merchantName}</span>
                        <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-mono">{selectedProfile.role}</span>
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Reporting Dashboard
                        {reportLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setUnlocked(false); setSelectedProfile(null); }} className="px-3 py-2 text-sm border rounded-lg hover:bg-muted">
                        Switch Store
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={reportLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> Export ZIP
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-card">
                <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold block mb-1">Report Type</label>
                    <select
                        value={reportType}
                        onChange={e => setReportType(e.target.value)}
                        className="w-full p-2 rounded-lg border bg-background"
                    >
                        <option value="z-report">Z-Report (End of Day)</option>
                        <option value="x-report">X-Report (Snapshot)</option>
                        <option value="employee">Employee Performance</option>
                        <option value="hourly">Hourly Sales</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold block mb-1">Time Range</label>
                    <div className="flex rounded-lg border bg-background p-1">
                        {["today", "yesterday", "week", "month"].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-colors ${range === r ? "bg-primary text-primary-foreground font-bold shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error */}
            {reportError && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">{reportError}</div>}

            {/* Visualization */}
            {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Summary Cards */}
                    <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Sales"
                            value={formatCurrency(dashboardStats.summary?.totalSales || 0, "USD")}
                            sub="Gross Revenue"
                        />
                        <StatCard
                            label="Tips"
                            value={formatCurrency(dashboardStats.summary?.totalTips || 0, "USD")}
                            sub="Gruntuity"
                        />
                        <StatCard
                            label="Transactions"
                            value={dashboardStats.summary?.transactionCount || 0}
                            sub="Total Orders"
                        />
                        <StatCard
                            label="Average Order"
                            value={formatCurrency(dashboardStats.summary?.averageOrderValue || 0, "USD")}
                            sub="Per Transaction"
                        />
                    </div>

                    {/* Report Specific View */}
                    <div className="md:col-span-4 border rounded-xl p-6 bg-card min-h-[300px]">
                        <h3 className="text-lg font-bold mb-4 capitalize">{reportType.replace("-", " ")} Details</h3>

                        {/* Dynamic Content based on Type */}
                        {reportType === "employee" && dashboardStats.employees && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase text-muted-foreground border-b">
                                        <tr>
                                            <th className="py-3">Staff ID</th>
                                            <th className="py-3 text-right">Sales</th>
                                            <th className="py-3 text-right">Tips</th>
                                            <th className="py-3 text-right">Orders</th>
                                            <th className="py-3 text-right">Avg Ticket</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dashboardStats.employees.map((e: any) => (
                                            <tr key={e.id}>
                                                <td className="py-3 font-medium">{e.id}</td>
                                                <td className="py-3 text-right">{formatCurrency(e.sales, "USD")}</td>
                                                <td className="py-3 text-right">{formatCurrency(e.tips, "USD")}</td>
                                                <td className="py-3 text-right">{e.count}</td>
                                                <td className="py-3 text-right">{formatCurrency(e.aov, "USD")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {(reportType === "z-report" || reportType === "x-report") && dashboardStats.paymentMethods && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Payment Breakdown</h4>
                                <div className="space-y-2">
                                    {dashboardStats.paymentMethods.map((m: any) => (
                                        <div key={m.method} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                            <span className="font-medium">{m.method}</span>
                                            <span className="font-mono">{formatCurrency(m.total, "USD")}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reportType === "hourly" && (
                            <div className="h-64 flex items-end gap-1 pt-4 pb-0 px-2 overflow-x-auto">
                                {dashboardStats.hourly?.map((h: any) => (
                                    <div key={h.hour} className="flex-1 flex flex-col justify-end items-center group min-w-[20px]">
                                        <div
                                            className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-all relative"
                                            style={{ height: `${Math.max(4, (h.amount / (Math.max(...dashboardStats.hourly.map((x: any) => x.amount) || 1)) * 100))}%` }}
                                        >
                                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                                {formatCurrency(h.amount, "USD")}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">{h.hour}:00</div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string, value: string | number, sub: string }) {
    return (
        <div className="p-4 rounded-xl border bg-card hover:bg-muted/10 transition-colors">
            <div className="text-xs text-muted-foreground uppercase font-semibold">{label}</div>
            <div className="text-2xl font-bold my-1">{value}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
    );
}
