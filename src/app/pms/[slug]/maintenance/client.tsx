/**
 * Maintenance Client Component
 * Interactive maintenance management interface
 */

'use client';

import { PMSCard } from '@/components/pms/shared';
import type { PMSInstance, StaffSession } from '@/lib/pms';

interface MaintenanceClientProps {
  instance: PMSInstance;
  session: StaffSession;
}

export function MaintenanceClient({ instance, session }: MaintenanceClientProps) {
  return (
    <div className="space-y-6">
      <PMSCard
        title="Maintenance Requests"
        subtitle="Track and manage maintenance work orders"
      >
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Maintenance Module
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The maintenance module is coming soon. It will allow you to create, track,
            and manage maintenance requests and work orders for rooms and facilities.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-500">
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Work Order Tracking
            </div>
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Priority Management
            </div>
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Status Updates
            </div>
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Room Assignment
            </div>
          </div>
        </div>
      </PMSCard>

      {/* Quick Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PMSCard title="Open Requests" className="text-center">
          <div className="py-4">
            <div className="text-3xl font-bold text-yellow-400 mb-1">0</div>
            <div className="text-sm text-gray-400">Pending Work Orders</div>
          </div>
        </PMSCard>

        <PMSCard title="In Progress" className="text-center">
          <div className="py-4">
            <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
            <div className="text-sm text-gray-400">Active Jobs</div>
          </div>
        </PMSCard>

        <PMSCard title="Completed Today" className="text-center">
          <div className="py-4">
            <div className="text-3xl font-bold text-green-400 mb-1">0</div>
            <div className="text-sm text-gray-400">Finished Work Orders</div>
          </div>
        </PMSCard>
      </div>
    </div>
  );
}
