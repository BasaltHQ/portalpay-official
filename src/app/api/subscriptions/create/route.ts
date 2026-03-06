import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { createSubscription, getPlan, recordCharge, markPastDue } from "@/lib/subscriptions";
import { getContainer, type BillingEvent } from "@/lib/cosmos";
import type { BillingPeriod } from "@/lib/eip712-subscriptions";
import {
    createThirdwebClient,
    getContract,
    prepareContractCall,
    Engine,
} from "thirdweb";
import { base } from "thirdweb/chains";
import {
    SPEND_PERMISSION_MANAGER_ADDRESS,
    BASE_USDC_DECIMALS,
} from "@/lib/eip712-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/create
 *
 * Customer subscribes to a merchant's plan.
 * After the customer signs the EIP-712 SpendPermission on the client side,
 * the frontend sends the signature + permission data here to store the subscription
 * and execute the first charge immediately.
 *
 * Body: {
 *   planId,
 *   customerWallet,
 *   permissionSignature,   // "0x..." EIP-712 signature
 *   permissionData: {      // the signed SpendPermission struct
 *     account, spender, token, allowance, period, start, end, salt, extraData
 *   }
 * }
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const body = await req.json().catch(() => ({}));
        const authed = await getAuthenticatedWallet(req);
        const customerWallet = (
            authed ||
            String(body.customerWallet || "").toLowerCase() ||
            String(req.headers.get("x-wallet") || "").toLowerCase()
        ).toLowerCase();

        if (!customerWallet || !/^0x[a-f0-9]{40}$/i.test(customerWallet)) {
            return NextResponse.json(
                { error: "unauthorized", message: "Customer wallet required" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const planId = String(body.planId || "").trim();
        if (!planId) {
            return NextResponse.json(
                { error: "plan_id_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Validate plan exists and is active
        const plan = await getPlan(planId);
        if (!plan || !plan.active) {
            return NextResponse.json(
                { error: "plan_not_found", message: "Plan does not exist or is inactive" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        const sig = String(body.permissionSignature || "").trim();
        if (!sig || !sig.startsWith("0x")) {
            return NextResponse.json(
                { error: "signature_required", message: "EIP-712 permissionSignature required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const pd = body.permissionData;
        if (
            !pd ||
            !pd.account ||
            !pd.spender ||
            !pd.token ||
            !pd.allowance ||
            !pd.period ||
            !pd.start ||
            !pd.end
        ) {
            return NextResponse.json(
                { error: "permission_data_required", message: "Full permissionData struct required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Ensure customer wallet matches the signed permission account
        if (String(pd.account || "").toLowerCase() !== customerWallet) {
            return NextResponse.json(
                { error: "wallet_mismatch", message: "permissionData.account must match customerWallet" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const subscription = await createSubscription({
            planId: plan.planId,
            merchantWallet: plan.merchantWallet,
            customerWallet,
            priceUsd: plan.priceUsd,
            period: plan.period,
            permissionSignature: sig,
            permissionData: {
                account: String(pd.account).toLowerCase(),
                spender: String(pd.spender).toLowerCase(),
                token: String(pd.token).toLowerCase(),
                allowance: String(pd.allowance),
                period: Number(pd.period),
                start: Number(pd.start),
                end: Number(pd.end),
                salt: String(pd.salt || "0"),
                extraData: String(pd.extraData || "0x"),
            },
        });

        // ─── Immediate First Charge ─────────────────────────────────────────
        // Execute the first charge right now so the customer pays on subscribe.
        // If the charge fails, the subscription is still created (cron can retry).
        let firstChargeResult: {
            success: boolean;
            transactionHash?: string;
            error?: string;
        } = { success: false };

        const secretKey = process.env.THIRDWEB_SECRET_KEY;
        const serverWalletAddress = process.env.THIRDWEB_ENGINE_WALLET;

        if (secretKey && serverWalletAddress) {
            try {
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

                const chargeAmountWei = BigInt(
                    Math.round(plan.priceUsd * 10 ** BASE_USDC_DECIMALS)
                );

                const spendPermissionTuple = {
                    account: subscription.permissionData.account,
                    spender: subscription.permissionData.spender,
                    token: subscription.permissionData.token,
                    allowance: BigInt(subscription.permissionData.allowance),
                    period: Number(subscription.permissionData.period),
                    start: Number(subscription.permissionData.start),
                    end: Number(subscription.permissionData.end),
                    salt: BigInt(subscription.permissionData.salt),
                    extraData: subscription.permissionData.extraData as `0x${string}`,
                };

                // Step 1: Approve the spend permission on-chain
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
                    params: [spendPermissionTuple, subscription.permissionSignature as `0x${string}`],
                });

                const { transactionId: approveTxId } = await serverWallet.enqueueTransaction({
                    transaction: approveTx,
                });
                await Engine.waitForTransactionHash({ client, transactionId: approveTxId });

                // Step 2: Execute the spend (transfer USDC from customer)
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

                // Record the successful charge (updates nextChargeAt to now + period)
                await recordCharge(subscription.subscriptionId, plan.priceUsd);

                // Create billing event
                const platformFeePct = 0.5;
                const platformFeeUsd = plan.priceUsd * (platformFeePct / 100);
                const portalFeeRecipient = String(
                    process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || ""
                ).toLowerCase();

                const billingEvent: BillingEvent = {
                    id: `billing|sub_charge|${subscription.subscriptionId}|${Date.now()}`,
                    type: "purchase",
                    wallet: customerWallet,
                    seconds: 0,
                    usd: plan.priceUsd,
                    txHash: txHash?.transactionHash || undefined,
                    recipient: plan.merchantWallet,
                    receiptId: `sub_${subscription.subscriptionId}_1`,
                    portalFeeUsd: platformFeeUsd,
                    portalFeePct: platformFeePct,
                    portalFeeRecipient: portalFeeRecipient || undefined,
                    ts: Date.now(),
                };

                const container = await getContainer();
                await container.items.upsert(billingEvent, { disableAutomaticIdGeneration: true });

                firstChargeResult = {
                    success: true,
                    transactionHash: txHash?.transactionHash,
                };

                console.log(
                    `[subscriptions/create] First charge successful for ${subscription.subscriptionId}: ${txHash?.transactionHash}`
                );
            } catch (chargeErr: any) {
                console.error(
                    `[subscriptions/create] First charge failed for ${subscription.subscriptionId}:`,
                    chargeErr
                );
                firstChargeResult = {
                    success: false,
                    error: chargeErr?.message || "Initial charge failed",
                };
                // Subscription is still created — cron will retry the charge
            }
        } else {
            console.warn("[subscriptions/create] Engine not configured, skipping first charge");
            firstChargeResult = { success: false, error: "engine_not_configured" };
        }

        return NextResponse.json(
            {
                success: true,
                subscription,
                firstCharge: firstChargeResult,
            },
            { status: 201, headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/create] POST error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}

