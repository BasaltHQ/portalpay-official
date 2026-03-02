import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { transform, Features } from 'lightningcss';

const __dirname = path.resolve();

// ── CONFIG ──────────────────────────────────────────────────────────
const inputCss = path.join(__dirname, 'src/app/globals.css');
const tempCss = path.join(__dirname, 'temp-legacy.css');
const outputCss = path.join(__dirname, 'public/css/legacy.css');

// ── STEP 1: Compile via Tailwind v4 CLI ─────────────────────────────
console.log(`[1/4] Compiling baseline Tailwind CSS...`);
try {
    execSync(`npx @tailwindcss/cli -i "${inputCss}" -o "${tempCss}"`, { stdio: 'inherit' });
} catch (error) {
    console.error("Failed to compile Tailwind CSS:", error.message);
    process.exit(1);
}

let css = fs.readFileSync(tempCss, 'utf-8');

// ── STEP 2: LightningCSS — oklch→hex, vendor prefixes, logical props ─
console.log('[2/4] Running LightningCSS (color conversion + downleveling)...');

const lightningResult = transform({
    filename: tempCss,
    code: Buffer.from(css),
    minify: false,
    targets: { chrome: (93 << 16) },
    include:
        Features.Nesting |
        Features.IsSelector |
        Features.OklabColors |
        Features.LabColors |
        Features.P3Colors |
        Features.ColorFunction |
        Features.HexAlphaColors |
        Features.LogicalProperties |
        Features.MediaRangeSyntax |
        Features.Colors |
        Features.Selectors |
        Features.VendorPrefixes |
        Features.DoublePositionGradients |
        Features.LightDark
});

css = lightningResult.code.toString();

// ── STEP 3: Regex-based structural transforms ───────────────────────
// PostCSS cannot parse the LightningCSS output, so we use careful
// regex transforms instead. These are safe because the minified
// CSS has predictable structure.
console.log('[3/4] Applying Chrome 70 compatibility transforms...');

// 3a. Strip ALL @layer directives and blocks
// @layer name { ...contents... }  →  ...contents...
// We need to handle nested braces within @layer blocks
function stripLayers(input) {
    let result = '';
    let i = 0;
    while (i < input.length) {
        // Look for @layer
        const layerIdx = input.indexOf('@layer', i);
        if (layerIdx === -1) {
            result += input.slice(i);
            break;
        }
        // Add everything before @layer
        result += input.slice(i, layerIdx);
        // Find the opening brace
        let braceStart = input.indexOf('{', layerIdx);
        let semicolonPos = input.indexOf(';', layerIdx);

        // If semicolon comes before brace, it's a bare @layer statement like @layer theme;
        if (semicolonPos !== -1 && (braceStart === -1 || semicolonPos < braceStart)) {
            i = semicolonPos + 1;
            continue;
        }

        if (braceStart === -1) {
            i = layerIdx + 6;
            continue;
        }
        // Find matching closing brace
        let depth = 1;
        let j = braceStart + 1;
        while (j < input.length && depth > 0) {
            if (input[j] === '{') depth++;
            if (input[j] === '}') depth--;
            j++;
        }
        // Extract contents (without outer braces)
        result += input.slice(braceStart + 1, j - 1);
        i = j;
    }
    return result;
}
css = stripLayers(css);

// 3a-2. Strip @property blocks (Chrome 85+)
// These define custom property types — Chrome 70 will choke on @property syntax.
function stripAtProperty(input) {
    let result = '';
    let i = 0;
    while (i < input.length) {
        const propIdx = input.indexOf('@property', i);
        if (propIdx === -1) {
            result += input.slice(i);
            break;
        }
        result += input.slice(i, propIdx);
        const braceStart = input.indexOf('{', propIdx);
        if (braceStart === -1) {
            i = propIdx + 9;
            continue;
        }
        let depth = 1;
        let j = braceStart + 1;
        while (j < input.length && depth > 0) {
            if (input[j] === '{') depth++;
            if (input[j] === '}') depth--;
            j++;
        }
        i = j;
    }
    return result;
}
css = stripAtProperty(css);

// 3b. Remove @supports blocks that test for features Chrome 70 doesn't have
function stripSupports(input) {
    let result = '';
    let i = 0;
    while (i < input.length) {
        const supIdx = input.indexOf('@supports', i);
        if (supIdx === -1) {
            result += input.slice(i);
            break;
        }

        // Check if this @supports tests for color-mix, lab, or contain-intrinsic
        const parenStart = input.indexOf('(', supIdx);
        const braceStart = input.indexOf('{', supIdx);
        if (parenStart === -1 || braceStart === -1) {
            result += input.slice(i, supIdx + 9);
            i = supIdx + 9;
            continue;
        }

        const condition = input.slice(parenStart, braceStart).toLowerCase();
        const shouldRemove = condition.includes('color-mix') ||
            condition.includes('color:lab(') ||
            condition.includes('color: lab(') ||
            condition.includes('contain-intrinsic') ||
            condition.includes('-apple-pay-button');

        if (!shouldRemove) {
            result += input.slice(i, braceStart + 1);
            i = braceStart + 1;
            continue;
        }

        // Add everything before @supports
        result += input.slice(i, supIdx);

        // Find matching closing brace and skip entire block
        let depth = 1;
        let j = braceStart + 1;
        while (j < input.length && depth > 0) {
            if (input[j] === '{') depth++;
            if (input[j] === '}') depth--;
            j++;
        }
        i = j;
    }
    return result;
}
css = stripSupports(css);

// 3c. Remove lab() declarations — these are fallbacks that Chrome 70 doesn't understand
// Match property declarations ending with lab(...) 
css = css.replace(/[\w-]+\s*:\s*lab\([^)]*\)\s*;?/g, '');

// 3d. Replace :where(...) with inner selectors
// :where() has zero specificity (Chrome 88+). Safe to replace with inner content.
css = css.replace(/:where\(([^)]+)\)/g, '$1');

// 3e. Replace remaining :is() with :-webkit-any() for Chrome 70
css = css.replace(/:is\(/g, ':-webkit-any(');

// 3f. Convert individual transform properties to transform shorthand
// translate: Xval Yval  →  transform: translate(Xval, Yval)
css = css.replace(/([\{;])\s*translate\s*:\s*([^;{}]+)\s*;/g, (match, prefix, value) => {
    const v = value.trim();
    if (v === 'none') return `${prefix}transform:none;`;
    const parts = v.split(/\s+/);
    if (parts.length >= 2) return `${prefix}transform:translate(${parts[0]},${parts[1]});`;
    return `${prefix}transform:translate(${parts[0]},0);`;
});

// scale: Xval Yval  →  transform: scale(Xval, Yval)
css = css.replace(/([\{;])\s*scale\s*:\s*([^;{}]+)\s*;/g, (match, prefix, value) => {
    const v = value.trim();
    const parts = v.split(/\s+/);
    if (parts.length >= 2) return `${prefix}transform:scale(${parts[0]},${parts[1]});`;
    return `${prefix}transform:scale(${parts[0]});`;
});

// rotate: Xdeg  →  transform: rotate(Xdeg)
css = css.replace(/([\{;])\s*rotate\s*:\s*([^;{}]+)\s*;/g, (match, prefix, value) => {
    const v = value.trim();
    if (v === 'none') return `${prefix}transform:none;`;
    return `${prefix}transform:rotate(${v});`;
});

// 3g. Convert remaining logical properties to physical
// IMPORTANT: Only match inside CSS declarations (preceded by { ; or newline),
// NOT inside CSS class names like .some-margin-inline-class

// Longhand logical → physical (only in property position)
const logicalReplacements = [
    [/([{;\n]\s*)margin-inline-start/g,  '$1margin-left'],
    [/([{;\n]\s*)margin-inline-end/g,    '$1margin-right'],
    [/([{;\n]\s*)margin-block-start/g,   '$1margin-top'],
    [/([{;\n]\s*)margin-block-end/g,     '$1margin-bottom'],
    [/([{;\n]\s*)padding-inline-start/g, '$1padding-left'],
    [/([{;\n]\s*)padding-inline-end/g,   '$1padding-right'],
    [/([{;\n]\s*)padding-block-start/g,  '$1padding-top'],
    [/([{;\n]\s*)padding-block-end/g,    '$1padding-bottom'],
    [/([{;\n]\s*)border-inline-start-width/g,  '$1border-left-width'],
    [/([{;\n]\s*)border-inline-end-width/g,    '$1border-right-width'],
    [/([{;\n]\s*)border-block-start-width/g,   '$1border-top-width'],
    [/([{;\n]\s*)border-block-end-width/g,     '$1border-bottom-width'],
    [/([{;\n]\s*)border-inline-start-style/g,  '$1border-left-style'],
    [/([{;\n]\s*)border-inline-end-style/g,    '$1border-right-style'],
    [/([{;\n]\s*)border-block-start-style/g,   '$1border-top-style'],
    [/([{;\n]\s*)border-block-end-style/g,     '$1border-bottom-style'],
    [/([{;\n]\s*)border-inline-start-color/g,  '$1border-left-color'],
    [/([{;\n]\s*)border-inline-end-color/g,    '$1border-right-color'],
    [/([{;\n]\s*)border-block-start-color/g,   '$1border-top-color'],
    [/([{;\n]\s*)border-block-end-color/g,     '$1border-bottom-color'],
];
for (const [pattern, replacement] of logicalReplacements) {
    css = css.replace(pattern, replacement);
}

// Shorthand logical properties: expand to physical pairs
// ONLY match when preceded by { ; or newline (property context, not class names)
function expandShorthandLogical(input, logicalProp, physical1, physical2) {
    // Match: (prefix)(logicalProp) : (value) ;
    // prefix must be { or ; or newline+whitespace
    const re = new RegExp(`([{;\\n]\\s*)${logicalProp}\\s*:\\s*([^;{}]+)\\s*;`, 'g');
    return input.replace(re, (match, prefix, value) => {
        const parts = value.trim().split(/\s+/);
        return `${prefix}${physical1}:${parts[0]};${physical2}:${parts[1] || parts[0]};`;
    });
}

css = expandShorthandLogical(css, 'margin-inline', 'margin-left', 'margin-right');
css = expandShorthandLogical(css, 'margin-block', 'margin-top', 'margin-bottom');
css = expandShorthandLogical(css, 'padding-inline', 'padding-left', 'padding-right');
css = expandShorthandLogical(css, 'padding-block', 'padding-top', 'padding-bottom');
css = expandShorthandLogical(css, 'inset-inline', 'left', 'right');
css = expandShorthandLogical(css, 'inset-block', 'top', 'bottom');
css = expandShorthandLogical(css, 'border-inline-style', 'border-left-style', 'border-right-style');
css = expandShorthandLogical(css, 'border-block-style', 'border-top-style', 'border-bottom-style');

// inset: V  →  top:V;right:V;bottom:V;left:V
css = css.replace(/([\{;])\s*inset\s*:\s*([^;{}]+)\s*;/g, (match, prefix, value) => {
    const parts = value.trim().split(/\s+/);
    const t = parts[0], r = parts[1] || t, b = parts[2] || t, l = parts[3] || r;
    return `${prefix}top:${t};right:${r};bottom:${b};left:${l};`;
});

// 3h. Remove aspect-ratio (Chrome 88+)
css = css.replace(/[\w-]*aspect-ratio\s*:\s*[^;{}]+\s*;?/g, '');

// 3i. overflow: clip → overflow: hidden
css = css.replace(/overflow(-[xy])?\s*:\s*clip\s*;/g, 'overflow$1:hidden;');

// 3j. Remove text-decoration-thickness (Chrome 89+)
css = css.replace(/text-decoration-thickness\s*:\s*[^;{}]+\s*;?/g, '');

// 3k. Remove contain-intrinsic-size (Chrome 83+)
css = css.replace(/contain-intrinsic-size\s*:\s*[^;{}]+\s*;?/g, '');

// 3l. Remove ::backdrop (Chrome 76+, but we don't need it)
// Actually, ::backdrop is fine in Chrome 70, leave it.

// ── STEP 4: Final LightningCSS pass for minification ────────────────
console.log('[4/4] Final minification...');
try {
    const minified = transform({
        filename: outputCss,
        code: Buffer.from(css),
        minify: true,
        // No targets here — everything is already downleveled
    });
    css = minified.code.toString();
} catch (e) {
    // If minification fails, just use the un-minified version
    console.warn('⚠️  Minification had issues, using un-minified output:', e.message);
}

// Final cleanup: remove any remaining lab() that slipped through
css = css.replace(/[\w-]+\s*:\s*lab\([^)]*\)\s*;?/g, '');

fs.writeFileSync(outputCss, css);
fs.unlinkSync(tempCss);

// ── Verification report ─────────────────────────────────────────────
const checks = {
    'oklch(': (css.match(/oklch\(/g) || []).length,
    'lab(': (css.match(/\blab\(/g) || []).length,
    'color-mix(': (css.match(/color-mix\(/g) || []).length,
    'margin-inline': (css.match(/margin-inline[^-]/g) || []).length,
    'padding-inline': (css.match(/padding-inline[^-]/g) || []).length,
    'margin-block': (css.match(/margin-block[^-]/g) || []).length,
    'padding-block': (css.match(/padding-block[^-]/g) || []).length,
    'inset:': (css.match(/[{;]inset:/g) || []).length,
    ':where(': (css.match(/:where\(/g) || []).length,
    '@supports': (css.match(/@supports/g) || []).length,
    'translate:': (css.match(/[{;]translate:/g) || []).length,
    'scale:': (css.match(/[{;]scale:/g) || []).length,
    'rotate:': (css.match(/[{;]rotate:/g) || []).length,
    'aspect-ratio': (css.match(/aspect-ratio/g) || []).length,
    'inset-inline': (css.match(/inset-inline/g) || []).length,
    'inset-block': (css.match(/inset-block/g) || []).length,
};

console.log('\n═══ Chrome 70 Compatibility Report ═══');
let totalIssues = 0;
for (const [pattern, count] of Object.entries(checks)) {
    const status = count === 0 ? '✅' : '⚠️ ';
    if (count > 0) totalIssues += count;
    console.log(`  ${status} ${pattern}: ${count}`);
}
console.log('═══════════════════════════════════════');

if (totalIssues === 0) {
    console.log('🎉 ZERO incompatible patterns found!');
} else {
    console.log(`⚠️  ${totalIssues} potentially incompatible patterns remain.`);
}
console.log(`\n✅ Legacy CSS generated at ${outputCss}`);
console.log(`   File size: ${(css.length / 1024).toFixed(1)} KB`);
