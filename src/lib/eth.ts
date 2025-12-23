export async function fetchEthUsd(): Promise<number> {
	try {
		const resp = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=ETH", { cache: "no-store" });
		const json = await resp.json();
		const rate = Number(json?.data?.rates?.USD || "0");
		return rate > 0 ? rate : 0;
	} catch {
		return 0;
	}
}

export function usdToEth(usd: number, ethUsd: number): number {
	if (!ethUsd || ethUsd <= 0) return 0;
	return usd / ethUsd;
}

export type EthRates = Record<string, number>;

export async function fetchEthRates(): Promise<EthRates> {
    try {
        const resp = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=ETH", { cache: "no-store" });
        const json = await resp.json();
        const ratesObj = json?.data?.rates || {};
        const out: EthRates = {};
        for (const k in ratesObj) {
            const v = Number(ratesObj[k]);
            if (v && isFinite(v)) out[k.toUpperCase()] = v;
        }
        return out;
    } catch {
        return {};
    }
}

/**
 * Direct USD-base fiat rates from Coinbase (target per 1 USD).
 * Using this alongside ETH-base rates helps reduce drift vs widget conversions.
 */
export async function fetchUsdRates(): Promise<Record<string, number>> {
    try {
        const resp = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD", { cache: "no-store" });
        const json = await resp.json();
        const ratesObj = json?.data?.rates || {};
        const out: Record<string, number> = {};
        for (const k in ratesObj) {
            const v = Number(ratesObj[k]);
            if (v && isFinite(v)) out[k.toUpperCase()] = v;
        }
        return out;
    } catch {
        return {};
    }
}

export async function fetchBtcUsd(): Promise<number> {
    try {
        const resp = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=BTC", { cache: "no-store" });
        const json = await resp.json();
        const rate = Number(json?.data?.rates?.USD || "0");
        return rate > 0 ? rate : 0;
    } catch {
        return 0;
    }
}

export async function fetchXrpUsd(): Promise<number> {
    try {
        const resp = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=XRP", { cache: "no-store" });
        const json = await resp.json();
        const rate = Number(json?.data?.rates?.USD || "0");
        return rate > 0 ? rate : 0;
    } catch {
        return 0;
    }
}

export async function fetchSolUsd(): Promise<number> {
    try {
        const resp = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=SOL", { cache: "no-store" });
        const json = await resp.json();
        const rate = Number(json?.data?.rates?.USD || "0");
        return rate > 0 ? rate : 0;
    } catch {
        return 0;
    }
}
