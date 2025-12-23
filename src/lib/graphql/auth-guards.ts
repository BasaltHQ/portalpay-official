import { GraphQLError } from 'graphql';

export interface AuthContext {
  user: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
  } | null;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
  // Optional request accessor for server-only resolvers
  req?: any;
}

/**
 * Require authentication for a resolver
 */
export function requireAuth(context: AuthContext): void {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
}

/**
 * Require specific permission for a resolver
 */
export function requirePermission(context: AuthContext, permission: string): void {
  requireAuth(context);
  
  if (!context.hasPermission(permission)) {
    throw new GraphQLError(`Permission '${permission}' required`, {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }
}

/**
 * Require specific role for a resolver
 */
export function requireRole(context: AuthContext, roles: string[]): void {
  requireAuth(context);
  
  if (!context.hasRole(roles)) {
    throw new GraphQLError(`One of the following roles required: ${roles.join(', ')}`, {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }
}

/**
 * Higher-order function to wrap resolvers with authentication
 */
export function withAuth<TArgs = unknown, TResult = unknown>(
  resolver: (parent: unknown, args: TArgs, context: AuthContext, info: unknown) => TResult
) {
  return (parent: unknown, args: TArgs, context: AuthContext, info: unknown): TResult => {
    requireAuth(context);
    return resolver(parent, args, context, info);
  };
}

/**
 * Higher-order function to wrap resolvers with permission check
 */
export function withPermission<TArgs = unknown, TResult = unknown>(
  permission: string,
  resolver: (parent: unknown, args: TArgs, context: AuthContext, info: unknown) => TResult
) {
  return (parent: unknown, args: TArgs, context: AuthContext, info: unknown): TResult => {
    requirePermission(context, permission);
    return resolver(parent, args, context, info);
  };
}

/**
 * Higher-order function to wrap resolvers with role check
 */
export function withRole<TArgs = unknown, TResult = unknown>(
  roles: string[],
  resolver: (parent: unknown, args: TArgs, context: AuthContext, info: unknown) => TResult
) {
  return (parent: unknown, args: TArgs, context: AuthContext, info: unknown): TResult => {
    requireRole(context, roles);
    return resolver(parent, args, context, info);
  };
}

/**
 * Check if user can access resource based on ownership or role
 */
export function canAccessResource(
  context: AuthContext,
  resourceUserId: string,
  requiredRoles: string[] = ['Super Admin', 'Manager']
): boolean {
  if (!context.isAuthenticated || !context.user) {
    return false;
  }

  // User can access their own resources
  if (context.user.userId === resourceUserId) {
    return true;
  }

  // Or if they have the required role
  return context.hasRole(requiredRoles);
}

/**
 * Filter data based on user permissions
 */
export function filterByPermissions<T extends { userId?: string; assignedTo?: string }>(
  data: T[],
  context: AuthContext,
  adminRoles: string[] = ['Super Admin', 'Manager']
): T[] {
  if (!context.isAuthenticated || !context.user) {
    return [];
  }

  // Admins can see all data
  if (context.hasRole(adminRoles)) {
    return data;
  }

  // Regular users can only see their own data
  return data.filter(item => 
    item.userId === context.user!.userId || 
    item.assignedTo === context.user!.userId
  );
} 