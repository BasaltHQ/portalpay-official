import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getBrandKey } from "@/config/brands";
import { getAuthenticatedWallet } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DOC_ID_PREFIX = "site:config";

function getDocIdForBrand(brandKey?: string): string {
    const key = String(brandKey || "").toLowerCase();
    if (!key) return `${DOC_ID_PREFIX}:basaltsurge`;
    return `${DOC_ID_PREFIX}:${key}`;
}

/**
 * GET /api/legal-read-status?wallet=0x...
 * Returns the legal document read timestamps for a merchant from their site_config.
 */
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const wallet = String(url.searchParams.get("wallet") || "").toLowerCase();
        if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json({ error: "invalid_wallet" }, { status: 400 });
        }

        let brandKey: string | undefined;
        try { brandKey = getBrandKey(req); } catch { brandKey = undefined; }
        const normalizedBrand = String(brandKey || "basaltsurge").toLowerCase();

        const c = await getContainer();
        const docId = getDocIdForBrand(normalizedBrand);

        let doc: any = null;
        try {
            const { resource } = await c.item(docId, wallet).read<any>();
            doc = resource;
        } catch { }

        // Fallback to legacy doc if brand-scoped not found
        if (!doc) {
            try {
                const { resource } = await c.item(DOC_ID_PREFIX, wallet).read<any>();
                doc = resource;
            } catch { }
        }

        const legalReadStatus = doc?.legalReadStatus || {};

        return NextResponse.json({
            termsReadAt: legalReadStatus.termsReadAt || null,
            privacyReadAt: legalReadStatus.privacyReadAt || null,
            aidpaReadAt: legalReadStatus.aidpaReadAt || null,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
}

/**
 * POST /api/legal-read-status
 * Body: { wallet: "0x...", termsReadAt?: string, privacyReadAt?: string, aidpaReadAt?: string }
 * Persists legal document read timestamps into the merchant's site_config document.
 * Only sets new values — never overwrites existing timestamps.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const wallet = String(body?.wallet || "").toLowerCase();

        if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json({ error: "invalid_wallet" }, { status: 400 });
        }

        // Auth: verify the caller owns this wallet
        let callerWallet: string | null = null;
        try {
            callerWallet = await getAuthenticatedWallet(req);
        } catch { }

        if (!callerWallet || callerWallet.toLowerCase() !== wallet) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        let brandKey: string | undefined;
        try { brandKey = getBrandKey(req); } catch { brandKey = undefined; }
        const normalizedBrand = String(brandKey || "basaltsurge").toLowerCase();

        const c = await getContainer();
        const docId = getDocIdForBrand(normalizedBrand);

        // Read existing doc
        let doc: any = null;
        try {
            const { resource } = await c.item(docId, wallet).read<any>();
            doc = resource;
        } catch { }

        // Fallback to legacy doc
        if (!doc) {
            try {
                const { resource } = await c.item(DOC_ID_PREFIX, wallet).read<any>();
                doc = resource;
            } catch { }
        }

        // Build legalReadStatus — never overwrite existing timestamps
        const existing = doc?.legalReadStatus || {};
        const now = new Date().toISOString();
        const updated = {
            termsReadAt: existing.termsReadAt || (body.termsReadAt ? now : undefined),
            privacyReadAt: existing.privacyReadAt || (body.privacyReadAt ? now : undefined),
            aidpaReadAt: existing.aidpaReadAt || (body.aidpaReadAt ? now : undefined),
        };

        // Clean undefined values
        const clean: Record<string, string> = {};
        if (updated.termsReadAt) clean.termsReadAt = updated.termsReadAt;
        if (updated.privacyReadAt) clean.privacyReadAt = updated.privacyReadAt;
        if (updated.aidpaReadAt) clean.aidpaReadAt = updated.aidpaReadAt;

        if (doc) {
            // Update existing document
            const updatedDoc = {
                ...doc,
                legalReadStatus: clean,
                updatedAt: new Date(),
            };
            await c.items.upsert(updatedDoc);

            // Also update legacy mirror
            try {
                const legacyMirror = { ...updatedDoc, id: DOC_ID_PREFIX };
                await c.items.upsert(legacyMirror);
            } catch { }
        } else {
            // Create a minimal site_config doc with legalReadStatus
            const newDoc = {
                id: docId,
                wallet,
                type: "site_config",
                brandKey: normalizedBrand,
                legalReadStatus: clean,
                updatedAt: new Date(),
            };
            await c.items.upsert(newDoc);

            // Also write legacy mirror
            try {
                await c.items.upsert({ ...newDoc, id: DOC_ID_PREFIX });
            } catch { }
        }

        return NextResponse.json({ ok: true, legalReadStatus: clean });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
}
