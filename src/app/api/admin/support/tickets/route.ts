import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

function headerJson(obj: any, init?: { status?: number }) {
    return NextResponse.json(obj, init);
}

export async function GET(req: NextRequest) {
    try {
        // In a real app, verify admin auth here
        const container = await getContainer(undefined, "support_tickets");

        const querySpec = {
            query: "SELECT * FROM c ORDER BY c.createdAt DESC"
        };

        const { resources: tickets } = await container.items.query(querySpec).fetchAll();

        return headerJson({ ok: true, tickets });
    } catch (e: any) {
        console.error("Admin list tickets failed", e);
        return headerJson({ error: e.message || "Failed to list tickets" }, { status: 500 });
    }
}
