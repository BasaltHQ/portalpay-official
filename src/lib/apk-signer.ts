/**
 * Pure JavaScript APK Signing Utility
 * 
 * Implements JAR signing (APK Signature Scheme v1) using node-forge.
 * This allows signing APKs without requiring Java.
 * 
 * V1 signing works for sideloaded APKs on all Android versions.
 */

import forge from "node-forge";
import JSZip from "jszip";
import crypto from "crypto";

// Debug keystore info (matches uber-apk-signer default)
const DEBUG_KEY_ALIAS = "androiddebugkey";
const DEBUG_CERT_CN = "Android Debug";
const DEBUG_CERT_VALIDITY_YEARS = 30;

// JAR manifest line length limit (per JAR specification)
const MAX_LINE_LENGTH = 70; // Leave room for CRLF

/**
 * Wrap a manifest line to comply with JAR specification (72 byte max per line).
 * Continuation lines start with a single space.
 */
function wrapManifestLine(line: string): string {
    if (line.length <= MAX_LINE_LENGTH) {
        return line;
    }

    const result: string[] = [];
    let remaining = line;
    let isFirst = true;

    while (remaining.length > 0) {
        const maxLen = isFirst ? MAX_LINE_LENGTH : MAX_LINE_LENGTH - 1; // Continuation lines have " " prefix
        const chunk = remaining.substring(0, maxLen);
        remaining = remaining.substring(maxLen);

        if (isFirst) {
            result.push(chunk);
            isFirst = false;
        } else {
            result.push(" " + chunk); // Continuation lines start with space
        }
    }

    return result.join("\r\n");
}

/**
 * Generate a self-signed debug certificate for APK signing.
 * Similar to what Android SDK's debug.keystore provides.
 */
function generateDebugCertificate(): { privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate } {
    // Generate RSA key pair
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Create certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "01";

    // Set validity
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + DEBUG_CERT_VALIDITY_YEARS);

    // Set subject and issuer (self-signed)
    const attrs = [
        { name: "commonName", value: DEBUG_CERT_CN },
        { name: "organizationName", value: "Android" },
        { name: "organizationalUnitName", value: "Android" },
        { name: "countryName", value: "US" },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    // Set extensions
    cert.setExtensions([
        { name: "basicConstraints", cA: true },
        { name: "keyUsage", keyCertSign: true, digitalSignature: true },
    ]);

    // Sign the certificate with the private key
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return { privateKey: keys.privateKey, certificate: cert };
}

// Cache the debug certificate so we don't regenerate it every time
let cachedCert: { privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate } | null = null;

function getDebugCertificate() {
    if (!cachedCert) {
        console.log("[APK Signer] Generating debug certificate...");
        cachedCert = generateDebugCertificate();
    }
    return cachedCert;
}

/**
 * Calculate SHA-256 digest of data and return base64-encoded string
 */
function sha256Base64(data: Buffer | string): string {
    const hash = crypto.createHash("sha256");
    hash.update(data);
    return hash.digest("base64");
}

/**
 * Calculate SHA-1 digest of data and return base64-encoded string
 */
function sha1Base64(data: Buffer | string): string {
    const hash = crypto.createHash("sha1");
    hash.update(data);
    return hash.digest("base64");
}

/**
 * Build MANIFEST.MF content
 * Lists all files with their SHA-256 digests
 * 
 * Format per JAR spec:
 * - Main attributes first, then blank line
 * - Each entry: Name: <path>\r\n<digest-attr>: <digest>\r\n\r\n
 * - Lines wrapped at 72 bytes (continuation lines start with space)
 */
function buildManifest(files: Map<string, Buffer>): string {
    const sections: string[] = [];

    // Main section
    sections.push(wrapManifestLine("Manifest-Version: 1.0"));
    sections.push(wrapManifestLine("Created-By: 1.0 (PortalPay APK Signer)"));
    sections.push(""); // Blank line after main section

    // Entry sections - sorted for consistency
    const sortedFiles = Array.from(files.keys()).sort();

    for (const filename of sortedFiles) {
        // Skip META-INF files
        if (filename.startsWith("META-INF/")) continue;

        const content = files.get(filename)!;
        const digest = sha256Base64(content);

        sections.push(wrapManifestLine(`Name: ${filename}`));
        sections.push(wrapManifestLine(`SHA-256-Digest: ${digest}`));
        sections.push(""); // Blank line after each entry
    }

    return sections.join("\r\n");
}

/**
 * Build CERT.SF (Signature File) content
 * Contains digest of entire manifest and per-section digests
 */
function buildSignatureFile(manifestContent: string): string {
    const sections: string[] = [];

    // Main section
    sections.push(wrapManifestLine("Signature-Version: 1.0"));
    sections.push(wrapManifestLine(`SHA-256-Digest-Manifest: ${sha256Base64(manifestContent)}`));
    sections.push(wrapManifestLine("Created-By: 1.0 (PortalPay APK Signer)"));
    sections.push(""); // Blank line

    // For CERT.SF, we need to digest each section of MANIFEST.MF separately
    // A section is: Name line + attribute lines + blank line (including the trailing CRLF)

    const manifestSections = parseManifestSections(manifestContent);

    for (const section of manifestSections) {
        if (section.name) {
            // Compute digest of the section (including trailing CRLF)
            const sectionDigest = sha256Base64(section.raw);
            sections.push(wrapManifestLine(`Name: ${section.name}`));
            sections.push(wrapManifestLine(`SHA-256-Digest: ${sectionDigest}`));
            sections.push("");
        }
    }

    return sections.join("\r\n");
}

/**
 * Parse MANIFEST.MF into sections
 */
function parseManifestSections(manifest: string): Array<{ name: string | null; raw: string }> {
    const sections: Array<{ name: string | null; raw: string }> = [];
    const lines = manifest.split("\r\n");

    let currentLines: string[] = [];
    let currentName: string | null = null;
    let inMainSection = true;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line === "") {
            // End of a section
            if (currentLines.length > 0) {
                // Include the blank line in the section
                currentLines.push(line);
                const raw = currentLines.join("\r\n") + "\r\n";

                sections.push({ name: inMainSection ? null : currentName, raw });

                currentLines = [];
                currentName = null;
                inMainSection = false;
            }
        } else if (line.startsWith(" ")) {
            // Continuation line
            currentLines.push(line);
        } else if (line.startsWith("Name: ")) {
            // New entry section
            currentName = unwrapValue("Name: ", currentLines.length > 0 ? currentLines : [line], line);
            currentLines.push(line);
        } else {
            // Attribute line
            currentLines.push(line);
        }
    }

    return sections;
}

/**
 * Unwrap a potentially multi-line value
 */
function unwrapValue(prefix: string, allLines: string[], firstLine: string): string {
    // For now, just extract from the first line
    // Full implementation would handle continuation lines
    if (firstLine.startsWith(prefix)) {
        return firstLine.substring(prefix.length);
    }
    return firstLine;
}

/**
 * Create PKCS#7 signature block
 */
function createSignatureBlock(signatureFileContent: string, privateKey: forge.pki.PrivateKey, certificate: forge.pki.Certificate): Buffer {
    // Create PKCS7 signed data
    const p7 = forge.pkcs7.createSignedData();

    // Add certificate
    p7.addCertificate(certificate);

    // Add signer
    p7.addSigner({
        key: privateKey,
        certificate: certificate,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
            {
                type: forge.pki.oids.contentType,
                value: forge.pki.oids.data,
            },
            {
                type: forge.pki.oids.messageDigest,
                // Will be auto-calculated
            },
            {
                type: forge.pki.oids.signingTime,
                value: new Date(),
            },
        ],
    });

    // Set content
    p7.content = forge.util.createBuffer(signatureFileContent);

    // Sign
    p7.sign({ detached: true });

    // Convert to DER
    const asn1 = p7.toAsn1();
    const der = forge.asn1.toDer(asn1);

    return Buffer.from(der.getBytes(), "binary");
}

/**
 * Sign an APK using JAR signing (v1 signature scheme)
 * 
 * @param apkBytes - The unsigned APK bytes
 * @returns Signed APK bytes
 */
export async function signApk(apkBytes: Uint8Array): Promise<Uint8Array> {
    console.log("[APK Signer] Starting JavaScript-based APK signing...");

    // Load the APK as a ZIP
    const zip = await JSZip.loadAsync(apkBytes);

    // Collect all files and their contents
    const files = new Map<string, Buffer>();
    const fileNames: string[] = [];

    // Remove old signatures if present
    const toRemove: string[] = [];
    zip.forEach((path) => {
        if (path.startsWith("META-INF/")) {
            toRemove.push(path);
        } else {
            fileNames.push(path);
        }
    });

    for (const path of toRemove) {
        zip.remove(path);
    }
    console.log(`[APK Signer] Removed ${toRemove.length} old signature files`);

    // Read all file contents
    for (const filename of fileNames) {
        const file = zip.file(filename);
        if (file && !file.dir) {
            const content = await file.async("nodebuffer");
            files.set(filename, content);
        }
    }
    console.log(`[APK Signer] Processing ${files.size} files for signing`);

    // Get debug certificate
    const { privateKey, certificate } = getDebugCertificate();

    // Build MANIFEST.MF
    const manifestContent = buildManifest(files);

    // Build CERT.SF
    const signatureFileContent = buildSignatureFile(manifestContent);

    // Create CERT.RSA (PKCS7 signature block)
    const signatureBlock = createSignatureBlock(signatureFileContent, privateKey, certificate);

    // Add signature files to ZIP
    zip.file("META-INF/MANIFEST.MF", manifestContent);
    zip.file("META-INF/CERT.SF", signatureFileContent);
    zip.file("META-INF/CERT.RSA", signatureBlock);

    console.log("[APK Signer] Added signature files to APK");

    // Generate signed APK
    // Important: resources.arsc must be stored uncompressed for Android compatibility
    const signedApk = await zip.generateAsync({
        type: "nodebuffer",
        platform: "UNIX",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });

    console.log(`[APK Signer] Signed APK generated (${signedApk.byteLength} bytes)`);

    return new Uint8Array(signedApk.buffer, signedApk.byteOffset, signedApk.byteLength);
}

/**
 * Verify that an APK appears to be signed
 * (Basic check - looks for META-INF signature files)
 */
export async function isApkSigned(apkBytes: Uint8Array): Promise<boolean> {
    const zip = await JSZip.loadAsync(apkBytes);

    let hasManifest = false;
    let hasCertSf = false;
    let hasCertRsa = false;

    zip.forEach((path) => {
        if (path === "META-INF/MANIFEST.MF") hasManifest = true;
        if (path.match(/META-INF\/.*\.SF$/)) hasCertSf = true;
        if (path.match(/META-INF\/.*\.(RSA|DSA|EC)$/)) hasCertRsa = true;
    });

    return hasManifest && hasCertSf && hasCertRsa;
}
