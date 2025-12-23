import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireThirdwebAuth } from '@/lib/auth';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type UpdatePMSInstanceInput,
  
} from '@/lib/pms';;

/**
 * PMS Instance Management API - Individual Instance
 * - GET: Get a specific PMS instance by slug
 * - PATCH: Update a PMS instance
 * - DELETE: Delete a PMS instance
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require authentication
    const caller = await requireThirdwebAuth(req);
    const wallet = caller.wallet;
    
    // Get PMS instance
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
          AND c.wallet = @wallet
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@wallet', value: wallet },
        ],
      })
      .fetchAll();
    
    if (!resources || resources.length === 0) {
      return NextResponse.json(
        { error: 'PMS instance not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { instance: resources[0] },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/instances/${slug} error:`, error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch PMS instance' },
      { status: error?.message === 'unauthorized' ? 401 : 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require authentication
    const caller = await requireThirdwebAuth(req);
    const wallet = caller.wallet;
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, 'pms_instance_update', wallet), 20, 60 * 60 * 1000);
    
    // Get existing instance
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
          AND c.wallet = @wallet
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@wallet', value: wallet },
        ],
      })
      .fetchAll();
    
    if (!resources || resources.length === 0) {
      return NextResponse.json(
        { error: 'PMS instance not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const existing = resources[0] as PMSInstance;
    
    // Parse update body
    const body = (await req.json().catch(() => ({}))) as UpdatePMSInstanceInput;
    
    // Update instance
    const updated: PMSInstance = {
      ...existing,
      name: body.name ? String(body.name).trim() : existing.name,
      branding: {
        ...existing.branding,
        ...body.branding,
      },
      settings: {
        ...existing.settings,
        ...body.settings,
      },
      updatedAt: Date.now(),
    };
    
    // Validate name length if updated
    if (body.name && (updated.name.length < 2 || updated.name.length > 50)) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    await container.items.upsert(updated);
    
    return NextResponse.json(
      { instance: updated },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`PATCH /api/pms/instances/${slug} error:`, error);
    
    if (error?.message === 'csrf_required' || error?.message === 'rate_limited') {
      return NextResponse.json(
        { error: error.message },
        { status: error?.status || 429, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to update PMS instance' },
      { status: error?.message === 'unauthorized' ? 401 : 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require authentication
    const caller = await requireThirdwebAuth(req);
    const wallet = caller.wallet;
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, 'pms_instance_delete', wallet), 5, 60 * 60 * 1000);
    
    // Get existing instance
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
          AND c.wallet = @wallet
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@wallet', value: wallet },
        ],
      })
      .fetchAll();
    
    if (!resources || resources.length === 0) {
      return NextResponse.json(
        { error: 'PMS instance not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const instance = resources[0] as PMSInstance;
    
    // Delete the instance
    await container.item(instance.id, wallet).delete();
    
    // Note: In a production system, you might want to:
    // 1. Delete all associated staff users
    // 2. Delete all folios
    // 3. Delete all payment splits
    // For now, we'll do a simple delete
    
    return NextResponse.json(
      { success: true },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`DELETE /api/pms/instances/${slug} error:`, error);
    
    if (error?.message === 'csrf_required' || error?.message === 'rate_limited') {
      return NextResponse.json(
        { error: error.message },
        { status: error?.status || 429, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to delete PMS instance' },
      { status: error?.message === 'unauthorized' ? 401 : 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
