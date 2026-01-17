const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function checkWrapHtml() {
    // Check the signed output from the debug session
    const file = path.join(__dirname, '../tmp/debug-sign/test-aligned-debugSigned.apk');
    if (!fs.existsSync(file)) {
        console.log("File not found:", file);
        return;
    }

    const data = fs.readFileSync(file);
    const zip = await JSZip.loadAsync(data);

    if (zip.files['assets/wrap.html']) {
        const content = await zip.files['assets/wrap.html'].async('string');
        const out = path.join(__dirname, '../tmp/extracted_wrap.html');
        fs.writeFileSync(out, content);
        console.log("Saved to", out);
    } else {
        console.log("assets/wrap.html not found!");
    }
}

checkWrapHtml();
