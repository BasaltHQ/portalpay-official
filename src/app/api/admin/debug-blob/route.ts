
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const appKey = searchParams.get("app");

        const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
        const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();
        const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");

        const debugInfo: any = {
            connConfigured: !!conn,
            container,
            prefix,
            appKey,
            blobsFound: []
        };

        if (container) {
            const { storage } = await import("@/lib/azure-storage");

            // Check if we can list
            // Note: storage.exists(path) checks file exists, not container.
            // But we can try to list.
            try {
                const blobs = await storage.list(prefix ? `${container}/${prefix}/` : `${container}/`);
                debugInfo.blobsFound = blobs;
            } catch (e: any) {
                debugInfo.listError = e.message;
            }

            if (appKey) {
                const blobName = prefix ? `${container}/${prefix}/${appKey}-signed.apk` : `${container}/${appKey}-signed.apk`;
                debugInfo.targetBlobCheck = {
                    colculatedName: blobName,
                    exists: await storage.exists(blobName)
                };
            }
        }

        return NextResponse.json(debugInfo);
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
