const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const dir = path.join(__dirname, '../android/launcher/recovered');

async function checkFile(filename) {
    const apkPath = path.join(dir, filename);
    console.log(`\nChecking ${filename}...`);

    if (!fs.existsSync(apkPath)) {
        console.log("File not found");
        return;
    }

    const data = fs.readFileSync(apkPath);
    console.log(`Size: ${data.length} bytes`);

    try {
        const zip = await JSZip.loadAsync(data);
        console.log("VALID - files:", Object.keys(zip.files).length);
    } catch (e) {
        console.error("INVALID:", e.message);
    }
}

async function testAll() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.apk'));
    for (const f of files) {
        await checkFile(f);
    }
}

testAll();
