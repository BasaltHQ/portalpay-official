
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function linkDomainToShop() {
    try {
        const container = await getContainer();
        const slug = "jbxoinpay";

        console.log(`Fetching config for slug: ${slug}`);

        const { resources: items } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.slug = @slug AND c.type = 'shop_config'",
                parameters: [{ name: "@slug", value: slug }]
            })
            .fetchAll();

        if (items.length === 0) {
            console.log("Shop not found!");
            return;
        }

        const shop = items[0];
        console.log("Current Shop Config:", {
            id: shop.id,
            slug: shop.slug,
            wallet: shop.wallet,
            customDomain: shop.customDomain
        });

        if (shop.customDomain === "xpaypass.com") {
            console.log("Domain already linked!");
            return;
        }

        // Update
        shop.customDomain = "xpaypass.com";
        shop.customDomainVerified = true;

        const { resource: updated } = await container.item(shop.id, shop.wallet).replace(shop);
        console.log("Updated Shop Config:", {
            id: updated.id,
            slug: updated.slug,
            customDomain: updated.customDomain
        });

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

linkDomainToShop();
