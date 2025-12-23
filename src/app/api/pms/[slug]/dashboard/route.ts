import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import {
  type PMSInstance,
  type PMSFolio,
  type RoomInventoryItem,
  calculateDashboardMetrics,
} from '@/lib/pms';
import { getStaffSession } from '@/lib/pms/auth';

/**
 * Dashboard Metrics API
 * - GET: Get dashboard metrics for a PMS instance
 * - Accessible by staff session OR wallet owner
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Get PMS instance first
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
    
    // Check authentication: either staff session OR wallet owner
    const session = await getStaffSession();
    const walletHeader = req.headers.get('x-wallet-address');
    
    const isStaff = session && session.pmsSlug === slug;
    const isOwner = walletHeader && 
      walletHeader.toLowerCase() === instance.wallet.toLowerCase();
    
    if (!isStaff && !isOwner) {
      return NextResponse.json(
        { error: 'Authentication required. Must be staff member or property owner.' },
        { status: 401, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Get all rooms from inventory
    const { resources: rooms } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'inventory_item' 
          AND c.wallet = @wallet
          AND c.industryPack = 'hotel'
        `,
        parameters: [{ name: '@wallet', value: instance.wallet }],
      })
      .fetchAll();
    
    // Get all folios
    const { resources: folios } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_folio' 
          AND c.pmsSlug = @slug
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    // Calculate metrics
    const metrics = calculateDashboardMetrics(
      (rooms || []) as RoomInventoryItem[],
      (folios || []) as PMSFolio[]
    );
    
    return NextResponse.json(
      { metrics },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/dashboard error:`, error);
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard metrics' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
