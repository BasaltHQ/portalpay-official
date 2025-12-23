import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

// Helper for JSON responses
function headerJson(obj: any, init?: { status?: number }) {
    return NextResponse.json(obj, init);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandKey, user, source, subject, message, priority, requestType, attachments } = body;

        if (!brandKey || !user || !subject || !message) {
            return headerJson({ error: "Missing required fields" }, { status: 400 });
        }

        const container = await getContainer(undefined, "support_tickets");
        const ticketId = crypto.randomUUID();
        const now = Date.now();

        const ticket = {
            id: ticketId,
            brandKey,
            user, // Wallet address or email
            wallet: user, // Partition key
            source: source || 'merchant', // 'merchant' | 'partner'
            requestType: requestType || 'general', // 'general' | 'bug' | 'feature' | 'billing' | 'integration' | 'other'
            subject,
            message,
            status: 'open',
            priority: priority || 'medium',
            attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [], // Max 3 images
            createdAt: now,
            updatedAt: now,
            responses: []
        };

        await container.items.create(ticket);

        return headerJson({ ok: true, ticket });
    } catch (e: any) {
        console.error("Create ticket failed", e);
        return headerJson({ error: e.message || "Failed to create ticket" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const brandKey = url.searchParams.get("brandKey");
        const user = url.searchParams.get("user");

        if (!brandKey && !user) {
            return headerJson({ error: "brandKey or user required" }, { status: 400 });
        }

        const container = await getContainer(undefined, "support_tickets");

        let querySpec;
        if (brandKey) {
            querySpec = {
                query: "SELECT * FROM c WHERE c.brandKey = @brandKey ORDER BY c.createdAt DESC",
                parameters: [{ name: "@brandKey", value: brandKey }]
            };
        } else {
            querySpec = {
                query: "SELECT * FROM c WHERE c.user = @user ORDER BY c.createdAt DESC",
                parameters: [{ name: "@user", value: user }]
            };
        }

        const { resources: tickets } = await container.items.query(querySpec).fetchAll();

        return headerJson({ ok: true, tickets });
    } catch (e: any) {
        console.error("List tickets failed", e);
        return headerJson({ error: e.message || "Failed to list tickets" }, { status: 500 });
    }
}
