import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\Users\\meanp\\OneDrive\\Documents\\HTL Projects\\VS Code Projects\\portalpay-official\\.env" });

async function main() {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING as string);
    await client.connect();
    const db = client.db('surge');
    const docs = await db.collection('surge_events').find({ type: 'apk_version' }).toArray();
    console.log('Found ' + docs.length + ' apk_versions');
    docs.forEach(d => console.log(d.brandKey, d.downloadUrl));
    await client.close();
}
main().catch(console.error);
