
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function checkSplitIndexBrand() {
    try {
        const container = await getContainer();
        console.log("Checking Split Index Brand Key for 0x7fbb...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";

        const { resources: idx } = await container.items
            .query(`SELECT c.id, c.merchantWallet, c.brandKey FROM c WHERE c.type = 'split_index' AND c.merchantWallet = '${oldWallet}'`)
            .fetchAll();

        if (idx.length > 0) {
            idx.forEach(i => console.log(`ID: ${i.id}, Brand: ${i.brandKey}`));
        } else {
            console.log("No split_index found for old wallet.");
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

checkSplitIndexBrand();
