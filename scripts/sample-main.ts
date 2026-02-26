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

    console.log("\n--- Sample of 10 documents from 'main' collection ---");
    const docs = await collection.find({}).limit(10).toArray();
    for (const doc of docs) {
        console.log(`ID: ${doc.id || doc._id}`);
        // Print all keys to get an idea of document type
        console.log(`Keys: ${Object.keys(doc).join(", ")}`);
    }

    await client.close();
}

main().catch(console.error);
