
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function debugShopStatus() {
    try {
        const container = await getContainer();
        console.log("Debugging Shop Status...");

        // 1. Check by Wallet 0x7fbb... (Old)
        console.log("--- Checking Old Wallet: 0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76 ---");
        const { resources: oldWalletShops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76'`)
            .fetchAll();
        console.log(`Found ${oldWalletShops.length} shops for old wallet.`);
        oldWalletShops.forEach(s => console.log(`Slug: ${s.slug}, Phone: ${s.phone}, ID: ${s.id}`));

        // 2. Check by Wallet 0x79c... (New)
        console.log("--- Checking New Wallet: 0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a ---");
        const { resources: newWalletShops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a'`)
            .fetchAll();
        console.log(`Found ${newWalletShops.length} shops for new wallet.`);
        newWalletShops.forEach(s => console.log(`Slug: ${s.slug}, Phone: ${s.phone}, ID: ${s.id}`));

        // 3. Check by Slug 'jbxoinpay'
        console.log("--- Checking Slug: jbxoinpay ---");
        const { resources: slugShops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.slug = 'jbxoinpay'`)
            .fetchAll();
        console.log(`Found ${slugShops.length} shops for slug 'jbxoinpay'.`);
        slugShops.forEach(s => console.log(`Wallet: ${s.wallet}, Phone: ${s.phone}, ID: ${s.id}`));

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

debugShopStatus();
