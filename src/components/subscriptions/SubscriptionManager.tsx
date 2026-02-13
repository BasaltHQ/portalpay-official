"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
    Repeat,
    XCircle,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    DollarSign,
} from "lucide-react";

type Subscription = {
    subscriptionId: string;
    planId: string;
    merchantWallet: string;
    customerWallet: string;
    priceUsd: number;
    period: string;
    status: "active" | "cancelled" | "expired" | "past_due";
    lastChargedAt?: number;
    nextChargeAt: number;
    chargeCount: number;
    totalChargedUsd: number;
    createdAt: number;
};

const PERIOD_LABELS: Record<string, string> = {
    WEEKLY: "week",
    BIWEEKLY: "2 weeks",
    MONTHLY: "month",
    QUARTERLY: "quarter",
    YEARLY: "year",
};

function formatDate(ts: number): string {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

type SubscriptionManagerProps = {
    /** Optional: override the wallet to query (defaults to connected wallet) */
    customerWallet?: string;
    className?: string;
};

/**
 * Customer-facing Subscription Manager.
 * Lists active subscriptions, shows next charge date, and allows cancellation.
 */
export default function SubscriptionManager({
    customerWallet: overrideWallet,
    className,
}: SubscriptionManagerProps) {
    const account = useActiveAccount();
    const wallet = overrideWallet?.toLowerCase() || account?.address?.toLowerCase() || "";

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<string | null>(null);

    const fetchSubscriptions = useCallback(async () => {
        if (!wallet) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/subscriptions/status?customer=${wallet}`);
            const data = await res.json();
            setSubscriptions(data?.subscriptions || []);
        } catch (err) {
            console.error("Failed to fetch subscriptions:", err);
        } finally {
            setLoading(false);
        }
    }, [wallet]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const handleCancel = async (subscriptionId: string) => {
        if (!wallet) return;
        setCancelling(subscriptionId);
        try {
            const res = await fetch("/api/subscriptions/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId, wallet }),
            });
            const data = await res.json();
            if (data.success) {
                // Refresh list
                await fetchSubscriptions();
            }
        } catch (err) {
            console.error("Failed to cancel subscription:", err);
        } finally {
            setCancelling(null);
        }
    };

    const statusBadge = (status: string) => {
        const config: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
            active: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            cancelled: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-400", bg: "bg-red-400/10" },
            expired: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-zinc-400", bg: "bg-zinc-400/10" },
            past_due: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-amber-500", bg: "bg-amber-500/10" },
        };
        const c = config[status] || config.expired;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color} ${c.bg}`}>
                {c.icon}
                {status.replace("_", " ")}
            </span>
        );
    };

    if (!wallet) {
        return null; // Don't render if no wallet
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-8 ${className || ""}`}>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <div className={`text-center py-8 ${className || ""}`}>
                <Repeat className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No active subscriptions</p>
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className || ""}`}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Your Subscriptions
            </h3>

            {subscriptions.map((sub) => (
                <div
                    key={sub.subscriptionId}
                    className="rounded-xl border border-border bg-card/50 p-4 hover:border-primary/20 transition-colors"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {statusBadge(sub.status)}
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="text-lg font-bold text-foreground">
                                    ${sub.priceUsd.toFixed(2)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {PERIOD_LABELS[sub.period] || sub.period.toLowerCase()}
                                </span>
                            </div>
                        </div>

                        {sub.status === "active" && (
                            <button
                                onClick={() => handleCancel(sub.subscriptionId)}
                                disabled={cancelling === sub.subscriptionId}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            >
                                {cancelling === sub.subscriptionId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <XCircle className="w-3 h-3" />
                                )}
                                Cancel
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {sub.status === "active" && sub.nextChargeAt && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Next charge: {formatDate(sub.nextChargeAt)}
                            </span>
                        )}
                        {sub.chargeCount > 0 && (
                            <span>
                                {sub.chargeCount} charge{sub.chargeCount !== 1 ? "s" : ""} • ${sub.totalChargedUsd.toFixed(2)} total
                            </span>
                        )}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground font-mono">
                        Merchant: {sub.merchantWallet.slice(0, 6)}...{sub.merchantWallet.slice(-4)}
                    </div>
                </div>
            ))}
        </div>
    );
}
