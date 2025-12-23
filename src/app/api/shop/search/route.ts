import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

type ShopSearchResult = {
  wallet: string;
  slug?: string;
  name?: string;
  brandLogoUrl?: string;
  coverPhotoUrl?: string;
  updatedAt?: number;
};

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = String(url.searchParams.get("q") || "").toLowerCase().trim();
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "25")));
    const scanLimit = Math.min(1000, Math.max(limit, Number(url.searchParams.get("scan") || "400")));
    const sort = String(url.searchParams.get("sort") || "").toLowerCase(); // updated_desc | name_asc | slug_asc
    const setupOnly = String(url.searchParams.get("setup") || "").toLowerCase() === "true";
    const pack = String(url.searchParams.get("pack") || "").toLowerCase().trim(); // industryPack exact match (lowercased)
    const hasSlug = String(url.searchParams.get("hasSlug") || "").toLowerCase() === "true";

    if (!q || q.length < 2) {
      return NextResponse.json({ shops: [], total: 0 });
    }

    const c = await getContainer();

    // Build dynamic query for shops by slug/name + optional filters
    let query = `
      SELECT c.wallet, c.slug, c.name, c.theme, c.updatedAt
      FROM c
      WHERE c.type = 'shop_config'
        AND (
          (IS_DEFINED(c.slug) AND CONTAINS(LOWER(c.slug), @q))
          OR (IS_DEFINED(c.name) AND CONTAINS(LOWER(c.name), @q))
        )
    `;
    const parameters: { name: string; value: any }[] = [{ name: "@q", value: q }];

    if (setupOnly) {
      query += " AND c.setupComplete = true";
    }
    if (pack) {
      query += " AND IS_DEFINED(c.industryPack) AND LOWER(c.industryPack) = @pack";
      parameters.push({ name: "@pack", value: pack });
    }
    if (hasSlug) {
      query += " AND IS_DEFINED(c.slug) AND c.slug != ''";
    }

    // Sorting
    if (sort === "name_asc") {
      query += " ORDER BY c.name ASC";
    } else if (sort === "slug_asc") {
      query += " ORDER BY c.slug ASC";
    } else {
      query += " ORDER BY c.updatedAt DESC";
    }

    const { resources } = await c.items.query<any>({ query, parameters }, { maxItemCount: scanLimit }).fetchAll();
    const take = (resources || []).slice(0, scanLimit);

    const results: ShopSearchResult[] = take.slice(0, limit).map((s: any) => ({
      wallet: String(s.wallet || ""),
      slug: typeof s.slug === "string" ? s.slug : undefined,
      name: typeof s.name === "string" ? s.name : undefined,
      brandLogoUrl: typeof s?.theme?.brandLogoUrl === "string" ? s.theme.brandLogoUrl : undefined,
      coverPhotoUrl: typeof s?.theme?.coverPhotoUrl === "string" ? s.theme.coverPhotoUrl : undefined,
      updatedAt: typeof s.updatedAt === "number" ? s.updatedAt : undefined,
    }));

    return NextResponse.json({ shops: results, total: results.length });
  } catch (e: any) {
    return NextResponse.json(
      { shops: [], degraded: true, reason: e?.message || "cosmos_unavailable" },
      { status: 200 }
    );
  }
}
