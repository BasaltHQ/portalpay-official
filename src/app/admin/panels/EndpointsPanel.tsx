"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Copy, ExternalLink, Smartphone, Monitor, Settings, Sun, Moon, LayoutGrid, AlignJustify, Newspaper, UtensilsCrossed, Save, Check } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { parseKioskConfig } from "@/lib/themes";
import type { TouchpointType, KioskTouchpointConfig, ColorMode, KioskLayout } from "@/lib/themes";
import { ThemeSwatchPreview, ThemePickerModal } from "@/components/admin/TouchpointThemePicker";


// ──────────────────────────────────────────────────────
// MAIN PANEL
// ──────────────────────────────────────────────────────
export default function EndpointsPanel() {
    const account = useActiveAccount();
    const brand = useBrand();
    const [slug, setSlug] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [touchpointThemes, setTouchpointThemes] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Buffered kiosk settings — edited locally, only committed on Save
    const [pendingColorMode, setPendingColorMode] = useState<ColorMode>("dark");
    const [pendingLayout, setPendingLayout] = useState<KioskLayout>("grid");
    const [kioskDirty, setKioskDirty] = useState(false);

    // Modal state
    const [pickerOpen, setPickerOpen] = useState<{ type: TouchpointType; label: string } | null>(null);

    // Base URLs
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const kioskUrl = slug ? `${origin}/kiosk/${slug}` : "";
    const terminalUrl = slug ? `${origin}/terminal/${slug}` : "";
    const handheldUrl = slug ? `${origin}/handheld/${slug}` : "";

    // Parsed kiosk config (server-confirmed state)
    const kioskConfig: KioskTouchpointConfig = useMemo(
        () => parseKioskConfig(touchpointThemes["kiosk"]),
        [touchpointThemes]
    );

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    // Load config on mount
    useEffect(() => {
        if (!account?.address) return;
        setLoading(true);

        (async () => {
            try {
                const r = await fetch(`/api/site/config?wallet=${account.address}`);
                const j = await r.json();
                const cfg = j.config || {};

                setSlug(account.address);

                if (cfg.touchpointThemes && typeof cfg.touchpointThemes === "object") {
                    setTouchpointThemes(cfg.touchpointThemes);
                    // Seed pending state from saved config
                    const kiosk = parseKioskConfig(cfg.touchpointThemes["kiosk"]);
                    setPendingColorMode(kiosk.colorMode || "dark");
                    setPendingLayout(kiosk.kioskLayout || "grid");
                }
            } catch {
                setSlug(account.address.toLowerCase());
            } finally {
                setLoading(false);
            }
        })();
    }, [account?.address]);

    // Mark dirty when pending differs from saved
    useEffect(() => {
        const isDiff =
            pendingColorMode !== (kioskConfig.colorMode || "dark") ||
            pendingLayout !== (kioskConfig.kioskLayout || "grid");
        setKioskDirty(isDiff);
    }, [pendingColorMode, pendingLayout, kioskConfig]);

    // ── Core save function ───────────────────────────────────────────────────
    const saveTouchpointTheme = useCallback(async (updated: Record<string, any>) => {
        if (!account?.address) return;
        setSaving(true);
        setTouchpointThemes(updated);
        try {
            const res = await fetch(`/api/site/config?wallet=${account.address}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": account.address },
                body: JSON.stringify({ touchpointThemes: updated }),
            });
            if (res.ok) {
                setSaved(true);
                setKioskDirty(false);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (e) {
            console.error("Failed to save touchpoint theme", e);
        } finally {
            setSaving(false);
        }
    }, [account?.address]);

    // ── Save all pending kiosk settings at once ──────────────────────────────
    const saveKioskSettings = useCallback(async () => {
        const current = parseKioskConfig(touchpointThemes["kiosk"]);
        const updated = {
            ...touchpointThemes,
            kiosk: {
                ...current,
                colorMode: pendingColorMode,
                kioskLayout: pendingLayout,
            },
        };
        await saveTouchpointTheme(updated);
    }, [touchpointThemes, pendingColorMode, pendingLayout, saveTouchpointTheme]);

    // ── Theme picker save (immediate — only called from modal after selection) ─
    const saveThemeSelection = useCallback(async (touchpoint: string, themeId: string) => {
        if (touchpoint === "kiosk") {
            const current = parseKioskConfig(touchpointThemes["kiosk"]);
            const updated = {
                ...touchpointThemes,
                kiosk: {
                    ...current,
                    themeId,
                    // persist current pending settings too
                    colorMode: pendingColorMode,
                    kioskLayout: pendingLayout,
                },
            };
            await saveTouchpointTheme(updated);
        } else {
            const updated = { ...touchpointThemes, [touchpoint]: themeId };
            await saveTouchpointTheme(updated);
        }
    }, [touchpointThemes, pendingColorMode, pendingLayout, saveTouchpointTheme]);

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
                    const isKiosk = card.key === "kiosk";
                    const currentThemeId = isKiosk
                        ? kioskConfig.themeId
                        : (typeof touchpointThemes[card.key] === 'string' ? touchpointThemes[card.key] : undefined);

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
                                        <ThemeSwatchPreview themeId={currentThemeId} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {card.desc}
                                    </p>

                                    {/* Kiosk-only: Dark/Light + Layout controls */}
                                    {isKiosk && (
                                        <div className="mt-3 space-y-2">
                                            {/* Color mode toggle */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-muted-foreground w-14 shrink-0">Mode</span>
                                                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                                                    <button
                                                        onClick={() => setPendingColorMode('dark')}
                                                        title="Dark mode"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${pendingColorMode === 'dark'
                                                            ? 'bg-primary/20 text-primary'
                                                            : 'text-muted-foreground hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <Moon size={12} /> Dark
                                                    </button>
                                                    <button
                                                        onClick={() => setPendingColorMode('light')}
                                                        title="Light mode"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-white/10 transition-all ${pendingColorMode === 'light'
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'text-muted-foreground hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <Sun size={12} /> Light
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Layout type */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-muted-foreground w-14 shrink-0">Layout</span>
                                                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                                                    {([
                                                        { value: 'grid' as KioskLayout, icon: LayoutGrid, label: 'Grid' },
                                                        { value: 'list' as KioskLayout, icon: AlignJustify, label: 'List' },
                                                        { value: 'magazine' as KioskLayout, icon: Newspaper, label: 'Magazine' },
                                                        { value: 'restaurant' as KioskLayout, icon: UtensilsCrossed, label: 'Restaurant' },
                                                    ] as const).map(({ value, icon: LIcon, label }, i) => (
                                                        <button
                                                            key={value}
                                                            onClick={() => setPendingLayout(value)}
                                                            title={`${label} layout`}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${i > 0 ? 'border-l border-white/10' : ''} ${pendingLayout === value
                                                                ? 'bg-primary/20 text-primary'
                                                                : 'text-muted-foreground hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <LIcon size={12} /> {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Save kiosk config button */}
                                            <div className="pt-1">
                                                <button
                                                    onClick={saveKioskSettings}
                                                    disabled={saving || (!kioskDirty && !saved)}
                                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${saved
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : kioskDirty
                                                            ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                                            : 'bg-muted/50 text-muted-foreground border border-white/10 cursor-default'
                                                        }`}
                                                >
                                                    {saved ? (
                                                        <><Check size={12} /> Saved!</>
                                                    ) : saving ? (
                                                        <><span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> Saving...</>
                                                    ) : (
                                                        <><Save size={12} /> Save Kiosk Settings</>
                                                    )}
                                                </button>
                                                {kioskDirty && (
                                                    <p className="text-[10px] text-amber-400/70 mt-1">Unsaved changes</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                    currentThemeId={
                        pickerOpen.type === 'kiosk'
                            ? kioskConfig.themeId
                            : (touchpointThemes[pickerOpen.type] || "modern")
                    }
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
