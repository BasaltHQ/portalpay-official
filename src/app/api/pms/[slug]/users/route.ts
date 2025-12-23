import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSInstance,
  type PMSStaffUser,
  type CreateStaffUserInput,
  PERMISSIONS,
  DEFAULT_PERMISSIONS,
  
} from '@/lib/pms';
import {
  requireStaffSession,
  requirePermission,
  hashPassword,
  validateUsername,
  validatePassword
} from '@/lib/pms/auth';;

/**
 * Staff User Management API
 * - GET: List all staff users for a PMS instance
 * - POST: Create a new staff user
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.MANAGE_STAFF);
    
    // Get PMS instance to get owner wallet
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
    
    // Get all staff users
    const { resources: users } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          ORDER BY c.createdAt DESC
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();
    
    // Remove password hashes from response
    const safeUsers = (users || []).map(user => {
      const { passwordHash, ...userWithoutPassword } = user as PMSStaffUser;
      return userWithoutPassword;
    });
    
    return NextResponse.json(
      { users: safeUsers },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`GET /api/pms/${slug}/users error:`, error);
    
    const status = error?.message === 'Staff authentication required' ? 401 
      : error?.message?.includes('Permission denied') ? 403 
      : 500;
    
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch staff users' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.MANAGE_STAFF);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_user_create_${slug}`, slug), 20, 60 * 60 * 1000);
    
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
    
    // Parse request body
    const body = (await req.json().catch(() => ({}))) as CreateStaffUserInput;
    
    // Validate required fields
    if (!body.username || !body.password || !body.role || !body.displayName) {
      return NextResponse.json(
        { error: 'Username, password, role, and display name are required' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const username = String(body.username).trim().toLowerCase();
    const displayName = String(body.displayName).trim();
    
    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Validate password
    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Validate role
    const validRoles = ['front_desk', 'housekeeping', 'maintenance', 'manager'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Check if username already exists
    const { resources: existing } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          AND c.username = @username
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@username', value: username },
        ],
      })
      .fetchAll();
    
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(body.password);
    
    // Create staff user
    const now = Date.now();
    const userId = `staff_${slug}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const permissions = body.permissions && Array.isArray(body.permissions)
      ? body.permissions
      : DEFAULT_PERMISSIONS[body.role] || [];
    
    const newUser: PMSStaffUser = {
      id: userId,
      type: 'pms_staff',
      wallet: instance.wallet, // Use instance owner's wallet as partition key
      pmsSlug: slug,
      username,
      passwordHash,
      role: body.role,
      permissions,
      displayName,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    
    await container.items.upsert(newUser);
    
    // Return user without password hash
    const { passwordHash: _, ...safeUser } = newUser;
    
    return NextResponse.json(
      { user: safeUser },
      { status: 201, headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`POST /api/pms/${slug}/users error:`, error);
    
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
      { error: error?.message || 'Failed to create staff user' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
