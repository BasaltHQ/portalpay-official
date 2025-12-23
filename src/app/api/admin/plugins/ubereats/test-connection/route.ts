
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Admin Only)
        const auth = await requireThirdwebAuth(req);
        if (!auth.roles.includes("admin")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch Stored Credentials
        const container = await getContainer();

        // Use Query to be robust but specific to the correct partition
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id AND c.wallet = @wallet",
            parameters: [
                { name: "@id", value: "ubereats_platform_config:portalpay" },
                { name: "@wallet", value: "portalpay" }
            ]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        const resource = resources[0];

        if (!resource || !resource.clientId || !resource.clientSecret) {
            console.error("Test Connection - Config Missing:", { found: !!resource, id: "ubereats_platform_config:portalpay" });
            return NextResponse.json({ error: "Credentials not configured" }, { status: 400 });
        }

        // 3. Decrypt
        const clientId = await decrypt(resource.clientId);
        const clientSecret = await decrypt(resource.clientSecret);

        // 4. Attempt Uber OAuth (Client Credentials Flow)
        const tokenParams = new URLSearchParams();
        tokenParams.append("client_id", clientId);
        tokenParams.append("client_secret", clientSecret);
        tokenParams.append("grant_type", "client_credentials");
        tokenParams.append("scope", "eats.store eats.order");

        const isSandbox = resource.environment === 'sandbox';
        const tokenUrl = isSandbox
            ? "https://sandbox-login.uber.com/oauth/v2/token"
            : "https://auth.uber.com/oauth/v2/token";

        console.log(`Test Connection: Attempting Auth against ${tokenUrl} for env: ${resource.environment || 'production'}`);

        const uberRes = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: tokenParams
        });

        const uberData = await uberRes.json();

        if (!uberRes.ok) {
            console.error("Uber Auth Test Failed:", uberData);
            return NextResponse.json({
                success: false,
                message: `Uber Error: ${uberData.error_description || uberData.error || uberRes.statusText} (Env: ${resource.environment})`
            });
        }

        // 5. Success
        return NextResponse.json({
            success: true,
            message: "Successfully authenticated with Uber Eats!"
        });

    } catch (err: any) {
        console.error("Test Connection Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
