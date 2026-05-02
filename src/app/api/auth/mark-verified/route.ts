import { NextRequest, NextResponse } from "next/server";
import { markEmailVerified } from "../thirdweb-verify/route";

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/mark-verified
 * 
 * Called by the onramp flow AFTER Stripe Link has verified the buyer's email.
 * Stores the email in the short-lived verification store so the Thirdweb
 * auth endpoint can issue a wallet without sending another OTP.
 * 
 * Body: { email: string }
 * Returns: { ok, verificationToken }
 * 
 * Security: This is an internal-only endpoint. It does NOT face Thirdweb's
 * infrastructure — it's called by our own client code after Stripe Link auth
 * succeeds. The verificationToken returned must be passed to Thirdweb's
 * connect flow so it reaches our auth endpoint for validation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    const verificationToken = markEmailVerified(email);

    console.log("[MARK VERIFIED] Email marked as Stripe-verified:", email.slice(0, 3) + "***");

    return NextResponse.json({
      ok: true,
      verificationToken,
    });
  } catch (e: any) {
    console.error("[MARK VERIFIED] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "internal_error" },
      { status: 500 }
    );
  }
}
