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

// ==================== Work Orders (Maintenance) ====================

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'furniture' | 'other';

export interface PMSWorkOrder {
  id: string;
  type: 'pms_work_order';
  wallet: string; // PMS instance owner wallet (partition key)
  pmsSlug: string;
  roomId?: string;
  roomNumber?: string;
  location: string; // e.g., "Room 101", "Lobby", "Pool Area"
  category: WorkOrderCategory;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo?: string; // staff user ID
  assignedToName?: string;
  reportedBy: string; // staff user ID
  reportedByName?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number; // minutes
  partsNeeded?: string[];
  notes?: string;
  images?: string[];
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface CreateWorkOrderInput {
  roomId?: string;
  roomNumber?: string;
  location: string;
  category: WorkOrderCategory;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  assignedTo?: string;
  estimatedCost?: number;
  estimatedDuration?: number;
  partsNeeded?: string[];
  notes?: string;
}

export interface UpdateWorkOrderInput {
  title?: string;
  description?: string;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number;
  partsNeeded?: string[];
  notes?: string;
}

// ==================== Cleaning Tasks (Housekeeping) ====================

export type CleaningPriority = 'checkout' | 'stayover' | 'deep_clean' | 'turndown';
export type CleaningStatus = 'pending' | 'in_progress' | 'completed' | 'inspected' | 'failed';

export interface PMSCleaningTask {
  id: string;
  type: 'pms_cleaning_task';
  wallet: string;
  pmsSlug: string;
  roomId: string;
  roomNumber: string;
  priority: CleaningPriority;
  status: CleaningStatus;
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
  specialInstructions?: string[];
  guestCheckoutTime?: number;
  expectedArrivalTime?: number; // for new guest
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  inspectedBy?: string;
  inspectedAt?: number;
  duration?: number; // minutes
}

export interface CreateCleaningTaskInput {
  roomId: string;
  roomNumber: string;
  priority: CleaningPriority;
  assignedTo?: string;
  notes?: string;
  specialInstructions?: string[];
  guestCheckoutTime?: number;
  expectedArrivalTime?: number;
}

// ==================== Reservations ====================

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export interface PMSReservation {
  id: string;
  type: 'pms_reservation';
  wallet: string;
  pmsSlug: string;
  confirmationNumber: string;
  roomId?: string;
  roomNumber: string;
  roomType?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestIdType?: string;
  guestIdNumber?: string;
  guestIdCountry?: string;
  guestDOB?: string;
  guestNationality?: string;
  guestAddress?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string;
  numGuests: { adults: number; children: number };
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
  specialRequests?: string;
  preferences?: Record<string, any>;
  accessibilityNeeds?: string;
  vipStatus?: 'bronze' | 'silver' | 'gold' | 'platinum';
  internalNotes?: string;
  source: 'direct' | 'booking_com' | 'expedia' | 'airbnb' | 'phone' | 'walk_in' | 'corporate' | 'group';
  groupBookingId?: string;
  corporateAccountId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

// ==================== Rate Plans ====================

export interface SeasonalRate {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  multiplier: number; // e.g., 1.5 for 50% increase
  minStay?: number;
}

export interface RatePlan {
  id: string;
  type: 'pms_rate_plan';
  wallet: string;
  pmsSlug: string;
  name: string;
  description?: string;
  roomTypeId: string;
  roomTypeName: string;
  baseRate: number;
  currency: string;
  seasonalAdjustments: SeasonalRate[];
  dayOfWeekModifiers: Record<number, number>; // 0-6 = Sun-Sat, value = multiplier
  minStay: number;
  maxStay?: number;
  includesBreakfast: boolean;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// ==================== Group Bookings ====================

export type GroupBillingType = 'individual' | 'master' | 'split';

export interface GroupBooking {
  id: string;
  type: 'pms_group';
  wallet: string;
  pmsSlug: string;
  name: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  reservationIds: string[];
  masterFolioId?: string;
  billingType: GroupBillingType;
  negotiatedRate?: number;
  totalRooms: number;
  checkInDate: string;
  checkOutDate: string;
  eventType?: 'wedding' | 'conference' | 'tour' | 'sports' | 'corporate' | 'other';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== Corporate Accounts ====================

export interface CorporateAccount {
  id: string;
  type: 'pms_corporate';
  wallet: string;
  pmsSlug: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  billingAddress?: string;
  taxId?: string;
  negotiatedRates: Record<string, number>; // roomTypeId -> rate
  discountPercentage?: number;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: 'prepaid' | 'net_15' | 'net_30' | 'net_60';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// ==================== Guest Messaging ====================

export type MessageType = 'pre_arrival' | 'welcome' | 'during_stay' | 'checkout' | 'post_stay' | 'custom';
export type MessageChannel = 'email' | 'sms' | 'in_app';

export interface PMSMessage {
  id: string;
  type: 'pms_message';
  wallet: string;
  pmsSlug: string;
  folioId?: string;
  reservationId?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  messageType: MessageType;
  channel: MessageChannel;
  subject?: string;
  body: string;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed';
  scheduledFor?: number;
  createdAt: number;
  createdBy: string;
}

// ==================== Night Audit ====================

export interface NightAuditRecord {
  id: string;
  type: 'pms_night_audit';
  wallet: string;
  pmsSlug: string;
  auditDate: string; // YYYY-MM-DD
  occupancy: number;
  totalRooms: number;
  occupancyPercentage: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  adr: number; // Average Daily Rate
  revPar: number; // Revenue Per Available Room
  checkIns: number;
  checkOuts: number;
  noShows: number;
  cancellations: number;
  roomsOutOfOrder: number;
  completedBy: string;
  completedAt: number;
  notes?: string;
}

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

