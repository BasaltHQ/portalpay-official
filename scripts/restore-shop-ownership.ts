
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function restoreShopOwnership() {
    try {
        const container = await getContainer();
        console.log("Restoring jbxoinpay ownership to 0x7fbb...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76"; // The one to restore
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a"; // The current owner

        // 1. Find Current Shop (owned by newWallet)
        const { resources: items } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.slug = 'jbxoinpay'`)
            .fetchAll();

        if (items.length === 0) {
            console.error("CRITICAL: jbxoinpay shop config not found! Checking by new wallet...");
            // Fallback check
            const { resources: items2 } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${newWallet}'`)
                .fetchAll();
            if (items2.length === 0) {
                console.error("CRITICAL: Shop config completely missing. Recreating from scratch for old wallet.");
                const newDoc = {
                    id: "shop:config:xoinpay",
                    type: "shop_config",
                    wallet: oldWallet,
                    slug: "jbxoinpay",
                    phone: "8187992169",
                    contact: { phone: "8187992169", showPhone: true },
                    legalName: "XoinPay",
                    dbaName: "SW",
                };
                await container.items.create(newDoc);
                console.log("Recreated shop config for 0x7fbb.");
                return;
            }
            items.push(items2[0]);
        }

        const shop = items[0];
        const currentOwner = shop.wallet;

        if (currentOwner.toLowerCase() === oldWallet.toLowerCase()) {
            console.log("Shop is already owned by 0x7fbb. Nothing to do.");
            return;
        }

        console.log(`Current Owner: ${currentOwner}`);
        console.log(`Restoring to: ${oldWallet}`);

        // 2. Clone and Update
        const checkOld = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${oldWallet}'`)
            .fetchAll();

        // If an old doc somehow exists (maybe I failed to delete it perfectly?), delete it first to avoid conflict?
        // But logic says I deleted it.
        if (checkOld.resources.length > 0) {
            console.log("Found existing doc in old wallet partition. Updating it directly.");
            const oldDoc = checkOld.resources[0];
            oldDoc.slug = "jbxoinpay"; // Ensure it claims the slug
            oldDoc.phone = "8187992169";
            await container.item(oldDoc.id, oldWallet).replace(oldDoc);

            // And delete the new one since it's now duplicate
            await container.item(shop.id, currentOwner).delete();
            console.log("Updated existing old doc and deleted new doc.");
        } else {
            // Move from Current -> Old
            const newDoc = { ...shop, wallet: oldWallet };

            await container.items.create(newDoc);
            console.log(`Created shop config for ${oldWallet}`);

            await container.item(shop.id, currentOwner).delete();
            console.log(`Deleted shop config for ${currentOwner}`);
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

restoreShopOwnership();
