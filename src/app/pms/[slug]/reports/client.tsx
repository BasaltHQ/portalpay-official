/**
 * Reports Client Component
 * Comprehensive reports and analytics interface with real data
 */

'use client';

import { useState, useMemo } from 'react';
import { PMSCard } from '@/components/pms/shared';
import type { PMSInstance, StaffSession, NightAuditRecord } from '@/lib/pms';

interface ReportsClientProps {
  instance: PMSInstance;
  session: StaffSession;
  totalRooms: number;
  auditHistory: NightAuditRecord[];
}

type ReportType = 'overview' | 'occupancy' | 'revenue' | 'operations';

export function ReportsClient({
  instance,
  session,
  totalRooms,
  auditHistory
}: ReportsClientProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate metrics from audit history
  const metrics = useMemo(() => {
    const filteredAudits = auditHistory.slice(0, dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);

    if (filteredAudits.length === 0) {
      return {
        avgOccupancy: 0,
        avgAdr: 0,
        avgRevPar: 0,
        totalRevenue: 0,
        totalRoomRevenue: 0,
        totalFbRevenue: 0,
        totalOtherRevenue: 0,
        peakOccupancy: 0,
        lowOccupancy: 0,
        totalCheckIns: 0,
        totalCheckOuts: 0,
        occupancyTrend: [] as { date: string; value: number }[],
        revenueTrend: [] as { date: string; value: number }[],
      };
    }

    const avgOccupancy = filteredAudits.reduce((s, a) => s + a.occupancyPercentage, 0) / filteredAudits.length;
    const avgAdr = filteredAudits.reduce((s, a) => s + a.adr, 0) / filteredAudits.length;
    const avgRevPar = filteredAudits.reduce((s, a) => s + a.revPar, 0) / filteredAudits.length;
    const totalRevenue = filteredAudits.reduce((s, a) => s + a.totalRevenue, 0);
    const totalRoomRevenue = filteredAudits.reduce((s, a) => s + a.roomRevenue, 0);
    const totalFbRevenue = filteredAudits.reduce((s, a) => s + a.fbRevenue, 0);
    const totalOtherRevenue = filteredAudits.reduce((s, a) => s + a.otherRevenue, 0);
    const peakOccupancy = Math.max(...filteredAudits.map(a => a.occupancyPercentage));
    const lowOccupancy = Math.min(...filteredAudits.map(a => a.occupancyPercentage));
    const totalCheckIns = filteredAudits.reduce((s, a) => s + a.checkIns, 0);
    const totalCheckOuts = filteredAudits.reduce((s, a) => s + a.checkOuts, 0);

    const occupancyTrend = [...filteredAudits]
      .reverse()
      .map(a => ({ date: a.auditDate, value: a.occupancyPercentage }));
    const revenueTrend = [...filteredAudits]
      .reverse()
      .map(a => ({ date: a.auditDate, value: a.totalRevenue }));

    return {
      avgOccupancy,
      avgAdr,
      avgRevPar,
      totalRevenue,
      totalRoomRevenue,
      totalFbRevenue,
      totalOtherRevenue,
      peakOccupancy,
      lowOccupancy,
      totalCheckIns,
      totalCheckOuts,
      occupancyTrend,
      revenueTrend,
    };
  }, [auditHistory, dateRange]);

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Simple bar chart renderer
  const renderBarChart = (data: { date: string; value: number }[], color: string, maxValue?: number) => {
    if (data.length === 0) return <p className="text-gray-500 text-center py-8">No data available</p>;
    const max = maxValue || Math.max(...data.map(d => d.value));

    return (
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center group"
          >
            <div className="relative w-full">
              <div
                className={`w-full rounded-t transition-all ${color} group-hover:opacity-80`}
                style={{ height: `${max > 0 ? (d.value / max) * 100 : 0}px` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white 
                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {typeof d.value === 'number' && d.value > 100 ? formatCurrency(d.value) : `${d.value.toFixed(0)}%`}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Reports & Analytics</h2>
          <p className="text-sm text-gray-400">Property performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === range
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                  : 'text-gray-400 hover:bg-gray-800'
                }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2">
        {(['overview', 'occupancy', 'revenue', 'operations'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setActiveReport(type)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${activeReport === type
                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl">
              <div className="text-sm text-blue-300 mb-1">Avg Occupancy</div>
              <div className="text-2xl font-bold text-white">{metrics.avgOccupancy.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1">Peak: {metrics.peakOccupancy}%</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl">
              <div className="text-sm text-green-300 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">Room: {formatCurrency(metrics.totalRoomRevenue)}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl">
              <div className="text-sm text-purple-300 mb-1">Avg ADR</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(metrics.avgAdr)}</div>
              <div className="text-xs text-gray-500 mt-1">Avg Daily Rate</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl">
              <div className="text-sm text-orange-300 mb-1">Avg RevPAR</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(metrics.avgRevPar)}</div>
              <div className="text-xs text-gray-500 mt-1">Rev Per Avail Room</div>
            </div>
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PMSCard title="Occupancy Trend" subtitle={`Last ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} days`}>
              {renderBarChart(metrics.occupancyTrend, 'bg-blue-500', 100)}
            </PMSCard>
            <PMSCard title="Revenue Trend" subtitle="Daily total revenue">
              {renderBarChart(metrics.revenueTrend, 'bg-green-500')}
            </PMSCard>
          </div>
        </div>
      )}

      {/* Occupancy Report */}
      {activeReport === 'occupancy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-blue-400">{metrics.avgOccupancy.toFixed(1)}%</div>
                <div className="text-sm text-gray-400 mt-1">Average Occupancy</div>
              </div>
            </PMSCard>
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-green-400">{metrics.peakOccupancy}%</div>
                <div className="text-sm text-gray-400 mt-1">Peak Occupancy</div>
              </div>
            </PMSCard>
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-red-400">{metrics.lowOccupancy}%</div>
                <div className="text-sm text-gray-400 mt-1">Lowest Occupancy</div>
              </div>
            </PMSCard>
          </div>

          <PMSCard title="Daily Occupancy" subtitle="Percentage of rooms occupied">
            <div className="h-48">
              {renderBarChart(metrics.occupancyTrend, 'bg-blue-500', 100)}
            </div>
          </PMSCard>

          <div className="grid grid-cols-2 gap-4">
            <PMSCard title="Room Statistics">
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Rooms</span>
                  <span className="text-white font-medium">{totalRooms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Check-Ins</span>
                  <span className="text-green-400 font-medium">{metrics.totalCheckIns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Check-Outs</span>
                  <span className="text-orange-400 font-medium">{metrics.totalCheckOuts}</span>
                </div>
              </div>
            </PMSCard>
            <PMSCard title="Occupancy Analysis">
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Room Nights Sold</span>
                  <span className="text-white font-medium">
                    {(auditHistory.length > 0 ? auditHistory.reduce((s, a) => s + a.occupancy, 0) / auditHistory.length : 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Variance (Peak-Low)</span>
                  <span className="text-yellow-400 font-medium">{metrics.peakOccupancy - metrics.lowOccupancy}%</span>
                </div>
              </div>
            </PMSCard>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {activeReport === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-green-400">{formatCurrency(metrics.totalRevenue)}</div>
                <div className="text-sm text-gray-400 mt-1">Total Revenue</div>
              </div>
            </PMSCard>
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-blue-400">{formatCurrency(metrics.totalRoomRevenue)}</div>
                <div className="text-sm text-gray-400 mt-1">Room Revenue</div>
              </div>
            </PMSCard>
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-purple-400">{formatCurrency(metrics.totalFbRevenue)}</div>
                <div className="text-sm text-gray-400 mt-1">F&B Revenue</div>
              </div>
            </PMSCard>
            <PMSCard>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-orange-400">{formatCurrency(metrics.totalOtherRevenue)}</div>
                <div className="text-sm text-gray-400 mt-1">Other Revenue</div>
              </div>
            </PMSCard>
          </div>

          <PMSCard title="Revenue Breakdown" subtitle="By category">
            <div className="py-4">
              {/* Revenue breakdown bar */}
              <div className="h-8 rounded-lg overflow-hidden flex mb-4">
                {metrics.totalRevenue > 0 && (
                  <>
                    <div
                      className="bg-blue-500 transition-all"
                      style={{ width: `${(metrics.totalRoomRevenue / metrics.totalRevenue) * 100}%` }}
                    />
                    <div
                      className="bg-purple-500 transition-all"
                      style={{ width: `${(metrics.totalFbRevenue / metrics.totalRevenue) * 100}%` }}
                    />
                    <div
                      className="bg-orange-500 transition-all"
                      style={{ width: `${(metrics.totalOtherRevenue / metrics.totalRevenue) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-gray-400">Room ({metrics.totalRevenue > 0 ? ((metrics.totalRoomRevenue / metrics.totalRevenue) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500" />
                  <span className="text-gray-400">F&B ({metrics.totalRevenue > 0 ? ((metrics.totalFbRevenue / metrics.totalRevenue) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-500" />
                  <span className="text-gray-400">Other ({metrics.totalRevenue > 0 ? ((metrics.totalOtherRevenue / metrics.totalRevenue) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
            </div>
          </PMSCard>

          <PMSCard title="Daily Revenue Trend">
            <div className="h-48">
              {renderBarChart(metrics.revenueTrend, 'bg-green-500')}
            </div>
          </PMSCard>
        </div>
      )}

      {/* Operations Report */}
      {activeReport === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <PMSCard title="Guest Movement">
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="text-green-300">Check-Ins</span>
                  <span className="text-2xl font-bold text-green-400">{metrics.totalCheckIns}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                  <span className="text-orange-300">Check-Outs</span>
                  <span className="text-2xl font-bold text-orange-400">{metrics.totalCheckOuts}</span>
                </div>
              </div>
            </PMSCard>

            <PMSCard title="Key Performance">
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Daily Rate</span>
                  <span className="text-white font-medium">{formatCurrency(metrics.avgAdr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">RevPAR</span>
                  <span className="text-white font-medium">{formatCurrency(metrics.avgRevPar)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Revenue/Day</span>
                  <span className="text-white font-medium">
                    {formatCurrency(auditHistory.length > 0 ? metrics.totalRevenue / auditHistory.length : 0)}
                  </span>
                </div>
              </div>
            </PMSCard>
          </div>

          <PMSCard title="Night Audit History" subtitle="Recent daily summaries">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-right py-3 px-2">Occ %</th>
                    <th className="text-right py-3 px-2">Room Rev</th>
                    <th className="text-right py-3 px-2">F&B Rev</th>
                    <th className="text-right py-3 px-2">Total Rev</th>
                    <th className="text-right py-3 px-2">ADR</th>
                    <th className="text-right py-3 px-2">RevPAR</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.slice(0, 10).map((audit, i) => (
                    <tr key={i} className="border-b border-gray-800 text-gray-300 hover:bg-gray-800/50">
                      <td className="py-3 px-2">{audit.auditDate}</td>
                      <td className="text-right py-3 px-2">{audit.occupancyPercentage}%</td>
                      <td className="text-right py-3 px-2">{formatCurrency(audit.roomRevenue)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(audit.fbRevenue)}</td>
                      <td className="text-right py-3 px-2 text-green-400">{formatCurrency(audit.totalRevenue)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(audit.adr)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(audit.revPar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditHistory.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No audit history available. Run Night Audit to generate reports.
                </p>
              )}
            </div>
          </PMSCard>
        </div>
      )}
    </div>
  );
}
