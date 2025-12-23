import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type PMSFolio,
  type AddFolioChargeInput,
  PERMISSIONS,
  recalculateFolio,
  
} from '@/lib/pms';
import {
  requireStaffSession,
  requirePermission
} from '@/lib/pms/auth';;

/**
 * Individual Folio Management API
 * - GET: Get a specific folio
 * - POST: Add a charge or payment to a folio
 * - PATCH: Update folio details
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.VIEW_FOLIOS);
    
    // Get folio
    const container = await getContainer();
    const { resources: folios } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_folio' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!folios || folios.length === 0) {
      return NextResponse.json(
        { error: 'Folio not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { folio: folios[0] },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/folios/${id} error:`, error);
    
    const status = error?.message === 'Staff authentication required' ? 401 
      : error?.message?.includes('Permission denied') ? 403 
      : 500;
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch folio' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.ADD_CHARGES);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_folio_charge_${slug}`, slug), 60, 60 * 60 * 1000);
    
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
    
    // Get folio
    const { resources: folios } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_folio' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!folios || folios.length === 0) {
      return NextResponse.json(
        { error: 'Folio not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const folio = folios[0] as PMSFolio;
    
    // Check folio status
    if (folio.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot add charges to a closed folio' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Parse request body
    const body = (await req.json().catch(() => ({}))) as AddFolioChargeInput;
    
    // Validate required fields
    if (!body.description || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Description and positive amount are required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Create new charge
    const now = Date.now();
    const chargeId = `charge_${now}_${Math.random().toString(36).substring(7)}`;
    
    const newCharge = {
      id: chargeId,
      description: String(body.description).trim(),
      amount: body.amount,
      quantity: body.quantity || 1,
      timestamp: now,
      category: body.category || 'other' as const,
      taxable: body.taxable !== false, // default to true
    };
    
    // Add charge to folio
    const updatedCharges = [...folio.charges, newCharge];
    
    // Recalculate totals
    const updatedFolio = recalculateFolio(
      { ...folio, charges: updatedCharges },
      instance.settings.taxRate || 0
    );
    
    await container.items.upsert(updatedFolio);
    
    return NextResponse.json(
      { folio: updatedFolio },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/folios/${id} error:`, error);
    
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
      { error: error?.message || 'Failed to add charge' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.EDIT_FOLIO);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_folio_update_${slug}`, slug), 30, 60 * 60 * 1000);
    
    // Get folio
    const container = await getContainer();
    const { resources: folios } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_folio' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!folios || folios.length === 0) {
      return NextResponse.json(
        { error: 'Folio not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const folio = folios[0] as PMSFolio;
    
    // Parse update body
    const body = (await req.json().catch(() => ({}))) as Partial<PMSFolio>;
    
    // Build updated folio
    const updated: PMSFolio = {
      ...folio,
      guestName: body.guestName ? String(body.guestName).trim() : folio.guestName,
      guestEmail: body.guestEmail !== undefined ? String(body.guestEmail).trim() : folio.guestEmail,
      guestPhone: body.guestPhone !== undefined ? String(body.guestPhone).trim() : folio.guestPhone,
      guestAddress: body.guestAddress !== undefined ? String(body.guestAddress).trim() : folio.guestAddress,
      notes: body.notes !== undefined ? body.notes : folio.notes,
      updatedAt: Date.now(),
    };
    
    await container.items.upsert(updated);
    
    return NextResponse.json(
      { folio: updated },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`PATCH /api/pms/${slug}/folios/${id} error:`, error);
    
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
      { error: error?.message || 'Failed to update folio' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.EDIT_FOLIO);
    
    // Get folio
    const container = await getContainer();
    const { resources: folios } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_folio' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!folios || folios.length === 0) {
      return NextResponse.json(
        { error: 'Folio not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const folio = folios[0] as PMSFolio;
    
    // Delete the folio
    await container.item(id, folio.wallet).delete();
    
    // Restore room availability if folio was open
    if (folio.status === 'open') {
      const { resources: rooms } = await container.items
        .query({
          query: `
            SELECT * FROM c 
            WHERE c.type = 'inventory_item' 
            AND c.id = @roomId
          `,
          parameters: [{ name: '@roomId', value: folio.roomId }],
        })
        .fetchAll();
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        await container.items.upsert({
          ...room,
          stockQty: room.stockQty + 1,
          updatedAt: Date.now(),
        });
      }
    }
    
    return NextResponse.json(
      { ok: true },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`DELETE /api/pms/${slug}/folios/${id} error:`, error);
    
    const status = error?.message === 'Staff authentication required' ? 401 
      : error?.message?.includes('Permission denied') ? 403 
      : 500;
    
    return NextResponse.json(
      { error: error?.message || 'Failed to delete folio' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
