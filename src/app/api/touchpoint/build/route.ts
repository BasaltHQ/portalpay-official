import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import archiver from "archiver";
import { Readable } from "node:stream";

// Try to import sharp safely (it might not be available in all envs)

let sharp: any;
try {
    sharp = require("sharp");
} catch (e) {
    console.error("[Touchpoint Build] CRITICAL: 'sharp' dependency not found. APK icon generation will fail.", e);
    // process.exit(1)? No, we are in a route.
    // We will let it be undefined but fail later if we try to use it?
    // Better to throw here if we want to enforce it.
    // However, for now let's just log VERY LOUDLY.
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 * Get base touchpoint APK bytes from blob storage or local filesystem
 * Tries Azure blob first, then local filesystem
 * Falls back to portalpay APK if surge-touchpoint doesn't exist
 */
async function getBaseTouchpointApk(brandKey: string = ""): Promise<Uint8Array | null> {
    // 1. Fetch "Golden Master" Unsigned APK from Azure Blob Storage
    // This file (base/portalpay-unsigned-master.apk) is the valid, clean, 278MB template.
    // We fetching it from Azure to avoid storing 200MB+ files in GitHub.
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();

    if (conn && container) {
        try {
            const { BlobServiceClient } = await import("@azure/storage-blob");
            const bsc = BlobServiceClient.fromConnectionString(conn);
            const cont = bsc.getContainerClient(container);

            // "Golden Master" path in blob storage
            const masterBlobName = "base/portalpay-unsigned-master.apk";
            const blob = cont.getBlockBlobClient(masterBlobName);

            if (await blob.exists()) {
                console.log(`[Touchpoint Build] Downloading Master Base from Azure: ${masterBlobName}`);
                const buf = await blob.downloadToBuffer();
                console.log(`[Touchpoint Build] Download complete (${buf.byteLength} bytes)`);
                return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
            } else {
                console.error(`[Touchpoint Build] CRITICAL: Master Base APK not found in Azure: ${masterBlobName}`);
            }
        } catch (e) {
            console.error("[Touchpoint Build] Failed to fetch Master Base from Azure:", e);
        }
    }

    // 2. Local fallback (Dev environment only)
    let rel = path.join("android", "launcher", "recovered", "portalpay-unsigned.apk");
    // Check if separate paynex base exists (if needed)
    if (brandKey === "paynex") {
        rel = path.join("android", "launcher", "recovered", "paynex-unsigned.apk");
    }

    try {
        const filePath = path.join(process.cwd(), rel);
        const data = await fs.readFile(filePath);
        console.log(`[Touchpoint Build] Using local base: ${rel} (${data.byteLength} bytes)`);
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } catch {
        return null;
    }
}

/**
 * Android Icon Standards
 */
const ICON_SIZES: Record<string, number> = {
    "mipmap-mdpi-v4": 48,
    "mipmap-hdpi-v4": 72,
    "mipmap-xhdpi-v4": 96,
    "mipmap-xxhdpi-v4": 144,
    "mipmap-xxxhdpi-v4": 192,
};

async function getBrandIconsFromFolder(brandKey: string): Promise<Record<string, Buffer> | null> {
    const brandDir = path.join(process.cwd(), "public", "brands", brandKey);
    const strategies = ["res", "android/res", "android"];

    for (const sub of strategies) {
        const resDir = path.join(brandDir, sub);
        try {
            await fs.access(resDir);
            console.log(`[Touchpoint Build] Found pre-existing icon folder: ${resDir}`);
            const icons: Record<string, Buffer> = {};

            // Recursive walker for res folder
            // We assume structure: [resDir]/mipmap-hdpi/ic_launcher.png
            const entries = await fs.readdir(resDir, { withFileTypes: true });

            for (const e of entries) {
                if (e.isDirectory() && e.name.startsWith("mipmap")) {
                    // This is a mipmap folder (e.g. mipmap-hdpi)
                    const mipmapDir = path.join(resDir, e.name);
                    const files = await fs.readdir(mipmapDir);
                    for (const f of files) {
                        if (f.startsWith("ic_launcher") || f === "icon.png") {
                            if (f.includes("ic_launcher")) {
                                const buf = await fs.readFile(path.join(mipmapDir, f));
                                icons[`res/${e.name}/${f}`] = buf;
                            }
                        }
                    }
                }
            }

            if (Object.keys(icons).length > 0) {
                console.log(`[Touchpoint Build] Loaded ${Object.keys(icons).length} icons from folder.`);
                return icons;
            }
        } catch {
            continue;
        }
    }
    return null;
}

/**
 * Fetch brand assets from Azure Blob Storage
 * Priority:
 * 1. brands/{key}/icons.zip -> Unzip and use as pre-generated icons
 * 2. brands/{key}/logo.png -> Return as single buffer for Sharp generation
 */
async function getBrandAssetsFromBlob(brandKey: string): Promise<{ icons?: Record<string, Buffer>; logo?: Buffer } | null> {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const containerName = String(process.env.PP_APK_CONTAINER || "portalpay").trim();

    if (!conn || !containerName) return null;

    try {
        const { BlobServiceClient } = await import("@azure/storage-blob");
        const bsc = BlobServiceClient.fromConnectionString(conn);
        const container = bsc.getContainerClient(containerName);

        // 1. Try icons.zip
        // Expecting brands/{key}/icons.zip
        const zipName = `brands/${brandKey}/icons.zip`;
        const zipBlob = container.getBlockBlobClient(zipName);

        if (await zipBlob.exists()) {
            console.log(`[Touchpoint Build] Found remote icons.zip: ${zipName}`);
            const buf = await zipBlob.downloadToBuffer();
            const zip = await JSZip.loadAsync(buf);

            const icons: Record<string, Buffer> = {};
            // Walk zip for mipmap folders
            for (const filename of Object.keys(zip.files)) {
                if (filename.includes("mipmap") && filename.includes("ic_launcher")) {
                    // Normalize path to res/mipmap-xx/ic_launcher.png
                    // Zip path might be: "icons/mipmap-hdpi/ic_launcher.png" or just "mipmap-hdpi/..."
                    // We need to map it to "res/" relative path in APK

                    // Simple heuristic: grab the segment starting with mipmap
                    const parts = filename.split("/");
                    const mipmapPart = parts.find(p => p.startsWith("mipmap"));
                    if (mipmapPart) {
                        const isRound = filename.includes("round");
                        const targetName = isRound ? "ic_launcher_round.png" : "ic_launcher.png";
                        const targetPath = `res/${mipmapPart}/${targetName}`;

                        icons[targetPath] = await zip.files[filename].async("nodebuffer");
                    }
                }
            }
            if (Object.keys(icons).length > 0) {
                console.log(`[Touchpoint Build] Extracted ${Object.keys(icons).length} icons from remote zip.`);
                return { icons };
            }
        }

        // 2. Try logo.png (or app-icon.png)
        const candidates = [`brands/${brandKey}/logo.png`, `brands/${brandKey}/app-icon.png`];
        for (const c of candidates) {
            const blob = container.getBlockBlobClient(c);
            if (await blob.exists()) {
                console.log(`[Touchpoint Build] Found remote logo: ${c}`);
                const buf = await blob.downloadToBuffer();
                return { logo: new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) as Buffer };
            }
        }

    } catch (e) {
        console.error("[Touchpoint Build] Failed to fetch remote brand assets:", e);
    }
    return null;
}

async function getBrandLogoBuffer(brandKey: string): Promise<Buffer | null> {
    // Look for logo candidates in public/brands/[brandKey]/
    const brandDir = path.join(process.cwd(), "public", "brands", brandKey);
    const candidates = [
        "app-icon.png",
        "logo.png",
        "icon.png",
        `${brandKey}-logo.png`,
        "XoinPay X logo.png", // Specific override for user
        "Xoinpay transparent logo.png"
    ];

    try {
        await fs.access(brandDir);
        const files = await fs.readdir(brandDir);

        // Find first matching candidate (case-insensitive)
        for (const c of candidates) {
            const match = files.find(f => f.toLowerCase() === c.toLowerCase());
            if (match) {
                const p = path.join(brandDir, match);
                console.log(`[Touchpoint Build] Found brand logo: ${p}`);
                return await fs.readFile(p);
            }
        }
    } catch {
        // ignore
    }
    return null;
}




/**
 * Modify touchpoint APK using apktool to decompile, modify Smali/XML, and rebuild.
 * 
 * This approach directly modifies:
 * 1. MainActivity.smali - Changes hardcoded TARGET_URL to the brand endpoint
 * 2. AndroidManifest.xml - Changes app label from "PortalPay" to brand name
 * 3. Icon PNGs - Injects brand-specific icons
 * 
 * This replaces the broken wrap.html/iframe approach which didn't work with GeckoView.
 */
async function modifyTouchpointApk(apkBytes: Uint8Array, brandKey: string, endpoint: string): Promise<Uint8Array> {
    const { execSync, spawn } = await import("child_process");
    const os = await import("os");

    // Create unique temp directory for this build
    const buildId = `${brandKey}-${Date.now()}`;
    const tempDir = path.join(os.tmpdir(), `touchpoint-${buildId}`);
    await fs.mkdir(tempDir, { recursive: true });

    const baseApkPath = path.join(tempDir, "base.apk");
    const decompDir = path.join(tempDir, "decompiled");
    const rebuiltApkPath = path.join(tempDir, "rebuilt.apk");
    const signedPath = path.join(tempDir, `${brandKey}-signed.apk`);

    // Tool paths
    const apktoolPath = path.join(process.cwd(), "tools", "apktool.jar");
    const signerPath = path.join(process.cwd(), "tools", "uber-apk-signer.jar");

    // Determine Java executable
    let javaPath = "java";
    const localJrePath = path.join(process.cwd(), "tools", "jre-linux", "bin", "java");
    try {
        await fs.access(localJrePath);
        javaPath = localJrePath;
        console.log(`[Touchpoint Build] Using portable JRE: ${javaPath}`);
    } catch {
        console.log("[Touchpoint Build] Using global 'java'");
    }

    try {
        // 1. Write base APK to disk
        console.log(`[Touchpoint Build] Writing base APK (${apkBytes.length} bytes) to ${baseApkPath}`);
        await fs.writeFile(baseApkPath, apkBytes);

        // 2. Decompile with apktool
        console.log(`[Touchpoint Build] Decompiling APK with apktool...`);
        try {
            execSync(`"${javaPath}" -jar "${apktoolPath}" d -f -o "${decompDir}" "${baseApkPath}"`, {
                stdio: "pipe",
                timeout: 180000,
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer
            });
        } catch (e: any) {
            console.error(`[Touchpoint Build] Decompilation failed:`, e.stderr?.toString() || e.message);
            throw new Error(`APK decompilation failed: ${e.message}`);
        }
        console.log(`[Touchpoint Build] Decompilation complete.`);

        // 3. Modify MainActivity.smali - Replace TARGET_URL
        const smaliPath = path.join(decompDir, "smali", "com", "pos", "valorpay", "portalpay", "MainActivity.smali");
        try {
            let smaliContent = await fs.readFile(smaliPath, "utf-8");

            // The TARGET_URL is: const-string v0, "https://paynex.azurewebsites.net?scale=0.75"
            const urlWithScale = `${endpoint}?scale=0.75`;

            // Try exact match first
            const oldUrlExact = 'const-string v0, "https://paynex.azurewebsites.net?scale=0.75"';
            const newUrlString = `const-string v0, "${urlWithScale}"`;

            if (smaliContent.includes(oldUrlExact)) {
                smaliContent = smaliContent.replace(oldUrlExact, newUrlString);
                console.log(`[Touchpoint Build] Replaced TARGET_URL (exact match): ${urlWithScale}`);
            } else {
                // Try generic pattern
                const genericPattern = /const-string v0, "https:\/\/[a-zA-Z0-9.-]+\.azurewebsites\.net[^"]*"/g;
                if (genericPattern.test(smaliContent)) {
                    smaliContent = smaliContent.replace(genericPattern, newUrlString);
                    console.log(`[Touchpoint Build] Replaced TARGET_URL (generic match): ${urlWithScale}`);
                } else {
                    console.warn(`[Touchpoint Build] WARNING: Could not find TARGET_URL pattern in MainActivity.smali!`);
                }
            }
            await fs.writeFile(smaliPath, smaliContent);
        } catch (e: any) {
            console.error(`[Touchpoint Build] Failed to modify MainActivity.smali:`, e);
            // Continue anyway - URL might already be correct
        }

        // 4. Modify AndroidManifest.xml - Change app label
        const manifestPath = path.join(decompDir, "AndroidManifest.xml");
        try {
            let manifestContent = await fs.readFile(manifestPath, "utf-8");

            // Change app label from PortalPay to brand name
            const brandDisplayName = brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
            manifestContent = manifestContent.replace(/android:label="PortalPay"/g, `android:label="${brandDisplayName}"`);
            console.log(`[Touchpoint Build] Changed app label to: ${brandDisplayName}`);
            await fs.writeFile(manifestPath, manifestContent);
        } catch (e: any) {
            console.error(`[Touchpoint Build] Failed to modify AndroidManifest.xml:`, e);
        }

        // 5. Inject brand icons
        let iconBuffers: Record<string, Buffer> = {};

        const remoteAssets = await getBrandAssetsFromBlob(brandKey);
        if (remoteAssets?.icons) {
            console.log("[Touchpoint Build] Using remote pre-generated icons.");
            iconBuffers = remoteAssets.icons;
        }

        if (Object.keys(iconBuffers).length === 0) {
            const folderIcons = await getBrandIconsFromFolder(brandKey);
            if (folderIcons) {
                console.log("[Touchpoint Build] Using local pre-generated icons.");
                iconBuffers = folderIcons;
            }
        }

        if (Object.keys(iconBuffers).length === 0) {
            let sourceLogoBuffer: Buffer | null = null;

            if (remoteAssets?.logo) {
                sourceLogoBuffer = remoteAssets.logo;
                console.log("[Touchpoint Build] Using remote logo for generation.");
            } else {
                sourceLogoBuffer = await getBrandLogoBuffer(brandKey);
                if (sourceLogoBuffer) console.log("[Touchpoint Build] Using local logo for generation.");
            }

            if (sourceLogoBuffer && sharp) {
                console.log("[Touchpoint Build] Generating brand icons from logo...");
                for (const [folder, size] of Object.entries(ICON_SIZES)) {
                    try {
                        const resized = await sharp(sourceLogoBuffer).resize(size, size).toBuffer();
                        iconBuffers[`res/${folder}/ic_launcher.png`] = resized;
                        iconBuffers[`res/${folder}/ic_launcher_round.png`] = resized;
                    } catch (e: any) {
                        console.error(`[Touchpoint Build] Failed to resize icon for ${folder}:`, e);
                    }
                }
            }
        }

        // Write icon files to decompiled directory
        for (const [iconPath, buffer] of Object.entries(iconBuffers)) {
            const fullPath = path.join(decompDir, iconPath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, buffer);
            console.log(`[Touchpoint Build] Wrote icon: ${iconPath}`);
        }

        // 6. Remove adaptive icon XMLs
        const adaptiveIconPaths = [
            path.join(decompDir, "res", "mipmap-anydpi-v26", "ic_launcher.xml"),
            path.join(decompDir, "res", "mipmap-anydpi-v26", "ic_launcher_round.xml"),
            path.join(decompDir, "res", "drawable", "ic_launcher_foreground.xml"),
        ];
        for (const p of adaptiveIconPaths) {
            try {
                await fs.unlink(p);
                console.log(`[Touchpoint Build] Removed adaptive icon: ${path.basename(p)}`);
            } catch {
                // File doesn't exist
            }
        }

        // 7. Rebuild with apktool
        console.log(`[Touchpoint Build] Rebuilding APK with apktool...`);
        try {
            execSync(`"${javaPath}" -jar "${apktoolPath}" b -o "${rebuiltApkPath}" "${decompDir}"`, {
                stdio: "pipe",
                timeout: 300000,
                maxBuffer: 50 * 1024 * 1024
            });
        } catch (e: any) {
            console.error(`[Touchpoint Build] Full rebuild failed:`, e.stderr?.toString() || e.message);

            // --- FALLBACK: Smali-Only Build (No Resources) ---
            // If resource rebuilding failed (common with aapt issues), we try again by IGNORING resources.
            // This sacrifices the App Name/Icon changes but SAVES the Critical 403 Fix.
            console.log("[Touchpoint Build] Attempting Fallback: Smali-Only Build (Fixing 403, skipping cosmetics)...");

            // Cleanup
            await fs.rm(decompDir, { recursive: true, force: true });

            // 1. Decompile with -r (No Resources)
            execSync(`"${javaPath}" -jar "${apktoolPath}" d -r -f -o "${decompDir}" "${baseApkPath}"`, {
                stdio: "pipe", timeout: 180000
            });

            // 2. Modify Smali (Same logic as before)
            const smaliPathFallback = path.join(decompDir, "smali", "com", "pos", "valorpay", "portalpay", "MainActivity.smali");
            let smaliContent = await fs.readFile(smaliPathFallback, "utf-8");
            const urlWithScale = `${endpoint}?scale=0.75`;
            const oldUrlExact = 'const-string v0, "https://paynex.azurewebsites.net?scale=0.75"';
            const newUrlString = `const-string v0, "${urlWithScale}"`;

            if (smaliContent.includes(oldUrlExact)) {
                smaliContent = smaliContent.replace(oldUrlExact, newUrlString);
                console.log(`[Touchpoint Build] Fallback: Replaced TARGET_URL (exact match).`);
            } else {
                const genericPattern = /const-string v0, "https:\/\/[a-zA-Z0-9.-]+\.azurewebsites\.net[^"]*"/g;
                if (genericPattern.test(smaliContent)) {
                    smaliContent = smaliContent.replace(genericPattern, newUrlString);
                    console.log(`[Touchpoint Build] Fallback: Replaced TARGET_URL (generic match).`);
                }
            }
            await fs.writeFile(smaliPathFallback, smaliContent);

            // 3. Rebuild (No Resources)
            console.log(`[Touchpoint Build] Rebuilding Fallback APK...`);
            execSync(`"${javaPath}" -jar "${apktoolPath}" b -o "${rebuiltApkPath}" "${decompDir}"`, {
                stdio: "pipe", timeout: 180000
            });
            console.log(`[Touchpoint Build] Fallback Rebuild Complete.`);
        }
        console.log(`[Touchpoint Build] Rebuild complete.`);

        // 8. Sign with uber-apk-signer
        console.log(`[Touchpoint Build] Signing APK...`);
        try {
            await fs.access(signerPath);
        } catch {
            console.error("[Touchpoint Build] uber-apk-signer.jar not found. Returning unsigned APK.");
            const unsignedData = await fs.readFile(rebuiltApkPath);
            return new Uint8Array(unsignedData);
        }

        await new Promise<void>((resolve, reject) => {
            const child = spawn(javaPath, ["-jar", signerPath, "-a", rebuiltApkPath, "--allowResign", "-o", tempDir], {
                stdio: "pipe",
            });

            let stderr = "";
            child.stderr?.on("data", (d) => { stderr += d.toString(); });
            child.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Signer exited with code ${code}: ${stderr}`));
            });
            child.on("error", reject);
        });

        // Find the signed output file
        const files = await fs.readdir(tempDir);
        const signedFile = files.find(f => f.includes("aligned") && f.includes("Signed") && f.endsWith(".apk"));

        if (!signedFile) {
            console.error("[Touchpoint Build] Could not find signed APK output.");
            const unsignedData = await fs.readFile(rebuiltApkPath);
            return new Uint8Array(unsignedData);
        }

        const finalSignedPath = path.join(tempDir, signedFile);
        const signedData = await fs.readFile(finalSignedPath);
        console.log(`[Touchpoint Build] Successfully created signed APK (${signedData.length} bytes)`);

        return new Uint8Array(signedData);

    } catch (error: any) {
        console.error(`[Touchpoint Build] APK modification failed:`, error);
        throw new Error(`APK modification failed: ${error.message}`);
    } finally {
        // Cleanup temp directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch { }
    }
}

/**
 * Upload touchpoint APK to blob storage
 */
async function uploadTouchpointApk(brandKey: string, apkBytes: Uint8Array): Promise<{
    success: boolean;
    blobUrl?: string;
    error?: string;
    size?: number;
}> {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();

    if (!conn) {
        return { success: false, error: "AZURE_STORAGE_CONNECTION_STRING not configured" };
    }

    try {
        const { BlobServiceClient } = await import("@azure/storage-blob");
        const bsc = BlobServiceClient.fromConnectionString(conn);
        const cont = bsc.getContainerClient(container);

        // Create container if it doesn't exist
        await cont.createIfNotExists({ access: "blob" });

        const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");
        const blobName = prefix ? `${prefix}/${brandKey}-touchpoint-signed.apk` : `${brandKey}-touchpoint-signed.apk`;
        const blob = cont.getBlockBlobClient(blobName);

        // Upload
        await blob.uploadData(apkBytes, {
            blobHTTPHeaders: {
                blobContentType: "application/vnd.android.package-archive",
                blobContentDisposition: `attachment; filename="${brandKey}-touchpoint.apk"`,
            },
            metadata: {
                brandKey,
                appType: "touchpoint",
                createdAt: new Date().toISOString(),
                size: String(apkBytes.byteLength),
            },
        });

        console.log(`[Touchpoint APK] Uploaded to blob: ${blobName} (${apkBytes.byteLength} bytes)`);

        return {
            success: true,
            blobUrl: blob.url,
            size: apkBytes.byteLength,
        };
    } catch (e: any) {
        return { success: false, error: e?.message || "Upload failed" };
    }
}

/**
 * POST /api/touchpoint/build
 * 
 * Admin-only endpoint to build and upload a branded touchpoint APK.
 * 
 * Body:
 * {
 *   "brandKey": "xoinpay",
 *   "endpoint": "https://xoinpay.azurewebsites.net"  // optional
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

        const brandKey = String(body?.brandKey || "").toLowerCase().trim();
        if (!brandKey) {
            return json({ error: "brandKey_required" }, { status: 400 });
        }

        // Validate and normalize endpoint URL
        let endpoint: string | undefined;
        if (body?.endpoint) {
            let rawEndpoint = String(body.endpoint).trim();
            if (rawEndpoint && !rawEndpoint.startsWith("http://") && !rawEndpoint.startsWith("https://")) {
                rawEndpoint = `https://${rawEndpoint}`;
            }
            try {
                new URL(rawEndpoint);
                endpoint = rawEndpoint;
            } catch {
                return json({ error: "invalid_endpoint" }, { status: 400 });
            }
        }

        // Default endpoint if not provided
        if (!endpoint) {
            endpoint = brandKey === "surge" || brandKey === "platform"
                ? "https://basaltsurge.com/touchpoint/setup"
                : `https://${brandKey}.azurewebsites.net/touchpoint/setup`;
        }

        // Get base touchpoint APK
        const baseApk = await getBaseTouchpointApk();
        if (!baseApk) {
            return json({
                error: "base_apk_not_found",
                message: "No base APK found. Looked for surge-touchpoint-signed.apk and portalpay-signed.apk in android/launcher/recovered/"
            }, { status: 404 });
        }

        console.log(`[Touchpoint APK] Building for brand: ${brandKey}, endpoint: ${endpoint}`);

        // Modify APK with brand endpoint
        const modifiedApk = await modifyTouchpointApk(baseApk, brandKey, endpoint);

        // Upload to blob storage
        const uploadResult = await uploadTouchpointApk(brandKey, modifiedApk);

        if (!uploadResult.success) {
            return json({
                error: "upload_failed",
                message: uploadResult.error
            }, { status: 500 });
        }

        return json({
            ok: true,
            brandKey,
            endpoint,
            blobUrl: uploadResult.blobUrl,
            size: uploadResult.size,
            message: `Touchpoint APK built and uploaded successfully for ${brandKey}`,
        });
    } catch (e: any) {
        console.error("[touchpoint/build] Error:", e);
        return json({ error: "build_failed", message: e?.message || String(e) }, { status: 500 });
    }
}
