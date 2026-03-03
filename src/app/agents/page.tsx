"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { sendTransaction, getContract, prepareContractCall } from "thirdweb";
import { client, chain } from "@/lib/thirdweb/client";
import { useBrand } from "@/contexts/BrandContext";
import TruncatedAddress from "@/components/truncated-address";
import { formatCurrency } from "@/lib/fx";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Users,
    BarChart3,
    ExternalLink,
    Loader2,
    RefreshCcw,
    ArrowDownToLine,
    DollarSign,
    Receipt,
    Store,
    Download,
    FileText,
    Table2,
    Printer,
    PieChart,
    Activity,
    Copy,
    CheckCircle,
    AlertCircle,
    User,
    Mail,
    Phone,
    Save,
} from "lucide-react";

/* ─── Types ─── */
type MerchantRow = {
    wallet: string;
    shopName: string;
    slug?: string;
    splitAddress?: string;
    agentBps: number;
    volume: number;
    tips: number;
    transactionCount: number;
    estimatedEarnings: number;
    estimatedTipShare: number;
};

type AgentReport = {
    merchants: MerchantRow[];
    aggregate: {
        totalVolume: number;
        estimatedEarnings: number;
        totalTips: number;
        transactionCount: number;
        merchantCount: number;
        averageBps: number;
    };
};

/* ─── Time Range Helpers ─── */
const RANGES = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "7 Days" },
    { id: "month", label: "30 Days" },
    { id: "quarter", label: "90 Days" },
    { id: "all", label: "All Time" },
] as const;

function getDateRange(rangeId: string, customStart?: string, customEnd?: string) {
    const now = new Date();
    let start = new Date(0);
    const end = new Date();

    if (rangeId === "today") {
        start = new Date();
        start.setHours(0, 0, 0, 0);
    } else if (rangeId === "yesterday") {
        start = new Date();
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
    } else if (rangeId === "week") {
        start = new Date();
        start.setDate(now.getDate() - 7);
    } else if (rangeId === "month") {
        start = new Date();
        start.setMonth(now.getMonth() - 1);
    } else if (rangeId === "quarter") {
        start = new Date();
        start.setMonth(now.getMonth() - 3);
    } else if (rangeId === "custom" && customStart && customEnd) {
        const [sY, sM, sD] = customStart.split("-").map(Number);
        start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
        const [eY, eM, eD] = customEnd.split("-").map(Number);
        const endD = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
        return { start: Math.floor(start.getTime() / 1000), end: Math.floor(endD.getTime() / 1000) };
    }

    return {
        start: Math.floor(start.getTime() / 1000),
        end: Math.floor(end.getTime() / 1000),
    };
}

function getRangeLabel(id: string) {
    return RANGES.find((r) => r.id === id)?.label || id;
}

/* ─────────────── PaymentSplitter ABI ─────────────── */
const PAYMENT_SPLITTER_ABI = [
    { type: "function", name: "distribute", inputs: [], outputs: [], stateMutability: "nonpayable" },
    { type: "function", name: "distribute", inputs: [{ name: "token", type: "address" }], outputs: [], stateMutability: "nonpayable" },
] as const;

/* ─────────────── Stat Card ─────────────── */
function StatCard({ icon: Icon, label, value, sub, accent, trend }: {
    icon: any;
    label: string;
    value: string | number;
    sub: string;
    accent?: string;
    trend?: "up" | "down" | "neutral";
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border bg-card p-5 hover:border-primary/30 transition-all group">
            <div className="absolute top-3 right-3 h-10 w-10 rounded-lg bg-primary/10 grid place-items-center group-hover:bg-primary/15 transition">
                <Icon className={`h-5 w-5 ${accent || "text-primary"}`} />
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">{label}</div>
            <div className="text-2xl font-bold flex items-center gap-2">
                {value}
                {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-4 w-4 text-red-400" />}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        </div>
    );
}

/* ─────────────── Mini Bar Chart ─────────────── */
function EarningsBar({ merchants }: { merchants: MerchantRow[] }) {
    const maxEarnings = Math.max(...merchants.map((m) => m.estimatedEarnings), 1);
    const colors = ["bg-primary", "bg-green-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
    return (
        <div className="space-y-2">
            {merchants.slice(0, 6).map((m, i) => (
                <div key={m.wallet} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-muted-foreground truncate flex-shrink-0" title={m.shopName}>
                        {m.shopName}
                    </div>
                    <div className="flex-1 h-6 bg-muted/30 rounded-md overflow-hidden relative">
                        <div
                            className={`h-full ${colors[i % colors.length]} rounded-md transition-all duration-700 ease-out`}
                            style={{ width: `${Math.max(2, (m.estimatedEarnings / maxEarnings) * 100)}%` }}
                        />
                    </div>
                    <div className="w-20 text-right text-xs font-mono font-semibold tabular-nums">
                        {formatCurrency(m.estimatedEarnings, "USD")}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─────────────── Distribution Donut ─────────────── */
function DistributionDonut({ merchants }: { merchants: MerchantRow[] }) {
    const total = merchants.reduce((s, m) => s + m.estimatedEarnings, 0) || 1;
    const colors = ["#6366f1", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#f43f5e"];
    let cumPercent = 0;
    const segments = merchants.slice(0, 5).map((m, i) => {
        const pct = (m.estimatedEarnings / total) * 100;
        const offset = cumPercent;
        cumPercent += pct;
        return { ...m, pct, offset, color: colors[i % colors.length] };
    });
    // "Other" segment
    if (merchants.length > 5) {
        const otherPct = 100 - cumPercent;
        segments.push({ wallet: "other", shopName: `+${merchants.length - 5} more`, pct: otherPct, offset: cumPercent, color: "#71717a", estimatedEarnings: 0 } as any);
    }

    return (
        <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {segments.map((seg, i) => (
                        <circle
                            key={i}
                            r="16"
                            cx="18"
                            cy="18"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="3"
                            strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                            strokeDashoffset={`${-seg.offset}`}
                            className="transition-all duration-700"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">Total</span>
                    <span className="text-xs font-bold">{merchants.length}</span>
                </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                        <span className="truncate text-muted-foreground">{seg.shopName}</span>
                        <span className="ml-auto font-mono tabular-nums font-semibold">{seg.pct.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*              AGENT DASHBOARD               */
/* ═══════════════════════════════════════════ */
export default function AgentDashboard() {
    const account = useActiveAccount();
    const brand = useBrand();
    const agentWallet = (account?.address || "").toLowerCase();

    const [range, setRange] = useState("month");
    const [customStart, setCustomStart] = useState(() => new Date().toISOString().split("T")[0]);
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<AgentReport | null>(null);
    const [withdrawStatus, setWithdrawStatus] = useState<Record<string, string>>({});
    const [bulkWithdrawing, setBulkWithdrawing] = useState(false);
    const [sortColumn, setSortColumn] = useState<"earnings" | "volume" | "txns" | "bps">("earnings");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [copiedAddress, setCopiedAddress] = useState("");

    /* ── Profile gate state ── */
    const [profileLoading, setProfileLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profilePhone, setProfilePhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [showProfileEditor, setShowProfileEditor] = useState(false);

    /* ── Fetch profile on connect ── */
    useEffect(() => {
        if (!agentWallet) { setProfileLoading(false); return; }
        (async () => {
            try {
                const res = await fetch("/api/agents/profile", { headers: { "x-wallet": agentWallet } });
                const data = await res.json();
                if (data.hasProfile) {
                    setHasProfile(true);
                    setProfileName(data.name || "");
                    setProfileEmail(data.email || "");
                    setProfilePhone(data.phone || "");
                }
            } catch { }
            setProfileLoading(false);
        })();
    }, [agentWallet]);

    async function saveProfile() {
        setSavingProfile(true);
        setProfileError("");
        try {
            const res = await fetch("/api/agents/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": agentWallet },
                body: JSON.stringify({ name: profileName, email: profileEmail, phone: profilePhone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save");
            setHasProfile(true);
            setShowProfileEditor(false);
        } catch (e: any) {
            setProfileError(e.message);
        } finally {
            setSavingProfile(false);
        }
    }

    /* ── Fetch Data ── */
    const fetchReport = useCallback(async () => {
        if (!agentWallet) return;
        setLoading(true);
        setError("");
        try {
            const { start, end } = getDateRange(range, customStart, customEnd);
            const res = await fetch(
                `/api/agents/reports?start=${start}&end=${end}`,
                { headers: { "x-wallet": agentWallet } }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to load");
            setData(json as AgentReport);
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [agentWallet, range, customStart, customEnd]);

    useEffect(() => {
        if (agentWallet) fetchReport();
    }, [fetchReport, agentWallet]);

    /* ── Sorted merchants ── */
    const sortedMerchants = useMemo(() => {
        if (!data) return [];
        const arr = [...data.merchants];
        const dir = sortDir === "desc" ? -1 : 1;
        arr.sort((a, b) => {
            if (sortColumn === "earnings") return (a.estimatedEarnings - b.estimatedEarnings) * dir;
            if (sortColumn === "volume") return (a.volume - b.volume) * dir;
            if (sortColumn === "txns") return (a.transactionCount - b.transactionCount) * dir;
            if (sortColumn === "bps") return (a.agentBps - b.agentBps) * dir;
            return 0;
        });
        return arr;
    }, [data, sortColumn, sortDir]);

    function toggleSort(col: typeof sortColumn) {
        if (sortColumn === col) { setSortDir(sortDir === "desc" ? "asc" : "desc"); }
        else { setSortColumn(col); setSortDir("desc"); }
    }

    const SortIndicator = ({ col }: { col: typeof sortColumn }) => (
        <span className="text-muted-foreground/50 ml-0.5">
            {sortColumn === col ? (sortDir === "desc" ? "↓" : "↑") : ""}
        </span>
    );

    /* ── Copy address ── */
    function copyAddr(addr: string) {
        try { navigator.clipboard.writeText(addr); setCopiedAddress(addr); setTimeout(() => setCopiedAddress(""), 1500); } catch { }
    }

    /* ── Export CSV ── */
    function exportCSV() {
        if (!data) return;
        const rows: string[][] = [];
        rows.push(["Agent Commission Report"]);
        rows.push([`Agent Wallet: ${agentWallet}`]);
        rows.push([`Date Range: ${getRangeLabel(range)}`]);
        rows.push([`Generated: ${new Date().toLocaleString()}`]);
        rows.push([]);

        // Summary
        rows.push(["SUMMARY"]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Estimated Earnings", `$${data.aggregate.estimatedEarnings.toFixed(2)}`]);
        rows.push(["Total Volume Attributed", `$${data.aggregate.totalVolume.toFixed(2)}`]);
        rows.push(["Total Tip Share", `$${data.aggregate.totalTips.toFixed(2)}`]);
        rows.push(["Total Transactions", String(data.aggregate.transactionCount)]);
        rows.push(["Merchants Served", String(data.aggregate.merchantCount)]);
        rows.push(["Average Commission Rate", `${(data.aggregate.averageBps / 100).toFixed(2)}%`]);
        rows.push([]);

        // Merchant breakdown
        rows.push(["MERCHANT BREAKDOWN"]);
        rows.push(["Merchant", "Wallet", "Slug", "Volume (USD)", "Tips (USD)", "Transactions", "Agent BPS", "Rate %", "Estimated Earnings", "Tip Share", "Split Contract"]);
        for (const m of data.merchants) {
            rows.push([
                m.shopName,
                m.wallet,
                m.slug || "",
                m.volume.toFixed(2),
                m.tips.toFixed(2),
                String(m.transactionCount),
                String(m.agentBps),
                (m.agentBps / 100).toFixed(2),
                m.estimatedEarnings.toFixed(2),
                m.estimatedTipShare.toFixed(2),
                m.splitAddress || "",
            ]);
        }

        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `agent-report-${range}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    /* ── Print-friendly PDF ── */
    function printReport() {
        if (!data) return;
        const w = window.open("", "_blank", "width=800,height=900");
        if (!w) return;
        const dateStr = new Date().toLocaleString();
        const brandName = brand?.name || "Agent Portal";

        const merchantRows = data.merchants.map((m) =>
            `<tr>
                <td style="padding:6px 8px;border-bottom:1px solid #eee">${m.shopName}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">$${m.volume.toFixed(2)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${m.transactionCount}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${(m.agentBps / 100).toFixed(2)}%</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:bold;color:#16a34a">$${m.estimatedEarnings.toFixed(2)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">$${m.estimatedTipShare.toFixed(2)}</td>
            </tr>`
        ).join("");

        w.document.write(`<!DOCTYPE html><html><head><title>Agent Commission Report</title>
        <style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:30px;color:#1a1a1a;font-size:13px}
            .header{border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start}
            .header h1{font-size:22px;margin:0 0 4px 0}
            .header .meta{text-align:right;font-size:11px;color:#666}
            .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
            .summary-card{background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px}
            .summary-card .label{font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.06em;font-weight:700}
            .summary-card .value{font-size:22px;font-weight:800;margin-top:4px}
            .summary-card .sub{font-size:11px;color:#888;margin-top:2px}
            table{width:100%;border-collapse:collapse;margin-top:8px}
            th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#666;padding:8px;border-bottom:2px solid #333;font-weight:700}
            th.right{text-align:right}
            .section-title{font-size:14px;font-weight:700;margin:24px 0 8px 0;display:flex;align-items:center;gap:6px}
            .section-title::before{content:'';display:inline-block;width:3px;height:16px;background:#6366f1;border-radius:2px}
            .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#999;display:flex;justify-content:space-between}
            @media print{body{padding:20px}@page{margin:15mm}}
        </style></head><body>
        <div class="header">
            <div>
                <h1>Agent Commission Report</h1>
                <div style="font-size:12px;color:#666">Agent: ${agentWallet}</div>
                <div style="font-size:12px;color:#666">Period: ${getRangeLabel(range)}</div>
            </div>
            <div class="meta">
                <div>${brandName}</div>
                <div>Generated: ${dateStr}</div>
                <div>Network: Base (Coinbase L2)</div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="label">Estimated Earnings</div>
                <div class="value" style="color:#16a34a">$${data.aggregate.estimatedEarnings.toFixed(2)}</div>
                <div class="sub">From ${data.aggregate.merchantCount} merchant${data.aggregate.merchantCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="summary-card">
                <div class="label">Volume Attributed</div>
                <div class="value">$${data.aggregate.totalVolume.toFixed(2)}</div>
                <div class="sub">${data.aggregate.transactionCount} transactions</div>
            </div>
            <div class="summary-card">
                <div class="label">Avg Commission Rate</div>
                <div class="value">${(data.aggregate.averageBps / 100).toFixed(2)}%</div>
                <div class="sub">${data.aggregate.averageBps} basis points average</div>
            </div>
        </div>

        <div class="section-title">Merchant Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Merchant</th>
                    <th class="right">Volume</th>
                    <th class="right">Txns</th>
                    <th class="right">Rate</th>
                    <th class="right">Earnings</th>
                    <th class="right">Tip Share</th>
                </tr>
            </thead>
            <tbody>
                ${merchantRows}
                <tr style="font-weight:bold;border-top:2px solid #333">
                    <td style="padding:8px">TOTAL</td>
                    <td style="padding:8px;text-align:right;font-family:monospace">$${data.aggregate.totalVolume.toFixed(2)}</td>
                    <td style="padding:8px;text-align:right">${data.aggregate.transactionCount}</td>
                    <td style="padding:8px;text-align:right">${(data.aggregate.averageBps / 100).toFixed(2)}%</td>
                    <td style="padding:8px;text-align:right;font-family:monospace;color:#16a34a">$${data.aggregate.estimatedEarnings.toFixed(2)}</td>
                    <td style="padding:8px;text-align:right;font-family:monospace">$${data.aggregate.totalTips.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <div>Confidential — Agent Commission Statement</div>
            <div>Earnings are estimated from on-chain receipt data. Actual payouts are determined by the PaymentSplitter smart contract.</div>
        </div>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close()},800)}</script>
        </body></html>`);
        w.document.close();
    }

    /* ── Withdraw (single merchant) ── */
    async function withdrawForMerchant(splitAddress: string, merchantWallet: string) {
        if (!account || !splitAddress) return;
        setWithdrawStatus((prev) => ({ ...prev, [merchantWallet]: "Distributing…" }));

        const isHex = (s: string) => /^0x[a-f0-9]{40}$/i.test(s);
        const envTokens: Record<string, { address?: `0x${string}` }> = {
            ETH: { address: undefined },
            USDC: { address: (process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "").toLowerCase() as any },
            USDT: { address: (process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS || "").toLowerCase() as any },
            cbBTC: { address: (process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS || "").toLowerCase() as any },
            cbXRP: { address: (process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS || "").toLowerCase() as any },
            SOL: { address: (process.env.NEXT_PUBLIC_BASE_SOL_ADDRESS || "").toLowerCase() as any },
        };

        const contract = getContract({ client, chain, address: splitAddress as `0x${string}`, abi: PAYMENT_SPLITTER_ABI as any });
        let successes = 0;
        let skipped = 0;

        for (const symbol of ["ETH", "USDC", "USDT", "cbBTC", "cbXRP", "SOL"]) {
            try {
                let tx: any;
                if (symbol === "ETH") {
                    tx = (prepareContractCall as any)({
                        contract: contract as any,
                        method: "function distribute()",
                        params: [],
                    });
                } else {
                    const t = envTokens[symbol];
                    const tokenAddr = t?.address as `0x${string}` | undefined;
                    if (!tokenAddr || !isHex(String(tokenAddr))) { skipped++; continue; }
                    tx = (prepareContractCall as any)({
                        contract: contract as any,
                        method: "function distribute(address token)",
                        params: [tokenAddr],
                    });
                }
                await sendTransaction({ account: account as any, transaction: tx });
                successes++;
            } catch (err: any) {
                const raw = String(err?.message || "").toLowerCase();
                if (raw.includes("not due payment")) skipped++;
            }
        }

        const msg = successes > 0
            ? `✓ ${successes} tx${successes > 1 ? "s" : ""}${skipped ? `, ${skipped} skipped` : ""}`
            : skipped ? "Nothing releasable" : "No action";
        setWithdrawStatus((prev) => ({ ...prev, [merchantWallet]: msg }));
    }

    /* ── Bulk Withdraw ── */
    async function bulkWithdraw() {
        if (!account || !data) return;
        setBulkWithdrawing(true);
        const splits = data.merchants.filter((m) => m.splitAddress);
        for (const m of splits) {
            await withdrawForMerchant(m.splitAddress!, m.wallet);
        }
        setBulkWithdrawing(false);
    }

    /* ═══════════════ RENDER ═══════════════ */

    /* Not connected → Connect Prompt */
    if (!account) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-green-500/5 pointer-events-none" />
                <div className="relative max-w-md w-full text-center space-y-6">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-green-500/10 grid place-items-center shadow-lg shadow-primary/10">
                        <Wallet className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Agent Portal</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Connect the wallet associated with your agent role to view commission reports, earnings analytics, and withdraw funds across all your assigned merchants.
                    </p>
                    <div className="flex justify-center">
                        <ConnectButton client={client} chain={chain} />
                    </div>
                    <div className="pt-4 border-t border-border/50 space-y-2 text-xs text-muted-foreground">
                        <p>Your agent wallet was set by the partner when configuring merchant splits.</p>
                        {brand?.name && <p className="opacity-60">Powered by {brand.name}</p>}
                    </div>
                </div>
            </div>
        );
    }

    /* Profile loading */
    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    /* Profile gate — require info before showing dashboard */
    if (!hasProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
                <div className="relative max-w-lg w-full space-y-6">
                    <div className="text-center space-y-2">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-green-500/10 grid place-items-center shadow-lg shadow-primary/10">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Complete Your Profile</h1>
                        <p className="text-sm text-muted-foreground">
                            Before accessing your agent dashboard, please provide your contact information.
                        </p>
                    </div>

                    <div className="space-y-4 bg-card rounded-xl border p-6">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                                <Wallet className="h-3 w-3" /> Wallet
                            </label>
                            <div className="px-3 py-2.5 rounded-lg bg-muted/20 border text-sm font-mono text-muted-foreground truncate">
                                {agentWallet}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3 w-3" /> Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Your full name"
                                className="w-full px-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3 w-3" /> Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                                placeholder="agent@example.com"
                                className="w-full px-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                                <Phone className="h-3 w-3" /> Phone
                            </label>
                            <input
                                type="tel"
                                value={profilePhone}
                                onChange={(e) => setProfilePhone(e.target.value)}
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        {profileError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{profileError}</div>
                        )}

                        <button
                            onClick={saveProfile}
                            disabled={savingProfile || !profileName || !profileEmail}
                            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                            {savingProfile ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                            ) : (
                                <><Save className="h-4 w-4" /> Save & Continue to Dashboard</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* Main Dashboard */
    const agg = data?.aggregate;
    const topEarner = sortedMerchants.length > 0 ? sortedMerchants.reduce((a, b) => a.estimatedEarnings > b.estimatedEarnings ? a : b) : null;

    return (
        <div className="min-h-screen pb-20">
            {/* ─── Hero / Header ─── */}
            <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-background to-green-500/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/90 backdrop-blur mb-3 text-xs font-medium">
                                <Wallet className="h-3.5 w-3.5 text-primary" />
                                Agent Commission Dashboard
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold">Your Earnings</h1>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <TruncatedAddress address={agentWallet} />
                                <button
                                    onClick={() => copyAddr(agentWallet)}
                                    className="p-1 rounded hover:bg-muted/50 transition"
                                    title="Copy address"
                                >
                                    {copiedAddress === agentWallet ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                </button>
                                <a
                                    href={`https://base.blockscout.com/address/${agentWallet}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                                >
                                    Blockscout <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Export Buttons */}
                            <div className="flex gap-1">
                                <button
                                    onClick={printReport}
                                    disabled={loading || !data}
                                    className="h-8 flex items-center gap-1.5 px-3 bg-card border hover:bg-muted text-foreground rounded-lg disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                                    title="Print / Save as PDF"
                                >
                                    <Printer className="w-3.5 h-3.5" /> PDF
                                </button>
                                <button
                                    onClick={exportCSV}
                                    disabled={loading || !data}
                                    className="h-8 flex items-center gap-1.5 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                                    title="Export as CSV/Excel"
                                >
                                    <Table2 className="w-3.5 h-3.5" /> Excel
                                </button>
                            </div>
                            {/* Time Range Selector */}
                            <div className="flex bg-muted/20 p-1 rounded-lg border">
                                {RANGES.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRange(r.id)}
                                        className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${range === r.id
                                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="h-8 w-8 rounded-lg border grid place-items-center hover:bg-muted/50 transition disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── My Profile Banner ── */}
            {hasProfile && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">{profileName}</div>
                                    <div className="text-xs text-muted-foreground">{profileEmail}{profilePhone ? ` · ${profilePhone}` : ""}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProfileEditor(!showProfileEditor)}
                                className="text-xs text-primary hover:underline"
                            >
                                {showProfileEditor ? "Cancel" : "Edit Profile"}
                            </button>
                        </div>
                        {showProfileEditor && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        placeholder="Full Name"
                                        className="px-3 py-2 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                    />
                                    <input
                                        type="email"
                                        value={profileEmail}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        placeholder="Email"
                                        className="px-3 py-2 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                    />
                                    <input
                                        type="tel"
                                        value={profilePhone}
                                        onChange={(e) => setProfilePhone(e.target.value)}
                                        placeholder="Phone"
                                        className="px-3 py-2 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                                {profileError && <div className="text-sm text-red-500">{profileError}</div>}
                                <button
                                    onClick={saveProfile}
                                    disabled={savingProfile || !profileName || !profileEmail}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                    {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Content ─── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {loading && !data ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm">Loading your commission data…</span>
                    </div>
                ) : data && agg ? (
                    <>
                        {/* ─── KPI Cards ─── */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <StatCard
                                icon={DollarSign}
                                label="Estimated Earnings"
                                value={formatCurrency(agg.estimatedEarnings, "USD")}
                                sub={getRangeLabel(range)}
                                accent="text-green-500"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Volume Attributed"
                                value={formatCurrency(agg.totalVolume, "USD")}
                                sub="Merchant sales"
                            />
                            <StatCard
                                icon={Receipt}
                                label="Transactions"
                                value={agg.transactionCount}
                                sub={agg.transactionCount > 0
                                    ? `~${formatCurrency(agg.totalVolume / agg.transactionCount, "USD")} avg`
                                    : "No transactions"}
                            />
                            <StatCard
                                icon={Store}
                                label="Merchants"
                                value={agg.merchantCount}
                                sub={topEarner ? `Top: ${topEarner.shopName}` : "—"}
                            />
                            <StatCard
                                icon={Activity}
                                label="Avg Commission"
                                value={`${(agg.averageBps / 100).toFixed(2)}%`}
                                sub={`${agg.averageBps} bps across all`}
                            />
                        </div>

                        {/* ─── Analytics Row ─── */}
                        {sortedMerchants.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Earnings Distribution Bar Chart */}
                                <div className="rounded-xl border bg-card p-5">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        Earnings by Merchant
                                    </h3>
                                    <EarningsBar merchants={sortedMerchants} />
                                </div>

                                {/* Distribution Donut */}
                                <div className="rounded-xl border bg-card p-5">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                        <PieChart className="h-4 w-4 text-primary" />
                                        Earnings Distribution
                                    </h3>
                                    <DistributionDonut merchants={sortedMerchants} />
                                </div>
                            </div>
                        )}

                        {/* ─── Bulk Withdraw ─── */}
                        {data.merchants.some((m) => m.splitAddress) && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border bg-gradient-to-r from-green-500/5 to-transparent">
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        <ArrowDownToLine className="h-4 w-4 text-green-500" />
                                        Withdraw All Earnings
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Triggers <code className="bg-muted/50 px-1 rounded">distribute()</code> on {data.merchants.filter(m => m.splitAddress).length} split contract{data.merchants.filter(m => m.splitAddress).length !== 1 ? 's' : ''} to release ETH, USDC, USDT, cbBTC, cbXRP, and SOL due to you.
                                    </p>
                                </div>
                                <button
                                    onClick={bulkWithdraw}
                                    disabled={bulkWithdrawing}
                                    className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                                >
                                    {bulkWithdrawing ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Withdrawing…</>
                                    ) : (
                                        <><ArrowDownToLine className="h-4 w-4" /> Withdraw All</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* ─── Merchant Breakdown Table ─── */}
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Store className="h-4 w-4 text-primary" />
                                    Merchant Breakdown
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    {data.merchants.length} merchant{data.merchants.length !== 1 ? "s" : ""} · Click column headers to sort
                                </span>
                            </div>

                            {data.merchants.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No merchants assigned</p>
                                    <p className="text-xs mt-2 max-w-sm mx-auto">
                                        You'll appear here once a partner adds your wallet as an agent on a merchant's split configuration.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] uppercase text-muted-foreground border-b tracking-wider">
                                            <tr>
                                                <th className="py-3 px-4 font-bold">Merchant</th>
                                                <th className="py-3 px-4 text-right font-bold cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("volume")}>
                                                    Volume <SortIndicator col="volume" />
                                                </th>
                                                <th className="py-3 px-4 text-right font-bold cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("txns")}>
                                                    Txns <SortIndicator col="txns" />
                                                </th>
                                                <th className="py-3 px-4 text-right font-bold cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("bps")}>
                                                    Your Cut <SortIndicator col="bps" />
                                                </th>
                                                <th className="py-3 px-4 text-right font-bold cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("earnings")}>
                                                    Earnings <SortIndicator col="earnings" />
                                                </th>
                                                <th className="py-3 px-4 text-right font-bold">Tip Share</th>
                                                <th className="py-3 px-4 text-center font-bold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sortedMerchants.map((m) => (
                                                <tr key={m.wallet} className="hover:bg-muted/10 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium">{m.shopName}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                            <TruncatedAddress address={m.wallet} />
                                                            {m.slug && <span className="text-primary/60">/{m.slug}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                                                        {formatCurrency(m.volume, "USD")}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                                                        {m.transactionCount}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                            {(m.agentBps / 100).toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-green-500">
                                                        {formatCurrency(m.estimatedEarnings, "USD")}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">
                                                        {formatCurrency(m.estimatedTipShare, "USD")}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {m.splitAddress ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <button
                                                                    onClick={() => withdrawForMerchant(m.splitAddress!, m.wallet)}
                                                                    disabled={withdrawStatus[m.wallet]?.startsWith("✓") || withdrawStatus[m.wallet] === "Distributing…"}
                                                                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition disabled:opacity-50 inline-flex items-center gap-1"
                                                                >
                                                                    {withdrawStatus[m.wallet] === "Distributing…" ? (
                                                                        <><Loader2 className="h-3 w-3 animate-spin" /> Working</>
                                                                    ) : (
                                                                        <><ArrowDownToLine className="h-3 w-3" /> Withdraw</>
                                                                    )}
                                                                </button>
                                                                {withdrawStatus[m.wallet] && withdrawStatus[m.wallet] !== "Distributing…" && (
                                                                    <span className={`text-[10px] ${withdrawStatus[m.wallet]?.startsWith("✓") ? "text-green-500" : "text-muted-foreground"}`}>
                                                                        {withdrawStatus[m.wallet]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground">No split</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Totals Row */}
                                        <tfoot>
                                            <tr className="border-t-2 border-foreground/20 font-semibold bg-muted/20">
                                                <td className="py-3 px-4 text-xs uppercase tracking-wider">Total</td>
                                                <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(agg.totalVolume, "USD")}</td>
                                                <td className="py-3 px-4 text-right tabular-nums">{agg.transactionCount}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-xs">{(agg.averageBps / 100).toFixed(2)}% avg</span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono tabular-nums text-green-500">{formatCurrency(agg.estimatedEarnings, "USD")}</td>
                                                <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">{formatCurrency(agg.totalTips, "USD")}</td>
                                                <td className="py-3 px-4" />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* ─── On-chain Verification ─── */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                On-Chain Verification
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                All earnings flow through PaymentSplitter contracts on Base (Coinbase L2). Verify balances and transactions on Blockscout.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Your Wallet</div>
                                        <TruncatedAddress address={agentWallet} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => copyAddr(agentWallet)} className="px-2 py-1 rounded-md border text-xs hover:bg-muted/50 transition">
                                            {copiedAddress === agentWallet ? "Copied" : "Copy"}
                                        </button>
                                        <a
                                            href={`https://base.blockscout.com/address/${agentWallet}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 rounded-md border text-xs inline-flex items-center gap-1 hover:bg-muted/50 transition"
                                        >
                                            Open <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                                {data.merchants.filter((m) => m.splitAddress).map((m) => (
                                    <div key={m.wallet} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="min-w-0">
                                            <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider truncate">
                                                {m.shopName}
                                            </div>
                                            <TruncatedAddress address={m.splitAddress!} />
                                        </div>
                                        <a
                                            href={`https://base.blockscout.com/address/${m.splitAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 rounded-md border text-xs inline-flex items-center gap-1 hover:bg-muted/50 transition flex-shrink-0"
                                        >
                                            Open <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── How It Works ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-xl border bg-card p-5 space-y-3">
                                <h3 className="font-semibold text-sm">How Withdrawal Works</h3>
                                <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
                                    <li>Each merchant has a <strong className="text-foreground">PaymentSplitter</strong> contract on Base that accumulates payments.</li>
                                    <li>Your share (based on your agent BPS) accrues automatically with each transaction.</li>
                                    <li>Click <strong className="text-foreground">Withdraw</strong> to trigger <code className="bg-muted/50 px-1 rounded text-xs">distribute()</code> — releases all tokens due to you.</li>
                                    <li>Tokens arrive in your connected wallet. Send to Coinbase or spend directly.</li>
                                </ol>
                            </div>
                            <div className="space-y-3">
                                <div className="rounded-xl border p-5 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                                    <div className="text-xs font-bold text-green-400 uppercase tracking-wider">Gas is Covered</div>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        Smart account wallets have gas sponsored. You don't need ETH in your wallet to withdraw — the platform covers transaction fees.
                                    </div>
                                </div>
                                <div className="rounded-xl border p-5 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
                                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">About Estimates</div>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        Earnings shown are estimates based on on-chain receipt data and your BPS rate. Actual payouts are determined by the smart contract's recorded shares.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : !loading && !error ? (
                    <div className="py-20 text-center text-muted-foreground">
                        <Users className="h-14 w-14 mx-auto mb-4 opacity-15" />
                        <p className="font-medium text-lg">No Agent Assignments Found</p>
                        <p className="text-sm mt-2 max-w-md mx-auto">
                            This wallet is not listed as an agent on any merchant splits. Ask your partner admin to add your wallet address in the split configuration.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* ─── Footer ─── */}
            <div className="text-center text-xs text-muted-foreground py-8 border-t mt-12 space-y-1">
                <p>{brand?.name ? `Powered by ${brand.name}` : "Agent Portal"} · Built on Base (Coinbase L2)</p>
                <p className="opacity-50">Reports are generated from on-chain receipt data. Download PDF or Excel for your records.</p>
            </div>
        </div>
    );
}
