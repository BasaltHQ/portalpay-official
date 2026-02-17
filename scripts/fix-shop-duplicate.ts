
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function fixShopDuplicate() {
    try {
        const container = await getContainer();
        console.log("Fixing Shop Duplicate for jbxoinpay...");

        // 1. Delete Old Config
        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const oldId = "shop:config:xoinpay";

        try {
            console.log(`Deleting old config: ${oldId} in partition ${oldWallet}`);
            await container.item(oldId, oldWallet).delete();
            console.log("Deleted old config successfully.");
        } catch (e) {
            console.error("Failed to delete old config (might be already gone):", e.message);
        }

        // 2. Update New Config
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        // We know from debug script that a doc exists here with slug 'deletemeafter'
        // We need to fetch it first to get its ID (it seemed to be same ID 'shop:config:xoinpay')

        const { resources: items } = await container.items
            .query(`SELECT * FROM c WHERE c.wallet = '${newWallet}' AND c.type = 'shop_config'`)
            .fetchAll();

        if (items.length > 0) {
            const doc = items[0];
            console.log(`Found new wallet doc: ${doc.id} (slug: ${doc.slug})`);

            doc.slug = "jbxoinpay";
            doc.phone = "8187992169";
            doc.contact = {
                ...(doc.contact || {}),
                phone: "8187992169",
                showPhone: true
            };
            // Ensure name is correct if needed? User saw 'XoinPay' which is good.

            const { resource: updated } = await container.item(doc.id, newWallet).replace(doc);
            console.log(`Updated new config to slug: ${updated.slug}`);
        } else {
            console.error("CRITICAL: New wallet config not found! Creating from scratch...");
            // Fallback: Create from scratch if missing
            const newDoc = {
                id: "shop:config:xoinpay",
                type: "shop_config",
                wallet: newWallet,
                slug: "jbxoinpay",
                phone: "8187992169",
                contact: { phone: "8187992169", showPhone: true },
                legalName: "XoinPay", // default
                dbaName: "SW", // default
                // Add other fields if necessary
            };
            await container.items.create(newDoc);
            console.log("Created new config from scratch.");
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

fixShopDuplicate();
