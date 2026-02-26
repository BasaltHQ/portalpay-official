import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING;
const DB_NAME = "surge";

async function main() {
    if (!MONGO_URI) throw new Error("Missing MONGODB_CONNECTION_STRING");

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    console.log(`Connected to MongoDB: ${DB_NAME}`);

    const collections = await db.listCollections().toArray();
    let foundCount = 0;

    for (const collInfo of collections) {
        const collName = collInfo.name;
        if (collName.startsWith("system.")) continue;

        const collection = db.collection(collName);

        // Find docs where id property starts with "site:config"
        const docs = await collection.find({ id: { $regex: "^site:config" } }).toArray();
        if (docs.length > 0) {
            foundCount += docs.length;
            console.log(`\n✅ Found ${docs.length} site configs in collection: '${collName}'`);
            for (const doc of docs) {
                console.log(`  --> ID: ${doc.id}`);
                console.log(`      Wallet: ${doc.wallet}`);
                console.log(`      Brand Key: ${doc.brandKey}`);
                console.log(`      Brand Name: ${doc.brand?.name}`);
                console.log(`      App Name: ${doc.brand?.appName}`);
            }
        }
    }

    if (foundCount === 0) {
        console.log(`\n❌ Could not find ANY documents with id starting with "site:config" in ANY collection.`);
    }

    await client.close();
}

main().catch(console.error);
