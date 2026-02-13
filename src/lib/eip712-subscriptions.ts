/**
 * EIP-712 Typed Data for Coinbase Spend Permission Manager on Base.
 *
 * The SpendPermissionManager contract at 0xf85210B21cC50302F477BA56686d2019dC9b67Ad
 * allows customer wallets to grant recurring spend permissions to a spender
 * (our Thirdweb Engine backend wallet). Customers sign a SpendPermission struct
 * typed with this domain and types, then we call `approveWithSignature()` on-chain
 * followed by `spend()` on each billing cycle.
 *
 * See: https://docs.cdp.coinbase.com/wallet-sdk/docs/spend-permissions
 */

/** Canonical contract address on Base mainnet (chain 8453) */
export const SPEND_PERMISSION_MANAGER_ADDRESS =
    "0xf85210B21cC50302F477BA56686d2019dC9b67Ad" as const;

/** USDC on Base mainnet */
export const BASE_USDC_ADDRESS =
    (process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`;
export const BASE_USDC_DECIMALS = 6;

/** Base chain ID */
export const BASE_CHAIN_ID = 8453;

/**
 * EIP-712 Domain for the SpendPermissionManager contract.
 */
export const spendPermissionDomain = {
    name: "Spend Permission Manager",
    version: "1",
    chainId: BASE_CHAIN_ID,
    verifyingContract: SPEND_PERMISSION_MANAGER_ADDRESS,
} as const;

/**
 * EIP-712 types matching the SpendPermission struct in the contract.
 *
 * struct SpendPermission {
 *   address account;      // customer wallet granting permission
 *   address spender;      // our backend wallet
 *   address token;        // ERC-20 token (USDC)
 *   uint160 allowance;    // max spend per period (in token wei)
 *   uint48  period;       // billing cycle in seconds (e.g. 2592000 for 30 days)
 *   uint48  start;        // unix timestamp when permission starts
 *   uint48  end;          // unix timestamp when permission expires
 *   uint256 salt;         // uniqueness nonce
 *   bytes   extraData;    // optional extra data (empty for basic subscriptions)
 * }
 */
export const spendPermissionTypes = {
    SpendPermission: [
        { name: "account", type: "address" },
        { name: "spender", type: "address" },
        { name: "token", type: "address" },
        { name: "allowance", type: "uint160" },
        { name: "period", type: "uint48" },
        { name: "start", type: "uint48" },
        { name: "end", type: "uint48" },
        { name: "salt", type: "uint256" },
        { name: "extraData", type: "bytes" },
    ],
} as const;

/**
 * SpendPermission message type for building EIP-712 payloads.
 */
export type SpendPermissionMessage = {
    account: `0x${string}`;    // customer wallet
    spender: `0x${string}`;    // our backend wallet
    token: `0x${string}`;      // USDC address
    allowance: bigint;          // max spend per period in wei (USDC uses 6 decimals)
    period: number;             // billing cycle in seconds
    start: number;              // unix timestamp
    end: number;                // unix timestamp
    salt: bigint;               // uniqueness nonce
    extraData: `0x${string}`;  // empty bytes = "0x"
};

/** Standard billing periods in seconds */
export const BILLING_PERIODS = {
    WEEKLY: 7 * 24 * 60 * 60,        // 604800
    BIWEEKLY: 14 * 24 * 60 * 60,     // 1209600
    MONTHLY: 30 * 24 * 60 * 60,      // 2592000
    QUARTERLY: 90 * 24 * 60 * 60,    // 7776000
    YEARLY: 365 * 24 * 60 * 60,      // 31536000
} as const;

export type BillingPeriod = keyof typeof BILLING_PERIODS;

/**
 * Build a SpendPermission message for a subscription plan.
 *
 * @param account   Customer wallet address
 * @param spender   Backend wallet address (Thirdweb Engine)
 * @param priceUsd  Plan price in USD (converted to USDC at 1:1)
 * @param period    Billing period key (MONTHLY, WEEKLY, etc.)
 * @param durationMonths  How many months the permission is valid (default: 12)
 */
export function buildSpendPermission(params: {
    account: `0x${string}`;
    spender: `0x${string}`;
    priceUsd: number;
    period: BillingPeriod;
    durationMonths?: number;
}): SpendPermissionMessage {
    const { account, spender, priceUsd, period } = params;
    const durationMonths = params.durationMonths ?? 12;

    // USDC has 6 decimals: $20.00 → 20_000_000
    const allowance = BigInt(Math.round(priceUsd * 10 ** BASE_USDC_DECIMALS));
    const periodSeconds = BILLING_PERIODS[period];

    const now = Math.floor(Date.now() / 1000);
    const end = now + durationMonths * 30 * 24 * 60 * 60;

    // salt = keccak-style unique: timestamp + random
    const salt = BigInt(now) * BigInt(1_000_000) + BigInt(Math.floor(Math.random() * 1_000_000));

    return {
        account,
        spender,
        token: BASE_USDC_ADDRESS,
        allowance,
        period: periodSeconds,
        start: now,
        end,
        salt,
        extraData: "0x" as `0x${string}`,
    };
}

/**
 * ABI for the SpendPermissionManager contract — only the functions we call.
 */
export const SPEND_PERMISSION_MANAGER_ABI = [
    {
        name: "approveWithSignature",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "spendPermission",
                type: "tuple",
                components: [
                    { name: "account", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "token", type: "address" },
                    { name: "allowance", type: "uint160" },
                    { name: "period", type: "uint48" },
                    { name: "start", type: "uint48" },
                    { name: "end", type: "uint48" },
                    { name: "salt", type: "uint256" },
                    { name: "extraData", type: "bytes" },
                ],
            },
            { name: "signature", type: "bytes" },
        ],
        outputs: [],
    },
    {
        name: "spend",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "spendPermission",
                type: "tuple",
                components: [
                    { name: "account", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "token", type: "address" },
                    { name: "allowance", type: "uint160" },
                    { name: "period", type: "uint48" },
                    { name: "start", type: "uint48" },
                    { name: "end", type: "uint48" },
                    { name: "salt", type: "uint256" },
                    { name: "extraData", type: "bytes" },
                ],
            },
            { name: "value", type: "uint160" },
        ],
        outputs: [],
    },
    {
        name: "getSpendPermissionHash",
        type: "function",
        stateMutability: "view",
        inputs: [
            {
                name: "spendPermission",
                type: "tuple",
                components: [
                    { name: "account", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "token", type: "address" },
                    { name: "allowance", type: "uint160" },
                    { name: "period", type: "uint48" },
                    { name: "start", type: "uint48" },
                    { name: "end", type: "uint48" },
                    { name: "salt", type: "uint256" },
                    { name: "extraData", type: "bytes" },
                ],
            },
        ],
        outputs: [{ name: "", type: "bytes32" }],
    },
] as const;
