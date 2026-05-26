import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const shopSlug = url.searchParams.get("shopSlug");
    
    if (!shopSlug) {
      const container = await getContainer();
      const querySpec = {
        query: "SELECT * FROM c WHERE c.type = 'inventory_item' AND (c.deliveryEnabled = true OR IS_DEFINED(c.priceUsd))",
        parameters: []
      };
      const { resources: allItems } = await container.items.query(querySpec).fetchAll();
      // Cap at 15 items to keep it extremely fast
      const trendingItems = allItems.slice(0, 15);
      return NextResponse.json({ ok: true, items: trendingItems });
    }
    
    const container = await getContainer();
    
    // First query for items specifically marked with deliveryEnabled === true
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'inventory_item' AND c.shopSlug = @slug AND c.deliveryEnabled = true",
      parameters: [{ name: "@slug", value: shopSlug.toLowerCase() }]
    };
    
    let { resources: items } = await container.items.query(querySpec).fetchAll();
    
    // Fallback: If no items are explicitly set to deliveryEnabled yet, return all items
    // for this shop so the user can immediately test and proceed with checking out deliverable products
    if (!items || items.length === 0) {
      const fallbackQuery = {
        query: "SELECT * FROM c WHERE c.type = 'inventory_item' AND c.shopSlug = @slug",
        parameters: [{ name: "@slug", value: shopSlug.toLowerCase() }]
      };
      const { resources } = await container.items.query(fallbackQuery).fetchAll();
      items = resources;
    }
    
    return NextResponse.json({ ok: true, items: items || [] });
  } catch (error: any) {
    console.error("[delivers/items] Error fetching items:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}
