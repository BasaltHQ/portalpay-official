import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

async function main() {
    const conn = process.env.MONGODB_CONNECTION_STRING;
    if (!conn) throw new Error("Missing MONGODB_CONNECTION_STRING");

    const client = new MongoClient(conn);
    await client.connect();

    const db = client.db('surge');
    const collection = db.collection('surge_events');

    // Identify garbage brands (usually from SQL injection attempts)
    const garbageBrands = ['and 1', '1', 'true', 'false'];

    for (const brand of garbageBrands) {
        const count = await collection.countDocuments({ brandKey: brand });
        if (count > 0) {
            console.log(`Found ${count} docs with garbage brandKey: '${brand}'`);
            const result = await collection.deleteMany({ brandKey: brand });
            console.log(`  Deleted ${result.deletedCount} docs.`);
        }
    }

    // Also search for site:config docs with garbage IDs if any
    const scripts = await collection.find({ id: /and 1/ }).toArray();
    if (scripts.length > 0) {
        console.log(`Found ${scripts.length} docs with 'and 1' in ID`);
        const result = await collection.deleteMany({ id: /and 1/ });
        console.log(`  Deleted ${result.deletedCount} docs.`);
    }

    await client.close();
}

main().catch(console.error);
