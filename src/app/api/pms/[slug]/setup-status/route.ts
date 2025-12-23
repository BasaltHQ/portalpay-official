import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import type { PMSInstance, PMSStaffUser } from '@/lib/pms';

/**
 * PMS Setup Status API
 * Checks if PMS instance has completed initial setup:
 * - Owner account exists
 * - Logo is uploaded
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
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
    
    // Check if owner account exists (manager role with username = 'owner')
    const { resources: ownerAccounts } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          AND c.role = 'manager'
          AND c.username = 'owner'
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    const hasOwnerAccount = ownerAccounts && ownerAccounts.length > 0;
    const hasLogo = !!instance.branding?.logo;
    
    const setupComplete = hasOwnerAccount && hasLogo;
    
    return NextResponse.json(
      {
        setupComplete,
        hasOwnerAccount,
        hasLogo,
        instance: {
          slug: instance.slug,
          name: instance.name,
          wallet: instance.wallet,
        },
      },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/setup-status error:`, error);
    
    return NextResponse.json(
      { error: error?.message || 'Failed to check setup status' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
