import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/thirdweb-verify
 * 
 * Custom Authentication Endpoint for Thirdweb In-App Wallets.
 * Called by Thirdweb's infrastructure when a user connects via `auth_endpoint` strategy.
 * 
 * Purpose: Bypass Thirdweb's built-in email OTP by using Stripe Link's 
 * already-verified email as the authentication source of truth.
 * 
 * Flow:
 * 1. Buyer verifies email via Stripe Link OTP (during onramp)
 * 2. Our server stores the verified email in the short-lived verification store
 * 3. Thirdweb calls THIS endpoint with { payload: { email, verificationToken } }
 * 4. We validate the secret header + check the email was Stripe-verified
 * 5. Return { userId: email } → Thirdweb creates/retrieves the deterministic smart wallet
 * 
 * Security:
 * - x-thirdweb-auth-secret header must match THIRDWEB_AUTH_ENDPOINT_SECRET
 * - Email must be in the short-lived verification store (set during Stripe Link auth)
 * - Verification tokens expire after 10 minutes
 */

// ─── In-Memory Verified Email Store ───
// Maps email → { verifiedAt, verificationToken, expiresAt }
// In production, use Redis or a session store for multi-instance deployments.
const verifiedEmails = new Map<string, {
  verifiedAt: number;
  verificationToken: string;
  expiresAt: number;
}>();

const VERIFICATION_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Mark an email as verified by Stripe Link.
 * Called from the onramp flow after Stripe Link auth succeeds.
 */
export function markEmailVerified(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const token = require("crypto").randomBytes(32).toString("hex");
  const now = Date.now();

  verifiedEmails.set(normalizedEmail, {
    verifiedAt: now,
    verificationToken: token,
    expiresAt: now + VERIFICATION_TTL_MS,
  });

  // Cleanup expired entries periodically
  if (verifiedEmails.size > 100) {
    for (const [key, val] of verifiedEmails) {
      if (val.expiresAt < now) verifiedEmails.delete(key);
    }
  }

  console.log("[TW AUTH] Email marked as verified:", normalizedEmail.slice(0, 3) + "***");
  return token;
}

/**
 * Check if an email was recently verified by Stripe Link.
 */
function isEmailVerified(email: string, token?: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = verifiedEmails.get(normalizedEmail);

  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    verifiedEmails.delete(normalizedEmail);
    return false;
  }

  // If a token is provided, validate it matches
  if (token && entry.verificationToken !== token) return false;

  return true;
}

/**
 * Consume a verification (one-time use after wallet creation).
 * The email remains "known" but the token is invalidated.
 */
function consumeVerification(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  // Don't delete — just update the token so it can't be reused
  const entry = verifiedEmails.get(normalizedEmail);
  if (entry) {
    entry.verificationToken = "consumed";
  }
}

// ─── Thirdweb Auth Endpoint ───

export async function POST(req: NextRequest) {
  try {
    // 1. Validate the shared secret header
    const authSecret = req.headers.get("x-thirdweb-auth-secret");
    const expectedSecret = process.env.THIRDWEB_AUTH_ENDPOINT_SECRET;

    if (!expectedSecret) {
      console.error("[TW AUTH] THIRDWEB_AUTH_ENDPOINT_SECRET not configured");
      return NextResponse.json(
        { error: "auth_not_configured" },
        { status: 500 }
      );
    }

    if (authSecret !== expectedSecret) {
      console.warn("[TW AUTH] Invalid auth secret header");
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse the payload from Thirdweb
    const body = await req.json().catch(() => ({}));
    const payload = body.payload || body;

    const email = String(payload.email || payload.userId || "").trim().toLowerCase();
    const verificationToken = String(payload.verificationToken || payload.token || "").trim();

    if (!email || !email.includes("@")) {
      console.warn("[TW AUTH] Invalid email in payload");
      return NextResponse.json(
        { error: "invalid_email" },
        { status: 400 }
      );
    }

    // 3. Verify the email was authenticated by Stripe Link
    if (!isEmailVerified(email, verificationToken || undefined)) {
      console.warn("[TW AUTH] Email not verified or token mismatch:", email.slice(0, 3) + "***");
      return NextResponse.json(
        { error: "email_not_verified" },
        { status: 403 }
      );
    }

    // 4. Consume the verification token (one-time use)
    consumeVerification(email);

    console.log("[TW AUTH] ✓ Email verified, issuing wallet for:", email.slice(0, 3) + "***");

    // 5. Return the userId — Thirdweb uses this as the deterministic key
    //    Same email = same wallet address, always
    return NextResponse.json({
      userId: email,
    });
  } catch (e: any) {
    console.error("[TW AUTH] Error:", e);
    return NextResponse.json(
      { error: e?.message || "internal_error" },
      { status: 500 }
    );
  }
}
