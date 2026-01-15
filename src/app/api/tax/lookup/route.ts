import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

/**
 * Tax Rate Lookup Proxy API
 * 
 * Proxies requests to api.taxratesapi.com to avoid CORS issues when
 * calling from the browser. This server-side endpoint can make the
 * cross-origin request without CORS restrictions.
 *
 * GET /api/tax/lookup?zip=90210
 *
 * Response:
 * {
 *   ok: boolean,
 *   data?: { state, zip, region_name, combined_rate, ... },
 *   rate?: number,
 *   error?: string
 * }
 */
export async function GET(req: NextRequest) {
    const correlationId =
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
        const url = new URL(req.url);
        const zip = String(url.searchParams.get("zip") || "").trim();

        if (!zip) {
            return NextResponse.json(
                { ok: false, error: "zip_required", correlationId },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Validate ZIP format (US: 5 digits or 5+4, allow international formats)
        const zipClean = zip.replace(/\s+/g, "");
        if (!/^[A-Z0-9\-]{3,10}$/i.test(zipClean)) {
            return NextResponse.json(
                { ok: false, error: "invalid_zip_format", correlationId },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Call the Tax Rates API server-side (no CORS issues)
        const apiUrl = `https://api.taxratesapi.com/rates/${encodeURIComponent(zipClean)}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        let response: Response;
        try {
            response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "PortalPay/1.0",
                },
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            // API returned an error status
            const errorText = await response.text().catch(() => "");
            console.error("[tax/lookup] API error", { correlationId, status: response.status, errorText });
            return NextResponse.json(
                { ok: false, error: "tax_api_error", status: response.status, correlationId },
                { status: 502, headers: { "x-correlation-id": correlationId } }
            );
        }

        const data = await response.json().catch(() => null);

        if (!data || typeof data !== "object") {
            return NextResponse.json(
                { ok: false, error: "invalid_api_response", correlationId },
                { status: 502, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Extract the combined rate
        const taxData = data.data || data;
        const combinedRate = Number(taxData?.combined_rate ?? taxData?.rate ?? 0);

        if (!Number.isFinite(combinedRate) || combinedRate < 0) {
            return NextResponse.json(
                { ok: false, error: "rate_not_found", zip: zipClean, correlationId },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        return NextResponse.json(
            {
                ok: true,
                zip: zipClean,
                rate: combinedRate,
                data: {
                    state: taxData?.state,
                    region_name: taxData?.region_name,
                    combined_rate: combinedRate,
                    state_rate: taxData?.state_rate,
                    county_rate: taxData?.county_rate,
                    city_rate: taxData?.city_rate,
                    special_rate: taxData?.special_rate,
                },
                correlationId,
            },
            { headers: { "x-correlation-id": correlationId } }
        );
    } catch (e: any) {
        const isAbort = e?.name === "AbortError";
        console.error("[tax/lookup] error", { correlationId, error: e?.message, isAbort });
        return NextResponse.json(
            { ok: false, error: isAbort ? "timeout" : (e?.message || "failed"), correlationId },
            { status: isAbort ? 504 : 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
