export type PricingBreakdown = {
	usdPerMillionInput: number;
	usdPerMillionOutput: number;
	usdPerMillionCachedInput: number;
};

// From user-provided image/terminal (gpt-realtime)
export const REALTIME_PRICING: PricingBreakdown = {
	usdPerMillionInput: 32,
	usdPerMillionOutput: 64,
	usdPerMillionCachedInput: 0.40,
};

export const DEFAULT_MARKUP_PERCENT = 500; // 500% markup => 6x of base cost

export type UsageMix = {
	inputTokens: number; // tokens/month
	outputTokens: number; // tokens/month
	cachedInputTokens?: number; // tokens/month cached hits if any
};

export function computeUsdPerMonth(
	usage: UsageMix,
	pricing: PricingBreakdown = REALTIME_PRICING,
	markupPercent: number = DEFAULT_MARKUP_PERCENT,
) {
	const inputUsdBase = (usage.inputTokens / 1_000_000) * pricing.usdPerMillionInput;
	const outputUsdBase = (usage.outputTokens / 1_000_000) * pricing.usdPerMillionOutput;
	const cachedUsdBase = ((usage.cachedInputTokens || 0) / 1_000_000) * pricing.usdPerMillionCachedInput;
	const totalUsdBase = inputUsdBase + outputUsdBase + cachedUsdBase;
	const factor = 1 + Math.max(0, markupPercent) / 100; // e.g., 500% => 6x
	const totalUsd = totalUsdBase * factor;
	return {
		inputUsdBase,
		outputUsdBase,
		cachedUsdBase,
		totalUsdBase,
		markupPercent,
		factor,
		totalUsd,
	};
}

export function formatUsd(n: number) { return `$${n.toFixed(2)}`; }
