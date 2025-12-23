import { NextResponse } from "next/server";
import { listProducts } from "@/lib/azure-management";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await listProducts();
        return NextResponse.json(products);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
