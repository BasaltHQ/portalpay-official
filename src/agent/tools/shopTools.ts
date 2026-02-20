/**
 * Shop Agent Tools
 * A registry of tool handlers the voice agent can call to query shop details, ratings,
 * inventory, and manipulate the cart. Owner analytics are gated and fetched via a server API.
 *
 * These tools are designed to be stateless where possible and call existing REST APIs.
 * Cart operations are wired to the shop page's local state via function props.
 */

export type ToolResult<T = any> = { ok: true; data: T } | { ok: false; error: string };

export type ToolHandler = (args: Record<string, any>) => Promise<ToolResult>;

export type ShopTools = {
  getShopDetails: ToolHandler;
  getShopRating: ToolHandler;
  getInventory: ToolHandler;
  getInventoryPage: ToolHandler;
  getItemModifiers: ToolHandler;
  addToCart: ToolHandler;
  editCartItem: ToolHandler;
  removeFromCart: ToolHandler;
  updateCartItemQty: ToolHandler;
  clearCart: ToolHandler;
  getCartSummary: ToolHandler;
  getOwnerAnalytics: ToolHandler;
  changeLanguage: ToolHandler;
  getAllInventory: ToolHandler;
};

export type BuildShopToolsOptions = {
  slug: string;
  merchantWallet: string;
  isOwner: boolean;
  // Cart ops from the shop page
  addToCartFn: (id: string, qty?: number, attributes?: any) => void;
  updateQtyFn: (id: string, qty: number) => void;
  clearCartFn: () => void;
  getCartSummaryFn: () => {
    items: Array<{ id: string; sku: string; name: string; priceUsd: number; qty: number; lineTotal: number }>;
    subtotal: number;
  };
  // Optional resolver to get item details by id for precise confirmations (avoids relying solely on summary ordering)
  getItemByIdFn?: (id: string) => { id: string; sku: string; name: string; priceUsd: number } | undefined;
};

/**
 * Helper: safe JSON fetch
 */
async function safeJsonFetch(input: RequestInfo | URL, init?: RequestInit): Promise<{ ok: boolean; json: any; status: number }> {
  try {
    const res = await fetch(input, init);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json, status: res.status };
  } catch (e: any) {
    return { ok: false, json: { error: e?.message || "network_error" }, status: 0 };
  }
}

export function buildShopTools(opts: BuildShopToolsOptions): ShopTools {
  const {
    slug,
    merchantWallet,
    isOwner,
    addToCartFn,
    updateQtyFn,
    clearCartFn,
    getCartSummaryFn,
    getItemByIdFn,
  } = opts;

  // Allow React state to flush before reading cart summary
  // React setState is async; immediately reading getCartSummaryFn may return stale data.
  // A short delay ensures the state update is applied and memoized cartList/subtotal reflect the change.
  const waitForCart = (ms = 12) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  // Resolve item details by id, preferring local resolver; fallback to inventory
  const resolveItemById = async (
    id: string,
    fallback?: { id?: string; sku?: string; name?: string; priceUsd?: number }
  ): Promise<{ id: string; sku: string; name: string; priceUsd: number } | undefined> => {
    try {
      if (typeof getItemByIdFn === "function") {
        const it = getItemByIdFn(id);
        if (it) return it;
      }
      if (fallback && typeof fallback === "object") {
        const sku = String(fallback.sku || "");
        const name = String(fallback.name || "");
        const priceUsd = Number(fallback.priceUsd || 0);
        if (name || sku || priceUsd) return { id, sku, name, priceUsd };
      }
      const inv = await getInventory({});
      if (inv.ok && Array.isArray(inv.data)) {
        const m = (inv.data as any[]).find((x) => String(x.id) === String(id));
        if (m) {
          return {
            id: String(m.id || id),
            sku: String(m.sku || ""),
            name: String(m.name || ""),
            priceUsd: Number(m.priceUsd || 0),
          };
        }
      }
    } catch { }
    return undefined;
  };

  // Simple async sleep helper
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  // Attempt to read a stable cart summary after a mutation with validation
  const readStableSummaryAdd = async (itemId: string, unitPrice: number, addedQty: number, predicted: { items: any[]; subtotal: number }) => {
    let best = predicted;
    for (let i = 0; i < 3; i++) {
      await sleep(40);
      try {
        const s = getCartSummaryFn();
        const item = (Array.isArray(s.items) ? s.items : []).find((it: any) => String(it.id) === String(itemId));
        const validItem = !!item && typeof item.qty === "number" && typeof item.lineTotal === "number" && item.lineTotal === unitPrice * item.qty;
        const validSubtotal = typeof s.subtotal === "number" && s.subtotal >= predicted.subtotal && s.subtotal >= unitPrice * addedQty;
        if (validItem && validSubtotal) return s;
      } catch { }
    }
    return best;
  };

  const readStableSummaryUpdate = async (itemId: string, unitPrice: number, newQty: number, predicted: { items: any[]; subtotal: number }) => {
    let best = predicted;
    for (let i = 0; i < 3; i++) {
      await sleep(40);
      try {
        const s = getCartSummaryFn();
        const item = (Array.isArray(s.items) ? s.items : []).find((it: any) => String(it.id) === String(itemId));
        const valid =
          (newQty <= 0 && !item) ||
          (newQty > 0 && !!item && typeof item.qty === "number" && typeof item.lineTotal === "number" && item.lineTotal === unitPrice * newQty);
        const validSubtotal = typeof s.subtotal === "number" && (newQty <= 0 ? s.subtotal <= predicted.subtotal : s.subtotal >= unitPrice * newQty);
        if (valid && validSubtotal) return s;
      } catch { }
    }
    return best;
  };

  const readStableSummaryClear = async () => {
    for (let i = 0; i < 3; i++) {
      await sleep(40);
      try {
        const s = getCartSummaryFn();
        if (Array.isArray(s.items) && s.items.length === 0 && Number(s.subtotal || 0) === 0) return s;
      } catch { }
    }
    return { items: [], subtotal: 0 };
  };

  const getShopDetails: ToolHandler = async () => {
    const { ok, json, status } = await safeJsonFetch("/api/shop/config", {
      cache: "no-store",
      headers: { "x-wallet": merchantWallet },
    });
    if (!ok) return { ok: false, error: json?.error || `shop_config_failed_${status}` };
    const cfg = json?.config || {};
    return {
      ok: true,
      data: {
        name: String(cfg?.name || ""),
        description: String(cfg?.description || ""),
        bio: String(cfg?.bio || ""),
        theme: {
          primaryColor: String(cfg?.theme?.primaryColor || ""),
          secondaryColor: String(cfg?.theme?.secondaryColor || ""),
          textColor: String(cfg?.theme?.textColor || ""),
          fontFamily: String(cfg?.theme?.fontFamily || ""),
          logoShape: cfg?.theme?.logoShape === "circle" ? "circle" : "square",
        },
        slug,
        wallet: merchantWallet,
      },
    };
  };

  const getShopRating: ToolHandler = async () => {
    const { ok, json, status } = await safeJsonFetch(`/api/reviews?subjectType=shop&subjectId=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!ok) return { ok: false, error: json?.error || `reviews_failed_${status}` };
    const items: any[] = Array.isArray(json?.items) ? json.items : [];
    const count = items.length;
    const avg = count ? items.reduce((s, rv) => s + Number(rv?.rating || 0), 0) / count : 0;
    return { ok: true, data: { average: +avg.toFixed(2), count } };
  };

  /**
   * Extract modifier/customization information from item attributes
   */
  const extractModifierInfo = (attrs: any): any => {
    if (!attrs || typeof attrs !== "object") return null;

    // Handle restaurant attributes
    if (attrs.type === "restaurant" && attrs.data) {
      const data = attrs.data;
      return {
        industryType: "restaurant",
        modifierGroups: Array.isArray(data.modifierGroups) ? data.modifierGroups.map((g: any) => ({
          id: String(g.id || ""),
          name: String(g.name || ""),
          required: Boolean(g.required),
          minSelect: Number(g.minSelect || 0),
          maxSelect: g.maxSelect != null ? Number(g.maxSelect) : undefined,
          selectionType: g.selectionType || "multiple",
          sortOrder: Number(g.sortOrder || 0),
          modifiers: Array.isArray(g.modifiers) ? g.modifiers.map((m: any) => ({
            id: String(m.id || ""),
            name: String(m.name || ""),
            priceAdjustment: Number(m.priceAdjustment || 0),
            default: Boolean(m.default),
            available: m.available !== false,
            sortOrder: Number(m.sortOrder || 0),
          })) : [],
        })) : [],
        dietaryTags: Array.isArray(data.dietaryTags) ? data.dietaryTags : [],
        spiceLevel: typeof data.spiceLevel === "number" ? data.spiceLevel : undefined,
        calories: typeof data.calories === "number" ? data.calories : undefined,
        prepTime: data.prepTime,
        allergens: Array.isArray(data.allergens) ? data.allergens : [],
      };
    }

    // Handle retail attributes
    if (attrs.type === "retail" && attrs.data) {
      const data = attrs.data;
      return {
        industryType: "retail",
        variationGroups: Array.isArray(data.variationGroups) ? data.variationGroups.map((g: any) => ({
          id: String(g.id || ""),
          name: String(g.name || ""),
          type: g.type || "preset",
          required: Boolean(g.required),
          values: Array.isArray(g.values) ? g.values : [],
          priceAdjustments: g.priceAdjustments || {},
          displayType: g.displayType || "dropdown",
          sortOrder: Number(g.sortOrder || 0),
        })) : [],
        variants: Array.isArray(data.variants) ? data.variants.map((v: any) => ({
          id: String(v.id || ""),
          sku: String(v.sku || ""),
          attributes: v.attributes || {},
          priceAdjustment: Number(v.priceAdjustment || 0),
          stockQty: Number(v.stockQty || 0),
          barcode: v.barcode,
        })) : [],
        brand: data.brand,
        materials: Array.isArray(data.materials) ? data.materials : [],
      };
    }

    // Handle general/legacy attributes that might have modifierGroups directly
    if (attrs.type === "general" && attrs.data) {
      const data = attrs.data;
      if (Array.isArray(data.modifierGroups) && data.modifierGroups.length > 0) {
        return {
          industryType: "restaurant",
          modifierGroups: data.modifierGroups.map((g: any) => ({
            id: String(g.id || ""),
            name: String(g.name || ""),
            required: Boolean(g.required),
            minSelect: Number(g.minSelect || 0),
            maxSelect: g.maxSelect != null ? Number(g.maxSelect) : undefined,
            selectionType: g.selectionType || "multiple",
            sortOrder: Number(g.sortOrder || 0),
            modifiers: Array.isArray(g.modifiers) ? g.modifiers.map((m: any) => ({
              id: String(m.id || ""),
              name: String(m.name || ""),
              priceAdjustment: Number(m.priceAdjustment || 0),
              default: Boolean(m.default),
              available: m.available !== false,
              sortOrder: Number(m.sortOrder || 0),
            })) : [],
          })),
          dietaryTags: Array.isArray(data.dietaryTags) ? data.dietaryTags : [],
          spiceLevel: typeof data.spiceLevel === "number" ? data.spiceLevel : undefined,
        };
      }
    }

    // Handle top-level modifierGroups (legacy format)
    if (Array.isArray(attrs.modifierGroups) && attrs.modifierGroups.length > 0) {
      return {
        industryType: "restaurant",
        modifierGroups: attrs.modifierGroups.map((g: any) => ({
          id: String(g.id || ""),
          name: String(g.name || ""),
          required: Boolean(g.required),
          minSelect: Number(g.minSelect || 0),
          maxSelect: g.maxSelect != null ? Number(g.maxSelect) : undefined,
          selectionType: g.selectionType || "multiple",
          sortOrder: Number(g.sortOrder || 0),
          modifiers: Array.isArray(g.modifiers) ? g.modifiers.map((m: any) => ({
            id: String(m.id || ""),
            name: String(m.name || ""),
            priceAdjustment: Number(m.priceAdjustment || 0),
            default: Boolean(m.default),
            available: m.available !== false,
            sortOrder: Number(m.sortOrder || 0),
          })) : [],
        })),
        dietaryTags: Array.isArray(attrs.dietaryTags) ? attrs.dietaryTags : [],
        spiceLevel: typeof attrs.spiceLevel === "number" ? attrs.spiceLevel : undefined,
      };
    }

    return null;
  };

  /**
   * Return the ENTIRE inventory in one call — no filters, no pagination.
   * Useful when the agent needs full catalog awareness ("perfect knowledge").
   */
  const getAllInventory: ToolHandler = async () => {
    const { ok, json, status } = await safeJsonFetch("/api/inventory", {
      cache: "no-store",
      headers: { "x-wallet": merchantWallet },
    });
    if (!ok) return { ok: false, error: json?.error || `inventory_failed_${status}` };
    const items: any[] = Array.isArray(json?.items) ? json.items : [];

    // Extract essential fields for each item
    const catalog = items
      .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
      .map((it) => ({
        id: it.id,
        sku: it.sku || undefined,
        name: it.name,
        description: it.description || undefined,
        category: it.category || undefined,
        priceUsd: it.priceUsd,
        inStock: it.stockQty === -1 || (it.stockQty ?? 0) > 0,
        tags: Array.isArray(it.tags) && it.tags.length ? it.tags : undefined,
        hasModifiers: !!(it.attributes?.modifierGroups?.length || it.attributes?.variants?.length),
      }));

    return {
      ok: true,
      data: {
        totalItems: catalog.length,
        items: catalog,
      },
    };
  };

  const getInventory: ToolHandler = async (args) => {
    const {
      query = "",
      category = "",
      inStockOnly = false,
      priceMin = 0,
      priceMax = Number.MAX_SAFE_INTEGER,
      sort = "name-asc",
      includeModifiers = true
    } = args || {};
    const { ok, json, status } = await safeJsonFetch("/api/inventory", {
      cache: "no-store",
      headers: { "x-wallet": merchantWallet },
    });
    if (!ok) return { ok: false, error: json?.error || `inventory_failed_${status}` };
    let items: any[] = Array.isArray(json?.items) ? json.items : [];
    const q = String(query || "").toLowerCase().trim();

    // Filter
    if (q) {
      items = items.filter((it) =>
        String(it?.name || "").toLowerCase().includes(q) ||
        String(it?.sku || "").toLowerCase().includes(q) ||
        String(it?.description || "").toLowerCase().includes(q) ||
        String(it?.category || "").toLowerCase().includes(q) ||
        (Array.isArray(it?.tags) ? it.tags : []).some((t: any) => String(t).toLowerCase().includes(q))
      );
    }
    if (category) {
      items = items.filter((it) => String(it?.category || "") === String(category));
    }
    items = items.filter((it) => {
      const price = Number(it?.priceUsd || 0);
      return price >= Number(priceMin) && price <= Number(priceMax);
    });
    if (inStockOnly) {
      items = items.filter((it) => {
        const stock = Number(it?.stockQty);
        return stock === -1 || stock > 0;
      });
    }

    // Sort
    items.sort((a, b) => {
      switch (String(sort)) {
        case "name-asc":
          return String(a?.name || "").localeCompare(String(b?.name || ""));
        case "name-desc":
          return String(b?.name || "").localeCompare(String(a?.name || ""));
        case "price-asc":
          return Number(a?.priceUsd || 0) - Number(b?.priceUsd || 0);
        case "price-desc":
          return Number(b?.priceUsd || 0) - Number(a?.priceUsd || 0);
        case "recent":
          return Number(b?.createdAt || 0) - Number(a?.createdAt || 0);
        default:
          return 0;
      }
    });

    return {
      ok: true, data: items.map((it) => {
        const base: any = {
          id: String(it?.id || ""),
          sku: String(it?.sku || ""),
          name: String(it?.name || ""),
          priceUsd: Number(it?.priceUsd || 0),
          stockQty: Number(it?.stockQty || 0),
          category: typeof it?.category === "string" ? String(it?.category) : undefined,
          description: typeof it?.description === "string" ? String(it?.description) : undefined,
          tags: Array.isArray(it?.tags) ? it?.tags : [],
          images: Array.isArray(it?.images) ? it?.images : [],
        };

        // Include modifier information if requested
        if (includeModifiers && it?.attributes) {
          const modifierInfo = extractModifierInfo(it.attributes);
          if (modifierInfo) {
            base.customization = modifierInfo;
            // Add a summary for quick reference
            if (modifierInfo.industryType === "restaurant" && modifierInfo.modifierGroups?.length > 0) {
              base.hasModifiers = true;
              base.modifierGroupCount = modifierInfo.modifierGroups.length;
              base.requiredGroups = modifierInfo.modifierGroups.filter((g: any) => g.required).map((g: any) => g.name);
            } else if (modifierInfo.industryType === "retail" && modifierInfo.variationGroups?.length > 0) {
              base.hasVariants = true;
              base.variantGroupCount = modifierInfo.variationGroups.length;
              base.variantCount = modifierInfo.variants?.length || 0;
            }
          }
        }

        return base;
      })
    };
  };

  /**
   * Get detailed modifier/customization information for a specific item
   */
  const getItemModifiers: ToolHandler = async (args) => {
    const idOrSku = String(args?.id || args?.sku || "").trim();
    const nameQuery = String(args?.name || "").trim().toLowerCase();

    // Require at least one search parameter
    if (!idOrSku && !nameQuery) {
      return { ok: false, error: "missing_item_identifier: provide id, sku, or name" };
    }

    // Fetch full inventory to find the item
    const { ok, json, status } = await safeJsonFetch("/api/inventory", {
      cache: "no-store",
      headers: { "x-wallet": merchantWallet },
    });
    if (!ok) return { ok: false, error: json?.error || `inventory_failed_${status}` };

    const items: any[] = Array.isArray(json?.items) ? json.items : [];

    let item: any = null;

    // Priority 1: Find by exact ID
    if (idOrSku) {
      item = items.find((x) => String(x.id) === String(idOrSku));
    }

    // Priority 2: Find by exact SKU
    if (!item && args?.sku) {
      item = items.find((x) => String(x.sku).toLowerCase() === String(args.sku).toLowerCase());
    }

    // Priority 3: Try SKU match with idOrSku value
    if (!item && idOrSku) {
      item = items.find((x) => String(x.sku).toLowerCase() === String(idOrSku).toLowerCase());
    }

    // Priority 4: Find by name (exact match first, then partial match)
    if (!item && nameQuery) {
      // Try exact name match first
      item = items.find((x) => String(x.name || "").toLowerCase() === nameQuery);

      // If no exact match, try partial match (name contains query or query contains name)
      if (!item) {
        item = items.find((x) => {
          const itemName = String(x.name || "").toLowerCase();
          return itemName.includes(nameQuery) || nameQuery.includes(itemName);
        });
      }

      // If still no match, try fuzzy matching on words
      if (!item) {
        const queryWords = nameQuery.split(/\s+/).filter(w => w.length > 2);
        if (queryWords.length > 0) {
          item = items.find((x) => {
            const itemName = String(x.name || "").toLowerCase();
            // Match if any significant word from query is in the name
            return queryWords.some(word => itemName.includes(word));
          });
        }
      }
    }

    if (!item) {
      return { ok: false, error: `item_not_found: no item matching ${idOrSku || nameQuery}` };
    }

    const modifierInfo = extractModifierInfo(item.attributes);

    return {
      ok: true,
      data: {
        id: String(item.id || ""),
        sku: String(item.sku || ""),
        name: String(item.name || ""),
        priceUsd: Number(item.priceUsd || 0),
        industryType: item.industryPack || modifierInfo?.industryType || "general",
        customization: modifierInfo,
        // Provide human-readable summary
        summary: modifierInfo ? {
          hasCustomization: true,
          ...(modifierInfo.industryType === "restaurant" ? {
            type: "restaurant",
            groupCount: modifierInfo.modifierGroups?.length || 0,
            requiredGroups: (modifierInfo.modifierGroups || []).filter((g: any) => g.required).map((g: any) => ({
              name: g.name,
              minSelect: g.minSelect || 1,
              maxSelect: g.maxSelect,
              options: g.modifiers?.map((m: any) => ({
                name: m.name,
                price: m.priceAdjustment ? `${m.priceAdjustment >= 0 ? '+' : ''}$${m.priceAdjustment.toFixed(2)}` : 'no charge',
              })),
            })),
            optionalGroups: (modifierInfo.modifierGroups || []).filter((g: any) => !g.required).map((g: any) => ({
              name: g.name,
              options: g.modifiers?.map((m: any) => ({
                name: m.name,
                price: m.priceAdjustment ? `${m.priceAdjustment >= 0 ? '+' : ''}$${m.priceAdjustment.toFixed(2)}` : 'no charge',
              })),
            })),
            dietaryTags: modifierInfo.dietaryTags,
            spiceLevel: modifierInfo.spiceLevel,
            allergens: modifierInfo.allergens,
          } : {}),
          ...(modifierInfo.industryType === "retail" ? {
            type: "retail",
            variationCount: modifierInfo.variationGroups?.length || 0,
            variations: (modifierInfo.variationGroups || []).map((g: any) => ({
              name: g.name,
              required: g.required,
              values: g.values,
              priceAdjustments: g.priceAdjustments,
            })),
            variantCount: modifierInfo.variants?.length || 0,
          } : {}),
        } : { hasCustomization: false },
      },
    };
  };

  // Pagination helper: fixed 30 items per page, with filters applied same as getInventory
  const getInventoryPage: ToolHandler = async (args) => {
    const page = Math.max(1, Number(args?.page || 1));
    // Enforce 30 items per page regardless of input
    const pageSize = 30;

    // Reuse getInventory for filtering/sorting
    const baseArgs = {
      query: args?.query,
      category: args?.category,
      inStockOnly: args?.inStockOnly,
      priceMin: args?.priceMin,
      priceMax: args?.priceMax,
      sort: args?.sort,
    };
    const inv = await getInventory(baseArgs);
    if (!inv.ok) return inv;
    const list: any[] = Array.isArray(inv.data) ? (inv.data as any[]) : [];
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const clampedPage = Math.min(page, totalPages);
    const start = (clampedPage - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    return {
      ok: true,
      data: {
        page: clampedPage,
        pageSize,
        total,
        totalPages,
        hasPrev: clampedPage > 1,
        hasNext: clampedPage < totalPages,
        items,
      },
    };
  };

  const addToCart: ToolHandler = async (args) => {
    // Accepts id, itemId, or sku; default qty=1
    const idOrSku = String(args?.id || args?.itemId || args?.sku || "");
    const qty = Math.max(1, Number(args?.qty || args?.quantity || 1));
    if (!idOrSku) return { ok: false, error: "missing_item_id_or_sku" };

    // Resolve ID (and capture resolved item if we looked up by sku)
    let itemId = idOrSku;
    let resolvedItem: any | undefined = undefined;
    if (args?.sku && !args?.id) {
      const inv = await getInventory({ query: args?.sku, includeModifiers: true });
      if (!inv.ok) return inv;
      const match = (inv.data as any[]).find((x) => String(x.sku).toLowerCase() === String(args?.sku).toLowerCase());
      itemId = match?.id || "";
      resolvedItem = match;
      if (!itemId) return { ok: false, error: "sku_not_found" };
    } else {
      // Resolve item details including modifiers
      const inv = await getInventory({ includeModifiers: true });
      if (inv.ok) {
        resolvedItem = (inv.data as any[]).find((x) => String(x.id) === String(itemId));
      }
    }

    // Build the attributes object to pass to addToCartFn
    // This handles both the new structured format and legacy format
    const attributes: any = {};

    // Handle selectedModifiers (restaurant-style modifiers)
    if (Array.isArray(args?.selectedModifiers) && args.selectedModifiers.length > 0) {
      attributes.selectedModifiers = args.selectedModifiers.map((m: any) => ({
        groupId: String(m.groupId || m.group || ""),
        modifierId: String(m.modifierId || m.id || ""),
        name: String(m.name || ""),
        priceAdjustment: Number(m.priceAdjustment || m.price || 0),
        quantity: Math.max(1, Number(m.quantity || m.qty || 1)),
      }));
    }

    // Handle selectedVariant (retail-style variants)
    if (args?.selectedVariant && typeof args.selectedVariant === "object") {
      const v = args.selectedVariant;
      attributes.selectedVariant = {
        variantId: String(v.variantId || v.id || ""),
        sku: String(v.sku || ""),
        attributes: v.attributes || {},
        priceAdjustment: Number(v.priceAdjustment || 0),
      };
    }

    // Handle special instructions
    if (args?.specialInstructions) {
      attributes.specialInstructions = String(args.specialInstructions);
    }

    // Calculate effective unit price including modifiers
    let basePrice = Number(resolvedItem?.priceUsd || 0);
    let modifierTotal = 0;

    if (attributes.selectedModifiers) {
      modifierTotal = attributes.selectedModifiers.reduce((sum: number, m: any) =>
        sum + (Number(m.priceAdjustment || 0) * Number(m.quantity || 1)), 0);
    }
    if (attributes.selectedVariant?.priceAdjustment) {
      modifierTotal += Number(attributes.selectedVariant.priceAdjustment);
    }

    const effectiveUnitPrice = basePrice + modifierTotal;

    // Build predicted next summary deterministically to avoid read-after-write races
    const prev = getCartSummaryFn();
    const prevItems = Array.isArray(prev.items) ? prev.items.slice() : [];

    // For items with modifiers, we typically add a new line rather than updating existing
    // since different modifier combinations should be separate line items
    const hasModifiers = (attributes.selectedModifiers?.length > 0) || attributes.selectedVariant;

    // Find existing item only if no modifiers, or find exact match with same modifiers
    let idx = -1;
    if (!hasModifiers) {
      idx = prevItems.findIndex((it: any) => String(it.id) === String(itemId));
    }

    // Resolve details for pricing/naming
    const details = await resolveItemById(itemId, resolvedItem);
    if (idx >= 0 && !hasModifiers) {
      const old = prevItems[idx];
      const priceUsd = Number(old.priceUsd ?? details?.priceUsd ?? 0);
      const newQty = Math.max(0, Number(old.qty || 0)) + qty;
      const updated = { ...old, qty: newQty, priceUsd, lineTotal: priceUsd * newQty };
      prevItems[idx] = updated;
    } else {
      const priceUsd = effectiveUnitPrice || Number(details?.priceUsd ?? 0);
      const name = String(details?.name || "");
      const sku = String(details?.sku || "");
      const newItem: any = { id: itemId, sku, name, priceUsd, qty, lineTotal: priceUsd * qty };
      if (attributes.selectedModifiers) {
        newItem.selectedModifiers = attributes.selectedModifiers;
      }
      if (attributes.selectedVariant) {
        newItem.selectedVariant = attributes.selectedVariant;
      }
      prevItems.push(newItem);
    }
    const nextSubtotal = prevItems.reduce((s: number, it: any) => s + Number(it.lineTotal || 0), 0);
    const predicted = { items: prevItems, subtotal: nextSubtotal };

    // Apply actual state change
    try {
      addToCartFn(itemId, qty, Object.keys(attributes).length > 0 ? attributes : undefined);
    } catch (e: any) {
      return { ok: false, error: e?.message || "add_failed" };
    }

    const outSummary = await readStableSummaryAdd(itemId, effectiveUnitPrice || Number(details?.priceUsd ?? 0), qty, predicted);
    const actualItem = (Array.isArray(outSummary.items) ? outSummary.items : []).find((it: any) => String(it.id) === String(itemId));

    // Build response with modifier details
    const addedInfo: any = {
      id: itemId,
      sku: details?.sku ?? actualItem?.sku,
      name: details?.name ?? actualItem?.name,
      qty,
      basePrice: Number(details?.priceUsd ?? 0),
      priceUsd: effectiveUnitPrice || Number(details?.priceUsd ?? actualItem?.priceUsd ?? 0),
    };

    if (attributes.selectedModifiers?.length > 0) {
      addedInfo.selectedModifiers = attributes.selectedModifiers;
      addedInfo.modifierSummary = attributes.selectedModifiers.map((m: any) =>
        `${m.name}${m.priceAdjustment ? ` (+$${m.priceAdjustment.toFixed(2)})` : ''}`
      ).join(", ");
    }
    if (attributes.selectedVariant) {
      addedInfo.selectedVariant = attributes.selectedVariant;
    }
    if (attributes.specialInstructions) {
      addedInfo.specialInstructions = attributes.specialInstructions;
    }

    return {
      ok: true,
      data: {
        ...outSummary,
        added: addedInfo,
      },
    };
  };

  const updateCartItemQty: ToolHandler = async (args) => {
    const id = String(args?.id || "");
    const qty = Math.max(0, Number(args?.qty || 0));
    if (!id) return { ok: false, error: "missing_item_id" };

    // Predict next summary before applying state
    const prev = getCartSummaryFn();
    const prevItems = Array.isArray(prev.items) ? prev.items.slice() : [];
    const idx = prevItems.findIndex((it: any) => String(it.id) === String(id));
    let resolvedName: string | undefined;
    if (qty <= 0) {
      const old = idx >= 0 ? prevItems[idx] : undefined;
      resolvedName = String(old?.name || (await resolveItemById(id))?.name || "");
      if (idx >= 0) prevItems.splice(idx, 1);
    } else {
      if (idx >= 0) {
        const old = prevItems[idx];
        const details = await resolveItemById(id);
        const priceUsd = Number(old.priceUsd ?? details?.priceUsd ?? 0);
        const updated = { ...old, qty, priceUsd, lineTotal: priceUsd * qty };
        prevItems[idx] = updated;
        resolvedName = String(updated.name || "");
      } else {
        const details = await resolveItemById(id);
        const priceUsd = Number(details?.priceUsd ?? 0);
        const name = String(details?.name || "");
        const sku = String(details?.sku || "");
        prevItems.push({ id, sku, name, priceUsd, qty, lineTotal: priceUsd * qty });
        resolvedName = name;
      }
    }
    const nextSubtotal = prevItems.reduce((s: number, it: any) => s + Number(it.lineTotal || 0), 0);
    const predicted = { items: prevItems, subtotal: nextSubtotal };

    // Apply actual state change
    try { updateQtyFn(id, qty); } catch (e: any) { return { ok: false, error: e?.message || "update_failed" }; }

    const outSummary = await readStableSummaryUpdate(id, Number((await resolveItemById(id))?.priceUsd ?? 0), qty, predicted);
    const actualItem2 = (Array.isArray(outSummary.items) ? outSummary.items : []).find((it: any) => String(it.id) === String(id));
    const outName = resolvedName || actualItem2?.name;

    return { ok: true, data: { ...outSummary, updated: { id, qty, name: outName, priceUsd: Number(actualItem2?.priceUsd ?? 0) } } };
  };

  const clearCart: ToolHandler = async () => {
    try { clearCartFn(); } catch (e: any) { return { ok: false, error: e?.message || "clear_failed" }; }
    const s = await readStableSummaryClear();
    return { ok: true, data: { ...s, cleared: true } };
  };

  const getCartSummary: ToolHandler = async () => {
    try {
      const summary = getCartSummaryFn();
      return { ok: true, data: summary };
    } catch (e: any) {
      return { ok: false, error: e?.message || "summary_failed" };
    }
  };

  /**
   * Edit an existing cart item's modifiers (by line index)
   * This allows changing modifiers without removing and re-adding the item
   */
  const editCartItem: ToolHandler = async (args) => {
    const lineIndex = Number(args?.lineIndex ?? args?.index ?? -1);

    // Get current cart
    const cart = getCartSummaryFn();
    const items = Array.isArray(cart.items) ? cart.items : [];

    if (lineIndex < 0 || lineIndex >= items.length) {
      return { ok: false, error: `invalid_line_index: ${lineIndex}. Cart has ${items.length} items (0-indexed).` };
    }

    const existingItem = items[lineIndex] as any;
    const itemId = String(existingItem.id);
    const qty = Number(args?.qty ?? existingItem.qty ?? 1);

    // Build new attributes
    const attributes: any = {};

    // Handle selectedModifiers - replace existing
    if (Array.isArray(args?.selectedModifiers)) {
      attributes.selectedModifiers = args.selectedModifiers.map((m: any) => ({
        groupId: String(m.groupId || m.group || ""),
        modifierId: String(m.modifierId || m.id || ""),
        name: String(m.name || ""),
        priceAdjustment: Number(m.priceAdjustment || m.price || 0),
        quantity: Math.max(1, Number(m.quantity || m.qty || 1)),
      }));
    }

    // Handle selectedVariant
    if (args?.selectedVariant && typeof args.selectedVariant === "object") {
      const v = args.selectedVariant;
      attributes.selectedVariant = {
        variantId: String(v.variantId || v.id || ""),
        sku: String(v.sku || ""),
        attributes: v.attributes || {},
        priceAdjustment: Number(v.priceAdjustment || 0),
      };
    }

    // Handle special instructions
    if (args?.specialInstructions !== undefined) {
      attributes.specialInstructions = String(args.specialInstructions || "");
    }

    // Remove the old item first (by setting qty to 0)
    try {
      updateQtyFn(itemId, 0);
    } catch { }

    await sleep(20);

    // Add back with new modifiers
    try {
      addToCartFn(itemId, qty, Object.keys(attributes).length > 0 ? attributes : undefined);
    } catch (e: any) {
      return { ok: false, error: e?.message || "edit_failed" };
    }

    await sleep(40);

    const newCart = getCartSummaryFn();
    const details = await resolveItemById(itemId);

    // Calculate new unit price
    let basePrice = Number(details?.priceUsd || existingItem.priceUsd || 0);
    let modifierTotal = 0;
    if (attributes.selectedModifiers) {
      modifierTotal = attributes.selectedModifiers.reduce((sum: number, m: any) =>
        sum + (Number(m.priceAdjustment || 0) * Number(m.quantity || 1)), 0);
    }
    if (attributes.selectedVariant?.priceAdjustment) {
      modifierTotal += Number(attributes.selectedVariant.priceAdjustment);
    }

    return {
      ok: true,
      data: {
        ...newCart,
        edited: {
          lineIndex,
          id: itemId,
          name: details?.name || existingItem.name,
          qty,
          basePrice,
          priceUsd: basePrice + modifierTotal,
          selectedModifiers: attributes.selectedModifiers,
          selectedVariant: attributes.selectedVariant,
          modifierSummary: attributes.selectedModifiers?.map((m: any) =>
            `${m.name}${m.priceAdjustment ? ` (+$${m.priceAdjustment.toFixed(2)})` : ''}`
          ).join(", "),
        },
      },
    };
  };

  /**
   * Remove a specific cart item by line index
   */
  const removeFromCart: ToolHandler = async (args) => {
    const lineIndex = Number(args?.lineIndex ?? args?.index ?? -1);

    // Get current cart
    const cart = getCartSummaryFn();
    const items = Array.isArray(cart.items) ? cart.items : [];

    if (lineIndex < 0 || lineIndex >= items.length) {
      return { ok: false, error: `invalid_line_index: ${lineIndex}. Cart has ${items.length} items (0-indexed).` };
    }

    const existingItem = items[lineIndex] as any;
    const itemId = String(existingItem.id);
    const itemName = String(existingItem.name || "");

    // Remove by setting qty to 0
    try {
      updateQtyFn(itemId, 0);
    } catch (e: any) {
      return { ok: false, error: e?.message || "remove_failed" };
    }

    await sleep(40);

    const newCart = getCartSummaryFn();

    return {
      ok: true,
      data: {
        ...newCart,
        removed: {
          lineIndex,
          id: itemId,
          name: itemName,
        },
      },
    };
  };

  const getOwnerAnalytics: ToolHandler = async (args) => {
    if (!isOwner) return { ok: false, error: "not_owner" };

    const qs = new URLSearchParams();
    qs.set("wallet", merchantWallet);

    // Default metrics set suitable for voice summaries; override with args.metrics if provided
    const defaultMetrics =
      "gmvUsd,ordersCount,aovUsd,platformFeeUsd,netRevenueUsd,refundsUsd,refundsCount,customersCount,repeatRate,timeSeriesDaily,topItems,topCustomers";

    if (args && typeof args === "object") {
      const m = String(args.metrics || defaultMetrics);
      if (m) qs.set("metrics", m);

      // Optional time window controls
      const r = String(args.range || "");
      if (r) qs.set("range", r);

      const since = Number(args.sinceMs || 0);
      if (Number.isFinite(since) && since > 0) qs.set("sinceMs", String(since));
    } else {
      qs.set("metrics", defaultMetrics);
    }

    const { ok, json, status } = await safeJsonFetch(`/api/agent/owner-analytics?${qs.toString()}`, { cache: "no-store" });
    if (!ok) return { ok: false, error: json?.error || `owner_analytics_failed_${status}` };
    return { ok: true, data: json?.stats || {} };
  };
  /**
   * Change the agent's language at runtime.
   * Calls our server API which PATCHes the ElevenLabs agent config.
   * The conversation should be restarted after this for the change to take effect.
   */
  const changeLanguage: ToolHandler = async (args) => {
    const language = String(args?.language || "").toLowerCase().trim();
    if (!language) return { ok: false, error: "missing_language_code" };

    const { ok, json, status } = await safeJsonFetch("/api/voice/elevenlabs/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });

    if (!ok) return { ok: false, error: json?.error || `language_change_failed_${status}` };
    return {
      ok: true,
      data: {
        language: json?.language,
        languageName: json?.languageName,
        message: json?.message || `Language switched to ${json?.languageName}. Please restart the conversation.`,
      },
    };
  };

  return {
    getShopDetails,
    getShopRating,
    getInventory,
    getInventoryPage,
    getItemModifiers,
    addToCart,
    editCartItem,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    getCartSummary,
    getOwnerAnalytics,
    changeLanguage,
    getAllInventory,
  };
}
