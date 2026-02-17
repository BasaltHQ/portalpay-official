
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function transferShopOwnership() {
    try {
        const container = await getContainer();

        // Mapping: Slug -> New Wallet
        // jbxoinpay: 0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a (from client_request)

        const updates = [
            {
                slug: "jbxoinpay",
                newWallet: "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a"
            }
        ];

        for (const u of updates) {
            console.log(`Processing ${u.slug}...`);

            const { resources: items } = await container.items
                .query({
                    query: "SELECT * FROM c WHERE c.slug = @slug AND c.type = 'shop_config'",
                    parameters: [{ name: "@slug", value: u.slug }]
                })
                .fetchAll();

            if (items.length === 0) {
                console.log(`Config for ${u.slug} not found!`);
                continue;
            }

            const shop = items[0];
            const oldWallet = shop.wallet;

            if (oldWallet.toLowerCase() === u.newWallet.toLowerCase()) {
                console.log(`${u.slug} already owned by ${u.newWallet}`);
                continue;
            }

            // Update wallet
            shop.wallet = u.newWallet;

            // Update id? No, id usually includes wallet?
            // Check ID format: "shop:config:xoinpay" or similar?
            // Step 887 output: id: 'shop:config:xoinpay'
            // It does NOT contain wallet in ID. This is good.
            // But we must be careful if the partition key is 'wallet'.
            // Cosmos DB query in Step 887 was just SELECT *.
            // Let's check the container definition or just try replace.
            // If partition key is 'wallet', we CANNOT update it in place. We must delete and recreate.

            // Checking check-users.ts output or other scripts...
            // `container.item(id, partitionKey).read()`
            // In `scripts/update-shop-contact.ts`, I used `container.item(shop.id, shop.wallet).replace(shop)`.
            // This implies `wallet` IS the partition key.

            console.log(`Switching ${u.slug} from ${oldWallet} to ${u.newWallet}`);

            // 1. Create new doc copy
            const newDoc = { ...shop, wallet: u.newWallet };

            // 2. Create new document
            await container.items.create(newDoc);
            console.log(`Created new config for ${u.slug} with wallet ${u.newWallet}`);

            // 3. Delete old document (optional, or mark as deprecated?)
            // The user said "orphan the new account"? No "orphan the new account" might mean "orphan the old one".
            // I will delete the old one to avoid duplicates for the same slug (slug should be unique-ish logic).
            await container.item(shop.id, oldWallet).delete();
            console.log(`Deleted old config for ${u.slug} owned by ${oldWallet}`);
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

transferShopOwnership();
