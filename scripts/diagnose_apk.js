require('dotenv').config({ path: '.env.local' });
const { BlobServiceClient } = require("@azure/storage-blob");
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function diagnose() {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING;
    const containerName = process.env.PP_APK_CONTAINER || "portalpay";

    if (!conn) {
        console.error("ERROR: No connection string in .env.local");
        return;
    }

    const bsc = BlobServiceClient.fromConnectionString(conn);
    const container = bsc.getContainerClient(containerName);

    // Download the xoinpay signed APK
    const blobName = "brands/xoinpay-touchpoint-signed.apk";
    console.log(`Downloading ${blobName}...`);

    const blob = container.getBlockBlobClient(blobName);
    if (!(await blob.exists())) {
        console.error(`ERROR: APK not found at ${blobName}`);
        // List what's there
        console.log("\nAvailable blobs with 'xoinpay':");
        for await (const b of container.listBlobsFlat({ prefix: 'brands/' })) {
            if (b.name.includes('xoinpay')) {
                console.log(`  - ${b.name}`);
            }
        }
        return;
    }

    const buf = await blob.downloadToBuffer();
    console.log(`Downloaded ${buf.length} bytes`);

    // Save locally for debugging
    fs.writeFileSync('tmp/deployed_xoinpay.apk', buf);
    console.log("Saved to tmp/deployed_xoinpay.apk");

    // Analyze
    console.log("\n=== ANALYZING DEPLOYED APK ===\n");

    const zip = await JSZip.loadAsync(buf);

    // 1. Check wrap.html
    console.log("1. WRAP.HTML CONTENT:");
    const wrapFile = zip.file("assets/wrap.html");
    if (wrapFile) {
        const content = await wrapFile.async("string");

        // Check for key patterns
        if (content.includes("xoinpay")) {
            console.log("   ✅ Contains 'xoinpay' - injection likely worked");
        } else if (content.includes("paynex")) {
            console.log("   ❌ Contains 'paynex' - injection FAILED!");
        }

        if (content.includes("installationId")) {
            console.log("   ✅ Contains 'installationId' - ID logic injected");
        } else {
            console.log("   ❌ Missing 'installationId' - ID logic NOT injected");
        }

        if (content.includes("debugDiv")) {
            console.log("   ✅ Contains 'debugDiv' - debug overlay present");
        } else {
            console.log("   ❌ Missing 'debugDiv' - debug overlay NOT present");
        }

        // Extract the src line
        const srcMatch = content.match(/var\s+src\s*=.*?;/);
        if (srcMatch) {
            console.log(`   src line: ${srcMatch[0]}`);
        }

        // Save for inspection
        fs.writeFileSync('tmp/deployed_wrap.html', content);
        console.log("   Saved to tmp/deployed_wrap.html");
    } else {
        console.log("   ❌ wrap.html NOT FOUND in APK!");
    }

    // 2. Check icons
    console.log("\n2. ICON FILES:");
    const iconPatterns = [
        "res/mipmap-mdpi-v4/ic_launcher.png",
        "res/mipmap-hdpi-v4/ic_launcher.png",
        "res/mipmap-xhdpi-v4/ic_launcher.png",
        "res/mipmap-anydpi-v26/ic_launcher.xml",
    ];

    for (const p of iconPatterns) {
        const f = zip.file(p);
        if (f) {
            const data = await f.async("nodebuffer");
            console.log(`   ✅ ${p} (${data.length} bytes)`);
        } else {
            console.log(`   ❌ ${p} NOT FOUND`);
        }
    }

    // 3. Check .so compression (need Python for accurate check, but estimate)
    console.log("\n3. NATIVE LIBRARY CHECK:");
    const soFile = zip.file("lib/arm64-v8a/libxul.so");
    if (soFile) {
        // JSZip doesn't expose compression directly, but we can check if it was read
        console.log("   ✅ libxul.so exists");
        console.log("   (Run Python script for compression check)");
    } else {
        console.log("   ❌ libxul.so NOT FOUND - GeckoView broken!");
    }

    // 4. Check META-INF (signing)
    console.log("\n4. SIGNATURE CHECK:");
    const sigFiles = Object.keys(zip.files).filter(f => f.startsWith("META-INF/"));
    if (sigFiles.length > 0) {
        console.log(`   ✅ Signed (${sigFiles.length} META-INF files)`);
        sigFiles.slice(0, 5).forEach(f => console.log(`      - ${f}`));
    } else {
        console.log("   ❌ NOT SIGNED - will fail to install!");
    }

    console.log("\n=== DIAGNOSIS COMPLETE ===");
}

diagnose().catch(console.error);
