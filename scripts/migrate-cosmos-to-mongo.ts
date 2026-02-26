/**
 * Universal Migration Script: Azure Cosmos DB → MongoDB
 *
 * Auto-discovers all Cosmos DB containers and migrates them to MongoDB collections.
 * Optionally rewrites brand names and Azure Blob URLs in all documents.
 *
 * Usage:
 *   # Auto-discover and migrate ALL containers
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts
 *
 *   # Migrate specific containers only
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --containers payportal_events support_tickets
 *
 *   # Rename a container → collection during migration
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --rename payportal_events:basaltsurge_events
 *
 *   # Rewrite brand names in document data
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --rewrite portalpay:basaltsurge --rewrite payportal:basaltsurge
 *
 *   # Dry run (connect and count, no data written)
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --dry-run
 *
 *   # Full example for BasaltSurge migration:
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts \
 *     --rename payportal_events:basaltsurge_events \
 *     --rewrite portalpay:basaltsurge --rewrite payportal:basaltsurge \
 *     --rewrite PortalPay:BasaltSurge --rewrite PayPortal:BasaltSurge \
 *     --rewrite PORTALPAY:BASALTSURGE --rewrite PAYPORTAL:BASALTSURGE
 *
 * Required env vars:
 *   COSMOS_CONNECTION_STRING   — Source Cosmos DB connection string
 *   MONGODB_CONNECTION_STRING  — Target MongoDB connection string (mongodb+srv://...)
 *
 * Optional env vars:
 *   COSMOS_DB_ID / COSMOS_PAYPORTAL_DB_ID  — Source Cosmos database name
 *   DB_NAME                                — Target MongoDB database name
 *   AZURE_STORAGE_CONNECTION_STRING        — For auto-detecting Azure Blob hostname (URL rewriting)
 *   S3_ENDPOINT                            — Target S3 endpoint (URL rewriting)
 *   S3_BUCKET_NAME                         — Target S3 bucket (URL rewriting)
 *   NEXT_PUBLIC_AFD_HOSTNAME               — Azure Front Door hostname (URL rewriting)
 */

import dotenv from 'dotenv';
dotenv.config();

import { CosmosClient } from "@azure/cosmos";
import { MongoClient } from "mongodb";

// ── CLI Argument Parsing ────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArgValues(flag: string): string[] {
    const values: string[] = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === flag && i + 1 < args.length) {
            values.push(args[i + 1]);
            i++; // skip value
        }
    }
    return values;
}

const DRY_RUN = args.includes("--dry-run");

// --containers payportal_events support_tickets
const flagIdx = args.indexOf("--containers");
const explicitContainers: string[] = [];
if (flagIdx >= 0) {
    for (let i = flagIdx + 1; i < args.length && !args[i].startsWith("--"); i++) {
        explicitContainers.push(args[i]);
    }
}

// --rename payportal_events:basaltsurge_events (can repeat)
const renameRaw = getArgValues("--rename");
const COLLECTION_MAP: Record<string, string> = {};
for (const r of renameRaw) {
    const [from, to] = r.split(":");
    if (from && to) COLLECTION_MAP[from] = to;
}

// --rewrite portalpay:basaltsurge (can repeat)
const rewriteRaw = getArgValues("--rewrite");
const BRAND_REWRITES: Array<{ from: string; to: string }> = [];
for (const r of rewriteRaw) {
    const [from, to] = r.split(":");
    if (from && to) BRAND_REWRITES.push({ from, to });
}

// ── Configuration ───────────────────────────────────────────────────────

const COSMOS_CONN = process.env.COSMOS_CONNECTION_STRING || "";
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING || "";
const COSMOS_DB_ID = process.env.COSMOS_DB_ID || process.env.COSMOS_PAYPORTAL_DB_ID || "";
const TARGET_DB = process.env.DB_NAME || "";

// Fields to cast from Cosmos Strings/Numbers to MongoDB Date objects
const DATE_FIELDS = ["createdAt", "updatedAt", "timestamp", "deletedAt", "resolvedAt", "lastSeen", "firstSeen"];

// ── Azure URL → S3 URL rewriting (auto-configured from env) ────────────

function detectAzureBlobHostname(): string {
    if (process.env.AZURE_BLOB_HOSTNAME) return process.env.AZURE_BLOB_HOSTNAME;
    const azConn = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "";
    const match = azConn.match(/AccountName=([^;]+)/i);
    if (match) return `${match[1]}.blob.core.windows.net`;
    return "";
}

const AZURE_BLOB_HOST = detectAzureBlobHostname();
const S3_ENDPOINT = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
const S3_BUCKET = process.env.S3_BUCKET_NAME || "";
const AZURE_AFD_HOST = process.env.NEXT_PUBLIC_AFD_HOSTNAME || "";
const URL_REWRITE_ENABLED = !!(AZURE_BLOB_HOST && S3_ENDPOINT && S3_BUCKET);

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
    if (!COSMOS_CONN) {
        console.error("❌ COSMOS_CONNECTION_STRING not set");
        process.exit(1);
    }
    if (!MONGO_URI) {
        console.error("❌ MONGODB_CONNECTION_STRING not set");
        process.exit(1);
    }

    console.log("🔗 Connecting to Cosmos DB...");
    const cosmos = new CosmosClient(COSMOS_CONN);

    // Auto-detect Cosmos database if not specified
    let cosmosDbId = COSMOS_DB_ID;
    if (!cosmosDbId) {
        console.log("   Auto-discovering Cosmos databases...");
        const { resources: dbs } = await cosmos.databases.readAll().fetchAll();
        if (dbs.length === 0) {
            console.error("❌ No databases found in Cosmos DB account");
            process.exit(1);
        }
        cosmosDbId = dbs[0].id;
        if (dbs.length > 1) {
            console.log(`   Found ${dbs.length} databases: ${dbs.map(d => d.id).join(", ")}`);
            console.log(`   Using first: ${cosmosDbId} (set COSMOS_DB_ID to override)`);
        }
    }
    console.log(`   Cosmos Database: ${cosmosDbId}`);

    const targetDb = TARGET_DB || cosmosDbId;

    console.log("🔗 Connecting to MongoDB...");
    const mongo = new MongoClient(MONGO_URI);
    await mongo.connect();
    const db = mongo.db(targetDb);
    console.log(`   MongoDB Database: ${targetDb}`);

    // Log configuration
    if (DRY_RUN) console.log("\n⚠️  DRY RUN — no data will be written\n");

    if (BRAND_REWRITES.length > 0) {
        console.log(`\n🔤 Brand Rewrites:`);
        for (const r of BRAND_REWRITES) console.log(`   "${r.from}" → "${r.to}"`);
    }

    if (URL_REWRITE_ENABLED) {
        console.log(`\n🔗 URL Rewriting enabled:`);
        console.log(`   Azure: https://${AZURE_BLOB_HOST}/...`);
        if (AZURE_AFD_HOST) console.log(`   AFD:   https://${AZURE_AFD_HOST}/...`);
        console.log(`   →  S3: ${S3_ENDPOINT}/${S3_BUCKET}/...`);
    } else {
        console.log(`\n📌 URL Rewriting: DISABLED (no S3_ENDPOINT/S3_BUCKET_NAME set)`);
    }

    if (Object.keys(COLLECTION_MAP).length > 0) {
        console.log(`\n📝 Collection Renames:`);
        for (const [from, to] of Object.entries(COLLECTION_MAP)) console.log(`   ${from} → ${to}`);
    }

    // ── Discover containers ─────────────────────────────────────────
    let containerNames: string[];
    const cosmosDb = cosmos.database(cosmosDbId);

    if (explicitContainers.length > 0) {
        containerNames = explicitContainers;
        console.log(`\n📦 Migrating specified containers: ${containerNames.join(", ")}`);
    } else {
        console.log("\n🔍 Auto-discovering Cosmos containers...");
        const { resources: containers } = await cosmosDb.containers.readAll().fetchAll();
        containerNames = containers.map(c => c.id);
        console.log(`   Found ${containerNames.length}: ${containerNames.join(", ")}`);
    }

    // ── Migrate each container ──────────────────────────────────────
    let totalDocs = 0;
    let totalErrors = 0;

    for (const containerName of containerNames) {
        const targetName = COLLECTION_MAP[containerName] || containerName;
        console.log(`\n📦 ${containerName} → ${targetName}`);

        try {
            const container = cosmosDb.container(containerName);
            const collection = db.collection(targetName);

            const queryIterator = container.items.query({ query: "SELECT * FROM c" });
            let containerDocCount = 0;

            while (queryIterator.hasMoreResults()) {
                const { resources: batch } = await queryIterator.fetchNext();
                if (!batch || batch.length === 0) continue;

                const transformed = batch.map((doc) => transformDocument(doc));

                if (DRY_RUN) {
                    containerDocCount += transformed.length;
                    totalDocs += transformed.length;
                    process.stdout.write(`   Counted ${containerDocCount} documents...\r`);
                    continue;
                }

                try {
                    const result = await collection.insertMany(transformed as any[], { ordered: false });
                    containerDocCount += result.insertedCount;
                    totalDocs += result.insertedCount;
                    process.stdout.write(`   Inserted ${containerDocCount} documents...\r`);
                } catch (err: any) {
                    if (err.code === 11000) {
                        const inserted = err.result?.insertedCount || 0;
                        containerDocCount += inserted;
                        totalDocs += inserted;
                        totalErrors += transformed.length - inserted;
                        console.warn(`\n   ⚠️ ${transformed.length - inserted} duplicates skipped`);
                    } else {
                        throw err;
                    }
                }
            }

            console.log(`\n   ✅ ${containerDocCount} documents`);
        } catch (err: any) {
            console.error(`\n   ❌ Error: ${err.message}`);
            totalErrors++;
        }
    }

    // ── Summary ─────────────────────────────────────────────────────
    console.log(`\n════════════════════════════════════════`);
    console.log(`📊 Migration Summary`);
    console.log(`   Total documents: ${totalDocs}`);
    console.log(`   Errors/skipped:  ${totalErrors}`);
    console.log(`════════════════════════════════════════`);

    // ── Verify counts ───────────────────────────────────────────────
    if (!DRY_RUN) {
        console.log("\n🔍 Verifying document counts...");
        for (const containerName of containerNames) {
            const targetName = COLLECTION_MAP[containerName] || containerName;
            try {
                const container = cosmosDb.container(containerName);
                const { resources: countResult } = await container.items
                    .query({ query: "SELECT VALUE COUNT(1) FROM c" })
                    .fetchAll();
                const cosmosCount = countResult[0] || 0;

                const collection = db.collection(targetName);
                const mongoCount = await collection.countDocuments();

                const match = cosmosCount === mongoCount ? "✅" : "⚠️";
                console.log(`   ${match} ${containerName}: Cosmos=${cosmosCount}, MongoDB=${mongoCount}`);
            } catch {
                console.log(`   ⚠️ Could not verify ${containerName}`);
            }
        }
    }

    await mongo.close();
    console.log("\n🎉 Migration complete!");
}

// ── Document transformation ─────────────────────────────────────────────

function transformDocument(doc: Record<string, any>): Record<string, any> {
    let transformed = { ...doc };

    // Keep Cosmos `id` as `id` instead of mapping to _id.
    // MongoDB driver will assign a unique ObjectId `_id` to each document automatically.
    // This allows duplicates on `id` if they have different partition keys.

    // Remove Cosmos-specific metadata
    delete transformed._rid;
    delete transformed._self;
    delete transformed._etag;
    delete transformed._attachments;
    delete transformed._ts;

    // Cast date fields to native MongoDB Date objects
    for (const field of DATE_FIELDS) {
        if (transformed[field]) {
            if (typeof transformed[field] === "string") {
                const d = new Date(transformed[field]);
                if (!isNaN(d.getTime())) transformed[field] = d;
            } else if (typeof transformed[field] === "number") {
                const num = transformed[field];
                const ms = num < 10000000000 ? num * 1000 : num;
                const d = new Date(ms);
                if (!isNaN(d.getTime())) transformed[field] = d;
            }
        }
    }

    // Apply brand rewrites (from --rewrite CLI args)
    if (BRAND_REWRITES.length > 0) {
        transformed = deepRewriteBrands(transformed);
    }

    // Rewrite Azure Blob URLs → S3 URLs
    if (URL_REWRITE_ENABLED) {
        transformed = deepRewriteUrls(transformed);
    }

    return transformed;
}

// ── Brand rewriting ─────────────────────────────────────────────────────

function rewriteBrands(value: string): string {
    for (const { from, to } of BRAND_REWRITES) {
        // Use global replace for each rewrite pair
        value = value.split(from).join(to);
    }
    return value;
}

function deepRewriteBrands(obj: any): any {
    if (typeof obj === "string") return rewriteBrands(obj);
    if (Array.isArray(obj)) return obj.map(deepRewriteBrands);
    if (obj instanceof Date) return obj;
    if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = deepRewriteBrands(val);
        }
        return result;
    }
    return obj;
}

// ── Azure URL → S3 URL rewriting ────────────────────────────────────────

function rewriteAzureUrl(value: string): string {
    // Match Azure Blob URLs and strip the container prefix
    const blobPattern = new RegExp(
        `https?://${AZURE_BLOB_HOST.replace(/\./g, "\\.")}(/[^"'\\s]*)`,
        "gi"
    );
    value = value.replace(blobPattern, (_match, fullPath) => {
        const segs = fullPath.split("/").filter(Boolean);
        return `${S3_ENDPOINT}/${S3_BUCKET}/${segs.slice(1).join("/")}`;
    });

    // Also catch ANY Azure Front Door URL (*.azurefd.net)
    const afdPattern = /https?:\/\/[^"'\s]*\.azurefd\.net(\/[^"'\s]*)/gi;
    value = value.replace(afdPattern, (_match, fullPath) => {
        const segs = fullPath.split("/").filter(Boolean);
        return `${S3_ENDPOINT}/${S3_BUCKET}/${segs.slice(1).join("/")}`;
    });

    return value;
}

function deepRewriteUrls(obj: any): any {
    if (typeof obj === "string") return rewriteAzureUrl(obj);
    if (Array.isArray(obj)) return obj.map(deepRewriteUrls);
    if (obj instanceof Date) return obj;
    if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = deepRewriteUrls(val);
        }
        return result;
    }
    return obj;
}

// ── Entry point ─────────────────────────────────────────────────────────

main().catch((err) => {
    console.error("💥 Migration failed:", err);
    process.exit(1);
});
