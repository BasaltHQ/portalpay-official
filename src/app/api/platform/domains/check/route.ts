import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import { requireThirdwebAuth } from "@/lib/auth";
import { rateLimitOrThrow, rateKey } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DnsResult = {
  a?: string[];
  aaaa?: string[];
  cname?: string[];
  cnameChain?: string[];
  error?: string;
};

type HttpsResult = {
  ok: boolean;
  status?: number;
  finalUrl?: string;
  error?: string;
};

type AfdResult = {
  viaCname: boolean;
  matchedDomain?: string;
  chain?: string[];
};

function jsonResponse(
  obj: any,
  init?: { status?: number; headers?: Record<string, string> }
) {
  try {
    const json = JSON.stringify(obj);
    const len = new TextEncoder().encode(json).length;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    };
    headers["Content-Length"] = String(len);
    return new NextResponse(json, { status: init?.status ?? 200, headers });
  } catch {
    return NextResponse.json(obj, init as any);
  }
}

function normalizeTarget(input: string): { url: URL; host: string } | null {
  try {
    let raw = String(input || "").trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
    const u = new URL(raw);
    return { url: u, host: u.hostname.toLowerCase() };
  } catch {
    return null;
  }
}

async function resolveCnameChain(host: string, maxDepth = 5): Promise<string[]> {
  const chain: string[] = [];
  let current = host;
  for (let i = 0; i < maxDepth; i++) {
    try {
      const cn = await dns.resolveCname(current);
      if (!Array.isArray(cn) || cn.length === 0) break;
      // pick first CNAME for chain
      const next = String(cn[0] || "").toLowerCase();
      if (!next || chain.includes(next)) break;
      chain.push(next);
      current = next.replace(/\.$/, "");
    } catch {
      break;
    }
  }
  return chain;
}

async function resolveDns(host: string): Promise<DnsResult> {
  const out: DnsResult = {};
  try {
    try {
      const a = await dns.resolve4(host);
      if (Array.isArray(a) && a.length) out.a = a.map(String);
    } catch {}
    try {
      const a6 = await dns.resolve6(host);
      if (Array.isArray(a6) && a6.length) out.aaaa = a6.map(String);
    } catch {}
    try {
      const cn = await dns.resolveCname(host);
      if (Array.isArray(cn) && cn.length) out.cname = cn.map((s) => String(s).toLowerCase());
    } catch {}
    out.cnameChain = await resolveCnameChain(host);
  } catch (e: any) {
    out.error = e?.message || "dns_failed";
  }
  return out;
}

function detectAfd(dnsr: DnsResult): AfdResult {
  const chain = ([] as string[])
    .concat(dnsr.cname || [])
    .concat(dnsr.cnameChain || [])
    .map((s) => s.toLowerCase().replace(/\.$/, ""));
  const afdSuffixes = ["azurefd.net", "azureedge.net"];
  const match = chain.find((c) => afdSuffixes.some((suf) => c.endsWith(suf)));
  return {
    viaCname: !!match,
    matchedDomain: match,
    chain: chain.length ? Array.from(new Set(chain)) : undefined,
  };
}

async function fetchWithTimeout(url: string, opts: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function checkHttps(u: URL): Promise<HttpsResult> {
  try {
    // Prefer HEAD to avoid large payloads
    let res = await fetchWithTimeout(u.toString(), { method: "HEAD", redirect: "follow", timeoutMs: 8000 });
    if (!res.ok && (res.status === 405 || res.status === 501)) {
      // Some origins don't allow HEAD; fallback to GET
      res = await fetchWithTimeout(u.toString(), { method: "GET", redirect: "follow", timeoutMs: 8000 });
    }
    return { ok: res.ok, status: res.status, finalUrl: res.url };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_failed" };
  }
}

/**
 * Domain readiness checker for Platform Admin.
 * GET /api/platform/domains/check?domain=https://partner.example.com
 * - Resolves DNS A/AAAA/CNAME and CNAME chain
 * - Heuristically detects Azure Front Door by CNAME suffix (azurefd.net/azureedge.net)
 * - Performs HTTPS health check (HEAD, fallback GET)
 * Admin-only (JWT) and lightly rate-limited.
 */
export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const raw = String(url.searchParams.get("domain") || url.searchParams.get("url") || "").trim();
  const norm = normalizeTarget(raw);

  if (!norm) {
    return jsonResponse(
      { error: "invalid_domain", correlationId },
      { status: 400, headers: { "x-correlation-id": correlationId } }
    );
  }

  // Admin-only (JWT)
  try {
    const caller = await requireThirdwebAuth(req);
    const roles = Array.isArray(caller?.roles) ? caller.roles : [];
    if (!roles.includes("admin")) {
      return jsonResponse(
        { error: "forbidden", correlationId },
        { status: 403, headers: { "x-correlation-id": correlationId } }
      );
    }
  } catch (e: any) {
    return jsonResponse(
      { error: "unauthorized", correlationId },
      { status: 401, headers: { "x-correlation-id": correlationId } }
    );
  }

  // Rate limit per host to protect origin
  try {
    rateLimitOrThrow(req, rateKey(req, "domain_check", norm.host), 10, 60_000);
  } catch (e: any) {
    const resetAt = typeof (e as any)?.resetAt === "number" ? (e as any).resetAt : undefined;
    return jsonResponse(
      { error: (e as any)?.message || "rate_limited", resetAt, correlationId },
      { status: (e as any)?.status || 429, headers: { "x-correlation-id": correlationId } }
    );
  }

  // Execute checks
  const [dnsr, https] = await Promise.all([resolveDns(norm.host), checkHttps(norm.url)]);
  const afd = detectAfd(dnsr);

  return jsonResponse(
    {
      input: raw,
      normalized: { url: norm.url.toString(), host: norm.host },
      dns: dnsr,
      afd,
      https,
      correlationId,
    },
    {
      headers: {
        "x-correlation-id": correlationId,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
