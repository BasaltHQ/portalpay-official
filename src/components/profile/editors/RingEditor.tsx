"use client";

import React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { LevelPFPFrame } from "@/components/LevelPFPFrame";

interface RingEditorProps {
    pfpUrl?: string;
    activeRing?: { type: 'platform' | 'merchant' | 'none'; wallet?: string } | null;
    ringLevel?: number;
    ringPrimaryColor?: string;
    ringSecondaryColor?: string;
    ringText?: string;  // Text displayed around the ring (e.g., shop name)
    ringName?: string;  // Display name of the ring (e.g., "MangoGoes" instead of "Merchant Ring")
    onOpenRingModal?: () => void;
}

export function RingEditor({
    pfpUrl,
    activeRing,
    ringLevel = 1,
    ringPrimaryColor,
    ringSecondaryColor,
    ringText,
    ringName,
    onOpenRingModal
}: RingEditorProps) {
    const showRing = activeRing && activeRing.type !== 'none';

    const getRingTypeName = () => {
        if (!activeRing || activeRing.type === 'none') return 'No Ring';
        if (activeRing.type === 'platform') return 'Global Platform Ring';
        if (activeRing.type === 'merchant') return ringName || 'Merchant Ring';
        return 'Unknown';
    };

    return (
        <div className="space-y-6">
            {/* Premium Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                        boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
                    }}
                >
                    <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Profile Ring</h3>
                    <p className="text-xs text-muted-foreground">
                        Showcase your loyalty status with a prestigious ring around your avatar
                    </p>
                </div>
            </div>

            {/* Ring Preview Card */}
            <div
                className="relative rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Animated Background */}
                <div
                    className="absolute inset-0 opacity-30 rounded-2xl"
                    style={{
                        background: 'radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.3), transparent 50%)',
                    }}
                />

                <div className="relative p-12 flex flex-col md:flex-row items-center gap-8">
                    {/* Ring Preview - matches modal exactly */}
                    <div className="relative flex items-center justify-center" style={{ minWidth: 180, minHeight: 180 }}>
                        {/* Ring Frame - matches modal params exactly */}
                        {showRing ? (
                            <LevelPFPFrame
                                level={ringLevel}
                                size={140}
                                profileImageUrl={pfpUrl}
                                primaryColor={ringPrimaryColor}
                                innerRingColor={ringSecondaryColor}
                                glowIntensity={2.0}
                                showAnimation={true}
                                ringText={ringText}
                                textColor={ringPrimaryColor}
                            />
                        ) : (
                            <div
                                className="rounded-full overflow-hidden border-2 border-white/10"
                                style={{ width: 140, height: 140 }}
                            >
                                <img
                                    src={pfpUrl || '/default-avatar.png'}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* Ring Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Currently Equipped
                        </div>
                        <div className="text-2xl font-bold mb-2">{getRingTypeName()}</div>
                        {showRing && (
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                                <span
                                    className="px-3 py-1 rounded-full font-semibold"
                                    style={{
                                        background: `${ringPrimaryColor || '#3b82f6'}30`,
                                        color: ringPrimaryColor || '#3b82f6',
                                        border: `1px solid ${ringPrimaryColor || '#3b82f6'}50`
                                    }}
                                >
                                    Level {ringLevel}
                                </span>
                            </div>
                        )}
                        {!showRing && (
                            <p className="text-sm text-muted-foreground">
                                Your avatar is displayed without any loyalty ring decoration.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Ring Button */}
            <button
                onClick={onOpenRingModal}
                className="w-full group relative overflow-hidden rounded-xl p-4 transition-all duration-300"
                style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25))',
                    }}
                />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            }}
                        >
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Customize Your Ring</div>
                            <div className="text-xs text-muted-foreground">
                                Choose from your earned loyalty rings
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
            </button>

            {/* Info Box */}
            <div
                className="rounded-xl p-4 text-sm"
                style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
            >
                <p className="text-blue-200">
                    <strong>💡 Pro Tip:</strong> Your profile ring showcases your loyalty level across the platform.
                    Earn XP by making purchases to level up your ring and unlock new tiers!
                </p>
            </div>
        </div>
    );
}
