
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function debugDeep() {
    try {
        const container = await getContainer();
        console.log("DEEP DEBUG of Dual Shops attributes...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        const fetchAll = async (w: string, label: string) => {
            console.log(`\n--- ${label} (${w}) ---`);
            const { resources: docs } = await container.items
                .query(`SELECT c.id, c.type, c.slug, c.name, c.shopName, c.brandKey, c._ts FROM c WHERE c.wallet = '${w}'`)
                .fetchAll();
            docs.forEach(d => {
                console.log(`[${d.type}] ID: ${d.id}`);
                console.log(`    Slug: ${d.slug}`);
                console.log(`    Name: ${d.name || d.shopName}`);
                console.log(`    TS: ${d._ts}`);
            });
            return docs;
        };

        await fetchAll(oldWallet, "OLD WALLET");
        await fetchAll(newWallet, "NEW WALLET");

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

debugDeep();
