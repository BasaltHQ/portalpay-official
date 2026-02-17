
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function inspectNewUsers() {
    try {
        const container = await getContainer();

        const wallets = [
            "0x729720dc86d0ab675a5d98370dd3b13fcb7f2f41",
            "0x2f2ce02f7cdbb6922c6d276043f5b17427ec31e9"
        ];

        const walletList = wallets.map(w => `'${w}'`).join(",");

        const { resources: users } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'user' AND ARRAY_CONTAINS([${walletList}], c.wallet)`)
            .fetchAll();

        console.log(JSON.stringify(users, null, 2));

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

inspectNewUsers();
