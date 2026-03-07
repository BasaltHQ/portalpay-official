import { NextRequest, NextResponse } from "next/server";
import {
    createThirdwebClient,
    getContract,
    prepareContractCall,
    sendTransaction,
    waitForReceipt,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { getContainer, type BillingEvent } from "@/lib/cosmos";
import { getSubscription, recordCharge, markPastDue } from "@/lib/subscriptions";
import {
    BASE_USDC_ADDRESS,
    BASE_USDC_DECIMALS,
} from "@/lib/eip712-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/charge
 *
 * Execute a recurring subscription charge via USDC.transferFrom().
 * The customer's one-time ERC-20 approve() grants the platform wallet
 * permission to pull USDC for each billing cycle.
 *
 * Body: { subscriptionId }
 * Auth: requires CRON_SECRET
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const body = await req.json().catch(() => ({}));

        // Auth: CRON_SECRET header or body
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

        // Check if the permission/approval window has expired
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (sub.permissionData.end && nowSeconds >= sub.permissionData.end) {
            await markPastDue(subscriptionId);
            const container = await getContainer();
            await container.items.upsert(
                { ...sub, status: "expired" as const, updatedAt: Date.now() },
                { disableAutomaticIdGeneration: true }
            );
            return NextResponse.json(
                { error: "approval_expired", message: "USDC approval period has expired", subscriptionId },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // ─── Setup ──────────────────────────────────────────────────────────
        const secretKey = process.env.THIRDWEB_SECRET_KEY;
        const adminPrivateKey = process.env.THIRDWEB_ADMIN_PRIVATE_KEY;

        if (!secretKey) {
            console.error("[charge] THIRDWEB_SECRET_KEY not configured");
            return NextResponse.json(
                { error: "wallet_not_configured" },
                { status: 500, headers: { "x-correlation-id": correlationId } }
            );
        }

        if (!adminPrivateKey) {
            console.error("[charge] THIRDWEB_ADMIN_PRIVATE_KEY not configured");
            return NextResponse.json(
                { error: "wallet_not_configured" },
                { status: 500, headers: { "x-correlation-id": correlationId } }
            );
        }

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
            Math.round(sub.priceUsd * 10 ** BASE_USDC_DECIMALS)
        );

        const platformWallet = adminAccount.address as `0x${string}`;

        try {
            console.log(`[charge] Executing recurring charge for ${subscriptionId}:`, {
                from: sub.customerWallet,
                to: platformWallet,
                amount: chargeAmountWei.toString(),
                amountUsd: sub.priceUsd,
                chargeNumber: sub.chargeCount + 1,
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
                    sub.customerWallet as `0x${string}`,
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
                txHash: txReceipt?.transactionHash || undefined,
                recipient: sub.merchantWallet,
                receiptId: `sub_${subscriptionId}_${sub.chargeCount + 1}`,
                portalFeeUsd: platformFeeUsd,
                portalFeePct: platformFeePct,
                portalFeeRecipient: portalFeeRecipient || undefined,
                ts: Date.now(),
            };

            const container = await getContainer();
            await container.items.upsert(billingEvent, { disableAutomaticIdGeneration: true });

            console.log(`[charge] Charge successful for ${subscriptionId}: ${txReceipt?.transactionHash}`);

            return NextResponse.json(
                {
                    success: true,
                    subscriptionId,
                    chargeAmountUsd: sub.priceUsd,
                    transactionHash: txReceipt?.transactionHash,
                    nextChargeAt: updated?.nextChargeAt,
                    chargeCount: updated?.chargeCount,
                },
                { headers: { "x-correlation-id": correlationId } }
            );
        } catch (chargeErr: any) {
            console.error("[charge] transferFrom failed:", chargeErr);
            await markPastDue(subscriptionId);
            return NextResponse.json(
                {
                    error: "charge_failed",
                    message: chargeErr?.message || "USDC transferFrom failed",
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
