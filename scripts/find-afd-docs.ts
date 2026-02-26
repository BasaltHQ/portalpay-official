import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

async function main() {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING as string);
    await client.connect();
    const db = client.db('surge');

    // Manual regex search across the whole collection to find documents that we missed
    const cursor = db.collection('surge_events').find({});
    let count = 0;
    for await (const doc of cursor) {
        const json = JSON.stringify(doc);
        if (json.includes("azurefd.net") || json.includes("blob.core.windows.net")) {
            console.log("============= FOUND ==============");
            console.log("ID:", doc._id);
            console.log("Type:", doc.type);
            console.log(JSON.stringify(doc, null, 2));
            count++;
        }
    }

    console.log(`Found ${count} documents with AFD or blob domains.`);
    await client.close();
}

main().catch(console.error);
