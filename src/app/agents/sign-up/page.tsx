"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client, chain } from "@/lib/thirdweb/client";
import { useBrand } from "@/contexts/BrandContext";
import {
    Wallet,
    UserPlus,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    ArrowRight,
    Mail,
    Phone,
    User,
    FileText,
} from "lucide-react";

export default function AgentSignUp() {
    const account = useActiveAccount();
    const brand = useBrand();
    const wallet = (account?.address || "").toLowerCase();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check existing application
    useEffect(() => {
        if (!wallet) { setLoading(false); return; }
        (async () => {
            try {
                const res = await fetch("/api/agents/signup", { headers: { "x-wallet": wallet } });
                const data = await res.json();
                if (data.exists) {
                    setExistingStatus(data.status);
                    setName(data.name || "");
                    setEmail(data.email || "");
                    setPhone(data.phone || "");
                }
            } catch { }
            setLoading(false);
        })();
    }, [wallet]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!wallet) return;
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/agents/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": wallet },
                body: JSON.stringify({ name, email, phone, notes }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            setSubmitted(true);
            setExistingStatus("pending");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    /* ─── Not connected ─── */
    if (!account) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
                <div className="relative max-w-md w-full text-center space-y-6">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 grid place-items-center shadow-lg shadow-primary/10">
                        <UserPlus className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Become an Agent</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Connect your wallet to apply as a referral agent{brand?.name ? ` for ${brand.name}` : ""}. Earn commissions on merchants you bring to the platform.
                    </p>
                    <div className="flex justify-center">
                        <ConnectButton client={client} chain={chain} />
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Loading existing status ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    /* ─── Already submitted / has status ─── */
    if (existingStatus) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
                <div className="relative max-w-lg w-full text-center space-y-6">
                    {existingStatus === "pending" && (
                        <>
                            <div className="h-20 w-20 mx-auto rounded-2xl bg-amber-500/10 grid place-items-center">
                                <Clock className="h-10 w-10 text-amber-500" />
                            </div>
                            <h1 className="text-3xl font-bold">Application Pending</h1>
                            <p className="text-muted-foreground">
                                Your application is under review. The partner admin will approve or reject your application. Check back soon.
                            </p>
                        </>
                    )}
                    {existingStatus === "approved" && (
                        <>
                            <div className="h-20 w-20 mx-auto rounded-2xl bg-green-500/10 grid place-items-center">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <h1 className="text-3xl font-bold">You're Approved!</h1>
                            <p className="text-muted-foreground">
                                Your agent application has been approved. Visit your dashboard to track earnings and withdraw commissions.
                            </p>
                            <a
                                href="/agents"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                            >
                                Go to Dashboard <ArrowRight className="h-4 w-4" />
                            </a>
                        </>
                    )}
                    {existingStatus === "rejected" && (
                        <>
                            <div className="h-20 w-20 mx-auto rounded-2xl bg-red-500/10 grid place-items-center">
                                <XCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <h1 className="text-3xl font-bold">Application Declined</h1>
                            <p className="text-muted-foreground">
                                Your application was not approved. You may re-apply with updated information below.
                            </p>
                            <button
                                onClick={() => setExistingStatus(null)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110 transition"
                            >
                                Re-Apply <ArrowRight className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Application form ─── */
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="relative max-w-lg w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 grid place-items-center shadow-lg shadow-primary/10">
                        <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Agent Application</h1>
                    <p className="text-sm text-muted-foreground">
                        Apply to become a referral agent{brand?.name ? ` for ${brand.name}` : ""}. Earn commissions for every merchant you onboard.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Wallet (read-only) */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <Wallet className="h-3 w-3" /> Wallet Address
                        </label>
                        <div className="px-3 py-2.5 rounded-lg bg-muted/20 border text-sm font-mono text-muted-foreground truncate">
                            {wallet}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <User className="h-3 w-3" /> Full Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-3 py-2.5 rounded-lg bg-card border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> Email Address *
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="agent@example.com"
                            className="w-full px-3 py-2.5 rounded-lg bg-card border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-3 py-2.5 rounded-lg bg-card border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> Why you'd be a great agent
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tell us about your experience, network, and how you plan to bring merchants to the platform..."
                            rows={4}
                            className="w-full px-3 py-2.5 rounded-lg bg-card border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !name || !email}
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                        ) : (
                            <><UserPlus className="h-4 w-4" /> Submit Application</>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-muted-foreground">
                        By applying, you agree to represent {brand?.name || "the platform"} professionally and adhere to the agent code of conduct.
                    </p>
                </form>
            </div>
        </div>
    );
}
