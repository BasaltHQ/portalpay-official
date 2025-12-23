import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getIndustryPack, IndustryPackType } from "@/lib/industry-packs";

function validateWallet(raw: string): string {
  const w = String(raw || "").toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(w) ? w : "";
}

function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
    const wallet = validateWallet(headerWallet);

    if (!wallet) {
      return NextResponse.json({ error: "wallet_required" }, { status: 400 });
    }

    const packType = String(body.packType || "").toLowerCase() as IndustryPackType;
    if (!["restaurant", "retail", "hotel", "freelancer", "publishing"].includes(packType)) {
      return NextResponse.json({ error: "invalid_pack_type" }, { status: 400 });
    }

    // Get the industry pack
    const pack = getIndustryPack(packType);
    if (!pack) {
      return NextResponse.json({ error: "pack_not_found" }, { status: 404 });
    }

    const now = Date.now();
    const createdItems: any[] = [];

    // Transform sample items to inventory format
    for (const sampleItem of pack.sampleItems) {
      const id = generateId();

      // Base inventory item structure
      const inventoryItem: any = {
        id,
        wallet,
        type: "inventory_item",
        sku: String(sampleItem.sku || id.slice(0, 9).toUpperCase()),
        name: String(sampleItem.name || ""),
        priceUsd: Math.max(0, Number(sampleItem.basePrice || sampleItem.priceUsd || sampleItem.pricing?.amount || 0)),
        currency: "USD",
        stockQty: typeof sampleItem.stockQty === "number" ? sampleItem.stockQty : -1, // Default to infinite
        category: String(sampleItem.category || ""),
        description: String(sampleItem.description || ""),
        tags: Array.isArray(sampleItem.tags) ? sampleItem.tags : [],
        images: Array.isArray(sampleItem.images) ? sampleItem.images : [],
        attributes: {},
        taxable: typeof sampleItem.taxable === "boolean" ? sampleItem.taxable : true,
        industryPack: packType,
        createdAt: now,
        updatedAt: now,
      };

      // Industry-specific fields
      switch (packType) {
        case "restaurant":
          if (sampleItem.modifierGroups) inventoryItem.modifierGroups = sampleItem.modifierGroups;
          if (sampleItem.dietaryTags) inventoryItem.dietaryTags = sampleItem.dietaryTags;
          if (typeof sampleItem.spiceLevel === "number") inventoryItem.spiceLevel = sampleItem.spiceLevel;
          if (sampleItem.prepTime) inventoryItem.prepTime = sampleItem.prepTime;
          if (typeof sampleItem.calories === "number") inventoryItem.calories = sampleItem.calories;
          if (sampleItem.ingredients) inventoryItem.ingredients = sampleItem.ingredients;
          break;

        case "retail":
          if (sampleItem.variationGroups) inventoryItem.variationGroups = sampleItem.variationGroups;
          if (sampleItem.variants) inventoryItem.variants = sampleItem.variants;
          break;

        case "hotel":
          if (sampleItem.rooms) {
            // Hotel room type
            inventoryItem.rooms = sampleItem.rooms.map((room: any) => ({
              ...room,
              id: room.id || generateId(),
              status: room.status || "available",
              lastStatusChange: now,
            }));
          }
          if (typeof sampleItem.maxOccupancy === "number") inventoryItem.maxOccupancy = sampleItem.maxOccupancy;
          if (Array.isArray(sampleItem.amenities)) inventoryItem.amenities = sampleItem.amenities;
          if (typeof sampleItem.pricePerNight === "number") {
            inventoryItem.priceUsd = sampleItem.pricePerNight;
            inventoryItem.pricePerNight = sampleItem.pricePerNight;
          }
          break;

        case "freelancer":
          if (sampleItem.pricing) inventoryItem.pricing = sampleItem.pricing;
          if (sampleItem.deliveryTime) inventoryItem.deliveryTime = sampleItem.deliveryTime;
          if (typeof sampleItem.revisionsIncluded === "number") inventoryItem.revisionsIncluded = sampleItem.revisionsIncluded;
          if (sampleItem.serviceCategory) inventoryItem.serviceCategory = sampleItem.serviceCategory;
          if (sampleItem.skillLevel) inventoryItem.skillLevel = sampleItem.skillLevel;
          if (Array.isArray(sampleItem.deliverables)) inventoryItem.deliverables = sampleItem.deliverables;
          if (Array.isArray(sampleItem.requirements)) inventoryItem.requirements = sampleItem.requirements;
          if (Array.isArray(sampleItem.addOns)) inventoryItem.addOns = sampleItem.addOns;
          break;

        case "publishing":
          inventoryItem.isBook = true;
          if (sampleItem.author) inventoryItem.author = sampleItem.author;
          if (typeof sampleItem.pages === "number") inventoryItem.pages = sampleItem.pages;
          if (sampleItem.publisher) inventoryItem.publisher = sampleItem.publisher;
          if (sampleItem.language) inventoryItem.language = sampleItem.language;
          if (sampleItem.isbn) inventoryItem.isbn = sampleItem.isbn;
          if (sampleItem.genre) inventoryItem.genre = sampleItem.genre;
          if (sampleItem.format) inventoryItem.format = sampleItem.format;
          if (sampleItem.series) inventoryItem.series = sampleItem.series;
          if (sampleItem.contentDisclosures) inventoryItem.contentDisclosures = sampleItem.contentDisclosures;
          if (typeof sampleItem.drmEnabled === "boolean") inventoryItem.drmEnabled = sampleItem.drmEnabled;

          // Map URL fields to standard inventory book fields
          if (sampleItem.fileUrl) inventoryItem.bookFileUrl = sampleItem.fileUrl;
          if (sampleItem.coverUrl) {
            inventoryItem.bookCoverUrl = sampleItem.coverUrl;
            // Also set as main image if no others exist
            if (inventoryItem.images.length === 0) {
              inventoryItem.images = [sampleItem.coverUrl];
            }
          }
          if (sampleItem.previewUrl) inventoryItem.previewUrl = sampleItem.previewUrl;

          // Map publication date
          if (sampleItem.publicationDate) {
            const d = new Date(sampleItem.publicationDate);
            if (!isNaN(d.getTime())) {
              inventoryItem.releaseDate = d.getTime();
            }
          }
          // Default approval status for sample items
          inventoryItem.approvalStatus = 'APPROVED';
          break;
      }

      createdItems.push(inventoryItem);
    }

    // Bulk insert into database
    try {
      const c = await getContainer();
      const promises = createdItems.map((item) => c.items.upsert(item));
      await Promise.all(promises);

      return NextResponse.json({
        ok: true,
        count: createdItems.length,
        items: createdItems.map((item) => ({ id: item.id, name: item.name, sku: item.sku })),
      });
    } catch (e: any) {
      // Even if database fails, return success with degraded flag
      return NextResponse.json({
        ok: true,
        degraded: true,
        reason: e?.message || "cosmos_unavailable",
        count: createdItems.length,
        items: createdItems.map((item) => ({ id: item.id, name: item.name, sku: item.sku })),
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
