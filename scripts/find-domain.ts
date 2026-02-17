
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function findByDomain() {
    try {
        const container = await getContainer();
        const domain = "xpaypass.com";
        console.log(`Querying for customDomain: ${domain}`);

        const { resources: configs } = await container.items
            .query({
                query: "SELECT c.slug, c.wallet, c.name, c.customDomain FROM c WHERE c.customDomain = @domain",
                parameters: [{ name: "@domain", value: domain }]
            })
            .fetchAll();

        console.log("Found configs:", JSON.stringify(configs, null, 2));
    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

findByDomain();
