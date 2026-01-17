const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function testPatch() {
    const brandKey = "xoinpay";
    const endpoint = "https://xoinpay.azurewebsites.net";
    const tempDir = path.join("tmp", "test_patch_build");

    // Cleanup previous run
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    const baseApkPath = "tmp/deployed_xoinpay.apk";
    const workApkPath = path.join(tempDir, "base.apk");
    const decompDir = path.join(tempDir, "decompiled");
    const rebuiltApkPath = path.join(tempDir, "rebuilt.apk");

    if (!fs.existsSync(baseApkPath)) {
        console.error("Base APK not found!");
        return;
    }

    console.log("Copying APK...");
    fs.copyFileSync(baseApkPath, workApkPath);

    const javaPath = path.join(process.cwd(), "tools", "jre-linux", "bin", "java");
    // Fallback to global java if local not found (or on windows where we might just check java)
    const javaCmd = (process.platform === 'win32') ? 'java' : (fs.existsSync(javaPath) ? javaPath : 'java');
    const apktoolPath = path.join(process.cwd(), "tools", "apktool.jar");

    console.log(`Using Java: ${javaCmd}`);

    // 1. Decompile
    console.log("Decompiling...");
    try {
        execSync(`"${javaCmd}" -jar "${apktoolPath}" d -f -o "${decompDir}" "${workApkPath}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error("Decompilation failed");
        return;
    }

    // 2. Modify Smali
    console.log("Modifying Smali...");
    const smaliPath = path.join(decompDir, "smali", "com", "pos", "valorpay", "portalpay", "MainActivity.smali");
    let smaliContent = fs.readFileSync(smaliPath, "utf-8");

    const urlWithScale = `${endpoint}?scale=0.75`;
    const oldUrlExact = 'const-string v0, "https://paynex.azurewebsites.net?scale=0.75"';
    const newUrlString = `const-string v0, "${urlWithScale}"`;

    let replaced = false;
    if (smaliContent.includes(oldUrlExact)) {
        smaliContent = smaliContent.replace(oldUrlExact, newUrlString);
        console.log("✅ Exact match replacement worked!");
        replaced = true;
    } else {
        console.log("⚠️ Exact match failed. Trying regex...");
        const genericPattern = /const-string v0, "https:\/\/[a-zA-Z0-9.-]+\.azurewebsites\.net[^"]*"/g;
        if (genericPattern.test(smaliContent)) {
            smaliContent = smaliContent.replace(genericPattern, newUrlString);
            console.log("✅ Regex replacement worked!");
            replaced = true;
        } else {
            console.error("❌ FAILED to find URL pattern!");
        }
    }

    if (replaced) {
        fs.writeFileSync(smaliPath, smaliContent);
    }

    // 3. Modify Manifest
    console.log("Modifying Manifest...");
    const manifestPath = path.join(decompDir, "AndroidManifest.xml");
    let manifestContent = fs.readFileSync(manifestPath, "utf-8");

    if (manifestContent.includes('android:label="PortalPay"')) {
        manifestContent = manifestContent.replace(/android:label="PortalPay"/g, 'android:label="XoinPay"');
        console.log("✅ Manifest label replaced!");
        fs.writeFileSync(manifestPath, manifestContent);
    } else {
        console.error("❌ Manifest label pattern not found!");
    }

    // 4. Rebuild
    console.log("Rebuilding...");
    try {
        execSync(`"${javaCmd}" -jar "${apktoolPath}" b -o "${rebuiltApkPath}" "${decompDir}"`, { stdio: 'inherit' });
        console.log("✅ Rebuild successful!");
        console.log(`Size: ${fs.statSync(rebuiltApkPath).size} bytes`);
    } catch (e) {
        console.error("❌ Rebuild failed!");
        if (e.stdout) console.error("STDOUT:", e.stdout.toString());
        if (e.stderr) console.error("STDERR:", e.stderr.toString());
        console.error("Message:", e.message);
    }
}

testPatch().catch(console.error);
