import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { createSubscription, getPlan, recordCharge } from "@/lib/subscriptions";
import { getContainer, type BillingEvent } from "@/lib/cosmos";
import type { BillingPeriod } from "@/lib/eip712-subscriptions";
import {
    createThirdwebClient,
    getContract,
    prepareContractCall,
    sendTransaction,
    waitForReceipt,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import {
    BASE_USDC_ADDRESS,
    BASE_USDC_DECIMALS,
    BILLING_PERIODS,
} from "@/lib/eip712-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/create
 *
 * Universal subscription creation using ERC-20 Approve + TransferFrom.
 *
 * The customer has already approved the platform wallet to spend their USDC
 * via an on-chain approve() transaction on the frontend. This endpoint:
 * 1. Records the subscription
 * 2. Executes the first charge via USDC.transferFrom()
 *
 * Body: {
 *   planId,
 *   customerWallet,
 *   approvalTxHash,         // on-chain USDC.approve() tx hash
 *   approvedSpender,        // platform wallet address
 *   approvedAllowance,      // total USDC approved (as string)
 *   periodSeconds,          // billing period in seconds
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

        const approvalTxHash = String(body.approvalTxHash || "").trim();
        const approvedSpender = String(body.approvedSpender || "").toLowerCase().trim();
        const approvedAllowance = String(body.approvedAllowance || "0");
        const periodSeconds = Number(body.periodSeconds) || BILLING_PERIODS[plan.period];

        if (!approvalTxHash || !approvalTxHash.startsWith("0x")) {
            return NextResponse.json(
                { error: "approval_required", message: "USDC approval transaction hash required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Create the subscription record
        const subscription = await createSubscription({
            planId: plan.planId,
            merchantWallet: plan.merchantWallet,
            customerWallet,
            priceUsd: plan.priceUsd,
            period: plan.period,
            // Store ERC-20 approval data instead of SpendPermission data
            permissionSignature: approvalTxHash, // repurpose field for approval tx hash
            permissionData: {
                account: customerWallet,
                spender: approvedSpender,
                token: BASE_USDC_ADDRESS.toLowerCase(),
                allowance: approvedAllowance,
                period: periodSeconds,
                start: Math.floor(Date.now() / 1000),
                end: Math.floor(Date.now() / 1000) + (12 * 30 * 24 * 60 * 60), // 12 months
                salt: "0",
                extraData: "0x",
            },
        });

        // ─── Immediate First Charge via USDC.transferFrom() ─────────────────
        // The customer already approved our platform wallet to spend USDC.
        // Now we call transferFrom to pull the first payment.
        let firstChargeResult: {
            success: boolean;
            transactionHash?: string;
            error?: string;
        } = { success: false };

        const secretKey = process.env.THIRDWEB_SECRET_KEY;
        const adminPrivateKey = process.env.THIRDWEB_ADMIN_PRIVATE_KEY;

        if (secretKey && adminPrivateKey) {
            try {
                const client = createThirdwebClient({ secretKey });

                const pk = adminPrivateKey.startsWith("0x") ? adminPrivateKey : `0x${adminPrivateKey}`;
                const adminAccount = privateKeyToAccount({
                    client,
                    privateKey: pk as `0x${string}`,
                });

                const usdcContract = getContract({
                    client,
                    address: BASE_USDC_ADDRESS,
                    chain: base,
                });

                const chargeAmountWei = BigInt(
                    Math.round(plan.priceUsd * 10 ** BASE_USDC_DECIMALS)
                );

                // The platform wallet is both the approved spender AND the recipient
                const platformWallet = adminAccount.address as `0x${string}`;

                console.log(`[subscriptions/create] Executing first charge:`, {
                    from: customerWallet,
                    to: platformWallet,
                    amount: chargeAmountWei.toString(),
                    amountUsd: plan.priceUsd,
                });

                // Execute USDC.transferFrom(customer, platformWallet, amount)
                const transferFromTx = prepareContractCall({
                    contract: usdcContract,
                    method: {
                        type: "function",
                        name: "transferFrom",
                        inputs: [
                            { name: "from", type: "address" },
                            { name: "to", type: "address" },
                            { name: "value", type: "uint256" },
                        ],
                        outputs: [{ name: "", type: "bool" }],
                        stateMutability: "nonpayable",
                    },
                    params: [
                        customerWallet as `0x${string}`,
                        platformWallet,
                        chargeAmountWei,
                    ],
                });

                const txResult = await sendTransaction({
                    account: adminAccount,
                    transaction: transferFromTx,
                });
                const txReceipt = await waitForReceipt({
                    ...txResult,
                    client,
                    chain: base,
                });

                // Record the successful charge
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
                    txHash: txReceipt?.transactionHash || undefined,
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
                    transactionHash: txReceipt?.transactionHash,
                };

                console.log(
                    `[subscriptions/create] First charge successful for ${subscription.subscriptionId}: ${txReceipt?.transactionHash}`
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
            console.warn("[subscriptions/create] THIRDWEB_SECRET_KEY or THIRDWEB_ADMIN_PRIVATE_KEY not configured, skipping first charge");
            firstChargeResult = { success: false, error: "wallet_not_configured" };
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
