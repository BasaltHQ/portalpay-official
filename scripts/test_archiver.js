const archiver = require('archiver');
const JSZip = require('jszip');
const fs = require('fs');

async function testArchiver() {
    console.log("Testing archiver 'store' option...");

    const archive = archiver('zip', { zlib: { level: 6 } });
    const buffers = [];

    archive.on('data', (data) => buffers.push(data));

    const finishPromise = new Promise((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
    });

    // Add a file with store: true (should be uncompressed)
    const testContent = Buffer.alloc(1000, 'A');
    archive.append(testContent, { name: 'test_stored.bin', store: true });

    // Add a file with store: false (should be compressed)
    archive.append(testContent, { name: 'test_deflated.bin', store: false });

    await archive.finalize();
    await finishPromise;

    const zipBuffer = Buffer.concat(buffers);
    console.log(`Generated zip: ${zipBuffer.length} bytes`);

    // Verify with JSZip
    const zip = await JSZip.loadAsync(zipBuffer);

    for (const filename of Object.keys(zip.files)) {
        const file = zip.files[filename];
        // JSZip doesn't expose compression method directly, but we can check sizes
        const compressed = file._data.compressedSize;
        const uncompressed = file._data.uncompressedSize;
        const method = compressed === uncompressed ? 'STORED' : 'DEFLATED';
        console.log(`  ${filename}: ${method} (${compressed}/${uncompressed} bytes)`);
    }
}

testArchiver().catch(console.error);
