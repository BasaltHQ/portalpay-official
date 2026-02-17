
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function updateLegalName() {
    try {
        const container = await getContainer();
        console.log("Updating Legal Name for 0x79c...");

        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        const newName = "JB Demo";

        // 1. Update Shop Config
        const { resources: shops } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (shops.length > 0) {
            const shop = shops[0];
            console.log(`Updating Shop ${shop.id}: LegalName '${shop.legalName}' -> '${newName}'`);
            shop.legalName = newName;
            // Also update name if it looks like the placeholder
            if (shop.name === "DELETE ME AFTER" || shop.name === "XoinPay (Mobile)") {
                shop.name = newName;
                console.log(`Also updated Shop Name to '${newName}'`);
            }
            await container.item(shop.id, newWallet).replace(shop);
        } else {
            console.error("Shop Config not found.");
        }

        // 2. Update Client Request
        const { resources: reqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (reqs.length > 0) {
            const req = reqs[0];
            console.log(`Updating Request ${req.id}: LegalBusinessName '${req.legalBusinessName}' -> '${newName}'`);
            req.legalBusinessName = newName;
            // Update validBusinessName too if it exists
            if (req.validBusinessName) req.validBusinessName = newName;

            await container.item(req.id, newWallet).replace(req);
        } else {
            console.error("Client Request not found.");
        }

        // 3. Update Site Config (if name is there)
        const { resources: sites } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'site_config' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (sites.length > 0) {
            const site = sites[0];
            console.log(`Updating Site Config ${site.id}: Name '${site.name}' -> '${newName}'`);
            site.name = newName; // Site configs usually just have 'name'
            await container.item(site.id, newWallet).replace(site);
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

updateLegalName();
