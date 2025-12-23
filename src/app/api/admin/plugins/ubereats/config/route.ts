
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos"; // Assuming existing Cosmos helper
import { requireThirdwebAuth } from "@/lib/auth"; // Auth helper
import { encrypt, decrypt } from "@/lib/crypto"; // Helper for sensitive data

export const dynamic = "force-dynamic";

/**
 * Uber Eats Platform Config
 * Stored under `ubereats_platform_config:portalpay`
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Auth Check (Admin Only)
        const auth = await requireThirdwebAuth(req);
        if (!auth.roles.includes("admin")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Read Config
        const container = await getContainer();
        const { resource } = await container.item("ubereats_platform_config:portalpay", "portalpay").read();

        console.log("[Uber Config GET] Document read:", {
            found: !!resource,
            hasWebhookClientId: !!resource?.webhookClientId,
            hasWebhookClientSecret: !!resource?.webhookClientSecret,
            hasClientId: !!resource?.clientId
        });

        if (!resource) {
            return NextResponse.json({ config: null });
        }

        // 3. Return (Decrypted for viewing in Admin Panel)
        let decrypted: any = { ...resource };
        try {
            if (resource.clientId) decrypted.clientId = await decrypt(resource.clientId);
            if (resource.clientSecret) decrypted.clientSecret = await decrypt(resource.clientSecret);
            if (resource.webhookSecret) decrypted.webhookSecret = await decrypt(resource.webhookSecret);

            // Decrypt Incoming Webhook Client ID for display
            if (resource.webhookClientId) decrypted.webhookClientId = await decrypt(resource.webhookClientId);

            // SECURITY: Do NOT return the decrypted webhookClientSecret.
            // It should only be shown once upon generation.
            delete decrypted.webhookClientSecret;

            // Return 'true' or similar if it exists, so UI can show "Configured" state
            if (resource.webhookClientSecret) decrypted.hasWebhookClientSecret = true;

            console.log("[Uber Config GET] Decrypted:", {
                webhookClientIdPrefix: decrypted.webhookClientId?.slice(0, 10) || "none",
                hasWebhookClientSecret: decrypted.hasWebhookClientSecret
            });

        } catch (e) {
            console.error("[Uber Config GET] Decryption failed", e);
        }

        return NextResponse.json({ config: decrypted });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const auth = await requireThirdwebAuth(req);
        if (!auth.roles.includes("admin")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { clientId, clientSecret, webhookSecret, environment } = await req.json();

        console.log("Saving Uber Config:", {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            clientIdLength: clientId?.length,
            environment
        });

        // 2. Encrypt Sensitive Data
        const encryptedClientId = await encrypt(clientId);
        const encryptedClientSecret = await encrypt(clientSecret);
        const encryptedWebhookSecret = await encrypt(webhookSecret);

        // 3. Save to Cosmos (Merge)
        const container = await getContainer();
        const { resource: existing } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id AND c.wallet = @wallet",
            parameters: [
                { name: "@id", value: "ubereats_platform_config:portalpay" },
                { name: "@wallet", value: "portalpay" }
            ]
        }).fetchAll().then(r => r.resources[0]);

        const doc = {
            ...(existing || {}), // Merge with existing fields (like webhookClientId)
            id: "ubereats_platform_config:portalpay",
            partitionKey: "portalpay", // Legacy field
            wallet: "portalpay", // CRITICAL: Container Partition Key
            clientId: encryptedClientId,
            clientSecret: encryptedClientSecret,
            webhookSecret: encryptedWebhookSecret,
            environment: environment || "production", // Persist environment
            updatedAt: Date.now(),
            updatedBy: auth.wallet
        };

        await container.items.upsert(doc);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
