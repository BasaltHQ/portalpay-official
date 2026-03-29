"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useBrand } from "@/contexts/BrandContext";
import TruncatedAddress from "@/components/truncated-address";
import {
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Loader2,
    Mail,
    Phone,
    User,
    RefreshCcw,
} from "lucide-react";

type AgentRequest = {
    id: string;
    wallet: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
    reviewedBy?: string;
    reviewedAt?: number;
};

export default function AgentRequestsPanel() {
    const account = useActiveAccount();
    const brand = useBrand();
    const adminWallet = (account?.address || "").toLowerCase();

    const [requests, setRequests] = useState<AgentRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | AgentRequest["status"]>("all");
    const [updating, setUpdating] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!adminWallet) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/agent-requests", {
                headers: { "x-wallet": adminWallet },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            setRequests(data.requests || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [adminWallet]);

    useEffect(() => { load(); }, [load]);

    async function updateStatus(id: string, status: "approved" | "rejected") {
        setUpdating(id);
        setError("");
        setInfo("");
        try {
            const res = await fetch("/api/admin/agent-requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-wallet": adminWallet },
                body: JSON.stringify({ id, status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            setInfo(`Agent ${status === "approved" ? "approved" : "rejected"} successfully.`);
            load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUpdating(null);
        }
    }

    // Filter + search
    const filtered = React.useMemo(() => {
        let arr = requests;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.email.toLowerCase().includes(q) ||
                    r.wallet.toLowerCase().includes(q) ||
                    (r.phone || "").includes(q)
            );
        }
        if (statusFilter !== "all") {
            arr = arr.filter((r) => r.status === statusFilter);
        }
        return arr;
    }, [requests, searchQuery, statusFilter]);

    const counts = React.useMemo(() => {
        const c = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
        requests.forEach((r) => { if (c[r.status] !== undefined) c[r.status]++; });
        return c;
    }, [requests]);

    const badgeClass = (status: string) =>
        status === "approved"
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : status === "rejected"
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";

    const StatusIcon = ({ status }: { status: string }) =>
        status === "approved" ? <CheckCircle className="h-3.5 w-3.5" /> :
            status === "rejected" ? <XCircle className="h-3.5 w-3.5" /> :
                <Clock className="h-3.5 w-3.5" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Agent Requests</h2>
                    <p className="microtext text-muted-foreground mt-1">
                        Manage agent applications for <span className="font-mono text-emerald-400">{brand?.key || "this brand"}</span>.
                    </p>
                </div>
                <button
                    className="px-3 py-1.5 rounded-md border text-sm inline-flex items-center gap-1.5"
                    onClick={load}
                    disabled={loading}
                >
                    <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Loading…" : "Refresh"}
                </button>
            </div>

            {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
            {info && <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">{info}</div>}

            {/* Filters */}
            <div className="flex flex-col space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, email, wallet…"
                            className="pl-9 pr-4 py-2 w-full text-sm bg-black/40 border border-white/10 rounded-lg focus:ring-1 focus:ring-emerald-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 border-b border-white/5">
                    {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-2 text-xs uppercase tracking-wide font-medium border-b-2 transition-all flex items-center gap-2 ${statusFilter === tab
                                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                                : "border-transparent text-muted-foreground hover:text-zinc-300 hover:border-white/10"
                                }`}
                        >
                            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${statusFilter === tab ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-zinc-500"}`}>
                                {counts[tab] || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto rounded-md border bg-black/20">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-foreground/5 text-xs uppercase tracking-wider text-muted-foreground border-b border-foreground/10">
                            <th className="text-left px-4 py-3 font-medium">Agent</th>
                            <th className="text-left px-4 py-3 font-medium">Contact</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-left px-4 py-3 font-medium">Date</th>
                            <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">No agent requests found</p>
                                    <p className="text-xs mt-1">Share your application link: <code className="bg-muted/50 px-1 rounded">/agents/apply</code></p>
                                </td>
                            </tr>
                        ) : filtered.map((req) => {
                            const date = req.createdAt > 0 ? new Date(req.createdAt).toLocaleDateString() : "—";

                            return (
                                <React.Fragment key={req.id}>
                                    <tr
                                        className={`hover:bg-foreground/5 transition-colors cursor-pointer ${expandedId === req.id ? "bg-foreground/5" : ""}`}
                                        onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {req.name || "—"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                <TruncatedAddress address={req.wallet} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                {req.email || "—"}
                                            </div>
                                            {req.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                    <Phone className="h-3 w-3" />
                                                    {req.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${badgeClass(req.status)}`}>
                                                <StatusIcon status={req.status} />
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {date}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateStatus(req.id, "approved"); }}
                                                            disabled={updating === req.id}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                                                        >
                                                            {updating === req.id ? "…" : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateStatus(req.id, "rejected"); }}
                                                            disabled={updating === req.id}
                                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === "approved" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateStatus(req.id, "rejected"); }}
                                                        disabled={updating === req.id}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                                {req.status === "rejected" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateStatus(req.id, "approved"); }}
                                                        disabled={updating === req.id}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedId === req.id && (
                                        <tr className="bg-foreground/[0.02]">
                                            <td colSpan={5} className="px-4 py-4 border-t border-foreground/5">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Full Name</div>
                                                        <div>{req.name || "—"}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Email</div>
                                                        <div>{req.email || "—"}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Phone</div>
                                                        <div>{req.phone || "—"}</div>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Notes / Pitch</div>
                                                        <div className="text-xs bg-black/20 p-2 rounded border border-white/5 max-h-[80px] overflow-y-auto italic">
                                                            {req.notes || "No notes provided."}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Wallet</div>
                                                        <div className="font-mono text-xs break-all select-all opacity-80">{req.wallet}</div>
                                                    </div>
                                                    {req.reviewedBy && (
                                                        <div className="md:col-span-3">
                                                            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Reviewed By</div>
                                                            <div className="text-xs">
                                                                <TruncatedAddress address={req.reviewedBy} />
                                                                {req.reviewedAt ? ` — ${new Date(req.reviewedAt).toLocaleString()}` : ""}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
