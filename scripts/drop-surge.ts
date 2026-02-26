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
    for (const c of collections) {
        if (!c.name.startsWith('system.')) {
            await db.collection(c.name).drop();
            console.log('Dropped ' + c.name);
        }
    }

    await client.close();
    console.log("Finished dropping collections.");
}

main().catch(console.error);
