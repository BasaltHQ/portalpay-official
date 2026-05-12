"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { client, chain } from "@/lib/thirdweb/client";
import { BASE_USDC_ADDRESS } from "@/lib/eip712-subscriptions";
import {
    Plus, Trash2, User, Shield, ChevronLeft,
    Clock, DollarSign, CheckCircle, XCircle,
    TrendingUp, Calendar, Settings, History,
    Award, Wallet, Edit2, Save, X, Activity,
    BarChart3, CreditCard
} from "lucide-react";
import { format, formatDistanceToNow, startOfDay, subDays, subMonths } from "date-fns";
import { TeamMember } from "@/types/merchant-features";

type Session = {
    id: string;
    startTime: number;
    endTime?: number;
    totalSales?: number;
    totalTips?: number;
    tipsPaid?: boolean;
    tipsPaidAt?: number;
};

type MemberStats = {
    totalSales: number;
    totalTips: number;
    unpaidTips: number;
    sessionCount: number;
    avgSalePerSession: number;
    lastActive: number;
};

type TabType = "overview" | "sessions" | "tips" | "performance" | "settings";
type TipsTimeRange = "today" | "7d" | "30d" | "all";

export default function TeamPanel({ overrideWallet }: { overrideWallet?: string }) {
    const account = useActiveAccount();
    // Use override wallet if provided (for Partner Admins managing Clients), otherwise fallback to connected account
    const activeWallet = overrideWallet || account?.address;
    const [stats, setStats] = useState<{
        sales: Record<string, number>,
        sessions: Record<string, number>,
        tips: Record<string, number>,
        unpaidTips: Record<string, number>
    }>({ sales: {}, sessions: {}, tips: {}, unpaidTips: {} });
    const [processingPayout, setProcessingPayout] = useState<string | null>(null);

    // Member State
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Selected member detail view
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [memberSessions, setMemberSessions] = useState<Session[]>([]);
    const [strayReceipts, setStrayReceipts] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Edit mode for member settings
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPin, setEditPin] = useState("");
    const [editRole, setEditRole] = useState<"manager" | "staff">("staff");
    const [editLinkedWallet, setEditLinkedWallet] = useState("");
    const [saving, setSaving] = useState(false);

    // Add Member State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPin, setNewPin] = useState("");
    const [newRole, setNewRole] = useState<"manager" | "staff">("staff");
    const [newLinkedWallet, setNewLinkedWallet] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [tipsTimeRange, setTipsTimeRange] = useState<TipsTimeRange>("all");

    // Modal system — replaces all browser confirm/alert
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        confirmLabel?: string;
        variant?: "danger" | "default";
        onConfirm: () => void;
    } | null>(null);
    const [endSessionModal, setEndSessionModal] = useState<{
        sessionId: string;
        startTime: number;
        defaultEndTime: string; // ISO datetime-local string
    } | null>(null);
    const [endSessionTime, setEndSessionTime] = useState("");
    const [payoutModal, setPayoutModal] = useState<{ staffId: string, amount: number } | null>(null);
    const [cryptoTransferModal, setCryptoTransferModal] = useState<{ staffId: string, amount: number, address: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Auto-dismiss toast
    React.useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    async function loadTeam() {
        try {
            setLoading(true);
            setError("");
            const headers = { "x-wallet": activeWallet || "" };

            const [rTeam, rStats] = await Promise.all([
                fetch("/api/merchant/team", { headers }),
                fetch("/api/merchant/team/stats", { headers })
            ]);

            const jTeam = await rTeam.json();
            const jStats = await rStats.json();

            if (!rTeam.ok) throw new Error(jTeam.error || "Failed to load team");

            setMembers(jTeam.items || []);
            if (rStats.ok) {
                setStats({
                    sales: jStats.sales || {},
                    sessions: jStats.sessions || {},
                    tips: jStats.tips || {},
                    unpaidTips: jStats.unpaidTips || {}
                });
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadMemberSessions(memberId: string) {
        try {
            setSessionsLoading(true);
            const res = await fetch(`/api/merchant/team/sessions?memberId=${encodeURIComponent(memberId)}`, {
                headers: { "x-wallet": activeWallet || "" }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data.sessions)) {
                setMemberSessions(data.sessions);
                setStrayReceipts(data.strayReceipts || []);
            } else {
                setMemberSessions([]);
                setStrayReceipts([]);
            }
        } catch (e) {
            console.error("Failed to load sessions", e);
            setMemberSessions([]);
        } finally {
            setSessionsLoading(false);
        }
    }

    function openMemberDetail(member: TeamMember) {
        setSelectedMember(member);
        setActiveTab("overview");
        setEditMode(false);
        setEditName(member.name);
        setEditPin("");
        setEditRole(member.role);
        setEditLinkedWallet((member as any).linkedWallet || "");
        loadMemberSessions(member.id);
    }

    function closeMemberDetail() {
        setSelectedMember(null);
        setMemberSessions([]);
        setStrayReceipts([]);
        setEditMode(false);
    }

    useEffect(() => {
        // Load if we have ANY valid wallet context (connected or override)
        if (activeWallet) loadTeam();
    }, [activeWallet]);

    async function handleAdd() {
        if (!newName || !newPin) return;
        try {
            setAddLoading(true);
            const r = await fetch("/api/merchant/team", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": account?.address || ""
                },
                body: JSON.stringify({
                    name: newName,
                    pin: newPin,
                    role: newRole,
                    linkedWallet: newLinkedWallet
                })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Failed to add member");

            setMembers(prev => [...prev, j.item]);
            setIsAddOpen(false);
            setNewName("");
            setNewPin("");
            setNewRole("staff");
            setNewLinkedWallet("");
        } catch (e: any) {
            setToast({ message: e.message, type: "error" });
        } finally {
            setAddLoading(false);
        }
    }

    function handleDelete(id: string) {
        setConfirmModal({
            title: "Remove Team Member",
            message: "Are you sure you want to remove this team member? This action cannot be undone.",
            confirmLabel: "Remove",
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const r = await fetch(`/api/merchant/team?id=${id}`, {
                        method: "DELETE",
                        headers: { "x-wallet": activeWallet || "" }
                    });
                    if (!r.ok) throw new Error("Failed to delete");
                    setMembers(prev => prev.filter(m => m.id !== id));
                    if (selectedMember?.id === id) {
                        closeMemberDetail();
                    }
                    setToast({ message: "Team member removed.", type: "success" });
                } catch (e: any) {
                    setToast({ message: e.message, type: "error" });
                }
            }
        });
    }

    async function handleUpdateMember() {
        if (!selectedMember || !editName) return;
        try {
            setSaving(true);
            const body: any = {
                id: selectedMember.id,
                name: editName,
                role: editRole,
                linkedWallet: editLinkedWallet || null
            };
            if (editPin) body.pin = editPin;

            const r = await fetch("/api/merchant/team", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": account?.address || ""
                },
                body: JSON.stringify(body)
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Failed to update");

            // Update local state
            const updated = {
                ...selectedMember,
                name: editName,
                role: editRole,
                linkedWallet: editLinkedWallet
            };

            setMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
            setSelectedMember(updated);
            setEditMode(false);
            setEditPin("");
            setToast({ message: "Member updated successfully.", type: "success" });
        } catch (e: any) {
            setToast({ message: e.message, type: "error" });
        } finally {
            setSaving(false);
        }
    }

    function openPayoutModal(staffId: string, amount: number) {
        console.log("Opening payout modal for", staffId, "Amount:", amount);
        setPayoutModal({ staffId, amount });
    }

    async function executePayout(method: 'cash' | 'crypto') {
        console.log("Executing payout with method:", method);
        if (!payoutModal) return;
        const { staffId, amount } = payoutModal;
        setPayoutModal(null);
        
        if (method === 'crypto') {
            setCryptoTransferModal({ staffId, amount, address: "" });
            return;
        }

        try {
            setProcessingPayout(staffId);
            const r = await fetch("/api/merchant/team/payout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": activeWallet || ""
                },
                body: JSON.stringify({ staffId, method })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Payout failed");

            setToast({ message: `Successfully paid out ${j.count} sessions (${method}).`, type: "success" });
            loadTeam();
            if (selectedMember?.id === staffId) {
                loadMemberSessions(staffId);
            }
        } catch (e: any) {
            console.error("Payout error:", e);
            setToast({ message: e.message, type: "error" });
        } finally {
            setProcessingPayout(null);
        }
    }

    async function handleCryptoTransferSuccess() {
        if (!cryptoTransferModal) return;
        const { staffId } = cryptoTransferModal;
        setCryptoTransferModal(null);
        try {
            setProcessingPayout(staffId);
            const r = await fetch("/api/merchant/team/payout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": activeWallet || ""
                },
                body: JSON.stringify({ staffId, method: 'crypto' })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Payout failed");

            setToast({ message: `Successfully paid out ${j.count} sessions (crypto).`, type: "success" });
            loadTeam();
            if (selectedMember?.id === staffId) {
                loadMemberSessions(staffId);
            }
        } catch (e: any) {
            console.error("Payout error:", e);
            setToast({ message: e.message, type: "error" });
        } finally {
            setProcessingPayout(null);
        }
    }

    function openEndSessionModal(sessionId: string, startTime: number) {
        // Find the next session that starts after this one (within 12 hours)
        const twelveHoursLater = startTime + (12 * 3600);
        const sortedSessions = [...memberSessions]
            .filter(s => s.startTime > startTime && s.startTime <= twelveHoursLater)
            .sort((a, b) => a.startTime - b.startTime);

        let defaultEndEpoch: number;
        if (sortedSessions.length > 0) {
            // 1 minute before next session's start
            defaultEndEpoch = sortedSessions[0].startTime - 60;
        } else {
            // 12 hours after session start
            defaultEndEpoch = twelveHoursLater;
        }

        // Convert to datetime-local format (YYYY-MM-DDTHH:MM)
        const d = new Date(defaultEndEpoch * 1000);
        const dtLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        setEndSessionTime(dtLocal);
        setEndSessionModal({ sessionId, startTime, defaultEndTime: dtLocal });
    }

    async function executeEndSession() {
        if (!endSessionModal) return;
        const endEpoch = Math.floor(new Date(endSessionTime).getTime() / 1000);
        if (isNaN(endEpoch) || endEpoch <= endSessionModal.startTime) {
            setToast({ message: "End time must be after the session start time.", type: "error" });
            return;
        }
        try {
            const r = await fetch("/api/merchant/team/sessions/end", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": activeWallet || ""
                },
                body: JSON.stringify({ sessionId: endSessionModal.sessionId, endTime: endEpoch })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Failed to end session");

            setMemberSessions(prev => prev.map(s =>
                s.id === endSessionModal.sessionId ? { ...s, endTime: j.endTime || endEpoch } : s
            ));
            setEndSessionModal(null);
            setToast({ message: "Session ended successfully.", type: "success" });
        } catch (e: any) {
            setToast({ message: e.message, type: "error" });
        }
    }

    // Compute member stats
    const memberStats = useMemo((): MemberStats | null => {
        if (!selectedMember) return null;
        const id = selectedMember.id;
        const totalSales = stats.sales[id] || 0;
        const totalTips = stats.tips[id] || 0;
        const unpaidTips = stats.unpaidTips[id] || 0;
        const sessionCount = memberSessions.length;
        const avgSalePerSession = sessionCount > 0 ? totalSales / sessionCount : 0;
        const lastActive = stats.sessions[id] || 0;
        return { totalSales, totalTips, unpaidTips, sessionCount, avgSalePerSession, lastActive };
    }, [selectedMember, stats, memberSessions]);

    if (!activeWallet) return <div className="p-4 text-muted-foreground">Please connect wallet.</div>;

    const formatMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
    const formatDate = (ts: number) => ts ? format(new Date(ts * 1000), "MMM d, h:mm a") : "-";
    const formatDateTime = (ts: number) => ts ? format(new Date(ts * 1000), "MMM d, yyyy h:mm a") : "-";
    const formatTimeAgo = (ts: number) => ts ? formatDistanceToNow(new Date(ts * 1000), { addSuffix: true }) : "Never";

    function renderModals() {
        return (
            <>
                {/* ─── Confirmation Modal ─── */}
                {confirmModal && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <div className="relative glass-pane rounded-2xl border border-foreground/10 p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-2">{confirmModal.title}</h3>
                            <p className="text-sm text-muted-foreground mb-6">{confirmModal.message}</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-foreground/10 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">Cancel</button>
                                <button onClick={confirmModal.onConfirm} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmModal.variant === "danger" ? "bg-red-600 text-white hover:bg-red-700" : "bg-foreground text-background hover:opacity-90"}`}>{confirmModal.confirmLabel || "Confirm"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── End Session Modal ─── */}
                {endSessionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEndSessionModal(null)}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <div className="relative glass-pane rounded-2xl border border-foreground/10 p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-1">End Session</h3>
                            <p className="text-sm text-muted-foreground mb-5">
                                Set the clock-out time for this session. Started {format(new Date(endSessionModal.startTime * 1000), "MMM d, yyyy 'at' h:mm a")}.
                            </p>
                            <label className="block mb-4">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Clock Out Time</span>
                                <input
                                    type="datetime-local"
                                    value={endSessionTime}
                                    onChange={e => setEndSessionTime(e.target.value)}
                                    min={(() => {
                                        const d = new Date(endSessionModal.startTime * 1000);
                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    })()}
                                    className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-foreground/5 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow [color-scheme:dark]"
                                />
                            </label>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setEndSessionModal(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-foreground/10 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">Cancel</button>
                                <button onClick={executeEndSession} className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors">End Session</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Payout Modal ─── */}
                {payoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPayoutModal(null)}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <div className="relative glass-pane rounded-2xl border border-foreground/10 p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-2">Process Payout</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                You are about to pay out <strong className="text-emerald-400">{formatMoney(payoutModal.amount)}</strong> in pending tips. How would you like to record this payment?
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={() => executePayout('crypto')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 hover:border-blue-500/50 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                                        <Wallet size={20} />
                                    </div>
                                    <div className="text-sm font-medium">Send Crypto</div>
                                </button>
                                <button
                                    onClick={() => executePayout('cash')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 hover:border-emerald-500/50 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                                        <DollarSign size={20} />
                                    </div>
                                    <div className="text-sm font-medium">Paid Cash</div>
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setPayoutModal(null)}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-foreground/10 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Crypto Transfer Modal ─── */}
                {cryptoTransferModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCryptoTransferModal(null)}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <div className="relative glass-pane rounded-2xl border border-foreground/10 p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-2">Send USDC Transfer</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Send <strong className="text-emerald-400">{formatMoney(cryptoTransferModal.amount)}</strong> to the team member.
                            </p>

                            <div className="space-y-4 mb-6">
                                <label className="block">
                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Recipient Address</span>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={cryptoTransferModal.address}
                                        onChange={e => setCryptoTransferModal({ ...cryptoTransferModal, address: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-foreground/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Amount (USDC)</span>
                                    <input
                                        type="number"
                                        value={cryptoTransferModal.amount}
                                        onChange={e => setCryptoTransferModal({ ...cryptoTransferModal, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-foreground/10 bg-foreground/5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                    />
                                </label>
                            </div>

                            <div className="flex gap-3 justify-end items-center">
                                <button
                                    onClick={() => setCryptoTransferModal(null)}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-foreground/10 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <TransactionButton
                                    transaction={() => {
                                        if (!cryptoTransferModal.address) throw new Error("Please enter a recipient address");
                                        if (cryptoTransferModal.amount <= 0) throw new Error("Amount must be greater than 0");
                                        return transfer({
                                            contract: getContract({ client, chain, address: BASE_USDC_ADDRESS }),
                                            to: cryptoTransferModal.address,
                                            amount: cryptoTransferModal.amount.toString()
                                        });
                                    }}
                                    onTransactionConfirmed={() => handleCryptoTransferSuccess()}
                                    onError={(err) => setToast({ message: err.message, type: "error" })}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                    style={{ minWidth: '160px', height: '38px', borderRadius: '0.5rem', fontSize: '14px' }}
                                >
                                    Send & Mark Paid
                                </TransactionButton>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Toast ─── */}
                {toast && (
                    <div className={`fixed bottom-6 right-6 z-[10000] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${toast.type === "error" ? "bg-red-950/80 border-red-500/30 text-red-200" : "bg-emerald-950/80 border-emerald-500/30 text-emerald-200"}`}>
                        {toast.type === "error" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                )}
            </>
        );
    }

    // Tab content renderers
    function renderOverviewTab() {
        if (!selectedMember || !memberStats) return null;
        return (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-blue-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Sales</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">{formatMoney(memberStats.totalSales)}</div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-emerald-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Tips</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">{formatMoney(memberStats.totalTips)}</div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-amber-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Unpaid Tips</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">{formatMoney(memberStats.unpaidTips)}</div>
                        {memberStats.unpaidTips > 0 && (
                            <button
                                onClick={() => openPayoutModal(selectedMember.id, memberStats.unpaidTips)}
                                disabled={processingPayout === selectedMember.id}
                                className="mt-2 text-xs bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {processingPayout === selectedMember.id ? "Processing..." : "Pay Now"}
                            </button>
                        )}
                    </div>
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-purple-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sessions</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">{memberStats.sessionCount}</div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="glass-pane p-4 rounded-xl border">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={14} /> Performance</h4>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg. Sale per Session</span>
                                <span className="font-medium tabular-nums">{formatMoney(memberStats.avgSalePerSession)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tip Rate</span>
                                <span className="font-medium tabular-nums">
                                    {memberStats.totalSales > 0 ? ((memberStats.totalTips / memberStats.totalSales) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock size={14} /> Activity</h4>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Active</span>
                                <span className="font-medium">{formatTimeAgo(memberStats.lastActive)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Member Since</span>
                                <span className="font-medium">{formatDate((selectedMember as any).createdAt || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Sessions Preview */}
                <div className="glass-pane rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 border-b border-foreground/5 flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2"><History size={14} /> Recent Sessions</h4>
                        <button onClick={() => setActiveTab("sessions")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">View All →</button>
                    </div>
                    {sessionsLoading ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : memberSessions.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No sessions recorded yet.</div>
                    ) : (
                        <div className="divide-y divide-foreground/5">
                            {memberSessions.slice(0, 3).map(s => (
                                <div key={s.id} className="px-4 py-3 flex items-center justify-between text-sm">
                                    <div>
                                        <div className="font-medium text-sm">{formatDateTime(s.startTime)}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {s.endTime ? `Ended ${formatTimeAgo(s.endTime)}` : "Currently Active"}
                                        </div>
                                    </div>
                                    <div className="text-right tabular-nums">
                                        <div className="font-medium">{formatMoney(s.totalSales || 0)}</div>
                                        <div className="text-xs text-emerald-400">+{formatMoney(s.totalTips || 0)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderSessionsTab() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">All Sessions</h4>
                    <span className="text-xs text-muted-foreground tabular-nums">{memberSessions.length} total</span>
                </div>
                {sessionsLoading ? (
                    <div className="glass-pane rounded-xl border p-12 flex flex-col items-center justify-center">
                        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin mb-3" />
                        <div className="text-sm text-muted-foreground">Loading sessions...</div>
                    </div>
                ) : memberSessions.length === 0 ? (
                    <div className="glass-pane rounded-xl border flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-3">
                            <Clock className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <div className="text-sm font-semibold">No sessions found</div>
                        <div className="text-xs text-muted-foreground mt-1">Sessions will appear here after clock-ins.</div>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Card grid */}
                        <div className="sm:hidden grid grid-cols-1 gap-3">
                            {memberSessions.map(s => (
                                <div key={s.id} className="glass-pane rounded-xl border p-3.5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-medium">{format(new Date(s.startTime * 1000), "MMM d, yyyy")}</div>
                                        {s.endTime && (s.totalTips || 0) === 0 ? null : s.tipsPaid ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium"><CheckCircle size={11} /> Paid</span>
                                        ) : s.endTime ? (
                                            <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-medium"><XCircle size={11} /> Unpaid</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">Active</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <div className="text-muted-foreground">Clock In</div>
                                            <div className="font-medium mt-0.5">{format(new Date(s.startTime * 1000), "h:mm a")}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Clock Out</div>
                                            <div className="font-medium mt-0.5">{s.endTime ? format(new Date(s.endTime * 1000), "h:mm a") : "—"}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Sales</div>
                                            <div className="font-semibold tabular-nums mt-0.5">{formatMoney(s.totalSales || 0)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Tips</div>
                                            <div className="font-semibold tabular-nums mt-0.5 text-emerald-400">{formatMoney(s.totalTips || 0)}</div>
                                        </div>
                                    </div>
                                    {!s.endTime && (
                                        <button
                                            onClick={() => openEndSessionModal(s.id, s.startTime)}
                                            className="mt-2 w-full text-xs text-amber-400 border border-amber-500/30 rounded-lg py-1.5 hover:bg-amber-500/10 transition-colors font-medium"
                                        >
                                            End Session
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Data table */}
                        <div className="hidden sm:block glass-pane rounded-xl border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-foreground/5">
                                        <th className="text-left px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Clock In</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Clock Out</th>
                                        <th className="text-right px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sales</th>
                                        <th className="text-right px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tips</th>
                                        <th className="text-center px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="text-right px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/5">
                                    {memberSessions.map(s => (
                                        <tr key={s.id} className="hover:bg-foreground/[0.02] transition-colors">
                                            <td className="px-4 py-3.5">{format(new Date(s.startTime * 1000), "MMM d, yyyy")}</td>
                                            <td className="px-4 py-3.5 tabular-nums">{format(new Date(s.startTime * 1000), "h:mm a")}</td>
                                            <td className="px-4 py-3.5 tabular-nums">{s.endTime ? format(new Date(s.endTime * 1000), "h:mm a") : <span className="text-emerald-400 font-medium">Active</span>}</td>
                                            <td className="px-4 py-3.5 text-right font-medium tabular-nums">{formatMoney(s.totalSales || 0)}</td>
                                            <td className="px-4 py-3.5 text-right text-emerald-400 tabular-nums">{formatMoney(s.totalTips || 0)}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                {(s.totalTips || 0) === 0 ? (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                ) : s.tipsPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} /> Paid</span>
                                                ) : s.endTime ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-400 text-xs"><XCircle size={12} /> Unpaid</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                {!s.endTime && (
                                                    <button
                                                        onClick={() => openEndSessionModal(s.id, s.startTime)}
                                                        className="text-xs text-amber-400 border border-amber-500/30 rounded-md px-2.5 py-1 hover:bg-amber-500/10 transition-colors font-medium"
                                                    >
                                                        End
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        );
    }

    function renderTipsTab() {
        // Time range filter
        const now = new Date();
        const getRangeStart = (): number => {
            switch (tipsTimeRange) {
                case "today": return Math.floor(startOfDay(now).getTime() / 1000);
                case "7d": return Math.floor(subDays(now, 7).getTime() / 1000);
                case "30d": return Math.floor(subMonths(now, 1).getTime() / 1000);
                default: return 0;
            }
        };
        const rangeStart = getRangeStart();

        // Filter sessions by time range — include ALL sessions with tips (even active ones)
        const filteredSessions = memberSessions.filter(s => s.startTime >= rangeStart);
        const sessionsWithTips = filteredSessions.filter(s => (s.totalTips || 0) > 0);
        const paidSessions = filteredSessions.filter(s => s.tipsPaid && (s.totalTips || 0) > 0);
        const unpaidSessions = filteredSessions.filter(s => !s.tipsPaid && (s.totalTips || 0) > 0);
        
        const filteredStrays = strayReceipts.filter(r => r.startTime >= rangeStart);
        const paidStrays = filteredStrays.filter(r => r.tipsPaid);
        const unpaidStrays = filteredStrays.filter(r => !r.tipsPaid);

        const totalPaid = paidSessions.reduce((sum, s) => sum + (s.totalTips || 0), 0) + paidStrays.reduce((sum, r) => sum + (r.totalTips || 0), 0);
        const totalUnpaid = unpaidSessions.reduce((sum, s) => sum + (s.totalTips || 0), 0) + unpaidStrays.reduce((sum, r) => sum + (r.totalTips || 0), 0);
        const totalTips = sessionsWithTips.reduce((sum, s) => sum + (s.totalTips || 0), 0) + filteredStrays.reduce((sum, r) => sum + (r.totalTips || 0), 0);

        const timeRanges: { key: TipsTimeRange; label: string }[] = [
            { key: "today", label: "Today" },
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "all", label: "All Time" },
        ];

        return (
            <div className="space-y-6">
                {/* Time Range Selector */}
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Tips Overview</h4>
                    <div className="flex items-center gap-1 rounded-lg border border-foreground/10 p-0.5">
                        {timeRanges.map(r => (
                            <button
                                key={r.key}
                                onClick={() => setTipsTimeRange(r.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tipsTimeRange === r.key
                                    ? "bg-foreground text-background"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-blue-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Tips</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">
                            {formatMoney(tipsTimeRange === "all" && memberStats ? memberStats.totalTips : totalTips)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {tipsTimeRange === "all" ? "All receipts" : `${sessionsWithTips.length} sessions`}
                        </div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-emerald-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Paid Out</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1 text-emerald-400">{formatMoney(totalPaid)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{paidSessions.length} sessions</div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-amber-500/40">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1 text-amber-400">
                            {formatMoney(totalUnpaid)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{unpaidSessions.length + unpaidStrays.length} entries</div>
                        {totalUnpaid > 0 && selectedMember && (
                            <button
                                onClick={() => openPayoutModal(selectedMember.id, totalUnpaid)}
                                disabled={processingPayout === selectedMember.id}
                                className="mt-3 w-full text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {processingPayout === selectedMember.id ? "Processing..." : "Pay All"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tip History */}
                <div className="glass-pane rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 border-b border-foreground/5 flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Session Tip Breakdown</h4>
                        <span className="text-xs text-muted-foreground tabular-nums">{sessionsWithTips.length} entries</span>
                    </div>
                    {tipsTimeRange === "all" && memberStats && memberStats.totalTips > 0 && sessionsWithTips.length === 0 && (
                        <div className="px-4 py-2.5 border-b border-foreground/5 bg-blue-500/5">
                            <p className="text-xs text-blue-400">
                                Tips totaling {formatMoney(memberStats.totalTips)} are tracked on individual receipts attributed to this team member. Session-level tip breakdowns appear here when sessions are ended with tips allocated.
                            </p>
                        </div>
                    )}
                    {sessionsWithTips.length === 0 && !(tipsTimeRange === "all" && memberStats && memberStats.totalTips > 0) ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {tipsTimeRange === "all" ? "No tips recorded yet." : `No tips in this time range.`}
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-foreground/5 max-h-[28rem] overflow-y-auto">
                            {sessionsWithTips.map(s => (
                                <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">{formatDateTime(s.startTime)}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Sale: {formatMoney(s.totalSales || 0)}</div>
                                    </div>
                                    <div className="text-right tabular-nums">
                                        <div className="font-semibold text-emerald-400">{formatMoney(s.totalTips || 0)}</div>
                                        <div className={`text-xs ${s.tipsPaid ? "text-emerald-400" : s.endTime ? "text-amber-400" : "text-blue-400"}`}>
                                            {s.tipsPaid ? `Paid ${s.tipsPaidAt ? formatTimeAgo(s.tipsPaidAt) : ""}` : s.endTime ? "Pending" : "Active"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stray Receipts */}
                {filteredStrays.length > 0 && (
                    <div className="glass-pane rounded-xl border overflow-hidden mt-6">
                        <div className="px-4 py-3 border-b border-foreground/5 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-blue-400">Unassigned Tip Receipts</h4>
                            <span className="text-xs text-muted-foreground tabular-nums">{filteredStrays.length} entries</span>
                        </div>
                        <div className="px-4 py-2.5 border-b border-foreground/5 bg-blue-500/5">
                            <p className="text-xs text-blue-400">
                                These receipts have tips attributed to this team member but were not captured within an active session. They are included in the pending totals.
                            </p>
                        </div>
                        <div className="divide-y divide-foreground/5 max-h-[28rem] overflow-y-auto">
                            {filteredStrays.map(r => (
                                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">{formatDateTime(r.startTime)}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Sale: {formatMoney(r.totalSales || 0)}</div>
                                    </div>
                                    <div className="text-right tabular-nums">
                                        <div className="font-semibold text-emerald-400">{formatMoney(r.totalTips || 0)}</div>
                                        <div className={`text-xs ${r.tipsPaid ? "text-emerald-400" : "text-amber-400"}`}>
                                            {r.tipsPaid ? `Paid ${r.tipsPaidAt ? formatTimeAgo(r.tipsPaidAt) : ""}` : "Pending"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderPerformanceTab() {
        if (!memberStats) return null;

        // Calculate some performance metrics
        const sessionsWithSales = memberSessions.filter(s => (s.totalSales || 0) > 0);
        const bestSession = sessionsWithSales.reduce((best, s) => (s.totalSales || 0) > (best?.totalSales || 0) ? s : best, sessionsWithSales[0]);
        const avgSessionDuration = memberSessions.filter(s => s.endTime).reduce((sum, s) => sum + ((s.endTime! - s.startTime) / 3600), 0) / Math.max(1, memberSessions.filter(s => s.endTime).length);

        return (
            <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="glass-pane p-4 rounded-xl border">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg. Session Sales</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">{formatMoney(memberStats.avgSalePerSession)}</div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tip Rate</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">
                            {memberStats.totalSales > 0 ? ((memberStats.totalTips / memberStats.totalSales) * 100).toFixed(1) : 0}%
                        </div>
                    </div>
                    <div className="glass-pane p-4 rounded-xl border">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg. Session Length</div>
                        <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">{avgSessionDuration.toFixed(1)} hrs</div>
                    </div>
                </div>

                {/* Best Session */}
                {bestSession && (
                    <div className="glass-pane p-4 rounded-xl border border-l-2 border-l-amber-500/40">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="text-amber-400" size={16} />
                            <span className="text-sm font-semibold">Best Session</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">{formatDateTime(bestSession.startTime)}</div>
                            <div className="text-right tabular-nums">
                                <div className="text-xl font-semibold">{formatMoney(bestSession.totalSales || 0)}</div>
                                <div className="text-xs text-emerald-400">+{formatMoney(bestSession.totalTips || 0)} tips</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Chart Placeholder */}
                <div className="glass-pane p-8 rounded-xl border text-center">
                    <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <div className="text-sm text-muted-foreground">Performance charts coming soon</div>
                </div>
            </div>
        );
    }

    function renderSettingsTab() {
        if (!selectedMember) return null;

        return (
            <div className="space-y-6">
                {/* Edit Profile */}
                <div className="glass-pane rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 border-b border-foreground/5 flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Profile Settings</h4>
                        {!editMode ? (
                            <button onClick={() => setEditMode(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                                <Edit2 size={12} /> Edit
                            </button>
                        ) : (
                            <button onClick={() => setEditMode(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                                <X size={12} /> Cancel
                            </button>
                        )}
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Name</label>
                            {editMode ? (
                                <input
                                    className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                            ) : (
                                <div className="h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] flex items-center text-sm">{selectedMember.name}</div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                            {editMode ? (
                                <select
                                    className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                    value={editRole}
                                    onChange={e => setEditRole(e.target.value as any)}
                                >
                                    <option value="staff">Staff</option>
                                    <option value="manager">Manager</option>
                                </select>
                            ) : (
                                <div className="h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] flex items-center capitalize text-sm">{selectedMember.role}</div>
                            )}
                        </div>
                        {selectedMember.role === 'manager' && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Linked Wallet Address</label>
                                {editMode ? (
                                    <>
                                        <input
                                            className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                            value={editLinkedWallet}
                                            onChange={e => setEditLinkedWallet(e.target.value)}
                                            placeholder="0x..."
                                        />
                                        <p className="text-[11px] text-muted-foreground/70 mt-1.5">Allows this manager to access the Multi-Org Reports Panel.</p>
                                    </>
                                ) : (
                                    <div className="h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] flex items-center font-mono text-xs text-muted-foreground">
                                        {(selectedMember as any).linkedWallet || "Not Linked"}
                                    </div>
                                )}
                            </div>
                        )}
                        {editMode && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">New PIN <span className="font-normal text-muted-foreground/60">(leave blank to keep current)</span></label>
                                <input
                                    className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                    type="password"
                                    inputMode="numeric"
                                    placeholder="••••"
                                    value={editPin}
                                    onChange={e => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>
                        )}
                        {editMode && (
                            <button
                                onClick={handleUpdateMember}
                                disabled={saving || !editName}
                                className="w-full h-10 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Save size={14} />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                    </div>
                </div>


                {/* Danger Zone */}
                <div className="glass-pane rounded-xl border border-red-500/20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-red-500/10">
                        <h4 className="text-sm font-semibold text-red-400">Danger Zone</h4>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Removing this team member will revoke their access. Their historical data will be preserved.</p>
                        <button
                            onClick={() => handleDelete(selectedMember.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={14} />
                            Remove Team Member
                        </button>
                    </div>
                </div>
            </div >
        );
    }

    // Member Detail View
    if (selectedMember) {
        return (
            <>
            <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-24">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={closeMemberDetail} className="p-2 rounded-lg border border-foreground/10 hover:bg-foreground/5 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-foreground text-lg font-semibold">
                            {selectedMember.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{selectedMember.name}</h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium mt-0.5 ${selectedMember.role === 'manager'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-foreground/5 text-muted-foreground border border-foreground/10'
                                }`}>
                                {selectedMember.role === 'manager' ? <Shield size={10} /> : <User size={10} />}
                                {selectedMember.role.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs — underline style, responsive */}
                <div className="flex items-center border-b border-foreground/10 overflow-x-auto overflow-y-hidden scrollbar-none -mx-1">
                    {([
                        { key: "overview", label: "Overview", icon: Activity },
                        { key: "sessions", label: "Sessions", icon: Clock },
                        { key: "tips", label: "Tips", icon: CreditCard },
                        { key: "performance", label: "Stats", icon: TrendingUp },
                        { key: "settings", label: "Settings", icon: Settings },
                    ] as { key: TabType; label: string; icon: any }[]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors -mb-px border-b-2 ${activeTab === tab.key
                                ? "text-foreground border-foreground"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:border-foreground/30"
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === "overview" && renderOverviewTab()}
                    {activeTab === "sessions" && renderSessionsTab()}
                    {activeTab === "tips" && renderTipsTab()}
                    {activeTab === "performance" && renderPerformanceTab()}
                    {activeTab === "settings" && renderSettingsTab()}
                </div>
            </div>

            {renderModals()}
            </>
        );
    }

    // Team List View
    return (
        <>
        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-24">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage employees, track performance, and process tip payouts.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors shrink-0"
                >
                    <Plus size={16} /> Add Member
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-sm text-red-400">
                    <XCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass-pane rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold tracking-tight">Add Team Member</h2>
                            <button onClick={() => setIsAddOpen(false)} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
                                <input
                                    className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">PIN Code (4-6 digits)</label>
                                <input
                                    className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="••••"
                                    type="password"
                                    inputMode="numeric"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                                <select
                                    className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value as any)}
                                >
                                    <option value="staff">Staff</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            {newRole === 'manager' && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Linked Wallet Address <span className="font-normal text-muted-foreground/60">(Optional)</span></label>
                                    <input
                                        className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
                                        value={newLinkedWallet}
                                        onChange={e => setNewLinkedWallet(e.target.value)}
                                        placeholder="0x..."
                                    />
                                    <p className="text-[11px] text-muted-foreground/70 mt-1.5">Allows this manager to access the Multi-Org Reports Panel.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="flex-1 h-10 rounded-lg border border-foreground/10 text-sm font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={addLoading || !newName || !newPin}
                                className="flex-1 h-10 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-40 transition-colors"
                            >
                                {addLoading ? "Adding..." : "Add Member"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Grid */}
            {loading ? (
                <div className="glass-pane rounded-xl border p-16 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin mb-3" />
                    <div className="text-sm text-muted-foreground">Loading team...</div>
                </div>
            ) : members.length === 0 ? (
                <div className="glass-pane rounded-xl border flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
                        <User className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <div className="text-base font-semibold">No team members</div>
                    <div className="text-sm text-muted-foreground mt-1 max-w-xs">Add employees to enable PIN login on terminals and track their performance.</div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
                    >
                        <Plus size={16} /> Add First Member
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {members.map(m => (
                        <button
                            key={m.id}
                            onClick={() => openMemberDetail(m)}
                            className="glass-pane text-left p-4 sm:p-5 rounded-xl border border-foreground/[0.08] hover:border-foreground/20 transition-all group"
                        >
                            {/* Avatar + Name */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-foreground text-xs sm:text-sm font-semibold shrink-0 group-hover:from-foreground/15 group-hover:to-foreground/8 transition-colors">
                                    {m.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[15px] sm:text-base truncate">{m.name}</div>
                                    <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium mt-1 ${m.role === 'manager'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-foreground/5 text-muted-foreground border border-foreground/10'
                                        }`}>
                                        {m.role === 'manager' ? <Shield size={9} /> : <User size={9} />}
                                        {m.role}
                                    </span>
                                </div>
                            </div>
                            {/* Stats — 2x2 grid on small, 4-column on md+ */}
                            <div className="mt-4 pt-3 border-t border-foreground/5 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2">
                                <div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sales</div>
                                    <div className="font-semibold text-[13px] sm:text-sm tabular-nums mt-0.5">{formatMoney(stats.sales[m.id] || 0)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tips</div>
                                    <div className={`font-semibold text-[13px] sm:text-sm tabular-nums mt-0.5 ${(stats.tips[m.id] || 0) > 0 ? "text-emerald-400" : ""}`}>
                                        {formatMoney(stats.tips[m.id] || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Unpaid</div>
                                    <div className={`font-semibold text-[13px] sm:text-sm tabular-nums mt-0.5 ${(stats.unpaidTips[m.id] || 0) > 0 ? "text-amber-400" : ""}`}>
                                        {formatMoney(stats.unpaidTips[m.id] || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tip %</div>
                                    <div className="font-semibold text-[13px] sm:text-sm tabular-nums mt-0.5">
                                        {(stats.sales[m.id] || 0) > 0 ? `${(((stats.tips[m.id] || 0) / (stats.sales[m.id] || 1)) * 100).toFixed(1)}%` : "—"}
                                    </div>
                                </div>
                            </div>
                            {/* Last active */}
                            <div className="mt-3 text-[11px] text-muted-foreground/70">
                                Last active: {formatTimeAgo(stats.sessions[m.id] || 0)}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {renderModals()}
        </>
    );
}
