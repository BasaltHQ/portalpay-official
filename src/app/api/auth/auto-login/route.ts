import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/security";
import { createHash, createHmac } from "crypto";

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

// Auth cookie name (must match AUTH.COOKIE in @/lib/auth)
const AUTH_COOKIE = "cb_auth_token";

/**
 * Derive cookie domain from the actual request host.
 * For localhost, IP hosts, or Azure subdomains, returns undefined.
 * 
 * IMPORTANT: This uses the actual request host, not NEXT_PUBLIC_APP_URL, because:
 * - Partner containers may not have NEXT_PUBLIC_APP_URL set to their own domain
 * - Cookies must be set for the domain the user is actually visiting
 */
function getCookieDomainFromRequest(req: NextRequest): string | undefined {
  // In development, always use host-only cookies
  if (process.env.NODE_ENV !== "production") return undefined;

  try {
    const forwarded = req.headers.get("x-forwarded-host");
    const host = forwarded || req.headers.get("host") || "";
    const hostname = host.split(":")[0];

    if (hostname === "localhost" || /^[\d.]+$/.test(hostname)) return undefined;

    // Don't set domain for Azure subdomains
    if (hostname.endsWith('.azurewebsites.net') || hostname.endsWith('.azurefd.net') || hostname.endsWith('.azure.com')) {
      return undefined;
    }

    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const base = parts.slice(-2).join(".");
      return `.${base}`;
    }
  } catch { }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    // CSRF protection - only allow same-origin requests
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const wallet = String(body?.wallet || "").toLowerCase();

    if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: "invalid_address" }, { status: 400 });
    }

    // Generate a simple JWT for embedded wallets (social logins)
    // This bypasses signature verification since OAuth already authenticated the user
    const jwt = generateSimpleJWT(wallet);

    const res = NextResponse.json({ ok: true });
    const cookieDomain = getCookieDomainFromRequest(req);

    // Set auth cookie
    res.cookies.set(AUTH_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Set wallet cookie
    res.cookies.set("cb_wallet", wallet, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

// Generate a simple JWT compatible with the existing auth system
function generateSimpleJWT(address: string): string {
  const secret = process.env.THIRDWEB_ADMIN_PRIVATE_KEY || process.env.JWT_SECRET || "";
  const secretHash = createHash('sha256').update(secret).digest();

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60 * 24); // 24 hours

  // Create payload compatible with getAuthenticatedWallet in auth.ts
  const payload = {
    sub: address,
    address: address,
    iss: "portalpay",
    iat: now,
    exp: exp,
    payload: {
      address: address,
    }
  };

  // Create JWT manually
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', secretHash)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
