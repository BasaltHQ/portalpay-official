import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/touchpoint/apk-download?brandKey=xoinpay
 * 
 * Public APK download endpoint for setup scripts.
 * Downloads the branded APK from Azure Blob Storage.
 * 
 * No auth required - this is used by the setup script running on technician machines.
 * Security: Only serves APKs that exist in blob storage (pre-built by admin).
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brandKey = searchParams.get("brandKey")?.trim().toLowerCase();

        if (!brandKey) {
            return NextResponse.json({ error: "brandKey_required" }, { status: 400 });
        }

        // Validate brand key format (alphanumeric + hyphens only)
        if (!/^[a-z0-9-]+$/.test(brandKey)) {
            return NextResponse.json({ error: "invalid_brandKey" }, { status: 400 });
        }

        // Get APK from Storage
        const { storage } = await import("@/lib/azure-storage");
        const container = String(process.env.PP_APK_CONTAINER || "basaltsurge").trim();
        const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");

        const getPossiblePaths = (name: string) => {
            const paths = [];
            if (prefix) paths.push(`${container}/${prefix}/${name}`);
            paths.push(`${container}/${name}`);
            if (prefix) paths.push(`${prefix}/${name}`);
            paths.push(`${name}`);
            return paths;
        };

        try {
            const namesToCheck = [
                `${brandKey}-touchpoint-signed.apk`,
                `${brandKey}-signed.apk`
            ];

            let foundPath: string | null = null;

            for (const name of namesToCheck) {
                const possiblePaths = getPossiblePaths(name);
                for (const p of possiblePaths) {
                    if (await storage.exists(p)) {
                        foundPath = p;
                        break;
                    }
                }
                if (foundPath) break;
            }

            if (!foundPath) {
                return NextResponse.json({
                    error: "apk_not_found",
                    message: `No APK found for brand: ${brandKey}. Build the APK first from Admin Panel.`
                }, { status: 404 });
            }

            const buf = await storage.download(foundPath);
            return createApkResponse(buf, brandKey);

        } catch (e: any) {
            console.error("[touchpoint/apk-download] Blob error:", e);
            return NextResponse.json({
                error: "apk_download_failed",
                message: "Failed to download APK from storage"
            }, { status: 500 });
        }

    } catch (e: any) {
        console.error("[touchpoint/apk-download] Error:", e);
        return NextResponse.json({ error: "download_failed" }, { status: 500 });
    }
}

function createApkResponse(buf: Buffer, brandKey: string): Response {
    const body = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(body);
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Length": String(buf.length),
            "Content-Disposition": `attachment; filename="${brandKey}-touchpoint.apk"`,
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}
