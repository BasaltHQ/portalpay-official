import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

async function main() {
    const conn = process.env.MONGODB_CONNECTION_STRING;
    if (!conn) throw new Error("Missing MONGODB_CONNECTION_STRING");

    const client = new MongoClient(conn);
    await client.connect();

    const admin = client.db("admin").admin();
    const dbs = await admin.listDatabases();

    console.log("Databases found:", dbs.databases.map(d => d.name));

    for (const dbInfo of dbs.databases) {
        const dbName = dbInfo.name;
        if (["admin", "local", "config"].includes(dbName)) continue;

        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();

        for (const collInfo of collections) {
            const collName = collInfo.name;
            const collection = db.collection(collName);

            // Search for anything AFD-like or apk_version docs
            const docs = await collection.find({
                $or: [
                    { type: "apk_version" },
                    { downloadUrl: /azurefd/ },
                    { downloadUrl: /blob\.core\.windows\.net/ }
                ]
            }).toArray();

            if (docs.length > 0) {
                console.log(`\nFound ${docs.length} relevant docs in ${dbName}.${collName}`);
                docs.forEach(d => {
                    console.log(`  - ID: ${d.id || d._id}, Type: ${d.type}, Brand: ${d.brandKey}, URL: ${d.downloadUrl}`);
                });
            }
        }
    }

    await client.close();
}

main().catch(console.error);
