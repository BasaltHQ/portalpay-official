import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { chain } from "@/lib/thirdweb/server";

export async function GET(req: NextRequest) {
  try {
    const addr = String(req.nextUrl.searchParams.get("address") || "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(addr)) {
      return NextResponse.json({ error: "invalid_address" }, { status: 400 });
    }
    // Proactive check so we return a clear error instead of crashing
    const hasAdmin = !!(process.env.THIRDWEB_ADMIN_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY);
    if (!hasAdmin) {
      return NextResponse.json({ error: "server_admin_key_missing" }, { status: 500 });
    }
    const auth = getAuth(req);
    const payload = await auth.generatePayload({ 
      address: addr,
      chainId: chain.id,
    });
    return NextResponse.json({ payload });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
