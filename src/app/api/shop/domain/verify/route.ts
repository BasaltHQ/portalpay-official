import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf } from "@/lib/security";
import dns from "node:dns/promises";
import { DomainManagerFactory } from "@/lib/hosting";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const caller = await requireThirdwebAuth(req);
        const wallet = caller.wallet;

        // Determine brand context for verification keys
        const brandKey = (process.env.BRAND_KEY || "portalpay").toLowerCase();

        // Use Hosting Manager to get platform-specific verification ID (if any)
        const manager = DomainManagerFactory.getManager();
        const azureVerificationId = await manager.getVerificationId("", brandKey); // Domain optional for ID retrieval in Azure? Logic says retrieved from SITE.
        // Currently getVerificationId implementation in Azure manager just fetches it from the WebApp.

        const expectedRecord = `${brandKey}-verification=${wallet.toLowerCase()}`;

        // Determine hosting context for frontend DNS instructions
        const hasCloudflare = !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
        const hostingProvider = hasCloudflare
            ? "cloudflare"
            : (process.env.HOSTING_PROVIDER || "azure").toLowerCase();
        const cnameTarget = (hostingProvider === "plesk" || hostingProvider === "cloudflare")
            ? (process.env.PLESK_MAIN_DOMAIN || "surge.basalthq.com")
            : (req.headers.get("host") || "surge.basalthq.com");

        return NextResponse.json({
            ok: true,
            expectedTxtRecord: expectedRecord,
            // TXT record must be set on _verify.<domain> to avoid CNAME conflict (RFC 1034)
            txtSubdomain: "_verify",
            azureVerificationId, // Legacy field name, keeping for frontend compatibility
            hostingProvider,
            cnameTarget,
            instructions: `Add a CNAME record for your domain pointing to ${cnameTarget}, and a TXT record on _verify.<your-domain> with the value: ${expectedRecord}`
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "unauthorized" }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await requireThirdwebAuth(req);
        const wallet = caller.wallet;

        // CSRF check
        try { requireCsrf(req); } catch (e: any) {
            return NextResponse.json({ error: e?.message || "bad_origin" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const domain = String(body.domain || "").trim().toLowerCase();

        if (!domain) {
            return NextResponse.json({ error: "Domain is required" }, { status: 400 });
        }

        // 1. Resolve TXT records from _verify.<domain> subdomain
        //    We use a separate subdomain to avoid CNAME+TXT conflict (RFC 1034:
        //    CNAME records shadow all other record types at the same name).
        const txtDomain = `_verify.${domain}`;
        let txtRecords: string[][] = [];
        try {
            txtRecords = await dns.resolveTxt(txtDomain);
        } catch (e: any) {
            // Fallback: also try the bare domain (in case user set TXT there and has no CNAME conflict)
            try {
                txtRecords = await dns.resolveTxt(domain);
            } catch {
                return NextResponse.json({
                    ok: false,
                    verified: false,
                    error: `DNS lookup failed for ${txtDomain}: ${e.message}. Add a TXT record on _verify.${domain} with your verification value.`
                });
            }
        }

        // 2. Check for the verification string (Dynamic Brand Key)
        const brandKey = (process.env.BRAND_KEY || "portalpay").toLowerCase();
        const expectedValue = `${brandKey}-verification=${wallet.toLowerCase()}`;
        const flatRecords = txtRecords.flat();

        // Backwards compatibility: also check 'portalpay-verification' if brand is portalpay
        const isVerified = flatRecords.includes(expectedValue) ||
            (brandKey === "portalpay" && flatRecords.includes(`portalpay-verification=${wallet.toLowerCase()}`));

        if (!isVerified) {
            return NextResponse.json({
                ok: true,
                verified: false,
                message: "Verification record not found",
                foundRecords: flatRecords.filter(r => r.includes("-verification")) // Return similar records
            });
        }

        // 3. Platform Specific Checks (Azure ASUID / Plesk A-Record)
        //    For Cloudflare for SaaS, we skip the CNAME check because Cloudflare handles
        //    domain validation itself. The hostname must be created in Cloudflare BEFORE
        //    the user sets up their CNAME — so requiring a CNAME first is backwards.
        const manager = DomainManagerFactory.getManager();
        const hasCloudflareProvider = !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);

        if (!hasCloudflareProvider) {
            const verificationId = await manager.getVerificationId(domain, brandKey);
            const platformCheck = await manager.verifyDomainOwnership(domain, verificationId, brandKey);
            if (!platformCheck.verified) {
                return NextResponse.json({
                    ok: true,
                    verified: false,
                    message: platformCheck.message || "Platform verification failed",
                    foundRecords: platformCheck.txtRecord ? [] : undefined
                });
            }
        }

        // 4. Uniqueness Check (Cosmos)
        const c = await getContainer();
        const uniquenessQuery = {
            query: "SELECT TOP 1 c.wallet FROM c WHERE c.type='shop_config' AND c.customDomain=@domain AND c.customDomainVerified=true",
            parameters: [{ name: "@domain", value: domain }]
        };
        const { resources: existing } = await c.items.query(uniquenessQuery).fetchAll();
        if (existing.length > 0) {
            const owner = existing[0].wallet;
            if (String(owner).toLowerCase() !== String(wallet).toLowerCase()) {
                return NextResponse.json({
                    ok: false,
                    verified: false,
                    error: "This domain is already verified by another shop."
                });
            }
        }

        // 5. Update Config
        const querySpec = {
            query: "SELECT * FROM c WHERE c.type='shop_config' AND c.wallet=@w",
            parameters: [{ name: "@w", value: wallet }]
        };

        const { resources } = await c.items.query(querySpec).fetchAll();
        const shopConfig = resources[0];

        if (!shopConfig) {
            return NextResponse.json({ error: "Shop config not found" }, { status: 404 });
        }

        shopConfig.customDomain = domain;
        shopConfig.customDomainVerified = true;
        shopConfig.updatedAt = Date.now();

        await c.item(shopConfig.id, wallet).replace(shopConfig);

        // 6. Bind Domain
        const bindResult = await manager.bindDomain(domain);

        return NextResponse.json({
            ok: true,
            verified: true,
            domain,
            azureBinding: bindResult.success ? "success" : "failed", // Legacy field name
            message: bindResult.success
                ? "Domain verified and bound. Ensure your DNS points to this service."
                : `Domain verified. Binding warning: ${bindResult.message}`
        });

    } catch (e: any) {
        console.error("Domain verification error:", e);
        return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
    }
}
