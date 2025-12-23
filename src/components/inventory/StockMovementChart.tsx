import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, Loader2, BarChart as BarChartIcon } from "lucide-react";

interface StockMovementChartProps {
  className?: string;
  height?: number;
  showControls?: boolean;
}

interface MovementData {
  date: string;
  dateKey: string;
  received: number;
  usage: number;
  adjustments: number;
  totalValue: number;
  netMovement: number;
  transactionCount: number;
}

export default function StockMovementChart({ 
  className = "", 
  height = 300, 
  showControls = true 
}: StockMovementChartProps) {
  const [movementPeriod, setMovementPeriod] = useState<'daily' | 'weekly' | 'yearly'>('daily');
  const [movementDateRange, setMovementDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [movementData, setMovementData] = useState<MovementData[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [hasMovementData, setHasMovementData] = useState(false);

  // Fetch real inventory transaction data
  const fetchMovementData = async () => {
    setMovementLoading(true);
    try {
      const params = new URLSearchParams({
        period: movementPeriod,
        startDate: movementDateRange.start,
        endDate: movementDateRange.end,
      });

      const response = await fetch(`/api/inventory/transactions?${params}`);
      const result = await response.json();

      if (result.success) {
        setMovementData(result.data);
        setHasMovementData(result.data.length > 0 && result.totalTransactions > 0);
      } else {
        console.error('Failed to fetch movement data:', result.error);
        setMovementData([]);
        setHasMovementData(false);
      }
    } catch (error) {
      console.error('Error fetching movement data:', error);
      setMovementData([]);
      setHasMovementData(false);
    } finally {
      setMovementLoading(false);
    }
  };

  // Fetch movement data when period or date range changes
  useEffect(() => {
    fetchMovementData();
  }, [movementPeriod, movementDateRange, fetchMovementData]);

  // Set appropriate date ranges based on period
  const handlePeriodChange = (period: 'daily' | 'weekly' | 'yearly') => {
    setMovementPeriod(period);
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'weekly':
        startDate = new Date(today.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
        break;
      case 'yearly':
        startDate = new Date(today.getFullYear() - 3, 0, 1); // 3 years
        break;
      default:
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    setMovementDateRange({
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stock Movement Trends</CardTitle>
            <CardDescription>Real-time inventory flow analysis</CardDescription>
          </div>
          {showControls && (
            <div className="flex items-center space-x-4">
              {/* Period Selection */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium">Period:</Label>
                <Select value={movementPeriod} onValueChange={(value: 'daily' | 'weekly' | 'yearly') => handlePeriodChange(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Range Selection */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium">From:</Label>
                <Input
                  type="date"
                  value={movementDateRange.start}
                  onChange={(e) => setMovementDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-36"
                />
                <Label className="text-sm font-medium">To:</Label>
                <Input
                  type="date"
                  value={movementDateRange.end}
                  onChange={(e) => setMovementDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-36"
                />
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMovementData}
                disabled={movementLoading}
              >
                {movementLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Chart Container */}
          <div className={`transition-all duration-300 ${!hasMovementData ? 'blur-sm pointer-events-none' : ''}`}>
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={hasMovementData ? movementData : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                />
                <YAxis 
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }} className="text-sm">
                              {entry.name}: {entry.value} units
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Usage"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="received" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="Received"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="netMovement" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Net Movement"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data Unavailable Overlay */}
          {!hasMovementData && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <BarChartIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  More Data Required
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                  {movementLoading 
                    ? "Loading transaction data..." 
                    : "No inventory transactions found for the selected period. Start recording transactions to view trends."
                  }
                </p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {movementLoading && hasMovementData && (
            <div className="absolute top-4 right-4">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Updating...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Legend & Summary */}
        {hasMovementData && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Usage (Outbound)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Received (Inbound)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-300">Net Movement</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 dark:text-gray-400">
                  {movementData.length} data points
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}