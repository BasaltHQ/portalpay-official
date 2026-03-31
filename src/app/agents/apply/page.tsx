"use client";

import React, { useEffect, useState, useRef } from "react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client, chain } from "@/lib/thirdweb/client";
import { usePortalThirdwebTheme } from "@/lib/thirdweb/theme";
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
    ShieldCheck,
    Building2,
    Infinity,
    Zap,
    LineChart,
    Link as LinkIcon
} from "lucide-react";

export default function AgentSignUp() {
    const account = useActiveAccount();
    const brand = useBrand();
    const twTheme = usePortalThirdwebTheme();
    const wallet = (account?.address || "").toLowerCase();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [existingCreatedAt, setExistingCreatedAt] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Track previous wallet to detect connection changes
    const prevWalletRef = useRef("");

    // Check existing application whenever wallet connects/changes
    useEffect(() => {
        if (!wallet) {
            // Wallet disconnected – reset
            setExistingStatus(null);
            setExistingCreatedAt(null);
            setSubmitted(false);
            setLoading(false);
            return;
        }

        // If wallet same as before and we already checked, skip
        if (wallet === prevWalletRef.current && existingStatus !== null) return;
        prevWalletRef.current = wallet;

        setLoading(true);
        setError("");

        (async () => {
            try {
                const res = await fetch("/api/agents/signup", {
                    headers: { "x-wallet": wallet },
                });
                const data = await res.json();
                if (data.exists) {
                    setExistingStatus(data.status);
                    setExistingCreatedAt(data.createdAt || null);
                    setName(data.name || "");
                    setEmail(data.email || "");
                    setPhone(data.phone || "");
                } else {
                    setExistingStatus(null);
                }
            } catch {
                // Network error — allow form to show
                setExistingStatus(null);
            }
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
            setExistingCreatedAt(Date.now());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }
    let brandName = brand?.name || "The Platform";
    if (brandName.toLowerCase() === "basaltsurge") {
        brandName = "BasaltSurge";
    }
    const brandLogo = (brand as any)?.logoUrl || "";
    const renderDynamicState = () => {
        if (!account) {
            return (
                <div className="space-y-6 text-center py-6">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 grid place-items-center shadow-lg shadow-primary/10">
                        <Wallet className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Connect to Apply</h2>
                        <p className="text-muted-foreground mt-2 px-6">
                            Securely link your Web3 wallet to begin the application. Your wallet acts as your identity and payout destination.
                        </p>
                    </div>
                    <div className="flex justify-center pt-2">
                        <ConnectButton 
                            client={client} 
                            chain={chain} 
                            theme={twTheme}
                            connectModal={{
                                size: "compact",
                                title: "Agent Sign In",
                                titleIcon: brandLogo,
                                showThirdwebBranding: false
                            }}
                        />
                    </div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-4 border-t border-border/50">
                        <ShieldCheck className="h-3 w-3" />
                        Powered by secure smart contract infrastructure
                    </p>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium tracking-wide">Retrieving Profile…</p>
                </div>
            );
        }

        if (existingStatus === "pending") {
            const submittedDate = existingCreatedAt
                ? new Date(existingCreatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                : null;
            return (
                <div className="space-y-6 text-center py-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/10 grid place-items-center border border-amber-500/20">
                        <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Application Under Review</h2>
                        <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                            The partners at {brandName} are currently reviewing your profile. You will be able to access the dashboard once approved.
                        </p>
                        {submittedDate && <p className="text-xs text-muted-foreground/60 mt-2">Submitted on {submittedDate}</p>}
                    </div>

                    <div className="text-left bg-muted/30 rounded-xl p-4 border max-w-sm mx-auto mt-6">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                            <User className="h-3 w-3" /> Profile Data
                        </div>
                        <div className="grid grid-cols-[70px_1fr] gap-y-2 text-sm">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium text-foreground">{name || "—"}</span>
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium text-foreground">{email || "—"}</span>
                            <span className="text-muted-foreground">Wallet</span>
                            <span className="font-mono text-xs truncate pt-0.5">{wallet}</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (existingStatus === "approved") {
            return (
                <div className="space-y-6 text-center py-6">
                    <div className="h-20 w-20 mx-auto rounded-full bg-green-500/10 grid place-items-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                            Agent Approved
                        </h2>
                        <p className="text-muted-foreground mt-3 max-w-sm mx-auto text-sm leading-relaxed">
                            Welcome aboard. Your profile is active and you can now start onboarding merchants using your unique referral links.
                        </p>
                    </div>
                    <div className="pt-4">
                        <a
                            href="/agents"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 shadow-lg shadow-primary/25 transition overflow-hidden group relative"
                        >
                            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
                            Launch Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            );
        }

        if (existingStatus === "rejected") {
            return (
                <div className="space-y-6 text-center py-6">
                    <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 grid place-items-center border border-red-500/20">
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Application Declined</h2>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                            Unfortunately, your application to become an agent for {brandName} was not approved at this time.
                        </p>
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={() => setExistingStatus(null)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border bg-card hover:bg-muted text-foreground font-semibold transition"
                        >
                            Re-Apply
                        </button>
                    </div>
                </div>
            );
        }

        // Active Application Form
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Complete Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Submit your details to finalize the application.
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Active Wallet */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-background border grid place-items-center">
                                <Wallet className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Connected Wallet</p>
                                <p className="font-mono text-xs font-medium">{wallet.slice(0, 8)}...{wallet.slice(-6)}</p>
                            </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>

                    <div className="space-y-1 mt-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Jane Doe"
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 mt-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jane@example.com"
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 mt-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Phone Number (Optional)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 mt-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Why apply?</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Briefly describe your merchant network or strategy..."
                                rows={3}
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition resize-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 mt-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !name || !email}
                        className="w-full mt-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold hover:brightness-110 transition disabled:opacity-50 overflow-hidden relative group"
                    >
                        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-20 bg-gradient-to-b from-transparent via-transparent to-black" />
                        <span className="relative flex items-center justify-center gap-2">
                            {submitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                            ) : (
                                <>Submit Application <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </span>
                    </button>
                    <p className="text-center text-[10px] text-muted-foreground mt-3 px-4">
                        By applying, you agree to the Agent Terms of Service and commit to representing the platform ethically.
                    </p>
                </form>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-foreground selection:bg-primary/30 relative flex flex-col">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(30px); filter: blur(4px); }
                    to { opacity: 1; transform: translateY(0); filter: blur(0px); }
                }
                .animate-fade-up {
                    opacity: 0;
                    animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                .delay-400 { animation-delay: 400ms; }
            `}</style>
            
            {/* Ambient Backgrounds */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] mix-blend-screen -translate-x-1/3 translate-y-1/3" />
            </div>

            {/* Navigation / Header */}
            <header className="relative z-10 p-6 flex items-center justify-between animate-fade-up">
                <div className="flex items-center gap-3">
                    {brandLogo ? (
                        <img src={brandLogo} alt="" className="h-8 w-8 object-contain rounded-md" />
                    ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="font-bold tracking-tight">{brandName}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-card/50 backdrop-blur text-xs font-medium text-muted-foreground shadow-sm">
                    <UserPlus className="h-3 w-3" /> Agent Portal
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-8 lg:py-16 grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-12 lg:gap-24 items-center">
                
                {/* Left Column: Pitch & Value Props */}
                <div className="space-y-10 lg:pr-8">
                    <div className="space-y-6 animate-fade-up delay-100">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                            <Infinity className="h-4 w-4" /> Lifetime Earning Potential
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                            Build your <br className="hidden lg:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                                payment empire.
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                            Join our elite network of agents. Negotiate your own basis points on top of our strict 1% platform fee, and earn uninterrupted revenue from every single transaction your referred merchants process.
                        </p>
                    </div>

                    {/* HERO IMAGE BANNER w/ Hover effects */}
                    <div className="relative animate-fade-up delay-200 group">
                        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-[30px] opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:bg-primary/40 -z-10" />
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                            <img 
                                src="/hero_agent_dashboard.png" 
                                alt="Agent Analytics Dashboard" 
                                className="w-full h-[260px] object-cover mix-blend-screen scale-100 group-hover:scale-105 transition duration-1000 ease-out opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/50 animate-fade-up delay-300">
                        {/* Benefit 1 */}
                        <div className="space-y-2 group transition-all duration-500 hover:-translate-y-1">
                            <div className="h-10 w-10 rounded-lg bg-card border flex items-center justify-center shadow-sm group-hover:border-amber-500/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
                                <Zap className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="font-bold text-foreground">Set Your Own Margins</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                You have full control. Add your custom BPS margin to the platform baseline and scale your revenue exactly as you see fit.
                            </p>
                        </div>
                        {/* Benefit 2 */}
                        <div className="space-y-2 group transition-all duration-500 hover:-translate-y-1">
                            <div className="h-10 w-10 rounded-lg bg-card border flex items-center justify-center shadow-sm group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                                <LinkIcon className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="font-bold text-foreground">Frictionless Links</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Create instant referral links embedded with your margin. When merchants sign up via your link, attribution is locked forever.
                            </p>
                        </div>
                        {/* Benefit 3 */}
                        <div className="space-y-2 group transition-all duration-500 hover:-translate-y-1">
                            <div className="h-10 w-10 rounded-lg bg-card border flex items-center justify-center shadow-sm group-hover:border-green-500/50 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all">
                                <LineChart className="h-5 w-5 text-green-500" />
                            </div>
                            <h3 className="font-bold text-foreground">Real-time Analytics</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Never guess your earnings. A dedicated dashboard tracks your merchant pipeline, approval status, and aggregate volume live.
                            </p>
                        </div>
                        {/* Benefit 4 */}
                        <div className="space-y-2 group transition-all duration-500 hover:-translate-y-1">
                            <div className="h-10 w-10 rounded-lg bg-card border flex items-center justify-center shadow-sm group-hover:border-indigo-500/50 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all">
                                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-foreground">Trustless Settlement</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                No IOUs or manual accounting. Smart contract splits guarantee you are paid out in the same atomic block as the merchant.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Application Core Module */}
                <div className="relative w-full animate-fade-up delay-400 pb-20 lg:pb-0">
                    {/* Decorative back-layer glow specifically for the card */}
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-90 translate-y-4 -z-10 animate-pulse transition duration-1000" />
                    
                    <div className="w-full bg-card/60 backdrop-blur-2xl border border-border/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_40px_rgba(var(--primary),0.05)] text-left">
                        {/* Subtle inner noise/texture */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        
                        <div className="relative z-10 text-left">
                            {renderDynamicState()}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
