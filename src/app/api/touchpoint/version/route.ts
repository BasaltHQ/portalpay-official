import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(obj: any, init?: { status?: number; headers?: Record<string, string> }) {
    try {
        const s = JSON.stringify(obj);
        const len = new TextEncoder().encode(s).length;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        };
        headers["Content-Length"] = String(len);
        return new NextResponse(s, { status: init?.status ?? 200, headers });
    } catch {
        return NextResponse.json(obj, init as any);
    }
}

function getBrandKey(): string {
    const ct = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || process.env.CONTAINER_TYPE || "platform").toLowerCase();
    const envKey = String(process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || "").toLowerCase();
    if (ct === "partner") return envKey;
    return envKey || "basaltsurge";
}

// Global brand key for updates that apply to all brands
const GLOBAL_BRAND_KEY = "_all";

/**
 * GET /api/touchpoint/version
 * 
 * Public endpoint for devices to check for APK updates.
 * Checks brand-specific versions first, then falls back to global (_all) versions.
 * 
 * Query params:
 * - brandKey: optional, filter by brand
 * - currentVersion: optional, device's current version code
 */
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const currentVersionCode = parseInt(url.searchParams.get("currentVersion") || "0", 10);
        const qBrandKey = (url.searchParams.get("brandKey") || "").toLowerCase();

        const targetBrand = qBrandKey || getBrandKey();

        const dbId = String(process.env.COSMOS_PAYPORTAL_DB_ID || "payportal");
        const containerId = "payportal_events";
        const container = await getContainer(dbId, containerId);

        // Query for the latest APK version - check brand-specific first
        let latestVersion: any = null;

        // 1. Check brand-specific version
        const brandQuery = `
            SELECT TOP 1 * FROM c 
            WHERE c.type = 'apk_version' 
            AND c.brandKey = @brandKey
            ORDER BY c.versionCode DESC
        `;
        const { resources: brandResources } = await container.items.query({
            query: brandQuery,
            parameters: [{ name: "@brandKey", value: targetBrand }],
        } as any).fetchAll();

        if (brandResources.length > 0) {
            latestVersion = brandResources[0];
        }

        // 2. Check global version if no brand-specific found OR if global is newer
        const globalQuery = `
            SELECT TOP 1 * FROM c 
            WHERE c.type = 'apk_version' 
            AND c.brandKey = @allKey
            ORDER BY c.versionCode DESC
        `;
        const { resources: globalResources } = await container.items.query({
            query: globalQuery,
            parameters: [{ name: "@allKey", value: GLOBAL_BRAND_KEY }],
        } as any).fetchAll();

        if (globalResources.length > 0) {
            const globalVersion = globalResources[0];
            // Use global if no brand-specific OR if global is newer
            if (!latestVersion || (globalVersion.versionCode > latestVersion.versionCode)) {
                latestVersion = globalVersion;
            }
        }

        if (!latestVersion) {
            return json({
                hasUpdate: false,
                message: "No version information available",
            });
        }

        const hasUpdate = currentVersionCode < (latestVersion.versionCode || 0);

        return json({
            hasUpdate,
            latestVersion: latestVersion.versionName || "1.0.0",
            latestVersionCode: latestVersion.versionCode || 1,
            downloadUrl: latestVersion.downloadUrl || null,
            releaseNotes: latestVersion.releaseNotes || "",
            mandatory: latestVersion.mandatory || false,
            publishedAt: latestVersion.publishedAt || null,
            targetBrand: latestVersion.brandKey, // which brand this update is for
        });
    } catch (e: any) {
        console.error("[touchpoint/version] Error:", e);
        return json({ error: "version_check_failed", message: e?.message || String(e) }, { status: 500 });
    }
}

/**
 * POST /api/touchpoint/version
 * 
 * Admin-only endpoint to publish a new APK version.
 * 
 * Body:
 * {
 *   "versionName": "1.2.0",
 *   "versionCode": 5,
 *   "downloadUrl": "https://...",
 *   "releaseNotes": "Bug fixes",
 *   "mandatory": false,
 *   "brandKey": "basaltsurge",  // Specific brand OR "_all" for all brands
 *   "targetAllBrands": false    // If true, uses "_all" as brandKey
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Auth: Admin or Superadmin only
        const caller = await requireThirdwebAuth(req).catch(() => null as any);
        const roles = Array.isArray(caller?.roles) ? caller.roles : [];
        if (!roles.includes("admin") && !roles.includes("superadmin")) {
            return json({ error: "forbidden" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({} as any));

        const versionName = String(body?.versionName || "").trim();
        const versionCode = parseInt(body?.versionCode || "0", 10);
        const downloadUrl = String(body?.downloadUrl || "").trim();
        const releaseNotes = String(body?.releaseNotes || "").trim();
        const mandatory = Boolean(body?.mandatory);
        const targetAllBrands = Boolean(body?.targetAllBrands);

        if (!versionName || versionCode <= 0) {
            return json({ error: "invalid_version", message: "versionName and versionCode are required" }, { status: 400 });
        }

        if (!downloadUrl) {
            return json({ error: "download_url_required", message: "downloadUrl is required" }, { status: 400 });
        }

        const ct = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || process.env.CONTAINER_TYPE || "platform").toLowerCase();
        let brandKey = getBrandKey();

        // Determine target brand key
        if (targetAllBrands) {
            // Push to all brands
            brandKey = GLOBAL_BRAND_KEY;
        } else if (ct === "platform" && body?.brandKey) {
            // Platform admins can specify brandKey
            brandKey = String(body.brandKey).toLowerCase();
        }
        // Partners always use their own brand key (already set via getBrandKey)

        const dbId = String(process.env.COSMOS_PAYPORTAL_DB_ID || "payportal");
        const containerId = "payportal_events";
        const container = await getContainer(dbId, containerId);

        const id = `apk_version_${brandKey}_${versionCode}`;
        const doc = {
            id,
            type: "apk_version" as const,
            wallet: `apk_version:${brandKey}`, // partition key
            brandKey,
            versionName,
            versionCode,
            downloadUrl,
            releaseNotes,
            mandatory,
            publishedAt: new Date().toISOString(),
            publishedBy: caller.wallet,
            ts: Date.now(),
        };

        await container.items.upsert(doc as any);

        const targetDescription = brandKey === GLOBAL_BRAND_KEY ? "all brands" : brandKey;

        return json({
            ok: true,
            versionName,
            versionCode,
            brandKey,
            targetAllBrands: brandKey === GLOBAL_BRAND_KEY,
            message: `APK version ${versionName} published to ${targetDescription}`,
        });
    } catch (e: any) {
        console.error("[touchpoint/version] Error:", e);
        return json({ error: "publish_failed", message: e?.message || String(e) }, { status: 500 });
    }
}

/**
 * DELETE /api/touchpoint/version
 * 
 * Admin-only endpoint to reset version history for a brand.
 * Warning: This deletes ALL version records for the brand.
 */
export async function DELETE(req: NextRequest) {
    try {
        // Auth: Admin or Superadmin only
        const caller = await requireThirdwebAuth(req).catch(() => null as any);
        const roles = Array.isArray(caller?.roles) ? caller.roles : [];
        if (!roles.includes("admin") && !roles.includes("superadmin")) {
            return json({ error: "forbidden" }, { status: 403 });
        }

        const url = new URL(req.url);
        const confirm = url.searchParams.get("confirm") === "true";

        if (!confirm) {
            return json({ error: "confirmation_required", message: "Pass confirm=true to delete version history" }, { status: 400 });
        }

        const ct = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || process.env.CONTAINER_TYPE || "platform").toLowerCase();
        let brandKey = getBrandKey();

        // Platform admins can specify brandKey to reset
        const qBrandKey = url.searchParams.get("brandKey");
        if (ct === "platform" && qBrandKey) {
            brandKey = qBrandKey.toLowerCase();
        }

        const dbId = String(process.env.COSMOS_PAYPORTAL_DB_ID || "payportal");
        const containerId = "payportal_events";
        const container = await getContainer(dbId, containerId);

        // Find all version records for this brand
        const query = `
            SELECT * FROM c 
            WHERE c.type = 'apk_version' 
            AND c.brandKey = @brandKey
        `;

        const { resources } = await container.items.query({
            query,
            parameters: [{ name: "@brandKey", value: brandKey }]
        } as any).fetchAll();

        // Delete them
        let deletedCount = 0;
        for (const doc of resources) {
            await container.item(doc.id, doc.wallet).delete();
            deletedCount++;
        }

        return json({
            ok: true,
            deletedCount,
            brandKey,
            message: `Reset complete. Deleted ${deletedCount} version records.`
        });
    } catch (e: any) {
        console.error("[touchpoint/version] DELETE Error:", e);
        return json({ error: "delete_failed", message: e?.message || String(e) }, { status: 500 });
    }
}
