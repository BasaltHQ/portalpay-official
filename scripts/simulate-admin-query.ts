
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function simulateAdminQuery() {
    try {
        const container = await getContainer();
        console.log("Simulating Admin Query Logic...");

        const brandFilter = "xoinpay"; // Correct brand
        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";

        // 1. Fetch featureRows (shop_config)
        console.log("Fetching shop_config...");
        const { resources: featureRows } = await container.items
            .query(`SELECT c.wallet, c.brandKey FROM c WHERE c.type='shop_config'`)
            .fetchAll();

        // 2. Logic from API
        const walletsFromShopConfig = featureRows
            .filter(r => {
                const rBrand = String((r as any).brandKey || "portalpay").toLowerCase();
                const isPlatformQuery = !brandFilter || brandFilter === "portalpay" || brandFilter === "basaltsurge";
                const rowIsPlatform = !rBrand || rBrand === "portalpay" || rBrand === "basaltsurge";
                return isPlatformQuery ? rowIsPlatform : (rBrand === brandFilter);
            })
            .map(r => String(r.wallet || "").toLowerCase())
            .filter(w => /^0x[a-f0-9]{40}$/i.test(w)); // simplified hex check

        console.log(`Found ${walletsFromShopConfig.length} wallets in shop_config matching filter.`);

        // 3. Check if New Wallet is included
        const isIncluded = walletsFromShopConfig.includes(newWallet.toLowerCase());

        if (isIncluded) {
            console.log(`SUCCESS: New Wallet ${newWallet} IS included in the list.`);
        } else {
            console.error(`FAILURE: New Wallet ${newWallet} is NOT included.`);
            // Debug why
            const row = featureRows.find(r => r.wallet === newWallet);
            console.log("Row for new wallet:", row);
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

simulateAdminQuery();
