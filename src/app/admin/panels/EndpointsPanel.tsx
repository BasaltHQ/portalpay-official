"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useSearchParams } from "next/navigation";
import { 
  Copy, ExternalLink, Smartphone, Monitor, Settings, Sun, Moon, 
  LayoutGrid, AlignJustify, Newspaper, UtensilsCrossed, Save, Check, Store,
  ChefHat, Armchair, Truck, Hotel, PenTool, ShieldCheck, ChevronDown, Package, Info
} from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { parseKioskConfig } from "@/lib/themes";
import type { TouchpointType, KioskTouchpointConfig, ColorMode, KioskLayout } from "@/lib/themes";
import { ThemeSwatchPreview, ThemePickerModal } from "@/components/admin/TouchpointThemePicker";

export default function EndpointsPanel({ industryPack }: { industryPack?: string | null }) {
    const account = useActiveAccount();
    const brand = useBrand();
    const searchParams = useSearchParams();
    const merchantWallet = searchParams?.get("wallet") || account?.address;
    
    const [slug, setSlug] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [touchpointThemes, setTouchpointThemes] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fetchedIndustryPack, setFetchedIndustryPack] = useState<string>("none");

    // Buffered kiosk settings
    const [pendingColorMode, setPendingColorMode] = useState<ColorMode>("dark");
    const [pendingLayout, setPendingLayout] = useState<KioskLayout>("grid");
    const [kioskDirty, setKioskDirty] = useState(false);

    // Buffered handheld settings
    const [pendingHandheldMode, setPendingHandheldMode] = useState<"general" | "restaurant">("restaurant");
    const [handheldDirty, setHandheldDirty] = useState(false);

    // UI State
    const [expandedApp, setExpandedApp] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState<{ type: TouchpointType; label: string } | null>(null);

    const savedHandheldMode: "general" | "restaurant" = useMemo(() => {
        const hh = touchpointThemes["handheld"];
        if (hh && typeof hh === "object" && hh.handheldMode) return hh.handheldMode;
        return "restaurant";
    }, [touchpointThemes]);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    
    const kioskConfig: KioskTouchpointConfig = useMemo(
        () => parseKioskConfig(touchpointThemes["kiosk"]),
        [touchpointThemes]
    );

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    useEffect(() => {
        if (!merchantWallet) return;
        setLoading(true);

        (async () => {
            try {
                const r = await fetch(`/api/site/config?wallet=${merchantWallet}`);
                const j = await r.json();
                const cfg = j.config || {};
                setSlug(merchantWallet);
                
                // Fetch correct industry pack directly from shop config for THIS specific merchant
                if (cfg.industryPack) {
                    setFetchedIndustryPack(cfg.industryPack);
                } else {
                    setFetchedIndustryPack("none");
                }

                if (cfg.touchpointThemes && typeof cfg.touchpointThemes === "object") {
                    setTouchpointThemes(cfg.touchpointThemes);
                    const kiosk = parseKioskConfig(cfg.touchpointThemes["kiosk"]);
                    setPendingColorMode(kiosk.colorMode || "dark");
                    const hh = cfg.touchpointThemes["handheld"];
                    if (hh && typeof hh === "object" && hh.handheldMode) {
                        setPendingHandheldMode(hh.handheldMode);
                    }
                    setPendingLayout(kiosk.kioskLayout || "grid");
                }
            } catch {
                setSlug(merchantWallet.toLowerCase());
            } finally {
                setLoading(false);
            }
        })();
    }, [merchantWallet]);

    useEffect(() => {
        const isDiff =
            pendingColorMode !== (kioskConfig.colorMode || "dark") ||
            pendingLayout !== (kioskConfig.kioskLayout || "grid");
        setKioskDirty(isDiff);
    }, [pendingColorMode, pendingLayout, kioskConfig]);

    useEffect(() => {
        setHandheldDirty(pendingHandheldMode !== savedHandheldMode);
    }, [pendingHandheldMode, savedHandheldMode]);

    const saveTouchpointTheme = useCallback(async (updated: Record<string, any>) => {
        if (!merchantWallet) return;
        setSaving(true);
        setTouchpointThemes(updated);
        try {
            const res = await fetch(`/api/site/config?wallet=${merchantWallet}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": merchantWallet },
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
    }, [merchantWallet]);

    const saveKioskSettings = useCallback(async () => {
        const current = parseKioskConfig(touchpointThemes["kiosk"]);
        const updated = {
            ...touchpointThemes,
            kiosk: { ...current, colorMode: pendingColorMode, kioskLayout: pendingLayout },
        };
        await saveTouchpointTheme(updated);
    }, [touchpointThemes, pendingColorMode, pendingLayout, saveTouchpointTheme]);

    const saveHandheldSettings = useCallback(async () => {
        const current = (touchpointThemes["handheld"] && typeof touchpointThemes["handheld"] === "object")
            ? touchpointThemes["handheld"] : {};
        const updated = {
            ...touchpointThemes,
            handheld: { ...current, handheldMode: pendingHandheldMode },
        };
        await saveTouchpointTheme(updated);
    }, [touchpointThemes, pendingHandheldMode, saveTouchpointTheme]);

    const saveThemeSelection = useCallback(async (touchpoint: string, themeId: string) => {
        if (touchpoint === "kiosk") {
            const current = parseKioskConfig(touchpointThemes["kiosk"]);
            const updated = {
                ...touchpointThemes,
                kiosk: { ...current, themeId, colorMode: pendingColorMode, kioskLayout: pendingLayout },
            };
            await saveTouchpointTheme(updated);
        } else {
            const updated = { ...touchpointThemes, [touchpoint]: themeId };
            await saveTouchpointTheme(updated);
        }
    }, [touchpointThemes, pendingColorMode, pendingLayout, saveTouchpointTheme]);

    if (!account) return <div className="p-4 text-muted-foreground">Please connect your wallet.</div>;

    const currentIndustryPack = industryPack || fetchedIndustryPack;

    const coreApps = [
        { key: "kiosk", label: "Kiosk Mode", desc: "Self-service ordering interface for customers. Optimized for tablets and touchscreens.", icon: Monitor, url: `${origin}/kiosk/${slug}`, hasConfig: true, isCore: true, bgImg: '/touchpoint-bg/bg_kiosk_1778360202180.png', iconColor: 'text-blue-400' },
        { key: "terminal", label: "Terminal Mode", desc: "Simple numpad interface like traditional merchant terminals that allows for custom amount input and payments.", icon: Smartphone, url: `${origin}/terminal/${slug}`, hasConfig: true, isCore: true, bgImg: '/touchpoint-bg/bg_terminal_1778360217334.png', iconColor: 'text-purple-400' },
        { key: "handheld", label: "Handheld Mode", desc: pendingHandheldMode === "general" ? "Mobile POS interface for general retail." : "Mobile-optimized interface for table service.", icon: Smartphone, url: `${origin}/handheld/${slug}`, hasConfig: true, isCore: true, bgImg: '/touchpoint-bg/bg_handheld_1778360237942.png', iconColor: 'text-amber-400' },
    ];

    const industryApps = [
        { key: "kds", label: "Kitchen Display (KDS)", desc: "Real-time order management screen for the kitchen processing station.", icon: ChefHat, url: `${origin}/kitchen/${slug}`, pack: "restaurant", hasConfig: true, isCore: false, bgImg: '/touchpoint-bg/bg_kitchen_1778359617065.png', iconColor: 'text-emerald-400', packIcon: UtensilsCrossed, packColor: 'text-emerald-400', packBg: 'bg-emerald-500/10 border-emerald-500/20' },
        { key: "tables", label: "Table Management", desc: "Visual floor plan and table status tracking for hosts and servers.", icon: Armchair, url: `${origin}/tables/${slug}`, pack: "restaurant", hasConfig: false, isCore: false, bgImg: '/touchpoint-bg/bg_tables_1778359637650.png', iconColor: 'text-orange-400', packIcon: UtensilsCrossed, packColor: 'text-emerald-400', packBg: 'bg-emerald-500/10 border-emerald-500/20' },
        { key: "delivery", label: "Delivery Dispatch", desc: "Courier routing and delivery order management system.", icon: Truck, url: `${origin}/delivery/${slug}`, pack: "restaurant", hasConfig: false, isCore: false, bgImg: '/touchpoint-bg/bg_delivery_1778359658581.png', iconColor: 'text-rose-400', packIcon: UtensilsCrossed, packColor: 'text-emerald-400', packBg: 'bg-emerald-500/10 border-emerald-500/20' },
        { key: "pms", label: "Hotel PMS", desc: "Property Management System for bookings, rooms, and guest services.", icon: Hotel, url: `${origin}/pms/${slug}`, pack: "hotel", hasConfig: false, isCore: false, bgImg: '/touchpoint-bg/bg_pms_1778359679059.png', iconColor: 'text-indigo-400', packIcon: Hotel, packColor: 'text-indigo-400', packBg: 'bg-indigo-500/10 border-indigo-500/20' },
        { key: "writersWorkshop", label: "Writer's Workshop", desc: "Publishing and editorial suite for authors and journalists.", icon: PenTool, url: `${origin}/writer/${slug}`, pack: "publishing", hasConfig: false, isCore: false, bgImg: '/touchpoint-bg/bg_writers_1778359694234.png', iconColor: 'text-pink-400', packIcon: Newspaper, packColor: 'text-pink-400', packBg: 'bg-pink-500/10 border-pink-500/20' },
        { key: "cannabisCompliance", label: "Compliance Engine", desc: "Seed-to-sale tracking and state regulatory compliance integration.", icon: ShieldCheck, url: `${origin}/compliance/${slug}`, pack: "cannabis", hasConfig: false, isCore: false, bgImg: '/touchpoint-bg/bg_cannabis_1778359712354.png', iconColor: 'text-green-500', packIcon: ShieldCheck, packColor: 'text-green-500', packBg: 'bg-green-500/10 border-green-500/20' },
    ];

    const renderAppCard = (app: any) => {
        const Icon = app.icon;
        const PackIcon = app.packIcon;
        const isExpanded = expandedApp === app.key;
        const isKiosk = app.key === "kiosk";
        const currentThemeId = isKiosk ? kioskConfig.themeId : (typeof touchpointThemes[app.key] === 'string' ? touchpointThemes[app.key] : undefined);
        const isPackActive = app.pack === currentIndustryPack;

        return (
            <div key={app.key} className="relative rounded-2xl border border-white/10 bg-black overflow-hidden group hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col justify-between h-full">
                
                {/* Specific Realistic Background Image */}
                <div 
                    className="absolute inset-0 z-0 opacity-40 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none mix-blend-screen scale-105 group-hover:scale-100"
                    style={{ backgroundImage: `url(${app.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />

                {/* Dark gradient overlay to ensure text readability */}
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 pointer-events-none" />

                {/* Optional faded huge icon behind */}
                <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none z-0">
                    <Icon size={180} />
                </div>
                
                <div className="p-6 relative z-10 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-black/60 rounded-xl border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-300 backdrop-blur-md">
                                <Icon className={`${app.iconColor}`} size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-md">{app.label}</h3>
                                {!app.isCore && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border flex items-center gap-1.5 ${app.packBg} ${app.packColor} backdrop-blur-md`}>
                                            <PackIcon size={10} />
                                            {app.pack} pack
                                        </span>
                                        {isPackActive && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)] backdrop-blur-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedApp(isExpanded ? null : app.key); }}
                            className={`p-2 rounded-full border transition-all duration-300 ${isExpanded ? 'bg-white/20 text-white border-white/30 rotate-180' : 'bg-black/40 text-muted-foreground border-transparent hover:bg-white/10 hover:text-white backdrop-blur-md'}`}
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-300 line-clamp-2 mb-6 drop-shadow-sm font-medium">
                        {app.desc}
                    </p>

                </div>

                <div className="px-6 pb-6 pt-2 relative z-10 mt-auto">
                    <button 
                        onClick={() => window.open(app.url, "_blank")}
                        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(var(--primary),0.3)] bg-primary text-primary-foreground hover:bg-primary hover:-translate-y-0.5 flex justify-center items-center gap-2 backdrop-blur-sm"
                    >
                        Launch App <ExternalLink size={16} />
                    </button>
                </div>

                {/* Expanded Settings Section */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out relative z-10 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pt-0 border-t border-white/10 bg-black/80 backdrop-blur-xl">
                        <div className="space-y-6 mt-4">
                            {/* URL Section */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Device URL</label>
                                <div className="flex gap-2">
                                    <div className="bg-black/50 p-3 rounded-lg text-xs font-mono truncate border border-white/10 flex-1 flex items-center">
                                        {loading ? "Loading..." : app.url}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(app.url)}
                                        className="flex items-center justify-center gap-2 text-xs font-medium px-4 rounded-lg bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                </div>
                            </div>

                            {/* Configuration Options */}
                            {app.hasConfig && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Theme & Assets</label>
                                        <button
                                            onClick={() => setPickerOpen({ type: app.key as TouchpointType, label: app.label })}
                                            className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <ThemeSwatchPreview themeId={currentThemeId} />
                                            Change Theme
                                        </button>
                                    </div>

                                    {/* Kiosk Controls */}
                                    {isKiosk && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Color Mode</span>
                                                <div className="flex rounded-lg border border-white/10 overflow-hidden bg-black/50">
                                                    <button onClick={() => setPendingColorMode('dark')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium transition-all ${pendingColorMode === 'dark' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}>
                                                        <Moon size={12} /> Dark
                                                    </button>
                                                    <button onClick={() => setPendingColorMode('light')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium transition-all border-l border-white/10 ${pendingColorMode === 'light' ? 'bg-amber-500/20 text-amber-400' : 'text-muted-foreground hover:text-white'}`}>
                                                        <Sun size={12} /> Light
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Layout Style</span>
                                                <select 
                                                    value={pendingLayout}
                                                    onChange={(e) => setPendingLayout(e.target.value as KioskLayout)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-primary/50"
                                                >
                                                    <option value="grid">Grid Layout</option>
                                                    <option value="list">List Layout</option>
                                                    <option value="magazine">Magazine Layout</option>
                                                    <option value="restaurant">Restaurant Menu</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Handheld Controls */}
                                    {app.key === "handheld" && (
                                        <div className="space-y-2">
                                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Operational Mode</span>
                                            <div className="flex rounded-lg border border-white/10 overflow-hidden bg-black/50">
                                                <button onClick={() => setPendingHandheldMode('general')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium transition-all ${pendingHandheldMode === 'general' ? 'bg-blue-500/20 text-blue-400' : 'text-muted-foreground hover:text-white'}`}>
                                                    <Store size={12} /> General Retail
                                                </button>
                                                <button onClick={() => setPendingHandheldMode('restaurant')} className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium transition-all border-l border-white/10 ${pendingHandheldMode === 'restaurant' ? 'bg-amber-500/20 text-amber-400' : 'text-muted-foreground hover:text-white'}`}>
                                                    <UtensilsCrossed size={12} /> Table Service
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Save Button for modified state */}
                                    {(isKiosk && kioskDirty) || (app.key === "handheld" && handheldDirty) ? (
                                        <button
                                            onClick={isKiosk ? saveKioskSettings : saveHandheldSettings}
                                            disabled={saving}
                                            className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                        >
                                            {saving ? <span className="animate-spin w-3 h-3 border-2 border-white/50 border-t-white rounded-full" /> : <Save size={14} />}
                                            Save Settings
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-6 pb-24">
            {/* Hero Section */}
            <div className="relative p-8 md:p-12 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Touchpoint App Store</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
                        Your Platform Ecosystem
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        Deploy, configure, and launch the physical touchpoints that power your business. Connect iPads and mobile devices instantly using the secure URLs below.
                    </p>

                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex gap-4 items-start">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary shrink-0 mt-0.5 shadow-inner">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-1">How it Works</h4>
                            <p className="text-sm text-primary-foreground/70 leading-relaxed">
                                Each touchpoint acts as an independent application running on the BasaltSurge engine. To deploy a kiosk or terminal, simply copy its specific <strong>Device URL</strong> and open it on the target physical device. The device will automatically sync with your shop's inventory and theme.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Touchpoints */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-white">Core Touchpoints</h2>
                    <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coreApps.map(renderAppCard)}
                </div>
            </div>

            {/* Industry Pack Modules */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-white">Industry Modules</h2>
                    <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {industryApps.map(renderAppCard)}
                </div>
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
