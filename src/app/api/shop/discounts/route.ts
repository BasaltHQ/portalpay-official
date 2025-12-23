import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getBrandKey } from "@/config/brands";

// Discount type shared with LoyaltyPanel
export type Discount = {
    id: string;
    shopId: string; // Wallet or slug of the shop
    brandKey?: string;
    title: string;
    code?: string; // If present, it's a coupon (requires code entry)
    type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
    value: number;
    appliesTo: 'all' | 'collection' | 'product';
    appliesToIds: string[]; // Category names or product IDs
    minRequirement: 'none' | 'amount' | 'quantity';
    minRequirementValue: number;
    startDate: string; // ISO date string
    endDate?: string;
    usageLimit?: number;
    usedCount: number;
    status: 'active' | 'scheduled' | 'expired';
    createdAt: number;
    updatedAt: number;
};

// GET /api/shop/discounts?slug=<shopSlug>
// Returns active discounts for a shop (both automatic and coupon-based)
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const slug = url.searchParams.get("slug");
        const wallet = url.searchParams.get("wallet");
        const brandKey = url.searchParams.get("brandKey") || getBrandKey();

        if (!slug && !wallet) {
            return NextResponse.json({ error: "Missing slug or wallet parameter" }, { status: 400 });
        }

        const container = await getContainer();
        const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check for platform opt-in to include global discounts
        let includePlatform = false;
        let platformWallet = (process.env.NEXT_PUBLIC_OWNER_WALLET || "").toLowerCase();

        // 1. Fetch shop config to check opt-in status
        if (wallet) {
            try {
                // We use a direct query or existing helper. Since we are in the API, we can query safely.
                const configQuery = `SELECT * FROM c WHERE c.type='shop_config' AND c.wallet=@wallet`;
                const { resources: configs } = await container.items.query({
                    query: configQuery,
                    parameters: [{ name: "@wallet", value: wallet }]
                }).fetchAll();

                if (configs.length > 0 && configs[0].loyalty?.platformOptIn) {
                    includePlatform = true;
                }
            } catch (e) {
                console.warn("Failed to check platform opt-in", e);
            }
        }

        // 2. Query for active discounts (Shop's OWN + Platform's if opted in)
        // Active means: status is 'active'
        let query = `
            SELECT * FROM c 
            WHERE c.docType = 'discount' 
            AND (
                StringEquals(c.shopId, @shopId, true) 
                OR StringEquals(c.shopSlug, @slug, true)
                ${includePlatform && platformWallet ? 'OR StringEquals(c.shopId, @platformWallet, true)' : ''}
            )
            AND c.status = 'active'
        `;

        const parameters = [
            { name: "@shopId", value: wallet || slug },
            { name: "@slug", value: slug || "" }
        ];

        if (includePlatform && platformWallet) {
            parameters.push({ name: "@platformWallet", value: platformWallet });
        }

        const { resources: allDiscounts } = await container.items
            .query<Discount>({ query, parameters })
            .fetchAll();

        // Filter by date in JS
        const discounts = allDiscounts.filter(d => {
            const start = d.startDate;
            const end = d.endDate;
            // Simple string comparison works for ISO dates (YYYY-MM-DD)
            // We allow start date to be today or earlier
            // We allow end date to be today or later (or null)
            return start <= now && (!end || end >= now);
        });

        // Separate automatic discounts from coupons
        const automaticDiscounts = discounts.filter(d => !d.code);
        const coupons = discounts.filter(d => !!d.code);

        return NextResponse.json({
            discounts: automaticDiscounts,
            coupons,
            total: discounts.length,
            includedGlobal: includePlatform // Debug flag
        });
    } catch (error) {
        console.error("[GET /api/shop/discounts] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch discounts" },
            { status: 500 }
        );
    }
}

// POST /api/shop/discounts - Create or update a discount
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { discount, wallet, slug, brandKey: inputBrandKey } = body;

        if (!discount || (!wallet && !slug)) {
            return NextResponse.json(
                { error: "Missing discount data or shop identifier" },
                { status: 400 }
            );
        }

        const brandKey = inputBrandKey || getBrandKey();
        const container = await getContainer();
        const now = Date.now();

        const discountDoc: Discount & { docType: string; shopSlug?: string } = {
            ...discount,
            id: discount.id || `discount:${now}:${Math.random().toString(36).slice(2, 10)}`,
            docType: 'discount', // Document type for Cosmos DB (distinct from discount.type)
            shopId: wallet || slug,
            shopSlug: slug,
            brandKey,
            usedCount: discount.usedCount || 0,
            createdAt: discount.createdAt || now,
            updatedAt: now,
        };

        const { resource } = await container.items.upsert(discountDoc);

        return NextResponse.json({ success: true, discount: resource });
    } catch (error) {
        console.error("[POST /api/shop/discounts] Error:", error);
        return NextResponse.json(
            { error: "Failed to save discount" },
            { status: 500 }
        );
    }
}

// DELETE /api/shop/discounts?id=<discountId>
export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing discount ID" }, { status: 400 });
        }

        const container = await getContainer();

        // First find the item to get its partition key
        const { resources } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.id = @id AND c.docType = 'discount'",
                parameters: [{ name: "@id", value: id }]
            })
            .fetchAll();

        if (resources.length === 0) {
            return NextResponse.json({ error: "Discount not found" }, { status: 404 });
        }

        const discount = resources[0];
        await container.item(id, discount.shopId).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/shop/discounts] Error:", error);
        return NextResponse.json(
            { error: "Failed to delete discount" },
            { status: 500 }
        );
    }
}
