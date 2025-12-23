import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import {
  type PMSInstance
} from '@/lib/pms';
import {
  getStaffSession
} from '@/lib/pms/auth';;

/**
 * Staff Session API
 * GET: Verify and return current staff session
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Get current session
    const session = await getStaffSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Verify slug matches
    if (session.pmsSlug !== slug) {
      return NextResponse.json(
        { error: 'Invalid session for this PMS instance' },
        { status: 403, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Get PMS instance info
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
    
    return NextResponse.json(
      {
        session,
        instance: {
          slug: instance.slug,
          name: instance.name,
          branding: instance.branding,
          settings: instance.settings,
        },
      },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/auth/session error:`, error);
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
