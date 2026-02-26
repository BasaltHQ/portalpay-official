import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING;
const DB_NAME = "surge";

function fixUrls(obj: any): any {
    if (typeof obj === "string") {
        if (obj.includes(".azurefd.net/") || obj.includes(".blob.core.windows.net/")) {
            return obj.replace(/https:\/\/[^/]+\.azurefd\.net\/portalpay\//g, "https://basaltsurge.s3.us-west-or.io.cloud.ovh.us/")
                .replace(/https:\/\/[^/]+\.blob\.core\.windows\.net\/portalpay\//g, "https://basaltsurge.s3.us-west-or.io.cloud.ovh.us/");
        }
        return obj;
    }
    if (Array.isArray(obj)) return obj.map(fixUrls);
    if (obj instanceof Date) return obj;

    if (obj && typeof obj === "object" && obj.constructor.name === "Object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = fixUrls(val);
        }
        return result;
    }
    return obj;
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
        if (collName.startsWith("system.")) continue;

        console.log(`Scanning collection: ${collName}`);
        const collection = db.collection(collName);
        const cursor = collection.find({});
        let collUpdated = 0;

        for await (const doc of cursor) {
            const docId = doc._id;
            const docStr = JSON.stringify(doc);

            const needsUpdate = /azurefd\.net|blob\.core\.windows\.net/.test(docStr);

            if (needsUpdate) {
                const newDocInfo = fixUrls(doc);
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
