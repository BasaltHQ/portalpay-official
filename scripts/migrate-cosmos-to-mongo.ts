/**
 * Data migration script: Azure Cosmos DB → MongoDB
 *
 * This script:
 * 1. Connects to Cosmos DB (SQL API) and reads all containers via memory-safe batches
 * 2. Exports every document
 * 3. Rewrites "portalpay" → "basaltsurge" in IDs, partition keys, and data fields
 * 4. Casts string/epoch dates to native MongoDB Date objects
 * 5. Imports into MongoDB with proper _id mapping and background indexing
 *
 * Usage:
 * npx ts-node scripts/migrate-cosmos-to-mongo.ts
 *
 * Required env vars:
 * COSMOS_CONNECTION_STRING  — Source Cosmos DB connection string
 * MONGODB_CONNECTION_STRING — Target MongoDB connection string (mongodb+srv://...)
 * DB_NAME                   — Target database name (default: "basaltsurge")
 */

import { CosmosClient } from "@azure/cosmos";
import { MongoClient, Document } from "mongodb";

// ── Configuration ───────────────────────────────────────────────────────

const COSMOS_CONN = process.env.COSMOS_CONNECTION_STRING || "";
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING || "";
const TARGET_DB = process.env.DB_NAME || "basaltsurge";

// Containers to migrate (add more as needed)
const CONTAINERS = [
    process.env.COSMOS_PAYPORTAL_CONTAINER_ID || process.env.COSMOS_CONTAINER_ID || "payportal_events",
    "support_tickets",
    process.env.COSMOS_TOUCHPOINT_CONTAINER_ID || "touchpoint_devices",
    "app_installs",
];

// Target collection name mapping (rename during migration)
const COLLECTION_MAP: Record<string, string> = {
    payportal_events: "basaltsurge_events",
    // Keep other container names as-is unless you want to rename them
};

// Fields to rewrite "portalpay" → "basaltsurge"
const REWRITE_FIELDS = ["id", "wallet", "brandKey", "iss", "type"];

// Fields that MUST be cast from Cosmos Strings/Numbers to MongoDB Date objects
const DATE_FIELDS = ["createdAt", "updatedAt", "timestamp", "deletedAt", "resolvedAt"];

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

    console.log("🔗 Connecting to MongoDB...");
    const mongo = new MongoClient(MONGO_URI);
    await mongo.connect();
    const db = mongo.db(TARGET_DB);

    let totalDocs = 0;
    let totalErrors = 0;

    for (const containerName of CONTAINERS) {
        const targetName = COLLECTION_MAP[containerName] || containerName;
        console.log(`\n📦 Migrating container: ${containerName} → ${targetName}`);

        try {
            const cosmosDb = cosmos.database(
                process.env.COSMOS_PAYPORTAL_DB_ID || process.env.COSMOS_DB_ID || "payportal"
            );
            const container = cosmosDb.container(containerName);
            const collection = db.collection(targetName);

            // Create indexes for common query patterns BEFORE we start inserting data
            await createIndexes(collection, targetName);

            // Use fetchNext() iterator to prevent Node.js Out-Of-Memory errors
            const queryIterator = container.items.query({ query: "SELECT * FROM c" });
            let containerDocCount = 0;

            while (queryIterator.hasMoreResults()) {
                const { resources: batch } = await queryIterator.fetchNext();

                if (!batch || batch.length === 0) continue;

                // Transform documents in the current batch
                const transformed = batch.map((doc) => transformDocument(doc));

                try {
                    // Use ordered:false for best performance (continues on duplicate key errors)
                    const result = await collection.insertMany(transformed as any[], { ordered: false });
                    containerDocCount += result.insertedCount;
                    totalDocs += result.insertedCount;
                    process.stdout.write(`   Inserted ${containerDocCount} documents so far...\r`);
                } catch (err: any) {
                    // Handle duplicate key errors gracefully (in case of re-runs)
                    if (err.code === 11000) {
                        const inserted = err.result?.insertedCount || 0;
                        containerDocCount += inserted;
                        totalDocs += inserted;
                        totalErrors += transformed.length - inserted;
                        console.warn(`\n   ⚠️ ${transformed.length - inserted} duplicates skipped in batch`);
                    } else {
                        throw err;
                    }
                }
            }

            console.log(`\n   ✅ Done: ${containerDocCount} documents processed for ${containerName}`);
        } catch (err: any) {
            console.error(`\n   ❌ Error migrating ${containerName}: ${err.message}`);
            totalErrors++;
        }
    }

    console.log(`\n════════════════════════════════════════`);
    console.log(`📊 Migration Summary`);
    console.log(`   Total documents migrated: ${totalDocs}`);
    console.log(`   Errors/skipped: ${totalErrors}`);
    console.log(`════════════════════════════════════════\n`);

    // Verify counts
    console.log("🔍 Verifying document counts...");
    for (const containerName of CONTAINERS) {
        const targetName = COLLECTION_MAP[containerName] || containerName;
        try {
            const cosmosDb = cosmos.database(
                process.env.COSMOS_PAYPORTAL_DB_ID || process.env.COSMOS_DB_ID || "payportal"
            );
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

    await mongo.close();
    console.log("\n🎉 Migration complete!");
}

// ── Document transformation ─────────────────────────────────────────────

function transformDocument(doc: Record<string, any>): Document {
    const transformed = { ...doc };

    // Map Cosmos `id` to MongoDB `_id`
    transformed._id = transformed.id;
    delete transformed.id;

    // Remove Cosmos-specific metadata fields
    delete transformed._rid;
    delete transformed._self;
    delete transformed._etag;
    delete transformed._attachments;
    delete transformed._ts;

    // Parse string/epoch dates into native MongoDB Date objects
    for (const field of DATE_FIELDS) {
        if (transformed[field]) {
            if (typeof transformed[field] === "string") {
                const parsedDate = new Date(transformed[field]);
                if (!isNaN(parsedDate.getTime())) {
                    transformed[field] = parsedDate;
                }
            } else if (typeof transformed[field] === "number") {
                // If it's a UNIX epoch timestamp. 
                // Cosmos typically uses seconds for _ts, but JS Date needs milliseconds.
                const num = transformed[field];
                const ms = num < 10000000000 ? num * 1000 : num; // Quick heuristic: if it's too small for ms, treat as seconds
                const parsedDate = new Date(ms);
                if (!isNaN(parsedDate.getTime())) {
                    transformed[field] = parsedDate;
                }
            }
        }
    }

    // Rewrite "portalpay" in key fields
    for (const field of REWRITE_FIELDS) {
        if (field === "id") {
            // Already mapped to _id
            if (typeof transformed._id === "string") {
                transformed._id = rewritePortalPay(transformed._id);
            }
        } else if (typeof transformed[field] === "string") {
            transformed[field] = rewritePortalPay(transformed[field]);
        }
    }

    // Deep scan for nested "portalpay" references in common nested objects
    if (transformed.config && typeof transformed.config === "object") {
        transformed.config = deepRewritePortalPay(transformed.config);
    }
    if (transformed.split && typeof transformed.split === "object") {
        transformed.split = deepRewritePortalPay(transformed.split);
    }

    return transformed;
}

/**
 * Rewrite "portalpay" to "basaltsurge" in a string, preserving casing patterns.
 */
function rewritePortalPay(value: string): string {
    return value
        .replace(/portalpay/g, "basaltsurge")
        .replace(/PortalPay/g, "BasaltSurge")
        .replace(/PORTALPAY/g, "BASALTSURGE")
        .replace(/payportal/g, "basaltsurge")
        .replace(/PayPortal/g, "BasaltSurge")
        .replace(/PAYPORTAL/g, "BASALTSURGE");
}

/**
 * Deep-rewrite "portalpay" in all string values of an object.
 */
function deepRewritePortalPay(obj: any): any {
    if (typeof obj === "string") return rewritePortalPay(obj);
    if (Array.isArray(obj)) return obj.map(deepRewritePortalPay);
    if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = deepRewritePortalPay(val);
        }
        return result;
    }
    return obj;
}

// ── Index creation ──────────────────────────────────────────────────────

async function createIndexes(collection: any, collectionName: string) {
    console.log(`   📇 Verifying/Creating indexes for ${collectionName}...`);

    // Common indexes across all collections
    const commonIndexes = [
        { key: { type: 1 }, name: "idx_type" },
        { key: { wallet: 1 }, name: "idx_wallet" },
        { key: { type: 1, wallet: 1 }, name: "idx_type_wallet" },
        { key: { createdAt: -1 }, name: "idx_createdAt" },
        { key: { brandKey: 1 }, name: "idx_brandKey" },
    ];

    // Collection-specific indexes
    const specificIndexes: Record<string, any[]> = {
        basaltsurge_events: [
            { key: { type: 1, wallet: 1, createdAt: -1 }, name: "idx_type_wallet_created" },
            { key: { slug: 1 }, name: "idx_slug" },
            { key: { customDomain: 1 }, name: "idx_customDomain" },
            { key: { type: 1, slug: 1 }, name: "idx_type_slug" },
            { key: { staffId: 1 }, name: "idx_staffId" },
            { key: { sessionId: 1 }, name: "idx_sessionId" },
            { key: { jiraIssueKey: 1 }, name: "idx_jiraIssueKey", sparse: true },
        ],
        touchpoint_devices: [
            { key: { deviceId: 1 }, name: "idx_deviceId" },
            { key: { brandKey: 1, deviceId: 1 }, name: "idx_brand_device" },
        ],
    };

    const indexes = [...commonIndexes, ...(specificIndexes[collectionName] || [])];

    for (const idx of indexes) {
        try {
            await collection.createIndex(idx.key, { name: idx.name, sparse: idx.sparse, background: true });
        } catch {
            // Index may already exist or there's a conflict, fail silently to continue execution
        }
    }
}

// ── Entry point ─────────────────────────────────────────────────────────

main().catch((err) => {
    console.error("💥 Migration failed:", err);
    process.exit(1);
});
