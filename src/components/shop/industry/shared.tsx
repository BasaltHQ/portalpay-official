/**
 * Shared Components and Helpers for Industry Pack Components
 */

import React from "react";
import {
  Flame,
  Leaf,
  Wheat,
  Check,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Bath,
  Mountain,
  Waves,
  TreePine,
  Building2,
} from "lucide-react";

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface AddToCartConfig {
  itemId: string;
  quantity: number;
  selectedModifiers?: {
    groupId: string;
    modifierId: string;
    name: string;
    priceAdjustment: number;
    quantity?: number;
  }[];
  selectedVariant?: {
    variantId: string;
    sku: string;
    attributes: Record<string, string>;
    priceAdjustment: number;
  };
  bookingDetails?: {
    checkIn: number;
    checkOut: number;
    numberOfGuests: number;
    numberOfNights: number;
    roomNumber?: string;
    selectedAddOns?: string[];
    specialRequests?: string;
  };
  serviceDetails?: {
    selectedAddOns?: string[];
    projectDescription?: string;
    preferredDeliveryDate?: number;
  };
  specialInstructions?: string;
  lineTotal: number;
}

// =============================================================================
// SHARED HELPER COMPONENTS
// =============================================================================

/**
 * Dietary tag badge for restaurant items
 */
export function DietaryTag({ tag }: { tag: string }) {
  const icons: Record<string, React.ReactNode> = {
    'Vegetarian': <Leaf className="h-3 w-3" />,
    'Vegan': <Leaf className="h-3 w-3" />,
    'Gluten-Free': <Wheat className="h-3 w-3" />,
  };
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
      {icons[tag] || null}
      {tag}
    </span>
  );
}

/**
 * Spice level indicator for restaurant items
 */
export function SpiceLevelIndicator({ level }: { level: number }) {
  if (level === 0) return null;
  
  const labels = ['', 'Mild', 'Medium', 'Hot', 'Very Hot', 'Extreme'];
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Flame 
          key={i} 
          className={`h-4 w-4 ${i < level ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`} 
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {labels[level] || ''}
      </span>
    </div>
  );
}

/**
 * Amenity icon for hotel rooms
 */
export function AmenityIcon({ amenity }: { amenity: string }) {
  const lower = amenity.toLowerCase();
  
  if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="h-4 w-4" />;
  if (lower.includes('parking') || lower.includes('car')) return <Car className="h-4 w-4" />;
  if (lower.includes('coffee') || lower.includes('breakfast')) return <Coffee className="h-4 w-4" />;
  if (lower.includes('tv') || lower.includes('television')) return <Tv className="h-4 w-4" />;
  if (lower.includes('ac') || lower.includes('air conditioning') || lower.includes('climate')) return <Wind className="h-4 w-4" />;
  if (lower.includes('bath') || lower.includes('tub') || lower.includes('jacuzzi')) return <Bath className="h-4 w-4" />;
  if (lower.includes('mountain')) return <Mountain className="h-4 w-4" />;
  if (lower.includes('ocean') || lower.includes('sea') || lower.includes('pool') || lower.includes('beach')) return <Waves className="h-4 w-4" />;
  if (lower.includes('garden') || lower.includes('nature')) return <TreePine className="h-4 w-4" />;
  if (lower.includes('city') || lower.includes('urban')) return <Building2 className="h-4 w-4" />;
  
  return <Check className="h-4 w-4" />;
}

/**
 * Price display component
 */
export function PriceDisplay({ 
  amount, 
  suffix, 
  size = 'default',
  className = '' 
}: { 
  amount: number; 
  suffix?: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
}) {
  const sizeClasses = {
    small: 'text-sm font-medium',
    default: 'text-lg font-semibold',
    large: 'text-2xl font-bold',
  };
  
  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      ${amount.toFixed(2)}
      {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
    </span>
  );
}

/**
 * Quantity selector component
 */
export function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="h-10 w-10 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="text-lg font-medium">−</span>
      </button>
      <span className="w-12 text-center font-medium tabular-nums">{value}</span>
      <button
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={disabled || (max !== undefined && value >= max)}
        className="h-10 w-10 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="text-lg font-medium">+</span>
      </button>
    </div>
  );
}

/**
 * Section header component
 */
export function SectionHeader({ 
  title, 
  icon, 
  required = false,
  error,
}: { 
  title: string;
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        {required && <span className="text-red-500 text-xs">*</span>}
      </div>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}

/**
 * Selectable option button
 */
export function SelectableOption({
  selected,
  onClick,
  disabled = false,
  singleSelect = false,
  primaryColor,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  singleSelect?: boolean;
  primaryColor?: string;
  children: React.ReactNode;
}) {
  const accentColor = primaryColor || '#0ea5e9';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-start justify-between p-2.5 rounded-md border-2 transition-all ${
        selected ? '' : 'border-transparent bg-muted/50 hover:bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={selected ? { borderColor: accentColor, backgroundColor: `${accentColor}10` } : {}}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <div 
          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${singleSelect ? 'rounded-full' : 'rounded'} border-2 flex items-center justify-center transition-all`}
          style={{ 
            borderColor: selected ? accentColor : '#d1d5db', 
            backgroundColor: selected ? accentColor : 'transparent' 
          }}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="text-left min-w-0 flex-1">{children}</div>
      </div>
    </button>
  );
}

/**
 * Price adjustment badge
 */
export function PriceAdjustmentBadge({ amount }: { amount: number }) {
  if (amount === 0) return null;
  
  return (
    <span className="text-sm font-medium">
      {amount > 0 ? '+' : ''}${amount.toFixed(2)}
    </span>
  );
}

/**
 * Card container for sections
 */
export function SectionCard({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Summary row for price breakdowns
 */
export function SummaryRow({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string | number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''} ${muted ? 'text-sm text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span>{typeof value === 'number' ? `$${value.toFixed(2)}` : value}</span>
    </div>
  );
}
