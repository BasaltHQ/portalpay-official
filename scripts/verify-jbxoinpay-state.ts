
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function verifyState() {
    try {
        const container = await getContainer();
        console.log("Verifying jbxoinpay state...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        // 1. Check Shop Configs
        console.log("\n--- Shop Configs ---");
        const { resources: shops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND (c.wallet = '${oldWallet}' OR c.wallet = '${newWallet}' OR c.slug = 'jbxoinpay')`)
            .fetchAll();

        if (shops.length === 0) console.log("No shop configs found.");
        shops.forEach(s => {
            console.log(`ID: ${s.id} | Wallet: ${s.wallet} | Slug: ${s.slug} | Phone: ${s.phone}`);
        });

        // 2. Check Client Requests (Pending applications)
        console.log("\n--- Client Requests ---");
        const { resources: requests } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND (c.wallet = '${oldWallet}' OR c.wallet = '${newWallet}' OR CONTAINS(c.phone, '818799'))`)
            .fetchAll();

        if (requests.length === 0) console.log("No client requests found.");
        requests.forEach(r => {
            console.log(`ID: ${r.id} | Wallet: ${r.wallet} | Phone: ${r.phone} | Status: ${r.status || 'N/A'}`);
        });

        // 3. User records
        console.log("\n--- Users ---");
        const { resources: users } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'user' AND (c.wallet = '${oldWallet}' OR c.wallet = '${newWallet}')`)
            .fetchAll();
        users.forEach(u => {
            console.log(`ID: ${u.id} | Wallet: ${u.wallet} | Phone: ${u.phone}`);
        });

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

verifyState();
