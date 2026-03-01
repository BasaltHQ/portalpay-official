import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import postcss from 'postcss';
import { transform } from 'lightningcss';

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

// 3. Process with PostCSS to literally UNWRAP layers (no specificity hacks)
console.log('Stripping @layer boundaries for legacy compatibility...');

const unwrapLayersPlugin = () => {
    return {
        postcssPlugin: 'unwrap-layers',
        AtRule: {
            layer: (rule) => {
                // Unpack all child nodes to the parent level
                if (rule.nodes) {
                    rule.replaceWith(rule.nodes);
                } else {
                    rule.remove(); // Remove empty @layer statements
                }
            }
        }
    }
};
unwrapLayersPlugin.postcss = true;

postcss([unwrapLayersPlugin()])
    .process(compiledCss, { from: tempCss, to: outputCss })
    .then(result => {
        // 4. Transform with LightningCSS to downlevel to Chrome 70
        console.log('Transpiling modern CSS features (oklch, nesting) to Chrome 70...');

        const finalCss = transform({
            filename: outputCss,
            code: Buffer.from(result.css),
            minify: true,
            targets: {
                chrome: 70 << 16 // Targets Chrome 70
            }
        });

        fs.writeFileSync(outputCss, finalCss.code);
        // Cleanup temp file
        fs.unlinkSync(tempCss);
        console.log(`✅ Successfully generated pure legacy CSS at ${outputCss}`);
    })
    .catch(error => {
        console.error("PostCSS processing failed:", error);
        process.exit(1);
    });
