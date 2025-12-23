/**
 * CheckInForm Component
 * Guest check-in interface with room selection
 */

'use client';

import { useState, FormEvent } from 'react';
import { PMSCard } from '../shared';
import type { PMSInstance, RoomInventoryItem } from '@/lib/pms';

interface CheckInFormProps {
  instance: PMSInstance;
  availableRooms: RoomInventoryItem[];
  onSuccess: () => void;
}

export function CheckInForm({ instance, availableRooms, onSuccess }: CheckInFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    roomId: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    notes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/pms/${instance.slug}/folios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
          roomId: formData.roomId,
          roomNumber: formData.roomNumber,
          checkIn: new Date(formData.checkIn).getTime(),
          checkOut: new Date(formData.checkOut).getTime(),
          adults: formData.adults,
          children: formData.children,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      // Reset form and call success handler
      setFormData({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        roomId: '',
        roomNumber: '',
        checkIn: '',
        checkOut: '',
        adults: 1,
        children: 0,
        notes: '',
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = availableRooms.find(r => r.id === formData.roomId);

  return (
    <PMSCard title="Guest Check-In" subtitle="Register a new guest">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Guest Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Guest Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.guestEmail}
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="guest@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />
            </div>

            {/* Room Selection - Two Pane Layout */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Room <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-gray-700/50 p-4 bg-gray-800/30">
                {/* Left Pane - Room Types */}
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                    Room Types
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableRooms.map((roomType) => {
                      const roomTypeAny = roomType as any;
                      const availableRoomCount = (roomTypeAny.attributes?.rooms || []).filter(
                        (r: any) => r.status === 'available'
                      ).length;
                      const isSelected = selectedRoomTypeId === roomType.id;
                      
                      return (
                        <button
                          key={roomType.id}
                          type="button"
                          onClick={() => {
                            // Set selected room type and clear any room selection
                            setSelectedRoomTypeId(roomType.id);
                            setFormData({ ...formData, roomId: '', roomNumber: '' });
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          disabled={loading || availableRoomCount === 0}
                        >
                          <div className="font-medium text-white">{roomType.name}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            ${roomType.priceUsd}/night • {availableRoomCount} available
                          </div>
                          {roomType.attributes?.maxOccupancy && (
                            <div className="text-xs text-gray-500 mt-1">
                              Max {roomType.attributes.maxOccupancy} guests
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {availableRooms.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No room types available
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Pane - Available Rooms */}
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                    Available Rooms
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {!selectedRoomTypeId ? (
                      <div className="text-sm text-gray-500 text-center py-8">
                        Select a room type to view available rooms
                      </div>
                    ) : (
                      <>
                        {availableRooms
                          .filter(rt => rt.id === selectedRoomTypeId)
                          .map((roomType) => {
                            const roomTypeAny = roomType as any;
                            const availableRoomsList = (roomTypeAny.attributes?.rooms || []).filter(
                              (r: any) => r.status === 'available'
                            );
                            
                            return availableRoomsList.map((room: any) => {
                              const displayId = `${roomType.id}-${room.roomNumber}`;
                              const isSelected = formData.roomId === roomType.id && formData.roomNumber === room.roomNumber;
                              
                              return (
                                <button
                                  key={displayId}
                                  type="button"
                                  onClick={() => setFormData({ 
                                    ...formData, 
                                    roomId: roomType.id,
                                    roomNumber: room.roomNumber 
                                  })}
                                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-500/10'
                                      : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600'
                                  }`}
                                  disabled={loading}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-white">
                                        Room {room.roomNumber}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        {roomType.name}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            });
                          })}
                        {selectedRoomTypeId && 
                         availableRooms
                           .filter(rt => rt.id === selectedRoomTypeId)
                           .every(rt => ((rt as any).attributes?.rooms || []).filter((r: any) => r.status === 'available').length === 0) && (
                          <div className="text-sm text-gray-500 text-center py-4">
                            No rooms available for this type
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Stay Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Check-In <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Check-Out <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Adults <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Children
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.children}
                onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Special requests or notes..."
              disabled={loading}
            />
          </div>
        </div>

        {/* Summary */}
        {selectedRoom && formData.checkIn && formData.checkOut && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400 font-medium mb-2">Summary</p>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Room: {selectedRoom.name}</p>
              <p>Rate: ${selectedRoom.priceUsd}/night</p>
              <p>
                Nights: {Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || availableRooms.length === 0}
          className="w-full py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
          }}
        >
          {loading ? 'Processing...' : 'Complete Check-In'}
        </button>
      </form>
    </PMSCard>
  );
}
