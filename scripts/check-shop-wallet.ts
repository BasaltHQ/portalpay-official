
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function checkShopWallet() {
    try {
        const container = await getContainer();
        const cleanSlug = "xoinpay";

        console.log(`Querying for slug: ${cleanSlug}`);

        const { resources: configs } = await container.items
            .query({
                query: "SELECT c.slug, c.wallet, c.name, c.id FROM c WHERE c.slug = @slug OR (c.customDomain = @slug AND c.customDomainVerified = true)",
                parameters: [{ name: "@slug", value: cleanSlug }]
            })
            .fetchAll();

        if (configs.length === 0) {
            console.log("No shop config found for xoinpay");
        } else {
            console.log("Found configs:", JSON.stringify(configs, null, 2));
        }
    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

checkShopWallet();
