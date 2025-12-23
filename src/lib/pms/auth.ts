/**
 * PMS Authentication Helpers
 * Staff user authentication, session management, and permission checking
 */

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { StaffSession, Permission } from './types';

const PMS_STAFF_COOKIE = 'pms_staff_token';

// ==================== Password Hashing ====================

/**
 * Hash a password using bcrypt
 * Note: This requires the bcryptjs package
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Failed to hash password:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Failed to verify password:', error);
    return false;
  }
}

// ==================== JWT Token Management ====================

/**
 * Create a JWT token for a staff session
 */
export async function createStaffToken(session: StaffSession): Promise<string> {
  try {
    const { createHmac, createHash } = await import('crypto');
    
    // Use admin private key as secret
    const secret = process.env.THIRDWEB_ADMIN_PRIVATE_KEY || process.env.JWT_SECRET || '';
    if (!secret) {
      throw new Error('JWT secret not configured');
    }
    
    // Hash the secret for extra security
    const secretHash = createHash('sha256').update(secret).digest();
    
    // Create payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'portalpay-pms',
      sub: session.staffId,
      pmsSlug: session.pmsSlug,
      username: session.username,
      role: session.role,
      permissions: session.permissions,
      iat: now,
      exp: now + (8 * 60 * 60), // 8 hours (standard shift length)
    };
    
    // Create JWT manually (header.payload.signature)
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = createHmac('sha256', secretHash)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    
    return `${headerB64}.${payloadB64}.${signature}`;
  } catch (error) {
    console.error('Failed to create staff token:', error);
    throw new Error('Token creation failed');
  }
}

/**
 * Verify and decode a staff JWT token
 */
export async function verifyStaffToken(token: string): Promise<StaffSession | null> {
  try {
    const { createHmac, createHash } = await import('crypto');
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [headerB64, payloadB64, signature] = parts;
    
    // Verify signature
    const secret = process.env.THIRDWEB_ADMIN_PRIVATE_KEY || process.env.JWT_SECRET || '';
    if (!secret) {
      return null;
    }
    
    const secretHash = createHash('sha256').update(secret).digest();
    const expectedSignature = createHmac('sha256', secretHash)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    
    // Check issuer
    if (payload.iss !== 'portalpay-pms') {
      return null;
    }
    
    // Return session
    return {
      staffId: payload.sub || payload.staffId,
      pmsSlug: payload.pmsSlug,
      username: payload.username,
      role: payload.role,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    };
  } catch (error) {
    console.error('Failed to verify staff token:', error);
    return null;
  }
}

// ==================== Session Management ====================

/**
 * Get the current staff session from cookies
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PMS_STAFF_COOKIE)?.value;
    
    if (!token) {
      return null;
    }
    
    return await verifyStaffToken(token);
  } catch (error) {
    console.error('Failed to get staff session:', error);
    return null;
  }
}

/**
 * Require a staff session (throw if not authenticated)
 */
export async function requireStaffSession(
  expectedSlug?: string
): Promise<StaffSession> {
  const session = await getStaffSession();
  
  if (!session) {
    throw new Error('Staff authentication required');
  }
  
  // Verify slug if provided
  if (expectedSlug && session.pmsSlug !== expectedSlug) {
    throw new Error('Access denied to this PMS instance');
  }
  
  return session;
}

/**
 * Set staff session cookie
 */
export async function setStaffSessionCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(PMS_STAFF_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });
  } catch (error) {
    console.error('Failed to set staff session cookie:', error);
    throw new Error('Session cookie creation failed');
  }
}

/**
 * Clear staff session cookie
 */
export async function clearStaffSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(PMS_STAFF_COOKIE);
  } catch (error) {
    console.error('Failed to clear staff session cookie:', error);
  }
}

// ==================== Permission Checking ====================

/**
 * Check if a session has a specific permission
 */
export function hasPermission(
  session: StaffSession,
  permission: Permission
): boolean {
  return session.permissions.includes(permission);
}

/**
 * Require a specific permission (throw if not authorized)
 */
export function requirePermission(
  session: StaffSession,
  permission: Permission
): void {
  if (!hasPermission(session, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Check if a session has any of the specified permissions
 */
export function hasAnyPermission(
  session: StaffSession,
  permissions: Permission[]
): boolean {
  return permissions.some(p => session.permissions.includes(p));
}

/**
 * Check if a session has all of the specified permissions
 */
export function hasAllPermissions(
  session: StaffSession,
  permissions: Permission[]
): boolean {
  return permissions.every(p => session.permissions.includes(p));
}

// ==================== Role Checking ====================

/**
 * Check if session has manager role
 */
export function isManager(session: StaffSession): boolean {
  return session.role === 'manager';
}

/**
 * Require manager role
 */
export function requireManager(session: StaffSession): void {
  if (!isManager(session)) {
    throw new Error('Manager role required');
  }
}

// ==================== Owner Verification ====================

/**
 * Verify that the caller's wallet matches the PMS owner
 * This is used when owners need to perform administrative actions
 * that staff shouldn't have access to (e.g., deleting PMS instance)
 */
export async function verifyPMSOwner(
  walletAddress: string,
  pmsOwnerWallet: string
): Promise<boolean> {
  const normalized1 = String(walletAddress || '').toLowerCase();
  const normalized2 = String(pmsOwnerWallet || '').toLowerCase();
  
  return normalized1 === normalized2 && /^0x[a-f0-9]{40}$/.test(normalized1);
}

// ==================== Username Validation ====================

/**
 * Validate username format
 * - 3-20 characters
 * - Letters, numbers, underscores, hyphens only
 * - Must start with a letter
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }
  
  if (!/^[a-zA-Z]/.test(username)) {
    return { valid: false, error: 'Username must start with a letter' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  
  return { valid: true };
}

// ==================== Constants ====================

export const PMS_AUTH = {
  COOKIE: PMS_STAFF_COOKIE,
  SESSION_DURATION: 8 * 60 * 60, // 8 hours in seconds
} as const;
