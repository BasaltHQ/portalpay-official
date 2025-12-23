import { NextRequest, NextResponse } from "next/server";
import { getAllIndustryPacks, getIndustryPack, IndustryPackType } from "@/lib/industry-packs";

/**
 * GET /api/industry-packs
 * Returns all available industry packs or a specific pack by type
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') as IndustryPackType | null;

    if (type) {
      const pack = getIndustryPack(type);
      if (!pack) {
        return NextResponse.json({ error: "Industry pack not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, pack });
    }

    const packs = getAllIndustryPacks();
    return NextResponse.json({ ok: true, packs });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load industry packs" }, { status: 500 });
  }
}
