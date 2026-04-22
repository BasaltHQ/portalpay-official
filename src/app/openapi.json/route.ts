import { NextResponse } from "next/server";
import { parse } from "yaml";
import { promises as fs } from "fs";
import path from "path";
import { getContainer } from "@/lib/cosmos";

// Define strict 1-week ISR caching to satisfy aggregator stability
export const revalidate = 604800; 

export async function GET() {
  try {
    // 1. Read static base YAML from public directory
    const yamlPath = path.join(process.cwd(), "public", "openapi.yaml");
    const yamlContent = await fs.readFile(yamlPath, "utf-8");
    const spec = parse(yamlContent);

    // Ensure paths object exists
    if (!spec.paths) spec.paths = {};

    // 2. Fetch all inventory and store configurations from Cosmos DB
    const container = await getContainer();
    
    const { resources: inventory } = await container.items.query(
      `SELECT c.sku, c.name, c.priceUsd, c.description, c.wallet FROM c WHERE c.type = 'inventory_item'`
    ).fetchAll();

    const { resources: merchants } = await container.items.query(
      `SELECT c.wallet, c.slug, c.name FROM c WHERE c.type = 'site_config'`
    ).fetchAll();

    // 3. Map wallets to guaranteed unique routing slugs
    const merchantMap: Record<string, string> = {};
    for (const m of (merchants || [])) {
      if (m.wallet && m.slug) {
        merchantMap[m.wallet.toLowerCase()] = m.slug;
      }
    }

    let injectedCount = 0;

    // 4. Inject dynamic POS paths into the master OpenAPI spec
    for (const item of (inventory || [])) {
      if (!item.wallet || !item.sku) continue;
      
      const slug = merchantMap[item.wallet.toLowerCase()];
      if (!slug) continue;

      const endpointPath = `/api/x402/shop/${slug}/buy/${item.sku}`;

      spec.paths[endpointPath] = {
        post: {
          summary: `Purchase ${item.name || item.sku}`,
          operationId: `purchase_${slug}_${item.sku.replace(/[^a-zA-Z0-9]/g, '_')}`,
          tags: ["POS Directory"],
          description: `Direct Agentic POS settlement endpoint.\nSKU: ${item.sku}\nDesc: ${item.description || "N/A"}\nMerchant: ${slug}`,
          security: [{ x402: [] }],
          "x-payment-info": {
            price: {
              mode: "dynamic",
              currency: "USD",
              min: Number(item.priceUsd || 0).toFixed(2),
              max: Number(item.priceUsd || 0).toFixed(2)
            },
            protocols: [
              { x402: {} }
            ]
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    qty: { type: "integer", default: 1, minimum: 1 }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful x402 Payment Settlement Receipt"
            },
            "402": {
              description: "Payment Required - Validate x402 challenge."
            }
          }
        }
      };
      
      injectedCount++;
    }

    return NextResponse.json(spec);

  } catch (err: any) {
    console.error("[openapi.json] Dynamic generator failed:", err);
    return NextResponse.json({ error: "Failed to generate dynamic OpenAPI spec." }, { status: 500 });
  }
}
