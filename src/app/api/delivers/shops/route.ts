import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const container = await getContainer();
    
    // First query specifically for delivery-enabled shops
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'shop_config' AND c.deliveryEnabled = true",
      parameters: []
    };
    
    let { resources: shops } = await container.items.query(querySpec).fetchAll();
    
    // Fallback: If no shops have local delivery enabled yet, fetch all active shops
    // to prevent blank screen and facilitate immediate local testing/verification
    if (!shops || shops.length === 0) {
      const fallbackQuery = {
        query: "SELECT * FROM c WHERE c.type = 'shop_config'",
        parameters: []
      };
      const { resources } = await container.items.query(fallbackQuery).fetchAll();
      shops = resources;
    }
    
    return NextResponse.json({ ok: true, shops: shops || [] });
  } catch (error: any) {
    console.error("[delivers/shops] Error fetching shops:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
