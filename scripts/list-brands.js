const fs = require('fs');
const path = require('path');

function walk(dir, depth = 0) {
    if (depth > 4) return;
    try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const f of files) {
            const indent = '  '.repeat(depth);
            if (f.isDirectory()) {
                console.log(`${indent}[DIR] ${f.name}`);
                walk(path.join(dir, f.name), depth + 1);
            } else {
                // Only show interesting files (png, xml) to reduce noise
                if (f.name.endsWith('.png') || f.name.endsWith('.xml') || f.name.endsWith('.zip')) {
                    console.log(`${indent}${f.name}`);
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

console.log("Listing public/brands:");
walk('public/brands');
