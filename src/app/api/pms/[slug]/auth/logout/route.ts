import { NextRequest, NextResponse } from 'next/server';
import {
  clearStaffSessionCookie
} from '@/lib/pms/auth';;

/**
 * Staff Logout API
 * POST: Clear staff session and logout
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Clear session cookie
    await clearStaffSessionCookie();
    
    return NextResponse.json(
      { success: true },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/auth/logout error:`, error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
