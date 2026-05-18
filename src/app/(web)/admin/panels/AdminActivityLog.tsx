"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { History, ChevronDown, ChevronRight, Clock, User } from "lucide-react";
import { AuditLogEntry } from "@/lib/audit";

export default function AdminActivityLog() {
    const account = useActiveAccount();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hiddenActions, setHiddenActions] = useState<string[]>([]);
    const [showFilter, setShowFilter] = useState(false);

    // Load preferences on mount
    useEffect(() => {
        const saved = localStorage.getItem("admin_log_filters");
        if (saved) {
            try {
                setHiddenActions(JSON.parse(saved));
            } catch { } // ignore
        } else {
            // Default filters
            setHiddenActions(["update_receipt_status", "update_order_status"]);
        }
    }, [account?.address]); // Reload if account changes

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const res = await fetch("/api/admin/logs", {
                    headers: { "x-wallet": account?.address || "" }
                });
                if (!res.ok) throw new Error("Failed to fetch logs");
                const data = await res.json();
                if (mounted) setLogs(data.logs || []);
            } catch (e: any) {
                if (mounted) setError(e.message);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [account?.address]);

    const fetchLogs = () => {
        // Exposed for Refresh button
        setLoading(true);
        fetch("/api/admin/logs", {
            headers: { "x-wallet": account?.address || "" }
        })
            .then(res => res.json())
            .then(data => setLogs(data.logs || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    };

    const [expanded, setExpanded] = useState<string | null>(null);

    const toggleActionFilter = (action: string) => {
        setHiddenActions(prev => {
            const next = prev.includes(action)
                ? prev.filter(a => a !== action)
                : [...prev, action];
            localStorage.setItem("admin_log_filters", JSON.stringify(next));
            return next;
        });
    };

    const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
    const filteredLogs = logs.filter(l => !hiddenActions.includes(l.action));

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading activity...</div>;
    if (error) return <div className="p-4 text-red-500 bg-red-500/10 rounded-md">{error}</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-500" />
                    Activity Log
                </h3>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`px-3 py-1 text-xs border rounded-md flex items-center gap-2 transition-colors ${showFilter || hiddenActions.length > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-background hover:bg-muted"}`}
                        >
                            <FilterIcon className="w-3 h-3" />
                            Filter
                            {hiddenActions.length > 0 && <span className="bg-indigo-200 text-indigo-800 text-[10px] px-1 rounded-full">{hiddenActions.length}</span>}
                        </button>

                        {showFilter && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-950 border rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Event Types</div>
                                <div className="max-h-60 overflow-y-auto space-y-0.5">
                                    {uniqueActions.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1 italic">No events found yet</div>}
                                    {uniqueActions.map(action => (
                                        <label key={action} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                                checked={!hiddenActions.includes(action)}
                                                onChange={() => toggleActionFilter(action)}
                                            />
                                            <span className="text-xs truncate">{formatAction(action)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={fetchLogs} className="text-xs text-indigo-400 hover:text-indigo-300">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="border rounded-xl bg-muted/20 min-h-[200px]">
                {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        {logs.length > 0 ? "All activities hidden by filters." : "No recent activity found."}
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="p-3 hover:bg-muted/40 transition-colors">
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                                >
                                    <div className="p-1.5 rounded-full bg-indigo-500/10 text-indigo-500">
                                        {expanded === log.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{formatAction(log.action)}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]" title={log.actor}>
                                                {log.details?.updatedBy || log.actor}
                                            </span>
                                        </div>
                                        {log.details?.changes && Array.isArray(log.details.changes) && (
                                            <div className="mt-2 text-xs text-muted-foreground bg-black/20 p-2 rounded border border-white/5 space-y-1">
                                                {log.details.changes.map((change: string, i: number) => (
                                                    <div key={i} className="flex gap-1.5 items-start">
                                                        <span className="text-indigo-400 mt-0.5">•</span>
                                                        <span>{change}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {expanded === log.id && (
                                    <div className="mt-3 ml-9 p-3 rounded-md bg-zinc-950 border text-xs font-mono overflow-auto">
                                        <div className="text-muted-foreground mb-1">Raw Details:</div>
                                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}

function formatAction(action: string) {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
