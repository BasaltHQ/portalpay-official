/**
 * Reports Client Component
 * Interactive reports and analytics interface
 */

'use client';

import { PMSCard } from '@/components/pms/shared';
import type { PMSInstance, StaffSession } from '@/lib/pms';

interface ReportsClientProps {
  instance: PMSInstance;
  session: StaffSession;
}

export function ReportsClient({ instance, session }: ReportsClientProps) {
  return (
    <div className="space-y-6">
      <PMSCard
        title="Reports & Analytics"
        subtitle="Generate reports and view property insights"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Reports Module
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The reports module is coming soon. It will provide comprehensive analytics
            including revenue reports, occupancy rates, guest statistics, and more.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-500">
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Revenue Reports
            </div>
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Occupancy Analytics
            </div>
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Guest Statistics
            </div>
            <div className="px-3 py-1 bg-gray-800/50 rounded-full">
              Performance Metrics
            </div>
          </div>
        </div>
      </PMSCard>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PMSCard title="Financial Reports">
          <div className="py-6">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Daily Sales Report
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Monthly Revenue
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Payment Methods
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Tax Summary
              </li>
            </ul>
          </div>
        </PMSCard>

        <PMSCard title="Occupancy Reports">
          <div className="py-6">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Current Occupancy
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Occupancy Trends
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Room Type Performance
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Forecast Report
              </li>
            </ul>
          </div>
        </PMSCard>

        <PMSCard title="Guest Reports">
          <div className="py-6">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Guest Demographics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Stay Duration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Repeat Guests
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Guest Preferences
              </li>
            </ul>
          </div>
        </PMSCard>

        <PMSCard title="Operations Reports">
          <div className="py-6">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Check-in/out Times
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Housekeeping Efficiency
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Maintenance Requests
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Staff Performance
              </li>
            </ul>
          </div>
        </PMSCard>

        <PMSCard title="Marketing Reports">
          <div className="py-6">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Booking Sources
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Marketing ROI
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Guest Acquisition
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Campaign Performance
              </li>
            </ul>
          </div>
        </PMSCard>

        <PMSCard title="Custom Reports">
          <div className="py-6">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Report Builder
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Saved Reports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Scheduled Exports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600">○</span> Data Export
              </li>
            </ul>
          </div>
        </PMSCard>
      </div>
    </div>
  );
}
