const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const JRE_URL = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jre_x64_linux_hotspot_17.0.9_9.tar.gz";

// FIX: Target 'tools' at the project root, not inside 'scripts'
const TOOLS_DIR = path.join(__dirname, '..', 'tools');
const FILTERED_DIR = path.join(TOOLS_DIR, 'jre-linux');
const TAR_FILE = path.join(TOOLS_DIR, 'jre-linux.tar.gz');

// Ensure tools directory exists
if (!fs.existsSync(TOOLS_DIR)) {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
}

function downloadFile(url, dest, cb) {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, function (response) {
        // Handle Redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
            const newUrl = response.headers.location;
            console.log(`Following redirect to: ${newUrl}`);
            file.close(() => downloadFile(newUrl, dest, cb));
            return;
        }

        // Check for success
        if (response.statusCode !== 200) {
            file.close();
            fs.unlink(dest, () => { }); // Delete partial file
            if (cb) cb(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
            return;
        }

        response.pipe(file);
        file.on('finish', function () {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function (err) {
        fs.unlink(dest, () => { }); // Delete the file async. (But we don't check the result)
        if (cb) cb(err);
    });
}

if (!fs.existsSync(FILTERED_DIR)) {
    console.log(`Portable JRE not found in ${FILTERED_DIR}. Downloading...`);

    downloadFile(JRE_URL, TAR_FILE, (err) => {
        if (err) {
            console.error("Download failed:", err);
            process.exit(1);
        }

        console.log("Download complete. Extracting...");
        try {
            // Create target directory
            fs.mkdirSync(FILTERED_DIR, { recursive: true });

            // Tar command
            execSync(`tar -xzf ${TAR_FILE} -C ${FILTERED_DIR} --strip-components=1`);

            console.log("Extraction complete.");

            // Set executable permissions
            const javaBin = path.join(FILTERED_DIR, 'bin', 'java');
            if (fs.existsSync(javaBin)) {
                fs.chmodSync(javaBin, '0755');
                console.log("Permissions set for java binary.");
            } else {
                console.warn("Warning: java binary not found after extraction.");
            }

            // Cleanup
            fs.unlinkSync(TAR_FILE);
            console.log("Cleanup complete.");

        } catch (e) {
            console.error("Failed to extract JRE:", e);
            // Cleanup zip on failure so we retry next time
            if (fs.existsSync(TAR_FILE)) fs.unlinkSync(TAR_FILE);
            process.exit(1);
        }
    });
} else {
    console.log("Portable JRE already exists.");
}
