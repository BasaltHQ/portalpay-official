import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const wallet = url.searchParams.get("wallet")?.toLowerCase();

    const container = await getContainer();

    if (wallet) {
      const docId = `driver:${wallet}`;
      const { resource: profile } = await container.item(docId, wallet).read();
      return NextResponse.json({ ok: true, profile: profile || null });
    }

    // Get all online drivers
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'driver_request' AND c.approved = true AND c.isOnline = true",
      parameters: []
    };

    const { resources: drivers } = await container.items.query(querySpec).fetchAll();
    return NextResponse.json({ ok: true, drivers });
  } catch (error: any) {
    console.error("[drive/status] GET error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to fetch driver statuses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { wallet, isOnline, lat, lng } = body;

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing driver wallet address" }, { status: 400 });
    }

    const container = await getContainer();
    const normalizedWallet = wallet.toLowerCase();
    const docId = `driver:${normalizedWallet}`;

    // Read existing profile to preserve details
    const { resource: profile } = await container.item(docId, normalizedWallet).read();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Driver request not found" }, { status: 404 });
    }

    const now = Date.now();
    profile.isOnline = isOnline === true;
    profile.lastActive = now;
    profile.updatedAt = now;

    if (lat !== undefined && lng !== undefined) {
      profile.currentLocation = {
        lat: Number(lat),
        lng: Number(lng)
      };
    }

    // Initialize DIRS stats if they do not exist
    if (profile.consecutiveDeclines === undefined) profile.consecutiveDeclines = 0;
    if (profile.cooldownUntil === undefined) profile.cooldownUntil = 0;
    if (profile.acceptedOffersCount === undefined) profile.acceptedOffersCount = 0;
    if (profile.totalOffersCount === undefined) profile.totalOffersCount = 0;

    await container.item(docId, normalizedWallet).replace(profile);

    return NextResponse.json({ ok: true, profile });
  } catch (error: any) {
    console.error("[drive/status] POST error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save driver status" }, { status: 500 });
  }
}
