import { NextRequest, NextResponse } from "next/server";

// Hotel settings stored in shop config
export async function GET(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 401 });
    }

    const r = await fetch(`${request.nextUrl.origin}/api/shop/config`, {
      headers: { "x-wallet": wallet },
      cache: "no-store",
    });
    
    const j = await r.json();
    const hotelSettings = j?.config?.hotelSettings || {};

    return NextResponse.json({
      ok: true,
      settings: hotelSettings,
    });
  } catch (e: any) {
    console.error("Failed to fetch hotel settings:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 401 });
    }

    const body = await request.json();

    // Save to shop config
    const r = await fetch(`${request.nextUrl.origin}/api/shop/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wallet": wallet,
      },
      body: JSON.stringify({ hotelSettings: body }),
    });

    const j = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { error: j?.error || "Failed to save settings" },
        { status: r.status }
      );
    }

    return NextResponse.json({
      ok: true,
      settings: body,
    });
  } catch (e: any) {
    console.error("Failed to save hotel settings:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
