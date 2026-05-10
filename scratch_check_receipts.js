require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('portalpay');
    
    // Check receipts for tipAmount > 0
    const receipts = await db.collection('c').find({ 
        type: 'receipt', 
        tipAmount: { $gt: 0 },
        // filter to test member
        // employeeId: '0x2da9327a02a187fef7c4a0a5b9402499fc80bb01'
    }).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log("Found receipts:", receipts.length);
    for (const r of receipts) {
        console.log(`ID: ${r.id}, SessionID: ${r.sessionId}, StaffID: ${r.staffId || r.employeeId}, Tip: ${r.tipAmount}`);
    }
    process.exit(0);
}
run().catch(console.error);
