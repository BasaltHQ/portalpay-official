require('dotenv').config({ path: '.env.local' });
const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require('fs');
const path = require('path');

async function downloadMaster() {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING;
    const containerName = process.env.PP_APK_CONTAINER || "portalpay";

    if (!conn) {
        console.error("No connection string");
        return;
    }

    const bsc = BlobServiceClient.fromConnectionString(conn);
    const container = bsc.getContainerClient(containerName);
    const blobName = "base/portalpay-unsigned-master.apk";
    const dest = path.join(__dirname, '../tmp/master.apk');

    console.log(`Downloading ${blobName} to ${dest}...`);

    const blob = container.getBlockBlobClient(blobName);
    if (await blob.exists()) {
        const buf = await blob.downloadToBuffer();
        fs.writeFileSync(dest, buf);
        console.log(`Downloaded ${buf.length} bytes.`);
    } else {
        console.error("Blob not found in Azure!");
    }
}

downloadMaster().catch(console.error);
