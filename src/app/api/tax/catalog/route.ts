import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
export const runtime = "nodejs";

/**
 * Tax Catalog API
 * - GET: returns a curated list of popular jurisdictions with commonly used sales/VAT/GST rates.
 *        Intended for bootstrapping merchant tax settings; production sites should integrate
 *        a live tax provider (e.g., TaxJar, Avalara) to stay current with jurisdiction changes.
 *
 * Query params:
 *   - country?: filter by country code (e.g., "US", "CA", "UK", "EU", "AU", "SG", "JP")
 *
 * Response:
 * {
 *   provider: { name?: string; apiKeySet?: boolean },
 *   updatedAt: number,
 *   jurisdictions: Array<{ code: string; name: string; rate: number; country?: string; type?: string }>
 * }
 *
 * Notes:
 * - Rates below are illustrative reference values and may not reflect local city/county surtaxes.
 * - Merchants remain responsible for compliance; this endpoint is not a substitute for certified tax engines.
 */
export async function GET(req: NextRequest) {
  const correlationId =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    const cfg = await getSiteConfig().catch(() => null as any);
    const provider = (cfg as any)?.taxConfig?.provider || { name: "", apiKeySet: false };

    const url = new URL(req.url);
    const countryFilter = String(url.searchParams.get("country") || "").toUpperCase();

    const jurisdictions = [
      // United States (base state rates; local surtaxes not included)
      { code: "US-CA", name: "California (State Base)", rate: 0.0725, country: "US", type: "sales" },
      { code: "US-NY", name: "New York (Base NYC illustrative)", rate: 0.08875, country: "US", type: "sales" },
      { code: "US-TX", name: "Texas (State Base)", rate: 0.0625, country: "US", type: "sales" },
      { code: "US-FL", name: "Florida (State Base)", rate: 0.06, country: "US", type: "sales" },
      { code: "US-WA", name: "Washington (State Base)", rate: 0.065, country: "US", type: "sales" },

      // Canada (HST/PST/GST)
      { code: "CA-ON", name: "Ontario (HST)", rate: 0.13, country: "CA", type: "hst" },
      { code: "CA-BC", name: "British Columbia (GST+PST)", rate: 0.12, country: "CA", type: "gst_pst" },
      { code: "CA-QC", name: "Quebec (GST+QST)", rate: 0.14975, country: "CA", type: "gst_qst" },

      // UK
      { code: "UK-GB", name: "United Kingdom (VAT)", rate: 0.20, country: "UK", type: "vat" },

      // EU (examples; VAT varies by country)
      { code: "EU-DE", name: "Germany (VAT)", rate: 0.19, country: "EU", type: "vat" },
      { code: "EU-FR", name: "France (VAT)", rate: 0.20, country: "EU", type: "vat" },
      { code: "EU-IT", name: "Italy (VAT)", rate: 0.22, country: "EU", type: "vat" },
      { code: "EU-ES", name: "Spain (VAT)", rate: 0.21, country: "EU", type: "vat" },
      { code: "EU-NL", name: "Netherlands (VAT)", rate: 0.21, country: "EU", type: "vat" },

      // APAC
      { code: "AU-AU", name: "Australia (GST)", rate: 0.10, country: "AU", type: "gst" },
      { code: "SG-SG", name: "Singapore (GST)", rate: 0.09, country: "SG", type: "gst" },
      { code: "JP-JP", name: "Japan (Consumption Tax)", rate: 0.10, country: "JP", type: "consumption" },
    ];

    const filtered = countryFilter
      ? jurisdictions.filter((j) => String(j.country || "").toUpperCase() === countryFilter)
      : jurisdictions;

    return NextResponse.json(
      {
        provider,
        updatedAt: Date.now(),
        jurisdictions: filtered,
        disclaimer:
          "Rates are illustrative; integrate a certified tax provider (e.g., TaxJar/Avalara) for production-grade accuracy and updates.",
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    try { console.error("[tax/catalog] error", { correlationId, error: e?.message }); } catch {}
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}
