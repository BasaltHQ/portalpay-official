
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function updateShopUsers() {
    try {
        const container = await getContainer();
        console.log("Updating shop users...");

        const updates = [
            {
                slug: "jbxoinpay",
                wallet: "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76",
                phone: "8187992169",
                email: "test@test.com" // Preserve existing
            },
            {
                slug: "xoin104",
                wallet: "0x594223be3e0df7b78265f5525f6c8427aea39c15",
                phone: "6266587772",
                email: "" // New record likely
            }
        ];

        for (const u of updates) {
            console.log(`Processing ${u.slug} (${u.wallet})...`);

            const id = `${u.wallet}:user`;
            let doc: any;
            try {
                const { resource } = await container.item(id, u.wallet).read();
                doc = resource;
            } catch (e) {
                console.log(`User doc not found for ${u.slug}, creating new.`);
                doc = {
                    id: id,
                    type: "user",
                    wallet: u.wallet,
                    firstSeen: Date.now()
                };
            }

            // Update fields
            doc.phone = u.phone;
            if (u.email && !doc.email) doc.email = u.email;

            // Ensure merchant role
            doc.roles = { ...doc.roles, merchant: true };
            doc.lastSeen = Date.now();

            // Ensure contact config allows phone
            doc.contact = {
                ...(doc.contact || {}),
                phone: u.phone,
                showPhone: true
            };

            const { resource: updated } = await container.items.upsert(doc);
            console.log(`Updated ${u.slug}:`, {
                id: updated.id,
                phone: updated.phone,
                roles: updated.roles
            });
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

updateShopUsers();
