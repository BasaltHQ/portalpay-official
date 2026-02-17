
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function finalMigration() {
    try {
        const container = await getContainer();
        console.log("FINAL MIGRATION for jbxoinpay -> New Wallet 0x79c...");

        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        const splitAddress = "0x6ab6f89a0d8f19851b7d446af73ea34720ec39b2"; // Recovered previously

        // 1. DELETE Old Shop Config (Owner: 0x7fbb)
        // We must ensure the OLD wallet does NOT own the shop.
        {
            const { resources: oldShops } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${oldWallet}'`)
                .fetchAll();

            for (const shop of oldShops) {
                console.log(`Deleting Old Shop Config: ${shop.id} (Owner: ${shop.wallet})`);
                await container.item(shop.id, shop.wallet).delete();
            }
        }

        // 2. CREATE/UPDATE New Shop Config (Owner: 0x79c)
        {
            const { resources: newShops } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${newWallet}'`)
                .fetchAll();

            let shop = newShops.length > 0 ? newShops[0] : {
                id: `shop:config:xoinpay`, // Maintain ID consistency if possible, or new one
                type: "shop_config",
                wallet: newWallet,
                createdAt: Date.now()
            };

            // Enforce critical fields
            shop.slug = "jbxoinpay";
            shop.wallet = newWallet;
            shop.brandKey = "portalpay"; // or whatever matches
            shop.name = "XoinPay";
            shop.phone = "8187992169";
            shop.contact = { phone: "8187992169", showPhone: true };

            // Attach Split Data
            shop.splitAddress = splitAddress;
            shop.split = { address: splitAddress };

            await container.items.upsert(shop);
            console.log(`Upserted New Shop Config: ${shop.id} (Owner: ${newWallet})`);
        }

        // 3. Ensure Client Request is APPROVED for New Wallet
        {
            const { resources: reqs } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${newWallet}'`)
                .fetchAll();

            if (reqs.length > 0) {
                const req = reqs[0];
                if (req.status !== "approved") {
                    req.status = "approved";
                    // Ensure split info is here too for the UI
                    req.deployedSplitAddress = splitAddress;
                    req.splitHistory = [{ address: splitAddress, deployedAt: Date.now() }];

                    await container.item(req.id, newWallet).replace(req);
                    console.log(`Approved Client Request for New Wallet.`);
                } else {
                    // Just ensure split info is correct even if approved
                    req.deployedSplitAddress = splitAddress;
                    await container.item(req.id, newWallet).replace(req);
                    console.log(`Updated Client Request split info.`);
                }
            } else {
                console.log("WARNING: No client request found for new wallet. Creating one...");
                // Create if missing
                const newReq = {
                    id: crypto.randomUUID(),
                    wallet: newWallet,
                    type: "client_request",
                    status: "approved",
                    shopName: "XoinPay",
                    slug: "jbxoinpay",
                    phone: "8187992169",
                    deployedSplitAddress: splitAddress,
                    createdAt: Date.now()
                };
                await container.items.create(newReq);
                console.log("Created missing client request.");
            }
        }

        // 4. Ensure New Wallet has Merchant Role (already done, but double check)
        {
            const { resources: users } = await container.items
                .query(`SELECT * FROM c WHERE c.type = 'user' AND c.wallet = '${newWallet}'`)
                .fetchAll();
            if (users.length > 0) {
                const u = users[0];
                if (!u.roles?.merchant) {
                    u.roles = { ...(u.roles || {}), merchant: true };
                    await container.item(u.id, newWallet).replace(u);
                    console.log("Added merchant role to New Wallet.");
                }
            }
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

finalMigration();
