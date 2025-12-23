/**
 * DashboardMetrics Component
 * Display key metrics cards with animations
 */

'use client';

import { PMSCard } from '../shared';
import type { DashboardMetrics, PMSInstance } from '@/lib/pms/types';
import { formatCurrency } from '@/lib/pms/utils';

interface DashboardMetricsProps {
  metrics: DashboardMetrics;
  instance: PMSInstance;
}

export function DashboardMetricsDisplay({ metrics, instance }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Occupancy Card */}
      <PMSCard>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Occupancy</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metrics.occupancy.percentage}%
            </p>
            <p className="text-sm text-gray-400">
              {metrics.occupancy.occupied} / {metrics.occupancy.total} rooms
            </p>
          </div>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${instance.branding.primaryColor}20` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: instance.branding.primaryColor }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-800/50 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${metrics.occupancy.percentage}%`,
              background: `linear-gradient(90deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
            }}
          />
        </div>
      </PMSCard>

      {/* Revenue Card */}
      <PMSCard>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Today's Revenue</p>
            <p className="text-3xl font-bold text-white mb-2">
              {formatCurrency(metrics.revenue.today, instance.settings.currency)}
            </p>
            <p className="text-sm text-gray-400">
              Week: {formatCurrency(metrics.revenue.week, instance.settings.currency)}
            </p>
          </div>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${instance.branding.secondaryColor}20` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: instance.branding.secondaryColor }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </PMSCard>

      {/* Check-Ins Card */}
      <PMSCard>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Check-Ins Today</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metrics.checkIns.today}
            </p>
            <p className="text-sm text-gray-400">
              Expected: {metrics.checkIns.expected}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/20">
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>
      </PMSCard>

      {/* Check-Outs Card */}
      <PMSCard>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Check-Outs Today</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metrics.checkOuts.today}
            </p>
            <p className="text-sm text-gray-400">
              Expected: {metrics.checkOuts.expected}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/20">
            <svg
              className="w-6 h-6 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>
      </PMSCard>
    </div>
  );
}
