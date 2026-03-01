import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import postcss from 'postcss';
import cascadeLayers from '@csstools/postcss-cascade-layers';

const __dirname = path.resolve();

// 1. Run Tailwind V4 CLI to generate a baseline CSS file with layers
const inputCss = path.join(__dirname, 'src/app/globals.css');
const tempCss = path.join(__dirname, 'temp-legacy.css');
const outputCss = path.join(__dirname, 'public/css/legacy.css');

console.log(`Compiling baseline Tailwind CSS from ${inputCss}...`);
try {
    // Use tailwindcss CLI directly
    execSync(`npx @tailwindcss/cli -i "${inputCss}" -o "${tempCss}"`, { stdio: 'inherit' });
} catch (error) {
    console.error("Failed to compile Tailwind CSS:", error.message);
    process.exit(1);
}

// 2. Read the compiled CSS
const compiledCss = fs.readFileSync(tempCss, 'utf-8');

// 3. Process with PostCSS to flatten cascade layers
console.log('Flattening @layer rules for legacy (Chrome 70) compatibility...');
postcss([cascadeLayers()])
    .process(compiledCss, { from: tempCss, to: outputCss })
    .then(result => {
        fs.writeFileSync(outputCss, result.css);
        // Cleanup temp file
        fs.unlinkSync(tempCss);
        console.log(`✅ Successfully generated flattened legacy CSS at ${outputCss}`);
    })
    .catch(error => {
        console.error("PostCSS processing failed:", error);
        process.exit(1);
    });
