import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type PMSFolio,
  type AddFolioPaymentInput,
  PERMISSIONS,
  
} from '@/lib/pms';
import {
  requireStaffSession,
  requirePermission
} from '@/lib/pms/auth';;

/**
 * Folio Checkout API
 * - POST: Process checkout for a folio
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.CHECKOUT);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_checkout_${slug}`, slug), 20, 60 * 60 * 1000);
    
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
        { error: 'Folio is already closed' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Parse request body
    const body = (await req.json().catch(() => ({}))) as AddFolioPaymentInput;
    
    // Validate payment
    if (!body.amount || !body.method) {
      return NextResponse.json(
        { error: 'Payment amount and method are required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Check if payment covers remaining balance
    const remainingBalance = folio.balance;
    
    if (body.amount < remainingBalance) {
      return NextResponse.json(
        { error: `Payment of ${body.amount} is less than remaining balance of ${remainingBalance}` },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Create payment record
    const now = Date.now();
    const paymentId = `payment_${now}_${Math.random().toString(36).substring(7)}`;
    
    const payment = {
      id: paymentId,
      amount: body.amount,
      method: body.method,
      timestamp: now,
      receiptId: body.receiptId,
      reference: body.reference || `Checkout by ${session.username}`,
    };
    
    // Update folio
    const updatedFolio: PMSFolio = {
      ...folio,
      payments: [...folio.payments, payment],
      balance: Math.max(0, remainingBalance - body.amount),
      status: 'checked_out',
      checkedOutBy: session.staffId,
      checkedOutAt: now,
      updatedAt: now,
    };
    
    await container.items.upsert(updatedFolio);
    
    // Free up the room (set stockQty back to 1)
    const { resources: rooms } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'inventory_item' 
          AND c.id = @roomId
          AND c.wallet = @wallet
        `,
        parameters: [
          { name: '@roomId', value: folio.roomId },
          { name: '@wallet', value: instance.wallet },
        ],
      })
      .fetchAll();
    
    if (rooms && rooms.length > 0) {
      const room = rooms[0];
      const updatedRoom = {
        ...room,
        stockQty: 1, // Room is now available
        updatedAt: now,
        attributes: {
          ...room.attributes,
          status: 'cleaning', // Mark for housekeeping
        },
      };
      await container.items.upsert(updatedRoom);
    }
    
    return NextResponse.json(
      { 
        folio: updatedFolio,
        message: 'Checkout completed successfully',
      },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/folios/${id}/checkout error:`, error);
    
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
      { error: error?.message || 'Failed to process checkout' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
