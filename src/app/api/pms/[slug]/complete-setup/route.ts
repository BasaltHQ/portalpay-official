import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { hashPassword } from '@/lib/pms/auth';
import type { PMSInstance, PMSStaffUser } from '@/lib/pms';
import { DEFAULT_PERMISSIONS, PERMISSIONS } from '@/lib/pms';

/**
 * Complete PMS Setup API
 * Creates owner account and updates logo
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    const body = await req.json();
    const { ownerPassword, logo } = body;
    
    if (!ownerPassword || ownerPassword.length < 8) {
      return NextResponse.json(
        { error: 'Owner password must be at least 8 characters' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const container = await getContainer();
    
    // Get PMS instance
    const { resources: instances } = await container.items
      .query({
        query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
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
    
    // Check if owner account already exists
    const { resources: existingOwners } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          AND c.username = 'owner'
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    if (existingOwners && existingOwners.length > 0) {
      return NextResponse.json(
        { error: 'Owner account already exists' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Create owner account
    const passwordHash = await hashPassword(ownerPassword);
    const now = Date.now();
    
    const ownerUser: PMSStaffUser = {
      id: `${slug}-owner`,
      type: 'pms_staff',
      wallet: instance.wallet,
      pmsSlug: slug,
      username: 'owner',
      passwordHash,
      role: 'manager',
      permissions: DEFAULT_PERMISSIONS.manager,
      displayName: 'Property Owner',
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    
    await container.items.create(ownerUser);
    
    // Update instance with logo if provided
    if (logo) {
      const updatedInstance: PMSInstance = {
        ...instance,
        branding: {
          ...instance.branding,
          logo,
        },
        updatedAt: now,
      };
      
      await container.items.upsert(updatedInstance);
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Setup completed successfully',
      },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/complete-setup error:`, error);
    
    return NextResponse.json(
      { error: error?.message || 'Failed to complete setup' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
