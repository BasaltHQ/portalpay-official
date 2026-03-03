"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { FileText, Download, Calendar, User, Loader2, Printer, Table2, DollarSign, Receipt, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/fx";
import { EnhancedStatCard, VolumeVsTipsBar, PaymentMethodDonut, VerticalBarChart, DonutChart, HorizontalBarChart } from "@/components/admin/ReportCharts";
import { isValorAvailable, printValorReport } from "@/lib/valor-printer";
import { useTheme } from "@/contexts/ThemeContext";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * ReportsPanelMerchant — Merchant-level reporting panel.
 * Shows stats and reports for the connected merchant wallet.
 * Placed under the "Merchant" sidebar group.
 */
export default function ReportsPanelMerchant() {
    const account = useActiveAccount();
    const { theme } = useTheme();
    const merchantWallet = (account?.address || "").toLowerCase();

    const [reportType, setReportType] = useState("z-report");
    const [range, setRange] = useState("today");
    const [customStart, setCustomStart] = useState(() => new Date().toISOString().split("T")[0]);
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");

    const [employeeFilter, setEmployeeFilter] = useState("");
    const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [feedback, setFeedback] = useState<{ open: boolean; title: string; message: string; type: "success" | "error" | "info" }>({
        open: false, title: "", message: "", type: "info",
    });

    function getDateRange(r: string) {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (r === "custom") {
            const [sY, sM, sD] = customStart.split("-").map(Number);
            start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
            const [eY, eM, eD] = customEnd.split("-").map(Number);
            end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
        } else if (r === "today") {
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
            end: Math.floor(end.getTime() / 1000),
        };
    }

    async function loadDashboard() {
        if (!merchantWallet) return;
        setReportLoading(true);
        setReportError("");
        try {
            const { start, end } = getDateRange(range);
            let apiUrl = `/api/terminal/reports?type=${reportType}&start=${start}&end=${end}&format=json`;
            if (employeeFilter) apiUrl += `&employeeId=${encodeURIComponent(employeeFilter)}`;

            const res = await fetch(apiUrl, {
                headers: {
                    "x-wallet": merchantWallet,
                    "x-linked-wallet": account?.address || "",
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load report");
            setDashboardStats(data);

            if (data.employees && employees.length === 0) {
                setEmployees(data.employees.map((e: any) => ({ id: e.id, name: e.name || e.id })));
            }
        } catch (e: any) {
            setReportError(e.message);
        } finally {
            setReportLoading(false);
        }
    }

    useEffect(() => {
        if (merchantWallet) {
            if (range === "custom" && (!customStart || !customEnd)) return;
            loadDashboard();
        }
    }, [range, reportType, merchantWallet, customStart, customEnd, employeeFilter]);

    async function downloadReport(format: "pdf" | "zip") {
        setReportLoading(true);
        try {
            const { start, end } = getDateRange(range);
            const url = `/api/terminal/reports?type=${reportType}&start=${start}&end=${end}&format=${format}&wallet=${merchantWallet}&linkedWallet=${account?.address || ""}&t=${Date.now()}`;
            const res = await fetch(url, {
                headers: { "x-wallet": merchantWallet, "x-linked-wallet": account?.address || "" },
            });
            if (!res.ok) throw new Error(`Download failed: ${res.status}`);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = window.URL.createObjectURL(blob);
            a.download = `${reportType}-${range}-${new Date().toISOString().split("T")[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e: any) {
            setReportError(e.message);
        } finally {
            setReportLoading(false);
        }
    }

    function exportExcel() {
        if (!dashboardStats) return;
        try {
            const rows: string[][] = [];

            // Summary
            rows.push(["Merchant Report", reportType.replace("-", " ").toUpperCase()]);
            rows.push(["Date Range", range]);
            rows.push([]);
            rows.push(["Metric", "Value"]);
            rows.push(["Total Sales", String(dashboardStats.summary?.totalSales || 0)]);
            rows.push(["Total Tips", String(dashboardStats.summary?.totalTips || 0)]);
            rows.push(["Transactions", String(dashboardStats.summary?.transactionCount || 0)]);
            rows.push(["Average Order", String(dashboardStats.summary?.averageOrderValue || 0)]);
            rows.push([]);

            // Payment methods
            if (dashboardStats.paymentMethods?.length) {
                rows.push(["Payment Method", "Total"]);
                for (const pm of dashboardStats.paymentMethods) {
                    rows.push([pm.method, String(pm.total)]);
                }
                rows.push([]);
            }

            // Employees
            if (dashboardStats.employees?.length) {
                rows.push(["Staff", "Sales", "Tips", "Orders", "Avg Order", "Sessions"]);
                for (const e of dashboardStats.employees) {
                    rows.push([e.name || e.id, String(e.sales), String(e.tips), String(e.count), String(e.aov), String(e.sessionCount || 1)]);
                }
                rows.push([]);
            }

            // Hourly
            if (dashboardStats.hourly?.length) {
                rows.push(["Hour", "Amount"]);
                for (const h of dashboardStats.hourly) {
                    rows.push([`${h.hour}:00`, String(h.amount)]);
                }
            }

            const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const BOM = "\uFEFF";
            const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `merchant-report-${range}-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e: any) {
            setReportError(e.message);
        }
    }

    async function handleEmailReport() {
        if (!emailInput) {
            setFeedback({ open: true, title: "Missing Email", message: "Please enter an email address.", type: "error" });
            return;
        }
        setEmailDialogOpen(false);
        setReportLoading(true);
        try {
            const { start, end } = getDateRange(range);
            const titleMap: Record<string, string> = { "z-report": "End of Day", "x-report": "Sales Snapshot", employee: "Staff Performance", hourly: "Hourly Sales" };
            const res = await fetch("/api/terminal/reports/email", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": merchantWallet },
                body: JSON.stringify({ email: emailInput, reportType: titleMap[reportType] || "Report", startTs: start, endTs: end }),
            });
            const j = await res.json();
            if (j.success) setFeedback({ open: true, title: "Report Sent", message: "The report has been successfully queued for delivery.", type: "success" });
            else throw new Error(j.error || "Failed to send");
        } catch (e: any) {
            setFeedback({ open: true, title: "Delivery Failed", message: e.message, type: "error" });
        } finally {
            setReportLoading(false);
        }
    }

    async function printReport() {
        if (!dashboardStats) return;
        if (isValorAvailable()) {
            try {
                await printValorReport(dashboardStats, reportType, range, theme?.brandName || "Merchant Terminal");
                return;
            } catch { /* fallthrough */ }
        }
        const w = window.open("", "_blank", "width=400,height=600");
        if (!w) return;
        const dateStr = new Date().toLocaleString();
        const startStr = new Date(Math.floor(dashboardStats.meta.range.start * 1000)).toLocaleDateString();
        const typeTitle = reportType.replace("-", " ").toUpperCase();
        w.document.write(`<html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;width:300px;font-size:12px;margin:0;padding:10px;color:#000}.header{text-align:center;margin-bottom:20px;border-bottom:1px dashed #000;padding-bottom:10px}.title{font-size:16px;font-weight:bold}.row{display:flex;justify-content:space-between;margin-bottom:4px}.bold{font-weight:bold}.footer{text-align:center;margin-top:20px;font-size:10px;color:#555}</style></head><body><div class="header"><div class="title">${theme?.brandName || "Merchant"}</div><div>${typeTitle}</div><div>${startStr}</div></div><div class="row bold"><span>TOTAL SALES</span><span>${formatCurrency(dashboardStats.summary.totalSales, "USD")}</span></div><div class="row"><span>Transactions</span><span>${dashboardStats.summary.transactionCount}</span></div><div class="row"><span>Tips</span><span>${formatCurrency(dashboardStats.summary.totalTips, "USD")}</span></div><div class="footer">Generated: ${dateStr}</div><script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script></body></html>`);
        w.document.close();
    }

    if (!merchantWallet) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <div className="text-sm">Connect your wallet to view reports.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground font-medium">Merchant Report</span>
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Reporting Dashboard
                        {reportLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                    </h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={printReport} disabled={reportLoading || !dashboardStats} className="h-8 flex items-center gap-2 px-3 bg-card border hover:bg-muted text-foreground rounded-lg disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all">
                        <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button onClick={() => setEmailDialogOpen(true)} disabled={reportLoading} className="h-8 flex items-center gap-2 px-3 bg-secondary text-secondary-foreground rounded-lg hover:brightness-95 disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider border border-secondary">
                        <FileText className="w-3.5 h-3.5" /> Email
                    </button>
                    <button onClick={() => downloadReport("pdf")} disabled={reportLoading} className="h-8 flex items-center gap-2 px-3 bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50 shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={exportExcel} disabled={reportLoading || !dashboardStats} className="h-8 flex items-center gap-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider">
                        <Table2 className="w-3.5 h-3.5" /> Excel
                    </button>
                    <button onClick={() => downloadReport("zip")} disabled={reportLoading} className="h-8 flex items-center gap-2 px-3 bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider shadow-sm opacity-80">
                        <Download className="w-3.5 h-3.5" /> ZIP
                    </button>
                </div>
            </div>

            {/* Email Modal */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email Report</DialogTitle>
                        <DialogDescription>Send the {reportType.replace("-", " ")} ({range}) to recipient(s).</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input placeholder="Enter email addresses (comma separated)" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <button onClick={() => setEmailDialogOpen(false)} className="px-4 py-2 text-sm rounded hover:bg-muted">Cancel</button>
                        <button onClick={handleEmailReport} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:brightness-110">Send Report</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Feedback Modal */}
            <Dialog open={feedback.open} onOpenChange={(open) => setFeedback((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={feedback.type === "error" ? "text-red-500" : "text-green-500"}>{feedback.title}</DialogTitle>
                        <DialogDescription>{feedback.message}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button onClick={() => setFeedback((prev) => ({ ...prev, open: false }))} className="px-4 py-2 bg-primary text-primary-foreground rounded">OK</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-xl bg-card">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Report Type</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[{ id: "z-report", label: "Z-Report" }, { id: "x-report", label: "X-Report" }, { id: "employee", label: "Staff" }, { id: "hourly", label: "Hourly" }].map((t) => (
                            <button key={t.id} onClick={() => setReportType(t.id)} className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${reportType === t.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Staff Filter</span>
                    </div>
                    <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="w-full h-[38px] px-3 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-primary">
                        <option value="">All Staff</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Date Range</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex bg-muted/20 p-1 rounded-lg border flex-1">
                            {["today", "yesterday", "week", "month", "custom"].map((r) => (
                                <button key={r} onClick={() => setRange(r)} className={`flex-1 text-[11px] uppercase font-bold tracking-wide py-2 rounded-md transition-all ${range === r ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                        {range === "custom" && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-[38px] px-3 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-primary" />
                                <span className="text-muted-foreground text-xs">to</span>
                                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-[38px] px-3 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-primary" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {reportError && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">{reportError}</div>}

            {/* Stats and Details */}
            {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <EnhancedStatCard icon={DollarSign} label="Total Sales" value={formatCurrency(dashboardStats.summary?.totalSales || 0, "USD")} sub="Gross Revenue" accent="text-indigo-500" />
                        <EnhancedStatCard icon={TrendingUp} label="Tips" value={formatCurrency(dashboardStats.summary?.totalTips || 0, "USD")} sub="Gratuity" accent="text-green-500" />
                        <EnhancedStatCard icon={Receipt} label="Transactions" value={dashboardStats.summary?.transactionCount || 0} sub="Total Orders" accent="text-blue-500" />
                        <EnhancedStatCard icon={BarChart3} label="Average Order" value={formatCurrency(dashboardStats.summary?.averageOrderValue || 0, "USD")} sub="Per Transaction" accent="text-amber-500" />
                    </div>

                    {/* Analytics Row */}
                    {(dashboardStats.summary?.totalSales > 0 || dashboardStats.summary?.totalTips > 0) && (
                        <div className="md:col-span-4 rounded-xl border bg-card p-5">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Revenue Breakdown
                            </h3>
                            <VolumeVsTipsBar
                                volume={dashboardStats.summary?.totalSales || 0}
                                tips={dashboardStats.summary?.totalTips || 0}
                            />
                        </div>
                    )}

                    <div className="md:col-span-4 border rounded-xl p-6 bg-card min-h-[300px]">
                        <h3 className="text-lg font-bold mb-4 capitalize">{reportType.replace("-", " ")} Details</h3>

                        {reportType === "employee" && dashboardStats.employees && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase text-muted-foreground border-b">
                                        <tr>
                                            <th className="py-3">Staff</th>
                                            <th className="py-3 text-right">Sales</th>
                                            <th className="py-3 text-right">Tips</th>
                                            <th className="py-3 text-right">Orders</th>
                                            <th className="py-3 text-right">Avg Ticket</th>
                                            <th className="py-3 text-right">Sessions</th>
                                            <th className="py-3 text-right">Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dashboardStats.employees.map((e: any) => (
                                            <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3">
                                                    <div className="font-medium">{e.name || e.id}</div>
                                                    {e.name && e.name !== e.id && <div className="text-xs text-muted-foreground">{e.id}</div>}
                                                </td>
                                                <td className="py-3 text-right font-mono">{formatCurrency(e.sales, "USD")}</td>
                                                <td className="py-3 text-right font-mono text-green-500">{formatCurrency(e.tips, "USD")}</td>
                                                <td className="py-3 text-right">{e.count}</td>
                                                <td className="py-3 text-right font-mono">{formatCurrency(e.aov, "USD")}</td>
                                                <td className="py-3 text-right">{e.sessionCount || 1}</td>
                                                <td className="py-3 text-right text-muted-foreground">{e.activeHours ? `${e.activeHours}h` : "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {(reportType === "z-report" || reportType === "x-report") && dashboardStats.paymentMethods && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Payment Methods</h4>
                                        <PaymentMethodDonut methods={dashboardStats.paymentMethods} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">By Volume</h4>
                                        <HorizontalBarChart
                                            data={dashboardStats.paymentMethods.map((m: any) => ({ label: m.method, value: m.total }))}
                                            maxBars={6}
                                        />
                                    </div>
                                </div>

                                {dashboardStats.sessions && dashboardStats.sessions.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Session History</h4>
                                        <div className="space-y-2">
                                            {dashboardStats.sessions.map((s: any) => (
                                                <div key={s.id} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="font-medium">{s.staffName || "Unknown Staff"}</span>
                                                            {s.isActive && <span className="ml-2 text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Active</span>}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{s.durationFormatted || "-"}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Started</span>
                                                            <div className="font-mono">{new Date(s.startTime * 1000).toLocaleTimeString()}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Sales</span>
                                                            <div className="font-mono">{formatCurrency(s.totalSales || 0, "USD")}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Tips</span>
                                                            <div className="font-mono text-green-500">{formatCurrency(s.totalTips || 0, "USD")}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {reportType === "hourly" && (
                            <div className="rounded-xl border bg-muted/5 p-4">
                                <VerticalBarChart
                                    data={(dashboardStats.hourly || []).map((h: any) => ({ label: `${h.hour}:00`, value: h.amount }))}
                                    height={240}
                                    barColor="#6366f1"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
    return (
        <div className="p-4 rounded-xl border bg-card hover:bg-muted/10 transition-colors">
            <div className="text-xs text-muted-foreground uppercase font-semibold">{label}</div>
            <div className="text-2xl font-bold my-1">{value}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
    );
}
