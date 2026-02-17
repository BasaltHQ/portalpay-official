
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function createSiteConfig() {
    try {
        const container = await getContainer();
        console.log("Creating Site Config for New Wallet 0x79c...");

        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        const brandKey = "xoinpay";
        const siteId = `site:config:${brandKey}:mobile`; // distinct ID

        const siteConfig = {
            id: siteId,
            type: "site_config",
            wallet: newWallet,
            brandKey: brandKey,
            slug: "jbxoinpay-mobile", // Match the shop slug
            name: "XoinPay (Mobile)",
            createdAt: Date.now(),
            // Split address for consistency
            splitAddress: "0x6ab6f89a0d8f19851b7d446af73ea34720ec39b2"
        };

        await container.items.create(siteConfig);
        console.log(`Created Site Config: ${siteId}`);

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

createSiteConfig();
