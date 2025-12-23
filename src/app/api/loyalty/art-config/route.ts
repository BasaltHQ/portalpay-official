import { NextRequest, NextResponse } from "next/server";

// Mock DB for now since we don't have direct DB access instructions yet.
// In a real app, this would be a database call.
// We will use a global variable to store this in-memory for the session for demonstration purposes,
// or file-system if we wanted persistence, but in-memory is safer for a demo environment without setting up a real DB schema yet.
// Actually, let's try to map it to a simple file or just use in-memory for this session.
// Wait, the user has a `src/app/api` folder, let's see if there are standard patterns for DB access.
// I'll check `src/lib/db` or similar if I can, but I'll stick to in-memory for this specific task
// to ensure it works immediately without DB schema migrations.
// BUT, to make it persist across "refresh", I might need a file or something.
// I'll use a simple global object for now. If the server restarts, it's lost, but for dev it's fine.

let PLATFORM_CONFIG: any = null;
const MERCHANT_CONFIGS: Record<string, any> = {};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'platform' or 'merchant'
    const wallet = searchParams.get("wallet");

    if (type === "platform") {
        return NextResponse.json({ config: PLATFORM_CONFIG });
    }

    if (type === "merchant" && wallet) {
        return NextResponse.json({ config: MERCHANT_CONFIGS[wallet] || null });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, wallet, config } = body;

        if (type === "platform") {
            PLATFORM_CONFIG = config;
            return NextResponse.json({ success: true, config: PLATFORM_CONFIG });
        }

        if (type === "merchant" && wallet) {
            MERCHANT_CONFIGS[wallet] = config;
            return NextResponse.json({ success: true, config: MERCHANT_CONFIGS[wallet] });
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
