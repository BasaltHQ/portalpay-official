"use client";

import { ShieldX, Lock, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface PermissionDeniedProps {
  title?: string;
  message?: string;
  variant?: 'full' | 'card' | 'inline';
  showIcon?: boolean;
  className?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export function PermissionDenied({ 
  title = "Access Restricted",
  message = "You don't have permission to access this feature.",
  variant = 'card',
  showIcon = true,
  className = "",
  actionButton
}: PermissionDeniedProps) {
  
  const iconComponent = showIcon ? (
    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 backdrop-blur-sm border border-red-200/30 dark:border-red-800/30 flex items-center justify-center mb-4">
      <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
    </div>
  ) : null;

  const content = (
    <>
      {iconComponent}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{message}</p>
      {actionButton && (
        <Button 
          onClick={actionButton.onClick}
          variant="outline"
          className="mt-2"
        >
          {actionButton.text}
        </Button>
      )}
    </>
  );

  if (variant === 'full') {
    return (
      <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-sm border border-red-200/30 dark:border-red-800/30 ${className}`}>
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{title}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{message}</p>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-lg border-white/20 dark:border-gray-700/30 shadow-lg ${className}`}>
      <CardContent className="p-8 text-center">
        {content}
      </CardContent>
    </Card>
  );
}

interface ProtectedContentProps {
  permissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  hasPermissionCheck: (permission: string) => boolean;
  hasAnyPermissionCheck?: (permissions: string[]) => boolean;
  hasAllPermissionsCheck?: (permissions: string[]) => boolean;
}

export function ProtectedContent({ 
  permissions, 
  requireAll = false,
  fallback,
  children,
  hasPermissionCheck,
  hasAnyPermissionCheck,
  hasAllPermissionsCheck
}: ProtectedContentProps) {
  const hasAccess = requireAll 
    ? hasAllPermissionsCheck ? hasAllPermissionsCheck(permissions) : permissions.every(hasPermissionCheck)
    : hasAnyPermissionCheck ? hasAnyPermissionCheck(permissions) : permissions.some(hasPermissionCheck);

  if (!hasAccess) {
    return fallback || <PermissionDenied variant="inline" />;
  }

  return <>{children}</>;
}

interface ConditionalRenderProps {
  condition: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ConditionalRender({ condition, fallback, children }: ConditionalRenderProps) {
  if (!condition) {
    return fallback || null;
  }
  return <>{children}</>;
}

// Helper component for tabs that require permissions
interface PermissionTabProps {
  hasPermission: boolean;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function PermissionTab({ hasPermission, children, fallbackMessage = "You don't have permission to view this tab." }: PermissionTabProps) {
  if (!hasPermission) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-sm mx-auto">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{fallbackMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
