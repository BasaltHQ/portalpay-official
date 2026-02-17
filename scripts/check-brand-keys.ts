
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function checkBrandKeys() {
    try {
        const container = await getContainer();
        console.log("Checking Brand Keys...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        const fetchBrand = async (w: string, label: string) => {
            const { resources: shops } = await container.items
                .query(`SELECT c.id, c.slug, c.brandKey FROM c WHERE c.type = 'shop_config' AND c.wallet = '${w}'`)
                .fetchAll();
            shops.forEach(s => console.log(`[${label}] ${s.slug}: ${s.brandKey}`));
        };

        await fetchBrand(oldWallet, "OLD");
        await fetchBrand(newWallet, "NEW");

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

checkBrandKeys();
