
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import fetch from "node-fetch";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID_CONCIERGE || "";
const API_BASE = "https://api.elevenlabs.io/v1";

if (!ELEVENLABS_API_KEY) {
    console.error("❌ Missing ELEVENLABS_API_KEY");
    process.exit(1);
}
if (!AGENT_ID) {
    console.error("❌ Missing ELEVENLABS_AGENT_ID_CONCIERGE");
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL CLIENT TOOLS — Parameter names MUST match shopTools.ts exactly
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_TOOLS = [
    // ── Shop Info ──
    {
        name: "getShopDetails",
        description: "Get the shop's name, description, bio, theme, and slug. No arguments needed.",
        parameters: { type: "object", properties: {}, required: [] },
        expects_response: true
    },
    {
        name: "getShopRating",
        description: "Get the shop's average rating and review count. No arguments needed.",
        parameters: { type: "object", properties: {}, required: [] },
        expects_response: true
    },

    // ── Inventory ──
    {
        name: "searchInventory",
        description: "Search the shop's inventory. Returns items matching name, description, category, or tags. Use this when the customer asks about available items, categories, or searches for something specific.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search keyword or phrase to match against item name, description, category, or tags" },
                category: { type: "string", description: "Exact category name to filter by (optional)" },
                inStockOnly: { type: "boolean", description: "If true, only return items currently in stock" },
                priceMin: { type: "number", description: "Minimum price filter in USD (optional)" },
                priceMax: { type: "number", description: "Maximum price filter in USD (optional)" },
                sort: { type: "string", description: "Sort order: name-asc, name-desc, price-asc, price-desc, recent (default: name-asc)" }
            },
            required: []
        },
        expects_response: true
    },
    {
        name: "getInventoryPage",
        description: "Get a paginated page of inventory items (30 per page). Use for browsing large catalogs.",
        parameters: {
            type: "object",
            properties: {
                page: { type: "number", description: "Page number (1-indexed, default: 1)" },
                query: { type: "string", description: "Optional search query" },
                category: { type: "string", description: "Optional category filter" },
                inStockOnly: { type: "boolean", description: "If true, only in-stock items" },
                priceMin: { type: "number", description: "Minimum price (optional)" },
                priceMax: { type: "number", description: "Maximum price (optional)" },
                sort: { type: "string", description: "Sort order (optional)" }
            },
            required: []
        },
        expects_response: true
    },
    {
        name: "getItemModifiers",
        description: "Get detailed modifier/customization options for a specific menu or product item. Use this before adding items with customizations to know what options are available. Can look up by id, sku, or name.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Item ID to look up" },
                sku: { type: "string", description: "Item SKU to look up (alternative to id)" },
                name: { type: "string", description: "Item name to search for (alternative to id/sku)" }
            },
            required: []
        },
        expects_response: true
    },

    // ── Cart Operations ──
    {
        name: "addToCart",
        description: "Add an item to the customer's cart. Pass the item 'id' from inventory results. Default qty is 1. For items with modifiers, pass selectedModifiers array. For items with variants, pass selectedVariant object.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The item ID from inventory results" },
                sku: { type: "string", description: "Alternative: item SKU (if id not available)" },
                qty: { type: "number", description: "Quantity to add (default: 1)" },
                selectedModifiers: {
                    type: "array",
                    description: "Array of selected modifiers for restaurant items",
                    items: {
                        type: "object",
                        properties: {
                            groupId: { type: "string", description: "Modifier group ID" },
                            modifierId: { type: "string", description: "Modifier option ID" },
                            name: { type: "string", description: "Modifier name (e.g. Extra Cheese)" },
                            priceAdjustment: { type: "number", description: "Price adjustment in USD" },
                            quantity: { type: "number", description: "Modifier quantity (default 1)" }
                        }
                    }
                },
                selectedVariant: {
                    type: "object",
                    description: "Selected variant for retail items. Should have: variantId, sku, attributes, priceAdjustment"
                },
                specialInstructions: { type: "string", description: "Special instructions for this item (optional)" }
            },
            required: ["id"]
        },
        expects_response: true
    },
    {
        name: "editCartItem",
        description: "Edit an existing cart item's modifiers or quantity by its line index (0-based). Use getCartSummary first to see current items and their indices.",
        parameters: {
            type: "object",
            properties: {
                lineIndex: { type: "number", description: "0-based index of the cart item to edit" },
                qty: { type: "number", description: "New quantity (optional, keeps current if not specified)" },
                selectedModifiers: {
                    type: "array",
                    description: "New modifiers to replace existing ones",
                    items: {
                        type: "object",
                        properties: {
                            groupId: { type: "string", description: "Modifier group ID" },
                            modifierId: { type: "string", description: "Modifier option ID" },
                            name: { type: "string", description: "Modifier name" },
                            priceAdjustment: { type: "number", description: "Price adjustment in USD" },
                            quantity: { type: "number", description: "Modifier quantity (default 1)" }
                        }
                    }
                },
                selectedVariant: {
                    type: "object",
                    description: "New variant selection to replace existing"
                },
                specialInstructions: { type: "string", description: "New special instructions (optional)" }
            },
            required: ["lineIndex"]
        },
        expects_response: true
    },
    {
        name: "removeFromCart",
        description: "Remove a specific item from the cart by its line index (0-based). Use getCartSummary first to see current items and their indices.",
        parameters: {
            type: "object",
            properties: {
                lineIndex: { type: "number", description: "0-based index of the cart item to remove" }
            },
            required: ["lineIndex"]
        },
        expects_response: true
    },
    {
        name: "updateCartItemQty",
        description: "Update the quantity of a cart item by its item ID. Set qty to 0 to remove it.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The item ID in the cart" },
                qty: { type: "number", description: "New quantity (0 to remove)" }
            },
            required: ["id", "qty"]
        },
        expects_response: true
    },
    {
        name: "clearCart",
        description: "Remove all items from the cart. No arguments needed.",
        parameters: { type: "object", properties: {}, required: [] },
        expects_response: true
    },
    {
        name: "getCartSummary",
        description: "Get the current cart contents including all items, quantities, prices, modifiers, and subtotal.",
        parameters: { type: "object", properties: {}, required: [] },
        expects_response: true
    },

    // ── Owner Only ──
    {
        name: "getOwnerAnalytics",
        description: "Get shop analytics data (owner only). Returns GMV, order count, AOV, top items, etc.",
        parameters: {
            type: "object",
            properties: {
                metrics: { type: "string", description: "Comma-separated list of metrics to fetch (optional, uses defaults)" },
                range: { type: "string", description: "Time range: 7d, 30d, 90d, all (optional)" }
            },
            required: []
        },
        expects_response: true
    },

    // ── Full Catalog ──
    {
        name: "getAllInventory",
        description: "Get the ENTIRE shop inventory in one call. Returns all items with id, name, price, category, stock status, and whether they have modifiers. Use this for full catalog awareness or when the customer asks 'what do you have?' without a specific search term.",
        parameters: { type: "object", properties: {}, required: [] },
        expects_response: true
    },

    // ── Agent Self-Management ──
    {
        name: "changeLanguage",
        description: "Switch the agent's spoken language. Call this when the customer speaks or requests a different language. Valid codes: en, zh, es, hi, pt, fr, de, ja, ar, ko, id, it, nl, tr, pl, ru, sv, tl, ms, ro, uk, el, cs, da, fi, bg, hr, sk, ta, vi, no, hu, pt-br, fil, af, hy, as, az, be, bn, bs, ca, et, gl, ka, gu, ha, he, is, ga, jv, kn, kk, ky, lv, lt, lb, mk, ml, mr, ne, ps, fa, pa, sr, sd, sl, so, sw, te, th, ur, cy. After changing, inform the customer the conversation will restart in the new language.",
        parameters: {
            type: "object",
            properties: {
                language: { type: "string", description: "ISO language code (e.g. 'es' for Spanish, 'fr' for French, 'ja' for Japanese)" }
            },
            required: ["language"]
        },
        expects_response: true
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// Logic
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`🚀 Reprovisioning Agent ${AGENT_ID} — ${CLIENT_TOOLS.length} Client Tools`);

    // 1. List & delete existing tools
    console.log("\n🔍 Listing existing tools...");
    const listRes = await fetch(`${API_BASE}/convai/tools`, { headers: { "xi-api-key": ELEVENLABS_API_KEY } });
    const listData: any = await listRes.json();
    const existingTools = listData.tools || [];
    console.log(`Found ${existingTools.length} tools on account.`);

    const targetNames = new Set(CLIENT_TOOLS.map(t => t.name));

    for (const tool of existingTools) {
        if (!tool || !tool.name) continue;
        if (targetNames.has(tool.name) || tool.name.startsWith("test_") || tool.name === "viewCart") {
            console.log(`🗑️ Deleting: ${tool.name} (${tool.id})`);
            await fetch(`${API_BASE}/convai/tools/${tool.id}`, {
                method: "DELETE",
                headers: { "xi-api-key": ELEVENLABS_API_KEY }
            });
        }
    }

    // 2. Create all Client Tools
    const newToolIds: string[] = [];
    console.log("\n🛠️ Creating Client Tools...");

    for (const def of CLIENT_TOOLS) {
        const payload = {
            name: def.name,
            type: "client",
            tool_config: {
                type: "client",
                name: def.name,
                description: def.description,
                expects_response: def.expects_response,
                parameters: {
                    type: "object",
                    required: def.parameters.required || [],
                    properties: def.parameters.properties
                }
            }
        };

        const res = await fetch(`${API_BASE}/convai/tools`, {
            method: "POST",
            headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`❌ Failed to create ${def.name}:`, await res.text());
            continue;
        }
        const data: any = await res.json();
        const id = data.tool_id || data.id;
        console.log(`✅ ${def.name}: ${id}`);
        newToolIds.push(id);
    }

    // 3. Link to Agent
    console.log(`\n🔗 Linking ${newToolIds.length} tools to agent ${AGENT_ID}...`);

    const patchRes = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
        method: "PATCH",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
            conversation_config: {
                agent: {
                    prompt: {
                        tool_ids: newToolIds
                    }
                }
            }
        })
    });

    if (!patchRes.ok) {
        console.error(`❌ Failed to patch agent:`, await patchRes.text());
        return;
    }
    await patchRes.json();
    console.log(`✅ Agent patched with ${newToolIds.length} tools!`);
    console.log("\n📋 Tools provisioned:");
    CLIENT_TOOLS.forEach(t => console.log(`   • ${t.name}`));
}

main();
