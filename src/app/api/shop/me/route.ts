
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireThirdwebAuth(req);
        const wallet = auth.wallet;

        const container = await getContainer();
        const { resources: shops } = await container.items
            .query({
                query: "SELECT c.slug FROM c WHERE c.wallet = @wallet AND c.slug != null",
                parameters: [{ name: "@wallet", value: wallet }]
            })
            .fetchAll();

        const slug = shops[0]?.slug;

        if (!slug) {
            return NextResponse.json({ error: "No shop found for this wallet" }, { status: 404 });
        }

        return NextResponse.json({ slug });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
