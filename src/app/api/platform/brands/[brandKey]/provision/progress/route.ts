import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/platform/brands/[brandKey]/provision/progress
// Returns latest persisted deployment progress snapshot for the given brandKey.
export async function GET(req: NextRequest, ctx: { params: Promise<{ brandKey: string }> }) {
  try {
    const { brandKey } = await ctx.params;
    const key = String(brandKey || "").toLowerCase();
    if (!key) {
      return NextResponse.json({ error: "brand_required" }, { status: 400 });
    }
    // Read progress snapshot from OS temp directory first (new path), fall back to legacy project path
    let json: any = null;
    try {
      const tmpPathOs = path.join(os.tmpdir(), `payportal-progress.tmp.${key}.json`);
      const dataOs = await fs.readFile(tmpPathOs, "utf8");
      json = JSON.parse(dataOs);
    } catch {}
    if (!json) {
      try {
        const legacyPath = path.join(process.cwd(), `tmp.deploy-progress.${key}.json`);
        const legacyData = await fs.readFile(legacyPath, "utf8");
        json = JSON.parse(legacyData);
      } catch {}
    }
    if (json) {
      return NextResponse.json({
        correlationId: json?.correlationId || "",
        progress: Array.isArray(json?.progress) ? json.progress : [],
        updatedAt: json?.updatedAt || 0,
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      });
    }
    return NextResponse.json({
      correlationId: "",
      progress: [],
      updatedAt: 0
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
