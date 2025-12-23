"use client";

/**
 * Hotel Booking Widget Component
 * 
 * Room booking UI for hotel industry pack.
 * Supports:
 * - Date picker for check-in/check-out
 * - Guest count selection
 * - Room selection (when multiple available)
 * - Add-on services selection
 * - Price breakdown with seasonal pricing
 * - Amenity display
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Calendar, 
  Users, 
  Bed, 
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  HotelRoomTypeAttributes,
  HotelRoom,
  calculateHotelBookingTotal,
} from "@/types/inventory";
import { 
  AmenityIcon, 
  SectionCard, 
  SectionHeader, 
  QuantitySelector,
  SummaryRow,
} from "./shared";

// =============================================================================
// TYPES
// =============================================================================

export interface HotelBookingDetails {
  checkIn: number;
  checkOut: number;
  numberOfGuests: number;
  numberOfNights: number;
  roomNumber?: string;
  selectedAddOns: string[];
  specialRequests?: string;
  total: number;
}

export interface HotelBookingWidgetProps {
  /** Room type attributes */
  attributes: HotelRoomTypeAttributes;
  /** Base price per night */
  basePrice: number;
  /** Callback when booking details change */
  onBookingChange: (booking: HotelBookingDetails) => void;
  /** Primary brand color */
  primaryColor?: string;
  /** Initial booking details */
  initialBooking?: Partial<HotelBookingDetails>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateFromInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = getDateFromInput(checkIn);
  const end = getDateFromInput(checkOut);
  if (!start || !end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getSeasonalMultiplier(
  checkIn: Date,
  seasonalPricing?: HotelRoomTypeAttributes['seasonalPricing']
): { multiplier: number; seasonName?: string } {
  if (!seasonalPricing?.length) return { multiplier: 1 };
  
  const month = checkIn.getMonth() + 1;
  const day = checkIn.getDate();
  const checkInMMDD = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  for (const season of seasonalPricing) {
    const start = season.startDate;
    const end = season.endDate;
    
    // Handle season that wraps around year (e.g., Dec to Feb)
    if (start > end) {
      if (checkInMMDD >= start || checkInMMDD <= end) {
        return { multiplier: season.priceMultiplier, seasonName: season.name };
      }
    } else {
      if (checkInMMDD >= start && checkInMMDD <= end) {
        return { multiplier: season.priceMultiplier, seasonName: season.name };
      }
    }
  }
  
  return { multiplier: 1 };
}

// =============================================================================
// ROOM SELECTOR COMPONENT
// =============================================================================

interface RoomSelectorProps {
  rooms: HotelRoom[];
  selectedRoom: string;
  onSelect: (roomNumber: string) => void;
  primaryColor?: string;
}

function RoomSelector({ rooms, selectedRoom, onSelect, primaryColor }: RoomSelectorProps) {
  const availableRooms = rooms.filter(r => r.status === 'available');
  const accentColor = primaryColor || '#0ea5e9';
  
  if (availableRooms.length === 0) {
    return (
      <div className="flex items-center gap-2 text-orange-500 text-sm">
        <AlertCircle className="h-4 w-4" />
        No rooms currently available
      </div>
    );
  }
  
  if (availableRooms.length === 1) {
    return (
      <div className="text-sm text-muted-foreground">
        Room {availableRooms[0].roomNumber} available
      </div>
    );
  }
  
  return (
    <select
      value={selectedRoom}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full h-10 px-3 border rounded-md bg-background text-sm"
    >
      <option value="">Any available room</option>
      {availableRooms.map(room => (
        <option key={room.id} value={room.roomNumber}>
          Room {room.roomNumber}
          {room.floor && ` • Floor ${room.floor}`}
          {room.view && room.view !== 'none' && ` • ${room.view} view`}
        </option>
      ))}
    </select>
  );
}

// =============================================================================
// ADD-ONS SELECTOR COMPONENT
// =============================================================================

interface AddOnsSelectorProps {
  addOns: NonNullable<HotelRoomTypeAttributes['availableAddOns']>;
  selectedAddOns: string[];
  onToggle: (addOnId: string) => void;
  numberOfNights: number;
  primaryColor?: string;
}

function AddOnsSelector({ addOns, selectedAddOns, onToggle, numberOfNights, primaryColor }: AddOnsSelectorProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  return (
    <div className="space-y-2">
      {addOns.map(addOn => {
        const isSelected = selectedAddOns.includes(addOn.id);
        const totalPrice = addOn.perNight ? addOn.price * numberOfNights : addOn.price;
        
        return (
          <button
            key={addOn.id}
            onClick={() => onToggle(addOn.id)}
            className={`w-full flex items-center justify-between p-3 rounded-md border-2 transition-all ${
              isSelected ? '' : 'border-transparent bg-muted/50 hover:bg-muted'
            }`}
            style={isSelected ? { 
              borderColor: accentColor, 
              backgroundColor: `${accentColor}10` 
            } : {}}
          >
            <div className="text-left">
              <div className="text-sm font-medium flex items-center gap-2">
                {isSelected && <Check className="h-4 w-4" style={{ color: accentColor }} />}
                {addOn.name}
              </div>
              {addOn.description && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {addOn.description}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                ${totalPrice.toFixed(2)}
              </div>
              {addOn.perNight && numberOfNights > 1 && (
                <div className="text-xs text-muted-foreground">
                  ${addOn.price.toFixed(2)}/night
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// AMENITIES DISPLAY COMPONENT
// =============================================================================

interface AmenitiesDisplayProps {
  amenities: string[];
}

function AmenitiesDisplay({ amenities }: AmenitiesDisplayProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((amenity, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs"
        >
          <AmenityIcon amenity={amenity} />
          {amenity}
        </span>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function HotelBookingWidget({
  attributes,
  basePrice,
  onBookingChange,
  primaryColor,
  initialBooking,
}: HotelBookingWidgetProps) {
  // Form state
  const [checkInDate, setCheckInDate] = useState(
    initialBooking?.checkIn ? formatDate(new Date(initialBooking.checkIn)) : ''
  );
  const [checkOutDate, setCheckOutDate] = useState(
    initialBooking?.checkOut ? formatDate(new Date(initialBooking.checkOut)) : ''
  );
  const [guests, setGuests] = useState(initialBooking?.numberOfGuests || 1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(
    initialBooking?.selectedAddOns || []
  );
  const [selectedRoom, setSelectedRoom] = useState(
    initialBooking?.roomNumber || ''
  );
  const [specialRequests, setSpecialRequests] = useState(
    initialBooking?.specialRequests || ''
  );
  
  // Get available rooms
  const availableRooms = useMemo(() => 
    (attributes.rooms || []).filter(r => r.status === 'available'),
    [attributes.rooms]
  );
  
  // Calculate number of nights
  const numberOfNights = useMemo(() => 
    calculateNights(checkInDate, checkOutDate),
    [checkInDate, checkOutDate]
  );
  
  // Calculate seasonal pricing
  const { multiplier: seasonalMultiplier, seasonName } = useMemo(() => {
    if (!checkInDate) return { multiplier: 1 };
    const checkIn = getDateFromInput(checkInDate);
    if (!checkIn) return { multiplier: 1 };
    return getSeasonalMultiplier(checkIn, attributes.seasonalPricing);
  }, [checkInDate, attributes.seasonalPricing]);
  
  // Calculate total
  const { total, roomTotal, addOnsTotal } = useMemo(() => {
    if (numberOfNights === 0) return { total: 0, roomTotal: 0, addOnsTotal: 0 };
    
    const roomTotal = basePrice * numberOfNights * seasonalMultiplier;
    
    const selectedAddOnItems = (attributes.availableAddOns || [])
      .filter(a => selectedAddOns.includes(a.id))
      .map(a => ({ price: a.price, perNight: a.perNight }));
    
    const addOnsTotal = selectedAddOnItems.reduce((sum, addOn) => {
      return sum + (addOn.perNight ? addOn.price * numberOfNights : addOn.price);
    }, 0);
    
    return { 
      total: roomTotal + addOnsTotal, 
      roomTotal, 
      addOnsTotal 
    };
  }, [basePrice, numberOfNights, seasonalMultiplier, selectedAddOns, attributes.availableAddOns]);
  
  // Toggle add-on selection
  const handleToggleAddOn = useCallback((addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  }, []);
  
  // Notify parent of changes
  useEffect(() => {
    if (checkInDate && checkOutDate && numberOfNights > 0) {
      const checkIn = getDateFromInput(checkInDate);
      const checkOut = getDateFromInput(checkOutDate);
      
      if (checkIn && checkOut) {
        onBookingChange({
          checkIn: checkIn.getTime(),
          checkOut: checkOut.getTime(),
          numberOfGuests: guests,
          numberOfNights,
          roomNumber: selectedRoom || undefined,
          selectedAddOns,
          specialRequests: specialRequests || undefined,
          total,
        });
      }
    }
  }, [checkInDate, checkOutDate, guests, numberOfNights, selectedRoom, selectedAddOns, specialRequests, total, onBookingChange]);
  
  // Date constraints
  const today = formatDate(new Date());
  const minCheckOut = checkInDate || today;
  
  return (
    <div className="space-y-5">
      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionHeader title="Check-in" icon={<Calendar className="h-4 w-4" />} required />
          <input
            type="date"
            min={today}
            value={checkInDate}
            onChange={(e) => {
              setCheckInDate(e.target.value);
              // Reset check-out if it's before new check-in
              if (checkOutDate && e.target.value >= checkOutDate) {
                setCheckOutDate('');
              }
            }}
            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
          />
          {attributes.checkInTime && (
            <div className="text-xs text-muted-foreground mt-1">
              From {attributes.checkInTime}
            </div>
          )}
        </div>
        <div>
          <SectionHeader title="Check-out" icon={<Calendar className="h-4 w-4" />} required />
          <input
            type="date"
            min={minCheckOut}
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
          />
          {attributes.checkOutTime && (
            <div className="text-xs text-muted-foreground mt-1">
              Until {attributes.checkOutTime}
            </div>
          )}
        </div>
      </div>
      
      {/* Stay constraints info */}
      {(attributes.minNights || attributes.maxNights) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {attributes.minNights && `Min ${attributes.minNights} night${attributes.minNights > 1 ? 's' : ''}`}
          {attributes.minNights && attributes.maxNights && ' • '}
          {attributes.maxNights && `Max ${attributes.maxNights} nights`}
        </div>
      )}
      
      {/* Seasonal pricing notice */}
      {seasonName && seasonalMultiplier !== 1 && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
          <Info className="h-3.5 w-3.5" />
          {seasonName} rates apply ({seasonalMultiplier > 1 ? '+' : ''}{((seasonalMultiplier - 1) * 100).toFixed(0)}%)
        </div>
      )}
      
      {/* Guest Count */}
      <div>
        <SectionHeader title="Guests" icon={<Users className="h-4 w-4" />} />
        <div className="flex items-center gap-4">
          <QuantitySelector
            value={guests}
            min={1}
            max={attributes.maxOccupancy}
            onChange={setGuests}
          />
          <span className="text-sm text-muted-foreground">
            Max {attributes.maxOccupancy} guest{attributes.maxOccupancy > 1 ? 's' : ''}
            {attributes.maxChildren !== undefined && attributes.maxChildren > 0 && 
              ` (+ ${attributes.maxChildren} children)`
            }
          </span>
        </div>
      </div>
      
      {/* Room Selection */}
      {availableRooms.length > 1 && (
        <div>
          <SectionHeader title="Room Preference" icon={<Bed className="h-4 w-4" />} />
          <RoomSelector
            rooms={availableRooms}
            selectedRoom={selectedRoom}
            onSelect={setSelectedRoom}
            primaryColor={primaryColor}
          />
        </div>
      )}
      
      {/* Bed Configuration */}
      {attributes.bedConfiguration && attributes.bedConfiguration.length > 0 && (
        <div>
          <SectionHeader title="Beds" icon={<Bed className="h-4 w-4" />} />
          <div className="text-sm text-muted-foreground">
            {attributes.bedConfiguration.map((bed, i) => (
              <span key={i}>
                {i > 0 && ' + '}
                {bed.count}x {bed.type.charAt(0).toUpperCase() + bed.type.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Room Size */}
      {attributes.roomSize && (
        <div className="text-sm text-muted-foreground">
          Room size: {attributes.roomSize.value} {attributes.roomSize.unit}
        </div>
      )}
      
      {/* Amenities */}
      {attributes.amenities && attributes.amenities.length > 0 && (
        <div>
          <SectionHeader title="Amenities" />
          <AmenitiesDisplay amenities={attributes.amenities} />
        </div>
      )}
      
      {/* Add-ons */}
      {attributes.availableAddOns && attributes.availableAddOns.length > 0 && (
        <div>
          <SectionHeader title="Add-on Services" />
          <AddOnsSelector
            addOns={attributes.availableAddOns}
            selectedAddOns={selectedAddOns}
            onToggle={handleToggleAddOn}
            numberOfNights={numberOfNights || 1}
            primaryColor={primaryColor}
          />
        </div>
      )}
      
      {/* Special Requests */}
      <div>
        <SectionHeader title="Special Requests" />
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requests or preferences..."
          className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
          rows={3}
        />
      </div>
      
      {/* Price Breakdown */}
      {numberOfNights > 0 && (
        <SectionCard className="bg-muted/30">
          <div className="space-y-2">
            <SummaryRow
              label={`$${(basePrice * seasonalMultiplier).toFixed(2)} × ${numberOfNights} night${numberOfNights > 1 ? 's' : ''}`}
              value={roomTotal}
            />
            
            {selectedAddOns.length > 0 && attributes.availableAddOns && 
              attributes.availableAddOns
                .filter(a => selectedAddOns.includes(a.id))
                .map(addOn => (
                  <SummaryRow
                    key={addOn.id}
                    label={`${addOn.name}${addOn.perNight ? ` × ${numberOfNights}` : ''}`}
                    value={addOn.perNight ? addOn.price * numberOfNights : addOn.price}
                    muted
                  />
                ))
            }
            
            <div className="pt-2 border-t">
              <SummaryRow label="Total" value={total} bold />
            </div>
          </div>
        </SectionCard>
      )}
      
      {/* Cancellation Policy */}
      {attributes.cancellationPolicy && (
        <div className="text-xs text-muted-foreground">
          <strong>Cancellation:</strong>{' '}
          {attributes.cancellationPolicy.freeCancellationBefore 
            ? `Free cancellation up to ${attributes.cancellationPolicy.freeCancellationBefore} hours before check-in`
            : attributes.cancellationPolicy.description || 'Contact us for cancellation policy'
          }
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VALIDATION HELPER
// =============================================================================

/**
 * Validate hotel booking details
 */
export function validateHotelBooking(
  attributes: HotelRoomTypeAttributes,
  booking: Partial<HotelBookingDetails>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!booking.checkIn) {
    errors.checkIn = 'Check-in date is required';
  }
  
  if (!booking.checkOut) {
    errors.checkOut = 'Check-out date is required';
  }
  
  if (booking.checkIn && booking.checkOut && booking.checkIn >= booking.checkOut) {
    errors.checkOut = 'Check-out must be after check-in';
  }
  
  if (booking.numberOfNights !== undefined) {
    if (attributes.minNights && booking.numberOfNights < attributes.minNights) {
      errors.nights = `Minimum stay is ${attributes.minNights} night${attributes.minNights > 1 ? 's' : ''}`;
    }
    if (attributes.maxNights && booking.numberOfNights > attributes.maxNights) {
      errors.nights = `Maximum stay is ${attributes.maxNights} nights`;
    }
  }
  
  if (booking.numberOfGuests !== undefined) {
    if (booking.numberOfGuests < 1) {
      errors.guests = 'At least 1 guest is required';
    }
    if (booking.numberOfGuests > attributes.maxOccupancy) {
      errors.guests = `Maximum ${attributes.maxOccupancy} guests allowed`;
    }
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}
