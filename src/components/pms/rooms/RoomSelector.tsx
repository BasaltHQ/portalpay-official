/**
 * RoomSelector Component
 * Select available rooms for check-in
 */

'use client';

import { useState } from 'react';
import { PMSCard } from '../shared';
import type { RoomInventoryItem } from '@/lib/pms';

interface RoomSelectorProps {
  rooms: RoomInventoryItem[];
  onSelect: (room: RoomInventoryItem) => void;
  selectedRoomId?: string;
}

export function RoomSelector({ rooms, onSelect, selectedRoomId }: RoomSelectorProps) {
  const [filter, setFilter] = useState<string>('all');

  // Get unique room types
  const roomTypes = Array.from(new Set(rooms.map(r => r.attributes.roomType)));

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    if (filter === 'all') return true;
    return room.attributes.roomType === filter;
  });

  // Group by room type
  const roomsByType = filteredRooms.reduce((acc, room) => {
    const type = room.attributes.roomType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(room);
    return acc;
  }, {} as Record<string, RoomInventoryItem[]>);

  return (
    <PMSCard title="Select Room" subtitle="Choose an available room">
      <div className="space-y-6">
        {/* Room Type Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-300">Type:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({rooms.length})
          </button>
          {roomTypes.map(type => {
            const count = rooms.filter(r => r.attributes.roomType === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  filter === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>

        {/* Room Grid by Type */}
        <div className="space-y-6">
          {Object.entries(roomsByType).map(([type, typeRooms]) => (
            <div key={type} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {type} Rooms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeRooms
                  .sort((a, b) => a.attributes.roomNumber.localeCompare(b.attributes.roomNumber))
                  .map(room => (
                    <button
                      key={room.id}
                      onClick={() => onSelect(room)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedRoomId === room.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Room Number and Price */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xl font-bold text-white">
                              Room {room.attributes.roomNumber}
                            </div>
                            <div className="text-sm text-gray-400">
                              Floor {room.attributes.floor}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-400">
                              ${room.priceUsd}
                            </div>
                            <div className="text-xs text-gray-400">per night</div>
                          </div>
                        </div>

                        {/* Room Details */}
                        <div className="pt-2 border-t border-gray-700/50 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>🛏️</span>
                            <span>{room.attributes.bedType} ({room.attributes.bedCount})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>👥</span>
                            <span>Max {room.attributes.maxOccupancy} guests</span>
                          </div>
                        </div>

                        {/* Amenities */}
                        {room.attributes.amenities.length > 0 && (
                          <div className="pt-2">
                            <div className="flex flex-wrap gap-1">
                              {room.attributes.amenities.slice(0, 4).map((amenity, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs rounded bg-gray-700/50 text-gray-300"
                                >
                                  {amenity}
                                </span>
                              ))}
                              {room.attributes.amenities.length > 4 && (
                                <span className="px-2 py-0.5 text-xs rounded bg-gray-700/50 text-gray-400">
                                  +{room.attributes.amenities.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {selectedRoomId === room.id && (
                          <div className="pt-2 flex items-center gap-2 text-sm text-blue-400">
                            <span>✓</span>
                            <span className="font-medium">Selected</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏨</div>
            <p className="text-gray-400">No available rooms of this type</p>
          </div>
        )}
      </div>
    </PMSCard>
  );
}
