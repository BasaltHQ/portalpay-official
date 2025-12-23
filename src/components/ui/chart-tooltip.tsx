"use client";

import React from "react";
import { useTheme } from "next-themes";

interface Payload {
  name: string;
  value: number | string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Payload[];
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: number | string, name: string) => [string, string];
}

export function CustomChartTooltip({ 
  active, 
  payload, 
  label, 
  labelFormatter,
  formatter 
}: CustomTooltipProps) {
  const { theme } = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <div className={`rounded-lg shadow-lg p-3 text-sm border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {label && (
          <p className="font-medium mb-2">
            {labelFormatter ? labelFormatter(label) : label}
          </p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
              {entry.name}:
            </span>
            <span className="font-medium">
              {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// Default export for easier importing
export default CustomChartTooltip; 