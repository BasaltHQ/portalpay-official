/**
 * Housekeeping Client Component
 * Room status management interface
 */

'use client';

import { useState } from 'react';
import { RoomStatusBoard } from '@/components/pms/rooms/RoomStatusBoard';
import { useAllRooms, useUpdateRoomStatus } from '@/lib/pms/hooks';
import type { PMSInstance, RoomInventoryItem, RoomStatus } from '@/lib/pms';

interface HousekeepingClientProps {
  instance: PMSInstance;
}

export function HousekeepingClient({ instance }: HousekeepingClientProps) {
  const [selectedRoom, setSelectedRoom] = useState<RoomInventoryItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch rooms with auto-refresh
  const { rooms, loading, refetch } = useAllRooms(instance.wallet);
  const { updateStatus, updating } = useUpdateRoomStatus(instance.wallet);

  const handleRoomClick = (room: RoomInventoryItem) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleStatusUpdate = async (newStatus: RoomStatus) => {
    if (!selectedRoom) return;

    try {
      await updateStatus(selectedRoom.id, newStatus);
      await refetch();
      setShowModal(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Failed to update room status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-4">Loading rooms...</p>
        </div>
      ) : (
        <RoomStatusBoard
          instance={instance}
          rooms={rooms}
          onRoomClick={handleRoomClick}
        />
      )}

      {/* Room Status Update Modal */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Update Room Status
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                <span className="font-semibold">Room:</span> {selectedRoom.attributes.roomNumber}
              </p>
              <p className="text-gray-300 mb-2">
                <span className="font-semibold">Current Status:</span>{' '}
                <span className="capitalize">{selectedRoom.attributes.status.replace('_', ' ')}</span>
              </p>
              <p className="text-gray-300">
                <span className="font-semibold">Type:</span> {selectedRoom.attributes.roomType}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">
                Change Status To:
              </p>
              
              <button
                onClick={() => handleStatusUpdate('available')}
                disabled={updating || selectedRoom.attributes.status === 'available'}
                className="w-full px-4 py-3 rounded-lg font-medium text-white
                  bg-green-500/20 hover:bg-green-500/30 border border-green-500/30
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ✓ Available (Clean)
              </button>

              <button
                onClick={() => handleStatusUpdate('cleaning')}
                disabled={updating || selectedRoom.attributes.status === 'cleaning'}
                className="w-full px-4 py-3 rounded-lg font-medium text-white
                  bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                🧹 Cleaning In Progress
              </button>

              <button
                onClick={() => handleStatusUpdate('maintenance')}
                disabled={updating || selectedRoom.attributes.status === 'maintenance'}
                className="w-full px-4 py-3 rounded-lg font-medium text-white
                  bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                🔧 Maintenance Required
              </button>

              <button
                onClick={() => handleStatusUpdate('out_of_order')}
                disabled={updating || selectedRoom.attributes.status === 'out_of_order'}
                className="w-full px-4 py-3 rounded-lg font-medium text-white
                  bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ⚠ Out of Order
              </button>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setSelectedRoom(null);
              }}
              disabled={updating}
              className="w-full py-3 rounded-lg font-medium text-gray-300 bg-gray-700/50
                hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
