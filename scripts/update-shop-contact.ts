
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function updateShopContact() {
    try {
        const container = await getContainer();
        console.log("Updating shop contact details...");

        const updates = [
            {
                slug: "jbxoinpay", // Wallet: 0x7fbb...
                phone: "8187992169"
            },
            {
                slug: "xoin104",  // Wallet: 0x594...
                phone: "6266587772"
            }
        ];

        for (const u of updates) {
            console.log(`Processing ${u.slug}...`);

            const { resources: items } = await container.items
                .query({
                    query: "SELECT * FROM c WHERE c.slug = @slug AND c.type = 'shop_config'",
                    parameters: [{ name: "@slug", value: u.slug }]
                })
                .fetchAll();

            if (items.length === 0) {
                console.log(`Config for ${u.slug} not found!`);
                continue;
            }

            const shop = items[0];

            // Update root phone (if it exists or is used)
            // And update nested contact object which is standard
            shop.phone = u.phone;
            shop.contact = {
                ...(shop.contact || {}),
                phone: u.phone,
                showPhone: true
            };

            // Also update 'users' array if it exists to reflect ownership? 
            // Usually shop_config doesn't store owner PII directly except in contact.

            const { resource: updated } = await container.item(shop.id, shop.wallet).replace(shop);
            console.log(`Updated ${u.slug}:`, {
                id: updated.id,
                phone: updated.phone,
                contact: updated.contact
            });
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

updateShopContact();
