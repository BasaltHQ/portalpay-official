import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });
import { MongoClient } from 'mongodb';

async function run() {
    const uri = process.env.DB_CONNECTION_STRING || process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI;
    if (!uri) throw new Error("No Mongo URI");
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const adminDb = client.db('admin');
        const { databases } = await adminDb.admin().listDatabases();
        for (const dbInfo of databases) {
            if (dbInfo.name === 'admin' || dbInfo.name === 'local') continue;
            console.log(`Checking DB: ${dbInfo.name}`);
            const db = client.db(dbInfo.name);
            const cols = await db.listCollections().toArray();
            for (const colInfo of cols) {
                // console.log(`  Checking collection: ${colInfo.name}`);
                const col = db.collection(colInfo.name);
                try {
                    const docs = await col.find({ wallet: '0x6c28067a2d4f10013fbbb8534acd76ab43a4ff9f', type: 'site_config' }).sort({ updatedAt: -1 }).toArray();
                    if (docs.length > 0) {
                        console.log(`\n★★★ FOUND ${docs.length} RELEVANT DOCUMENTS IN ${dbInfo.name}.${colInfo.name} ★★★`);
                        for (const d of docs) {
                            const isDateObj = d.updatedAt instanceof Date;
                            const tType = typeof d.updatedAt;
                            console.log(JSON.stringify({ _id: d._id, id: d.id, updatedAt: d.updatedAt, type: tType, isDate: isDateObj, defaultPaymentToken: d.defaultPaymentToken }));
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }
    } finally {
        await client.close();
    }
}
run();
