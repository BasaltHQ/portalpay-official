"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Lock, FileText, Download, Calendar, User, Building2, ChevronRight, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/fx";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

    // Modal State
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [feedback, setFeedback] = useState<{ open: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
        open: false, title: "", message: "", type: 'info'
    });

    // ... (logic for fetch/unlock remains same, skipping lines for brevity if possible, but replace needs context)
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

    // 4. Download Handler (Renamed to bust cache)
    async function downloadReportAction(format: "zip" | "pdf" = "zip") {
        if (!selectedProfile) return;

        const linkedWallet = account?.address;
        if (!linkedWallet) {
            setReportError("Wallet not connected. Please connect your wallet to download reports.");
            return;
        }

        setReportLoading(true);
        try {
            const { start, end } = getDateRange(range);
            // Append auth params and timestamp to force uniqueness
            const url = `/api/terminal/reports?type=${reportType}&start=${start}&end=${end}&format=${format}&wallet=${selectedProfile.merchantWallet}&linkedWallet=${linkedWallet}&t=${Date.now()}`;

            // BLOCKING DEBUG - User must see this!
            alert(`Generating URL: \n${url}`);
            console.log("Downloading Report from:", url);

            // We need to fetch with headers, so we can't just open the window.location
            // Using fetch-blob-download pattern
            const res = await fetch(url, {
                headers: {
                    "x-wallet": selectedProfile.merchantWallet,
                    "x-linked-wallet": linkedWallet
                }
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Download failed: ${res.status} ${txt}`);
            }

            const blob = await res.blob();
            const dUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = dUrl;
            a.download = `${reportType}-${range}-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();

        } catch (e: any) {
            alert(`Error: ${e.message}`);
            setReportError(e.message);
        } finally {
            setReportLoading(false);
        }
    }

    // 5. Email Handler
    async function handleEmailReport() {
        if (!selectedProfile) return;
        if (!emailInput) {
            setFeedback({ open: true, title: "Missing Email", message: "Please enter an email address.", type: 'error' });
            return;
        }

        setEmailDialogOpen(false);
        setReportLoading(true);
        try {
            const { start, end } = getDateRange(range);
            // Map internal report types to PDF titles
            const titleMap: Record<string, string> = {
                "z-report": "End of Day",
                "x-report": "Sales Summary", // X-Report is snapshot/summary
                "employee": "Session Summary", // Employee focus
                "hourly": "End of Day" // Hourly usually fits in EOD
            };
            const rType = titleMap[reportType] || "End of Day";

            const res = await fetch(`/api/terminal/reports/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": selectedProfile.merchantWallet
                },
                body: JSON.stringify({
                    email: emailInput,
                    reportType: rType,
                    startTs: start,
                    endTs: end
                })
            });
            const j = await res.json();
            if (j.success) {
                setFeedback({ open: true, title: "Report Sent", message: "The report has been successfully queued for delivery.", type: 'success' });
            } else {
                throw new Error(j.error || "Failed to send");
            }
        } catch (e: any) {
            setFeedback({ open: true, title: "Delivery Failed", message: e.message, type: 'error' });
        } finally {
            setReportLoading(false);
        }
    }


    // --- RENDERING ---

    return (
        <div className="w-full space-y-6 pb-24 px-4 sm:px-6 lg:px-8">
            {loadingProfiles ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2"><Loader2 className="animate-spin" /> Loading access...</div>
            ) : !selectedProfile ? (
                <div className="space-y-6">
                    <div className="glass-pane rounded-xl border p-5">
                        <h2 className="text-xl font-bold tracking-tight">Reports Access</h2>
                        <p className="text-xs text-muted-foreground/70 mt-1 max-w-2xl">Select a merchant profile to view reports.</p>
                    </div>

                    {profiles.length === 0 ? (
                        <div className="p-8 border border-foreground/10 rounded-xl glass-pane text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5 shadow-inner mb-4 border border-foreground/10">
                                <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg">No Access Found</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
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
                                    className="flex items-center gap-4 p-4 border border-foreground/10 rounded-xl glass-pane hover:bg-foreground/[0.03] hover:border-foreground/20 transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-background border border-foreground/10 flex items-center justify-center">
                                        {p.logo ? <img src={p.logo} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold truncate">{p.merchantName || "Unknown Merchant"}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                                            <User className="w-3 h-3" /> {p.name} ({p.role})
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : !unlocked ? (
                <div className="max-w-md mx-auto mt-12 space-y-6">
                    <button onClick={() => setSelectedProfile(null)} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to selection
                    </button>

                    <div className="glass-pane border rounded-2xl p-8 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Enter PIN</h2>
                            <p className="text-sm text-muted-foreground/80 mt-1">
                                Enter your secure PIN for <b className="text-foreground">{selectedProfile.merchantName}</b>
                            </p>
                        </div>

                        <form onSubmit={handleUnlock} className="space-y-6">
                            <input
                                type="password"
                                autoFocus
                                placeholder="••••"
                                className="w-full text-center text-4xl tracking-[1em] p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                                maxLength={6}
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                            />
                            {authError && <div className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg font-medium">{authError}</div>}
                            <button
                                type="submit"
                                disabled={authLoading || pin.length < 4}
                                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all"
                            >
                                {authLoading ? "Verifying Identity..." : "Unlock Reports"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Header */}
                    <div className="glass-pane rounded-xl border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                {selectedProfile.logo && <img src={selectedProfile.logo} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10" />}
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold">{selectedProfile.merchantName}</span>
                                <span className="px-1.5 py-0.5 bg-foreground/10 rounded text-[9px] font-bold uppercase tracking-widest">{selectedProfile.role}</span>
                            </div>
                            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                                Reporting Dashboard
                                {reportLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                            </h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setUnlocked(false); setSelectedProfile(null); }} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-foreground/10 rounded-lg hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground">
                                Switch Store
                            </button>
                            <button
                                onClick={() => setEmailDialogOpen(true)}
                                disabled={reportLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:brightness-110 shadow-lg shadow-secondary/10 disabled:opacity-50 transition-all"
                            >
                                <FileText className="w-4 h-4" /> Email Report
                            </button>
                            <button
                                onClick={() => downloadReportAction("pdf")}
                                disabled={reportLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 shadow-lg shadow-primary/10 disabled:opacity-50 transition-all"
                            >
                                <FileText className="w-4 h-4" /> PDF
                            </button>
                            <button
                                onClick={() => downloadReportAction("zip")}
                                disabled={reportLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                            >
                                <Download className="w-4 h-4" /> Export ZIP
                            </button>
                        </div>
                    </div>

                    {/* Email Modal */}
                    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Email Report</DialogTitle>
                                <DialogDescription>
                                    Send the {reportType.replace("-", " ")} ({range}) to recipient(s).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-2">
                                <Input
                                    placeholder="Enter email addresses (comma separated)"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="bg-foreground/[0.03] border-foreground/10 focus-visible:ring-primary/50"
                                />
                            </div>
                            <DialogFooter>
                                <button onClick={() => setEmailDialogOpen(false)} className="px-4 py-2 text-sm rounded hover:bg-muted">Cancel</button>
                                <button onClick={handleEmailReport} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:brightness-110">Send Report</button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Feedback Modal */}
                    <Dialog open={feedback.open} onOpenChange={(open) => setFeedback(prev => ({ ...prev, open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className={feedback.type === 'error' ? "text-red-500" : "text-green-500"}>
                                    {feedback.title}
                                </DialogTitle>
                                <DialogDescription>
                                    {feedback.message}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <button onClick={() => setFeedback(prev => ({ ...prev, open: false }))} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                                    OK
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border rounded-xl glass-pane">
                        <div>
                            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold block mb-1.5">Report Type</label>
                            <select
                                value={reportType}
                                onChange={e => setReportType(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                            >
                                <option value="z-report">Z-Report (End of Day)</option>
                                <option value="x-report">X-Report (Snapshot)</option>
                                <option value="employee">Employee Performance</option>
                                <option value="hourly">Hourly Sales</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold block mb-1.5">Time Range</label>
                            <div className="flex rounded-lg border border-foreground/10 bg-foreground/[0.02] p-1 h-[42px]">
                                {["today", "yesterday", "week", "month"].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRange(r)}
                                        className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-all font-semibold tracking-wide ${range === r ? "bg-primary text-black shadow-sm" : "hover:bg-foreground/5 text-muted-foreground"}`}
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
                            <div className="md:col-span-4 border rounded-xl p-6 glass-pane min-h-[300px]">
                                <h3 className="text-lg font-semibold tracking-tight mb-5 capitalize flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                    {reportType.replace("-", " ")} Details
                                </h3>

                                {/* Dynamic Content based on Type */}
                                {reportType === "employee" && dashboardStats.employees && (
                                    <div className="overflow-x-auto rounded-xl border border-foreground/5">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/70 bg-foreground/[0.02] border-b border-foreground/5">
                                                <tr>
                                                    <th className="py-3 px-4">Staff ID</th>
                                                    <th className="py-3 px-4 text-right">Sales</th>
                                                    <th className="py-3 px-4 text-right">Tips</th>
                                                    <th className="py-3 px-4 text-right">Orders</th>
                                                    <th className="py-3 px-4 text-right">Avg Ticket</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-foreground/5 bg-foreground/[0.01]">
                                                {dashboardStats.employees.map((e: any) => (
                                                    <tr key={e.id} className="hover:bg-foreground/[0.02] transition-colors">
                                                        <td className="py-3 px-4 font-medium">{e.id}</td>
                                                        <td className="py-3 px-4 text-right">{formatCurrency(e.sales, "USD")}</td>
                                                        <td className="py-3 px-4 text-right">{formatCurrency(e.tips, "USD")}</td>
                                                        <td className="py-3 px-4 text-right">{e.count}</td>
                                                        <td className="py-3 px-4 text-right">{formatCurrency(e.aov, "USD")}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {(reportType === "z-report" || reportType === "x-report") && dashboardStats.paymentMethods && (
                                    <div className="bg-foreground/[0.01] rounded-xl border border-foreground/5 p-4">
                                        <h4 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-4">Payment Breakdown</h4>
                                        <div className="space-y-2">
                                            {dashboardStats.paymentMethods.map((m: any) => (
                                                <div key={m.method} className="flex justify-between items-center p-3 rounded-lg bg-foreground/[0.02] border border-foreground/5 hover:border-foreground/10 transition-colors">
                                                    <span className="font-semibold text-sm">{m.method}</span>
                                                    <span className="font-mono text-sm">{formatCurrency(m.total, "USD")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {reportType === "hourly" && (
                                    <div className="h-64 flex items-end gap-1.5 pt-4 pb-0 px-2 overflow-x-auto bg-foreground/[0.01] rounded-xl border border-foreground/5 p-4 mt-2">
                                        {dashboardStats.hourly?.map((h: any) => (
                                            <div key={h.hour} className="flex-1 flex flex-col justify-end items-center group min-w-[24px]">
                                                <div
                                                    className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t-sm hover:brightness-125 transition-all relative"
                                                    style={{ height: `${Math.max(4, (h.amount / (Math.max(...dashboardStats.hourly.map((x: any) => x.amount) || 1)) * 100))}%` }}
                                                >
                                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 shadow-lg font-medium transition-opacity">
                                                        {formatCurrency(h.amount, "USD")}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-medium mt-2">{h.hour}:00</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string, value: string | number, sub: string }) {
    return (
        <div className="glass-pane border rounded-xl p-5 relative overflow-hidden group">
            <div className="text-[10px] text-muted-foreground/70 uppercase font-semibold tracking-wider">{label}</div>
            <div className="text-2xl font-bold my-1 relative z-10">{value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider relative z-10">{sub}</div>
            
            {/* Subtle inner gradient hover effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
}
