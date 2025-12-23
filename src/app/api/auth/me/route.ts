import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet, requireThirdwebAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Validate auth via cookie/JWT
    const wallet = await getAuthenticatedWallet(req);
    if (!wallet) {
      return NextResponse.json({ authed: false }, { status: 401 });
    }

    // Try to enrich with roles (non-fatal if unavailable)
    let roles: string[] = [];
    try {
      const authz = await requireThirdwebAuth(req);
      if (authz && Array.isArray(authz.roles)) {
        roles = authz.roles;
      }
    } catch {
      // ignore, roles remain []
    }

    return NextResponse.json({ authed: true, wallet, roles });
  } catch (e: any) {
    return NextResponse.json({ authed: false, error: e?.message || "failed" }, { status: 500 });
  }
}
