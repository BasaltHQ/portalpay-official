import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { requireThirdwebAuth } from "@/lib/auth";
import { BlobServiceClient } from "@azure/storage-blob";

export const runtime = "nodejs";

const APP_TO_PATH: Record<string, string> = {
  portalpay: path.join("android", "launcher", "recovered", "portalpay-signed.apk"),
  paynex: path.join("android", "launcher", "recovered", "paynex-signed.apk"),
};

/**
 * Streams a signed APK from the server filesystem to the browser without prompting a download.
 * The Admin panel can fetch this endpoint as an ArrayBuffer and install it to a USB-connected device via WebUSB/ADB.
 *
 * GET /api/admin/apk/{app}
 *   app: "portalpay" | "paynex"
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ app: string }> }
) {
  try {
    // Auth: only Admin or Superadmin may access APK streaming
    const caller = await requireThirdwebAuth(_req).catch(() => null);
    const roles = Array.isArray(caller?.roles) ? caller!.roles : [];
    if (!(roles.includes("admin") || roles.includes("superadmin"))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Container gating: partner containers only see their own brand; platform sees all
    const containerType = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || process.env.CONTAINER_TYPE || "platform").toLowerCase();
    const brandKey = String(process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || "").toLowerCase();

    const { app } = await context.params;
    const key = String(app || "").toLowerCase();
    if (containerType === "partner") {
      if (!brandKey || key !== brandKey) {
        // Hide other brand artifacts from partner containers
        return NextResponse.json({ error: "apk_not_visible" }, { status: 404 });
      }
    }

    // Prefer Azure Blob Storage if configured (auto-built APK artifacts)
    // Expected env:
    // - AZURE_STORAGE_CONNECTION_STRING (or managed identity via DefaultAzureCredential, future)
    // - PP_APK_CONTAINER (e.g., "apks")
    // - PP_APK_BLOB_PREFIX (optional, e.g., "brands")
    // Blob name defaults to: "<key>-signed.apk" or "<prefix>/<key>-signed.apk"
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "").trim();
    if (conn && container) {
      try {
        const prefix = String(process.env.PP_APK_BLOB_PREFIX || "").trim().replace(/^\/+|\/+$/g, "");
        const blobName = prefix ? `${prefix}/${key}-signed.apk` : `${key}-signed.apk`;
        const bsc = BlobServiceClient.fromConnectionString(conn);
        const cont = bsc.getContainerClient(container);
        const blob = cont.getBlockBlobClient(blobName);
        // Throws if missing
        const buf = await blob.downloadToBuffer();
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
            "Content-Disposition": `inline; filename="${key}.apk"`,
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
      } catch {
        // Fall back to local filesystem if blob not found
      }
    }

    const rel = APP_TO_PATH[key];
    if (!rel) {
      return NextResponse.json({ error: "unknown app" }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), rel);
    const data = await fs.readFile(filePath);
    // Convert Buffer to Uint8Array to satisfy NextResponse BodyInit (BufferSource)
    const body = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    // Serve as an inline binary stream so client can consume via fetch(ArrayBuffer)
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": String(data.length),
        "Content-Disposition": `inline; filename="${key}.apk"`,
        // Prevent caching to always serve latest build
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err: any) {
    // Hide server path details in errors
    return NextResponse.json({ error: "apk_not_found" }, { status: 404 });
  }
}
