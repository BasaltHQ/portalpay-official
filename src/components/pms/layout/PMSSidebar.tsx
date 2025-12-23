/**
 * PMSSidebar Component
 * Sidebar navigation with role-based menu items
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { StaffSession, PMSInstance } from '@/lib/pms';

interface PMSSidebarProps {
  session: StaffSession;
  instance: PMSInstance;
  isOpen: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
  permissions?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    label: 'Front Desk',
    href: '/frontdesk',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    roles: ['front_desk', 'manager'],
  },
  {
    label: 'Housekeeping',
    href: '/housekeeping',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['housekeeping', 'manager'],
  },
  {
    label: 'Maintenance',
    href: '/maintenance',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['maintenance', 'manager'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    roles: ['manager'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    roles: ['manager'],
  },
];

export function PMSSidebar({ session, instance, isOpen }: PMSSidebarProps) {
  const pathname = usePathname();
  const basePath = `/pms/${instance.slug}`;

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(session.role);
  });

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    return pathname === fullPath;
  };

  return (
    <aside
      className={`
        fixed left-0 top-16 bottom-0 w-64 z-40
        bg-gray-900/40 backdrop-blur-md border-r border-gray-700/50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <nav className="h-full overflow-y-auto p-4 space-y-2">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const href = `${basePath}${item.href}`;

          return (
            <Link
              key={item.href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800/50'
                }
              `}
              style={
                active
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
                    }
                  : undefined
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50
        bg-gray-900/60 backdrop-blur-sm">
        <p className="text-xs text-gray-500 text-center">
          PMS v1.0.0
        </p>
      </div>
    </aside>
  );
}
