/**
 * StatusBadge Component
 * Color-coded status indicators for PMS
 */

import type { FolioStatus, RoomStatus, PaymentSegmentStatus } from '@/lib/pms';

interface StatusBadgeProps {
  status: FolioStatus | RoomStatus | PaymentSegmentStatus | string;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  // Folio statuses
  open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  checked_out: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  
  // Room statuses
  available: 'bg-green-500/20 text-green-400 border-green-500/30',
  occupied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cleaning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  maintenance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  out_of_order: 'bg-red-500/20 text-red-400 border-red-500/30',
  
  // Payment statuses
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  out_of_order: 'Out of Order',
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  in_progress: 'In Progress',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  const label = STATUS_LABELS[status] || status;
  
  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full 
        text-xs font-medium border
        ${colorClass}
        ${className}
      `}
    >
      {label}
    </span>
  );
}
