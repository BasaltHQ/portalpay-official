import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

function json(obj: any, init?: { status?: number; headers?: Record<string, string> }) {
    const s = JSON.stringify(obj);
    const len = new TextEncoder().encode(s).length;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Content-Length": String(len),
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        ...(init?.headers || {}),
    };
    return new NextResponse(s, { status: init?.status ?? 200, headers });
}

/**
 * Get the base Touchpoint APK (xoinpay-touchpoint-signed.apk) or fallback.
 * The user wants strict parity with Partner logic, so we fetch from blob or local.
 */
async function getBaseApkBytes(brandKey: string): Promise<Uint8Array | null> {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();

    if (conn && container) {
        try {
            const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");
            const { BlobServiceClient } = await import("@azure/storage-blob");
            const bsc = BlobServiceClient.fromConnectionString(conn);
            const cont = bsc.getContainerClient(container);

            // Try brand-specific touchpoint APK
            const blobName = prefix ? `${prefix}/${brandKey}-touchpoint-signed.apk` : `${brandKey}-touchpoint-signed.apk`;
            const blob = cont.getBlockBlobClient(blobName);
            if (await blob.exists()) {
                const buf = await blob.downloadToBuffer();
                console.log(`[Touchpoint Build] Found base APK in blob: ${blobName}`);
                return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
            }

            // Fallback: portalpay-touchpoint-signed.apk
            const fallbackBlobName = prefix ? `${prefix}/portalpay-touchpoint-signed.apk` : `portalpay-touchpoint-signed.apk`;
            const fallbackBlob = cont.getBlockBlobClient(fallbackBlobName);
            if (await fallbackBlob.exists()) {
                const buf = await fallbackBlob.downloadToBuffer();
                console.log(`[Touchpoint Build] Found fallback APK in blob: ${fallbackBlobName}`);
                return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
            }

        } catch (e) {
            console.warn("[Touchpoint Build] Blob fetch failed, trying local.", e);
        }
    }

    // Local Fallback (Dev environment)
    // Common path: android/launcher/recovered/portalpay-touchpoint-signed.apk ??
    // Let's look for *any* likely candidate.
    const possiblePaths = [
        path.join(process.cwd(), "android", "launcher", "recovered", "portalpay-touchpoint-signed.apk"),
        path.join(process.cwd(), "android", "launcher", "recovered", "xoinpay-touchpoint-signed.apk"),
        path.join(process.cwd(), "android", "launcher", "recovered", "portalpay-signed.apk"), // worst case
    ];

    for (const p of possiblePaths) {
        try {
            const data = await fs.readFile(p);
            console.log(`[Touchpoint Build] Using local base APK: ${p}`);
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } catch { }
    }

    return null;
}


/**
 * Modify wrap.html inside the APK (Fast JSZip Method).
 * COPIED FROM src/app/api/admin/devices/package/route.ts
 */
async function modifyApkEndpoint(apkBytes: Uint8Array, endpoint: string): Promise<Uint8Array> {
    const apkZip = await JSZip.loadAsync(apkBytes);

    // Find and modify wrap.html in assets folder
    const wrapHtmlPath = "assets/wrap.html";
    const wrapHtmlFile = apkZip.file(wrapHtmlPath);

    if (wrapHtmlFile) {
        let content = await wrapHtmlFile.async("string");

        // Ensure specific Touchpoint param
        const finalEndpoint = endpoint.includes("scale=") ? endpoint : `${endpoint}?scale=0.75`;
        console.log(`[Touchpoint Build] Injecting endpoint: ${finalEndpoint}`);

        // Regex 1: The standard wrap.html config
        // var src = qp.get("src") || "https://..."
        const endpointPattern = /var\s+src\s*=\s*qp\.get\s*\(\s*["']src["']\s*\)\s*\|\|\s*["']([^"']+)["']/;
        const match = content.match(endpointPattern);

        let modified = false;
        if (match) {
            content = content.replace(
                endpointPattern,
                `var src = qp.get("src") || "${finalEndpoint}"`
            );
            modified = true;
        } else {
            // Regex 2: Fallback replacement of hardcoded Azure URL
            const fallbackPattern = /https:\/\/(?:paynex|portalpay)\.azurewebsites\.net/g;
            if (fallbackPattern.test(content)) {
                content = content.replace(fallbackPattern, finalEndpoint);
                modified = true;
            }
        }

        if (modified) {
            apkZip.file(wrapHtmlPath, content);
            console.log(`[Touchpoint Build] Modified wrap.html successfully.`);
        } else {
            console.warn("[Touchpoint Build] WARNING: Could not find URL pattern in wrap.html to replace.");
        }

    } else {
        console.warn(`[Touchpoint Build] wrap.html not found! Is this the correct base APK?`);
    }

    // Remove old signature files - APK will be unsigned after modification
    const filesToRemove: string[] = [];
    apkZip.forEach((relativePath) => {
        if (relativePath.startsWith("META-INF/")) {
            filesToRemove.push(relativePath);
        }
    });
    for (const file of filesToRemove) {
        apkZip.remove(file);
    }
    console.log(`[Touchpoint Build] Removed ${filesToRemove.length} signature files.`);

    // Re-generate APK with proper per-file compression (Crucial for Android)
    const mustBeUncompressed = (filePath: string): boolean => {
        const name = filePath.split("/").pop() || "";
        if (name === "resources.arsc") return true;
        if (name.endsWith(".so")) return false; // Usually compressed in APK, extracted by OS
        return false;
    };

    const newApkZip = new JSZip();
    const allFiles: { path: string; file: JSZip.JSZipObject }[] = [];
    apkZip.forEach((relativePath, file) => {
        if (!file.dir) allFiles.push({ path: relativePath, file });
    });

    const fileWrites = allFiles.map(async ({ path: filePath, file }) => {
        const content = await file.async("nodebuffer");
        const compress = !mustBeUncompressed(filePath);
        newApkZip.file(filePath, content, {
            compression: compress ? "DEFLATE" : "STORE",
            compressionOptions: compress ? { level: 6 } : undefined,
        });
    });
    await Promise.all(fileWrites);

    const modifiedApk = await newApkZip.generateAsync({
        type: "nodebuffer",
        platform: "UNIX",
    });

    return new Uint8Array(modifiedApk.buffer, modifiedApk.byteOffset, modifiedApk.byteLength);
}

/**
 * Sign the APK using uber-apk-signer (Java).
 * Required because removing META-INF makes it installable only if re-signed.
 */
async function signApk(apkBytes: Uint8Array, brandKey: string): Promise<Uint8Array> {
    const { spawn } = await import("child_process");
    const os = await import("os");

    // Temp paths
    const buildId = `${brandKey}-${Date.now()}`;
    const tempDir = path.join(os.tmpdir(), `touchpoint-sign-${buildId}`);
    await fs.mkdir(tempDir, { recursive: true });

    const unsignedPath = path.join(tempDir, "unsigned.apk");
    const signerPath = path.join(process.cwd(), "tools", "uber-apk-signer.jar");
    // Determine Java executable
    let javaPath = "java";
    const localJrePath = path.join(process.cwd(), "tools", "jre-linux", "bin", "java");
    try { await fs.access(localJrePath); javaPath = localJrePath; } catch { }

    try {
        await fs.writeFile(unsignedPath, apkBytes);

        // Check if signer exists
        try {
            await fs.access(signerPath);
        } catch {
            console.error("[Touchpoint Build] Signer JAR not found. Returning unsigned APK (may fail install).");
            return apkBytes;
        }

        console.log("[Touchpoint Build] Signing APK...");
        await new Promise<void>((resolve, reject) => {
            const child = spawn(javaPath, ["-jar", signerPath, "-a", unsignedPath, "--allowResign", "-o", tempDir], { stdio: "pipe" });
            child.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Signer exited with code ${code}`));
            });
            child.on("error", reject);
        });

        const files = await fs.readdir(tempDir);
        const signedFile = files.find(f => f.includes("aligned") && f.includes("Signed") && f.endsWith(".apk"));
        if (!signedFile) throw new Error("Output signed APK not found.");

        const signedBytes = await fs.readFile(path.join(tempDir, signedFile));
        return new Uint8Array(signedBytes);

    } catch (e) {
        console.error("[Touchpoint Build] Signing failed:", e);
        throw e;
    } finally {
        try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { }
    }
}

/**
 * Upload to Azure Blob
 */
async function uploadApk(brandKey: string, apkBytes: Uint8Array) {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();
    if (!conn) throw new Error("Azure Storage not configured");

    const { BlobServiceClient } = await import("@azure/storage-blob");
    const bsc = BlobServiceClient.fromConnectionString(conn);
    const cont = bsc.getContainerClient(container);
    await cont.createIfNotExists({ access: "blob" });

    const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");
    const blobName = prefix ? `${prefix}/${brandKey}-touchpoint-signed.apk` : `${brandKey}-touchpoint-signed.apk`;
    const blob = cont.getBlockBlobClient(blobName);

    await blob.uploadData(apkBytes, {
        blobHTTPHeaders: {
            blobContentType: "application/vnd.android.package-archive",
            blobContentDisposition: `attachment; filename="${brandKey}-touchpoint.apk"`,
        }
    });

    return { url: blob.url, size: apkBytes.byteLength };
}

/**
 * POST /api/touchpoint/build
 */
export async function POST(req: NextRequest) {
    try {
        await requireThirdwebAuth(req); // verify user exists, strictly speaking
    } catch {
        return json({ error: "unauthorized" }, { status: 401 });
    }

    let body;
    try { body = await req.json(); } catch { return json({ error: "invalid_body" }, { status: 400 }); }

    const brandKey = String(body.brandKey || "").trim();
    const endpoint = String(body.endpoint || "").trim();

    if (!brandKey) return json({ error: "brandKey required" }, { status: 400 });

    try {
        // 1. Get Base APK
        const baseBytes = await getBaseApkBytes(brandKey);
        if (!baseBytes) return json({ error: "No base APK found for touchpoint" }, { status: 404 });

        // 2. Modify Logic (JSZip - Fast)
        let processedBytes = baseBytes;
        if (endpoint) {
            processedBytes = await modifyApkEndpoint(baseBytes, endpoint);
        }

        // 3. Sign Logic (Uber Apk Signer - Fast)
        // (Only strictly needed if we modified it, but good practice to ensure it's always signed)
        if (endpoint) {
            processedBytes = await signApk(processedBytes, brandKey);
        }

        // 4. Upload
        const result = await uploadApk(brandKey, processedBytes);

        return json({
            success: true,
            blobUrl: result.url,
            size: result.size
        });

    } catch (e: any) {
        console.error("[Touchpoint Build] Error:", e);
        return json({ error: e.message || "Build failed" }, { status: 500 });
    }
}
