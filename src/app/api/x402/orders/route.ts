import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/x402/orders
 *
 * x402-only order endpoint. Always returns 402 when no payment proof
 * is attached (via x-payment header). This is the agentic entrypoint
 * — the standard /api/orders remains untouched for POS/browser flows.
 *
 * Body: { shopSlug: string, items: [{ sku: string, qty: number }], jurisdictionCode?: string }
 *
 * The x402 challenge tells the agent exactly how much to pay and where.
 * Once the agent attaches a valid x-payment header, the order is created
 * by proxying into the standard orders handler.
 */
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  try {
    // Resolve the public-facing URL (req.nextUrl resolves to internal container address)
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host") || "surge.basalthq.com"}`).replace(/\/$/, "");
    const publicUrl = `${baseUrl}${req.nextUrl.pathname}`;

    // Clone and parse body so we can read it AND forward it
    let bodyText = "";
    if (req.method !== "GET" && req.method !== "HEAD") {
      try { bodyText = await req.text(); } catch { }
    }
    const body = bodyText ? JSON.parse(bodyText) : {};

    let shopSlug = String(body.shopSlug || "").trim();
    let items = Array.isArray(body.items) ? body.items : [];

    if (!shopSlug || items.length === 0) {
      if (!req.headers.has("x-payment")) {
        // Mock a quote challenge immediately for the crawler, skipping DB hooks
        const { settlePayment, facilitator } = await import("thirdweb/x402");
        const { createThirdwebClient } = await import("thirdweb");
        const { defineChain } = await import("thirdweb/chains");

        const secretKey = process.env.THIRDWEB_SECRET_KEY || "";
        const serviceWallet = process.env.THIRDWEB_SERVER_WALLET_ADDRESS || process.env.NEXT_PUBLIC_OWNER_WALLET || "";
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

        const result = await settlePayment({
          resourceUrl: publicUrl,
          method: "POST",
          paymentData: null,
          payTo: serviceWallet as `0x${string}`,
          network,
          price: "$0.10",
          routeConfig: {
            description: "Dummy quote for x402scan crawler verification",
            mimeType: "application/json" as const,
            outputSchema: {},
          },
          facilitator: thirdwebFacilitator,
        });

        // settlePayment puts the challenge in a base64 `payment-required` header.
        // x402scan expects the challenge in the response body, so decode and serve it.
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
                  required: ["shopSlug", "items"],
                  properties: {
                    shopSlug: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["sku", "qty"],
                        properties: { sku: { type: "string" }, qty: { type: "number" } }
                      }
                    }
                  }
                };
              });
            }

            // Re-encode header to ensure it matches the body
            const newHeaderB64 = Buffer.from(JSON.stringify(challengeBody)).toString("base64");
            rawHeaders["Payment-Required"] = newHeaderB64;

          } catch { challengeBody = { raw: paymentRequiredB64 }; }
        }

        return new NextResponse(JSON.stringify(challengeBody), {
          status: 402,
          headers: {
            "Payment-Required": rawHeaders["Payment-Required"],
            "WWW-Authenticate": `x402 macaroon="${rawHeaders["Payment-Required"]}"`,
            "x-correlation-id": correlationId,
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "payment-required, Payment-Required, PAYMENT-REQUIRED, WWW-Authenticate, www-authenticate",
          },
        });
      } else {
        return NextResponse.json(
          {
            error: "invalid_request",
            message: "Body must include shopSlug and items[]. Example: { shopSlug: 'genrevo', items: [{ sku: 'COFFEE-001', qty: 1 }] }",
          },
          { status: 400, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    // Resolve the merchant wallet for this shop
    const { getContainer } = await import("@/lib/cosmos");
    const container = await getContainer();
    const { resources: shopDocs } = await container.items
      .query({
        query: "SELECT c.wallet FROM c WHERE c.type = 'shop_config' AND c.slug = @slug",
        parameters: [{ name: "@slug", value: shopSlug }],
      })
      .fetchAll();

    if (!shopDocs.length || !shopDocs[0].wallet) {
      return NextResponse.json(
        { error: "shop_not_found", message: `No shop with slug '${shopSlug}' found.` },
        { status: 404, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
      );
    }

    const merchantWallet = String(shopDocs[0].wallet).toLowerCase();

    // Resolve merchant inventory to compute the total
    const { getInventoryItems } = await import("@/lib/inventory-mem");
    const allItems = await getInventoryItems(merchantWallet);

    let totalCents = 0;
    const resolvedLineItems: { label: string; priceUsd: number; qty: number; sku: string }[] = [];

    for (const reqItem of items) {
      const sku = String(reqItem.sku || "").trim();
      const qty = Math.max(1, Number(reqItem.qty) || 1);

      const found = allItems.find(
        (inv) => inv.sku?.toLowerCase() === sku.toLowerCase() || inv.id === reqItem.id
      );

      if (!found) {
        return NextResponse.json(
          { error: "item_not_found", message: `SKU '${sku}' not found in shop '${shopSlug}'.` },
          { status: 400, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
        );
      }

      const unitPrice = Number(found.priceUsd) || 0;
      totalCents += Math.round(unitPrice * 100) * qty;
      resolvedLineItems.push({
        label: found.name || sku,
        priceUsd: unitPrice,
        qty,
        sku: found.sku || sku,
      });
    }

    const totalUsd = totalCents / 100;

    // ── x402 challenge / settlement ──────────────────────────────────
    const { settlePayment, facilitator } = await import("thirdweb/x402");
    const { createThirdwebClient } = await import("thirdweb");
    const { defineChain } = await import("thirdweb/chains");

    const secretKey = process.env.THIRDWEB_SECRET_KEY || "";
    const serviceWallet = process.env.THIRDWEB_SERVER_WALLET_ADDRESS || process.env.NEXT_PUBLIC_OWNER_WALLET || "";
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

    // Resolve split address for the merchant (pay the split if available, else merchant directly)
    const { getSiteConfigForWallet } = await import("@/lib/site-config");
    const cfg = await getSiteConfigForWallet(merchantWallet).catch(() => null as any);
    const splitAddr = (cfg as any)?.splitAddress || (cfg as any)?.split?.address || "";
    const payTo = (/^0x[a-f0-9]{40}$/i.test(splitAddr) ? splitAddr : merchantWallet) as `0x${string}`;
    const brandName = cfg?.theme?.brandName || "PortalPay";

    const paymentData = req.headers.get("x-payment");

    const result = await settlePayment({
      resourceUrl: publicUrl,
      method: "POST",
      paymentData,
      payTo,
      network,
      price: `$${totalUsd}`,
      routeConfig: {
        description: `Order from ${brandName} (${shopSlug}): ${resolvedLineItems.map((li) => `${li.qty}x ${li.label}`).join(", ")}`,
        mimeType: "application/json" as const,
        outputSchema: {},
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
        } catch { challengeBody = { raw: paymentRequiredB64 }; }
      }

      const updatedBody = {
        ...challengeBody,
        order: {
          shopSlug,
          merchant: merchantWallet,
          lineItems: resolvedLineItems,
          totalUsd,
          currency: "USD",
        },
      };

      rawHeaders["Payment-Required"] = Buffer.from(JSON.stringify(updatedBody)).toString("base64");

      return new NextResponse(JSON.stringify(updatedBody), {
        status: 402,
        headers: {
          "Payment-Required": rawHeaders["Payment-Required"],
          "WWW-Authenticate": `x402 macaroon="${rawHeaders["Payment-Required"]}"`,
          "x-correlation-id": correlationId,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "payment-required, Payment-Required, PAYMENT-REQUIRED, WWW-Authenticate, www-authenticate",
        },
      });
    }

    // ── Payment settled – create the receipt ──────────────────────────
    const receiptId = `R-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`;
    const ts = Date.now();

    const receipt = {
      receiptId,
      totalUsd,
      currency: "USD",
      lineItems: resolvedLineItems,
      createdAt: ts,
      brandName,
      status: "paid",
      source: "x402",
    };

    const doc = {
      id: `receipt:${receiptId}`,
      type: "receipt",
      wallet: merchantWallet,
      ...receipt,
      statusHistory: [{ status: "paid", ts }],
    };

    try {
      await container.items.upsert(doc as any);
    } catch {
      // Graceful degrade
    }

    return NextResponse.json(
      { ok: true, receipt },
      { status: 200, headers: { "x-correlation-id": correlationId, "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e: any) {
    console.error("[x402/orders] Error:", e);
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
