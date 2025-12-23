/**
 * PMS (Property Management System) Type Definitions
 * Core TypeScript interfaces for the hotel management system
 */

// ==================== PMS Instance ====================

export interface PMSInstance {
  id: string; // slug
  type: 'pms_instance';
  wallet: string; // owner wallet (partition key)
  name: string; // Hotel name
  slug: string; // URL slug
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  settings: {
    checkInTime: string; // e.g., "15:00"
    checkOutTime: string; // e.g., "11:00"
    currency: string; // USD default
    timezone: string;
    taxRate?: number; // default tax rate percentage
  };
  createdAt: number;
  updatedAt: number;
}

export interface CreatePMSInstanceInput {
  name: string;
  slug: string;
  branding?: Partial<PMSInstance['branding']>;
  settings?: Partial<PMSInstance['settings']>;
  ownerUsername?: string;
  ownerPassword?: string;
}

export interface UpdatePMSInstanceInput {
  name?: string;
  branding?: Partial<PMSInstance['branding']>;
  settings?: Partial<PMSInstance['settings']>;
}

// ==================== Staff Users ====================

export type StaffRole = 'front_desk' | 'housekeeping' | 'maintenance' | 'manager';

export interface PMSStaffUser {
  id: string;
  type: 'pms_staff';
  wallet: string; // PMS instance owner wallet (partition key)
  pmsSlug: string;
  username: string;
  passwordHash: string; // bcrypt hash
  role: StaffRole;
  permissions: string[];
  displayName: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;
}

export interface CreateStaffUserInput {
  username: string;
  password: string;
  role: StaffRole;
  displayName: string;
  permissions?: string[];
}

export interface UpdateStaffUserInput {
  password?: string;
  role?: StaffRole;
  displayName?: string;
  permissions?: string[];
  active?: boolean;
}

export interface StaffLoginInput {
  username: string;
  password: string;
}

export interface StaffSession {
  staffId: string;
  pmsSlug: string;
  username: string;
  role: StaffRole;
  permissions: string[];
}

// ==================== Guest Folio ====================

export type FolioStatus = 'open' | 'checked_out' | 'cancelled';

export interface FolioCharge {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  timestamp: number;
  category: 'room' | 'food' | 'beverage' | 'service' | 'tax' | 'other';
  taxable: boolean;
}

export interface FolioPayment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'wallet';
  timestamp: number;
  receiptId?: string;
  reference?: string;
}

export interface PMSFolio {
  id: string;
  type: 'pms_folio';
  wallet: string; // PMS instance owner wallet (partition key)
  pmsSlug: string;
  folioNumber: string; // human-readable folio number
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestAddress?: string;
  checkIn: number; // timestamp
  checkOut: number; // timestamp
  roomId: string; // reference to inventory item
  roomNumber: string; // for display
  adults: number;
  children: number;
  charges: FolioCharge[];
  payments: FolioPayment[];
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  status: FolioStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string; // staff user ID
  checkedOutBy?: string; // staff user ID
  checkedOutAt?: number;
}

export interface CreateFolioInput {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestAddress?: string;
  checkIn: number;
  checkOut: number;
  roomId: string;
  adults: number;
  children: number;
  notes?: string;
}

export interface AddFolioChargeInput {
  description: string;
  amount: number;
  quantity?: number;
  category?: FolioCharge['category'];
  taxable?: boolean;
}

export interface AddFolioPaymentInput {
  amount: number;
  method: FolioPayment['method'];
  receiptId?: string;
  reference?: string;
}

// ==================== Split Payments ====================

export type PaymentSegmentStatus = 'pending' | 'completed' | 'failed';
export type PaymentSplitStatus = 'in_progress' | 'completed' | 'cancelled';

export interface PaymentSegment {
  id: string;
  amount: number;
  method: 'cash' | 'card';
  status: PaymentSegmentStatus;
  receiptId?: string; // for card payments
  portalUrl?: string; // unique portal per segment
  cashReceived?: number;
  changeGiven?: number;
  completedAt?: number;
  errorMessage?: string;
}

export interface PMSPaymentSplit {
  id: string;
  type: 'pms_payment_split';
  wallet: string; // PMS instance owner wallet (partition key)
  pmsSlug: string;
  folioId: string;
  totalAmount: number;
  segments: PaymentSegment[];
  status: PaymentSplitStatus;
  createdBy: string; // staff user ID
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface CreatePaymentSplitInput {
  folioId: string;
  totalAmount: number;
  segments: Array<{
    amount: number;
    method: 'cash' | 'card';
  }>;
}

export interface ProcessCashSegmentInput {
  cashReceived: number;
}

// ==================== Room Management ====================

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';

export interface RoomInventoryItem {
  id: string;
  sku: string;
  name: string;
  priceUsd: number;
  stockQty: number; // 1 = available, 0 = occupied
  category: string;
  industryPack: 'hotel';
  attributes: {
    roomNumber: string;
    floor: number;
    roomType: string;
    bedType: string;
    bedCount: number;
    maxOccupancy: number;
    amenities: string[];
    status: RoomStatus;
    lastCleaned?: number;
  };
}

// ==================== Guest Profile ====================

export interface GuestProfile {
  id: string;
  type: 'pms_guest';
  wallet: string; // PMS instance owner wallet (partition key)
  pmsSlug: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  preferences?: Record<string, any>;
  totalStays: number;
  totalSpend: number;
  lastVisit?: number;
  createdAt: number;
  updatedAt: number;
}

// ==================== Dashboard Metrics ====================

export interface DashboardMetrics {
  occupancy: {
    occupied: number;
    available: number;
    total: number;
    percentage: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  checkIns: {
    today: number;
    expected: number;
  };
  checkOuts: {
    today: number;
    expected: number;
  };
  housekeeping: {
    clean: number;
    dirty: number;
    inProgress: number;
  };
}

// ==================== Permissions ====================

export const PERMISSIONS = {
  // Front Desk
  VIEW_FOLIOS: 'view_folios',
  CREATE_FOLIO: 'create_folio',
  EDIT_FOLIO: 'edit_folio',
  CHECKOUT: 'checkout',
  ADD_CHARGES: 'add_charges',
  PROCESS_PAYMENT: 'process_payment',
  VIEW_GUESTS: 'view_guests',
  
  // Housekeeping
  VIEW_ROOMS: 'view_rooms',
  UPDATE_ROOM_STATUS: 'update_room_status',
  VIEW_TASKS: 'view_tasks',
  
  // Maintenance
  VIEW_MAINTENANCE: 'view_maintenance',
  CREATE_WORK_ORDER: 'create_work_order',
  UPDATE_WORK_ORDER: 'update_work_order',
  
  // Management
  VIEW_REPORTS: 'view_reports',
  MANAGE_STAFF: 'manage_staff',
  MANAGE_SETTINGS: 'manage_settings',
  PROCESS_REFUND: 'process_refund',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based default permissions
export const DEFAULT_PERMISSIONS: Record<StaffRole, Permission[]> = {
  front_desk: [
    PERMISSIONS.VIEW_FOLIOS,
    PERMISSIONS.CREATE_FOLIO,
    PERMISSIONS.EDIT_FOLIO,
    PERMISSIONS.CHECKOUT,
    PERMISSIONS.ADD_CHARGES,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.VIEW_GUESTS,
    PERMISSIONS.VIEW_ROOMS,
  ],
  housekeeping: [
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.UPDATE_ROOM_STATUS,
    PERMISSIONS.VIEW_TASKS,
  ],
  maintenance: [
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.CREATE_WORK_ORDER,
    PERMISSIONS.UPDATE_WORK_ORDER,
    PERMISSIONS.VIEW_ROOMS,
  ],
  manager: Object.values(PERMISSIONS),
};

// ==================== API Response Types ====================

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
