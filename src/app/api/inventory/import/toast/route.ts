import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { StorageFactory } from "@/lib/storage";
import sharp from "sharp";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";
import type {
  RestaurantModifier,
  RestaurantModifierGroup,
  RestaurantItemAttributes,
} from "@/types/inventory";

/**
 * Toast Menus V2 integration notes (cross-checked with official docs):
 * - Endpoint: GET https://ws-api.toasttab.com/menus/v2/menus
 * - Auth: Authorization: Bearer &quot;token&quot; (OAuth2); header Toast-Restaurant-External-ID: &lt;restaurantGuid&gt;
 * - Response: A single object containing:
 *    {
 *      restaurantGuid,
 *      lastUpdated,
 *      restaurantTimeZone,
 *      menus: [ { name, guid, menuGroups: [...] } ],
 *      modifierGroupReferences: { [id]: { ... } },
 *      modifierOptionReferences: { [id]: { ... } },
 *      preModifierGroupReferences: { ... }
 *    }
 * - Items are found under menus[].menuGroups[].menuItems (menuGroups can be nested).
 * - Items reference modifier groups by &quot;modifierGroupReferences: number[]&quot; (IDs into the top-level dictionary).
 * - Modifier groups then reference modifier options by &quot;modifierOptionReferences: number[]&quot; (IDs into the top-level dictionary).
 *
 * This route resolves references correctly and maps to our RestaurantItemAttributes structure.
 */

type MenusV2Response = {
  restaurantGuid?: string;
  lastUpdated?: string;
  restaurantTimeZone?: string;
  menus?: any[];
  modifierGroupReferences?: Record<string, any>;
  modifierOptionReferences?: Record<string, any>;
  preModifierGroupReferences?: Record<string, any>;
};

function toRestaurantModifier(opt: any, optRefId: number): RestaurantModifier | null {
  if (!opt) return null;
  const visible = Array.isArray(opt.visibility) ? opt.visibility.includes("POS") : true;

  return {
    id: String(opt.guid || optRefId),
    name: String(opt.name || opt.posName || ""),
    priceAdjustment: Number(opt.price || 0),
    default: !!opt.isDefault,
    available: !!visible,
  };
}

function toRestaurantModifierGroup(mg: any, mgRefId: number, optionRefs: Record<string, any>): RestaurantModifierGroup {
  const optionIds: number[] = Array.isArray(mg?.modifierOptionReferences) ? mg.modifierOptionReferences : [];

  const modifiers = optionIds
    .map((optId) => toRestaurantModifier(optionRefs[String(optId)], optId))
    .filter(Boolean) as RestaurantModifier[];

  const minSel = Number(mg?.minSelections || 0);
  const maxSel = Number(
    mg?.maxSelections !== undefined ? mg.maxSelections : mg?.isMultiSelect ? modifiers.length : 1
  );
  const required =
    String(mg?.requiredMode || "").toUpperCase() === "REQUIRED" || minSel > 0;

  return {
    id: String(mg?.guid || mgRefId),
    name: String(mg?.name || mg?.posName || ""),
    required,
    minSelect: minSel,
    maxSelect: maxSel,
    selectionType: mg?.isMultiSelect ? "multiple" : "single",
    modifiers,
  };
}

function resolveModifierGroupsForItem(
  item: any,
  groupRefs: Record<string, any>,
  optionRefs: Record<string, any>
): RestaurantModifierGroup[] {
  const groups: RestaurantModifierGroup[] = [];
  const ids: number[] = Array.isArray(item?.modifierGroupReferences) ? item.modifierGroupReferences : [];
  for (const refId of ids) {
    const mg = groupRefs?.[String(refId)];
    if (!mg) continue;
    groups.push(toRestaurantModifierGroup(mg, refId, optionRefs));
  }
  return groups;
}

function collectItemsFromMenu(
  menu: any,
  refs: { groupRefs: Record<string, any>; optionRefs: Record<string, any> },
  acc: Array<{
    name: string;
    sku: string;
    description: string;
    price: number;
    category: string;
    industryAttributes: { restaurant: RestaurantItemAttributes };
  }>
) {
  const menuName = String(menu?.name || "");

  function visitGroup(group: any, parentName: string) {
    const groupName = String(group?.name || parentName || menuName);

    // Map items
    for (const item of Array.isArray(group?.menuItems) ? group.menuItems : []) {
      const attrs: RestaurantItemAttributes = {
        modifierGroups: resolveModifierGroupsForItem(item, refs.groupRefs, refs.optionRefs),
        menuSection: groupName,
        calories: typeof item?.calories === "number" ? item.calories : undefined,
        // Only true if ONLINE is present in visibility array; do NOT default to true.
        onlineOrderingEnabled: Array.isArray(item?.visibility) ? item.visibility.includes("ONLINE") : false,
      };

      acc.push({
        name: String(item?.name || ""),
        sku: String(item?.sku || item?.plu || item?.guid || ""),
        description: String(item?.description || ""),
        price: Number(item?.price || 0),
        category: String(item?.salesCategory?.name || groupName || menuName),
        industryAttributes: { restaurant: attrs },
        imageToastUrl: item?.image || item?.imageUrl || undefined,
      } as any);
    }

    // Recurse nested groups if any
    for (const child of Array.isArray(group?.menuGroups) ? group.menuGroups : []) {
      visitGroup(child, groupName);
    }
  }

  for (const group of Array.isArray(menu?.menuGroups) ? menu.menuGroups : []) {
    visitGroup(group, menuName);
  }
}

export async function POST(request: NextRequest) {
  try {
    const wallet = await getAuthenticatedWallet(request);
    if (!wallet) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantGuid, clientId, clientSecret } = await request.json();

    if (!restaurantGuid) {
      return NextResponse.json({ error: "Restaurant GUID is required" }, { status: 400 });
    }
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Client ID and Client Secret are required" }, { status: 400 });
    }

    // NOTE: Official docs indicate OAuth2. This implementation keeps the existing login endpoint
    // to avoid breaking changes, but should be migrated to client-credentials OAuth when available in environment.
    const tokenUrl = "https://ws-api.toasttab.com/authentication/v1/authentication/login";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
        userAccessType: "TOAST_MACHINE_CLIENT",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.json(
        { error: "Toast authentication failed", details: errorText },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData?.token?.accessToken || tokenData?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to obtain access token from Toast" }, { status: 401 });
    }

    // Fetch Menus V2 (do NOT append restaurantGuid as query param; header is required)
    const menusUrl = "https://ws-api.toasttab.com/menus/v2/menus";
    const menusResponse = await fetch(menusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Toast-Restaurant-External-ID": restaurantGuid,
      },
    });

    if (!menusResponse.ok) {
      const errorText = await menusResponse.text().catch(() => "");
      // Forward specific statuses as per docs (404 published data missing, 503 outage)
      return NextResponse.json(
        { error: "Failed to fetch menus from Toast", details: errorText },
        { status: menusResponse.status }
      );
    }

    const data: MenusV2Response = await menusResponse.json().catch(() => ({} as any));

    const refs = {
      groupRefs: (data?.modifierGroupReferences || {}) as Record<string, any>,
      optionRefs: (data?.modifierOptionReferences || {}) as Record<string, any>,
    };

    const importedItems: Array<{
      name: string;
      sku: string;
      description: string;
      price: number;
      category: string;
      imageToastUrl?: string;
      industryAttributes: { restaurant: RestaurantItemAttributes };
    }> = [];

    for (const menu of Array.isArray(data?.menus) ? data!.menus! : []) {
      collectItemsFromMenu(menu, refs, importedItems);
    }

    // Fetch existing inventory for this wallet
    const container = await getContainer();
    const { resources: existingItems } = await container.items.query({
      query: "SELECT c.id, c.sku, c.images, c.attributes FROM c WHERE c.type='inventory_item' AND c.wallet=@wallet AND c.industryPack='restaurant'",
      parameters: [{ name: "@wallet", value: wallet }]
    }).fetchAll();

    const existingBySku = new Map<string, any>();
    for (const item of existingItems) {
      if (item.sku) existingBySku.set(String(item.sku).toUpperCase().slice(0, 16), item);
    }

    const storage = StorageFactory.getProvider();
    
    let added = 0;
    let updated = 0;
    let deleted = 0;

    const importedSkus = new Set<string>();
    const CHUNK_SIZE = 10;
    
    // Chunking to prevent serverless execution timeouts and OOM errors on massive menus
    for (let i = 0; i < importedItems.length; i += CHUNK_SIZE) {
      const chunk = importedItems.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item: any) => {
          const itemSku = String(item.sku || "").toUpperCase().slice(0, 16);
          if (!itemSku) return; // Skip items without SKU
          
          importedSkus.add(itemSku);
          const existing = existingBySku.get(itemSku);
          let finalImages = existing?.images || [];

          if ((!existing || finalImages.length === 0) && item.imageToastUrl) {
            try {
              const res = await fetch(item.imageToastUrl);
              if (res.ok) {
                const ab = await res.arrayBuffer();
                let buffer = Buffer.from(ab);
                let finalExt = "jpg";
                let finalMime = "image/jpeg";
                
                try {
                  const sharpRes = await sharp(buffer)
                    .rotate()
                    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
                    .webp({ quality: 82 })
                    .toBuffer({ resolveWithObject: true });
                  buffer = Buffer.from(sharpRes.data);
                  finalExt = "webp";
                  finalMime = "image/webp";
                } catch (sharpErr) {
                  const rawType = res.headers.get("content-type") || "image/jpeg";
                  finalExt = rawType.includes("png") ? "png" : rawType.includes("webp") ? "webp" : "jpg";
                  finalMime = rawType;
                  console.warn("Toast image sharp optimization failed, falling back to raw buffer:", sharpErr);
                }

                const id = crypto.randomUUID().replace(/-/g, "");
                const blobContainer = process.env.AZURE_BLOB_CONTAINER || "uploads";
                const blobName = `files/toast_${id}.${finalExt}`;
                const finalUrl = await storage.upload(`${blobContainer}/${blobName}`, buffer, finalMime);
                finalImages = [finalUrl];
              }
            } catch (e) {
              console.warn("Toast image upload failed for", item.name, e);
            }
          }

          const now = Date.now();
          const attrs = (item.industryAttributes?.restaurant || {}) as Record<string, any>;
          const priceUsd = Math.max(0, Number(item.price || 0));

          if (existing) {
            // PATCH existing item
            await container.item(existing.id, wallet).patch([
              { op: "replace", path: "/name", value: String(item.name || "") },
              { op: "replace", path: "/description", value: String(item.description || "") },
              { op: "replace", path: "/priceUsd", value: priceUsd },
              { op: "replace", path: "/category", value: item.category || undefined },
              { op: "replace", path: "/attributes", value: attrs },
              { op: "replace", path: "/images", value: finalImages },
              { op: "replace", path: "/updatedAt", value: now }
            ]).catch(e => console.warn(`Failed to update item ${itemSku}`, e));
            updated++;
          } else {
            // POST new item
            const newItem = {
              id: crypto.randomUUID(),
              wallet,
              type: "inventory_item",
              sku: itemSku,
              name: String(item.name || ""),
              priceUsd: priceUsd,
              currency: "USD",
              stockQty: -1,
              category: item.category || undefined,
              description: String(item.description || ""),
              tags: [],
              images: finalImages,
              attributes: attrs,
              taxable: true,
              industryPack: "restaurant",
              createdAt: now,
              updatedAt: now
            };
            await container.items.create(newItem).catch(e => console.warn(`Failed to create item ${itemSku}`, e));
            added++;
          }
        })
      );
    }

    // Process removals: DELETE items not present in Toast menu
    for (const item of existingItems) {
      if (item.sku && !importedSkus.has(String(item.sku).toUpperCase().slice(0, 16))) {
        try {
          await container.item(item.id, wallet).delete();
          deleted++;
        } catch (e) {
          console.warn(`Failed to delete missing item ${item.sku}`, e);
        }
      }
    }

    const menuNames = (Array.isArray(data?.menus) ? data!.menus! : []).map((m: any) => String(m?.name || ""));

    return NextResponse.json({
      success: true,
      added,
      updated,
      deleted,
      menus: menuNames,
    });
  } catch (error) {
    console.error("Toast sync error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
