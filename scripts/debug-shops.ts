
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function listShops() {
    try {
        const container = await getContainer();
        console.log("Connected to container:", container.id);

        const { resources: items } = await container.items
            .query("SELECT c.slug, c.wallet, c.type, c.brandKey FROM c WHERE c.type = 'shop_config'")
            .fetchAll();

        console.log("Found shop configs:", items.length);
        console.table(items);

        // Also try a case-insensitive search just in case
        const cleanSlug = "xoinpay";
        const { resources: fuzzy } = await container.items
            .query({
                query: "SELECT c.slug, c.wallet FROM c WHERE LOWER(c.slug) = @slug",
                parameters: [{ name: "@slug", value: cleanSlug }]
            })
            .fetchAll();

        console.log("Fuzzy search for xoinpay:", JSON.stringify(fuzzy, null, 2));

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

listShops();
