const fs = require('fs');
const path = require('path');

// Regex to approximate all .query( { query: "..." } ) or .query("...")
function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = walk(path.join(__dirname, '../'));
const queries = new Set();

for (const f of files) {
    if (f.includes('node_modules') || f.includes('.next')) continue;
    const content = fs.readFileSync(f, 'utf8');

    // Match queries passed as single string arguments starting with SELECT
    const stringMatches = content.matchAll(/\.query\(\s*(["'`])(SELECT[\s\S]*?)\1\s*(,|\))/gi);
    for (const m of stringMatches) {
        queries.add(m[2]);
    }

    // Match queries passed in object form
    const objMatches = content.matchAll(/query:\s*(["'`])(SELECT[\s\S]*?)\1/gi);
    for (const m of objMatches) {
        queries.add(m[2]);
    }
}

console.log(`Found ${queries.size} unique SELECT queries.\n`);
let compiled = `
const { parseCosmosSql } = require('./lib/db/sql-parser.ts_mock');
let fails = 0;
const queries = ${JSON.stringify(Array.from(queries), null, 2)};

for (let q of queries) {
    const originalWarn = console.warn;
    let fallback = false;
    console.warn = () => { fallback = true; };
    try {
        parseCosmosSql(q, [{name: "@mock", value: "x"}]);
        if (fallback) console.log("FALLBACK: " + q + "\\n");
    } catch (e) {
        console.log("ERROR: " + q + "\\nDetails: " + e.message + "\\n");
    }
    console.warn = originalWarn;
}
`;
fs.writeFileSync(path.join(__dirname, 'test-runner.js'), compiled);
fs.writeFileSync(path.join(__dirname, 'lib/db/sql-parser.ts_mock.js'), fs.readFileSync(path.join(__dirname, '../lib/db/sql-parser.ts'), 'utf8')
    .replace(/export function parseCosmosSql/g, 'function parseCosmosSql')
    .replace(/import .* from .*;/g, '')
    .replace(/export interface .*?\{[^]*?\}/g, '')
    .replace(/export type .*?;/g, '')
    + '\nmodule.exports = { parseCosmosSql };');

console.log('Run `node src/scripts/test-runner.js` to see results.');
