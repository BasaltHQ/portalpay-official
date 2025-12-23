import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type PMSFolio,
  type CreateFolioInput,
  type RoomInventoryItem,
  PERMISSIONS,
  generateFolioNumber,
  extractRoomNumber,
  calculateFolioTotals,
  calculateNights,
  
} from '@/lib/pms';
import {
  requireStaffSession,
  requirePermission
} from '@/lib/pms/auth';;

/**
 * Folio Management API
 * - GET: List folios for a PMS instance
 * - POST: Create a new folio (check-in)
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.VIEW_FOLIOS);
    
    // Get PMS instance
    const container = await getContainer();
    const { resources: instances } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    if (!instances || instances.length === 0) {
      return NextResponse.json(
        { error: 'PMS instance not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const instance = instances[0] as PMSInstance;
    
    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // 'open' | 'checked_out' | 'cancelled'
    const roomId = url.searchParams.get('roomId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Build query
    let query = `
      SELECT * FROM c 
      WHERE c.type = 'pms_folio' 
      AND c.pmsSlug = @slug
    `;
    
    const parameters: Array<{ name: string; value: any }> = [
      { name: '@slug', value: slug },
    ];
    
    if (status) {
      query += ' AND c.status = @status';
      parameters.push({ name: '@status', value: status });
    }
    
    if (roomId) {
      query += ' AND c.roomId = @roomId';
      parameters.push({ name: '@roomId', value: roomId });
    }
    
    query += ' ORDER BY c.createdAt DESC';
    
    // Get folios
    const { resources: folios } = await container.items
      .query({ query, parameters })
      .fetchAll();
    
    const limitedFolios = (folios || []).slice(0, Math.min(limit, 100));
    
    return NextResponse.json(
      { 
        folios: limitedFolios,
        total: folios?.length || 0,
      },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/folios error:`, error);
    
    const status = error?.message === 'Staff authentication required' ? 401 
      : error?.message?.includes('Permission denied') ? 403 
      : 500;
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch folios' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.CREATE_FOLIO);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_folio_create_${slug}`, slug), 30, 60 * 60 * 1000);
    
    // Get PMS instance
    const container = await getContainer();
    const { resources: instances } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    if (!instances || instances.length === 0) {
      return NextResponse.json(
        { error: 'PMS instance not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const instance = instances[0] as PMSInstance;
    
    // Parse request body
    const body = (await req.json().catch(() => ({}))) as CreateFolioInput & { roomNumber?: string };
    
    // Validate required fields
    if (!body.guestName || !body.roomId || !body.checkIn || !body.checkOut) {
      return NextResponse.json(
        { error: 'Guest name, room ID, check-in, and check-out are required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    if (body.checkOut <= body.checkIn) {
      return NextResponse.json(
        { error: 'Check-out must be after check-in' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Get room from inventory
    const { resources: rooms } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'inventory_item' 
          AND c.id = @roomId
          AND c.wallet = @wallet
        `,
        parameters: [
          { name: '@roomId', value: body.roomId },
          { name: '@wallet', value: instance.wallet },
        ],
      })
      .fetchAll();
    
    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const room = rooms[0] as RoomInventoryItem;
    
    // Check room availability
    if (room.stockQty === 0) {
      return NextResponse.json(
        { error: 'Room is not available' },
        { status: 409, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Get existing folios to generate folio number
    const { resources: existingFolios } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_folio' 
          AND c.pmsSlug = @slug
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    const folioNumber = generateFolioNumber(existingFolios as PMSFolio[]);
    // Use roomNumber from form data if provided, otherwise extract from room
    const roomNumber = body.roomNumber || extractRoomNumber(room);
    const nights = calculateNights(body.checkIn, body.checkOut);
    
    // Create initial room charge
    const now = Date.now();
    const roomChargeId = `charge_${now}_${Math.random().toString(36).substring(7)}`;
    
    const roomCharge = {
      id: roomChargeId,
      description: `Room ${roomNumber} - ${nights} night(s)`,
      amount: room.priceUsd,
      quantity: nights,
      timestamp: now,
      category: 'room' as const,
      taxable: true,
    };
    
    // Calculate totals
    const { subtotal, tax, total } = calculateFolioTotals(
      [roomCharge],
      instance.settings.taxRate || 0
    );
    
    // Create folio
    const folioId = `folio_${slug}_${now}_${Math.random().toString(36).substring(7)}`;
    
    const folio: PMSFolio = {
      id: folioId,
      type: 'pms_folio',
      wallet: instance.wallet,
      pmsSlug: slug,
      folioNumber,
      guestName: String(body.guestName).trim(),
      guestEmail: body.guestEmail ? String(body.guestEmail).trim() : undefined,
      guestPhone: body.guestPhone ? String(body.guestPhone).trim() : undefined,
      guestAddress: body.guestAddress ? String(body.guestAddress).trim() : undefined,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      roomId: body.roomId,
      roomNumber,
      adults: body.adults || 1,
      children: body.children || 0,
      charges: [roomCharge],
      payments: [],
      subtotal,
      tax,
      total,
      balance: total,
      status: 'open',
      notes: body.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: session.staffId,
    };
    
    await container.items.upsert(folio);
    
    // Mark room as occupied (stockQty = 0)
    const updatedRoom = {
      ...room,
      stockQty: 0,
      updatedAt: now,
    };
    await container.items.upsert(updatedRoom);
    
    return NextResponse.json(
      { folio },
      { status: 201, headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/folios error:`, error);
    
    if (error?.message === 'csrf_required' || error?.message === 'rate_limited') {
      return NextResponse.json(
        { error: error.message },
        { status: error?.status || 429, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const status = error?.message === 'Staff authentication required' ? 401 
      : error?.message?.includes('Permission denied') ? 403 
      : 500;
    
    return NextResponse.json(
      { error: error?.message || 'Failed to create folio' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
