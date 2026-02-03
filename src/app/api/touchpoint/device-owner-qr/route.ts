import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

/**
 * Calculate SHA-256 checksum of APK for Device Owner provisioning
 * Base64 URL-safe encoded as required by Android
 */
async function calculateApkChecksum(apkUrl: string): Promise<string | null> {
    try {
        const res = await fetch(apkUrl);
        if (!res.ok) return null;

        const arrayBuffer = await res.arrayBuffer();
        const hash = crypto.createHash("sha256");
        hash.update(Buffer.from(arrayBuffer));

        // Base64 URL-safe encoding (replace + with -, / with _, remove =)
        const base64 = hash.digest("base64");
        return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch (e) {
        console.error("[device-owner-qr] Failed to calculate checksum:", e);
        return null;
    }
}

/**
 * GET /api/touchpoint/device-owner-qr
 * 
 * Generate the JSON payload for Android Device Owner QR code provisioning.
 * Returns the JSON string that should be encoded into a QR code.
 * 
 * Query params:
 * - brandKey: optional, specify brand for APK URL
 * - apkUrl: optional, direct APK URL (uses blob storage by default)
 * - wifiSsid: optional, Wi-Fi SSID to configure
 * - wifiPassword: optional, Wi-Fi password
 * - wifiSecurity: optional, security type (WPA, WEP, NONE)
 */
export async function GET(req: NextRequest) {
    try {
        // Auth: Admin or Superadmin only
        const caller = await requireThirdwebAuth(req).catch(() => null as any);
        const roles = Array.isArray(caller?.roles) ? caller.roles : [];
        if (!roles.includes("admin") && !roles.includes("superadmin")) {
            return json({ error: "forbidden" }, { status: 403 });
        }

        const url = new URL(req.url);
        const qBrandKey = (url.searchParams.get("brandKey") || "").toLowerCase().trim();
        const directApkUrl = url.searchParams.get("apkUrl") || "";
        const wifiSsid = url.searchParams.get("wifiSsid") || "";
        const wifiPassword = url.searchParams.get("wifiPassword") || "";
        const wifiSecurity = url.searchParams.get("wifiSecurity") || "WPA";
        const skipChecksum = url.searchParams.get("skipChecksum") === "true";

        const brandKey = qBrandKey || getBrandKey();

        // Determine APK download URL
        let apkUrl = directApkUrl;
        if (!apkUrl) {
            // Construct URL from Azure Blob Storage
            const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
            const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();
            const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");

            if (conn && container) {
                // Parse account name from connection string
                const accountMatch = conn.match(/AccountName=([^;]+)/i);
                const accountName = accountMatch ? accountMatch[1] : null;

                if (accountName) {
                    const blobName = prefix
                        ? `${prefix}/${brandKey}-touchpoint-signed.apk`
                        : `${brandKey}-touchpoint-signed.apk`;
                    apkUrl = `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;
                }
            }
        }

        if (!apkUrl) {
            return json({
                error: "apk_url_required",
                message: "Could not determine APK URL. Build an APK first or provide apkUrl parameter."
            }, { status: 400 });
        }

        // Package and component name (must match the built APK)
        const packageName = "com.example.basaltsurgemobile";
        const adminReceiver = `${packageName}/.AppDeviceAdminReceiver`;

        // Calculate checksum (can be slow for large APKs)
        let checksum: string | null = null;
        if (!skipChecksum) {
            console.log("[device-owner-qr] Calculating APK checksum...");
            checksum = await calculateApkChecksum(apkUrl);
            if (!checksum) {
                console.warn("[device-owner-qr] Could not calculate checksum, APK may not be accessible");
            }
        }

        // Build the provisioning JSON
        // See: https://developers.google.com/android/management/provision-device#qr_code_method
        const provisioningData: Record<string, any> = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": adminReceiver,
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": apkUrl,
            "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
            "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false,
        };

        // Add checksum if available
        if (checksum) {
            provisioningData["android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM"] = checksum;
        }

        // Add WiFi configuration if provided
        if (wifiSsid) {
            provisioningData["android.app.extra.PROVISIONING_WIFI_SSID"] = wifiSsid;
            if (wifiPassword) {
                provisioningData["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = wifiPassword;
            }
            provisioningData["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = wifiSecurity;
        }

        // Generate the QR content (JSON string)
        const qrContent = JSON.stringify(provisioningData);

        return json({
            ok: true,
            brandKey,
            apkUrl,
            packageName,
            adminReceiver,
            hasChecksum: !!checksum,
            qrContent,
            instructions: [
                "1. Factory reset the target device",
                "2. On the welcome screen, tap 6 times rapidly",
                "3. Connect to WiFi when prompted (or use QR with WiFi config)",
                "4. Scan this QR code with the device camera",
                "5. The device will download and install the APK as Device Owner"
            ]
        });
    } catch (e: any) {
        console.error("[device-owner-qr] Error:", e);
        return json({ error: "qr_generation_failed", message: e?.message || String(e) }, { status: 500 });
    }
}
