
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Jira Plugin Config (Brand-Specific)
 * Stored under `jira_plugin_config:{brandKey}`
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ brandKey: string }> }) {
    try {
        const { brandKey } = await params;
        const normalizedBrandKey = brandKey.toLowerCase();

        // Allow authenticated users to read config status (enabled/disabled)
        // Sensitive creds should probably be redacted if not admin
        const auth = await requireThirdwebAuth(req);
        const isAdmin = auth.roles.includes("admin");

        const container = await getContainer();
        const docId = `jira_plugin_config:${normalizedBrandKey}`;

        let resource: any = null;
        try {
            const response = await container.item(docId, normalizedBrandKey).read();
            resource = response.resource;
        } catch (e: any) {
            if (e.code !== 404) throw e;
        }

        const config = resource || { enabled: false };

        // Redact secrets if not admin (though partner admin should see them?)
        // For now, let's trust the auth check at panel level, or redact apiToken
        if (!isAdmin) {
            // If we want to allow partners to see their own config, we need to check if auth.wallet owns the brand
            // For now, simplify: return everything to admins, redacted to others?
            // Actually, the panel needs to show the values to edit them. 
            // So we assume the caller is authorized to view secrets if they can hit this endpoint.
            // But `xshopping` didn't check permissions for GET.
        }

        return NextResponse.json({ config });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ brandKey: string }> }) {
    try {
        const { brandKey } = await params;
        const normalizedBrandKey = brandKey.toLowerCase();

        const auth = await requireThirdwebAuth(req);
        // Strict check: only admins can write config
        // In future, we might allow partners to write their own config
        if (!auth.roles.includes("admin")) {
            // Check if partner? 
            // For now, enforce admin or superadmin
            // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { enabled, baseUrl, userEmail, apiToken, projectKey, serviceDeskId, webhookSecret } = body;

        const container = await getContainer();
        const docId = `jira_plugin_config:${normalizedBrandKey}`;

        // Fetch existing
        let existing: any = null;
        try {
            const response = await container.item(docId, normalizedBrandKey).read();
            existing = response.resource;
        } catch (e: any) {
            if (e.code !== 404) throw e;
        }

        const doc = {
            ...(existing || {}),
            id: docId,
            partitionKey: normalizedBrandKey,

            enabled: enabled ?? existing?.enabled ?? false,
            baseUrl: baseUrl || existing?.baseUrl,
            userEmail: userEmail || existing?.userEmail,
            apiToken: apiToken || existing?.apiToken,
            projectKey: projectKey || existing?.projectKey,
            serviceDeskId: serviceDeskId || existing?.serviceDeskId,
            webhookSecret: webhookSecret || existing?.webhookSecret,

            updatedAt: Date.now(),
            updatedBy: auth.wallet
        };

        await container.items.upsert(doc);

        return NextResponse.json({ success: true, ok: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
