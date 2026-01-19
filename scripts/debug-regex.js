
const contentVariants = [
    // Variant 1: Standard PortalPay APK
    `<html>...<script>
    var qp = new URLSearchParams(window.location.search);
    var src = qp.get("src") || "https://pay.ledger1.ai";
    // ...
    </script></html>`,

    // Variant 2: Paynex (Legacy)
    `<html>...<script>
    var qp = new URLSearchParams(window.location.search);
    var src = qp.get("src") || "https://paynex.azurewebsites.net";
    </script></html>`,

    // Variant 3: BasaltSurge (Current Default?)
    `<html>...<script>
    var qp = new URLSearchParams(window.location.search);
    var src = qp.get("src") || "https://basaltsurge.azurewebsites.net";
    </script></html>`,

    // Variant 4: TARGET_URL variable (Smali style but in HTML?)
    `<html><script>var TARGET_URL = "https://basaltsurge.azurewebsites.net";</script></html>`
];

const targetEndpoint = "https://xoinpay.azurewebsites.net/touchpoint?scale=0.75";
const brandKey = "xoinpay-touchpoint";

function testReplacements() {
    console.log("Testing Replacements...");

    contentVariants.forEach((content, i) => {
        console.log(`\n--- Variant ${i + 1} ---`);
        let modified = content;

        // Logic from route.ts
        const isTouchpoint = true; // Simulating touchpoint
        const injectionScript = `// INJECTED SCRIPT placeholders...`;

        if (isTouchpoint) {
            // Pattern 1: Standard qp/src block
            const targetBlockRegex = /var\s+qp\s*=\s*new\s*URLSearchParams\(window\.location\.search\);\s*var\s+src\s*=\s*qp\.get\s*\(\s*["']src["']\s*\)\s*\|\|\s*["'][^"']+["'];/;

            if (targetBlockRegex.test(content)) {
                console.log("MATCHED: targetBlockRegex");
                modified = content.replace(targetBlockRegex, injectionScript);
            } else {
                console.log("FAILED: targetBlockRegex");

                // Pattern 2: TARGET_URL
                if (/var\s+TARGET_URL\s*=\s*"[^"]*"/.test(modified)) {
                    console.log("MATCHED: TARGET_URL");
                    modified = modified.replace(/var\s+TARGET_URL\s*=\s*"[^"]*"/, `var TARGET_URL = "${targetEndpoint}"`);
                }

                // Pattern 3: Catch-all
                if (modified.includes("azurewebsites.net")) {
                    const before = modified;
                    modified = modified.replace(/https:\/\/[a-z0-9-]+\.azurewebsites\.net/g, targetEndpoint);
                    if (modified !== before) console.log("MATCHED: Catch-all regex");
                }

                // Check Split Logic (Fallback in route.ts)
                if (!modified.includes(targetEndpoint)) {
                    const paynexUrlForRegex = "https://paynex.azurewebsites.net";
                    if (modified.includes(paynexUrlForRegex)) {
                        console.log("MATCHED: Split/Join Paynex");
                        modified = modified.split(paynexUrlForRegex).join(targetEndpoint);
                    }
                }
            }
        }

        const success = modified.includes(injectionScript) || modified.includes(targetEndpoint);
        console.log("Result contains target?", success);

        if (!success) {
            console.log("CRITICAL FAILURE: Did not inject endpoint!");
            console.log("Original:", content);
            console.log("Modified:", modified);
        }
    });
}

testReplacements();
