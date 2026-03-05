/**
 * Quick diagnostic: look up a receipt by receiptId in MongoDB
 * and print its wallet, type, status fields so we can compare
 * with what the admin panel queries.
 *
 * Usage: node scripts/debug-receipt.js R-210474
 */
const { MongoClient } = require("mongodb");

const RECEIPT_ID = process.argv[2] || "R-210474";

const uri =
    process.env.MONGODB_CONNECTION_STRING ||
    process.env.COSMOS_CONNECTION_STRING ||
    process.env.DB_CONNECTION_STRING ||
    "";

if (!uri) {
    console.error("No connection string found. Set MONGODB_CONNECTION_STRING or COSMOS_CONNECTION_STRING.");
    process.exit(1);
}

const dbName = process.env.DB_NAME || "payportal";
const collectionName = process.env.DB_COLLECTION || "payportal_events";

(async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection(collectionName);

        // Find all docs matching the receiptId
        const docs = await col.find({ receiptId: RECEIPT_ID }).toArray();
        console.log(`\nFound ${docs.length} document(s) with receiptId="${RECEIPT_ID}":\n`);

        for (const d of docs) {
            console.log({
                _id: d._id,
                id: d.id,
                receiptId: d.receiptId,
                type: d.type,
                wallet: d.wallet,
                status: d.status,
                createdAt: d.createdAt,
                brandName: d.brandName,
                hasShippingAddress: !!d.shippingAddress,
                lineItemCount: Array.isArray(d.lineItems) ? d.lineItems.length : 0,
            });
        }

        // Also check the latest 3 receipts by createdAt to see what's actually newest
        console.log("\n--- Latest 5 receipts (by createdAt DESC) ---\n");
        const latest = await col
            .find({ type: "receipt" })
            .sort({ createdAt: -1 })
            .limit(5)
            .project({ receiptId: 1, wallet: 1, status: 1, createdAt: 1, brandName: 1 })
            .toArray();
        for (const r of latest) {
            console.log(r);
        }
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
})();
