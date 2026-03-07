import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireRole } from "@/lib/auth";
import { rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";
import crypto from "node:crypto";

export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        // Admin-only access
        const caller = await requireRole(req, "admin");

        try {
            rateLimitOrThrow(req, rateKey(req, "admin_merchants_list", caller.wallet), 20, 60_000);
        } catch (e: any) {
            return NextResponse.json({ error: "rate_limited" }, { status: 429 });
        }

        const container = await getContainer();

        const url = new URL(req.url);
        const brandKey = url.searchParams.get("brandKey");

        let query = "SELECT c.id, c.wallet, c.name, c.industryPack, c.loyalty, c.industryPackActivatedAt, c.createdAt, c.slug, c.theme, c.kioskEnabled, c.terminalEnabled, c.brandKey FROM c WHERE c.type='shop_config'";
        const parameters: any[] = [];

        if (brandKey) {
            query += " AND (LOWER(c.brandKey) = @brandKey OR c.theme.brandKey = @brandKey)";
            parameters.push({ name: "@brandKey", value: brandKey });
        }

        query += " ORDER BY c.createdAt DESC";

        const spec = { query, parameters };

        const { resources } = await container.items.query(spec).fetchAll();

        // Use createdAt as primary "joined" timestamp — always set for new merchants.
        // Fall back to industryPackActivatedAt for pre-migration data where createdAt may be missing.
        // Normalize Date objects to epoch-ms if the adapter didn't catch them.
        function toEpochMs(v: any): number {
            if (!v) return 0;
            if (v instanceof Date) return v.getTime();
            if (typeof v === "string") { const d = new Date(v); return isNaN(d.getTime()) ? 0 : d.getTime(); }
            if (typeof v === "number" && Number.isFinite(v)) return v;
            return 0;
        }

        const merchants = (Array.isArray(resources) ? resources.map((r: any) => ({
            id: r.id,
            wallet: r.wallet,
            name: r.name,
            industryPack: r.industryPack || "Generic",
            platformOptIn: !!r?.loyalty?.platformOptIn,
            joinedAt: toEpochMs(r.createdAt) || toEpochMs(r.industryPackActivatedAt) || 0,
            slug: r.slug,
            logo: r.theme?.brandLogoUrl,
            kioskEnabled: !!r.kioskEnabled,
            terminalEnabled: !!r.terminalEnabled
        })) : []).sort((a, b) => b.joinedAt - a.joinedAt);

        return NextResponse.json({ ok: true, merchants }, { headers: { "x-correlation-id": correlationId } });
    } catch (e: any) {
        console.error("Failed to list merchants", e);
        return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
}
