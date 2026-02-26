import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING;
const DB_NAME = "surge";

const BAD_PREFIX = "https://s3.us-west-or.io.cloud.ovh.us/basaltsurge/";
const GOOD_PREFIX = "https://basaltsurge.s3.us-west-or.io.cloud.ovh.us/";

function fixUrls(obj: any): any {
    if (typeof obj === "string") {
        if (obj.startsWith(BAD_PREFIX)) {
            return obj.replace(BAD_PREFIX, GOOD_PREFIX);
        }
        return obj;
    }
    if (Array.isArray(obj)) return obj.map(fixUrls);
    if (obj instanceof Date) return obj;
    // Don't modify ObjectId, etc. Wait, Mongo objects might be complex. Just handle basic ones.
    if (obj && typeof obj === "object" && obj.constructor.name === "Object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = fixUrls(val);
        }
        return result;
    }
    return obj; // Return unchanged (ObjectId, Date, etc.)
}

async function main() {
    if (!MONGO_URI) throw new Error("Missing MONGODB_CONNECTION_STRING");

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    console.log(`Connected to MongoDB: ${DB_NAME}`);

    const collections = await db.listCollections().toArray();
    let totalUpdated = 0;

    for (const collInfo of collections) {
        const collName = collInfo.name;
        // Skip system collections
        if (collName.startsWith("system.")) continue;

        console.log(`Scanning collection: ${collName}`);
        const collection = db.collection(collName);

        // Find documents that contain the bad prefix anywhere in their BSON
        // To be safe and quick, we just iterate all docs.
        const cursor = collection.find({});
        let collUpdated = 0;

        for await (const doc of cursor) {
            const docId = doc._id;
            let needsUpdate = false;

            // To see if it needs an update, we can just stringify and check
            const docStr = JSON.stringify(doc);
            if (docStr.includes(BAD_PREFIX)) {
                // It needs an update. We deep clone/fix.
                const newDocInfo = fixUrls(doc);
                // Ensure _id goes over as its actual type
                newDocInfo._id = docId;

                await collection.replaceOne({ _id: docId }, newDocInfo);
                collUpdated++;
                totalUpdated++;
            }
        }
        if (collUpdated > 0) {
            console.log(`  -> Updated ${collUpdated} documents in ${collName}`);
        }
    }

    console.log(`\n✅ Done! Updated a total of ${totalUpdated} documents across all collections.`);
    await client.close();
}

main().catch(console.error);
