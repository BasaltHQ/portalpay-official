
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function investigateAndFix() {
    try {
        const container = await getContainer();
        console.log("Investigating Split Data & Fixing User...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        // 1. Fix New Wallet Visibility (Add Merchant Role)
        console.log("\n--- Fixing New Wallet User ---");
        const { resources: newUsers } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'user' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (newUsers.length > 0) {
            const u = newUsers[0];
            if (!u.roles?.merchant) {
                console.log(`Adding merchant role to ${u.id}...`);
                u.roles = { ...(u.roles || {}), merchant: true };
                // Ensure phone is consistent
                u.phone = "8187992169";
                await container.item(u.id, newWallet).replace(u);
                console.log("Updated New Wallet user.");
            } else {
                console.log("New Wallet already has merchant role.");
            }
        } else {
            console.error("New User not found!");
        }

        // 2. Search for Split Data
        console.log("\n--- Searching for Split Data ---");
        // Look for site_config or any doc with split info for this brand/wallet
        const query = `
        SELECT c.id, c.type, c.wallet, c.split, c.splitAddress, c.splitConfig, c.splitHistory
        FROM c 
        WHERE (c.wallet = '${oldWallet}' OR c.wallet = '${newWallet}' OR c.brandKey = 'jbxoinpay' OR c.slug = 'jbxoinpay')
    `;
        const { resources: docs } = await container.items.query(query).fetchAll();

        console.log(`Found ${docs.length} docs.`);
        let foundSplit = null;

        docs.forEach(d => {
            console.log(`[${d.type}] ${d.id} (W: ${d.wallet})`);
            if (d.splitAddress) {
                console.log(`  > Found splitAddress: ${d.splitAddress}`);
                foundSplit = d.splitAddress;
            }
            if (d.split?.address) {
                console.log(`  > Found split.address: ${d.split.address}`);
                foundSplit = d.split.address;
            }
            if (d.splitHistory?.length > 0) {
                console.log(`  > Found splitHistory: ${JSON.stringify(d.splitHistory)}`);
                if (!foundSplit) foundSplit = d.splitHistory[0].address;
            }
        });

        if (foundSplit) {
            console.log(`\nRecovered Split Address: ${foundSplit}`);
            // 3. Attach to current Client Request/Shop Config for Old Wallet
            console.log("Attaching to Old Wallet records...");

            // Update Shop Config
            const { resources: shops } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${oldWallet}'`)
                .fetchAll();
            if (shops.length > 0) {
                const s = shops[0];
                let changed = false;
                if (!s.splitAddress) { s.splitAddress = foundSplit; changed = true; }
                if (!s.split) { s.split = { address: foundSplit }; changed = true; } // simplified
                if (changed) {
                    await container.item(s.id, oldWallet).replace(s);
                    console.log("Updated Shop Config with Split.");
                }
            }

            // Update Client Request
            const { resources: reqs } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${oldWallet}'`)
                .fetchAll();
            if (reqs.length > 0) {
                const r = reqs[0];
                let changed = false;
                if (!r.deployedSplitAddress) { r.deployedSplitAddress = foundSplit; changed = true; }
                if (!r.splitHistory || r.splitHistory.length === 0) {
                    r.splitHistory = [{ address: foundSplit, deployedAt: Date.now() }];
                    changed = true;
                }
                if (changed) {
                    await container.item(r.id, oldWallet).replace(r);
                    console.log("Updated Client Request with Split.");
                }
            }

        } else {
            console.log("\nWARNING: No Split Data Found! User may need to redeploy.");
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

investigateAndFix();
