import { NextRequest, NextResponse } from "next/server";
import {
    createThirdwebClient,
    getContract,
    prepareContractCall,
    Engine,
} from "thirdweb";
import { base } from "thirdweb/chains";
import { getContainer, type BillingEvent } from "@/lib/cosmos";
import { getSubscription, recordCharge, markPastDue } from "@/lib/subscriptions";
import {
    SPEND_PERMISSION_MANAGER_ADDRESS,
    SPEND_PERMISSION_MANAGER_ABI,
    BASE_USDC_DECIMALS,
} from "@/lib/eip712-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/charge
 *
 * Execute a single subscription charge via Thirdweb Engine SDK.
 * Calls SpendPermissionManager.spend() to transfer USDC from customer → merchant.
 *
 * Body: { subscriptionId }
 * Auth: requires CRON_SECRET or admin wallet
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const body = await req.json().catch(() => ({}));

        // Auth: CRON_SECRET header or admin
        const cronSecret = req.headers.get("x-cron-secret") || body.cronSecret;
        const envSecret = process.env.CRON_SECRET;
        if (!envSecret || cronSecret !== envSecret) {
            return NextResponse.json(
                { error: "unauthorized", message: "Valid CRON_SECRET required" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const subscriptionId = String(body.subscriptionId || "").trim();
        if (!subscriptionId) {
            return NextResponse.json(
                { error: "subscription_id_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const sub = await getSubscription(subscriptionId);
        if (!sub || sub.status !== "active") {
            return NextResponse.json(
                { error: "subscription_not_active" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Check if it's time to charge
        if (sub.nextChargeAt > Date.now()) {
            return NextResponse.json(
                { error: "not_due", nextChargeAt: sub.nextChargeAt },
                { status: 200, headers: { "x-correlation-id": correlationId } }
            );
        }

        // ─── Thirdweb Engine SDK Setup ──────────────────────────────────────
        const secretKey = process.env.THIRDWEB_SECRET_KEY;
        const serverWalletAddress = process.env.THIRDWEB_ENGINE_WALLET;

        if (!secretKey || !serverWalletAddress) {
            console.error("[charge] THIRDWEB_SECRET_KEY or THIRDWEB_ENGINE_WALLET not configured");
            return NextResponse.json(
                { error: "engine_not_configured" },
                { status: 500, headers: { "x-correlation-id": correlationId } }
            );
        }

        const client = createThirdwebClient({ secretKey });

        const serverWallet = Engine.serverWallet({
            client,
            address: serverWalletAddress,
        });

        const spendManagerContract = getContract({
            client,
            address: SPEND_PERMISSION_MANAGER_ADDRESS,
            chain: base,
        });

        // Amount in USDC wei
        const chargeAmountWei = BigInt(
            Math.round(sub.priceUsd * 10 ** BASE_USDC_DECIMALS)
        );

        // Build the spend permission tuple
        const pd = sub.permissionData;
        const spendPermissionTuple = {
            account: pd.account,
            spender: pd.spender,
            token: pd.token,
            allowance: BigInt(pd.allowance),
            period: BigInt(pd.period),
            start: BigInt(pd.start),
            end: BigInt(pd.end),
            salt: BigInt(pd.salt),
            extraData: pd.extraData as `0x${string}`,
        };

        try {
            // Step 1: Approve the spend permission on-chain (idempotent)
            const approveTx = prepareContractCall({
                contract: spendManagerContract,
                method: {
                    type: "function",
                    name: "approveWithSignature",
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
                    stateMutability: "nonpayable",
                },
                params: [spendPermissionTuple, sub.permissionSignature as `0x${string}`],
            });

            const { transactionId: approveTxId } = await serverWallet.enqueueTransaction({
                transaction: approveTx,
            });
            // Wait for approval to land on-chain
            await Engine.waitForTransactionHash({ client, transactionId: approveTxId });

            // Step 2: Execute the spend (transfer USDC from customer to spender/merchant)
            const spendTx = prepareContractCall({
                contract: spendManagerContract,
                method: {
                    type: "function",
                    name: "spend",
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
                    stateMutability: "nonpayable",
                },
                params: [spendPermissionTuple, chargeAmountWei],
            });

            const { transactionId: spendTxId } = await serverWallet.enqueueTransaction({
                transaction: spendTx,
            });
            const txHash = await Engine.waitForTransactionHash({
                client,
                transactionId: spendTxId,
            });

            // Record successful charge
            const updated = await recordCharge(subscriptionId, sub.priceUsd);

            // Create billing event
            const platformFeePct = 0.5;
            const platformFeeUsd = sub.priceUsd * (platformFeePct / 100);
            const portalFeeRecipient = String(
                process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || ""
            ).toLowerCase();

            const billingEvent: BillingEvent = {
                id: `billing|sub_charge|${subscriptionId}|${Date.now()}`,
                type: "purchase",
                wallet: sub.customerWallet,
                seconds: 0,
                usd: sub.priceUsd,
                txHash: txHash?.transactionHash || undefined,
                recipient: sub.merchantWallet,
                receiptId: `sub_${subscriptionId}_${sub.chargeCount + 1}`,
                portalFeeUsd: platformFeeUsd,
                portalFeePct: platformFeePct,
                portalFeeRecipient: portalFeeRecipient || undefined,
                ts: Date.now(),
            };

            const container = await getContainer();
            await container.items.upsert(billingEvent, { disableAutomaticIdGeneration: true });

            return NextResponse.json(
                {
                    success: true,
                    subscriptionId,
                    chargeAmountUsd: sub.priceUsd,
                    transactionHash: txHash?.transactionHash,
                    nextChargeAt: updated?.nextChargeAt,
                    chargeCount: updated?.chargeCount,
                },
                { headers: { "x-correlation-id": correlationId } }
            );
        } catch (engineErr: any) {
            console.error("[charge] Engine SDK call failed:", engineErr);
            await markPastDue(subscriptionId);
            return NextResponse.json(
                {
                    error: "charge_failed",
                    message: engineErr?.message || "Thirdweb Engine call failed",
                    subscriptionId,
                },
                { status: 502, headers: { "x-correlation-id": correlationId } }
            );
        }
    } catch (err: any) {
        console.error("[subscriptions/charge] POST error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
