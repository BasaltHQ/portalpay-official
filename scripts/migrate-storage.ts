
import dotenv from 'dotenv';
// Load env vars from .env file
dotenv.config();

import { AzureStorageProvider } from '../src/lib/storage/azure/provider';
import { S3StorageProvider } from '../src/lib/storage/s3/provider';

async function migrate() {
    console.log("🚀 Starting Storage Migration: Azure Blob -> S3");

    // Check Env Vars
    const azureContainer = process.env.AZURE_BLOB_CONTAINER || "portalpay";
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING && !process.env.AZURE_BLOB_ACCOUNT_KEY) {
        console.error("❌ Missing Azure Credentials");
        process.exit(1);
    }
    if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY) {
        console.error("❌ Missing S3 Credentials. Ensure STORAGE_PROVIDER=s3 configuration is present.");
        process.exit(1);
    }

    // Initialize Providers directly
    const azure = new AzureStorageProvider();
    const s3 = new S3StorageProvider();

    // List files from Azure
    console.log(`\n🔍 Listing files in Azure container: '${azureContainer}'...`);
    const files = await azure.list(azureContainer + "/");
    console.log(`found ${files.length} files.`);

    if (files.length === 0) {
        console.log("No files to migrate.");
        return;
    }

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const file of files) {
        try {
            // Check if exists in S3
            const exists = await s3.exists(file);
            if (exists) {
                console.log(`⏭️  Skipping existing: ${file}`);
                skipped++;
                continue;
            }

            console.log(`⬇️  Downloading: ${file}`);
            const buffer = await azure.download(file);

            // Determine content type (simple guess or default)
            let contentType = "application/octet-stream";
            if (file.endsWith(".png")) contentType = "image/png";
            if (file.endsWith(".jpg") || file.endsWith(".jpeg")) contentType = "image/jpeg";
            if (file.endsWith(".webp")) contentType = "image/webp";
            if (file.endsWith(".svg")) contentType = "image/svg+xml";
            if (file.endsWith(".json")) contentType = "application/json";
            if (file.endsWith(".apk")) contentType = "application/vnd.android.package-archive";

            console.log(`⬆️  Uploading to S3: ${file} (${buffer.length} bytes)`);
            await s3.upload(file, buffer, contentType);
            success++;
        } catch (e: any) {
            console.error(`❌ Failed ${file}: ${e.message}`);
            failed++;
        }
    }

    console.log("\n✅ Migration Complete");
    console.log(`Total: ${files.length}`);
    console.log(`Transferred: ${success}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
}

migrate().catch(e => console.error(e));
