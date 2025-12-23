
"use client";

import React, { useState } from "react";
import { Truck, ShoppingBag, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function DeliveryPanel() {
    const [mode, setMode] = useState<"dashboard" | "wizard" | "menu">("dashboard");
    const [storeId, setStoreId] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [syncResult, setSyncResult] = useState<any>(null);

    // -- Actions --

    async function handleConnect() {
        if (!storeId) {
            setStatus("Please enter your Store ID.");
            return;
        }
        setIsLoading(true);
        setStatus("Connecting...");
        try {
            const res = await fetch("/api/integrations/delivery/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Connection failed");

            setIsConnected(true);
            setStatus("Connected successfully!");
            setTimeout(() => setMode("dashboard"), 1500);
        } catch (e: any) {
            setStatus("Error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleMenuSync() {
        setIsLoading(true);
        setSyncResult(null);
        try {
            // Fallback store ID for demo if not set in state (would normally fetch from saved config)
            const sid = storeId || "demo-store-123";
            const res = await fetch("/api/integrations/delivery/menu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeId: sid })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Sync failed");

            setSyncResult(data);
        } catch (e: any) {
            setSyncResult({ error: e.message });
        } finally {
            setIsLoading(false);
        }
    }

    // -- Sub-Components --

    function renderWizard() {
        return (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Connect Uber Eats</h2>
                    <p className="text-muted-foreground">
                        Enter your Store ID provided by Uber to connect your PortalPay inventory.
                    </p>
                </div>

                <div className="glass-pane border p-6 rounded-xl space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Uber Eats Store UUID</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            placeholder="e.g. 963d3-..."
                            value={storeId}
                            onChange={e => setStoreId(e.target.value)}
                        />
                        <p className="microtext text-muted-foreground">Found in your Uber Eats Manager URL.</p>
                    </div>

                    <button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="w-full py-2 bg-black text-white rounded-md font-medium hover:bg-black/90 disabled:opacity-50"
                    >
                        {isLoading ? "Connecting..." : "Connect Store"}
                    </button>

                    {status && (
                        <div className={`text-center text-sm ${status.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>
                            {status}
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <button onClick={() => setMode("dashboard")} className="text-sm text-muted-foreground hover:underline">Cancel</button>
                </div>
            </div>
        );
    }

    function renderMenuSync() {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Menu Synchronization</h2>
                        <p className="text-muted-foreground">Push your restaurant items to Uber Eats.</p>
                    </div>
                    <button onClick={() => setMode("dashboard")} className="text-sm border px-3 py-1 rounded-md">Back</button>
                </div>

                <div className="glass-pane border p-6 rounded-xl text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        <RefreshCw className={`w-8 h-8 text-blue-600 ${isLoading ? "animate-spin" : ""}`} />
                    </div>
                    <h3 className="text-lg font-medium">Ready to Sync</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        This will overwrite your Uber Eats menu with items from your inventory labeled with <b>Industry Pack: Restaurant</b>.
                    </p>

                    <button
                        onClick={handleMenuSync}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? "Syncing..." : "Push Menu Update"}
                    </button>

                    {syncResult && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-md text-left text-sm font-mono overflow-auto max-h-40">
                            {syncResult.error ? (
                                <span className="text-red-500">Error: {syncResult.error}</span>
                            ) : (
                                <span className="text-emerald-600 space-y-1 block">
                                    <div>Success: {syncResult.success ? "True" : "False"}</div>
                                    {syncResult.syncedItems !== undefined && <div>Items Synced: {syncResult.syncedItems}</div>}
                                    <div>{syncResult.details}</div>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderDashboard() {
        return (
            <div className="space-y-6 animate-in fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Delivery</h1>
                        <p className="text-muted-foreground">Manage your Uber Eats integration and orders.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isConnected && (
                            <button onClick={() => setMode("wizard")} className="px-4 py-2 bg-black text-white rounded-md font-medium text-sm flex items-center gap-2">
                                <Truck className="w-4 h-4" /> Connect Uber Eats
                            </button>
                        )}
                        {isConnected && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Live
                            </span>
                        )}
                        <button onClick={() => setMode("menu")} className="px-4 py-2 border rounded-md font-medium text-sm flex items-center gap-2 hover:bg-accent">
                            <ShoppingBag className="w-4 h-4" /> Menu Sync
                        </button>
                    </div>
                </div>

                {/* Stats / Heatmap Placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-pane border p-5 rounded-xl space-y-2">
                        <div className="text-sm text-muted-foreground font-medium">Active Orders</div>
                        <div className="text-3xl font-bold">0</div>
                    </div>
                    <div className="glass-pane border p-5 rounded-xl space-y-2">
                        <div className="text-sm text-muted-foreground font-medium">Revenue (Today)</div>
                        <div className="text-3xl font-bold">$0.00</div>
                    </div>
                    <div className="glass-pane border p-5 rounded-xl space-y-2">
                        <div className="text-sm text-muted-foreground font-medium">Avg. Delivery Time</div>
                        <div className="text-3xl font-bold">-- min</div>
                    </div>
                </div>

                <div className="glass-pane border p-1 rounded-xl h-[400px] bg-muted/20 flex items-center justify-center relative overflow-hidden">
                    {/* Simple visual placeholder for map */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="text-center space-y-2 relative z-10">
                        <Truck className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                        <p className="text-muted-foreground font-medium">No active deliveries in your area.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Use simple conditional rendering
    if (mode === 'wizard') return renderWizard();
    if (mode === 'menu') return renderMenuSync();
    return renderDashboard();
}
