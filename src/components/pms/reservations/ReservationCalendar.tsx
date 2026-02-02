/**
 * ReservationCalendar Component
 * Visual calendar grid showing room availability
 */

'use client';

import { useState, useMemo } from 'react';
import { PMSCard } from '../shared';
import type { PMSReservation, RoomInventoryItem } from '@/lib/pms/types';

interface ReservationCalendarProps {
    reservations: PMSReservation[];
    rooms: RoomInventoryItem[];
    onReservationClick: (reservation: PMSReservation) => void;
    onDateRangeClick: (roomId: string, startDate: string, endDate: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/60 hover:bg-yellow-500/80',
    confirmed: 'bg-blue-500/60 hover:bg-blue-500/80',
    checked_in: 'bg-green-500/60 hover:bg-green-500/80',
    checked_out: 'bg-gray-500/40',
    cancelled: 'bg-red-500/30',
    no_show: 'bg-red-500/40',
};

export function ReservationCalendar({
    reservations,
    rooms,
    onReservationClick,
    onDateRangeClick,
}: ReservationCalendarProps) {
    // Default to 14-day view starting from today
    const [viewStartDate, setViewStartDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [daysToShow, setDaysToShow] = useState(14);

    // Generate date range for columns
    const dateColumns = useMemo(() => {
        const dates: Date[] = [];
        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(viewStartDate);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [viewStartDate, daysToShow]);

    // Format date as YYYY-MM-DD
    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    // Get reservations for a room on a specific date
    const getReservationForCell = (roomNumber: string, date: Date): PMSReservation | null => {
        const dateKey = formatDateKey(date);
        return reservations.find(r => {
            return r.roomNumber === roomNumber &&
                r.checkInDate <= dateKey &&
                r.checkOutDate > dateKey;
        }) || null;
    };

    // Check if this is the start of a reservation
    const isReservationStart = (reservation: PMSReservation, date: Date) => {
        return reservation.checkInDate === formatDateKey(date);
    };

    // Calculate reservation span in days from current date
    const getReservationSpan = (reservation: PMSReservation, fromDate: Date) => {
        const checkOut = new Date(reservation.checkOutDate);
        const diffTime = checkOut.getTime() - fromDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.min(diffDays, daysToShow - dateColumns.indexOf(fromDate));
    };

    // Navigation
    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setViewStartDate(today);
    };

    const moveBack = () => {
        const newDate = new Date(viewStartDate);
        newDate.setDate(newDate.getDate() - 7);
        setViewStartDate(newDate);
    };

    const moveForward = () => {
        const newDate = new Date(viewStartDate);
        newDate.setDate(newDate.getDate() + 7);
        setViewStartDate(newDate);
    };

    // Sort rooms by room number
    const sortedRooms = [...rooms].sort((a, b) => {
        const numA = parseInt(a.attributes?.roomNumber || '0');
        const numB = parseInt(b.attributes?.roomNumber || '0');
        return numA - numB;
    });

    // Track which cells are covered by multi-day spans
    const coveredCells = useMemo(() => {
        const covered = new Set<string>();
        sortedRooms.forEach(room => {
            let skipUntilIdx = -1;
            dateColumns.forEach((date, idx) => {
                if (idx <= skipUntilIdx) {
                    covered.add(`${room.attributes?.roomNumber}-${idx}`);
                    return;
                }
                const res = getReservationForCell(room.attributes?.roomNumber || '', date);
                if (res && isReservationStart(res, date)) {
                    const span = getReservationSpan(res, date);
                    for (let i = 1; i < span; i++) {
                        covered.add(`${room.attributes?.roomNumber}-${idx + i}`);
                    }
                    skipUntilIdx = idx + span - 1;
                }
            });
        });
        return covered;
    }, [sortedRooms, dateColumns, reservations]);

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    return (
        <PMSCard>
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={moveBack}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm text-white bg-blue-500/20 border border-blue-500/30 
              rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={moveForward}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <span className="ml-2 text-sm text-gray-400">
                        {viewStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Days:</label>
                    <select
                        value={daysToShow}
                        onChange={(e) => setDaysToShow(parseInt(e.target.value))}
                        className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-sm text-white"
                    >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="21">21 days</option>
                        <option value="30">30 days</option>
                    </select>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500/60" />
                    <span className="text-gray-400">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500/60" />
                    <span className="text-gray-400">Confirmed</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/60" />
                    <span className="text-gray-400">Checked In</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-500/40" />
                    <span className="text-gray-400">Available</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                    <thead>
                        <tr>
                            <th className="p-2 text-left text-xs font-medium text-gray-400 sticky left-0 bg-gray-900 z-10 w-24">
                                Room
                            </th>
                            {dateColumns.map((date, idx) => (
                                <th
                                    key={idx}
                                    className={`p-2 text-center text-xs font-medium min-w-[80px] ${isToday(date) ? 'bg-blue-500/20 text-blue-300' :
                                            isWeekend(date) ? 'bg-gray-800/50 text-gray-400' : 'text-gray-400'
                                        }`}
                                >
                                    <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className="text-sm font-bold">{date.getDate()}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRooms.map(room => {
                            const roomNumber = room.attributes?.roomNumber || 'N/A';
                            const roomType = room.attributes?.roomType || 'Standard';

                            return (
                                <tr key={room.id} className="border-t border-gray-800">
                                    <td className="p-2 sticky left-0 bg-gray-900 z-10">
                                        <div className="text-sm font-medium text-white">{roomNumber}</div>
                                        <div className="text-xs text-gray-500">{roomType}</div>
                                    </td>
                                    {dateColumns.map((date, idx) => {
                                        const cellKey = `${roomNumber}-${idx}`;

                                        // Skip if covered by a multi-day reservation
                                        if (coveredCells.has(cellKey)) {
                                            return null;
                                        }

                                        const reservation = getReservationForCell(roomNumber, date);

                                        if (reservation && isReservationStart(reservation, date)) {
                                            const span = getReservationSpan(reservation, date);

                                            return (
                                                <td
                                                    key={idx}
                                                    colSpan={span}
                                                    onClick={() => onReservationClick(reservation)}
                                                    className={`p-1 cursor-pointer transition-all ${isToday(date) ? 'bg-blue-500/10' : ''
                                                        }`}
                                                >
                                                    <div
                                                        className={`p-2 rounded-lg text-xs text-white cursor-pointer ${STATUS_COLORS[reservation.status] || 'bg-gray-500/50'
                                                            }`}
                                                    >
                                                        <div className="font-medium truncate">{reservation.guestName}</div>
                                                        <div className="text-white/70 truncate">
                                                            {reservation.source === 'direct' ? 'Direct' : reservation.source}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        } else if (!reservation) {
                                            // Empty cell - available
                                            return (
                                                <td
                                                    key={idx}
                                                    onClick={() => {
                                                        const dateStr = formatDateKey(date);
                                                        const nextDay = new Date(date);
                                                        nextDay.setDate(nextDay.getDate() + 1);
                                                        onDateRangeClick(room.id, dateStr, formatDateKey(nextDay));
                                                    }}
                                                    className={`p-1 cursor-pointer hover:bg-gray-700/50 transition-colors ${isToday(date) ? 'bg-blue-500/10' :
                                                            isWeekend(date) ? 'bg-gray-800/30' : ''
                                                        }`}
                                                >
                                                    <div className="h-12 rounded border border-dashed border-gray-700/50" />
                                                </td>
                                            );
                                        }

                                        return <td key={idx} className="p-1" />;
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {rooms.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No rooms configured. Add rooms in inventory to see them here.</p>
                </div>
            )}
        </PMSCard>
    );
}
