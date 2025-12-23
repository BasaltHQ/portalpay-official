/**
 * PMSCard Component
 * Glass-pane styled card for PMS interface
 */

import { ReactNode } from 'react';

interface PMSCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: ReactNode;
}

export function PMSCard({ 
  children, 
  title, 
  subtitle, 
  className = '',
  headerAction,
}: PMSCardProps) {
  return (
    <div 
      className={`
        bg-gray-900/40 backdrop-blur-md 
        border border-gray-700/50 
        rounded-lg shadow-xl
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div>
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
