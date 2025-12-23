import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";
import { getBrandKey } from "@/config/brands";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const wallet = (url.searchParams.get("wallet") || req.headers.get("x-wallet") || "").toLowerCase();

        if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
        }

        const container = await getContainer();
        const brandKey = getBrandKey();
        const id = brandKey ? `${wallet}:user:${String(brandKey).toLowerCase()}` : `${wallet}:user`;

        try {
            const { resource } = await container.item(id, wallet).read();
            return NextResponse.json({ activeRing: resource?.activeRing || null });
        } catch {
            return NextResponse.json({ activeRing: null });
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch active ring" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const authed = await getAuthenticatedWallet(req);
        const wallet = (authed || "").toLowerCase();

        if (!wallet) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const container = await getContainer();
        const brandKey = getBrandKey();
        const id = brandKey ? `${wallet}:user:${String(brandKey).toLowerCase()}` : `${wallet}:user`;

        let doc: any;
        try {
            const { resource } = await container.item(id, wallet).read();
            doc = resource || { id, type: 'user', wallet };
        } catch {
            doc = { id, type: 'user', wallet, firstSeen: Date.now() };
        }

        doc.activeRing = body.activeRing;
        doc.updatedAt = Date.now();

        await container.items.upsert(doc);

        return NextResponse.json({ success: true, activeRing: doc.activeRing });
    } catch (error) {
        console.error("Failed to save active ring", error);
        return NextResponse.json({ error: "Failed to save active ring" }, { status: 500 });
    }
}
