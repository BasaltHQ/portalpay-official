import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";

/**
 * Owner Analytics (real)
 * Returns analytics metrics for the authenticated merchant wallet by delegating to /api/analytics/merchant.
 * Gated: only the owner (authenticated merchant) may access their own analytics.
 *
 * Query params:
 * - wallet: merchant wallet address (required, must match authenticated caller)
 * - metrics: optional, comma-separated list of metric keys to include (e.g., "gmvUsd,ordersCount,topItems,timeSeriesDaily")
 * - range: optional, one of all|24h|7d|30d (defaults to "all" if not provided)
 * - sinceMs: optional epoch milliseconds to override the range window
 */
export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const url = new URL(req.url);
    const wallet = String(url.searchParams.get("wallet") || "").toLowerCase();
    const metricsParam = String(url.searchParams.get("metrics") || "").trim();
    const rangeParam = (url.searchParams.get("range") || "").trim();
    const sinceMsParam = (url.searchParams.get("sinceMs") || "").trim();

    const authed = (await getAuthenticatedWallet(req)) || "";
    const me = String(authed || "").toLowerCase();

    if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ ok: false, error: "invalid_wallet" }, { status: 400, headers: { "x-correlation-id": correlationId } });
    }
    if (!me || me !== wallet) {
      return NextResponse.json({ ok: false, error: "not_owner" }, { status: 403, headers: { "x-correlation-id": correlationId } });
    }

    // Build query for merchant analytics
    const qs = new URLSearchParams();
    if (rangeParam) qs.set("range", rangeParam);
    if (sinceMsParam && Number.isFinite(Number(sinceMsParam))) qs.set("sinceMs", sinceMsParam);

    const origin = req.nextUrl.origin;
    const analyticsUrl = `${origin}/api/analytics/merchant?${qs.toString()}`;

    // Call internal analytics route, identify merchant via x-wallet header
    const res = await fetch(analyticsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-wallet": wallet,
      },
      cache: "no-store",
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || j?.ok !== true) {
      const code = res.status || 502;
      return NextResponse.json({ ok: false, error: j?.error || "analytics_unavailable" }, { status: code, headers: { "x-correlation-id": correlationId } });
    }

    const metrics = j?.metrics || {};
    const generatedAt = Date.now();

    // Optional filtering by requested metric keys
    let stats: Record<string, any> = { wallet, generatedAt, ...metrics };
    if (metricsParam) {
      const keys = metricsParam.split(",").map((m) => m.trim()).filter(Boolean);
      const filtered: Record<string, any> = { wallet, generatedAt };
      for (const k of keys) {
        if (k in metrics) filtered[k] = metrics[k];
      }
      // Always include some useful identifiers if present in metrics
      if ("range" in metrics) filtered.range = metrics.range;
      if ("sinceRange" in metrics) filtered.sinceRange = metrics.sinceRange;
      stats = filtered;
    }

    return NextResponse.json({ ok: true, stats }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500, headers: { "x-correlation-id": crypto.randomUUID() } });
  }
}
