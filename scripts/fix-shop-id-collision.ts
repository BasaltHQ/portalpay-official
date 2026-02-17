
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function fixShopIdCollision() {
    try {
        const container = await getContainer();
        console.log("Fixing Shop ID Collision...");

        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        const collidingId = "shop:config:xoinpay";
        const newUniqueId = "shop:config:jbxoinpay-mobile";

        // 1. Fetch current New Shop config
        console.log(`Fetching New Shop config for ${newWallet}...`);
        const { resources: shops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (shops.length === 0) {
            console.error("New shop config not found.");
            return;
        }

        const shop = shops[0];
        console.log(`Found config with ID: ${shop.id} (Slug: ${shop.slug})`);

        // 2. Create COPY with NEW UNIQUE ID
        const newShop = { ...shop, id: newUniqueId };
        console.log(`Creating copy with New ID: ${newUniqueId}`);
        await container.items.create(newShop);

        // 3. Delete OLD colliding config
        console.log(`Deleting old colliding config: ${shop.id}`);
        await container.item(shop.id, newWallet).delete();

        console.log("Collision fixed. New shop now has unique ID.");

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

fixShopIdCollision();
