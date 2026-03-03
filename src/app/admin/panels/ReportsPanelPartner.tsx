"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { FileText, Download, Search, ChevronDown, ChevronRight, Loader2, Table2, Building2, DollarSign, TrendingUp, Receipt, Users, BarChart3, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/fx";
import { EnhancedStatCard, VolumeVsTipsBar, RevenueBreakdown, MerchantGrid, HorizontalBarChart } from "@/components/admin/ReportCharts";

/**
 * ReportsPanelPartner — Partner/Admin-level reports panel.
 * Aggregates stats across all merchants under the partner container.
 * Placed under the "Partner/Admin" sidebar group.
 */
export default function ReportsPanelPartner() {
    const account = useActiveAccount();
    const wallet = (account?.address || "").toLowerCase();

    const [range, setRange] = useState("week");
    const [customStart, setCustomStart] = useState(() => new Date().toISOString().split("T")[0]);
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
    const [merchantDetail, setMerchantDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sortBy, setSortBy] = useState<"totalSales" | "transactionCount" | "name">("totalSales");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
        } else if (r === "all") {
            start = new Date(0);
        }

        return {
            start: Math.floor(start.getTime() / 1000),
            end: Math.floor(end.getTime() / 1000),
        };
    }

    async function loadData() {
        if (!wallet) return;
        setLoading(true);
        setError("");
        try {
            const { start, end } = getDateRange(range);
            const res = await fetch(`/api/admin/partner-reports?start=${start}&end=${end}`, {
                headers: { "x-wallet": wallet },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to load");
            setData(json);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (wallet) {
            if (range === "custom" && (!customStart || !customEnd)) return;
            loadData();
        }
    }, [range, wallet, customStart, customEnd]);

    async function loadMerchantDetail(merchantWallet: string) {
        if (expandedMerchant === merchantWallet) {
            setExpandedMerchant(null);
            setMerchantDetail(null);
            return;
        }
        setExpandedMerchant(merchantWallet);
        setDetailLoading(true);
        try {
            const { start, end } = getDateRange(range);
            const res = await fetch(
                `/api/terminal/reports?type=z-report&start=${start}&end=${end}&format=json`,
                {
                    headers: {
                        "x-wallet": merchantWallet,
                        "x-linked-wallet": wallet,
                    },
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Unable to load");
            setMerchantDetail(json);
        } catch (e: any) {
            setMerchantDetail({ error: e.message });
        } finally {
            setDetailLoading(false);
        }
    }

    function exportPDF() {
        if (!data?.merchants?.length) return;
        // Generate a printable HTML report
        const w = window.open("", "_blank", "width=800,height=600");
        if (!w) return;
        const dateStr = new Date().toLocaleString();
        const aggregate = data.aggregate;

        const merchantRows = filteredMerchants
            .map(
                (m: any) =>
                    `<tr><td>${m.name}</td><td class="right">${formatCurrency(m.totalSales, "USD")}</td><td class="right">${formatCurrency(m.totalTips, "USD")}</td><td class="right">${m.transactionCount}</td><td class="right">${formatCurrency(m.averageOrderValue, "USD")}</td></tr>`
            )
            .join("");

        w.document.write(`<html><head><title>Partner Report</title><style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; }
            .stat-card .label { font-size: 10px; text-transform: uppercase; color: #888; }
            .stat-card .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 10px; text-transform: uppercase; color: #888; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .footer { margin-top: 20px; font-size: 10px; color: #888; text-align: center; }
        </style></head><body>
            <h1>Partner Reports</h1>
            <div class="meta">Date Range: ${range} | Generated: ${dateStr}</div>
            <div class="stats">
                <div class="stat-card"><div class="label">Total Sales</div><div class="value">${formatCurrency(aggregate.totalSales, "USD")}</div></div>
                <div class="stat-card"><div class="label">Tips</div><div class="value">${formatCurrency(aggregate.totalTips, "USD")}</div></div>
                <div class="stat-card"><div class="label">Transactions</div><div class="value">${aggregate.transactionCount}</div></div>
                <div class="stat-card"><div class="label">Merchants</div><div class="value">${aggregate.merchantCount}</div></div>
            </div>
            <table><thead><tr><th>Merchant</th><th class="right">Sales</th><th class="right">Tips</th><th class="right">Txns</th><th class="right">Avg Order</th></tr></thead>
            <tbody>${merchantRows}</tbody></table>
            <div class="footer">Partner Report — ${dateStr}</div>
            <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script>
        </body></html>`);
        w.document.close();
    }

    function exportExcel() {
        if (!data?.merchants?.length) return;
        try {
            const rows: string[][] = [];
            rows.push(["Partner Report"]);
            rows.push(["Date Range", range]);
            rows.push([]);

            // Summary
            rows.push(["Metric", "Value"]);
            rows.push(["Total Sales", String(data.aggregate.totalSales)]);
            rows.push(["Total Tips", String(data.aggregate.totalTips)]);
            rows.push(["Transactions", String(data.aggregate.transactionCount)]);
            rows.push(["Average Order", String(data.aggregate.averageOrderValue)]);
            rows.push(["Merchants", String(data.aggregate.merchantCount)]);
            rows.push([]);

            // Per-merchant
            rows.push(["Merchant", "Wallet", "Sales", "Tips", "Transactions", "Avg Order"]);
            for (const m of filteredMerchants) {
                rows.push([m.name, m.wallet, String(m.totalSales), String(m.totalTips), String(m.transactionCount), String(m.averageOrderValue)]);
            }

            const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const BOM = "\uFEFF";
            const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `partner-report-${range}-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e: any) {
            setError(e.message);
        }
    }

    const filteredMerchants = (data?.merchants || [])
        .filter((m: any) =>
            !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.wallet.includes(searchQuery.toLowerCase())
        )
        .sort((a: any, b: any) => {
            const dir = sortDir === "asc" ? 1 : -1;
            if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
            return (a[sortBy] - b[sortBy]) * dir;
        });

    function toggleSort(col: typeof sortBy) {
        if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortBy(col); setSortDir("desc"); }
    }

    if (!wallet) {
        return <div className="p-8 text-center text-muted-foreground text-sm">Connect your wallet to access partner reports.</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-medium">Partner / Admin</span>
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Partner Reports
                        {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                    </h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={exportPDF} disabled={loading || !data} className="h-8 flex items-center gap-2 px-3 bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50 shadow-sm text-[10px] font-bold uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={exportExcel} disabled={loading || !data} className="h-8 flex items-center gap-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm text-[10px] font-bold uppercase tracking-wider">
                        <Table2 className="w-3.5 h-3.5" /> Excel
                    </button>
                </div>
            </div>

            {/* Date Range Controls */}
            <div className="p-4 border rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Date Range</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex bg-muted/20 p-1 rounded-lg border flex-1">
                        {["today", "yesterday", "week", "month", "all", "custom"].map((r) => (
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

            {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">{error}</div>}

            {/* Aggregate Stats */}
            {data?.aggregate && (
                <>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        <EnhancedStatCard icon={DollarSign} label="Volume" value={formatCurrency(data.aggregate.totalSales, "USD")} accent="text-indigo-500" />
                        <EnhancedStatCard icon={TrendingUp} label="Earned" value={formatCurrency(data.aggregate.merchantEarned, "USD")} accent="text-emerald-500" />
                        <EnhancedStatCard icon={BarChart3} label="Fees" value={formatCurrency(data.aggregate.platformFee, "USD")} accent="text-amber-500" />
                        <EnhancedStatCard icon={Receipt} label="Tips" value={formatCurrency(data.aggregate.totalTips, "USD")} accent="text-green-500" />
                        <EnhancedStatCard icon={Receipt} label="Txns" value={data.aggregate.transactionCount} accent="text-blue-500" />
                        <EnhancedStatCard icon={Users} label="Merchants" value={data.aggregate.merchantCount} accent="text-purple-500" />
                    </div>

                    {/* Analytics Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(data.aggregate.totalSales > 0) && (
                            <div className="rounded-xl border bg-card p-5">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Revenue Composition
                                </h3>
                                <VolumeVsTipsBar
                                    volume={data.aggregate.totalSales}
                                    tips={data.aggregate.totalTips}
                                    fees={data.aggregate.platformFee}
                                />
                            </div>
                        )}
                        {(data.aggregate.merchantEarned > 0 || data.aggregate.platformFee > 0 || data.aggregate.totalTips > 0) && (
                            <div className="rounded-xl border bg-card p-5">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                    <PieChart className="h-4 w-4 text-primary" />
                                    Revenue Split
                                </h3>
                                <RevenueBreakdown
                                    earned={data.aggregate.merchantEarned || 0}
                                    fees={data.aggregate.platformFee || 0}
                                    tips={data.aggregate.totalTips || 0}
                                    volume={data.aggregate.totalSales || 0}
                                />
                            </div>
                        )}
                    </div>

                    {/* Merchant Treemap */}
                    {data?.merchants?.length > 0 && (
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-primary" />
                                Top Merchants by Volume
                            </h3>
                            <MerchantGrid merchants={data.merchants} maxItems={12} />
                        </div>
                    )}
                </>
            )}

            {/* Merchant Table */}
            {data && (
                <div className="border rounded-xl bg-card overflow-hidden">
                    <div className="p-4 border-b flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                        <h3 className="text-lg font-bold">Merchants ({filteredMerchants.length})</h3>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search merchants..."
                                className="w-full h-9 pl-10 pr-3 rounded-lg border bg-background text-sm focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/20">
                                <tr>
                                    <th className="text-left py-3 px-4 w-8" />
                                    <th className="text-left py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                                        Merchant {sortBy === "name" && (sortDir === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="text-right py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("totalSales")}>
                                        Sales {sortBy === "totalSales" && (sortDir === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="text-right py-3 px-4">Tips</th>
                                    <th className="text-right py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("transactionCount")}>
                                        Txns {sortBy === "transactionCount" && (sortDir === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="text-right py-3 px-4">Avg Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredMerchants.map((m: any, idx: number) => (
                                    <React.Fragment key={`${m.wallet}-${idx}`}>
                                        <tr className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => loadMerchantDetail(m.wallet)}>
                                            <td className="py-3 px-4">
                                                {expandedMerchant === m.wallet ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {m.logo && <img src={m.logo} alt="" className="w-6 h-6 rounded-full" />}
                                                    <div>
                                                        <div className="font-medium">{m.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{m.wallet.slice(0, 6)}...{m.wallet.slice(-4)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold">{formatCurrency(m.totalSales, "USD")}</td>
                                            <td className="py-3 px-4 text-right font-mono text-green-500">{formatCurrency(m.totalTips, "USD")}</td>
                                            <td className="py-3 px-4 text-right">{m.transactionCount}</td>
                                            <td className="py-3 px-4 text-right font-mono">{formatCurrency(m.averageOrderValue, "USD")}</td>
                                        </tr>
                                        {expandedMerchant === m.wallet && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <div className="p-4 bg-muted/10 border-t animate-in fade-in slide-in-from-top-2">
                                                        {detailLoading ? (
                                                            <div className="flex items-center justify-center py-6">
                                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                                <span className="ml-2 text-sm text-muted-foreground">Loading details…</span>
                                                            </div>
                                                        ) : merchantDetail?.error ? (
                                                            <div className="text-sm text-red-500 py-4">{merchantDetail.error}</div>
                                                        ) : merchantDetail ? (
                                                            <div className="space-y-4">
                                                                {merchantDetail.paymentMethods?.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Payment Breakdown</h4>
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                            {merchantDetail.paymentMethods.map((pm: any) => (
                                                                                <div key={pm.method} className="p-2 rounded-lg bg-background border flex justify-between">
                                                                                    <span className="text-sm">{pm.method}</span>
                                                                                    <span className="text-sm font-mono">{formatCurrency(pm.total, "USD")}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {merchantDetail.employees?.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Staff</h4>
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                            {merchantDetail.employees.map((e: any) => (
                                                                                <div key={e.id} className="p-2 rounded-lg bg-background border">
                                                                                    <div className="font-medium text-sm">{e.name || e.id}</div>
                                                                                    <div className="text-xs text-muted-foreground mt-1">Sales: {formatCurrency(e.sales, "USD")} · Tips: {formatCurrency(e.tips, "USD")} · {e.count} orders</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {filteredMerchants.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                                            {searchQuery ? "No merchants matching search" : "No merchants found"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="p-4 rounded-xl border bg-card hover:bg-muted/10 transition-colors flex flex-col justify-between">
            <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider leading-tight min-h-[1rem]">{label}</div>
            <div className="text-xl font-bold mt-2 truncate">{value}</div>
        </div>
    );
}
