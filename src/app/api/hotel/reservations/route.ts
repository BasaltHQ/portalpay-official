import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

const DB_NAME = "payportal";
const CONTAINER_NAME = "hotel_reservations";

export async function GET(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const status = searchParams.get("status");
    const roomNumber = searchParams.get("roomNumber");

    const container = await getContainer(DB_NAME, CONTAINER_NAME);

    // Build query
    let query = "SELECT * FROM c WHERE c.wallet = @wallet";
    const parameters: any[] = [{ name: "@wallet", value: wallet.toLowerCase() }];

    if (checkInDate) {
      query += " AND c.checkInDate >= @checkInDate";
      parameters.push({ name: "@checkInDate", value: checkInDate });
    }

    if (checkOutDate) {
      query += " AND c.checkOutDate <= @checkOutDate";
      parameters.push({ name: "@checkOutDate", value: checkOutDate });
    }

    if (status) {
      query += " AND c.status = @status";
      parameters.push({ name: "@status", value: status });
    }

    if (roomNumber) {
      query += " AND c.roomNumber = @roomNumber";
      parameters.push({ name: "@roomNumber", value: roomNumber });
    }

    const { resources } = await container.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    return NextResponse.json({
      ok: true,
      reservations: resources || [],
    });
  } catch (e: any) {
    console.error("Failed to fetch hotel reservations:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to fetch reservations" },
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
    const {
      roomId,
      roomNumber,
      guestName,
      guestEmail,
      guestPhone,
      guestIdType,
      guestIdNumber,
      guestIdCountry,
      guestDOB,
      guestNationality,
      guestAddress,
      checkInDate,
      checkOutDate,
      numGuests,
      status,
      paymentStatus,
      paymentMethod,
      totalAmount,
      depositAmount,
      specialRequests,
      preferences,
      accessibilityNeeds,
      vipStatus,
      internalNotes,
      paymentReceiptId,
    } = body;

    // Validation
    if (!roomNumber || !guestName || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: "Missing required fields: roomNumber, guestName, checkInDate, checkOutDate" },
        { status: 400 }
      );
    }

    const container = await getContainer(DB_NAME, CONTAINER_NAME);

    const now = Date.now();
    const id = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const reservation = {
      id,
      wallet: wallet.toLowerCase(),
      roomId: roomId || null,
      roomNumber: String(roomNumber),
      guestName: String(guestName),
      guestEmail: guestEmail || null,
      guestPhone: guestPhone || null,
      guestIdType: guestIdType || null,
      guestIdNumber: guestIdNumber || null,
      guestIdCountry: guestIdCountry || null,
      guestDOB: guestDOB || null,
      guestNationality: guestNationality || null,
      guestAddress: guestAddress || null,
      checkInDate: String(checkInDate),
      checkOutDate: String(checkOutDate),
      numGuests: numGuests || { adults: 1, children: 0 },
      status: status || "pending",
      paymentStatus: paymentStatus || "pending",
      paymentMethod: paymentMethod || null,
      totalAmount: Number(totalAmount || 0),
      depositAmount: Number(depositAmount || 0),
      specialRequests: specialRequests || null,
      preferences: preferences || null,
      accessibilityNeeds: accessibilityNeeds || null,
      vipStatus: vipStatus || null,
      internalNotes: internalNotes || null,
      paymentReceiptId: paymentReceiptId || null,
      createdAt: now,
      updatedAt: now,
    };

    await container.items.create(reservation);

    return NextResponse.json({
      ok: true,
      reservation,
    });
  } catch (e: any) {
    console.error("Failed to create hotel reservation:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Reservation ID required" }, { status: 400 });
    }

    const container = await getContainer(DB_NAME, CONTAINER_NAME);

    // Fetch existing reservation
    const { resource: existing } = await container.item(id, wallet.toLowerCase()).read();
    
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Update
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await container.item(id, wallet.toLowerCase()).replace(updated);

    return NextResponse.json({
      ok: true,
      reservation: updated,
    });
  } catch (e: any) {
    console.error("Failed to update hotel reservation:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to update reservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Reservation ID required" }, { status: 400 });
    }

    const container = await getContainer(DB_NAME, CONTAINER_NAME);

    await container.item(id, wallet.toLowerCase()).delete();

    return NextResponse.json({
      ok: true,
    });
  } catch (e: any) {
    console.error("Failed to delete hotel reservation:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
