"use client";

import React from "react";
import { createPortal } from "react-dom";
import { User, Check } from "lucide-react";
import { LevelPFPFrame } from "@/components/LevelPFPFrame";
import { GenerativeArtBadge, SolarSystemConfig } from "@/components/GenerativeArtBadge";
import { calculateLevelProgress, DEFAULT_LOYALTY_CONFIG, LoyaltyConfig, LevelProgress } from "@/utils/loyalty-math";

// --- Types ---

export type RingPreference = { type: 'platform' | 'merchant' | 'none'; wallet?: string } | null;

export type ShopTheme = {
    primaryColor?: string;
    secondaryColor?: string;
    brandLogoUrl?: string;
    logoShape?: "square" | "circle";
};

export type ShopRewardSummary = {
    merchantWallet: string;
    shopSlug?: string;
    shopName?: string;
    theme?: ShopTheme;
    totalPoints: number;
    orderCount: number;
    lastOrderDate: number;
    orders: any[];
};

export type UserProfile = {
    pfpUrl?: string;
    displayName?: string;
};

export interface ProfileRingModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeRing: RingPreference;
    onSelectRing: (ring: RingPreference) => void;
    shops: ShopRewardSummary[];
    userProfile: UserProfile | null;
    platformProgress: LevelProgress;
    platformPrestige: number;
    platformArtConfig: SolarSystemConfig | null;
    platformLoyaltyConfig: LoyaltyConfig;
    merchantArtConfigs: Record<string, SolarSystemConfig>;
    merchantLoyaltyConfigs: Record<string, LoyaltyConfig>;
}

function formatPoints(n: number) {
    return Math.floor(n).toLocaleString();
}

export function ProfileRingModal({
    isOpen,
    onClose,
    activeRing,
    onSelectRing,
    shops,
    userProfile,
    platformProgress,
    platformPrestige,
    platformArtConfig,
    platformLoyaltyConfig,
    merchantArtConfigs,
}: ProfileRingModalProps) {
    // Don't render if not open or if we're on the server
    if (!isOpen || typeof document === 'undefined') return null;

    // Get the preview configuration based on active ring
    const getPreviewConfig = () => {
        let level = platformProgress.currentLevel;
        let primaryColor: string | undefined = undefined;
        let innerRingColor: string | undefined = undefined;
        let artConfig = platformArtConfig;
        let seed = "platform-bg";
        let showRing = true;
        let ringText: string | undefined = undefined;

        // No ring selected
        if (activeRing?.type === 'none') {
            showRing = false;
        }
        // Merchant ring selected
        else if (activeRing?.type === 'merchant' && activeRing.wallet) {
            const shop = shops.find(s => s.merchantWallet === activeRing.wallet);
            if (shop) {
                level = calculateLevelProgress(shop.totalPoints, platformLoyaltyConfig).currentLevel;
                primaryColor = shop.theme?.primaryColor;
                innerRingColor = shop.theme?.secondaryColor || shop.theme?.primaryColor;
                ringText = shop.shopName;
            }
            const mConfig = merchantArtConfigs[activeRing.wallet];
            if (mConfig) {
                artConfig = mConfig;
                seed = (mConfig as any).seed || activeRing.wallet;
            }
        }

        return { level, primaryColor, innerRingColor, artConfig, seed, showRing, ringText };
    };

    const preview = getPreviewConfig();

    const modalContent = (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
                zIndex: 2147483647,
                backgroundColor: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative"
                style={{
                    zIndex: 2147483648,
                    backgroundColor: '#0a0f1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 0 80px rgba(59, 130, 246, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                }}
            >
                {/* Modal Header */}
                <div
                    className="p-6 flex justify-between items-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            Customize Profile Ring
                        </h2>
                        <p className="text-sm text-gray-400 mt-1 ml-13">Select which earned loyalty ring to display on your profile</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105"
                    >
                        <Check className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#0a0f1a' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Preview */}
                        <div className="space-y-6">
                            <div
                                className="aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
                                style={{
                                    background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0.4) 70%)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {/* Dynamic Background Preview */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-40"
                                    style={{ animation: 'spin 120s linear infinite' }}
                                >
                                    {preview.artConfig && (
                                        <GenerativeArtBadge
                                            key={`preview-bg-${preview.seed}`}
                                            seed={preview.seed}
                                            level={50}
                                            size={400}
                                            showAnimation={true}
                                            prestige={platformPrestige}
                                            config={{ ...preview.artConfig, showOrbits: true, showTrails: true, animationSpeed: 1 }}
                                        />
                                    )}
                                </div>

                                <div className="relative" style={{ transform: 'scale(1.5)' }}>
                                    {/* Preview - Either plain avatar or LevelPFPFrame */}
                                    {preview.showRing ? (
                                        <LevelPFPFrame
                                            level={preview.level}
                                            size={140}
                                            profileImageUrl={userProfile?.pfpUrl}
                                            primaryColor={preview.primaryColor}
                                            innerRingColor={preview.innerRingColor}
                                            glowIntensity={2.0}
                                            showAnimation={true}
                                            ringText={preview.ringText}
                                            textColor={preview.primaryColor}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-full overflow-hidden"
                                            style={{ width: 140, height: 140 }}
                                        >
                                            <img
                                                src={userProfile?.pfpUrl || '/default-avatar.png'}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-6 left-0 right-0 text-center">
                                    <div
                                        className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
                                        style={{
                                            background: 'rgba(0,0,0,0.7)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.8)'
                                        }}
                                    >
                                        Currently Equipped
                                    </div>
                                </div>
                            </div>

                            <div
                                className="p-4 rounded-xl text-sm"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    color: 'rgba(147, 197, 253, 1)'
                                }}
                            >
                                <p>
                                    <strong>Pro Tip:</strong> Merchant rings show your dedication to specific communities. The Global Platform ring shows your overall status.
                                </p>
                            </div>
                        </div>

                        {/* Right: Selection List */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                                Your Collection
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                                >
                                    {shops.length + 2} Rings
                                </span>
                            </h3>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                                {/* No Ring Option */}
                                <div
                                    onClick={() => { onSelectRing({ type: 'none' }); onClose(); }}
                                    className="p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all duration-200"
                                    style={{
                                        background: activeRing?.type === 'none'
                                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1))'
                                            : 'rgba(255,255,255,0.03)',
                                        border: activeRing?.type === 'none'
                                            ? '1px solid rgba(59, 130, 246, 0.5)'
                                            : '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: activeRing?.type === 'none' ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none'
                                    }}
                                >
                                    <div
                                        className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Off</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">No Ring</div>
                                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Display your avatar without any loyalty ring</div>
                                    </div>
                                    {activeRing?.type === 'none' && (
                                        <div className="w-3 h-3 rounded-full bg-blue-500" style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }} />
                                    )}
                                </div>

                                {/* Global Option */}
                                <div
                                    onClick={() => { onSelectRing({ type: 'platform' }); onClose(); }}
                                    className="p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all duration-200"
                                    style={{
                                        background: (!activeRing || activeRing.type === 'platform')
                                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1))'
                                            : 'rgba(255,255,255,0.03)',
                                        border: (!activeRing || activeRing.type === 'platform')
                                            ? '1px solid rgba(59, 130, 246, 0.5)'
                                            : '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: (!activeRing || activeRing.type === 'platform') ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none'
                                    }}
                                >
                                    <div className="w-14 h-14 flex-shrink-0 relative">
                                        <LevelPFPFrame level={platformProgress.currentLevel} size={56} showAnimation={false} profileImageUrl={userProfile?.pfpUrl} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">Global Platform Ring</div>
                                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                            Level {platformProgress.currentLevel} • {platformPrestige > 0 ? `Prestige ${platformPrestige}` : 'Standard'}
                                        </div>
                                    </div>
                                    {(!activeRing || activeRing.type === 'platform') && (
                                        <div className="w-3 h-3 rounded-full bg-blue-500" style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }} />
                                    )}
                                </div>

                                {/* Merchant Options */}
                                {shops.map(shop => {
                                    const progress = calculateLevelProgress(shop.totalPoints, DEFAULT_LOYALTY_CONFIG);
                                    const isActive = activeRing?.type === 'merchant' && activeRing.wallet === shop.merchantWallet;
                                    const pColor = shop.theme?.primaryColor || '#ffffff';
                                    const mArtConfig = merchantArtConfigs[shop.merchantWallet];
                                    const mSeed = mArtConfig ? ((mArtConfig as any).seed || shop.merchantWallet) : shop.merchantWallet;

                                    return (
                                        <div
                                            key={shop.merchantWallet}
                                            onClick={() => { onSelectRing({ type: 'merchant', wallet: shop.merchantWallet }); onClose(); }}
                                            className="relative overflow-hidden p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all duration-200 group"
                                            style={{
                                                background: isActive
                                                    ? `linear-gradient(135deg, ${pColor}22, ${pColor}11)`
                                                    : 'rgba(255,255,255,0.03)',
                                                border: isActive
                                                    ? `1px solid ${pColor}88`
                                                    : '1px solid rgba(255,255,255,0.05)',
                                                boxShadow: isActive ? `0 0 20px ${pColor}22` : 'none'
                                            }}
                                        >
                                            {/* Free-floating Planetary Animation Background */}
                                            {mArtConfig && (
                                                <div
                                                    className="absolute opacity-60 pointer-events-none"
                                                    style={{
                                                        left: -20,
                                                        top: '50%',
                                                        transform: 'translateY(-50%) scale(1.5)',
                                                        mixBlendMode: 'screen'
                                                    }}
                                                >
                                                    <GenerativeArtBadge
                                                        seed={mSeed}
                                                        level={progress.currentLevel}
                                                        size={120}
                                                        showAnimation={true}
                                                        config={{ ...mArtConfig, showOrbits: true, showTrails: true }}
                                                    />
                                                </div>
                                            )}

                                            <div className="w-14 h-14 flex-shrink-0 relative z-10" style={{ marginLeft: 32 }}>
                                                <LevelPFPFrame
                                                    level={progress.currentLevel}
                                                    size={56}
                                                    showAnimation={false}
                                                    profileImageUrl={shop.theme?.brandLogoUrl}
                                                    primaryColor={pColor}
                                                    innerRingColor={shop.theme?.secondaryColor}
                                                />
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <div className="font-bold text-white">{shop.shopName}</div>
                                                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    Level {progress.currentLevel} • {formatPoints(shop.totalPoints)} XP
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div
                                                    className="w-3 h-3 rounded-full relative z-10"
                                                    style={{ backgroundColor: pColor, boxShadow: `0 0 10px ${pColor}` }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default ProfileRingModal;
