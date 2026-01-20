"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, roundForCurrency, convertFromUsd, SUPPORTED_CURRENCIES } from "@/lib/fx";
import { fetchEthRates, fetchUsdRates } from "@/lib/eth";
import { QRCode } from "react-qrcode-logo";
import { createPortal } from "react-dom";

// Shared Logic extracted from TerminalPage
// Props allow overriding the "Operator" (Merchant) vs the Connected Wallet
interface TerminalInterfaceProps {
    merchantWallet: string; // The wallet receiving funds
    employeeId?: string;    // Optional employee ID to track
    employeeName?: string;
    employeeRole?: string;
    sessionId?: string;     // Optional active session ID
    onLogout?: () => void;
    brandName?: string;
    logoUrl?: string;
    theme?: any;
}

export default function TerminalInterface({ merchantWallet, employeeId, employeeName, employeeRole, sessionId, onLogout, brandName, logoUrl, theme }: TerminalInterfaceProps) {
    const [amountStr, setAmountStr] = useState<string>("");
    const [itemLabel, setItemLabel] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState("");
    const [terminalCurrency, setTerminalCurrency] = useState("USD");

    // Rates
    const [rates, setRates] = useState<Record<string, number>>({});
    const [usdRates, setUsdRates] = useState<Record<string, number>>({});

    useEffect(() => {
        Promise.all([fetchEthRates(), fetchUsdRates()])
            .then(([r, u]) => { setRates(r); setUsdRates(u); })
            .catch(() => { });
    }, []);

    // Calculator Logic
    function parseAmount(): number {
        const v = Number(amountStr || "0");
        return Number.isFinite(v) ? Math.max(0, v) : 0;
    }
    function appendDigit(d: string) {
        setAmountStr((prev) => {
            const next = (prev || "") + d;
            const parts = next.split(".");
            if (parts.length > 2) return prev || "";
            if (parts.length === 2 && parts[1].length > 2) return prev || "";
            return next.replace(/[^\d.]/g, "");
        });
    }
    function backspace() { setAmountStr((prev) => (prev || "").slice(0, -1)); }
    function clearAmount() { setAmountStr(""); }

    const baseUsd = parseAmount();
    const totalUsd = baseUsd;

    // Conversion
    const totalConverted = useMemo(() => {
        if (terminalCurrency === "USD") return totalUsd;
        const usdRate = Number(usdRates[terminalCurrency] || 0);
        if (usdRate > 0) return roundForCurrency(totalUsd * usdRate, terminalCurrency);
        const converted = convertFromUsd(totalUsd, terminalCurrency, rates);
        return converted > 0 ? roundForCurrency(converted, terminalCurrency) : totalUsd;
    }, [totalUsd, terminalCurrency, usdRates, rates]);

    // Receipt Generation
    const [qrOpen, setQrOpen] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);

    async function generateReceipt() {
        try {
            setLoading(true);
            setError("");
            const amt = parseAmount();
            if (!(amt > 0)) {
                setError("Enter an amount");
                return;
            }

            const payload = {
                amountUsd: +amt.toFixed(2),
                label: (itemLabel || "").trim() || "Terminal Payment",
                currency: terminalCurrency,
                employeeId, // Track employee
                sessionId   // Track session
            };

            const r = await fetch("/api/receipts/terminal", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": merchantWallet },
                body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) {
                setError(j?.error || "Failed to generate receipt");
                return;
            }
            setSelected(j.receipt);
            setQrOpen(true);
        } catch (e: any) {
            setError(e?.message || "Failed");
        } finally {
            setLoading(false);
        }
    }

    // End of Day / Summary Logic
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    async function openSummary() {
        setReportLoading(true);
        setError("");
        try {
            const now = new Date();
            const startTs = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime() / 1000);
            const endTs = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime() / 1000);

            const res = await fetch(`/api/terminal/reports?sessionId=${sessionId}&start=${startTs}&end=${endTs}&type=z-report&format=json`, {
                headers: { "x-wallet": merchantWallet }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load summary");

            setReportData(data);
            setSummaryOpen(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setReportLoading(false);
        }
    }

    async function closeDay() {
        if (!confirm("Are you sure you want to close the day? This will end the current session.")) return;
        setReportLoading(true);
        try {
            const r = await fetch("/api/terminal/session", {
                method: "POST",
                body: JSON.stringify({ sessionId, merchantWallet })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Failed to close session");

            // Success - maybe redirect or logout
            if (onLogout) onLogout();
            else window.location.reload();

        } catch (e: any) {
            alert(e.message);
            setReportLoading(false);
        }
    }

    // Portal URL for QR
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const portalUrl = selected
        ? `${origin}/portal/${encodeURIComponent(selected.receiptId)}?recipient=${encodeURIComponent(merchantWallet)}`
        : "";

    const isManagerOrKeyholder = employeeRole === 'manager' || employeeRole === 'keyholder';

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {logoUrl && <img src={logoUrl} className="h-10 w-10 object-contain" />}
                    <div>
                        <h1 className="text-md font-bold">{brandName || "Terminal"}</h1>
                        {employeeName && <div className="text-sm text-muted-foreground">Operator: {employeeName}</div>}
                    </div>
                </div>
                <div className="flex gap-2">
                    {isManagerOrKeyholder && (
                        <button
                            onClick={openSummary}
                            disabled={reportLoading}
                            className="px-4 py-2 text-sm border bg-background rounded-md hover:bg-muted disabled:opacity-50"
                        >
                            {reportLoading ? "Loading..." : "End of Day Summary"}
                        </button>
                    )}
                    {onLogout && (
                        <button onClick={onLogout} className="px-4 py-2 text-sm border rounded-md hover:bg-muted">
                            Logout
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keypad */}
                <div className="space-y-4">
                    <div className="bg-muted/10 border rounded-xl p-6 text-center space-y-2">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider">Amount</div>
                        <div className="text-4xl font-mono font-bold">{formatCurrency(baseUsd, terminalCurrency)}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "⌫"].map((btn) => (
                            <button
                                key={btn}
                                onClick={() => { if (btn === "⌫") backspace(); else if (btn === ".") appendDigit("."); else appendDigit(String(btn)); }}
                                className="h-16 rounded-xl border bg-background text-xl font-semibold hover:bg-muted/50 active:scale-95 transition-all"
                            >
                                {btn}
                            </button>
                        ))}
                        <button onClick={clearAmount} className="col-span-3 h-12 rounded-xl border text-sm text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                            Clear
                        </button>
                    </div>
                </div>

                {/* Details & Action */}
                <div className="space-y-4 flex flex-col">
                    <div className="bg-background border rounded-xl p-4 flex-1 space-y-4">
                        <div>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Currency</label>
                            <select
                                className="w-full mt-1 p-2 border rounded-md"
                                value={terminalCurrency}
                                onChange={e => setTerminalCurrency(e.target.value)}
                            >
                                {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Note / Label</label>
                            <input
                                className="w-full mt-1 p-2 border rounded-md"
                                placeholder="Optional description"
                                value={itemLabel}
                                onChange={e => setItemLabel(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 border-t mt-auto">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground">Total</span>
                                <span className="text-xl font-bold">{formatCurrency(totalConverted, terminalCurrency)}</span>
                            </div>
                            {terminalCurrency !== "USD" && (
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>USD Equiv</span>
                                    <span>${totalUsd.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

                    <button
                        onClick={generateReceipt}
                        disabled={loading || baseUsd <= 0}
                        className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? "Creating..." : "Generate Payment QR"}
                    </button>
                </div>
            </div>

            {/* QR Modal */}
            {/* QR / Payment Modal */}
            {qrOpen && selected && typeof window !== "undefined" && createPortal(
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in">
                    <div className="bg-[#0f0f12] text-white rounded-2xl max-w-sm w-full text-center relative shadow-2xl p-8 border border-white/10">
                        <button
                            onClick={() => setQrOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="opacity-70 group-hover:opacity-100">
                                <XIcon />
                            </span>
                        </button>

                        <h2 className="text-2xl font-bold mb-6">Scan to Pay</h2>

                        <div className="inline-block mb-4 p-2 rounded-xl border border-white/10">
                            <QRCode
                                value={portalUrl}
                                size={200}
                                fgColor="#ffffff"
                                bgColor="transparent"
                                qrStyle="dots"
                                eyeRadius={10}
                                eyeColor={(theme as any)?.secondaryColor || (theme as any)?.primaryColor || "#ffffff"}
                                logoImage={logoUrl}
                                logoWidth={40}
                                logoHeight={40}
                                removeQrCodeBehindLogo={true}
                                logoPadding={5}
                                ecLevel="H"
                                quietZone={10}
                            />
                        </div>

                        <div className="text-4xl font-mono font-bold mb-2 tracking-tight">
                            {formatCurrency(totalConverted, terminalCurrency)}
                        </div>

                        <div className="text-xs text-muted-foreground break-all px-4 opacity-50 mb-8 font-mono">
                            {portalUrl}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-3 border border-white/10 rounded-xl font-semibold hover:bg-white/5 transition-colors"
                            >
                                Print
                            </button>
                            <button
                                onClick={() => setQrOpen(false)}
                                className="px-4 py-3 text-white rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
                                style={{ backgroundColor: (theme as any)?.secondaryColor || (theme as any)?.primaryColor || "#000" }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* End of Day Summary Modal */}
            {summaryOpen && reportData && typeof window !== "undefined" && createPortal(
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in">
                    <div className="rounded-2xl max-w-2xl w-full text-center relative shadow-2xl flex flex-col max-h-[90vh] border border-white/10 bg-[#0f0f12] text-white">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold">End of Day Report</h2>
                            <button
                                onClick={() => setSummaryOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <XIcon />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            <button
                                className={`flex-1 py-3 text-sm font-semibold transition-colors`}
                                style={{
                                    borderBottom: !reportData.showDetails ? `2px solid ${(theme as any)?.secondaryColor || (theme as any)?.primaryColor || "#fff"}` : "transparent",
                                    color: !reportData.showDetails ? ((theme as any)?.secondaryColor || (theme as any)?.primaryColor || "#fff") : "#9ca3af"
                                }}
                                onClick={() => setReportData({ ...reportData, showDetails: false })}
                            >
                                Summary
                            </button>
                            <button
                                className={`flex-1 py-3 text-sm font-semibold transition-colors`}
                                style={{
                                    borderBottom: reportData.showDetails ? `2px solid ${(theme as any)?.secondaryColor || (theme as any)?.primaryColor || "#fff"}` : "transparent",
                                    color: reportData.showDetails ? ((theme as any)?.secondaryColor || (theme as any)?.primaryColor || "#fff") : "#9ca3af"
                                }}
                                onClick={() => setReportData({ ...reportData, showDetails: true })}
                            >
                                Details & Transactions
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 text-left">
                            {!reportData.showDetails ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Total Sales</p>
                                            <p className="text-3xl font-bold">{formatCurrency((reportData.summary?.totalSales || 0), "USD")}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Total Tips</p>
                                            <p className="text-3xl font-bold">{formatCurrency((reportData.summary?.totalTips || 0), "USD")}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-400">Transactions</span>
                                            <span className="text-lg font-bold">{reportData.summary?.transactionCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                            <span className="text-sm font-medium text-gray-400">Avg. Order Value</span>
                                            <span className="text-lg font-bold">{formatCurrency((reportData.summary?.averageOrderValue || 0), "USD")}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                            <span className="text-sm font-bold uppercase">Net Revenue</span>
                                            <span className="text-xl font-bold text-green-400">{formatCurrency((reportData.summary?.net || 0), "USD")}</span>
                                        </div>
                                    </div>

                                    {/* Payment Methods */}
                                    {reportData.paymentMethods && reportData.paymentMethods.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase">Payment Methods</h3>
                                            <div className="bg-white/5 rounded-lg border border-white/5 divide-y divide-white/5">
                                                {reportData.paymentMethods.map((pm: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 text-sm">
                                                        <span className="font-medium">{pm.method}</span>
                                                        <span>{formatCurrency(pm.total, "USD")}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-gray-400">Transactions ({reportData.receipts?.length || 0})</h3>
                                    </div>

                                    {reportData.receipts && reportData.receipts.length > 0 ? (
                                        <div className="border border-white/10 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-white/5 text-gray-400 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-2">Time</th>
                                                        <th className="px-4 py-2">Method</th>
                                                        <th className="px-4 py-2 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {reportData.receipts.map((r: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3 text-gray-400">
                                                                {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium">
                                                                {r.paymentMethod || r.currency || "Cash"}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold">
                                                                {formatCurrency(r.totalUsd, "USD")}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                            No detailed transactions available for this period.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-2xl">
                            <button
                                onClick={closeDay}
                                disabled={reportLoading}
                                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {reportLoading ? "Closing..." : "Close Day & Logout"}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                Closing the day ends your session. Values are final.
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function XIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6 18 18" /></svg>
}
