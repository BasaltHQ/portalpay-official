import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(_req: NextRequest) {
  try {
    const cutoff = Date.now() - 120_000; // active if heartbeat within last 2 minutes
    try {
      const container = await getContainer();
      const query = {
        query:
          "SELECT c.wallet, c.displayName, c.pfpUrl, c.spaceUrl, c.spacePublic, c.live, c.liveSince, c.lastHeartbeat, c.metrics, c.currentLanguage, c.currentDomain, c.currentPlatform FROM c WHERE c.type = 'user' AND c.live = true AND c.spacePublic = true AND c.lastHeartbeat > @cutoff ORDER BY c.lastHeartbeat DESC",
        parameters: [{ name: "@cutoff", value: cutoff }],
      } as { query: string; parameters: { name: string; value: any }[] };
      const { resources } = await container.items.query<any>(query).fetchAll();
      const items = (resources || []).map((u: any) => ({
        wallet: String(u.wallet || ""),
        displayName: typeof u.displayName === "string" ? u.displayName : "",
        pfpUrl: typeof u.pfpUrl === "string" ? u.pfpUrl : "",
        spaceUrl: typeof u.spaceUrl === "string" ? u.spaceUrl : "",
        liveSince: typeof u.liveSince === "number" ? u.liveSince : undefined,
        lastHeartbeat: typeof u.lastHeartbeat === "number" ? u.lastHeartbeat : undefined,
        // Prefer live current values if present; otherwise fall back to historical metrics keys
        languages: (typeof u.currentLanguage === 'string' && u.currentLanguage) ? [u.currentLanguage] : Object.keys((u.metrics || {}).languages || {}),
        domains: (typeof u.currentDomain === 'string' && u.currentDomain && !/^auto$/i.test(String(u.currentDomain))) ? [u.currentDomain] : Object.keys((u.metrics || {}).domains || {}),
        platform: typeof u.currentPlatform === 'string' ? u.currentPlatform : undefined,
      }));
      return NextResponse.json({ live: items });
    } catch (e: any) {
      return NextResponse.json({ live: [], degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
