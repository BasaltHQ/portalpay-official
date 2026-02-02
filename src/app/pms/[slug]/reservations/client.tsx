/**
 * Reservations Client Component
 * Interactive reservation management with calendar view
 */

'use client';

import { useState, useCallback } from 'react';
import { ReservationCalendar } from '@/components/pms/reservations';
import { PMSCard } from '@/components/pms/shared';
import type {
    PMSInstance,
    StaffSession,
    PMSReservation,
    RoomInventoryItem,
    ReservationStatus,
} from '@/lib/pms';

interface ReservationsClientProps {
    instance: PMSInstance;
    session: StaffSession;
    initialReservations: PMSReservation[];
    rooms: RoomInventoryItem[];
}

export function ReservationsClient({
    instance,
    session,
    initialReservations,
    rooms,
}: ReservationsClientProps) {
    const [reservations, setReservations] = useState<PMSReservation[]>(initialReservations);
    const [selectedReservation, setSelectedReservation] = useState<PMSReservation | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createData, setCreateData] = useState<{ roomId: string; startDate: string; endDate: string } | null>(null);

    // Refresh reservations
    const refreshReservations = useCallback(async () => {
        try {
            const res = await fetch(`/api/pms/${instance.slug}/reservations`);
            const data = await res.json();
            if (data.ok) {
                setReservations(data.reservations || []);
            }
        } catch (err) {
            console.error('Failed to refresh reservations:', err);
        }
    }, [instance.slug]);

    // Handle calendar clicks
    const handleReservationClick = (reservation: PMSReservation) => {
        setSelectedReservation(reservation);
    };

    const handleDateRangeClick = (roomId: string, startDate: string, endDate: string) => {
        setCreateData({ roomId, startDate, endDate });
        setShowCreateModal(true);
    };

    // Status update
    const handleStatusChange = async (id: string, status: ReservationStatus) => {
        try {
            const res = await fetch(`/api/pms/${instance.slug}/reservations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            const data = await res.json();
            if (data.ok) {
                await refreshReservations();
                setSelectedReservation(null);
            }
        } catch (err) {
            console.error('Failed to update reservation:', err);
        }
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Reservation detail modal
    const renderDetailModal = () => {
        if (!selectedReservation) return null;
        const res = selectedReservation;

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">{res.guestName}</h3>
                            <p className="text-sm text-gray-400">Confirmation: {res.confirmationNumber}</p>
                        </div>
                        <button
                            onClick={() => setSelectedReservation(null)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Room</label>
                                <p className="text-white">Room {res.roomNumber} {res.roomType && `(${res.roomType})`}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Guests</label>
                                <p className="text-white">{res.numGuests.adults} adults, {res.numGuests.children} children</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Check-In</label>
                                <p className="text-white">{formatDate(res.checkInDate)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Check-Out</label>
                                <p className="text-white">{formatDate(res.checkOutDate)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Status</label>
                                <p className="text-white capitalize">{res.status.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Source</label>
                                <p className="text-white capitalize">{res.source.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Total</label>
                                <p className="text-xl font-bold text-white">${res.totalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Deposit</label>
                                <p className="text-lg text-green-400">${res.depositAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Balance</label>
                                <p className="text-lg text-yellow-400">${res.balanceDue.toLocaleString()}</p>
                            </div>
                        </div>

                        {res.guestEmail && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Email</label>
                                <p className="text-gray-300">{res.guestEmail}</p>
                            </div>
                        )}

                        {res.guestPhone && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Phone</label>
                                <p className="text-gray-300">{res.guestPhone}</p>
                            </div>
                        )}

                        {res.specialRequests && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Special Requests</label>
                                <p className="text-gray-300">{res.specialRequests}</p>
                            </div>
                        )}

                        {res.internalNotes && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Internal Notes</label>
                                <p className="text-gray-300">{res.internalNotes}</p>
                            </div>
                        )}
                    </div>

                    {/* Status Actions */}
                    <div className="border-t border-gray-700/50 pt-4 space-y-3">
                        <p className="text-sm text-gray-400 font-medium">Actions:</p>
                        <div className="flex gap-2 flex-wrap">
                            {res.status === 'pending' && (
                                <button
                                    onClick={() => handleStatusChange(res.id, 'confirmed')}
                                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg
                    text-blue-300 hover:bg-blue-500/30 transition-colors"
                                >
                                    Confirm Reservation
                                </button>
                            )}
                            {(res.status === 'confirmed' || res.status === 'pending') && (
                                <button
                                    onClick={() => handleStatusChange(res.id, 'checked_in')}
                                    className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg
                    text-green-300 hover:bg-green-500/30 transition-colors"
                                >
                                    Check In Guest
                                </button>
                            )}
                            {res.status === 'checked_in' && (
                                <button
                                    onClick={() => handleStatusChange(res.id, 'checked_out')}
                                    className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg
                    text-gray-300 hover:bg-gray-500/30 transition-colors"
                                >
                                    Check Out
                                </button>
                            )}
                            {res.status !== 'cancelled' && res.status !== 'checked_out' && (
                                <button
                                    onClick={() => handleStatusChange(res.id, 'cancelled')}
                                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg
                    text-red-300 hover:bg-red-500/30 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            {res.status === 'confirmed' && (
                                <button
                                    onClick={() => handleStatusChange(res.id, 'no_show')}
                                    className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg
                    text-orange-300 hover:bg-orange-500/30 transition-colors"
                                >
                                    No Show
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const arrivingToday = reservations.filter(r => r.checkInDate === today && r.status === 'confirmed').length;
    const departingToday = reservations.filter(r => r.checkOutDate === today && r.status === 'checked_in').length;
    const inHouse = reservations.filter(r => r.status === 'checked_in').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Reservations</h2>
                    <p className="text-sm text-gray-400">Manage bookings and availability</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
            font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-all
            flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Reservation
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{arrivingToday}</div>
                    <div className="text-xs text-gray-400">Arriving Today</div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{inHouse}</div>
                    <div className="text-xs text-gray-400">In House</div>
                </div>
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-400">{departingToday}</div>
                    <div className="text-xs text-gray-400">Departing Today</div>
                </div>
            </div>

            {/* Calendar */}
            <ReservationCalendar
                reservations={reservations}
                rooms={rooms}
                onReservationClick={handleReservationClick}
                onDateRangeClick={handleDateRangeClick}
            />

            {/* Detail Modal */}
            {renderDetailModal()}

            {/* Create Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <PMSCard title="New Reservation" subtitle="Create a new booking">
                        <div className="min-w-[400px]">
                            <p className="text-gray-400 mb-4">
                                {createData
                                    ? `Creating reservation for Room starting ${createData.startDate}`
                                    : 'Fill in the reservation details below.'}
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Use the Front Desk → Check In for walk-in guests, or use the API for external bookings.
                            </p>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateData(null);
                                }}
                                className="w-full py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </PMSCard>
                </div>
            )}
        </div>
    );
}
