import { chain as defaultChain } from "@/lib/thirdweb/server";

export type V4PoolKey = {
    currency0: `0x${string}`;
    currency1: `0x${string}`;
    fee: number;
    tickSpacing: number;
    hooks: `0x${string}`;
};

export type V4Config = {
    chainId: number;
    router?: `0x${string}`;
    poolManager?: `0x${string}`;
    weth?: `0x${string}`;
    defaultHook?: `0x${string}`;
    configured: boolean;
};

export function getV4Config(chain = defaultChain): V4Config {
    const router = process.env.UNISWAP_V4_ROUTER as `0x${string}` | undefined;
    const poolManager = process.env.UNISWAP_V4_POOL_MANAGER as `0x${string}` | undefined;
    // Default to canonical Base WETH if not set
    const weth = (process.env.UNISWAP_V4_WETH || "0x4200000000000000000000000000000000000006") as `0x${string}`;
    const defaultHook = process.env.UNISWAP_V4_DEFAULT_HOOK as `0x${string}` | undefined;
    const configured = Boolean(router && poolManager);
    return {
        chainId: Number((chain as any)?.id || 0),
        router,
        poolManager,
        weth,
        defaultHook,
        configured,
    };
}

export function sortTokens(a: `0x${string}`, b: `0x${string}`): [`0x${string}`, `0x${string}`] {
    return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

export function buildDefaultPoolKey(token: `0x${string}`, weth: `0x${string}`, opts?: { fee?: number; tickSpacing?: number; hook?: `0x${string}` }): V4PoolKey {
    const [currency0, currency1] = sortTokens(token, weth);
    return {
        currency0,
        currency1,
        fee: opts?.fee ?? 3000,
        tickSpacing: opts?.tickSpacing ?? 60,
        hooks: (opts?.hook || (process.env.UNISWAP_V4_DEFAULT_HOOK as `0x${string}`) || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    };
}

export function buildTradeUrlBase(params: { outputToken: string; inputToken?: string; chainId?: number }): string {
    const isBase = (params.chainId || 0) === 8453;
    const chainQuery = isBase ? "base" : "ethereum";
    const input = params.inputToken || "ETH";
    return `https://app.uniswap.org/swap?chain=${chainQuery}&inputCurrency=${input}&outputCurrency=${params.outputToken}`;
}

export type BaseAsset = { id: string; symbol: string; address: `0x${string}` };

export function getBaseAssets(): BaseAsset[] {
    const weth = (process.env.UNISWAP_V4_WETH || "0x4200000000000000000000000000000000000006") as `0x${string}`;
    const usdc = process.env.UNISWAP_V4_USDC || process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS;
    const usdt = process.env.UNISWAP_V4_USDT || process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS;
    const cbbtc = process.env.UNISWAP_V4_CBBTC || process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS;
    const cbxrp = process.env.UNISWAP_V4_CBXRP || process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS;

    const assets: BaseAsset[] = [
        { id: "weth", symbol: "ETH", address: weth },
    ];
    if (usdc) assets.push({ id: "usdc", symbol: "USDC", address: usdc as `0x${string}` });
    if (usdt) assets.push({ id: "usdt", symbol: "USDT", address: usdt as `0x${string}` });
    if (cbbtc) assets.push({ id: "cbbtc", symbol: "cbBTC", address: cbbtc as `0x${string}` });
    if (cbxrp) assets.push({ id: "cbxrp", symbol: "cbXRP", address: cbxrp as `0x${string}` });
    return assets;
}


