import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";
import { isPlatformSuperAdmin } from "@/lib/authz";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const wallet = await getAuthenticatedWallet(req);
        if (!wallet || !isPlatformSuperAdmin(wallet)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const c = await getContainer();
        const query = `
            SELECT * FROM c 
            WHERE c.wallet = 'audit' 
            AND c.type = 'audit_log' 
            ORDER BY c.createdAt DESC
        `;
        const { resources } = await c.items.query(query).fetchAll();

        return NextResponse.json({ logs: resources || [] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
