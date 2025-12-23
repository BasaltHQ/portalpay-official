/**
 * PMS Utility Functions
 * Helper functions for PMS operations
 */

import type {
  PMSFolio,
  FolioCharge,
  FolioPayment,
  PaymentSegment,
  PMSPaymentSplit,
  DashboardMetrics,
  RoomInventoryItem,
  RoomStatus,
} from './types';

// ==================== Folio Calculations ====================

/**
 * Calculate folio totals from charges
 */
export function calculateFolioTotals(
  charges: FolioCharge[],
  taxRate: number = 0
): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = charges.reduce((sum, charge) => {
    return sum + (charge.amount * charge.quantity);
  }, 0);

  const taxableAmount = charges
    .filter(charge => charge.taxable)
    .reduce((sum, charge) => sum + (charge.amount * charge.quantity), 0);

  const tax = taxableAmount * (taxRate / 100);
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Calculate folio balance
 */
export function calculateFolioBalance(
  total: number,
  payments: FolioPayment[]
): number {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.round((total - paid) * 100) / 100;
}

/**
 * Update folio with recalculated totals
 */
export function recalculateFolio(
  folio: PMSFolio,
  taxRate: number = 0
): PMSFolio {
  const { subtotal, tax, total } = calculateFolioTotals(folio.charges, taxRate);
  const balance = calculateFolioBalance(total, folio.payments);

  return {
    ...folio,
    subtotal,
    tax,
    total,
    balance,
    updatedAt: Date.now(),
  };
}

// ==================== Room Number Generation ====================

/**
 * Extract room number from room name or SKU
 */
export function extractRoomNumber(room: RoomInventoryItem): string {
  // Try attributes first
  if (room.attributes?.roomNumber) {
    return room.attributes.roomNumber;
  }
  
  // Try to extract from name (e.g., "Deluxe Room 101")
  const nameMatch = room.name.match(/\d{3,4}$/);
  if (nameMatch) {
    return nameMatch[0];
  }
  
  // Try to extract from SKU (e.g., "ROOM-101")
  const skuMatch = room.sku.match(/\d{3,4}$/);
  if (skuMatch) {
    return skuMatch[0];
  }
  
  return room.sku;
}

// ==================== Folio Number Generation ====================

/**
 * Generate a human-readable folio number
 * Format: YYYYMMDD-XXXX (date + 4-digit sequence)
 */
export function generateFolioNumber(existingFolios: PMSFolio[]): string {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find all folios from today
  const todayFolios = existingFolios.filter(f => 
    f.folioNumber.startsWith(datePrefix)
  );
  
  // Get the next sequence number
  let maxSequence = 0;
  todayFolios.forEach(f => {
    const parts = f.folioNumber.split('-');
    if (parts.length === 2) {
      const seq = parseInt(parts[1], 10);
      if (!isNaN(seq) && seq > maxSequence) {
        maxSequence = seq;
      }
    }
  });
  
  const nextSequence = maxSequence + 1;
  return `${datePrefix}-${String(nextSequence).padStart(4, '0')}`;
}

// ==================== Payment Split Calculations ====================

/**
 * Validate payment split segments add up to total
 */
export function validatePaymentSplit(
  totalAmount: number,
  segments: Array<{ amount: number }>
): { valid: boolean; error?: string } {
  const segmentTotal = segments.reduce((sum, seg) => sum + seg.amount, 0);
  const roundedTotal = Math.round(totalAmount * 100) / 100;
  const roundedSegmentTotal = Math.round(segmentTotal * 100) / 100;
  
  if (roundedSegmentTotal !== roundedTotal) {
    return {
      valid: false,
      error: `Segment total ($${roundedSegmentTotal}) does not match folio total ($${roundedTotal})`,
    };
  }
  
  if (segments.some(seg => seg.amount <= 0)) {
    return {
      valid: false,
      error: 'All segments must have positive amounts',
    };
  }
  
  return { valid: true };
}

/**
 * Check if all segments in a split are completed
 */
export function isPaymentSplitComplete(split: PMSPaymentSplit): boolean {
  return split.segments.every(seg => seg.status === 'completed');
}

/**
 * Get the next pending segment in a split
 */
export function getNextPendingSegment(
  split: PMSPaymentSplit
): PaymentSegment | null {
  return split.segments.find(seg => seg.status === 'pending') || null;
}

/**
 * Calculate cash change
 */
export function calculateChange(
  amountDue: number,
  cashReceived: number
): number {
  const change = cashReceived - amountDue;
  return Math.max(0, Math.round(change * 100) / 100);
}

// ==================== Dashboard Metrics ====================

/**
 * Calculate dashboard metrics from rooms and folios
 */
export function calculateDashboardMetrics(
  rooms: RoomInventoryItem[],
  folios: PMSFolio[]
): DashboardMetrics {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  
  const weekAgo = todayStart - (7 * 24 * 60 * 60 * 1000);
  const monthAgo = todayStart - (30 * 24 * 60 * 60 * 1000);
  
  // Occupancy
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.stockQty === 0).length;
  const availableRooms = totalRooms - occupiedRooms;
  const occupancyPercentage = totalRooms > 0 
    ? Math.round((occupiedRooms / totalRooms) * 100) 
    : 0;
  
  // Revenue
  const openFolios = folios.filter(f => f.status === 'open');
  const checkedOutFolios = folios.filter(f => f.status === 'checked_out');
  
  const todayRevenue = checkedOutFolios
    .filter(f => f.checkedOutAt && f.checkedOutAt >= todayStart)
    .reduce((sum, f) => sum + f.total, 0);
  
  const weekRevenue = checkedOutFolios
    .filter(f => f.checkedOutAt && f.checkedOutAt >= weekAgo)
    .reduce((sum, f) => sum + f.total, 0);
  
  const monthRevenue = checkedOutFolios
    .filter(f => f.checkedOutAt && f.checkedOutAt >= monthAgo)
    .reduce((sum, f) => sum + f.total, 0);
  
  // Check-ins/outs
  const todayCheckIns = openFolios
    .filter(f => f.checkIn >= todayStart && f.checkIn < todayStart + 24 * 60 * 60 * 1000)
    .length;
  
  const todayCheckOuts = openFolios
    .filter(f => f.checkOut >= todayStart && f.checkOut < todayStart + 24 * 60 * 60 * 1000)
    .length;
  
  // Housekeeping
  const cleanRooms = rooms.filter(r => r.attributes?.status === 'available').length;
  const dirtyRooms = rooms.filter(r => r.attributes?.status === 'cleaning').length;
  const inProgressRooms = rooms.filter(r => 
    r.attributes?.status === 'maintenance' || r.attributes?.status === 'out_of_order'
  ).length;
  
  return {
    occupancy: {
      occupied: occupiedRooms,
      available: availableRooms,
      total: totalRooms,
      percentage: occupancyPercentage,
    },
    revenue: {
      today: Math.round(todayRevenue * 100) / 100,
      week: Math.round(weekRevenue * 100) / 100,
      month: Math.round(monthRevenue * 100) / 100,
    },
    checkIns: {
      today: todayCheckIns,
      expected: todayCheckIns, // Could be enhanced with reservations
    },
    checkOuts: {
      today: todayCheckOuts,
      expected: todayCheckOuts,
    },
    housekeeping: {
      clean: cleanRooms,
      dirty: dirtyRooms,
      inProgress: inProgressRooms,
    },
  };
}

// ==================== Date/Time Utilities ====================

/**
 * Check if a date is today
 */
export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format time for display (HH:MM)
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date for display (YYYY-MM-DD)
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 10);
}

/**
 * Calculate number of nights between dates
 */
export function calculateNights(checkIn: number, checkOut: number): number {
  const diff = checkOut - checkIn;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

// ==================== Validation ====================

/**
 * Validate slug format (lowercase letters, numbers, hyphens only)
 */
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone format (basic)
 */
export function validatePhone(phone: string): boolean {
  return /^[\d\s\-\+\(\)]+$/.test(phone);
}

// ==================== Room Status Helpers ====================

/**
 * Get display color for room status
 */
export function getRoomStatusColor(status: RoomStatus): string {
  switch (status) {
    case 'available':
      return 'text-green-400';
    case 'occupied':
      return 'text-blue-400';
    case 'cleaning':
      return 'text-yellow-400';
    case 'maintenance':
      return 'text-orange-400';
    case 'out_of_order':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get display label for room status
 */
export function getRoomStatusLabel(status: RoomStatus): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'occupied':
      return 'Occupied';
    case 'cleaning':
      return 'Cleaning';
    case 'maintenance':
      return 'Maintenance';
    case 'out_of_order':
      return 'Out of Order';
    default:
      return status;
  }
}

// ==================== Currency Formatting ====================

/**
 * Format amount as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
