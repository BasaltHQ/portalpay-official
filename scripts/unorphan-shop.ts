
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

async function unorphanShop() {
    try {
        const container = await getContainer();
        console.log("Unorphaning shop for 0x7fbb...");

        const wallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";

        // 1. Get existing Shop Config
        const { resources: shops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${wallet}'`)
            .fetchAll();

        if (shops.length === 0) {
            console.error("No shop config found for this wallet! Cannot unorphan.");
            return;
        }
        const shop = shops[0];
        console.log(`Found shop: ${shop.slug} (${shop.name})`);

        // 2. Check if request already exists (maybe deprecated?)
        const { resources: reqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${wallet}'`)
            .fetchAll();

        if (reqs.length > 0) {
            // If one exists but maybe status is wrong?
            console.log("Found existing request(s):", reqs.map(r => `${r.id}: ${r.status}`));
            // If we find one, we should reactivate it instead of creating duplicate.
            const req = reqs[0];
            req.status = "approved"; // Restore to approved
            req.shopName = shop.name || req.shopName; // Sync name
            req.slug = shop.slug;

            await container.item(req.id, wallet).replace(req);
            console.log("Restored existing request to Approved.");
            return;
        }

        // 3. Create NEW Request if none exists
        const newReq = {
            id: crypto.randomUUID(),
            wallet: wallet,
            type: "client_request",
            brandKey: shop.brandKey || "portalpay", // default or from shop
            status: "approved",
            shopName: shop.name || "XoinPay",
            slug: shop.slug,
            phone: shop.phone || "8187992169",
            createdAt: Date.now(),
            reviewedAt: Date.now(),
            reviewedBy: "admin-script",
            // Add other fields if useful
            legalBusinessName: shop.legalName || "XoinPay",
            businessType: "llc"
        };

        await container.items.create(newReq);
        console.log("Created NEW Approved Request to unorphan shop.");

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

unorphanShop();
