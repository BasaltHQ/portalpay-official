const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function checkWrapHtml() {
    const file = path.join(__dirname, '../android/launcher/recovered/portalpay-unsigned.apk');

    if (!fs.existsSync(file)) {
        console.error("Source APK not found:", file);
        return;
    }

    console.log("Reading APK:", file);

    try {
        const data = fs.readFileSync(file);
        const zip = await JSZip.loadAsync(data);

        if (zip.files['assets/wrap.html']) {
            const content = await zip.files['assets/wrap.html'].async('string');
            const out = path.join(__dirname, '../tmp/extracted_wrap.html');
            // Ensure tmp dir exists
            if (!fs.existsSync(path.dirname(out))) {
                fs.mkdirSync(path.dirname(out), { recursive: true });
            }
            fs.writeFileSync(out, content);
            console.log("SUCCESS: Extracted wrap.html to", out);
        } else {
            console.error("FAILURE: assets/wrap.html not found in APK!");
            // List assets to be helpful
            const assets = Object.keys(zip.files).filter(f => f.startsWith('assets/'));
            console.log("Available assets:", assets);
        }
    } catch (e) {
        console.error("CRASH: Error processing APK:", e);
    }
}

checkWrapHtml();
