/**
 * One-time migration: Convert all number-type `createdAt` fields to Date objects
 * in MongoDB so sorting is consistent with Cosmos-migrated data.
 *
 * MongoDB's BSON type ordering puts Date objects above numbers in descending sort.
 * After the Cosmos→MongoDB migration, old docs have Date-type createdAt but new
 * docs created by the app have number-type (epoch ms). This script normalises them all.
 *
 * Also handles lastUpdatedAt and ts fields.
 *
 * Usage: node scripts/migrate-timestamps.js
 */
const { MongoClient } = require("mongodb");

const uri =
    process.env.DB_CONNECTION_STRING ||
    process.env.MONGODB_CONNECTION_STRING ||
    process.env.COSMOS_CONNECTION_STRING ||
    "";

if (!uri) {
    console.error("No connection string. Set DB_CONNECTION_STRING.");
    process.exit(1);
}

const dbName = process.env.DB_NAME || "payportal";
const collectionName = process.env.DB_COLLECTION || "payportal_events";

const TIMESTAMP_FIELDS = ["createdAt", "lastUpdatedAt", "ts"];

(async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection(collectionName);

        for (const field of TIMESTAMP_FIELDS) {
            // Find docs where the field is a number (int, long, or double in BSON)
            const filter = { [field]: { $type: ["int", "long", "double"] } };
            const count = await col.countDocuments(filter);
            console.log(`[${field}] Found ${count} documents with number-type values`);

            if (count > 0) {
                // Use aggregation-style update to convert in-place
                const result = await col.updateMany(
                    filter,
                    [{ $set: { [field]: { $toDate: `$${field}` } } }]
                );
                console.log(`[${field}] Updated ${result.modifiedCount} documents`);
            }
        }

        console.log("\nDone! All timestamp fields normalised to Date objects.");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
})();
