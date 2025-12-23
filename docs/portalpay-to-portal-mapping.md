# PortalPay to Portal Search Index Mapping Specification

This document defines how source records in the PortalPay Cosmos container (`payportal_events`, partition key `/wallet`) are mapped into the Portal app's `portal_search` container (partition key `/merchantId`) using the `PortalSearchDoc` schema.

It captures the field-by-field transformations, normalization/decontamination rules, inclusion/exclusion criteria, and edge cases observed in live data (see `portal/tmp.extract.json`).

## Target Schema (Portal)

`portal/src/lib/cosmos.ts`:

```ts
export type PortalSearchDoc = {
  id: string; // product id or merchant id based identifier
  type: "product" | "merchant";
  merchantId?: string;
  merchantSlug?: string;
  merchantName?: string;

  sku?: string;
  title?: string;
  description?: string;
  brand?: string;
  categoryIds?: string[];
  price?: number;
  rating?: number;
  availability?: "in_stock" | "out_of_stock" | "preorder";
  popularity?: number;
  createdAt?: number; // epoch ms

  redirectUrl?: string; // canonical shop URL for click-through
  thumbnailUrl?: string; // primary image/thumbnail for display

  // Vector embedding used for semantic search; optional to allow graceful fallback
  embedding?: number[];

  // Arbitrary small attributes (kept limited)
  attributes?: Record<string, string | number | boolean | null>;
};
```

## Source Container (PortalPay)

`src/lib/cosmos.ts` (payportal app):

- DB: `COSMOS_PAYPORTAL_DB_ID` (default `payportal`)
- Container: `COSMOS_PAYPORTAL_CONTAINER_ID` (default `payportal_events`)
- Partition key: `"/wallet"`
- Indexing policy composites over `/type` and time-like fields.
- Common event/document shapes stored in the container include:
  - Inventory items (`InventoryItem` from `public/openapi.yaml`)
  - Shop config (`ShopConfig`)
  - Site config (read-only branding)
  - Billing events (purchase/usage)
  - Receipts, orders
  - Auxiliary items (reviews, `brand:config`, `*:user` markers)
  - Derived shop configs (`shop:config`) and merchant slugs.

Key source schemas (from `public/openapi.yaml`):
- `InventoryItem`:
  ```
  id, wallet, sku, name, priceUsd, currency, stockQty,
  category, description, tags[], images[], attributes{},
  taxable, jurisdictionCode, industryPack, createdAt, updatedAt
  ```
- `ShopConfig` (developer read):
  ```
  name, description, theme{ primaryColor, secondaryColor, ... },
  arrangement, xpPerDollar, slug, links[], industryPack,
  createdAt, updatedAt
  ```

## Mapping Overview

Mapping is implemented in `portal/src/app/api/portal/extract/route.ts` via `toSearchDoc(c, slugMap)` and is designed to be non-invasive (read-only). It transforms raw PortalPay documents into `PortalSearchDoc[]`, which are then upserted by `portal/src/app/api/portal/reindex/route.ts`.

### Inclusion Criteria

- `type === "merchant"`:
  - Derived from explicit shop config or merchant-level summaries.
- `type === "product"`:
  - Inventory items and product-like entries with sufficient fields are included.

### Exclusion Criteria (to avoid noise/contamination)

Observed live data contains auxiliary documents that should not be indexed as inventory/product:
- `id` containing `":user:"` (e.g., `wallet:user:portalpay`) — skip indexing as product
- `id` starting with `"brand:"` (e.g., `brand:config`) — skip indexing
- `id` starting with `"review:"` — skip indexing as products
- Minimal items lacking `title` and `merchantName` — skip (un-mappable)

These exclusions are enforced in `toSearchDoc` before constructing `PortalSearchDoc`.

### Merchant Identity

- `merchantId`: from `wallet`, `merchantId`, `storeId`, `shopId`, `vendorId`
- `merchantSlug`: from `c.merchantSlug`, `c.shopSlug`, `c.slug`, or resolved via slug map:
  - Slug map is built from `shop_config` items (`wallet` → `slug`).
- `merchantName` (safe):
  - Read from `merchantName`, `storeName`, `shopName`, `vendorName` (NFC-normalized).
  - Decontamination: For `type === "product"`, drop `merchantName` if:
    - It was not explicitly present in merchant fields (i.e., backfilled from other fields), or
    - It equals `title` (e.g., “Airport Shuttle” set as `merchantName`).

### Product Identity

- `id`: prefer stable item id (e.g., `inventory:<SKU>`). If `inv_*` id patterns are present, use their literal id.
- `sku`: from `c.sku`, `c.partNumber`, `c.barcode`.
  - UI also derives SKU for `id` prefixed `inventory:` if `sku` is absent.
- `title`: from `c.title`, `c.name`, `c.displayName`, `c.label` (NFC).
- `description`: from `c.description`, `c.desc`, `c.shortDescription`, `c.longDescription`.

### Category and Tags

- `categoryIds`: Merge and de-duplicate:
  - `c.categoryIds` or `c.categories` or `c.category` (as string)
  - PLUS tags:
    - `c.tags` array of strings
    - `c.tags` comma-separated string (`"a,b,c"`)
- Preserve original casing & textual distinctions observed in data (e.g., “Education.” vs “Education”). Avoid over-aggressive normalization at extract time.

### Brand

- `brand`: from `c.brand`, `c.manufacturer`, with fallback to `c.attributes.brand` or `c.attributes.manufacturer` (NFC-normalized).

### Pricing and Popularity

- `price`: from `c.priceUsd`, `c.pricePerNight`, `c.basePrice`, `c.price`, `c.salePrice`, `c.amount`.
- `rating`: from `c.rating` or `c.reviewRating`.
- `popularity`: from `c.popularity`, `c.sales`, `c.views`.

### Availability

- `availability`: normalized from:
  - `c.availability` or `c.status` string (“in stock”,”out of stock”,”preorder”)
  - `c.stock`, `c.inStock`, `c.available`, `c.stockQty`
    - `stockQty === -1` → `in_stock`
    - `stockQty === 0` → `out_of_stock`
    - `stockQty > 0` → `in_stock`

### Timestamps

- `createdAt`: from `c.createdAt`, `c.ts`, or `c._ts`.
  - Seconds coerced to ms if `< 10_000_000_000`.

### Thumbnail

- `thumbnailUrl`: from:
  - First of `c.images[]`, `c.image`, `c.thumb`, `c.imageUrl`, `c.photo`.
  - If path is `/uploads/*.webp`, rewrite to `_thumb.webp` for thumb variant.

### Redirect URL

- For `type === "product"`:
  - `/shop/{merchantSlug}?pid={id}` — includes pid to preserve product context.
- For `type === "merchant"`:
  - `/shop/{merchantSlug}`

Base host (`NEXT_PUBLIC_PAYPORTAL_BASE_URL`) is prepended when present.

### Attributes (Small Normalized Set)

To support filtering/analytics without schema bloat, the following are attached (when present) to `doc.attributes`:

- `currency`: string
- `taxable`: boolean
- `jurisdictionCode`: string
- `industryPack`: string
- `tags`: array of strings (max 20)

## Decontamination at Multiple Layers

- **Extract** (`portal/src/app/api/portal/extract/route.ts`):
  - Drops `merchantName` for products when equal to `title` and when merchantName was not explicitly provided in source merchant fields.
  - Excludes auxiliary `:user`, `brand:*`, and `review:*` items from indexing.
  - NFC normalization for textual fields preserves special characters (e.g., apostrophes, star).
- **Reindex** (`portal/src/app/api/portal/reindex/route.ts`):
  - Drops `merchantName` where equal to `title` on products.
  - Normalizes thumbnail where missing.
  - Optional embeddings generation with synonyms for improved recall (best-effort).
- **GraphQL Resolver** (`portal/src/app/api/graphql/route.ts`):
  - Drops contaminated `merchantName` on products (safety net).
  - Keyword + vector search with relevance; server-side sorting.
  - Ensures `thumbnailUrl` derived if missing from common fields.

## Duplicate SKU Handling

Live data contains duplicate `sku` entries (e.g., `INV_17613` across multiple products). The UI and reindex script handle this safely:

- `portal/scripts/reindex-from-extract.mjs`:
  - Enriches missing thumbnails by fetching merchant inventory via wallet.
  - For duplicate SKUs, chooses match by name-similarity (`title` vs inventory item `name`); only fills **safe fields** (e.g., `thumbnailUrl`).
  - Does not override `title`, `description`, `categoryIds` to avoid cross-contamination.

## Observed Edge Cases from `portal/tmp.extract.json`

- Auxiliary id patterns:
  - `wallet:user` records — skip indexing as products.
  - `brand:config` — skip indexing.
  - `review:*` — skip indexing as products.
- Categories with typos or punctuation (e.g., `"vehical"`, `"Education."`) are preserved; downstream UI may choose to normalize display labels.
- Special characters (e.g., `☆JAG-co`, apostrophes) preserved via NFC normalization.

## Partition Key Alignment

- Source partition key is `/wallet` (PortalPay).
- Mapping uses `wallet` to:
  - Set `merchantId` (`merchantId || wallet`).
  - Build slug map (`wallet → slug`) from `shop_config` records and assign `merchantSlug`.
- Target partition key is `/merchantId` (Portal).
  - `merchantId` is populated from source as above to align with Portal’s partitioning strategy.

## Implementation Locations

- Mapping & normalization: `portal/src/app/api/portal/extract/route.ts`
- Decontamination & embeddings: `portal/src/app/api/portal/reindex/route.ts`
- Search & relevance: `portal/src/app/api/graphql/route.ts`
- Batch reindex helper & SKU-safe thumbnail enrichment: `portal/scripts/reindex-from-extract.mjs`

## Validation Plan

1. Run extract in unlimited mode to capture current live docs:
   - `GET /api/portal/extract?limit=all`
   - Inspect samples (`portal/tmp.extract.json`) for shape and edge cases.
2. Reindex with batch script:
   - Set env: `PORTAL_REINDEX_KEY`, `PORTAL_REINDEX_ENDPOINT`.
   - `node portal/scripts/reindex-from-extract.mjs`
   - Confirm ingested counts and sample failures.
3. Verify search behavior:
   - Use `POST /api/graphql` with `search` query for known items (e.g., "Airport Shuttle", duplicate sku).
   - Confirm brand and merchant names display correctly; confirm pid-including redirect.
4. Spot-check special characters and categories are preserved; thumbnails derived or enriched as needed.

## Summary

This mapping ensures the Portal index aligns with how the payportal app stores and exposes data:

- Respects payportal’s partition key (`/wallet`) to derive `merchantId`/`merchantSlug`.
- Cleanly maps InventoryItem & ShopConfig payloads into `PortalSearchDoc`.
- Applies robust decontamination and normalization (brand, categories+tags, availability).
- Excludes non-inventory auxiliary items (`:user`, `brand:*`, `review:*`) from product index.
- Preserves special characters via NFC, and only enriches **safe fields** to avoid cross-contamination.

Any further refinements (e.g., stricter category normalization or additional exclusion patterns) can be added in `toSearchDoc` as we observe more live data variants.
