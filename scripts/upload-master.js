require('dotenv').config({ path: '.env.local' });
const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require('fs');
const path = require('path');

async function upload() {
    // Use the connection string from env
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING;
    if (!conn) {
        console.error("No Azure Connection String found in .env.local");
        process.exit(1);
    }

    const containerName = process.env.PP_APK_CONTAINER || "portalpay";
    const blobName = "base/portalpay-unsigned-master.apk";
    const localPath = path.join(__dirname, '../android/launcher/recovered/portalpay-unsigned.apk');

    if (!fs.existsSync(localPath)) {
        console.error(`Local file not found: ${localPath}`);
        process.exit(1);
    }

    console.log(`Uploading ${localPath} to container '${containerName}' as '${blobName}'...`);

    const blobServiceClient = BlobServiceClient.fromConnectionString(conn);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const stats = fs.statSync(localPath);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    const stream = fs.createReadStream(localPath);

    try {
        await blockBlobClient.uploadStream(stream, 4 * 1024 * 1024, 5, {
            blobHTTPHeaders: { blobContentType: "application/vnd.android.package-archive" }
        });
        console.log("Upload successful!");
    } catch (err) {
        console.error("Upload failed:", err.message);
        process.exit(1);
    }
}

upload();
