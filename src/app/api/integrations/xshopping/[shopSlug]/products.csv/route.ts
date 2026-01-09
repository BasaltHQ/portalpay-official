
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

// Helper to escape CSV fields
function csvEscape(field: any): string {
    const stringValue = String(field || "").trim();
    if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
    try {
        const { shopSlug } = await params;
        if (!shopSlug) {
            return new NextResponse("Missing shop slug", { status: 400 });
        }

        const container = await getContainer();

        // 1. Resolve Shop Slug to Wallet
        // Query for the shop config to get the owner wallet.
        // We use the same container where ShopConfigs and InventoryItems live.
        // Note: brandKey/shopSlug mapping. For now, assume shopSlug matches the 'slug' field in ShopConfig.
        // If shopSlug is 'portalpay', it likely maps to the platform brand owner.
        const { resources: shops } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.slug = @slug OR (c.customDomain = @slug AND c.customDomainVerified = true)",
                parameters: [{ name: "@slug", value: shopSlug.toLowerCase() }]
            })
            .fetchAll();

        const shop = shops[0];

        // If no shop found, and it's a known brand key like 'portalpay', we might want to fallback or check generic brand config?
        // But the user requested "only pulls that shops inventory".
        if (!shop || !shop.wallet) {
            // Debug: check if there's a fallback or if this is a platform test
            // For now, return 404 to respect "only pulls that shops inventory"
            return new NextResponse(`Shop not found or wallet missing for slug: ${shopSlug}`, { status: 404 });
        }

        const wallet = shop.wallet;

        // 2. Fetch Inventory Items for this Wallet
        const { resources: items } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type='inventory_item' AND c.wallet=@wallet",
                parameters: [{ name: "@wallet", value: wallet }]
            })
            .fetchAll();

        // 3. Generate CSV
        // X Shopping Feed Specs: id, title, description, link, image_link, price, availability, condition, brand
        const headers = [
            "id",
            "title",
            "description",
            "link",
            "image_link",
            "price",
            "availability",
            "condition",
            "brand"
        ];

        // Construct Base URL based on request custom domain or env?
        // Ideally should match the shop's domain.
        // If shop has customDomain, use that.
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pay.ledger1.ai";
        if (shop.customDomain && shop.customDomainVerified) {
            baseUrl = `https://${shop.customDomain}`;
        } else if (process.env.NEXT_PUBLIC_APP_URL) {
            baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        }

        const csvRows = items.map((item: any) => {
            const price = `${item.priceUsd || 0} ${item.currency || 'USD'}`;
            // Simple stock check logic
            const availability = (item.stockQty === -1 || item.stockQty > 0) ? "in stock" : "out of stock";

            // Link construction:
            // If custom domain: https://custom.com/product/123
            // If platform slug: https://platform.com/shop/slug/product/123
            let link = "";
            if (shop.customDomain && shop.customDomainVerified) {
                link = `https://${shop.customDomain}/product/${item.id}`;
            } else {
                link = `${baseUrl}/shop/${shopSlug}/product/${item.id}`;
            }

            const imageLink = item.images && item.images.length > 0 ? item.images[0] : "";

            return [
                csvEscape(item.id),
                csvEscape(item.name),
                csvEscape(item.description || item.name),
                csvEscape(link),
                csvEscape(imageLink),
                csvEscape(price),
                csvEscape(availability),
                "new", // Default condition
                csvEscape(shop.name || shopSlug)
            ].join(",");
        });

        const csvContent = [headers.join(","), ...csvRows].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="x-shopping-feed-${shopSlug}.csv"`
            }
        });

    } catch (err: any) {
        console.error("X Shopping Feed Error:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
