"use client";

import React, { useState, useMemo } from "react";
import { Palette, X, Check, Settings } from "lucide-react";
import { getAllThemes, getTheme, DEFAULT_THEME_ID } from "@/lib/themes";
import type { TouchpointTheme, TouchpointType } from "@/lib/themes";

// ──────────────────────────────────────────────────────
// THEME SWATCH PREVIEW — small colour strip for cards
// ──────────────────────────────────────────────────────
export function ThemeSwatchPreview({ themeId }: { themeId?: string }) {
    const t = getTheme(themeId);
    return (
        <div className="flex items-center gap-1 ml-auto">
            <div className="w-3 h-3 rounded-full border border-white/10" style={{ background: t.primaryColor }} title={t.name} />
            <div className="w-3 h-3 rounded-full border border-white/10" style={{ background: t.secondaryColor }} title={t.name} />
            <span className="text-[10px] text-muted-foreground capitalize">{t.name}</span>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// THEME PICKER MODAL
// ──────────────────────────────────────────────────────
export function ThemePickerModal({
    touchpointType,
    touchpointLabel,
    currentThemeId,
    onSelect,
    onClose,
}: {
    touchpointType: TouchpointType;
    touchpointLabel: string;
    currentThemeId: string;
    onSelect: (themeId: string) => void;
    onClose: () => void;
}) {
    const themes = useMemo(() => getAllThemes(), []);
    const [selected, setSelected] = useState(currentThemeId);

    return (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-[#141418] border border-white/10 border-b-0 rounded-t-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Palette size={16} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-sm">{touchpointLabel} Theme</h3>
                            <p className="text-xs text-muted-foreground">Select a visual theme for this touchpoint</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                        <X size={16} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Theme Options */}
                <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => setSelected(theme.id)}
                            className={`w-full text-left rounded-xl p-4 border transition-all group ${selected === theme.id
                                ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Color preview block */}
                                <div
                                    className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative"
                                    style={{ background: theme.primaryBg }}
                                >
                                    <div
                                        className="absolute inset-1 rounded-md"
                                        style={{
                                            background: theme.surfaceBg,
                                            border: `1px solid ${theme.borderColor}`,
                                            borderRadius: theme.borderRadius,
                                        }}
                                    >
                                        <div className="flex gap-0.5 p-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: theme.primaryColor }} />
                                            <div className="w-2 h-2 rounded-full" style={{ background: theme.secondaryColor }} />
                                        </div>
                                        <div className="px-1.5 space-y-0.5">
                                            <div className="h-0.5 rounded-full w-3/4" style={{ background: theme.textPrimary, opacity: 0.6 }} />
                                            <div className="h-0.5 rounded-full w-1/2" style={{ background: theme.textSecondary, opacity: 0.4 }} />
                                        </div>
                                    </div>
                                    {theme.gradientBg && (
                                        <div className="absolute inset-0" style={{ background: theme.gradientBg, opacity: 0.6 }} />
                                    )}
                                </div>

                                {/* Theme info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-white">{theme.name}</span>
                                        {selected === theme.id && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                                                <Check size={10} /> Selected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{theme.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex gap-1">
                                            {[theme.primaryColor, theme.secondaryColor, theme.primaryBg, theme.textPrimary].map((c, i) => (
                                                <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{theme.buttonStyle} • r{theme.borderRadius}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSelect(selected)}
                        className="px-5 py-2 text-sm rounded-lg font-medium text-white transition-all"
                        style={{
                            background: `linear-gradient(135deg, var(--primary, #10b981), var(--primary, #10b981)cc)`,
                        }}
                    >
                        Apply Theme
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// TOUCHPOINT THEME CARD — inline card for admin panels
// ──────────────────────────────────────────────────────
const TOUCHPOINT_LABELS: Record<string, string> = {
    terminal: "Terminal",
    handheld: "Handheld",
    kiosk: "Kiosk",
    kds: "Kitchen Display",
};

export function TouchpointThemeCards({
    touchpointThemes,
    onOpenPicker,
    saving,
}: {
    touchpointThemes: Record<string, string>;
    onOpenPicker: (type: TouchpointType, label: string) => void;
    saving?: boolean;
}) {
    const touchpoints: { key: TouchpointType; label: string }[] = [
        { key: "terminal", label: "Terminal" },
        { key: "handheld", label: "Handheld" },
        { key: "kiosk", label: "Kiosk" },
        { key: "kds", label: "Kitchen Display" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {touchpoints.map(tp => {
                const currentThemeId = touchpointThemes[tp.key] || DEFAULT_THEME_ID;
                const theme = getTheme(currentThemeId);
                return (
                    <div
                        key={tp.key}
                        className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/20 hover:bg-black/30 transition-colors"
                    >
                        {/* Mini theme preview */}
                        <div
                            className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative"
                            style={{ background: theme.primaryBg }}
                        >
                            <div
                                className="absolute inset-0.5 rounded-md"
                                style={{
                                    background: theme.surfaceBg,
                                    border: `1px solid ${theme.borderColor}`,
                                    borderRadius: theme.borderRadius,
                                }}
                            >
                                <div className="flex gap-0.5 p-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.primaryColor }} />
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.secondaryColor }} />
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white">{tp.label}</div>
                            <div className="text-[10px] text-muted-foreground capitalize">{theme.name}</div>
                        </div>

                        {/* Settings button */}
                        <button
                            onClick={() => onOpenPicker(tp.key, tp.label)}
                            disabled={saving}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:bg-white/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary disabled:opacity-50"
                            title={`Set theme for ${tp.label}`}
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
