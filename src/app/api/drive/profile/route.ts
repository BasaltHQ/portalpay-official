import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const wallet = url.searchParams.get("wallet")?.toLowerCase();

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 });
    }

    const container = await getContainer();
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'driver_request' AND c.wallet = @wallet",
      parameters: [{ name: "@wallet", value: wallet }]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    const profile = resources[0] || null;

    return NextResponse.json({ ok: true, profile });
  } catch (error: any) {
    console.error("[drive/profile] GET error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      wallet, name, phone, vehicle, poolPreference, shopSlug,
      vehicleMakeModel, vehicleColor, licensePlate,
      licenseNumber, licenseState, licenseExpiry,
      insuranceFile, insuranceFileName
    } = body;

    if (!wallet || !name || !phone || !vehicle || !poolPreference ||
        !vehicleMakeModel || !vehicleColor || !licensePlate ||
        !licenseNumber || !licenseState || !licenseExpiry || !insuranceFile) {
      return NextResponse.json({ ok: false, error: "Missing comprehensive registration details (vehicle, license, or insurance upload)." }, { status: 400 });
    }

    const container = await getContainer();
    const normalizedWallet = wallet.toLowerCase();
    const docId = `driver:${normalizedWallet}`;

    // Check if profile already exists
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'driver_request' AND c.wallet = @wallet",
      parameters: [{ name: "@wallet", value: normalizedWallet }]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    const existing = resources[0];

    const now = Date.now();
    const doc = {
      id: docId,
      type: "driver_request",
      wallet: normalizedWallet,
      name,
      phone,
      vehicle,
      poolPreference,
      shopSlug: poolPreference === "shop" ? (shopSlug || "").toLowerCase() : null,
      vehicleMakeModel,
      vehicleColor,
      licensePlate,
      licenseNumber,
      licenseState,
      licenseExpiry,
      insuranceFile,
      insuranceFileName: insuranceFileName || "insurance_policy.pdf",
      approved: existing ? !!existing.approved : false,
      isOnline: existing ? !!existing.isOnline : false,
      currentLocation: existing ? existing.currentLocation : null,
      consecutiveDeclines: existing ? Number(existing.consecutiveDeclines || 0) : 0,
      cooldownUntil: existing ? Number(existing.cooldownUntil || 0) : 0,
      acceptedOffersCount: existing ? Number(existing.acceptedOffersCount || 0) : 0,
      totalOffersCount: existing ? Number(existing.totalOffersCount || 0) : 0,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    await container.items.upsert(doc);

    return NextResponse.json({ ok: true, profile: doc });
  } catch (error: any) {
    console.error("[drive/profile] POST error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save profile" }, { status: 500 });
  }
}
