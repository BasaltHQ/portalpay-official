import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireThirdwebAuth } from '@/lib/auth';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type CreatePMSInstanceInput,
  validateSlug,
  
} from '@/lib/pms';;

/**
 * PMS Instance Management API
 * - GET: List all PMS instances owned by the authenticated wallet
 * - POST: Create a new PMS instance
 */

export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  
  try {
    // Require authentication
    const caller = await requireThirdwebAuth(req);
    const wallet = caller.wallet;
    
    // Get all PMS instances for this wallet
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.wallet = @wallet 
          ORDER BY c.createdAt DESC
        `,
        parameters: [{ name: '@wallet', value: wallet }],
      })
      .fetchAll();
    
    return NextResponse.json(
      { instances: resources || [] },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error('GET /api/pms/instances error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch PMS instances' },
      { status: error?.message === 'unauthorized' ? 401 : 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  
  try {
    // Require authentication
    const caller = await requireThirdwebAuth(req);
    const wallet = caller.wallet;
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, 'pms_instance_create', wallet), 5, 60 * 60 * 1000);
    
    // Check if wallet already has a property (one property per wallet limit)
    const container = await getContainer();
    const { resources: existingInstances } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.wallet = @wallet
        `,
        parameters: [{ name: '@wallet', value: wallet }],
      })
      .fetchAll();
    
    if (existingInstances && existingInstances.length > 0) {
      return NextResponse.json(
        { error: 'You already have a property. Only one property is allowed per wallet.' },
        { status: 409, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Parse request body
    const body = (await req.json().catch(() => ({}))) as CreatePMSInstanceInput;
    
    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const name = String(body.name).trim();
    const slug = String(body.slug).trim().toLowerCase();
    
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    if (!validateSlug(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    if (slug.length < 3 || slug.length > 30) {
      return NextResponse.json(
        { error: 'Slug must be between 3 and 30 characters' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Check if slug is already taken (globally unique)
    const { resources: existing } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This slug is already taken. Please choose a different one.' },
        { status: 409, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Create PMS instance
    const now = Date.now();
    const instance: PMSInstance = {
      id: slug, // Use slug as ID for easy lookup
      type: 'pms_instance',
      wallet,
      name,
      slug,
      branding: {
        logo: body.branding?.logo,
        primaryColor: body.branding?.primaryColor || '#3b82f6',
        secondaryColor: body.branding?.secondaryColor || '#8b5cf6',
      },
      settings: {
        checkInTime: body.settings?.checkInTime || '15:00',
        checkOutTime: body.settings?.checkOutTime || '11:00',
        currency: body.settings?.currency || 'USD',
        timezone: body.settings?.timezone || 'America/New_York',
        taxRate: body.settings?.taxRate || 0,
      },
      createdAt: now,
      updatedAt: now,
    };
    
    await container.items.upsert(instance);
    
    // Create owner staff user if credentials provided
    if (body.ownerUsername && body.ownerPassword) {
      try {
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(body.ownerPassword, 12);
        
        const ownerUser = {
          id: `${slug}_owner`,
          type: 'pms_staff',
          wallet, // PMS instance owner wallet (partition key)
          pmsSlug: slug,
          username: String(body.ownerUsername).trim(),
          passwordHash,
          role: 'manager' as const,
          permissions: [
            'view_folios', 'create_folio', 'edit_folio', 'checkout',
            'add_charges', 'process_payment', 'view_guests', 'view_rooms',
            'update_room_status', 'view_tasks', 'view_maintenance',
            'create_work_order', 'update_work_order', 'view_reports',
            'manage_staff', 'manage_settings', 'process_refund'
          ],
          displayName: 'Owner',
          active: true,
          createdAt: now,
          updatedAt: now,
        };
        
        await container.items.upsert(ownerUser);
      } catch (staffError) {
        console.error('Failed to create owner staff user:', staffError);
        // Don't fail the whole request, just log the error
      }
    }
    
    return NextResponse.json(
      { instance },
      { status: 201, headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error('POST /api/pms/instances error:', error);
    
    if (error?.message === 'csrf_required' || error?.message === 'rate_limited') {
      return NextResponse.json(
        { error: error.message },
        { status: error?.status || 429, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to create PMS instance' },
      { status: error?.message === 'unauthorized' ? 401 : 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
