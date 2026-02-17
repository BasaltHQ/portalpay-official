
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function verifyDualState() {
    try {
        const container = await getContainer();
        console.log("Verifying Dual State...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        console.log("\n--- Old Wallet (0x7fbb...) ---");
        const { resources: oldShops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${oldWallet}'`)
            .fetchAll();
        oldShops.forEach(s => console.log(`[Shop] Slug: ${s.slug}, Name: ${s.name}, Split: ${s.splitAddress || s.split?.address}`));

        const { resources: oldReqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${oldWallet}'`)
            .fetchAll();
        oldReqs.forEach(r => console.log(`[Request] Status: ${r.status}, ShopName: ${r.shopName}`));

        console.log("\n--- New Wallet (0x79c...) ---");
        const { resources: newShops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${newWallet}'`)
            .fetchAll();
        newShops.forEach(s => console.log(`[Shop] Slug: ${s.slug}, Name: ${s.name}, Split: ${s.splitAddress || s.split?.address}`));

        const { resources: newReqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${newWallet}'`)
            .fetchAll();
        newReqs.forEach(r => console.log(`[Request] Status: ${r.status}, ShopName: ${r.shopName}`));

        // Check User visibility
        const { resources: u } = await container.items.query(`SELECT c.id, c.roles FROM c WHERE c.type='user' AND (c.wallet='${oldWallet}' OR c.wallet='${newWallet}')`).fetchAll();
        console.log("\n--- Users ---");
        console.log(JSON.stringify(u, null, 2));

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

verifyDualState();
