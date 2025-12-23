
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getContainer } from "@/lib/cosmos";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({
        status: "active",
        message: "Uber Webhook endpoint is live. Use POST with valid signature."
    }, {
        headers: { "Access-Control-Allow-Origin": "*" }
    });
}

export async function POST(req: NextRequest) {
    try {
        // 1. OAuth Validation (Bearer Token)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new NextResponse("Unauthorized: Missing Bearer Token", { status: 401 });
        }
        const token = authHeader.split(" ")[1];

        const container = await getContainer();

        // Lookup token
        // Optimization: In high throughput, use in-memory cache (Redis/NodeCache). For now, DB lookup.
        try {
            const { resource: tokenDoc } = await container.item(`wh_token:${token}`, "portalpay").read();
            if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
                console.warn("Uber Webhook: Invalid or Expired Token");
                return new NextResponse("Unauthorized: Invalid Token", { status: 401 });
            }
        } catch (e) {
            return new NextResponse("Unauthorized: Token Check Failed", { status: 401 });
        }

        // 2. Validate Signature (Integrity Check)
        const signature = req.headers.get("X-Uber-Signature");
        if (!signature) {
            return new NextResponse("Missing Signature", { status: 401 });
        }

        const bodyText = await req.text(); // Raw body needed for HMAC

        // Fetch Platform Credentials
        const { resource } = await container.item("ubereats_platform_config:portalpay", "portalpay").read();

        if (!resource || !resource.clientSecret) {
            console.error("Uber Webhook: Platform credentials not found");
            return new NextResponse("Configuration Error", { status: 500 });
        }

        // Decrypt Client Secret (Used as Signing Key per Uber Docs)
        const clientSecret = await decrypt(resource.clientSecret);

        // Verify Signature
        // "using the client secret as a key and SHA256 as the hash function"
        const hmac = crypto.createHmac("sha256", clientSecret);
        const digest = hmac.update(bodyText).digest("hex");

        if (signature !== digest) {
            console.warn("Uber Webhook: Invalid Signature", { signature, digest });
            return new NextResponse("Invalid Signature", { status: 401 });
        }

        // 3. Parse & Log Event
        try {
            const body = JSON.parse(bodyText);
            console.log(`[Uber Webhook] Received ${body.event_type}`, body);

            // TODO: Dispatch to appropriate handler based on event_type
            // e.g. 'orders.notification' -> Sync Order
            // e.g. 'store.status.changed' -> Update Store Status

        } catch (e) {
            console.error("Uber Webhook: Failed to parse body", e);
        }

        // 4. Acknowledge Receipt Immediately (200 OK with empty body per Uber docs)
        return new NextResponse(null, {
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*" }
        });

    } catch (err: any) {
        console.error("Uber Webhook Error:", err);
        return new NextResponse(err.message, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Uber-Signature",
        },
    });
}
