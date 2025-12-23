/**
 * RoomStatusBoard Component
 * Visual grid showing all room statuses
 */

'use client';

import { useState } from 'react';
import { PMSCard, StatusBadge } from '../shared';
import type { PMSInstance, RoomInventoryItem, RoomStatus } from '@/lib/pms';

interface RoomStatusBoardProps {
  instance: PMSInstance;
  rooms: RoomInventoryItem[];
  onRoomClick?: (room: RoomInventoryItem) => void;
  onStatusUpdate?: (roomId: string, newStatus: RoomStatus) => void;
}

export function RoomStatusBoard({ 
  instance, 
  rooms, 
  onRoomClick, 
  onStatusUpdate 
}: RoomStatusBoardProps) {
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');

  // Get unique floors
  const floors = Array.from(new Set(rooms.map(r => r.attributes.floor))).sort((a, b) => a - b);

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const statusMatch = filter === 'all' || room.attributes.status === filter;
    const floorMatch = selectedFloor === 'all' || room.attributes.floor === selectedFloor;
    return statusMatch && floorMatch;
  });

  // Group by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floor = room.attributes.floor;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, RoomInventoryItem[]>);

  // Status counts
  const statusCounts = rooms.reduce((acc, room) => {
    const status = room.attributes.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<RoomStatus, number>);

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'occupied':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'cleaning':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'maintenance':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'out_of_order':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'occupied':
        return '●';
      case 'cleaning':
        return '🧹';
      case 'maintenance':
        return '🔧';
      case 'out_of_order':
        return '⚠';
      default:
        return '?';
    }
  };

  return (
    <PMSCard title="Room Status Board" subtitle="Real-time room availability">
      <div className="space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{rooms.length}</div>
              <div className="text-xs text-gray-400 uppercase">All Rooms</div>
            </div>
          </button>

          <button
            onClick={() => setFilter('available')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'available'
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {statusCounts.available || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase">Available</div>
            </div>
          </button>

          <button
            onClick={() => setFilter('occupied')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'occupied'
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {statusCounts.occupied || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase">Occupied</div>
            </div>
          </button>

          <button
            onClick={() => setFilter('cleaning')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'cleaning'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {statusCounts.cleaning || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase">Cleaning</div>
            </div>
          </button>

          <button
            onClick={() => setFilter('maintenance')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'maintenance'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {statusCounts.maintenance || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase">Maintenance</div>
            </div>
          </button>
        </div>

        {/* Floor Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">Floor:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                selectedFloor === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  selectedFloor === floor
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Floor {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Room Grid by Floor */}
        <div className="space-y-6">
          {Object.entries(roomsByFloor)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([floor, floorRooms]) => (
              <div key={floor} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Floor {floor}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {floorRooms
                    .sort((a, b) => a.attributes.roomNumber.localeCompare(b.attributes.roomNumber))
                    .map(room => (
                      <button
                        key={room.id}
                        onClick={() => onRoomClick?.(room)}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${getStatusColor(room.attributes.status)}`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">
                            {getStatusIcon(room.attributes.status)}
                          </div>
                          <div className="text-lg font-bold">
                            {room.attributes.roomNumber}
                          </div>
                          <div className="text-xs opacity-75 capitalize">
                            {room.attributes.status.replace('_', ' ')}
                          </div>
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
            <p className="text-gray-400">No rooms match the selected filters</p>
          </div>
        )}
      </div>
    </PMSCard>
  );
}
