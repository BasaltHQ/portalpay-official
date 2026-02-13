"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Copy, ExternalLink, Smartphone, Monitor, Settings } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { getAllThemes, getTheme } from "@/lib/themes";
import type { TouchpointTheme, TouchpointType } from "@/lib/themes";
import { ThemeSwatchPreview, ThemePickerModal } from "@/components/admin/TouchpointThemePicker";


// ──────────────────────────────────────────────────────
// MAIN PANEL
// ──────────────────────────────────────────────────────
export default function EndpointsPanel() {
    const account = useActiveAccount();
    const brand = useBrand();
    const [slug, setSlug] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [touchpointThemes, setTouchpointThemes] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    // Modal state
    const [pickerOpen, setPickerOpen] = useState<{ type: TouchpointType; label: string } | null>(null);

    // Base URLs
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const kioskUrl = slug ? `${origin}/kiosk/${slug}` : "";
    const terminalUrl = slug ? `${origin}/terminal/${slug}` : "";
    const handheldUrl = slug ? `${origin}/handheld/${slug}` : "";

    // Helper to copy to clipboard
    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    useEffect(() => {
        if (!account?.address) return;
        setLoading(true);

        (async () => {
            try {
                const r = await fetch(`/api/site/config?wallet=${account.address}`);
                const j = await r.json();
                const cfg = j.config || {};
                const bestSlug = cfg.slug || cfg.customDomain || account.address.toLowerCase();
                setSlug(bestSlug);

                // Load existing touchpoint theme selections
                if (cfg.touchpointThemes && typeof cfg.touchpointThemes === "object") {
                    setTouchpointThemes(cfg.touchpointThemes);
                }
            } catch {
                setSlug(account.address.toLowerCase());
            } finally {
                setLoading(false);
            }
        })();
    }, [account?.address]);

    const saveThemeSelection = useCallback(async (touchpoint: string, themeId: string) => {
        if (!account?.address) return;
        setSaving(true);
        const updated = { ...touchpointThemes, [touchpoint]: themeId };
        setTouchpointThemes(updated);

        try {
            await fetch(`/api/site/config?wallet=${account.address}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet": account.address,
                },
                body: JSON.stringify({ touchpointThemes: updated }),
            });
        } catch (e) {
            console.error("Failed to save touchpoint theme", e);
        } finally {
            setSaving(false);
        }
    }, [account?.address, touchpointThemes]);

    if (!account) return <div className="p-4 text-muted-foreground">Please connect your wallet.</div>;

    // Card data
    const cards: {
        key: TouchpointType;
        label: string;
        desc: string;
        icon: typeof Monitor;
        url: string;
    }[] = [
            {
                key: "kiosk",
                label: "Kiosk Mode",
                desc: "Self-service ordering interface for customers. Optimized for tablets and touchscreens.",
                icon: Monitor,
                url: kioskUrl,
            },
            {
                key: "terminal",
                label: "Terminal Mode",
                desc: "Staff-facing POS interface for processing orders and payments. Requires employee login.",
                icon: Smartphone,
                url: terminalUrl,
            },
            {
                key: "handheld",
                label: "Handheld Mode",
                desc: "Mobile-optimized interface for servers to take orders at the table. Supports voice assistant.",
                icon: Smartphone,
                url: handheldUrl,
            },
            {
                key: "kds",
                label: "Kitchen Display",
                desc: "Real-time order management screen for the kitchen processing station.",
                icon: Monitor,
                url: `${origin}/kitchen/${account.address}`,
            },
        ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Point of Sale Endpoints</h2>
                <p className="text-muted-foreground text-sm">
                    Use these dedicated links to run PortalPay in Kiosk or Terminal mode on your devices.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(card => {
                    const Icon = card.icon;
                    const currentTheme = touchpointThemes[card.key];

                    return (
                        <div key={card.key} className="border rounded-xl p-5 bg-card relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Icon size={64} />
                            </div>
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className="text-primary" size={20} />
                                        <h3 className="font-semibold">{card.label}</h3>
                                        <ThemeSwatchPreview themeId={currentTheme} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {card.desc}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="bg-muted/50 p-2 rounded-md text-xs font-mono truncate border">
                                        {loading ? "Loading..." : card.url || "No URL available"}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(card.url)}
                                            className="flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-3 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                        >
                                            <Copy size={14} /> Copy Link
                                        </button>
                                        <a
                                            href={card.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 text-xs font-medium py-2 px-3 rounded-md border hover:bg-muted transition-colors"
                                        >
                                            <ExternalLink size={14} /> Open
                                        </a>
                                        <button
                                            onClick={() => setPickerOpen({ type: card.key, label: card.label })}
                                            className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-md border border-white/10 hover:bg-white/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                                            title="Set theme for this touchpoint"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-xs text-amber-600 dark:text-amber-400">
                <strong>Note:</strong> Ensure you have enabled Kiosk and Terminal modes for your shop in the settings. Kiosk mode is public, while Terminal mode requires employee PINs (configured in the Team panel).
            </div>

            {/* Theme Picker Modal */}
            {pickerOpen && (
                <ThemePickerModal
                    touchpointType={pickerOpen.type}
                    touchpointLabel={pickerOpen.label}
                    currentThemeId={touchpointThemes[pickerOpen.type] || "modern"}
                    onSelect={async (themeId) => {
                        await saveThemeSelection(pickerOpen.type, themeId);
                        setPickerOpen(null);
                    }}
                    onClose={() => setPickerOpen(null)}
                />
            )}
        </div>
    );
}
