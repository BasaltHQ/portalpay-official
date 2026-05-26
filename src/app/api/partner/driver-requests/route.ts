import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // pending, approved

    const container = await getContainer();
    
    let query = "SELECT * FROM c WHERE c.type = 'driver_request'";
    const parameters: any[] = [];

    if (status === "pending") {
      query += " AND c.approved = false";
    } else if (status === "approved") {
      query += " AND c.approved = true";
    }

    query += " ORDER BY c.createdAt DESC";

    const { resources: requests } = await container.items.query({ query, parameters }).fetchAll();

    return NextResponse.json({ ok: true, requests });
  } catch (error: any) {
    console.error("[partner/driver-requests] GET error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to fetch driver requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { wallet, approved } = body;

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing driver wallet address" }, { status: 400 });
    }

    const container = await getContainer();
    const normalizedWallet = wallet.toLowerCase();
    const docId = `driver:${normalizedWallet}`;

    // Read the driver request document using partition key (wallet)
    const { resource: request } = await container.item(docId, normalizedWallet).read();

    if (!request) {
      return NextResponse.json({ ok: false, error: "Driver request not found" }, { status: 404 });
    }

    request.approved = approved === true;
    request.updatedAt = Date.now();

    await container.item(docId, normalizedWallet).replace(request);

    return NextResponse.json({ ok: true, request });
  } catch (error: any) {
    console.error("[partner/driver-requests] POST error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update driver status" }, { status: 500 });
  }
}
