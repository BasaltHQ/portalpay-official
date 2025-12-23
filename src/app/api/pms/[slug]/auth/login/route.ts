import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type PMSStaffUser,
  type StaffLoginInput,
} from '@/lib/pms';
import {
  verifyPassword,
  createStaffToken,
  setStaffSessionCookie,
} from '@/lib/pms/auth';

/**
 * Staff Login API
 * POST: Authenticate a staff user with username/password
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Rate limiting (stricter for login attempts)
    rateLimitOrThrow(req, rateKey(req, `pms_login_${slug}`, slug), 10, 15 * 60 * 1000);
    
    // Parse login body
    const body = (await req.json().catch(() => ({}))) as StaffLoginInput;
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Get PMS instance to verify it exists
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
    
    // Find staff user
    const { resources: users } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          AND c.username = @username
          AND c.active = true
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@username', value: username },
        ],
      })
      .fetchAll();
    
    if (!users || users.length === 0) {
      // Don't reveal if username exists
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const staffUser = users[0] as PMSStaffUser;
    
    // Verify password
    const isValid = await verifyPassword(password, staffUser.passwordHash);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Update last login
    const updatedUser: PMSStaffUser = {
      ...staffUser,
      lastLogin: Date.now(),
      updatedAt: Date.now(),
    };
    await container.items.upsert(updatedUser);
    
    // Create session token
    const token = await createStaffToken({
      staffId: staffUser.id,
      pmsSlug: slug,
      username: staffUser.username,
      role: staffUser.role,
      permissions: staffUser.permissions,
    });
    
    // Set session cookie
    await setStaffSessionCookie(token);
    
    // Return success with user info (without password hash)
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
        instance: {
          slug: instance.slug,
          name: instance.name,
          branding: instance.branding,
        },
      },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/auth/login error:`, error);
    
    if (error?.message === 'rate_limited') {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
