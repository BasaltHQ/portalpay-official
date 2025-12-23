import { NextRequest, NextResponse } from "next/server";

/**
 * Server tool registry for the shop voice agent.
 * Returns Azure Realtime-compatible function definitions that the client can include in session.update.
 * 
 * Notes:
 * - Only includes server-executable, read-oriented tools. Cart mutation tools remain client-local.
 * - Tools here should match the names the model will call.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const toolset = url.searchParams.get("toolset") || "shop";

    if (toolset !== "shop") {
      return NextResponse.json({ success: false, error: "unknown_toolset" }, { status: 400 });
    }

    const defs: any[] = [
      {
        type: "function",
        function: {
          name: "getShopDetails",
          description: "Fetch shop configuration and branding details for the current merchant/shop (uses x-wallet header).",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      {
        type: "function",
        function: {
          name: "getShopRating",
          description: "Fetch public shop reviews summary (average rating and count). When slug is omitted, the server derives it from context.",
          parameters: {
            type: "object",
            properties: {
              slug: { type: "string", description: "Optional: shop slug identifier; derived from context when omitted." },
            },
            additionalProperties: true,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getInventory",
          description: "Search and filter inventory items by query, category, price range, and stock status. Returns items with their modifiers/customization options when available (restaurant modifier groups, retail variants, etc.).",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search keywords to match in name, SKU, description, or tags." },
              category: { type: "string", description: "Exact category filter." },
              inStockOnly: { type: "boolean", description: "If true, only items with stock > 0 or unlimited stock (-1) are returned." },
              priceMin: { type: "number", description: "Minimum price filter in USD." },
              priceMax: { type: "number", description: "Maximum price filter in USD." },
              sort: { type: "string", enum: ["name-asc", "name-desc", "price-asc", "price-desc", "recent"], description: "Sort order." },
              includeModifiers: { type: "boolean", description: "If true, include full modifier/customization details for each item. Default true." },
            },
            additionalProperties: true,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getInventoryPage",
          description: "Paginate inventory results (30 items per page) after applying the same filters as getInventory (uses x-wallet header).",
          parameters: {
            type: "object",
            properties: {
              page: { type: "number", minimum: 1, description: "Page number (1-indexed)." },
              query: { type: "string" },
              category: { type: "string" },
              inStockOnly: { type: "boolean" },
              priceMin: { type: "number" },
              priceMax: { type: "number" },
              sort: { type: "string", enum: ["name-asc", "name-desc", "price-asc", "price-desc", "recent"] },
            },
            additionalProperties: true,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getItemModifiers",
          description: "Get detailed modifier/customization options for a specific inventory item. For restaurant items, returns modifier groups (e.g., Size, Toppings, Sides) with their individual modifiers, prices, and requirements. For retail items, returns variant options (e.g., Size, Color). Use this to understand what customizations are available before adding to cart. You can search by item name, ID, or SKU.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The item ID to get modifiers for." },
              sku: { type: "string", description: "Alternative: the item SKU to get modifiers for (if id not provided)." },
              name: { type: "string", description: "Alternative: the item name to search for (if id and sku not provided). Supports partial matching." },
            },
            additionalProperties: true,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "addToCart",
          description: "Add an item to the shopping cart with optional modifiers/customizations. For restaurant items, you can specify selected modifiers from modifier groups. For retail items, you can specify variant selections. Returns the updated cart summary.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The item ID to add to cart." },
              sku: { type: "string", description: "Alternative: the item SKU to add (if id not provided)." },
              qty: { type: "number", minimum: 1, description: "Quantity to add. Default 1." },
              selectedModifiers: {
                type: "array",
                description: "Array of selected modifiers for restaurant items. Each modifier should specify the groupId, modifierId, name, and priceAdjustment.",
                items: {
                  type: "object",
                  properties: {
                    groupId: { type: "string", description: "The modifier group ID this selection belongs to." },
                    modifierId: { type: "string", description: "The specific modifier ID selected." },
                    name: { type: "string", description: "Display name of the modifier." },
                    priceAdjustment: { type: "number", description: "Price adjustment for this modifier (can be positive, negative, or 0)." },
                    quantity: { type: "number", description: "Quantity of this modifier if applicable (default 1)." },
                  },
                  required: ["groupId", "modifierId"],
                },
              },
              selectedVariant: {
                type: "object",
                description: "Selected variant for retail items (Size, Color, etc.).",
                properties: {
                  variantId: { type: "string", description: "The variant ID." },
                  sku: { type: "string", description: "Variant-specific SKU." },
                  attributes: { type: "object", description: "Key-value pairs of variant attributes (e.g., {size: 'Large', color: 'Blue'})." },
                  priceAdjustment: { type: "number", description: "Price adjustment for this variant." },
                },
              },
              specialInstructions: { type: "string", description: "Special instructions or notes for this item." },
            },
            additionalProperties: true,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "updateCartItem",
          description: "Update an item already in the cart - change quantity or modify selections. Can also remove items by setting qty to 0.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The item ID in the cart to update." },
              qty: { type: "number", minimum: 0, description: "New quantity. Set to 0 to remove the item." },
              selectedModifiers: {
                type: "array",
                description: "Updated modifier selections (replaces existing). Omit to keep existing modifiers.",
                items: {
                  type: "object",
                  properties: {
                    groupId: { type: "string" },
                    modifierId: { type: "string" },
                    name: { type: "string" },
                    priceAdjustment: { type: "number" },
                    quantity: { type: "number" },
                  },
                },
              },
            },
            required: ["id"],
            additionalProperties: true,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "clearCart",
          description: "Remove all items from the shopping cart.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      {
        type: "function",
        function: {
          name: "getCartSummary",
          description: "Get the current shopping cart contents including all items, their quantities, selected modifiers, and the subtotal.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      {
        type: "function",
        function: {
          name: "getOwnerAnalytics",
          description: "Get analytics for merchant owner (requires owner authentication). Returns metrics like revenue, orders, customers.",
          parameters: {
            type: "object",
            properties: {
              metrics: { type: "string", description: "Comma-separated metric names to retrieve." },
              range: { type: "string", enum: ["all", "24h", "7d", "30d"], description: "Time range for analytics." },
              sinceMs: { type: "number", minimum: 0, description: "Custom start time in epoch milliseconds (overrides range)." },
            },
            additionalProperties: true,
          },
        },
      },
    ];

    return NextResponse.json(defs);
  } catch (err: any) {
    console.error("[api/agent/tools] error:", err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || "unknown_error" }, { status: 500 });
  }
}
