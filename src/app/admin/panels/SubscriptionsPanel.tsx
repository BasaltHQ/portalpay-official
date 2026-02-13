"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
    Plus,
    Users,
    DollarSign,
    TrendingUp,
    Calendar,
    Repeat,
    XCircle,
    CheckCircle,
    AlertCircle,
    Loader2,
    Pencil,
    Trash2,
} from "lucide-react";

type Plan = {
    planId: string;
    name: string;
    description?: string;
    priceUsd: number;
    period: string;
    active: boolean;
    createdAt: number;
};

type Subscription = {
    subscriptionId: string;
    planId: string;
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
    WEEKLY: "Weekly",
    BIWEEKLY: "Bi-Weekly",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    YEARLY: "Yearly",
};

function formatDate(ts: number): string {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function fmtCurrency(usd: number): string {
    return `$${usd.toFixed(2)}`;
}

export default function SubscriptionsPanel() {
    const account = useActiveAccount();
    const merchantWallet = (account?.address || "").toLowerCase();

    // State
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form state
    const [newPlanName, setNewPlanName] = useState("");
    const [newPlanDesc, setNewPlanDesc] = useState("");
    const [newPlanPrice, setNewPlanPrice] = useState("");
    const [newPlanPeriod, setNewPlanPeriod] = useState("MONTHLY");

    // Fetch plans and subscriptions
    const fetchData = useCallback(async () => {
        if (!merchantWallet) return;
        setLoading(true);
        try {
            const [plansRes, subsRes] = await Promise.all([
                fetch(`/api/subscriptions/plans?wallet=${merchantWallet}`).then((r) => r.json()),
                fetch(`/api/subscriptions/status?merchant=${merchantWallet}`).then((r) => r.json()),
            ]);
            setPlans(plansRes?.plans || []);
            setSubscriptions(subsRes?.subscriptions || []);
        } catch (err) {
            console.error("Failed to fetch subscription data:", err);
        } finally {
            setLoading(false);
        }
    }, [merchantWallet]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Create or Update plan
    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!merchantWallet) return;
        setCreating(true);
        try {
            const method = editingPlan ? "PUT" : "POST";
            const body: any = {
                wallet: merchantWallet,
                name: newPlanName,
                description: newPlanDesc || undefined,
                priceUsd: parseFloat(newPlanPrice),
                period: newPlanPeriod,
            };

            if (editingPlan) {
                body.planId = editingPlan.planId;
                body.active = true;
            }

            const res = await fetch("/api/subscriptions/plans", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setShowCreateForm(false);
                setEditingPlan(null);
                setNewPlanName("");
                setNewPlanDesc("");
                setNewPlanPrice("");
                setNewPlanPeriod("MONTHLY");
                fetchData();
            }
        } catch (err) {
            console.error("Failed to save plan:", err);
        } finally {
            setCreating(false);
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm("Are you sure you want to delete this plan? This connects be undone.")) return;
        if (!merchantWallet) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/subscriptions/plans?planId=${planId}&wallet=${merchantWallet}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Failed to delete plan:", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingPlan(null);
        setNewPlanName("");
        setNewPlanDesc("");
        setNewPlanPrice("");
        setNewPlanPeriod("MONTHLY");
        setShowCreateForm(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setNewPlanName(plan.name);
        setNewPlanDesc(plan.description || "");
        setNewPlanPrice(String(plan.priceUsd));
        setNewPlanPeriod(plan.period);
        setShowCreateForm(true);
    };

    // Compute metrics
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
    const mrr = activeSubscriptions.reduce((sum, s) => {
        const multiplier =
            s.period === "WEEKLY" ? 4.33 :
                s.period === "BIWEEKLY" ? 2.17 :
                    s.period === "QUARTERLY" ? 0.33 :
                        s.period === "YEARLY" ? 0.083 : 1;
        return sum + s.priceUsd * multiplier;
    }, 0);
    const totalRevenue = subscriptions.reduce((sum, s) => sum + s.totalChargedUsd, 0);
    const pastDue = subscriptions.filter((s) => s.status === "past_due").length;

    const statusIcon = (status: string) => {
        switch (status) {
            case "active": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case "cancelled": return <XCircle className="w-4 h-4 text-red-400" />;
            case "past_due": return <AlertCircle className="w-4 h-4 text-amber-500" />;
            default: return <AlertCircle className="w-4 h-4 text-zinc-400" />;
        }
    };

    if (loading) {
        return (
            <div className="glass-pane rounded-xl border p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-pane rounded-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Subscription Plans</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create and manage recurring payment plans for your customers
                        </p>
                    </div>
                    <button
                        onClick={showCreateForm ? () => setShowCreateForm(false) : openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--pp-secondary)] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        {showCreateForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showCreateForm ? "Cancel" : "New Plan"}
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Monthly Recurring Revenue", value: fmtCurrency(mrr), icon: TrendingUp, color: "text-emerald-500" },
                        { label: "Active Subscribers", value: String(activeSubscriptions.length), icon: Users, color: "text-blue-500" },
                        { label: "Total Revenue", value: fmtCurrency(totalRevenue), icon: DollarSign, color: "text-violet-500" },
                        { label: "Past Due", value: String(pastDue), icon: AlertCircle, color: pastDue > 0 ? "text-amber-500" : "text-zinc-400" },
                    ].map((m) => (
                        <div key={m.label} className="rounded-lg border p-4 bg-background/50">
                            <div className="flex items-center gap-2 mb-1">
                                <m.icon className={`w-4 h-4 ${m.color}`} />
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{m.label}</span>
                            </div>
                            <div className="text-xl font-bold text-foreground">{m.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {showCreateForm && (
                <div className="glass-pane rounded-xl border p-6 animate-in slide-in-from-top-2 duration-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{editingPlan ? "Edit Plan" : "Create New Plan"}</h3>
                    <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Plan Name *</label>
                            <input
                                type="text"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                placeholder="e.g., Gold Membership"
                                required
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Price (USD) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={newPlanPrice}
                                onChange={(e) => setNewPlanPrice(e.target.value)}
                                placeholder="29.99"
                                required
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Billing Period</label>
                            <select
                                value={newPlanPeriod}
                                onChange={(e) => setNewPlanPeriod(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            >
                                {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                            <input
                                type="text"
                                value={newPlanDesc}
                                onChange={(e) => setNewPlanDesc(e.target.value)}
                                placeholder="Optional plan description"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--pp-secondary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPlan ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                {creating ? "Saving..." : (editingPlan ? "Save Changes" : "Create Plan")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-5 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Plans List */}
            <div className="glass-pane rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-[var(--pp-secondary)]" />
                    Your Plans ({plans.length})
                </h3>
                {plans.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                        <Repeat className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No subscription plans yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Create your first plan to start earning recurring revenue.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => {
                            const planSubs = subscriptions.filter((s) => s.planId === plan.planId && s.status === "active");
                            return (
                                <div key={plan.planId} className="rounded-lg border p-5 bg-background/50 hover:border-[var(--pp-secondary)]/30 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-semibold text-foreground">{plan.name}</h4>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                                            Active
                                        </span>
                                        <div className="flex items-center gap-1 ml-auto pl-2">
                                            <button
                                                onClick={() => openEdit(plan)}
                                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.planId)}
                                                className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {plan.description && (
                                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                                    )}
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-2xl font-bold text-foreground">{fmtCurrency(plan.priceUsd)}</span>
                                        <span className="text-sm text-muted-foreground">/ {PERIOD_LABELS[plan.period]?.toLowerCase() || plan.period}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {planSubs.length} subscriber{planSubs.length !== 1 ? "s" : ""}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Created {formatDate(plan.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Subscribers Table */}
            {subscriptions.length > 0 && (
                <div className="glass-pane rounded-xl border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[var(--pp-secondary)]" />
                        Subscribers ({subscriptions.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Charge</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Charged</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {subscriptions.map((sub) => {
                                    const plan = plans.find((p) => p.planId === sub.planId);
                                    return (
                                        <tr key={sub.subscriptionId} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-foreground">
                                                {sub.customerWallet.slice(0, 6)}...{sub.customerWallet.slice(-4)}
                                            </td>
                                            <td className="px-4 py-3 text-foreground">
                                                {plan?.name || sub.planId.slice(0, 8)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1.5">
                                                    {statusIcon(sub.status)}
                                                    <span className="capitalize text-foreground">{sub.status.replace("_", " ")}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-foreground">
                                                {fmtCurrency(sub.priceUsd)}/{PERIOD_LABELS[sub.period]?.slice(0, 3).toLowerCase() || "mo"}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {sub.status === "active" ? formatDate(sub.nextChargeAt) : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-foreground font-medium">
                                                {fmtCurrency(sub.totalChargedUsd)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
