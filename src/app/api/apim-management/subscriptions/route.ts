import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { createApiKeyDoc } from "@/lib/apim/keys";
import { ApiKeyPlan } from "@/lib/apim/types";
import { getSubscriptionDocsForWallet, upsertSubscriptionMapping } from "@/lib/subscription-mapping";
import { getContainer } from "@/lib/cosmos";
import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { getBrandKey } from "@/config/brands";

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/apim-management/subscriptions
 * Returns user's APIM subscriptions (from Cosmos mapping + Azure APIM).
 */
import { findApiKeysByWallet } from "@/lib/apim/keys";

export async function GET(req: NextRequest) {
  try {
    const wallet = await getAuthenticatedWallet(req);
    if (!wallet) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Get keys from Cosmos
    const keys = await findApiKeysByWallet(wallet);

    // Transform to "Subscription" view expected by frontend
    const items = keys.map(k => {
      // Calculate expiry if needed (legacy keys might not have it)
      // active keys are active.
      const now = Date.now();
      const createdAt = k.createdAt || now;
      const status = k.isActive ? "active" : "revoked";

      return {
        subscriptionId: k.id,
        wallet: k.ownerWallet,
        scopes: k.scopes,
        status: status,
        createdAt: createdAt,
        expiresAt: 0, // Infinite
        daysRemaining: 1000,
        apimRaw: null, // Legacy field
      };
    });

    return NextResponse.json({ subscriptions: items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}

/**
 * POST /api/apim-management/subscriptions
 * Create a new APIM subscription for authenticated user.
 * Body: { productId: string, displayName?: string, scopes?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const wallet = await getAuthenticatedWallet(req);
    if (!wallet) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId || "").trim();
    if (!productId) {
      return NextResponse.json({ error: "product_id_required" }, { status: 400 });
    }

    // Normalize product ID to prefer brand-suffixed APIM product when present (e.g., portalpay-pro-<brandKey>)
    const brandKey = getBrandKey().toLowerCase();
    let normalizedProductId = productId;
    try {
      // Normalize product ID (preserve brand suffix logic if needed, or simply trust input)
      // For internal system, we map input ID to our plans.
      // e.g. "portalpay-starter" -> plan "starter"
      // "portalpay-starter-brandA" -> plan "starter"

      // Check local validation if needed, for now proceed.
    } catch { }

    const correlationId = crypto.randomUUID();
    // Precompute subscription identifiers for tracking
    const shortWallet = wallet.slice(2, 10);
    const subscriptionId = `${normalizedProductId}-${shortWallet}-${Date.now().toString(36)}`;
    const displayName = String(body.displayName || `${normalizedProductId} for ${wallet}`);
    const scopes = Array.isArray(body.scopes)
      ? body.scopes.map((s: any) => String(s))
      : ["receipts:read", "receipts:write", "orders:create", "inventory:read", "inventory:write"];

    // thirdweb x402 payment enforcement:
    // - Pro and Enterprise require payment and will return 402 until settled
    // - Starter can optionally accept a tip via x402; if declined, proceed
    try {
      const productLower = normalizedProductId.toLowerCase();
      const requirePayment = productLower.includes("pro") || productLower.includes("enterprise");
      const cardConfirmation = req.headers.get("x-portalpay-card-confirmation");

      const ownerWallet = String(process.env.NEXT_PUBLIC_OWNER_WALLET || "").trim();
      const secretKey = String(process.env.THIRDWEB_SECRET_KEY || "");
      const chainId = Number(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 8453);

      // Only attempt x402 if we have the minimum config
      if (ownerWallet && secretKey && chainId) {
        const client = createThirdwebClient({ secretKey });
        const network = defineChain(chainId);

        const thirdwebFacilitator = facilitator({
          client,
          serverWalletAddress: (process.env.THIRDWEB_SERVER_WALLET_ADDRESS || ownerWallet) as `0x${string}`,
          waitUntil: (String(process.env.THIRDWEB_WAIT_UNTIL || "").toLowerCase() === "simulated") ? "simulated" : "confirmed",
        });

        const paymentData = req.headers.get("x-payment");
        const resourceUrl = req.nextUrl.toString();

        // Starter tip card fallback: create receipt and return portal URL when explicitly requested
        const tipReceiptRequested = req.headers.get("x-create-tip-receipt") === "1";
        if (productLower.includes("starter") && tipReceiptRequested && ownerWallet) {
          const receiptId = correlationId;
          const now = Date.now();
          try {
            const container = await getContainer();
            await container.items.upsert({
              id: `receipt:${receiptId}`,
              type: "receipt",
              wallet: ownerWallet,
              receiptId,
              totalUsd: 5,
              currency: "USD",
              lineItems: [{ label: "Tip for PortalPay Starter", priceUsd: 5 }],
              createdAt: now,
              brandName: "PortalPay",
              status: "pending",
              statusHistory: [{ status: "pending", ts: now }],
            } as any);
          } catch { }
          const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "");
          const paymentPortalUrl = appUrl ? `${appUrl}/portal/${receiptId}?recipient=${ownerWallet}&correlationId=${correlationId}` : null;
          try {
            const container = await getContainer();
            await container.items.upsert({
              id: `apim_subscription_tip|${subscriptionId}`,
              type: "apim_subscription_tip",
              productId: normalizedProductId,
              wallet,
              payTo: ownerWallet,
              amountUsd: 5,
              chainId,
              status: "card_fallback_ready",
              correlationId,
              attemptedAt: Date.now(),
            });
          } catch { }
          const responseBody = {
            fallback: paymentPortalUrl
              ? {
                type: "portalpay-card",
                paymentPortalUrl,
                amountUsd: 5,
                productId: normalizedProductId,
                correlationId,
              }
              : undefined,
          };
          return new NextResponse(JSON.stringify(responseBody), {
            status: 402,
            headers: { "x-correlation-id": correlationId } as HeadersInit,
          });
        }

        if (requirePayment && !cardConfirmation) {
          const priceUsd = productLower.includes("enterprise") ? 500 : 399;
          const result = await settlePayment({
            resourceUrl,
            method: "POST",
            paymentData,
            payTo: ownerWallet as `0x${string}`,
            network,
            price: `$${priceUsd}`,
            routeConfig: {
              description: `PortalPay ${normalizedProductId} subscription`,
              mimeType: "application/json" as const,
              outputSchema: { productId: normalizedProductId },
            },
            facilitator: thirdwebFacilitator,
          });

          if (result.status !== 200) {
            // Track payment requirement/failure before responding, include card fallback
            const receiptId = correlationId;
            const now = Date.now();
            try {
              const container = await getContainer();
              await container.items.upsert({
                id: `receipt:${receiptId}`,
                type: "receipt",
                wallet: ownerWallet,
                receiptId,
                totalUsd: priceUsd,
                currency: "USD",
                lineItems: [{ label: `PortalPay ${productId} subscription`, priceUsd: priceUsd }],
                createdAt: now,
                brandName: "PortalPay",
                status: "pending",
                statusHistory: [{ status: "pending", ts: now }],
              } as any);
            } catch { }
            const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "");
            const paymentPortalUrl = appUrl
              ? `${appUrl}/portal/${receiptId}?recipient=${ownerWallet}&correlationId=${correlationId}`
              : null;

            try {
              const container = await getContainer();
              await container.items.upsert({
                id: `apim_subscription_payment|${subscriptionId}`,
                type: "apim_subscription_payment",
                productId: normalizedProductId,
                wallet,
                payTo: ownerWallet,
                amountUsd: priceUsd,
                chainId,
                status: "payment_required",
                correlationId,
                attemptedAt: Date.now(),
                requiredHeaders: result.responseHeaders,
                resultSummary: (result as any).responseBody ?? null,
                fallback: paymentPortalUrl
                  ? {
                    type: "portalpay-card",
                    paymentPortalUrl,
                    amountUsd: priceUsd,
                  }
                  : undefined,
              });
            } catch { }

            const responseBody = {
              ...(typeof (result as any).responseBody === "object" ? (result as any).responseBody : {}),
              fallback: paymentPortalUrl
                ? {
                  type: "portalpay-card",
                  paymentPortalUrl,
                  amountUsd: priceUsd,
                  productId: normalizedProductId,
                  correlationId,
                }
                : undefined,
            };

            return new NextResponse(JSON.stringify(responseBody), {
              status: 402,
              headers: { ...(result.responseHeaders as any), "x-correlation-id": correlationId } as HeadersInit,
            });
          }

          // Track payment settlement in Cosmos (gracefully ignore failures)
          try {
            const container = await getContainer();
            await container.items.upsert({
              id: `apim_subscription_payment|${subscriptionId}`,
              type: "apim_subscription_payment",
              productId: normalizedProductId,
              wallet,
              payTo: ownerWallet,
              amountUsd: priceUsd,
              chainId,
              status: "settled",
              correlationId,
              settledAt: Date.now(),
              resultSummary: result.paymentReceipt ?? null,
            });
          } catch { }
        } else if (requirePayment && cardConfirmation) {
          // Card payment fallback confirmation path: treat as settled (bypass x402)
          try {
            const container = await getContainer();
            await container.items.upsert({
              id: `apim_subscription_payment|${subscriptionId}`,
              type: "apim_subscription_payment",
              productId,
              wallet,
              payTo: ownerWallet,
              amountUsd: productLower.includes("enterprise") ? 500 : 399,
              chainId,
              status: "card_settled",
              correlationId,
              settledAt: Date.now(),
              cardConfirmationToken: cardConfirmation,
            });
          } catch { }
        } else if (productLower.includes("starter") && paymentData) {
          // Optional tip for Starter: attempt to settle if provided; proceed regardless of outcome
          const tipRes = await settlePayment({
            resourceUrl,
            method: "POST",
            paymentData,
            payTo: ownerWallet as `0x${string}`,
            network,
            price: "$5",
            routeConfig: {
              description: "Tip for PortalPay Starter",
              mimeType: "application/json" as const,
              outputSchema: { productId: normalizedProductId },
            },
            facilitator: thirdwebFacilitator,
          });

          // Track tip attempt/settlement
          try {
            const container = await getContainer();
            await container.items.upsert({
              id: `apim_subscription_tip|${subscriptionId}`,
              type: "apim_subscription_tip",
              productId: normalizedProductId,
              wallet,
              payTo: ownerWallet,
              amountUsd: 5,
              chainId,
              status: tipRes.status === 200 ? "settled" : "attempted",
              correlationId,
              attemptedAt: Date.now(),
              resultSummary: tipRes.status === 200 ? tipRes.paymentReceipt : (tipRes as any)?.responseBody ?? null,
            });
          } catch { }
        }
      }
    } catch (e) {
      // If payment flow encounters an issue, fall through to normal subscription creation
    }

    // Identifiers computed above

    // Create Internal API Key (acts as subscription)
    const planName = normalizedProductId.toLowerCase().includes("pro") ? "pro" :
      normalizedProductId.toLowerCase().includes("enterprise") ? "enterprise" : "starter";

    const { apiKey, doc: newKeyDoc } = await createApiKeyDoc(
      wallet,
      displayName,
      planName as ApiKeyPlan,
      scopes,
      brandKey
    );

    return NextResponse.json(
      {
        subscriptionId: newKeyDoc.id,
        wallet: newKeyDoc.ownerWallet,
        scopes: newKeyDoc.scopes,
        status: newKeyDoc.isActive ? "active" : "inactive",
        message: "Subscription created. You can rotate keys in the dashboard.",
      },
      { status: 201, headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
