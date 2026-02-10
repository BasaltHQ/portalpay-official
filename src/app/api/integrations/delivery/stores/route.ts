
import { NextResponse } from "next/server";
import { listStores } from "@/lib/uber-eats";

export const dynamic = "force-dynamic";

/**
 * GET: List all stores available in the current Uber Eats environment (sandbox/production)
 * Use this to discover sandbox store IDs
 */
export async function GET() {
    try {
        const stores = await listStores();

        if (stores === null) {
            return NextResponse.json({
                error: "Failed to list stores - check credentials and environment"
            }, { status: 500 });
        }

        console.log("[Uber Stores] Found stores:", JSON.stringify(stores, null, 2));

        return NextResponse.json({
            stores,
            count: Array.isArray(stores) ? stores.length : 0
        });
    } catch (err: any) {
        console.error("[Uber Stores] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
