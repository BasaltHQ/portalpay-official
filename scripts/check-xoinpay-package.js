// Script to check xoinpay installer ZIP from blob storage
const { BlobServiceClient } = require('@azure/storage-blob');
const JSZip = require('jszip');

async function checkXoinpayPackage() {
    // Get connection string from .env
    require('dotenv').config({ path: '.env.local' });

    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING;
    if (!conn) {
        console.log('No connection string found in environment');
        return;
    }

    const bsc = BlobServiceClient.fromConnectionString(conn);
    const cont = bsc.getContainerClient('device-packages');

    // Check xoinpay (Partner) package
    const blobName = 'xoinpay/xoinpay-installer.zip';
    const blob = cont.getBlockBlobClient(blobName);

    if (!(await blob.exists())) {
        console.log('xoinpay-installer.zip does not exist');
        return;
    }

    const props = await blob.getProperties();
    console.log('=== xoinpay-installer.zip ===');
    console.log('Size:', props.contentLength);
    console.log('Last Modified:', props.lastModified);
    console.log('Metadata:', JSON.stringify(props.metadata, null, 2));

    // Download and inspect the ZIP
    const zipBuffer = await blob.downloadToBuffer();
    const zip = await JSZip.loadAsync(zipBuffer);

    // Find the APK inside
    const apkFile = Object.keys(zip.files).find(f => f.endsWith('.apk'));
    if (!apkFile) {
        console.log('No APK found in ZIP');
        return;
    }

    console.log('\n=== APK:', apkFile, '===');
    const apkBuffer = await zip.file(apkFile).async('nodebuffer');
    const apk = await JSZip.loadAsync(apkBuffer);

    // Check resources.arsc compression
    const resourcesArsc = apk.files['resources.arsc'];
    if (resourcesArsc) {
        // JSZip doesn't expose the compression method directly, but we can check _data
        console.log('resources.arsc found');
        console.log('  - dir:', resourcesArsc.dir);
        console.log('  - uncompressedSize:', resourcesArsc._data?.uncompressedSize || 'unknown');
        console.log('  - compressedSize:', resourcesArsc._data?.compressedSize || 'unknown');

        // If compressedSize !== uncompressedSize, it's compressed
        const uSize = resourcesArsc._data?.uncompressedSize;
        const cSize = resourcesArsc._data?.compressedSize;
        if (uSize && cSize) {
            if (uSize === cSize) {
                console.log('  - Compression: STORE (uncompressed) ✓');
            } else {
                console.log('  - Compression: DEFLATE (compressed) ✗');
            }
        }
    } else {
        console.log('resources.arsc NOT FOUND');
    }

    // Also check META-INF files
    console.log('\n=== META-INF files ===');
    const metaInfFiles = Object.keys(apk.files).filter(f => f.startsWith('META-INF/'));
    for (const f of metaInfFiles) {
        console.log(' -', f);
    }
}

checkXoinpayPackage().catch(console.error);
