import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/x402/subscribe
 *
 * x402-only developer subscription endpoint. Always returns 402
 * when no payment proof is attached (via x-payment header).
 * 
 * The standard /api/apim-management/subscriptions remains untouched
 * for authenticated browser flows with card fallbacks.
 *
 * Body: { planKey: "starter" | "pro" | "enterprise" }
 *
 * Pricing:
 *   starter    → $0    (free tier, no payment required)
 *   pro        → $399
 *   enterprise → $500
 */

const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  pro: 399,
  enterprise: 500,
};

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  try {
    // Resolve the public-facing URL (req.nextUrl resolves to internal container address)
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host") || "surge.basalthq.com"}`).replace(/\/$/, "");
    const publicUrl = `${baseUrl}${req.nextUrl.pathname}`;

    let bodyText = "";
    if (req.method !== "GET" && req.method !== "HEAD") {
      try { bodyText = await req.text(); } catch {}
    }
    const body = bodyText ? JSON.parse(bodyText) : {};

    let planKey = String(body.planKey || "").toLowerCase().trim();

    if (!planKey || !(planKey in PLAN_PRICES)) {
      // If payment is absent, crawler probes often send empty bodies to check 402 behavior.
      // Default to "pro" to generate a valid 402 challenge for the crawler.
      if (!req.headers.has("x-payment")) {
        planKey = "pro";
      } else {
        return NextResponse.json(
          {
            error: "invalid_plan",
            message: `planKey must be one of: ${Object.keys(PLAN_PRICES).join(", ")}`,
            availablePlans: Object.entries(PLAN_PRICES).map(([key, price]) => ({
              planKey: key,
              priceUsd: price,
            })),
          },
          { status: 400, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    const priceUsd = PLAN_PRICES[planKey];

    // Starter is free — skip payment entirely
    if (priceUsd === 0) {
      // Resolve authenticated wallet for free subscription
      const { getAuthenticatedWallet } = await import("@/lib/auth");
      const wallet = await getAuthenticatedWallet(req);
      if (!wallet) {
        return NextResponse.json(
          { error: "unauthorized", message: "Connect your wallet to claim a free Starter subscription." },
          { status: 401, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
        );
      }

      const { createApiKeyDoc } = await import("@/lib/apim/keys");
      const { getBrandKey } = await import("@/config/brands");
      const brandKey = getBrandKey().toLowerCase();

      const { apiKey, doc: newKeyDoc } = await createApiKeyDoc(
        wallet,
        `${planKey} subscription`,
        "starter" as any,
        ["receipts:read", "receipts:write", "orders:read", "orders:create", "inventory:read", "inventory:write", "split:read", "split:write", "shop:read"],
        brandKey
      );

      return NextResponse.json(
        {
          ok: true,
          plan: planKey,
          priceUsd: 0,
          subscriptionId: newKeyDoc.id,
          apiKey,
          message: "Free Starter subscription activated.",
        },
        { status: 200, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ── x402 challenge / settlement for paid tiers ────────────────────
    const { settlePayment, facilitator } = await import("thirdweb/x402");
    const { createThirdwebClient } = await import("thirdweb");
    const { defineChain } = await import("thirdweb/chains");

    const secretKey = process.env.THIRDWEB_SECRET_KEY || "";
    const ownerWallet = process.env.NEXT_PUBLIC_OWNER_WALLET || "";
    const serviceWallet = process.env.THIRDWEB_SERVER_WALLET_ADDRESS || ownerWallet;
    const chainId = Number(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 8453);

    if (!secretKey || !serviceWallet) {
      return NextResponse.json(
        { error: "x402_not_configured", message: "Server x402 payment infrastructure is not configured." },
        { status: 503, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
      );
    }

    const client = createThirdwebClient({ secretKey });
    const network = defineChain(chainId);

    const thirdwebFacilitator = facilitator({
      client,
      serverWalletAddress: serviceWallet as `0x${string}`,
      waitUntil: "confirmed",
    });

    const paymentData = req.headers.get("x-payment");

    const result = await settlePayment({
      resourceUrl: publicUrl,
      method: "POST",
      paymentData,
      payTo: ownerWallet as `0x${string}`,
      network,
      price: `$${priceUsd}`,
      routeConfig: {
        description: `PortalPay ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} API subscription`,
        mimeType: "application/json" as const,
        outputSchema: { planKey },
      },
      facilitator: thirdwebFacilitator,
    });

    // If settlePayment returns non-200, it means payment is required (402)
    if (result.status !== 200) {
      const rawHeaders = (result as any).responseHeaders || {};
      const paymentRequiredB64 = rawHeaders["PAYMENT-REQUIRED"] || rawHeaders["payment-required"] || rawHeaders["Payment-Required"] || "";
      let challengeBody: any = {};
      if (paymentRequiredB64) {
        try {
          challengeBody = JSON.parse(Buffer.from(paymentRequiredB64, "base64").toString("utf-8"));
          
          // Inject input schema so strict crawler parsers don't fail discovery
          if (challengeBody.accepts && Array.isArray(challengeBody.accepts)) {
            challengeBody.accepts.forEach((a: any) => {
              if (!a.outputSchema) a.outputSchema = {};
              if (!a.outputSchema.input) a.outputSchema.input = { type: "http", method: "POST" };
              a.outputSchema.input.schema = {
                type: "object",
                required: ["planKey"],
                properties: {
                  planKey: { type: "string", enum: ["starter", "pro", "enterprise"] }
                }
              };
              
              // INJECT EXPLICIT PRICE STRING FOR X402SCAN CRAWLER VALIDATION
              const priceUsdRaw = challengeBody?.subscription?.priceUsd || 399;
              if (!a.price) a.price = `$${priceUsdRaw}.00`;
            });
          }
          
          // Re-encode header to ensure it matches the body
          const newHeaderB64 = Buffer.from(JSON.stringify(challengeBody)).toString("base64");
          rawHeaders["Payment-Required"] = newHeaderB64;
          
        } catch { challengeBody = { raw: paymentRequiredB64 }; }
      }

      const updatedBody = {
        ...challengeBody,
        subscription: {
          planKey,
          priceUsd,
          currency: "USD",
        },
      };
      
      rawHeaders["Payment-Required"] = Buffer.from(JSON.stringify(updatedBody)).toString("base64");

      return new NextResponse(JSON.stringify(updatedBody), {
        status: 402,
        headers: {
          "Payment-Required": rawHeaders["Payment-Required"],
          "x-correlation-id": correlationId,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "payment-required, Payment-Required, PAYMENT-REQUIRED",
        },
      });
    }

    // ── Payment settled – create the API key ──────────────────────────
    const { getAuthenticatedWallet } = await import("@/lib/auth");
    let wallet = await getAuthenticatedWallet(req);

    // For x402, the payment proof itself may carry identity
    if (!wallet) {
      // Attempt to extract wallet from payment receipt
      const receipt = result.paymentReceipt as any;
      wallet = receipt?.payer || receipt?.from || "";
    }

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet_required", message: "Could not resolve wallet identity. Connect wallet or provide x-payment proof." },
        { status: 400, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { createApiKeyDoc } = await import("@/lib/apim/keys");
    const { getBrandKey } = await import("@/config/brands");
    const brandKey = getBrandKey().toLowerCase();

    const { apiKey, doc: newKeyDoc } = await createApiKeyDoc(
      wallet,
      `${planKey} subscription (x402)`,
      planKey as any,
      ["receipts:read", "receipts:write", "orders:read", "orders:create", "inventory:read", "inventory:write", "split:read", "split:write", "shop:read"],
      brandKey
    );

    // Track the payment
    try {
      const { getContainer } = await import("@/lib/cosmos");
      const container = await getContainer();
      await container.items.upsert({
        id: `apim_x402_payment|${newKeyDoc.id}`,
        type: "apim_subscription_payment",
        productId: planKey,
        wallet,
        payTo: ownerWallet,
        amountUsd: priceUsd,
        chainId,
        status: "settled",
        source: "x402",
        correlationId,
        settledAt: Date.now(),
        resultSummary: result.paymentReceipt ?? null,
      });
    } catch { }

    return NextResponse.json(
      {
        ok: true,
        plan: planKey,
        priceUsd,
        subscriptionId: newKeyDoc.id,
        apiKey,
        message: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} subscription activated via x402 payment.`,
      },
      { status: 200, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e: any) {
    console.error("[x402/subscribe] Error:", e);
    return NextResponse.json(
      { error: e?.message || "internal_error" },
      { status: 500, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function GET(req: NextRequest) { return POST(req); }
export async function PUT(req: NextRequest) { return POST(req); }
export async function PATCH(req: NextRequest) { return POST(req); }
export async function DELETE(req: NextRequest) { return POST(req); }
export async function HEAD(req: NextRequest) { return POST(req); }
export async function OPTIONS(req: NextRequest) { 
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers": "payment-required, Payment-Required, PAYMENT-REQUIRED",
    }
  });
}
