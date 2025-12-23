import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { requireCsrf, rateLimitOrThrow, rateKey } from '@/lib/security';
import {
  type PMSStaffUser,
  type UpdateStaffUserInput,
  PERMISSIONS,
  
} from '@/lib/pms';
import {
  requireStaffSession,
  requirePermission,
  hashPassword,
  validatePassword
} from '@/lib/pms/auth';;

/**
 * Individual Staff User Management API
 * - PATCH: Update a staff user
 * - DELETE: Delete a staff user
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.MANAGE_STAFF);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_user_update_${slug}`, slug), 30, 60 * 60 * 1000);
    
    // Get existing user
    const container = await getContainer();
    const { resources: users } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Staff user not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const existingUser = users[0] as PMSStaffUser;
    
    // Parse update body
    const body = (await req.json().catch(() => ({}))) as UpdateStaffUserInput;
    
    // Build updated user
    const updated: PMSStaffUser = {
      ...existingUser,
      updatedAt: Date.now(),
    };
    
    // Update password if provided
    if (body.password) {
      const passwordValidation = validatePassword(body.password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.error },
          { status: 400, headers: { 'x-correlation-id': correlationId } }
        );
      }
      updated.passwordHash = await hashPassword(body.password);
    }
    
    // Update role if provided
    if (body.role) {
      const validRoles = ['front_desk', 'housekeeping', 'maintenance', 'manager'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400, headers: { 'x-correlation-id': correlationId } }
        );
      }
      updated.role = body.role;
    }
    
    // Update display name if provided
    if (body.displayName) {
      updated.displayName = String(body.displayName).trim();
    }
    
    // Update permissions if provided
    if (body.permissions && Array.isArray(body.permissions)) {
      updated.permissions = body.permissions;
    }
    
    // Update active status if provided
    if (typeof body.active === 'boolean') {
      updated.active = body.active;
    }
    
    await container.items.upsert(updated);
    
    // Return user without password hash
    const { passwordHash, ...safeUser } = updated;
    
    return NextResponse.json(
      { user: safeUser },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`PATCH /api/pms/${slug}/users/${id} error:`, error);
    
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
      { error: error?.message || 'Failed to update staff user' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string  }> }
) {
  const correlationId = crypto.randomUUID();
  const { slug, id } = await params;
  
  try {
    // Require staff session and permission
    const session = await requireStaffSession(slug);
    requirePermission(session, PERMISSIONS.MANAGE_STAFF);
    
    // CSRF and rate limiting
    requireCsrf(req);
    rateLimitOrThrow(req, rateKey(req, `pms_user_delete_${slug}`, slug), 10, 60 * 60 * 1000);
    
    // Prevent self-deletion
    if (session.staffId === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Get existing user
    const container = await getContainer();
    const { resources: users } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_staff' 
          AND c.pmsSlug = @slug
          AND c.id = @id
        `,
        parameters: [
          { name: '@slug', value: slug },
          { name: '@id', value: id },
        ],
      })
      .fetchAll();
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Staff user not found' },
        { status: 404, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    const user = users[0] as PMSStaffUser;
    
    // Delete the user
    await container.item(user.id, user.wallet).delete();
    
    return NextResponse.json(
      { success: true },
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error: any) {
    console.error(`DELETE /api/pms/${slug}/users/${id} error:`, error);
    
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
      { error: error?.message || 'Failed to delete staff user' },
      { status, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
