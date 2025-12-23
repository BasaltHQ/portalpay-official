"use client";

import React, { useState, useCallback } from "react";
import { Shuffle, Sparkles, Save, Check, Loader2, User } from "lucide-react";
import { GenerativeArtBadge } from "@/components/GenerativeArtBadge";
import { LevelPFPFrame } from "@/components/LevelPFPFrame";
import {
    PlatformArtConfig,
    ArtTheme,
    THEME_PALETTES,
    createDefaultPlatformConfig,
} from "@/utils/generative-art";

interface PlatformArtStudioProps {
    onSave?: (config: PlatformArtConfig) => Promise<void>;
    initialConfig?: PlatformArtConfig;
}

const THEMES: { id: ArtTheme; label: string; colors: string[] }[] = [
    { id: 'cosmic', label: 'Cosmic', colors: THEME_PALETTES.cosmic },
    { id: 'crystal', label: 'Crystal', colors: THEME_PALETTES.crystal },
    { id: 'nature', label: 'Nature', colors: THEME_PALETTES.nature },
    { id: 'cyber', label: 'Cyber', colors: THEME_PALETTES.cyber },
    { id: 'elemental', label: 'Elemental', colors: THEME_PALETTES.elemental },
    { id: 'royal', label: 'Royal', colors: THEME_PALETTES.royal },
    { id: 'minimal', label: 'Minimal', colors: THEME_PALETTES.minimal },
    { id: 'aurora', label: 'Aurora', colors: THEME_PALETTES.aurora },
];

export function PlatformArtStudio({ onSave, initialConfig }: PlatformArtStudioProps) {
    const [config, setConfig] = useState<PlatformArtConfig>(
        initialConfig || createDefaultPlatformConfig('cosmic')
    );
    const [shuffleSeed, setShuffleSeed] = useState(Date.now());
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleShuffle = useCallback(() => {
        setShuffleSeed(Date.now());
    }, []);

    const handleThemeChange = (theme: ArtTheme) => {
        const newConfig = createDefaultPlatformConfig(theme);
        setConfig(newConfig);
        handleShuffle();
    };

    const handleSave = async () => {
        if (!onSave) return;
        setSaving(true);
        setSaved(false);
        try {
            await onSave(config);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error('Failed to save art config:', e);
        } finally {
            setSaving(false);
        }
    };

    const tierSamples = [
        { level: 5, label: 'Bronze', desc: 'Lv. 1-10' },
        { level: 18, label: 'Silver', desc: 'Lv. 11-25' },
        { level: 32, label: 'Gold', desc: 'Lv. 26-40' },
        { level: 45, label: 'Platinum', desc: 'Lv. 41-49' },
        { level: 50, label: 'Diamond', desc: 'Lv. 50 (Max)' },
    ];

    const primaryColor = THEME_PALETTES[config.theme]?.[0];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Level Badge & Frame Designer
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Choose a theme color. Tier styling updates automatically based on level.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShuffle}
                        className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-all"
                    >
                        <Shuffle className="w-4 h-4" />
                        Shuffle
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Theme Selection */}
            <div className="glass-pane rounded-xl border p-6">
                <h4 className="text-sm font-medium mb-4">Theme Color</h4>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${config.theme === theme.id
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                }`}
                        >
                            <div className="flex justify-center gap-1 mb-2">
                                {theme.colors.slice(0, 3).map((c, i) => (
                                    <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <div className="text-xs font-medium text-center">{theme.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Level Badges - All Same Size */}
            <div className="glass-pane rounded-xl border p-6">
                <h4 className="text-sm font-medium mb-2">Level Badges by Tier</h4>
                <p className="text-xs text-muted-foreground mb-6">
                    All badges are the same size. Tier is shown through particle density, ring count, and special effects.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-10 bg-muted/20 rounded-xl p-8">
                    {tierSamples.map(({ level, label, desc }) => (
                        <div key={level} className="text-center">
                            <GenerativeArtBadge
                                seed={`preview-${shuffleSeed}-${level}`}
                                size={80}
                                level={level}
                                showAnimation={true}
                                primaryColor={primaryColor}
                            />
                            <div className="mt-3 text-xs font-medium">{label}</div>
                            <div className="text-[10px] text-muted-foreground">{desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PFP Frames */}
            <div className="glass-pane rounded-xl border p-6">
                <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-medium">Profile Picture Frames</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                    Matching ring frames for profile pictures. Higher tiers have more particles and effects.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-10 bg-muted/20 rounded-xl p-8">
                    {[
                        { level: 8, prestige: 0, label: 'Bronze' },
                        { level: 20, prestige: 0, label: 'Silver' },
                        { level: 35, prestige: 1, label: 'Gold +P1' },
                        { level: 46, prestige: 3, label: 'Platinum +P3' },
                        { level: 50, prestige: 5, label: 'Diamond +P5' },
                    ].map(({ level, prestige, label }) => (
                        <div key={`${level}-${prestige}`} className="text-center">
                            <LevelPFPFrame
                                level={level}
                                prestige={prestige}
                                size={80}
                                showAnimation={true}
                                primaryColor={primaryColor}
                            />
                            <div className="mt-3 text-xs font-medium">{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PlatformArtStudio;
