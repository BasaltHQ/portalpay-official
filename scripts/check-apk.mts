import { S3StorageProvider } from "./src/lib/storage/s3/provider.ts";
import { config } from "dotenv";

config({ path: ".env.local" });

const storage = new S3StorageProvider();

async function check() {
    const items = ["apks/brands/basaltsurge-touchpoint-signed.apk", "apks/brands/touchpoint-signed.apk", "portalpay/brands/basaltsurge-touchpoint-signed.apk", "portalpay/brands/touchpoint-signed.apk"];
    for (const item of items) {
        try {
            const e = await storage.exists(item);
            console.log(`${item}: exists=${e}`);
            if (e) {
                console.log(`URL: ${await storage.getUrl(item)}`);
            }
        } catch (err) {
            console.error(`Error checking ${item}: ${err.message}`);
        }
    }
}
check();
