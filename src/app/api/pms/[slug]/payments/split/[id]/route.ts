import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSPaymentSplit,
  type PMSFolio,
  PERMISSIONS,
  isPaymentSplitComplete,
  
} from '@/lib/pms';
import {
  requireStaffSession,
  requirePermission
} from '@/lib/pms/auth';;

/**
 * Individual Split Payment API
 * - GET: Get a specific payment split
 * - PATCH: Update a segment status (complete a segment)
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session
    const session = await requireStaffSession(slug);
    
    // Get split
    const container = await getContainer();
    const { resources: splits } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_payment_split' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!splits || splits.length === 0) {
      return NextResponse.json(
        { error: 'Payment split not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { split: splits[0] },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/payments/split/${id} error:`, error);
    
    const status = error?.message === 'Staff authentication required' ? 401 : 500;
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch payment split' },
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
    requirePermission(session, PERMISSIONS.PROCESS_PAYMENT);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_split_update_${slug}`, slug), 30, 60 * 60 * 1000);
    
    // Get split
    const container = await getContainer();
    const { resources: splits } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_payment_split' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!splits || splits.length === 0) {
      return NextResponse.json(
        { error: 'Payment split not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const split = splits[0] as PMSPaymentSplit;
    
    // Check if already completed
    if (split.status === 'completed') {
      return NextResponse.json(
        { error: 'Payment split is already completed' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Parse update body
    const body = (await req.json().catch(() => ({}))) as {
      segmentId?: string;
      status?: 'completed' | 'failed';
      cashReceived?: number;
      changeGiven?: number;
      receiptId?: string;
      errorMessage?: string;
    };
    
    if (!body.segmentId) {
      return NextResponse.json(
        { error: 'Segment ID is required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Find segment
    const segmentIndex = split.segments.findIndex(seg => seg.id === body.segmentId);
    if (segmentIndex === -1) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Update segment
    const now = Date.now();
    const updatedSegments = [...split.segments];
    updatedSegments[segmentIndex] = {
      ...updatedSegments[segmentIndex],
      status: body.status || updatedSegments[segmentIndex].status,
      completedAt: body.status === 'completed' ? now : updatedSegments[segmentIndex].completedAt,
      cashReceived: body.cashReceived,
      changeGiven: body.changeGiven,
      receiptId: body.receiptId || updatedSegments[segmentIndex].receiptId,
      errorMessage: body.errorMessage,
    };
    
    // Check if all segments are complete
    const allComplete = updatedSegments.every(seg => seg.status === 'completed');
    
    const updatedSplit: PMSPaymentSplit = {
      ...split,
      segments: updatedSegments,
      status: allComplete ? 'completed' : 'in_progress',
      completedAt: allComplete ? now : undefined,
      updatedAt: now,
    };
    
    await container.items.upsert(updatedSplit);
    
    // If split is now complete, update folio
    if (allComplete) {
      const { resources: folios } = await container.items
        .query({
          query: `
            SELECT * FROM c 
            WHERE c.type = 'pms_folio' 
            AND c.id = @folioId
          `,
          parameters: [{ name: '@folioId', value: split.folioId }],
        })
        .fetchAll();
      
      if (folios && folios.length > 0) {
        const folio = folios[0] as PMSFolio;
        
        // Add all segment payments to folio
        const newPayments = updatedSegments.map(seg => ({
          id: `payment_${seg.id}`,
          amount: seg.amount,
          method: seg.method,
          timestamp: seg.completedAt || now,
          receiptId: seg.receiptId,
          reference: seg.method === 'cash' 
            ? `Cash - Received: ${seg.cashReceived}, Change: ${seg.changeGiven}`
            : `Card - Receipt: ${seg.receiptId}`,
        }));
        
        const updatedFolio: PMSFolio = {
          ...folio,
          payments: [...folio.payments, ...newPayments],
          balance: 0,
          updatedAt: now,
        };
        
        await container.items.upsert(updatedFolio);
      }
    }
    
    return NextResponse.json(
      { split: updatedSplit },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`PATCH /api/pms/${slug}/payments/split/${id} error:`, error);
    
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
      { error: error?.message || 'Failed to update payment split' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
