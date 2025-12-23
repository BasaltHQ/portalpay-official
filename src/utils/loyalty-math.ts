
import { SolarSystemConfig } from "@/components/GenerativeArtBadge";

export type LoyaltyConfig = {
    xpPerDollar: number;
    baseXP: number;      // XP needed for Level 2 (from Level 1)
    multiplier: number;  // Difficulty scaling factor (e.g., 1.15 = 15% harder each level)
    maxLevel: number;
    maxPrestige: number;
    prestigeEnabled?: boolean;
    coolDownMinutes?: number;
    art?: SolarSystemConfig; // Optional generative art configuration
};

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
    xpPerDollar: 1,
    baseXP: 100,
    multiplier: 1.11, // Verified: Matches ~150k XP at Level 50
    maxLevel: 50,
    maxPrestige: 10,
    prestigeEnabled: true,
    coolDownMinutes: 0
};

export type LevelProgress = {
    currentLevel: number;
    currentXP: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
    totalXP: number;
    prestige: number;
};

export type Role = {
    id: string;
    name: string;
    minLevel: number;
    color: string;
    icon: string;
};

export function calculateTotalXPForLevel(level: number, config: LoyaltyConfig): number {
    if (level <= 1) return 0;
    // Exponential curve: Total XP = Base * ((Multiplier^(Level-1)) - 1) / (Multiplier - 1)
    // Geometric series sum
    const geometricSum = (Math.pow(config.multiplier, level - 1) - 1) / (config.multiplier - 1);
    return Math.floor(config.baseXP * geometricSum);
}

export function calculateLevelFromXP(totalXP: number, config: LoyaltyConfig): number {
    if (totalXP <= 0) return 1;
    // Inverse of calculateTotalXPForLevel
    // XP = Base * ((M^(L-1)) - 1) / (M - 1)
    // XP * (M - 1) / Base = M^(L-1) - 1
    // (XP * (M - 1) / Base) + 1 = M^(L-1)
    // log_M(...) = L - 1
    // L = log_M(...) + 1

    // Safety for small/linear multipliers close to 1
    if (config.multiplier <= 1.01) {
        // Linear approximation if multiplier is very small
        return Math.floor(totalXP / config.baseXP) + 1;
    }

    const term = (totalXP * (config.multiplier - 1) / config.baseXP) + 1;
    const level = Math.floor(Math.log(term) / Math.log(config.multiplier)) + 1;

    // Cap at max level
    return Math.min(level, config.maxLevel);
}

export function calculateLevelProgress(totalXP: number, config: LoyaltyConfig): LevelProgress {
    let currentLevel = calculateLevelFromXP(totalXP, config);
    let prestige = 0;

    // Handle Prestige
    if (config.prestigeEnabled) {
        // Calculate max XP for one full run (level 1 to maxLevel)
        const maxLevelXP = calculateTotalXPForLevel(config.maxLevel, config);

        // If current XP exceeds one run
        if (totalXP >= maxLevelXP) {
            prestige = Math.floor(totalXP / maxLevelXP);

            // Cap prestige
            if (prestige > config.maxPrestige) prestige = config.maxPrestige;

            // Adjust XP for current run visualization
            // But wait, "Total XP" should be cumulative.
            // For calculating current level within the prestige tier:
            const xpInCurrentTier = totalXP - (prestige * maxLevelXP);

            // Recalculate level based on XP within this tier
            currentLevel = calculateLevelFromXP(xpInCurrentTier, config);
        }
    }

    const startXP = calculateTotalXPForLevel(currentLevel, config);
    const endXP = calculateTotalXPForLevel(currentLevel + 1, config);

    // XP gained towards next level
    // Need to handle prestige XP offset if we want "current run" XP
    const maxLevelXP = calculateTotalXPForLevel(config.maxLevel, config);
    const xpInCurrentTier = config.prestigeEnabled ? totalXP % maxLevelXP : totalXP;

    // If at max level of max prestige?
    if (currentLevel >= config.maxLevel && prestige >= config.maxPrestige) {
        return {
            currentLevel,
            currentXP: xpInCurrentTier,
            xpForCurrentLevel: startXP,
            xpForNextLevel: startXP, // Cap
            progressPercent: 100,
            totalXP,
            prestige
        };
    }

    const progressPercent = Math.min(100, Math.max(0, ((xpInCurrentTier - startXP) / (endXP - startXP)) * 100));

    return {
        currentLevel,
        currentXP: xpInCurrentTier,
        xpForCurrentLevel: startXP,
        xpForNextLevel: endXP,
        progressPercent,
        totalXP,
        prestige
    };
}

export function simulateProjections(spendAmount: number, frequencyPerMonth: number, months: number, config: LoyaltyConfig) {
    // Estimate XP over time
    const totalVisits = frequencyPerMonth * months;
    const xpPerVisit = spendAmount * config.xpPerDollar;
    const totalXP = xpPerVisit * totalVisits;
    const projectedLevel = calculateLevelFromXP(totalXP, config);
    return { totalXP, projectedLevel };
}

export function calculateRecommendedConfig(avgSpend: number, targetVisitsForMaxLevel: number) {
    // Reverse engineer sensible defaults
    // This is hard to do analytically perfect, so we return heuristics
    // Aim for Max Level in X visits
    return {
        ...DEFAULT_LOYALTY_CONFIG,
        // Adjust baseXP or multiplier?
    };
}
