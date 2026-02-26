/**
 * Storage Migration Script: Azure Blob Storage → S3-compatible (OVHCloud)
 *
 * Discovers and migrates ALL Azure Blob containers (or specific ones from CLI args).
 * Files land in a single S3 bucket with keys like: <container>/<blob-path>
 *
 * Usage:
 *   # Migrate all containers
 *   npx ts-node scripts/migrate-storage.ts
 *
 *   # Migrate specific containers only
 *   npx ts-node scripts/migrate-storage.ts portalpay uploads apks
 *
 *   # Dry run (list files without transferring)
 *   npx ts-node scripts/migrate-storage.ts --dry-run
 *
 * Required env vars:
 *   Azure:   AZURE_STORAGE_CONNECTION_STRING (or AZURE_BLOB_CONNECTION_STRING)
 *   S3:      S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET_NAME, S3_REGION
 */

import dotenv from 'dotenv';
dotenv.config();

import { BlobServiceClient } from '@azure/storage-blob';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// ── Configuration ───────────────────────────────────────────────────────

const AZURE_CONN =
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
    process.env.AZURE_BLOB_CONNECTION_STRING ||
    "";

const S3_BUCKET = process.env.S3_BUCKET_NAME || "basaltsurge";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_REGION = process.env.S3_REGION || "us-west-or";

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SUMMARY_ONLY = args.includes("--summary-only");
const explicitContainers = args.filter(a => !a.startsWith("--"));

// ── S3 Client (inline — no app imports needed) ─────────────────────────

const s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    forcePathStyle: true,
});

async function s3Exists(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
        return true;
    } catch (e: any) {
        if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false;
        throw e;
    }
}

async function s3Upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    }));
}

// ── Main ────────────────────────────────────────────────────────────────

async function migrate() {
    console.log("🚀 Storage Migration: Azure Blob → S3");
    console.log(`   Target S3 bucket: ${S3_BUCKET}`);
    console.log(`   S3 endpoint:      ${S3_ENDPOINT}`);
    if (SUMMARY_ONLY) console.log("   📊 SUMMARY ONLY — showing container totals\n");
    else if (DRY_RUN) console.log("   ⚠️  DRY RUN — no files will be transferred\n");

    // Validate env
    if (!AZURE_CONN) {
        console.error("❌ AZURE_STORAGE_CONNECTION_STRING not set");
        process.exit(1);
    }
    if (!S3_ENDPOINT || !process.env.S3_ACCESS_KEY) {
        console.error("❌ S3 credentials not set (need S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY)");
        process.exit(1);
    }

    const blobService = BlobServiceClient.fromConnectionString(AZURE_CONN);

    // ── Discover containers ─────────────────────────────────────────
    let containerNames: string[];

    if (explicitContainers.length > 0) {
        containerNames = explicitContainers;
        console.log(`\n📦 Migrating specified containers: ${containerNames.join(", ")}`);
    } else {
        console.log("\n🔍 Discovering Azure Blob containers...");
        containerNames = [];
        for await (const c of blobService.listContainers()) {
            containerNames.push(c.name);
        }
        console.log(`   Found ${containerNames.length} containers: ${containerNames.join(", ")}`);
    }

    // ── Migrate each container ──────────────────────────────────────
    let totalFiles = 0;
    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let totalBytes = 0;

    for (const containerName of containerNames) {
        console.log(`\n📦 Container: ${containerName}`);
        const containerClient = blobService.getContainerClient(containerName);

        if (!await containerClient.exists()) {
            console.log(`   ⚠️  Container does not exist — skipping`);
            continue;
        }

        let fileCount = 0;
        let containerSize = 0;
        let containerSuccess = 0;
        let containerSkipped = 0;
        let containerFailed = 0;

        for await (const blob of containerClient.listBlobsFlat()) {
            fileCount++;
            totalFiles++;
            // S3 key = just the blob name (no container prefix)
            // The S3 bucket replaces the Azure container
            const s3Key = blob.name;
            const size = blob.properties.contentLength || 0;
            containerSize += size;

            if (SUMMARY_ONLY) {
                continue; // Just count, don't list or transfer
            }

            if (DRY_RUN) {
                console.log(`   📋 ${s3Key} (${formatBytes(size)})`);
                continue;
            }

            try {
                // Check if already exists in S3
                const exists = await s3Exists(s3Key);
                if (exists) {
                    containerSkipped++;
                    totalSkipped++;
                    continue;
                }

                // Download from Azure
                const blobClient = containerClient.getBlockBlobClient(blob.name);
                const downloadResponse = await blobClient.download(0);

                if (!downloadResponse.readableStreamBody) {
                    console.error(`   ❌ Empty body: ${s3Key}`);
                    containerFailed++;
                    totalFailed++;
                    continue;
                }

                const chunks: Buffer[] = [];
                for await (const chunk of downloadResponse.readableStreamBody) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                const buffer = Buffer.concat(chunks);

                // Upload to S3
                const contentType = blob.properties.contentType || guessContentType(blob.name);
                await s3Upload(s3Key, buffer, contentType);

                containerSuccess++;
                totalSuccess++;
                totalBytes += buffer.length;

                if (containerSuccess % 50 === 0) {
                    process.stdout.write(`   ✅ ${containerSuccess} transferred...\r`);
                }
            } catch (e: any) {
                console.error(`   ❌ Failed ${s3Key}: ${e.message}`);
                containerFailed++;
                totalFailed++;
            }
        }

        if (SUMMARY_ONLY || DRY_RUN) {
            console.log(`   📋 ${fileCount} files, ${formatBytes(containerSize)}`);
        } else {
            console.log(`   ✅ Done — transferred: ${containerSuccess}, skipped: ${containerSkipped}, failed: ${containerFailed}`);
        }
    }

    // ── Summary ─────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("📊 Migration Summary");
    console.log(`   Containers:   ${containerNames.length}`);
    console.log(`   Total files:  ${totalFiles}`);
    if (!DRY_RUN) {
        console.log(`   Transferred:  ${totalSuccess} (${formatBytes(totalBytes)})`);
        console.log(`   Skipped:      ${totalSkipped} (already in S3)`);
        console.log(`   Failed:       ${totalFailed}`);
    }
    console.log("════════════════════════════════════════\n");
}

// ── Helpers ─────────────────────────────────────────────────────────────

function guessContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const map: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif",
        svg: "image/svg+xml",
        json: "application/json",
        apk: "application/vnd.android.package-archive",
        zip: "application/zip",
        pdf: "application/pdf",
        txt: "text/plain",
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
    };
    return map[ext || ""] || "application/octet-stream";
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── Entry point ─────────────────────────────────────────────────────────

migrate().catch((err) => {
    console.error("💥 Migration failed:", err);
    process.exit(1);
});
