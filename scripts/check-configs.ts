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

    const collection = db.collection("main");

    const docIds = [
        "site:config",
        "site:config:portalpay",
        "site:config:basaltsurge",
        "site:config:paynex"
    ];

    for (const id of docIds) {
        // Since wallet might be empty or specific, let's just search by id prefix
        const docs = await collection.find({ id: { $regex: `^${id}` } }).toArray();
        console.log(`\n--- Documents for ${id} (${docs.length} found) ---`);
        for (const doc of docs) {
            console.log(`ID: ${doc.id}`);
            console.log(`Wallet: ${doc.wallet}`);
            console.log(`Brand Key: ${doc.brandKey}`);
            console.log(`Brand Name: ${doc.brand?.name}`);
            console.log(`App Name: ${doc.brand?.appName}`);
        }
    }

    await client.close();
}

main().catch(console.error);
