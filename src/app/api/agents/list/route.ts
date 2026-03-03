import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

/**
 * List Approved Agents API
 *
 * GET — Returns all approved/registered agents for this brand.
 * Used by ClientRequestsPanel dropdown to select agents when configuring splits.
 *
 * Sources:
 *   1. agent_request docs with status=approved
 *   2. agent_profile docs (informal agents who completed profile)
 */

const hex = (s: any) => typeof s === "string" && /^0x[a-f0-9]{40}$/i.test(s);

export async function GET(req: NextRequest) {
    try {
        const adminWallet = (req.headers.get("x-wallet") || "").toLowerCase();
        if (!adminWallet || !hex(adminWallet)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const brandKey = String(
            process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || ""
        ).toLowerCase();

        const container = await getContainer();

        // Fetch approved agent_requests
        const { resources: approved } = await container.items.query({
            query: `SELECT c.wallet, c.name, c.email, c.phone, c.createdAt FROM c
                    WHERE c.type = 'agent_request'
                      AND c.brandKey = @brandKey
                      AND c.status = 'approved'`,
            parameters: [{ name: "@brandKey", value: brandKey }],
        }).fetchAll();

        // Fetch agent_profiles (informal agents)
        const { resources: profiles } = await container.items.query({
            query: `SELECT c.wallet, c.name, c.email, c.phone, c.createdAt FROM c
                    WHERE c.type = 'agent_profile'
                      AND c.brandKey = @brandKey`,
            parameters: [{ name: "@brandKey", value: brandKey }],
        }).fetchAll();

        // Merge: approved agents take priority, dedupe by wallet
        const agentMap = new Map<string, { wallet: string; name: string; email: string; phone: string }>();

        for (const p of profiles || []) {
            const w = String(p.wallet || "").toLowerCase();
            if (!hex(w)) continue;
            agentMap.set(w, {
                wallet: w,
                name: p.name || "",
                email: p.email || "",
                phone: p.phone || "",
            });
        }

        for (const a of approved || []) {
            const w = String(a.wallet || "").toLowerCase();
            if (!hex(w)) continue;
            agentMap.set(w, {
                wallet: w,
                name: a.name || "",
                email: a.email || "",
                phone: a.phone || "",
            });
        }

        const agents = Array.from(agentMap.values()).sort((a, b) =>
            (a.name || a.wallet).localeCompare(b.name || b.wallet)
        );

        return NextResponse.json({ agents });
    } catch (err: any) {
        console.error("[agents/list] Error:", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
