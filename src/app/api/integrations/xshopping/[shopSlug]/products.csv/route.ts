
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Convert a base64 data URL to an S3-hosted URL.
 * Uses a content-hash key so repeated exports don't create duplicates.
 */
async function resolveDataUrlToS3(dataUrl: string, wallet: string): Promise<string> {
    try {
        const m = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
        if (!m) return dataUrl;

        const isBase64 = !!m[2];
        const rawData = m[3] || "";
        const buffer = isBase64
            ? Buffer.from(rawData, "base64")
            : Buffer.from(decodeURIComponent(rawData), "utf8");

        // Content-hash key for deduplication
        const hash = crypto.createHash("md5").update(buffer).digest("hex");
        const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
        const key = `${containerName}/${wallet}/${hash}.webp`;

        const { storage } = await import("@/lib/azure-storage");

        // Check if already uploaded
        const exists = await storage.exists(key).catch(() => false);
        if (exists) {
            return await storage.getUrl(key);
        }

        // Optimize with sharp before uploading
        let uploadBuf: any = buffer;
        try {
            const sharpMod = await import("sharp");
            const sharp = sharpMod.default || sharpMod;
            const sharpOut = await sharp(buffer)
                .resize({ width: 1500, height: 1500, fit: "inside", withoutEnlargement: true })
                .webp({ quality: 82 })
                .toBuffer();
            uploadBuf = Buffer.from(sharpOut.buffer, sharpOut.byteOffset, sharpOut.byteLength);
        } catch {
            // If sharp fails, upload raw buffer
        }

        return await storage.upload(key, uploadBuf, "image/webp");
    } catch (err) {
        console.error("[CSV Feed] Failed to resolve data URL to S3:", err);
        return dataUrl; // Fallback to original if upload fails
    }
}

// Helper to escape CSV fields complying with RFC 4180
function csvEscape(field: any): string {
    const stringValue = String(field || "").trim();
    if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n") || stringValue.includes("\r")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

// Helper to truncate text
function truncate(text: string, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ shopSlug: string }> }) {
    try {
        const { shopSlug } = await params;
        if (!shopSlug) {
            return new NextResponse("Missing shop slug", { status: 400 });
        }

        const container = await getContainer();

        // 1. Resolve Shop Slug (Normalize basaltsurge -> portalpay)
        const effectiveSlug = shopSlug.toLowerCase() === 'basaltsurge' ? 'portalpay' : shopSlug.toLowerCase();

        const { resources: shops } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.slug = @slug OR (c.customDomain = @slug AND c.customDomainVerified = true)",
                parameters: [{ name: "@slug", value: effectiveSlug }]
            })
            .fetchAll();

        const envBrandKey = (process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || "basaltsurge").toLowerCase();

        const shop = (
            shops.find((c: any) => (c.brandKey || "").toLowerCase() === envBrandKey) ||
            ((envBrandKey === "basaltsurge" || envBrandKey === "portalpay")
                ? shops.find((c: any) => !c.brandKey || c.brandKey === "portalpay" || c.brandKey === "basaltsurge")
                : undefined) ||
            shops[0]
        );

        // For X Shopping, validation fails if URL returns 404. We must return a 200 with empty CSV or valid error?
        // "Shop not found" implies no feed. 404 is appropriate.
        if (!shop || !shop.wallet) {
            return new NextResponse(`Shop not found or wallet missing for slug: ${effectiveSlug}`, { status: 404 });
        }

        const wallet = shop.wallet;

        // 2. Fetch Inventory Items for this Wallet
        // We do the complex filtering in JavaScript because Cosmos DB's IS_DEFINED
        // on nested missing properties can evaluate to Undefined and silently eat results.
        const { resources: allItems } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type='inventory_item' AND c.wallet=@wallet",
                parameters: [{ name: "@wallet", value: wallet }]
            })
            .fetchAll();

        const items = allItems.filter((item: any) => {
            const isPublishing = item.attributes?.type === 'publishing';
            if (!isPublishing) return true;
            return item.approvalStatus !== 'ARCHIVED';
        });

        // 3. Generate CSV
        // X Shopping Template Spec: id,title,description,availability,condition,price,link,image_link,gtin,mpn,brand,mobile_link,additional_image_link,google_product_category,product_type,inventory,sale_price,sale_price_effective_date,gender,color,size,age_group,item_group_id,custom_label_0,custom_label_1,custom_label_2,custom_label_3,custom_label_4
        const headers = [
            "id",
            "title",
            "description",
            "availability",
            "condition",
            "price",
            "link",
            "image_link",
            "gtin",
            "mpn",
            "brand",
            "mobile_link",
            "additional_image_link",
            "google_product_category",
            "product_type",
            "inventory",
            "sale_price",
            "sale_price_effective_date",
            "gender",
            "color",
            "size",
            "age_group",
            "item_group_id",
            "custom_label_0",
            "custom_label_1",
            "custom_label_2",
            "custom_label_3",
            "custom_label_4",
            "debug_info"
        ];

        // Construct Base URL based on request custom domain or env?
        // Ideally should match the shop's domain.
        // If shop has customDomain, use that.
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://surge.basalthq.com";
        if (shop.customDomain && shop.customDomainVerified) {
            baseUrl = `https://${shop.customDomain}`;
        } else if (process.env.NEXT_PUBLIC_APP_URL) {
            baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        }

        // Shop name cleanup
        const cleanBrandName = truncate(stripHtml(shop.name || effectiveSlug), 100);

        const csvRows: string[] = [];
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            // ID: Max 100 chars
            let itemId = String(item.id || `missing-id-${index}`).trim();
            itemId = truncate(itemId, 100);

            // Title: Max 150 chars, no HTML
            let title = stripHtml(item.name || "Untitled Product");
            if (!title) title = "Untitled Product";
            title = truncate(title, 150);

            // Description: Max 5000 chars, no HTML
            // Fallback MUST exist
            let description = stripHtml(item.description || "");
            if (!description) {
                description = `${title} available at ${cleanBrandName}`;
            }
            description = truncate(description, 5000);

            // Price: Format "99.99 USD"
            const rawPrice = typeof item.priceUsd === 'number' ? item.priceUsd : 0;
            const price = `${rawPrice.toFixed(2)} ${item.currency || 'USD'}`;

            // Availability: in stock, out of stock (X Shopping / Facebook spec uses spaces)
            let availability = "out of stock";
            if (item.stockQty === -1 || item.stockQty > 0) {
                availability = "in stock";
            }

            // Link: Valid HTTPS URL
            let link = "";
            // Use untruncated ID for the link to ensure deep linking works
            const rawId = String(item.id || "").trim();
            const encodedId = encodeURIComponent(rawId);

            if (shop.customDomain && shop.customDomainVerified) {
                link = `https://${shop.customDomain}/product/${encodedId}`;
            } else {
                link = `${baseUrl}/shop/${effectiveSlug}/product/${encodedId}`;
            }

            // Image Link
            // X requires proper HTTPS URLs — base64 data URLs are not compatible.
            // If the image is a data URL, upload it to S3 and use the permanent URL.
            let imageLink = "";
            if (item.images && item.images.length > 0) {
                imageLink = item.images[0];
                // Convert data URLs to S3 URLs on-the-fly
                if (typeof imageLink === 'string' && imageLink.startsWith("data:")) {
                    imageLink = await resolveDataUrlToS3(imageLink, wallet);
                }
            } else {
                const platformUrl = process.env.NEXT_PUBLIC_APP_URL || "https://surge.basalthq.com";
                imageLink = `${platformUrl}/api/integrations/xshopping/${effectiveSlug}/product-images/default?id=${encodedId}`;
            }

            csvRows.push([
                csvEscape(itemId),
                csvEscape(title),
                csvEscape(description),
                csvEscape(availability),
                "new", // condition
                csvEscape(price),
                csvEscape(link),
                csvEscape(imageLink),
                "", // gtin
                "", // mpn
                csvEscape(cleanBrandName), // brand
                "", // mobile_link
                "", // additional_image_link
                "", // google_product_category
                csvEscape(item.category || "General"), // product_type
                Number.isFinite(item.stockQty) ? (item.stockQty === -1 ? "100" : String(item.stockQty)) : "0", // inventory (pseudo)
                "", // sale_price
                "", // sale_price_effective_date
                "", // gender
                "", // color
                "", // size
                "", // age_group
                "", // item_group_id
                "", // custom_label_0
                "", // custom_label_1
                "", // custom_label_2
                "", // custom_label_3
                "", // custom_label_4
                "v3-s3-resolve" // debug_source
            ].join(","));
        }

        const csvContent = [headers.join(","), ...csvRows].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="x-shopping-feed-${effectiveSlug}-${Date.now()}.csv"`,
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "X-Feed-Version": "v2-fix-spaces",
                "X-Feed-Gen-Time": new Date().toISOString(),
            }
        });

    } catch (err: any) {
        console.error("X Shopping Feed Error:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
