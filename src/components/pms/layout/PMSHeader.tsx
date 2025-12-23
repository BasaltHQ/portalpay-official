/**
 * PMSHeader Component
 * Top navigation bar with branding, user menu, and controls
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StaffSession, PMSInstance } from '@/lib/pms';

interface PMSHeaderProps {
  session: StaffSession;
  instance: PMSInstance;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function PMSHeader({
  session,
  instance,
  onToggleSidebar,
  sidebarOpen,
}: PMSHeaderProps) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`/api/pms/${instance.slug}/auth/logout`, {
        method: 'POST',
      });
      router.push(`/pms/${instance.slug}/login`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 h-16 z-50
        bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50"
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Sidebar toggle + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Hotel Logo/Name */}
          <div className="flex items-center gap-3">
            {instance.branding.logo ? (
              <img
                src={instance.branding.logo}
                alt={instance.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: instance.branding.primaryColor }}
              >
                {instance.name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-semibold text-white">
              {instance.name}
            </span>
          </div>
        </div>

        {/* Right: User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {session.username}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {session.role.replace('_', ' ')}
              </div>
            </div>
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: instance.branding.secondaryColor }}
            >
              {session.username.charAt(0).toUpperCase()}
            </div>
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className="absolute right-0 mt-2 w-48 z-50
                  bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-xl
                  py-1"
              >
                <div className="px-4 py-2 border-b border-gray-700/50">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="text-sm font-medium text-white truncate">
                    {session.username}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300
                    hover:bg-gray-800/50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
