/**
 * Groups Client Component
 * Interactive interface for managing group and corporate bookings
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PMSCard } from '@/components/pms/shared';
import type { PMSInstance, StaffSession, GroupBooking, CorporateAccount } from '@/lib/pms';

interface GroupsClientProps {
    instance: PMSInstance;
    session: StaffSession;
    groups: GroupBooking[];
    corporateAccounts: CorporateAccount[];
}

type TabType = 'groups' | 'corporate';

export function GroupsClient({
    instance,
    session,
    groups: initialGroups,
    corporateAccounts: initialCorporates
}: GroupsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('groups');
    const [groups, setGroups] = useState(initialGroups);
    const [corporateAccounts, setCorporateAccounts] = useState(initialCorporates);
    const [showForm, setShowForm] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupBooking | null>(null);
    const [selectedCorporate, setSelectedCorporate] = useState<CorporateAccount | null>(null);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            inquiry: 'bg-gray-500',
            tentative: 'bg-yellow-500',
            confirmed: 'bg-blue-500',
            definite: 'bg-green-500',
            completed: 'bg-purple-500',
            cancelled: 'bg-red-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    const getEventTypeIcon = (type?: string) => {
        const icons: Record<string, string> = {
            wedding: '💒',
            conference: '🏢',
            tour: '🚌',
            sports: '⚽',
            corporate: '💼',
            other: '📋',
        };
        return icons[type || 'other'] || '📋';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Groups & Corporate</h2>
                    <p className="text-sm text-gray-400">Manage group bookings and corporate accounts</p>
                </div>
                {session.role === 'manager' && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        + New {activeTab === 'groups' ? 'Group' : 'Account'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-700/50 pb-2">
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'groups'
                            ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Group Bookings ({groups.length})
                </button>
                <button
                    onClick={() => setActiveTab('corporate')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'corporate'
                            ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Corporate Accounts ({corporateAccounts.length})
                </button>
            </div>

            {/* Group Bookings List */}
            {activeTab === 'groups' && (
                <div className="space-y-4">
                    {groups.length === 0 ? (
                        <PMSCard>
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">👥</div>
                                <h3 className="text-lg font-medium text-white mb-2">No Group Bookings</h3>
                                <p className="text-gray-500 mb-4">Create your first group booking to get started</p>
                            </div>
                        </PMSCard>
                    ) : (
                        <div className="grid gap-4">
                            {groups.map((group) => (
                                <div
                                    key={group.id}
                                    className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-800/80 
                    transition-colors cursor-pointer"
                                    onClick={() => setSelectedGroup(group)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl">{getEventTypeIcon(group.eventType)}</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getStatusColor(group.billingType)}`}>
                                                        {group.billingType}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400">{group.contactName}</p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    <span>{formatDate(group.checkInDate)} → {formatDate(group.checkOutDate)}</span>
                                                    <span>•</span>
                                                    <span>{group.totalRooms} rooms</span>
                                                    {group.negotiatedRate && (
                                                        <>
                                                            <span>•</span>
                                                            <span>${group.negotiatedRate}/night</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                Reservations
                                            </div>
                                            <div className="text-xl font-bold text-blue-400">
                                                {group.reservationIds?.length || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Corporate Accounts List */}
            {activeTab === 'corporate' && (
                <div className="space-y-4">
                    {corporateAccounts.length === 0 ? (
                        <PMSCard>
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🏢</div>
                                <h3 className="text-lg font-medium text-white mb-2">No Corporate Accounts</h3>
                                <p className="text-gray-500 mb-4">Create your first corporate account to get started</p>
                            </div>
                        </PMSCard>
                    ) : (
                        <div className="grid gap-4">
                            {corporateAccounts.map((corp) => (
                                <div
                                    key={corp.id}
                                    className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-800/80 
                    transition-colors cursor-pointer"
                                    onClick={() => setSelectedCorporate(corp)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-white">{corp.companyName}</h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${corp.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {corp.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">{corp.contactName} • {corp.contactEmail}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span>Terms: {corp.paymentTerms?.replace('_', ' ')}</span>
                                                {corp.discountPercentage && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{corp.discountPercentage}% discount</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Balance</div>
                                            <div className={`text-xl font-bold ${corp.currentBalance > 0 ? 'text-red-400' : 'text-green-400'
                                                }`}>
                                                ${(corp.currentBalance || 0).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                / ${(corp.creditLimit || 0).toLocaleString()} limit
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Group Detail Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                                    <p className="text-sm text-gray-400">{selectedGroup.eventType || 'Group Booking'}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedGroup(null)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Contact</label>
                                    <p className="text-white font-medium">{selectedGroup.contactName}</p>
                                    {selectedGroup.contactEmail && (
                                        <p className="text-sm text-gray-400">{selectedGroup.contactEmail}</p>
                                    )}
                                    {selectedGroup.contactPhone && (
                                        <p className="text-sm text-gray-400">{selectedGroup.contactPhone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Dates</label>
                                    <p className="text-white font-medium">
                                        {formatDate(selectedGroup.checkInDate)} - {formatDate(selectedGroup.checkOutDate)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Total Rooms</label>
                                    <p className="text-white font-medium">{selectedGroup.totalRooms}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Negotiated Rate</label>
                                    <p className="text-white font-medium">
                                        {selectedGroup.negotiatedRate ? `$${selectedGroup.negotiatedRate}/night` : 'Standard rates'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Billing Type</label>
                                    <p className="text-white font-medium capitalize">{selectedGroup.billingType}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Linked Reservations</label>
                                    <p className="text-white font-medium">{selectedGroup.reservationIds?.length || 0}</p>
                                </div>
                            </div>
                            {selectedGroup.notes && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Notes</label>
                                    <p className="text-gray-300 mt-1">{selectedGroup.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Corporate Detail Modal */}
            {selectedCorporate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedCorporate.companyName}</h2>
                                    <p className="text-sm text-gray-400">Corporate Account</p>
                                </div>
                                <button
                                    onClick={() => setSelectedCorporate(null)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Contact</label>
                                    <p className="text-white font-medium">{selectedCorporate.contactName}</p>
                                    <p className="text-sm text-gray-400">{selectedCorporate.contactEmail}</p>
                                    {selectedCorporate.contactPhone && (
                                        <p className="text-sm text-gray-400">{selectedCorporate.contactPhone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
                                    <p className={`font-medium ${selectedCorporate.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                                        {selectedCorporate.isActive ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Payment Terms</label>
                                    <p className="text-white font-medium capitalize">{selectedCorporate.paymentTerms?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Credit Limit</label>
                                    <p className="text-white font-medium">${(selectedCorporate.creditLimit || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Current Balance</label>
                                    <p className={`font-medium ${selectedCorporate.currentBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ${(selectedCorporate.currentBalance || 0).toLocaleString()}
                                    </p>
                                </div>
                                {selectedCorporate.discountPercentage && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase tracking-wide">Discount</label>
                                        <p className="text-green-400 font-medium">{selectedCorporate.discountPercentage}%</p>
                                    </div>
                                )}
                            </div>
                            {selectedCorporate.billingAddress && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Billing Address</label>
                                    <p className="text-gray-300 mt-1">{selectedCorporate.billingAddress}</p>
                                </div>
                            )}
                            {Object.keys(selectedCorporate.negotiatedRates || {}).length > 0 && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Negotiated Rates</label>
                                    <div className="mt-2 space-y-1">
                                        {Object.entries(selectedCorporate.negotiatedRates || {}).map(([roomType, rate]) => (
                                            <div key={roomType} className="flex justify-between text-sm">
                                                <span className="text-gray-400">{roomType}</span>
                                                <span className="text-white">${rate}/night</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
