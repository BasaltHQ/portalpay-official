
import { getSiteConfigForWallet } from "./src/lib/site-config";

async function test() {
    const wallet = "0x6c28067a2d4f10013fbbb8534acd76ab43a4ff9f";
    const config = await getSiteConfigForWallet(wallet);
    console.log("Wallet requested:", wallet);
    console.log("Config wallet returned:", config.wallet);
    console.log("Config id returned:", config.id);
}

test().catch(console.error);
