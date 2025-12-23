/**
 * PMSLayout Component
 * Main layout wrapper for PMS interface with sidebar navigation
 */

'use client';

import { ReactNode, useState } from 'react';
import { PMSHeader } from './PMSHeader';
import { PMSSidebar } from './PMSSidebar';
import type { StaffSession, PMSInstance } from '@/lib/pms';

interface PMSLayoutProps {
  children: ReactNode;
  session: StaffSession;
  instance: PMSInstance;
}

export function PMSLayout({ children, session, instance }: PMSLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <PMSHeader
        session={session}
        instance={instance}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex pt-16">
        {/* Sidebar */}
        <PMSSidebar
          session={session}
          instance={instance}
          isOpen={sidebarOpen}
        />

        {/* Main Content */}
        <main
          className={`
            flex-1 transition-all duration-300
            ${sidebarOpen ? 'ml-64' : 'ml-0'}
            p-6
          `}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
