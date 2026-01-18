const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyze() {
    const apkPath = path.join(__dirname, '../android/launcher/recovered/portalpay-unsigned.apk');

    if (!fs.existsSync(apkPath)) {
        console.error(`APK not found at ${apkPath}`);
        return;
    }

    console.log(`Analyzing: ${apkPath}`);
    const data = fs.readFileSync(apkPath);
    const zip = await JSZip.loadAsync(data);

    console.log("\n--- Native Libraries (GeckoView check) ---");
    const libs = Object.keys(zip.files).filter(f => f.startsWith('lib/'));
    const hasGecko = libs.some(f => f.includes('libxul.so'));

    if (hasGecko) {
        console.log("✅ libxul.so FOUND. This APK uses GeckoView.");
    } else {
        console.log("❌ libxul.so NOT FOUND. This APK likely uses system WebView.");
    }

    libs.forEach(l => console.log(` - ${l}`));

    console.log("\n--- Assets ---");
    const assets = Object.keys(zip.files).filter(f => f.startsWith('assets/'));
    assets.slice(0, 10).forEach(a => console.log(` - ${a}`));

    console.log("\n--- Root Files ---");
    const root = Object.keys(zip.files).filter(f => !f.includes('/'));
    root.forEach(r => console.log(` - ${r}`));
}

analyze().catch(console.error);
