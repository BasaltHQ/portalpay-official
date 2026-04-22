import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const maxDuration = 60;
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host") || "surge.basalthq.com"}`).replace(/\/$/, "");
  
  let dynamicEndpoints: string[] = [];
  try {
    const container = await getContainer();
    const { resources: inventory } = await container.items.query(
      `SELECT c.sku, c.wallet FROM c WHERE c.type = 'inventory_item'`
    ).fetchAll();

    const { resources: merchants } = await container.items.query(
      `SELECT c.wallet, c.slug FROM c WHERE c.type = 'site_config'`
    ).fetchAll();

    const merchantMap: Record<string, string> = {};
    for (const m of (merchants || [])) {
      if (m.wallet && m.slug) {
        merchantMap[m.wallet.toLowerCase()] = m.slug;
      }
    }

    for (const item of (inventory || [])) {
      if (!item.wallet || !item.sku) continue;
      const slug = merchantMap[item.wallet.toLowerCase()];
      if (slug) {
        dynamicEndpoints.push(`POST /api/x402/shop/${slug}/buy/${item.sku}`);
      }
    }
  } catch { /* proceed with static fallbacks if DB fails */ }
  
  return NextResponse.json({
    version: 1,
    resources: [
      "POST /api/x402/orders", 
      "POST /api/x402/subscribe",
      ...dynamicEndpoints
    ]
  }, {
    headers: {
      "Link": `<${baseUrl}/openapi.json>; rel="service-desc"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET"
    }
  });
}
