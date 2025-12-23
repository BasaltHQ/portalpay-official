"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";

export interface Room {
  roomNumber: string;
  status: 'available' | 'occupied' | 'housekeeping' | 'maintenance';
}

interface HotelFieldsProps {
  isRoomType: boolean;
  setIsRoomType: (isRoom: boolean) => void;
  pricePerNight?: number;
  setPricePerNight: (price?: number) => void;
  maxOccupancy?: number;
  setMaxOccupancy: (occupancy?: number) => void;
  amenities: string[];
  setAmenities: (amenities: string[]) => void;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
}

const AMENITY_OPTIONS = [
  "WiFi",
  "TV",
  "Mini-bar",
  "Room Service",
  "Balcony",
  "Ocean View",
  "King Bed",
  "Twin Beds",
];

const ROOM_STATUS_OPTIONS: Array<{ value: Room['status']; label: string; color: string }> = [
  { value: 'available', label: 'Available', color: 'text-green-600' },
  { value: 'occupied', label: 'Occupied', color: 'text-red-600' },
  { value: 'housekeeping', label: 'Housekeeping', color: 'text-blue-600' },
  { value: 'maintenance', label: 'Maintenance', color: 'text-amber-600' },
];

export function HotelFields({
  isRoomType,
  setIsRoomType,
  pricePerNight,
  setPricePerNight,
  maxOccupancy,
  setMaxOccupancy,
  amenities,
  setAmenities,
  rooms,
  setRooms,
}: HotelFieldsProps) {
  const [newRoomNumber, setNewRoomNumber] = React.useState("");

  function toggleAmenity(amenity: string) {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  }

  function addRoom() {
    const trimmed = newRoomNumber.trim();
    if (!trimmed) return;

    // Check if room number already exists
    if (rooms.some((r) => r.roomNumber === trimmed)) {
      return;
    }

    const newRoom: Room = {
      roomNumber: trimmed,
      status: 'available',
    };

    setRooms([...rooms, newRoom]);
    setNewRoomNumber("");
  }

  function removeRoom(roomNumber: string) {
    setRooms(rooms.filter((r) => r.roomNumber !== roomNumber));
  }

  function updateRoomStatus(roomNumber: string, status: Room['status']) {
    setRooms(
      rooms.map((r) =>
        r.roomNumber === roomNumber ? { ...r, status } : r
      )
    );
  }

  return (
    <div className="md:col-span-2 rounded-md border p-3 space-y-4">
      <div className="text-sm font-medium">Hotel-Specific Fields</div>

      {/* Room Type Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRoomType}
            onChange={(e) => setIsRoomType(e.target.checked)}
          />
          <span>This is a Room Type</span>
        </label>
        <div className="microtext text-muted-foreground mt-1">
          {isRoomType
            ? "Room-specific fields are shown below"
            : "Unchecked = regular hotel service (spa, restaurant, etc.)"}
        </div>
      </div>

      {/* Room Type Fields (shown only when isRoomType is true) */}
      {isRoomType && (
        <>
          {/* Price Per Night */}
          <div>
            <label className="microtext text-muted-foreground">Price Per Night</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
              placeholder="e.g., 150.00"
              value={pricePerNight ?? ""}
              onChange={(e) =>
                setPricePerNight(e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <div className="microtext text-muted-foreground mt-1">
              Nightly rate for this room type
            </div>
          </div>

          {/* Max Occupancy */}
          <div>
            <label className="microtext text-muted-foreground">Max Occupancy</label>
            <input
              type="number"
              min={1}
              step={1}
              className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
              placeholder="e.g., 2"
              value={maxOccupancy ?? ""}
              onChange={(e) =>
                setMaxOccupancy(
                  e.target.value ? Math.max(1, Number(e.target.value)) : undefined
                )
              }
            />
            <div className="microtext text-muted-foreground mt-1">
              Maximum number of guests
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="microtext text-muted-foreground">Amenities</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          {/* Room Numbers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="microtext text-muted-foreground">Room Numbers</label>
              <span className="microtext text-muted-foreground">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add Room Input */}
            <div className="flex items-center gap-2 mb-3">
              <input
                className="flex-1 h-9 px-3 py-1 border rounded-md bg-background"
                placeholder="Room number (e.g., 101)"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRoom();
                  }
                }}
              />
              <button
                type="button"
                onClick={addRoom}
                className="h-9 px-3 rounded-md border text-sm flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {/* Room List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rooms.map((room) => (
                <div
                  key={room.roomNumber}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{room.roomNumber}</span>
                    <select
                      className="h-7 px-2 py-1 border rounded-md bg-background text-xs"
                      value={room.status}
                      onChange={(e) =>
                        updateRoomStatus(room.roomNumber, e.target.value as Room['status'])
                      }
                    >
                      {ROOM_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`text-xs font-medium ${
                        ROOM_STATUS_OPTIONS.find((o) => o.value === room.status)?.color
                      }`}
                    >
                      {ROOM_STATUS_OPTIONS.find((o) => o.value === room.status)?.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRoom(room.roomNumber)}
                    className="h-7 px-2 rounded-md border text-xs"
                    title="Remove room"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {rooms.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  No rooms added yet. Enter a room number above to add.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
