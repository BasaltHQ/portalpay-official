import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

type SearchResult = {
  wallet: string;
  displayName?: string;
  pfpUrl?: string;
  xp: number;
  live: boolean;
  lastSeen?: number;
  lastHeartbeat?: number;
  domains: string[];
  platforms: string[];
  languages: string[];
};

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = String(url.searchParams.get("q") || "").toLowerCase().trim();
    const domains = String(url.searchParams.get("domains") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const platforms = String(url.searchParams.get("platforms") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const languages = String(url.searchParams.get("languages") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const minXp = Number(url.searchParams.get("minXp") || "0") || 0;
    const maxXpParam = url.searchParams.get("maxXp");
    const maxXp =
      typeof maxXpParam === "string" && maxXpParam !== ""
        ? Number(maxXpParam)
        : undefined;
    const liveOnly = (String(url.searchParams.get("live") || "").toLowerCase() === "true");
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "25")));
    const scanLimit = Math.min(
      1000,
      Math.max(limit, Number(url.searchParams.get("scan") || "400"))
    );
    const sort = String(url.searchParams.get("sort") || "").toLowerCase();

    const container = await getContainer();

    let query =
      "SELECT c.wallet, c.displayName, c.pfpUrl, c.xp, c.lastSeen, c.lastHeartbeat, c.live, c.spacePublic, c.metrics FROM c WHERE c.type = 'user'";
    const parameters: { name: string; value: any }[] = [];

    if (liveOnly) {
      query += " AND c.live = true AND c.spacePublic = true";
    }
    if (minXp > 0) {
      query += " AND IS_DEFINED(c.xp) AND c.xp >= @minXp";
      parameters.push({ name: "@minXp", value: minXp });
    }
    if (maxXp !== undefined && !Number.isNaN(maxXp)) {
      query += " AND IS_DEFINED(c.xp) AND c.xp <= @maxXp";
      parameters.push({ name: "@maxXp", value: maxXp });
    }
    if (q) {
      query +=
        " AND (CONTAINS(LOWER(c.wallet), @q) OR (IS_DEFINED(c.displayName) AND CONTAINS(LOWER(c.displayName), @q)))";
      parameters.push({ name: "@q", value: q });
    }

    // Sorting
    if (sort === "name_asc") {
      query += " ORDER BY c.displayName ASC";
    } else if (sort === "heartbeat_desc") {
      query += " ORDER BY c.lastHeartbeat DESC";
    } else if (sort === "seen_desc") {
      query += " ORDER BY c.lastSeen DESC";
    } else {
      // Prefer XP order for quick relevance; client can change later
      query += " ORDER BY c.xp DESC";
    }

    const { resources } = await container.items
      .query<any>(
        { query, parameters },
        { maxItemCount: scanLimit }
      )
      .fetchAll();

    const take = (resources || []).slice(0, scanLimit);

    // Server-side filter for dynamic-key metrics (domains/platforms/languages)
    const wantAll = (obj: any, wanted: string[]): boolean => {
      if (!wanted.length) return true;
      const keys = Object.keys(obj || {}).map((k) => k.toLowerCase());
      return wanted.every((w) => keys.includes(String(w).toLowerCase()));
    };

    const filtered = take.filter((u: any) => {
      const m = u?.metrics || {};
      return (
        wantAll(m.domains, domains) &&
        wantAll(m.platforms, platforms) &&
        wantAll(m.languages, languages)
      );
    });

    const results: SearchResult[] = filtered.slice(0, limit).map((u: any) => ({
      wallet: String(u.wallet || ""),
      displayName: typeof u.displayName === "string" ? u.displayName : undefined,
      pfpUrl: typeof u.pfpUrl === "string" ? u.pfpUrl : undefined,
      xp: Number(u.xp || 0),
      live: !!u.live,
      lastSeen: typeof u.lastSeen === "number" ? u.lastSeen : undefined,
      lastHeartbeat: typeof u.lastHeartbeat === "number" ? u.lastHeartbeat : undefined,
      domains: Object.keys((u.metrics || {}).domains || {}),
      platforms: Object.keys((u.metrics || {}).platforms || {}),
      languages: Object.keys((u.metrics || {}).languages || {}),
    }));

    return NextResponse.json({ users: results, total: results.length });
  } catch (e: any) {
    return NextResponse.json(
      { users: [], degraded: true, reason: e?.message || "cosmos_unavailable" },
      { status: 200 }
    );
  }
}
