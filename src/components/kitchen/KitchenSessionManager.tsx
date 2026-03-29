"use client";

import React, { useState, useEffect, useCallback } from "react";
import { KitchenInterface } from "@/components/kitchen/KitchenInterface";

export default function KitchenSessionManager({ merchantWallet, brandLogo, brandName, primaryColor, secondaryColor }: { 
    merchantWallet: string;
    brandLogo?: string;
    brandName?: string;
    primaryColor?: string;
    secondaryColor?: string;
}) {
    const [view, setView] = useState<"pin" | "kds">("pin");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [activeSession, setActiveSession] = useState<{
        sessionId: string;
        staffId: string;
        name: string;
        role: string;
    } | null>(null);

    const appendPin = (d: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + d);
            setError("");
        }
    };

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
                setView("kds");
                setPin("");
            } else {
                setError(data.detail || data.error || "Invalid PIN");
                setPin("");
            }
        } catch (e) {
            setError("Connection failed");
        } finally {
            setLoading(false);
        }
    };

    if (view === "kds" && activeSession) {
        return (
            <KitchenInterface 
                wallet={merchantWallet} 
                onLogout={() => {
                    setView("pin");
                    setActiveSession(null);
                }} 
            />
        );
    }

    const pColor = primaryColor || "#10b981"; // default emerald for Kitchen
    const sColor = secondaryColor || pColor;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${pColor}40 0%, transparent 70%)`
                }}
            />

            <div className="max-w-md w-full bg-[#0f0f12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
                <div className="p-8 text-center space-y-4">
                    {brandLogo && (
                        <div className="mx-auto w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center p-4 shadow-inner border border-white/10">
                            <img src={brandLogo} className="h-full w-full object-contain" alt="Logo" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                        {brandName ? `${brandName} KDS` : "Kitchen Display"}
                    </h1>
                    <p className="text-gray-400 text-sm">Enter Staff PIN to unlock terminal</p>

                    <div className="flex justify-center gap-2 my-6">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="w-4 h-4 rounded-full border transition-all duration-300"
                                style={{
                                    borderColor: i < pin.length ? pColor : "rgba(255,255,255,0.2)",
                                    backgroundColor: i < pin.length ? pColor : "transparent",
                                    transform: i < pin.length ? "scale(1.1)" : "scale(1)"
                                }}
                            />
                        ))}
                    </div>

                    {error && <div className="text-red-500 text-sm font-bold animate-pulse">{error}</div>}

                    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button
                                key={n}
                                onClick={() => appendPin(String(n))}
                                className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-xl font-bold transition-all active:scale-95 text-white border border-white/5"
                            >
                                {n}
                            </button>
                        ))}
                        <div />
                        <button
                            onClick={() => appendPin("0")}
                            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-xl font-bold transition-all active:scale-95 text-white border border-white/5"
                        >
                            0
                        </button>
                        <button
                            onClick={() => setPin(prev => prev.slice(0, -1))}
                            className="h-16 rounded-2xl bg-white/5 hover:bg-red-900/20 text-red-500 font-bold transition-all active:scale-95 flex items-center justify-center border border-white/5 group"
                        >
                            <span className="group-hover:scale-110 transition-transform">⌫</span>
                        </button>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading || pin.length < 4}
                        className="w-full h-14 text-white rounded-xl font-bold mt-6 disabled:opacity-50 shadow-lg transition-all text-lg"
                        style={{ backgroundColor: sColor }}
                    >
                        {loading ? "Authorizing..." : "Unlock KDS"}
                    </button>
                </div>
            </div>
        </div>
    );
}
