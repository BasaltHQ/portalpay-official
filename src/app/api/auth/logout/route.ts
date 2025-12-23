import { NextRequest, NextResponse } from "next/server";
import { AUTH } from "@/lib/auth";

/**
 * Derive cookie domain from the actual request host.
 * For localhost, IP hosts, or Azure subdomains, returns undefined.
 * 
 * IMPORTANT: This uses the actual request host, not NEXT_PUBLIC_APP_URL, because:
 * - Partner containers may not have NEXT_PUBLIC_APP_URL set to their own domain
 * - Cookies must be cleared from the domain the user is actually visiting
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
  } catch {}
  return undefined;
}

export async function POST(req: NextRequest) {
	const res = NextResponse.json({ 
		ok: true,
		// Instruct client to clear merchant theme state
		clearThemeState: true 
	});
	const cookieDomain = getCookieDomainFromRequest(req);
	const opts = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict" as const,
		path: "/",
		domain: cookieDomain,
		maxAge: 0,
		expires: new Date(0),
	};
	// Clear auth token and secondary wallet cookie with proper domain
	res.cookies.set(AUTH.COOKIE, "", opts);
	res.cookies.set("cb_wallet", "", opts);
	return res;
}
