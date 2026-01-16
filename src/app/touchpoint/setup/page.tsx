"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidHexAddress } from "@/lib/utils"; // Assuming utils has this, or I'll implement locally if needed
import { LayoutGrid, Store, Save, Lock, Smartphone } from "lucide-react";

// Local Storage Keys
const CONFIG_KEY = "touchpoint_config";

interface TouchpointConfig {
    mode: "terminal" | "kiosk";
    merchantWallet: string;
}

export default function TouchpointSetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<TouchpointConfig | null>(null);

    // Form State
    const [mode, setMode] = useState<"terminal" | "kiosk">("terminal");
    const [wallet, setWallet] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // Check for existing config
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            if (raw) {
                const saved = JSON.parse(raw) as TouchpointConfig;
                if (saved.mode && isValidHexAddress(saved.merchantWallet)) {
                    console.log("[Touchpoint] Config found, redirecting...", saved);
                    performRedirect(saved);
                    return;
                }
            }
        } catch (e) {
            console.error("[Touchpoint] Error reading config", e);
        }
        setLoading(false);
    }, []);

    function performRedirect(cfg: TouchpointConfig) {
        if (cfg.mode === "terminal") {
            router.replace(`/terminal?wallet=${cfg.merchantWallet}`);
        } else {
            // Kiosk mode implies Shop page in a constrained view
            router.replace(`/shop?wallet=${cfg.merchantWallet}&kiosk=1`);
        }
    }

    function handleSave() {
        setError("");
        const w = wallet.trim();
        if (!isValidHexAddress(w)) {
            setError("Invalid wallet address. Must be a valid 0x hex address.");
            return;
        }

        const newConfig: TouchpointConfig = { mode, merchantWallet: w };

        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
            setConfig(newConfig);
            // Short delay to show success state/animation if we wanted, 
            // but immediate redirect is usually better for "boot" feel.
            performRedirect(newConfig);
        } catch (e) {
            setError("Failed to save configuration to device storage.");
        }
    }

    function handleClear() {
        if (confirm("Are you sure you want to reset this device?")) {
            localStorage.removeItem(CONFIG_KEY);
            setWallet("");
            setMode("terminal");
            window.location.reload();
        }
    }

    // Helper utils if not successfully imported
    function isValidHexAddress(addr: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(addr);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-neutral-400">Initializing Touchpoint...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden border border-neutral-700">

                {/* Header */}
                <div className="bg-neutral-950 p-6 flex flex-col items-center border-b border-neutral-800">
                    <div className="h-16 w-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 border border-neutral-700">
                        <Smartphone className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Device Setup</h1>
                    <p className="text-neutral-400 text-sm mt-1">Configure this Touchpoint</p>
                </div>

                {/* Form */}
                <div className="p-8 space-y-6">

                    {/* Mode Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-neutral-300 uppercase tracking-wider">Operation Mode</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode("terminal")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${mode === "terminal"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                        : "border-neutral-700 bg-neutral-800/50 text-neutral-500 hover:border-neutral-600 hover:bg-neutral-700"
                                    }`}
                            >
                                <LayoutGrid className="h-8 w-8 mb-2" />
                                <span className="font-semibold">Terminal</span>
                            </button>

                            <button
                                onClick={() => setMode("kiosk")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${mode === "kiosk"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                        : "border-neutral-700 bg-neutral-800/50 text-neutral-500 hover:border-neutral-600 hover:bg-neutral-700"
                                    }`}
                            >
                                <Store className="h-8 w-8 mb-2" />
                                <span className="font-semibold">Kiosk</span>
                            </button>
                        </div>
                    </div>

                    {/* Merchant Wallet */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-neutral-300 uppercase tracking-wider">Merchant Wallet Address</label>
                        <input
                            type="text"
                            value={wallet}
                            onChange={(e) => setWallet(e.target.value)}
                            placeholder="0x..."
                            className="w-full bg-neutral-950/50 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                        />
                    </div>

                    {/* Errors */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <Lock className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSave}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                    >
                        <Save className="h-5 w-5" />
                        Save & Launch
                    </button>

                </div>

                {/* Footer - Reset/Debug */}
                <div className="bg-neutral-950/50 p-4 border-t border-neutral-800 flex justify-center">
                    <button onClick={handleClear} className="text-neutral-600 text-xs hover:text-neutral-400 transition-colors uppercase tracking-widest font-semibold">
                        Reset Configuration
                    </button>
                </div>

            </div>
        </div>
    );
}
