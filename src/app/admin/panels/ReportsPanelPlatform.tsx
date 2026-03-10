"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { FileText, Search, ChevronDown, ChevronRight, Loader2, Table2, Globe, Check, X, DollarSign, TrendingUp, Receipt, Users, BarChart3, PieChart, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/fx";
import { EnhancedStatCard, VolumeVsTipsBar, RevenueBreakdown, MerchantGrid, HorizontalBarChart, DonutChart } from "@/components/admin/ReportCharts";

/**
 * ReportsPanelPlatform — Platform-level reports panel.
 * Aggregated stats across all partners with multi-partner checkbox selection.
 * Placed under the "Platform" sidebar group (superadmin only).
 */
export default function ReportsPanelPlatform() {
    const account = useActiveAccount();
    const wallet = (account?.address || "").toLowerCase();

    const [range, setRange] = useState("week");
    const [customStart, setCustomStart] = useState(() => new Date().toISOString().split("T")[0]);
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Partner selector
    const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set());
    const [partnerSearch, setPartnerSearch] = useState("");
    const [initialized, setInitialized] = useState(false);

    // Merchant table
    const [merchantSearch, setMerchantSearch] = useState("");
    const [sortBy, setSortBy] = useState<"totalSales" | "transactionCount" | "name" | "brandKey">("totalSales");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    // Merchant drill-down
    const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
    const [merchantDetail, setMerchantDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

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

    async function loadData(partnerKeys?: string[]) {
        if (!wallet) return;
        setLoading(true);
        setError("");
        try {
            const { start, end } = getDateRange(range);
            const partners = partnerKeys ? partnerKeys.join(",") : "";
            const url = `/api/admin/platform-reports?start=${start}&end=${end}${partners ? `&partners=${encodeURIComponent(partners)}` : ""}`;
            const res = await fetch(url, { headers: { "x-wallet": wallet } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to load");
            setData(json);

            // Auto-select all partners on first load
            if (!initialized && json.availablePartners?.length) {
                setSelectedPartners(new Set(json.availablePartners.map((p: any) => p.brandKey)));
                setInitialized(true);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    // Initial load (all partners)
    useEffect(() => {
        if (wallet) {
            if (range === "custom" && (!customStart || !customEnd)) return;
            loadData();
        }
    }, [range, wallet, customStart, customEnd]);

    // Reload when partner selection changes (after initialization)
    useEffect(() => {
        if (initialized && wallet) {
            loadData(Array.from(selectedPartners));
        }
    }, [selectedPartners]);

    function togglePartner(key: string) {
        setSelectedPartners((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function selectAllPartners() {
        if (data?.availablePartners) {
            setSelectedPartners(new Set(data.availablePartners.map((p: any) => p.brandKey)));
        }
    }

    function deselectAllPartners() {
        setSelectedPartners(new Set());
    }

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

    function toggleSort(col: typeof sortBy) {
        if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortBy(col); setSortDir("desc"); }
    }

    function exportPDF() {
        if (!data?.merchants?.length) return;
        const w = window.open("", "_blank", "width=900,height=700");
        if (!w) return;
        const dateStr = new Date().toLocaleString();
        const aggregate = data.aggregate;

        const partnerRows = (data.partners || [])
            .map((p: any) => `<tr><td>${p.name}</td><td class="right">${p.merchantCount}</td><td class="right">${formatCurrency(p.totalSales, "USD")}</td><td class="right">${formatCurrency(p.totalTips, "USD")}</td><td class="right">${p.transactionCount}</td></tr>`)
            .join("");

        const merchantRows = filteredMerchants
            .map((m: any) => `<tr><td>${m.name}</td><td>${m.brandKey}</td><td class="right">${formatCurrency(m.totalSales, "USD")}</td><td class="right">${formatCurrency(m.totalTips, "USD")}</td><td class="right">${m.transactionCount}</td><td class="right">${formatCurrency(m.averageOrderValue, "USD")}</td></tr>`)
            .join("");

        w.document.write(`<html><head><title>Platform Report</title><style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
            h1 { font-size: 20px; margin-bottom: 4px; } h2 { font-size: 16px; margin: 20px 0 8px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; }
            .stat-card .label { font-size: 10px; text-transform: uppercase; color: #888; }
            .stat-card .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 10px; text-transform: uppercase; color: #888; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .footer { margin-top: 20px; font-size: 10px; color: #888; text-align: center; }
        </style></head><body>
            <h1>Platform Reports</h1>
            <div class="meta">Date Range: ${range} | Partners: ${selectedPartners.size} | Generated: ${dateStr}</div>
            <div class="stats">
                <div class="stat-card"><div class="label">Total Sales</div><div class="value">${formatCurrency(aggregate.totalSales, "USD")}</div></div>
                <div class="stat-card"><div class="label">Tips</div><div class="value">${formatCurrency(aggregate.totalTips, "USD")}</div></div>
                <div class="stat-card"><div class="label">Transactions</div><div class="value">${aggregate.transactionCount}</div></div>
                <div class="stat-card"><div class="label">Merchants</div><div class="value">${aggregate.merchantCount}</div></div>
                <div class="stat-card"><div class="label">Partners</div><div class="value">${aggregate.partnerCount}</div></div>
            </div>
            <h2>Partners</h2>
            <table><thead><tr><th>Partner</th><th class="right">Merchants</th><th class="right">Sales</th><th class="right">Tips</th><th class="right">Txns</th></tr></thead><tbody>${partnerRows}</tbody></table>
            <h2>Merchants</h2>
            <table><thead><tr><th>Merchant</th><th>Partner</th><th class="right">Sales</th><th class="right">Tips</th><th class="right">Txns</th><th class="right">Avg Order</th></tr></thead><tbody>${merchantRows}</tbody></table>
            <div class="footer">Platform Report — ${dateStr}</div>
            <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script>
        </body></html>`);
        w.document.close();
    }

    function exportExcel() {
        if (!data) return;
        try {
            const rows: string[][] = [];
            rows.push(["Platform Report"]);
            rows.push(["Date Range", range]);
            rows.push(["Partners Selected", String(selectedPartners.size)]);
            rows.push([]);

            // Summary
            rows.push(["Metric", "Value"]);
            rows.push(["Total Sales", String(data.aggregate?.totalSales || 0)]);
            rows.push(["Total Tips", String(data.aggregate?.totalTips || 0)]);
            rows.push(["Transactions", String(data.aggregate?.transactionCount || 0)]);
            rows.push(["Merchants", String(data.aggregate?.merchantCount || 0)]);
            rows.push(["Partners", String(data.aggregate?.partnerCount || 0)]);
            rows.push([]);

            // Partners
            rows.push(["Partner", "Merchants", "Sales", "Tips", "Transactions"]);
            for (const p of data.partners || []) {
                rows.push([p.name, String(p.merchantCount), String(p.totalSales), String(p.totalTips), String(p.transactionCount)]);
            }
            rows.push([]);

            // Merchants
            rows.push(["Merchant", "Partner", "Wallet", "Sales", "Tips", "Transactions", "Avg Order"]);
            for (const m of filteredMerchants) {
                rows.push([m.name, m.brandKey, m.wallet, String(m.totalSales), String(m.totalTips), String(m.transactionCount), String(m.averageOrderValue)]);
            }

            const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const BOM = "\uFEFF";
            const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `platform-report-${range}-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e: any) {
            setError(e.message);
        }
    }

    const filteredPartners = (data?.availablePartners || []).filter((p: any) =>
        !partnerSearch || p.brandKey.includes(partnerSearch.toLowerCase()) || p.name.toLowerCase().includes(partnerSearch.toLowerCase())
    );

    const filteredMerchants = (data?.merchants || [])
        .filter((m: any) =>
            !merchantSearch || m.name.toLowerCase().includes(merchantSearch.toLowerCase()) || m.wallet.includes(merchantSearch.toLowerCase()) || m.brandKey.includes(merchantSearch.toLowerCase())
        )
        .sort((a: any, b: any) => {
            const dir = sortDir === "asc" ? 1 : -1;
            if (sortBy === "name" || sortBy === "brandKey") return String(a[sortBy] || "").localeCompare(String(b[sortBy] || "")) * dir;
            return ((a[sortBy] || 0) - (b[sortBy] || 0)) * dir;
        });

    if (!wallet) {
        return <div className="p-8 text-center text-muted-foreground text-sm">Connect your wallet to access platform reports.</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-medium">Platform</span>
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Platform Reports
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

            {/* Controls Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div className="lg:col-span-2 p-4 border rounded-xl bg-card">
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

                {/* Partner Selector */}
                <div className="p-4 border rounded-xl bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Partners ({selectedPartners.size})</span>
                        <div className="flex gap-1">
                            <button onClick={selectAllPartners} className="px-2 py-0.5 bg-muted/50 rounded text-[10px] font-bold hover:bg-muted">
                                <Check className="w-3 h-3 inline mr-0.5" /> All
                            </button>
                            <button onClick={deselectAllPartners} className="px-2 py-0.5 bg-muted/50 rounded text-[10px] font-bold hover:bg-muted">
                                <X className="w-3 h-3 inline mr-0.5" /> None
                            </button>
                        </div>
                    </div>
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={partnerSearch}
                            onChange={(e) => setPartnerSearch(e.target.value)}
                            placeholder="Search partners..."
                            className="w-full h-8 pl-8 pr-3 rounded-lg border bg-background text-xs focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                        {filteredPartners.map((p: any) => (
                            <label key={p.brandKey} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedPartners.has(p.brandKey)}
                                    onChange={() => togglePartner(p.brandKey)}
                                    className="w-3.5 h-3.5 rounded border-border accent-primary"
                                />
                                <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                                <span className="text-xs text-muted-foreground">{p.merchantCount} merchants</span>
                            </label>
                        ))}
                        {filteredPartners.length === 0 && (
                            <div className="text-xs text-muted-foreground text-center py-2">No partners found</div>
                        )}
                    </div>
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
                        <EnhancedStatCard icon={Building2} label="Partners" value={data.aggregate.partnerCount} accent="text-purple-500" />
                    </div>

                    {/* Visualization Row */}
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
                        {(data.aggregate.merchantEarned > 0 || data.aggregate.platformFee > 0) && (
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

                    {/* Partner Volume Comparison */}
                    {data?.partners?.length > 1 && (
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                <Building2 className="h-4 w-4 text-primary" />
                                Partner Volume Comparison
                            </h3>
                            <HorizontalBarChart
                                data={data.partners.map((p: any) => ({ label: p.name || p.brandKey, value: p.totalSales || 0 }))}
                                maxBars={10}
                            />
                        </div>
                    )}

                    {/* Merchant Treemap */}
                    {data?.merchants?.length > 0 && (
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-primary" />
                                Top Merchants by Volume
                            </h3>
                            <MerchantGrid merchants={data.merchants} maxItems={16} />
                        </div>
                    )}
                </>
            )}

            {/* Partner Breakdown */}
            {data?.partners && data.partners.length > 0 && (
                <div className="border rounded-xl bg-card overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-bold">Partner Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/20">
                                <tr>
                                    <th className="text-left py-3 px-4">Partner</th>
                                    <th className="text-right py-3 px-4">Merchants</th>
                                    <th className="text-right py-3 px-4">Sales</th>
                                    <th className="text-right py-3 px-4">Tips</th>
                                    <th className="text-right py-3 px-4">Txns</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.partners.map((p: any) => (
                                    <tr key={p.brandKey} className="hover:bg-muted/10 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-muted-foreground">{p.brandKey}</div>
                                        </td>
                                        <td className="py-3 px-4 text-right">{p.merchantCount}</td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold">{formatCurrency(p.totalSales, "USD")}</td>
                                        <td className="py-3 px-4 text-right font-mono text-green-500">{formatCurrency(p.totalTips, "USD")}</td>
                                        <td className="py-3 px-4 text-right">{p.transactionCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Merchant Table */}
            {data && (
                <div className="border rounded-xl bg-card overflow-hidden">
                    <div className="p-4 border-b flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                        <h3 className="text-lg font-bold">All Merchants ({filteredMerchants.length})</h3>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={merchantSearch}
                                onChange={(e) => setMerchantSearch(e.target.value)}
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
                                    <th className="text-left py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("brandKey")}>
                                        Partner {sortBy === "brandKey" && (sortDir === "asc" ? "↑" : "↓")}
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
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-full bg-muted/50 text-xs font-medium">{m.brandKey}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold">{formatCurrency(m.totalSales, "USD")}</td>
                                            <td className="py-3 px-4 text-right font-mono text-green-500">{formatCurrency(m.totalTips, "USD")}</td>
                                            <td className="py-3 px-4 text-right">{m.transactionCount}</td>
                                            <td className="py-3 px-4 text-right font-mono">{formatCurrency(m.averageOrderValue, "USD")}</td>
                                        </tr>
                                        {expandedMerchant === m.wallet && (
                                            <tr>
                                                <td colSpan={7} className="p-0">
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
                                                                {/* Summary Stats */}
                                                                {merchantDetail.summary && (
                                                                    <div>
                                                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Summary</h4>
                                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                                                            <div className="p-2 rounded-lg bg-background border">
                                                                                <div className="text-[10px] text-muted-foreground uppercase">Volume</div>
                                                                                <div className="text-sm font-mono font-semibold">{formatCurrency(merchantDetail.summary.totalSales, "USD")}</div>
                                                                            </div>
                                                                            <div className="p-2 rounded-lg bg-background border">
                                                                                <div className="text-[10px] text-muted-foreground uppercase">Earned</div>
                                                                                <div className="text-sm font-mono font-semibold text-emerald-500">{formatCurrency(merchantDetail.summary.merchantEarned || 0, "USD")}</div>
                                                                            </div>
                                                                            <div className="p-2 rounded-lg bg-background border">
                                                                                <div className="text-[10px] text-muted-foreground uppercase">Fees</div>
                                                                                <div className="text-sm font-mono font-semibold text-amber-500">{formatCurrency(merchantDetail.summary.platformFee || 0, "USD")}</div>
                                                                            </div>
                                                                            <div className="p-2 rounded-lg bg-background border">
                                                                                <div className="text-[10px] text-muted-foreground uppercase">Tips</div>
                                                                                <div className="text-sm font-mono font-semibold text-green-500">{formatCurrency(merchantDetail.summary.totalTips, "USD")}</div>
                                                                            </div>
                                                                            <div className="p-2 rounded-lg bg-background border">
                                                                                <div className="text-[10px] text-muted-foreground uppercase">Transactions</div>
                                                                                <div className="text-sm font-semibold">{merchantDetail.summary.transactionCount}</div>
                                                                            </div>
                                                                            <div className="p-2 rounded-lg bg-background border">
                                                                                <div className="text-[10px] text-muted-foreground uppercase">Avg Order</div>
                                                                                <div className="text-sm font-mono font-semibold">{formatCurrency(merchantDetail.summary.averageOrderValue, "USD")}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
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
                                                                {/* On-Chain Transaction Hashes */}
                                                                {merchantDetail.splitTransactions?.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">On-Chain Transactions ({merchantDetail.splitTransactions.length})</h4>
                                                                        <div className="max-h-64 overflow-y-auto rounded-lg border bg-background">
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-muted/30 sticky top-0">
                                                                                    <tr>
                                                                                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Date</th>
                                                                                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Tx Hash</th>
                                                                                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Type</th>
                                                                                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Token</th>
                                                                                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Amount</th>
                                                                                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">USD</th>
                                                                                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">From</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-border/50">
                                                                                    {merchantDetail.splitTransactions.map((tx: any, txIdx: number) => (
                                                                                        <tr key={`${tx.hash}-${txIdx}`} className="hover:bg-muted/10">
                                                                                            <td className="py-1.5 px-3 text-muted-foreground whitespace-nowrap">
                                                                                                {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                                                                                            </td>
                                                                                            <td className="py-1.5 px-3">
                                                                                                <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">
                                                                                                    {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
                                                                                                </a>
                                                                                            </td>
                                                                                            <td className="py-1.5 px-3">
                                                                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${(tx.txType || tx.type) === 'payment' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                                                                    {tx.txType || tx.type}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="py-1.5 px-3 font-medium">{tx.token}</td>
                                                                                            <td className="py-1.5 px-3 text-right font-mono">{Number(tx.value || 0).toFixed(6)}</td>
                                                                                            <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">{tx.valueUsd != null ? `$${Number(tx.valueUsd).toFixed(2)}` : '—'}</td>
                                                                                            <td className="py-1.5 px-3 font-mono text-muted-foreground">{tx.from ? `${tx.from.slice(0, 6)}…${tx.from.slice(-4)}` : '—'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {!merchantDetail.summary?.transactionCount && !merchantDetail.splitTransactions?.length && (
                                                                    <div className="text-sm text-muted-foreground text-center py-4">No transactions found for this period</div>
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
                                        <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                                            {merchantSearch ? "No merchants matching search" : selectedPartners.size === 0 ? "Select at least one partner" : "No merchants found"}
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
