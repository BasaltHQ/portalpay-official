
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function checkSiteConfigs() {
    try {
        const container = await getContainer();
        console.log("Checking Site Configs...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        const fetchSite = async (w: string, label: string) => {
            const { resources: sites } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'site_config' AND c.wallet = '${w}'`)
                .fetchAll();

            if (sites.length > 0) {
                sites.forEach(s => console.log(`[${label}] Found Site Config: ${s.id}, Brand: ${s.brandKey}, CustomDomain: ${s.customDomain}`));
            } else {
                console.log(`[${label}] No Site Config found.`);
            }
        };

        await fetchSite(oldWallet, "OLD");
        await fetchSite(newWallet, "NEW");

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

checkSiteConfigs();
