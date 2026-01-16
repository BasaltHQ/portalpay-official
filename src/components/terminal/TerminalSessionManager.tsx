"use client";

import React, { useState, useEffect, useCallback } from "react";
import TerminalInterface from "@/components/terminal/TerminalInterface";
import { ShopConfig } from "@/app/shop/[slug]/ShopClient";

// Handles Authenticating the Employee via PIN before showing the interface
export default function TerminalSessionManager({ config, merchantWallet }: { config: ShopConfig; merchantWallet: string }) {
    const [view, setView] = useState<"pin" | "terminal">("pin");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Session State
    const [activeSession, setActiveSession] = useState<{
        sessionId: string;
        staffId: string;
        name: string;
        role: string;
        totalSales?: number;
    } | null>(null);

    // Apply Theme
    useEffect(() => {
        const root = document.documentElement;
        const theme = config?.theme || {};
        const p = (theme.primaryColor || "#0ea5e9").trim();
        const s = (theme.secondaryColor || "#0ea5e9").trim();

        root.style.setProperty("--pp-primary", p);
        root.style.setProperty("--pp-secondary", s);

        if (theme.fontFamily) {
            root.style.setProperty("--font-sans", theme.fontFamily);
        }
        if (theme.receiptBackgroundUrl) {
            // Optional: apply background to body or specific container? 
            // For now, let's just stick to colors.
        }
    }, [config]);

    // Poll for stats
    useEffect(() => {
        if (!activeSession?.sessionId) return;

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/terminal/session?sessionId=${activeSession.sessionId}&merchantWallet=${merchantWallet}`);
                const data = await res.json();
                if (data.session) {
                    setActiveSession(prev => prev ? { ...prev, totalSales: data.session.totalSales } : null);
                }
            } catch (e) {
                console.error("Stats poll failed", e);
            }
        };

        const interval = setInterval(fetchStats, 30000); // Poll every 30s
        fetchStats(); // Initial fetch

        return () => clearInterval(interval);
    }, [activeSession?.sessionId, merchantWallet]);

    const handleLogin = async () => {
        if (pin.length < 4) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/terminal/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ merchantWallet, pin })
            });
            const data = await res.json();
            if (data.success && data.session) {
                setActiveSession(data.session);
                setView("terminal");
                setPin("");
            } else {
                setError("Invalid PIN");
                setPin("");
            }
        } catch (e) {
            setError("Connection failed");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = useCallback(async () => {
        if (activeSession?.sessionId) {
            // End session on server
            try {
                await fetch("/api/terminal/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId: activeSession.sessionId, merchantWallet })
                });
            } catch (e) {
                console.error("Logout failed", e);
            }
        }
        setActiveSession(null);
        setView("pin");
        setPin("");
    }, [activeSession, merchantWallet]);

    const appendPin = (d: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + d);
            setError("");
        }
    };

    const isBasaltDefault = (url: string) => url.includes("BasaltSurge") || url.includes("ppsymbol") || url.includes("bssymbol");

    const resolvedLogoUrl = (() => {
        // 1. Force explicit theme logo if it exists
        // The user explicitly wants the SHOP LOGO to take precedence over the PFP always.
        const t = config.theme?.brandLogoUrl || (config.theme as any)?.symbolLogoUrl || "";
        if (t) return t;

        // 2. User PFP (Fallback only if NO shop logo exists)
        if (merchantWallet) return `/api/users/pfp?wallet=${merchantWallet}`;

        // 3. Default
        return "/bssymbol.png";
    })();

    const primaryColor = config.theme?.primaryColor || "#0ea5e9";
    const secondaryColor = config.theme?.secondaryColor || config.theme?.primaryColor || "#0ea5e9";

    if (view === "pin" || !activeSession) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: "#000" }}>
                {/* Background Gradient using Theme Primary Color */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                        background: `radial-gradient(circle at 50% 50%, ${primaryColor}40 0%, transparent 70%)`
                    }}
                />

                <div className="max-w-md w-full bg-background/90 backdrop-blur border rounded-2xl shadow-xl overflow-hidden relative z-10">
                    <div className="p-8 text-center space-y-4">
                        {resolvedLogoUrl && (
                            <img src={resolvedLogoUrl} className="h-12 mx-auto object-contain" alt="Logo" />
                        )}
                        <h1 className="text-2xl font-bold">Employee Login</h1>
                        <p className="text-muted-foreground text-sm">Enter your Access PIN to start session</p>

                        <div className="flex justify-center gap-2 my-6">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="w-4 h-4 rounded-full border transition-colors"
                                    style={{
                                        borderColor: i < pin.length ? primaryColor : "rgba(128,128,128,0.3)",
                                        backgroundColor: i < pin.length ? primaryColor : "transparent"
                                    }}
                                />
                            ))}
                        </div>

                        {error && <div className="text-red-500 text-sm animate-pulse">{error}</div>}

                        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <button
                                    key={n}
                                    onClick={() => appendPin(String(n))}
                                    className="h-16 rounded-full bg-muted/30 hover:bg-foreground/5 text-xl font-bold transition-all"
                                >
                                    {n}
                                </button>
                            ))}
                            <div /> {/* Spacer */}
                            <button
                                onClick={() => appendPin("0")}
                                className="h-16 rounded-full bg-muted/30 hover:bg-foreground/5 text-xl font-bold transition-all"
                            >
                                0
                            </button>
                            <button
                                onClick={() => setPin(prev => prev.slice(0, -1))}
                                className="h-16 rounded-full bg-muted/30 hover:bg-red-50 text-red-500 font-bold transition-all flex items-center justify-center"
                            >
                                ⌫
                            </button>
                        </div>

                        <button
                            onClick={handleLogin}
                            disabled={loading || pin.length < 4}
                            className="w-full h-12 text-white rounded-xl font-bold mt-6 disabled:opacity-50 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            {loading ? "Verifying..." : "Start Session"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Format stats for display
    const sessTotal = typeof activeSession.totalSales === 'number' ? activeSession.totalSales : 0;
    const statsStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sessTotal);

    // Helper to identify generic platform assets
    function isGenericAsset(url?: string | null): boolean {
        if (!url) return false;
        const s = url.toLowerCase();
        return (
            s.includes("basaltsurgewided") ||
            s.includes("basaltsurged") ||
            s.includes("ppsymbol") ||
            s.includes("portalpay") ||
            s.includes("bssymbol")
        );
    }

    return (
        <TerminalInterface
            merchantWallet={merchantWallet}
            employeeId={activeSession.staffId}
            employeeName={`${activeSession.name} • ${statsStr}`}
            employeeRole={activeSession.role}
            sessionId={activeSession.sessionId}
            onLogout={handleLogout}
            brandName={config.name}
            logoUrl={resolvedLogoUrl}
            theme={config.theme}
        />
    );
}
