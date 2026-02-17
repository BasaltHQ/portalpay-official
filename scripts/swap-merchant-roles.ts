
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function swapMerchantRoles() {
    try {
        const container = await getContainer();
        console.log("Swapping Merchant Roles for jbxoinpay...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        // 1. Promote New Wallet
        const { resources: newUsers } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'user' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (newUsers.length > 0) {
            const u = newUsers[0];
            console.log(`Promoting New Wallet ${u.id}...`);
            u.roles = { ...u.roles, merchant: true };
            u.phone = "8187992169"; // Ensure phone is set on user too
            // Ensure contact info matches
            u.contact = { ...(u.contact || {}), phone: "8187992169", showPhone: true };

            await container.item(u.id, newWallet).replace(u);
            console.log("Promoted New Wallet.");
        } else {
            console.error("New user not found!");
        }

        // 2. Demote Old Wallet
        const { resources: oldUsers } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'user' AND c.wallet = '${oldWallet}'`)
            .fetchAll();

        if (oldUsers.length > 0) {
            const u = oldUsers[0];
            console.log(`Demoting Old Wallet ${u.id}...`);
            if (u.roles) {
                u.roles.merchant = false;
            }
            // Should we keep the phone number? Maybe, strictly as contact.

            await container.item(u.id, oldWallet).replace(u);
            console.log("Demoted Old Wallet.");
        } else {
            console.error("Old user not found!");
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

swapMerchantRoles();
