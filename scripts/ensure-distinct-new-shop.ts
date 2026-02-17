
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function ensureDistinctNewShop() {
    try {
        const container = await getContainer();
        console.log("Ensuring Distinct New Shop for 0x79c...");

        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        const distinctSlug = "jbxoinpay-mobile";
        const distinctName = "XoinPay (Mobile)";

        // 1. Get New Shop Config
        const { resources: shops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (shops.length > 0) {
            const shop = shops[0];
            console.log(`Updating New Shop ${shop.slug} -> ${distinctSlug}`);

            shop.slug = distinctSlug;
            shop.name = distinctName;
            shop.phone = "8187992169";

            // Ensure split is still there
            if (!shop.splitAddress) shop.splitAddress = "0x6ab6f89a0d8f19851b7d446af73ea34720ec39b2";

            await container.item(shop.id, newWallet).replace(shop);
            console.log("Updated New Shop Config.");
        } else {
            console.error("New Shop Config Not Found!");
        }

        // 2. Update Client Request to match
        const { resources: reqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (reqs.length > 0) {
            const req = reqs[0];
            req.slug = distinctSlug;
            req.shopName = distinctName;
            req.status = "approved";

            await container.item(req.id, newWallet).replace(req);
            console.log("Updated New Client Request.");
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

ensureDistinctNewShop();
