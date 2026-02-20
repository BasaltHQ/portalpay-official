
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID_CONCIERGE;

if (!ELEVENLABS_API_KEY || !AGENT_ID) {
    console.error("Missing env vars");
    process.exit(1);
}

const API_BASE = "https://api.elevenlabs.io/v1";
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://pay.ledger1.ai";

// ─── Definitions (Copied from provision script) ───

const CART_CLIENT_TOOLS = [
    {
        name: "addToCart",
        description: "Add an item to the customer's shopping cart. Always pass the item id. Default qty to 1 if not specified. For customizable items, include selectedModifiers or selectedVariant.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The inventory item ID to add" },
                sku: { type: "string", description: "SKU of the item (alternative to id)" },
                qty: { type: "number", description: "Quantity to add. Defaults to 1." },
                selectedModifiers: {
                    type: "string",
                    description: "JSON array of selected modifiers: [{groupId, modifierId, name, priceAdjustment}]"
                },
                selectedVariant: {
                    type: "string",
                    description: "JSON object of selected variant: {variantId, name, priceUsd}"
                },
            },
            required: ["id"],
        },
        expects_response: true,
        response_timeout_secs: 5,
    },
    {
        name: "editCartItem",
        description: "Edit modifiers on an existing cart item. Use lineIndex (0-based position in cart) to identify the item.",
        parameters: {
            type: "object",
            properties: {
                lineIndex: { type: "number", description: "0-based index of the cart item to edit" },
                selectedModifiers: {
                    type: "string",
                    description: "JSON array of new modifier selections: [{groupId, modifierId, name, priceAdjustment}]"
                },
            },
            required: ["lineIndex"],
        },
        expects_response: true,
        response_timeout_secs: 5,
    },
    {
        name: "removeFromCart",
        description: "Remove an item from the cart by its line index (0-based position).",
        parameters: {
            type: "object",
            properties: {
                lineIndex: { type: "number", description: "0-based index of the cart item to remove" },
            },
            required: ["lineIndex"],
        },
        expects_response: true,
        response_timeout_secs: 5,
    },
    {
        name: "updateCartItemQty",
        description: "Change quantity of a cart item. If qty is 0, the item is removed.",
        parameters: {
            type: "object",
            properties: {
                lineIndex: { type: "number", description: "0-based index of the cart item" },
                qty: { type: "number", description: "New quantity. Use 0 to remove." },
            },
            required: ["lineIndex", "qty"],
        },
        expects_response: true,
        response_timeout_secs: 5,
    },
    {
        name: "clearCart",
        description: "Clear all items from the customer's cart. Always confirm with the customer before calling.",
        parameters: { type: "object", properties: {} },
        expects_response: true,
        response_timeout_secs: 3,
    },
    {
        name: "getCartSummary",
        description: "Get current cart items with quantities, line totals, modifiers, and subtotal.",
        parameters: { type: "object", properties: {} },
        expects_response: true,
        response_timeout_secs: 3,
    },
];

function makeServerTools(webhookBase: string) {
    return [
        {
            type: "webhook",
            name: "getShopDetails",
            description: "Get the shop's name, description, bio, theme, slug, and wallet address.",
            api_schema: {
                url: `${webhookBase}/api/agent/voice/call-tool`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                request_body: {
                    type: "object",
                    properties: {
                        toolName: { type: "string", enum: ["getShopDetails"] },
                        wallet: { type: "string", description: "Merchant wallet address. Use the value of {{merchantWallet}}." },
                        slug: { type: "string", description: "Shop slug. Use the value of {{shopSlug}}." },
                    },
                },
            },
        },
        {
            type: "webhook",
            name: "getShopRating",
            description: "Get the shop's average rating and review count.",
            api_schema: {
                url: `${webhookBase}/api/agent/voice/call-tool`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                request_body: {
                    type: "object",
                    properties: {
                        toolName: { type: "string", enum: ["getShopRating"] },
                        wallet: { type: "string", description: "Merchant wallet address. Use {{merchantWallet}}." },
                        slug: { type: "string", description: "Shop slug. Use {{shopSlug}}." },
                        args: {
                            type: "object",
                            properties: {
                                slug: { type: "string", description: "Shop slug identifier. Use {{shopSlug}}." },
                            },
                        },
                    },
                },
            },
        },
        {
            type: "webhook",
            name: "getInventory",
            description: "Search and browse shop inventory with filters: query (keywords), category, inStockOnly, priceMin, priceMax, sort (name-asc, name-desc, price-asc, price-desc, recent).",
            api_schema: {
                url: `${webhookBase}/api/agent/voice/call-tool`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                request_body: {
                    type: "object",
                    properties: {
                        toolName: { type: "string", enum: ["getInventory"] },
                        wallet: { type: "string", description: "Merchant wallet. Use {{merchantWallet}}." },
                        slug: { type: "string", description: "Shop slug. Use {{shopSlug}}." },
                        args: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "Search keywords" },
                                category: { type: "string", description: "Category filter" },
                                inStockOnly: { type: "boolean", description: "Only in-stock items" },
                                priceMin: { type: "number", description: "Minimum price" },
                                priceMax: { type: "number", description: "Maximum price" },
                                sort: { type: "string", description: "Sort order" },
                            },
                        },
                    },
                },
            },
        },
        {
            type: "webhook",
            name: "getInventoryPage",
            description: "Get a specific page of inventory results. Fixed pageSize=30. Use page parameter to paginate.",
            api_schema: {
                url: `${webhookBase}/api/agent/voice/call-tool`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                request_body: {
                    type: "object",
                    properties: {
                        toolName: { type: "string", enum: ["getInventoryPage"] },
                        wallet: { type: "string", description: "Merchant wallet. Use {{merchantWallet}}." },
                        slug: { type: "string", description: "Shop slug. Use {{shopSlug}}." },
                        args: {
                            type: "object",
                            properties: {
                                page: { type: "number", description: "Page number (1-based)" },
                                query: { type: "string" },
                                category: { type: "string" },
                                inStockOnly: { type: "boolean" },
                                priceMin: { type: "number" },
                                priceMax: { type: "number" },
                                sort: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
        {
            type: "webhook",
            name: "getItemModifiers",
            description: "Get modifier groups and variant options for a specific item. Pass id, sku, or name.",
            api_schema: {
                url: `${webhookBase}/api/agent/voice/call-tool`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                request_body: {
                    type: "object",
                    properties: {
                        toolName: { type: "string", enum: ["getItemModifiers"] },
                        wallet: { type: "string", description: "Merchant wallet. Use {{merchantWallet}}." },
                        slug: { type: "string", description: "Shop slug. Use {{shopSlug}}." },
                        args: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                sku: { type: "string" },
                                name: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
        {
            type: "webhook",
            name: "getOwnerAnalytics",
            description: "Get owner-only shop analytics (revenue, orders, etc). Only call for verified owners.",
            api_schema: {
                url: `${webhookBase}/api/agent/voice/call-tool`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                request_body: {
                    type: "object",
                    properties: {
                        toolName: { type: "string", enum: ["getOwnerAnalytics"] },
                        wallet: { type: "string", description: "Merchant wallet. Use {{merchantWallet}}." },
                        slug: { type: "string", description: "Shop slug. Use {{shopSlug}}." },
                        args: {
                            type: "object",
                            properties: {
                                metrics: { type: "string" },
                                range: { type: "string" },
                                sinceMs: { type: "number" },
                            },
                        },
                    },
                },
            },
        },
    ];
}

async function main() {
    console.log(`🔧 Patching Agent: ${AGENT_ID}`);
    console.log(`   Webhook Base: ${WEBHOOK_BASE_URL}`);

    const serverTools = makeServerTools(WEBHOOK_BASE_URL);

    // Combine client and server tools into 'tools' array
    const tools = [
        ...CART_CLIENT_TOOLS.map(t => ({
            type: "client",
            name: t.name,
            description: t.description,
            parameters: t.parameters,
            expects_response: t.expects_response,
            response_timeout_secs: t.response_timeout_secs,
        })),
        ...serverTools
    ];

    const payload = {
        conversation_config: {
            tools: tools
        }
    };

    console.log(`Payload size: ${JSON.stringify(payload).length} chars`);

    const res = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
        method: "PATCH",
        headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        console.error(`❌ Patch failed (${res.status}):`, await res.text());
        return;
    }

    const data = await res.json();
    console.log("✅ Patch successful!");
    console.log("Response:", JSON.stringify(data, null, 2));
}

main();
