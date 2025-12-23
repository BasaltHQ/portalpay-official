import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

import { getAuthenticatedWallet } from "@/lib/auth";
import { getBrandKey } from "@/config/brands";

/**
 * GET /api/apim-management/products
 * Requires JWT (cb_auth_token). Returns APIM products with pricing/tier details.
 */
export async function GET(req: NextRequest) {
  try {
    const wallet = await getAuthenticatedWallet(req);
    if (!wallet) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const brandKey = getBrandKey().toLowerCase();

    // Parse pricing.md for tier info
    const pricingPath = join(process.cwd(), "docs", "pricing.md");
    const md = await readFile(pricingPath, "utf-8").catch(() => "");
    const tiers = parsePricingMarkdown(md);

    // Filter/Transform for response
    const items = tiers.map((tier) => {
      // Logic to resolve effective ID based on brand if needed, or just use tier.productId
      // For now, simple pass-through or basic brand suffixing if that was the "APIM" behavior we want to mimic locally.
      // Actually the frontend filters by brand anyway.

      const rateLimitDetails = getRateLimitDetails(tier.name);
      return {
        id: tier.productId,
        name: tier.name,
        rateLimit: rateLimitDetails.rateLimit,
        quota: rateLimitDetails.quota,
        rateLimitPerMinute: rateLimitDetails.rateLimitPerMinute,
        quotaTotal: rateLimitDetails.quotaTotal,
        quotaPeriod: rateLimitDetails.quotaPeriod,
        description: tier.description,
        support: tier.support,
        // apimRaw: undefined // No longer available
      };
    });

    return NextResponse.json({ products: items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}

type Tier = {
  name: string;
  productId: string;
  rateLimit: string;
  quota: string;
  description: string;
  support: string;
};

function getRateLimitDetails(tierName: string) {
  // Rate limits from APIM policy files
  const limits: Record<string, any> = {
    Starter: {
      rateLimit: "5/min, 100/week",
      quota: "100 requests/week",
      rateLimitPerMinute: 5,
      quotaTotal: 100,
      quotaPeriod: "week",
    },
    Pro: {
      rateLimit: "60/min, 100K/month",
      quota: "100,000 requests/month",
      rateLimitPerMinute: 60,
      quotaTotal: 100000,
      quotaPeriod: "month",
    },
    Enterprise: {
      rateLimit: "600/min, 5M/month",
      quota: "5,000,000 requests/month (customizable)",
      rateLimitPerMinute: 600,
      quotaTotal: 5000000,
      quotaPeriod: "month",
    },
  };

  return limits[tierName] || {
    rateLimit: "Contact support",
    quota: "Custom",
    rateLimitPerMinute: 0,
    quotaTotal: 0,
    quotaPeriod: "month",
  };
}

function parsePricingMarkdown(md: string): Tier[] {
  const out: Tier[] = [];
  const lines = md.split(/\r?\n/);

  function findValue(prefix: string, startIdx: number): string {
    for (let i = startIdx; i < Math.min(lines.length, startIdx + 12); i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith(prefix.toLowerCase())) {
        return line.split(":").slice(1).join(":").trim();
      }
    }
    return "";
  }

  const sections = [
    { marker: "1) Starter", name: "Starter" },
    { marker: "2) Pro", name: "Pro" },
    { marker: "3) Enterprise", name: "Enterprise" },
  ];

  for (const sec of sections) {
    const idx = lines.findIndex((l) => l.trim().startsWith(sec.marker));
    if (idx >= 0) {
      const productId = findValue("Product ID:", idx + 1) || `portalpay-${sec.name.toLowerCase()}`;
      const rateLimit = findValue("Rate limit:", idx + 1) || "";
      const quota = findValue("Quota:", idx + 1) || "";
      const desc = findValue("Intended for", idx + 1) || "";
      const support = findValue("Support/SLA:", idx + 1) || "";

      out.push({
        name: sec.name,
        productId,
        rateLimit,
        quota,
        description: desc,
        support,
      });
    }
  }

  return out;
}
