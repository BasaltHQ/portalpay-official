/**
 * Night Audit Client Component
 * Interactive end-of-day workflow interface
 */

'use client';

import { useState } from 'react';
import { PMSCard } from '@/components/pms/shared';
import type {
    PMSInstance,
    StaffSession,
    PMSFolio,
    NightAuditRecord,
} from '@/lib/pms';

interface NightAuditClientProps {
    instance: PMSInstance;
    session: StaffSession;
    auditDate: string;
    existingAudit: NightAuditRecord | null;
    openFolios: PMSFolio[];
    totalRooms: number;
}

export function NightAuditClient({
    instance,
    session,
    auditDate,
    existingAudit,
    openFolios,
    totalRooms,
}: NightAuditClientProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [auditComplete, setAuditComplete] = useState(!!existingAudit);

    // Calculate metrics
    const occupancy = openFolios.length;
    const occupancyPercentage = totalRooms > 0 ? Math.round((occupancy / totalRooms) * 100) : 0;

    // Sum up revenue from folios for the day
    const roomRevenue = openFolios.reduce((sum, folio) => {
        const todayCharges = (folio.charges || [])
            .filter(c => new Date(c.timestamp).toISOString().split('T')[0] === auditDate)
            .filter(c => c.category === 'room')
            .reduce((s, c) => s + c.amount, 0);
        return sum + todayCharges;
    }, 0);

    const fbRevenue = openFolios.reduce((sum, folio) => {
        const todayCharges = (folio.charges || [])
            .filter(c => new Date(c.timestamp).toISOString().split('T')[0] === auditDate)
            .filter(c => c.category === 'food' || c.category === 'beverage')
            .reduce((s, c) => s + c.amount, 0);
        return sum + todayCharges;
    }, 0);

    const otherRevenue = openFolios.reduce((sum, folio) => {
        const todayCharges = (folio.charges || [])
            .filter(c => new Date(c.timestamp).toISOString().split('T')[0] === auditDate)
            .filter(c => c.category !== 'room' && c.category !== 'food' && c.category !== 'beverage')
            .reduce((s, c) => s + c.amount, 0);
        return sum + todayCharges;
    }, 0);

    const totalRevenue = roomRevenue + fbRevenue + otherRevenue;
    const adr = occupancy > 0 ? roomRevenue / occupancy : 0;
    const revPar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

    // Run night audit
    const runAudit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pms/${instance.slug}/night-audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auditDate,
                    notes,
                    occupancy,
                    totalRooms,
                    occupancyPercentage,
                    roomRevenue,
                    fbRevenue,
                    otherRevenue,
                    totalRevenue,
                    adr,
                    revPar,
                    checkIns: 0, // Would be calculated from actual checkin data
                    checkOuts: 0,
                    noShows: 0,
                    cancellations: 0,
                    roomsOutOfOrder: 0,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setAuditComplete(true);
            }
        } catch (err) {
            console.error('Failed to run night audit:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // If audit already completed
    if (auditComplete && existingAudit) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Night Audit Complete</h2>
                    <p className="text-gray-400">Audit for {formatDate(auditDate)} has been completed.</p>
                </div>

                <PMSCard title="Audit Summary" subtitle={`Completed at ${new Date(existingAudit.completedAt).toLocaleString()}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-white">{existingAudit.occupancyPercentage}%</div>
                            <div className="text-xs text-gray-500">Occupancy</div>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-400">{formatCurrency(existingAudit.totalRevenue)}</div>
                            <div className="text-xs text-gray-500">Total Revenue</div>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-400">{formatCurrency(existingAudit.adr)}</div>
                            <div className="text-xs text-gray-500">ADR</div>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-400">{formatCurrency(existingAudit.revPar)}</div>
                            <div className="text-xs text-gray-500">RevPAR</div>
                        </div>
                    </div>
                </PMSCard>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-white">Night Audit</h2>
                <p className="text-sm text-gray-400">{formatDate(auditDate)}</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-6">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${s < step ? 'bg-green-500 text-white' :
                            s === step ? 'bg-blue-500 text-white' :
                                'bg-gray-700 text-gray-400'
                            }`}>
                            {s < step ? '✓' : s}
                        </div>
                        {s < 3 && <div className={`w-12 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-700'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Review */}
            {step === 1 && (
                <PMSCard title="Step 1: Review In-House Guests" subtitle={`${occupancy} guests currently checked in`}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-white">{occupancy}</div>
                                <div className="text-xs text-gray-500">Occupied</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-gray-400">{totalRooms - occupancy}</div>
                                <div className="text-xs text-gray-500">Vacant</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-3xl font-bold text-blue-400">{occupancyPercentage}%</div>
                                <div className="text-xs text-gray-500">Occupancy Rate</div>
                            </div>
                        </div>

                        {openFolios.length > 0 && (
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {openFolios.map((folio) => (
                                    <div key={folio.id} className="p-3 bg-gray-800/30 rounded-lg flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-white">{folio.guestName}</span>
                                            <span className="text-gray-500 ml-2">Room {folio.roomNumber}</span>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            Balance: {formatCurrency(folio.balance)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
                font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-all"
                        >
                            Continue to Revenue
                        </button>
                    </div>
                </PMSCard>
            )}

            {/* Step 2: Revenue */}
            {step === 2 && (
                <PMSCard title="Step 2: Review Today's Revenue">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Room Revenue</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(roomRevenue)}</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">F&B Revenue</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(fbRevenue)}</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Other Revenue</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(otherRevenue)}</div>
                            </div>
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                                <div className="text-sm text-green-300 mb-1">Total Revenue</div>
                                <div className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div>
                                <div className="text-sm text-blue-300 mb-1">ADR (Avg Daily Rate)</div>
                                <div className="text-xl font-bold text-blue-400">{formatCurrency(adr)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-purple-300 mb-1">RevPAR</div>
                                <div className="text-xl font-bold text-purple-400">{formatCurrency(revPar)}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 bg-gray-700/50 rounded-lg font-medium text-gray-300
                  hover:bg-gray-700 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
                  font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-all"
                            >
                                Continue to Close Day
                            </button>
                        </div>
                    </div>
                </PMSCard>
            )}

            {/* Step 3: Complete Audit */}
            {step === 3 && (
                <PMSCard title="Step 3: Complete Night Audit">
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-300 text-sm">
                                ⚠️ This action will close the business day for {formatDate(auditDate)}.
                                Once completed, this cannot be undone.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Audit Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Any notes for the night audit record..."
                                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 bg-gray-700/50 rounded-lg font-medium text-gray-300
                  hover:bg-gray-700 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={runAudit}
                                disabled={loading}
                                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg
                  font-medium text-white hover:from-green-600 hover:to-emerald-600 transition-all
                  disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Complete Night Audit'}
                            </button>
                        </div>
                    </div>
                </PMSCard>
            )}
        </div>
    );
}
