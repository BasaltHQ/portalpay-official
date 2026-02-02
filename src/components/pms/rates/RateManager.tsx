/**
 * RateManager Component
 * Manage room rates, seasonal pricing, and day-of-week modifiers
 */

'use client';

import { useState, useEffect } from 'react';
import { PMSCard } from '../shared';
import type { RatePlan, SeasonalRate, RoomInventoryItem } from '@/lib/pms/types';

interface RateManagerProps {
    ratePlans: RatePlan[];
    rooms: RoomInventoryItem[];
    onSave: (ratePlan: Partial<RatePlan>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RateManager({
    ratePlans,
    rooms,
    onSave,
    onDelete,
}: RateManagerProps) {
    const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<RatePlan>>({
        name: '',
        roomTypeId: '',
        roomTypeName: '',
        baseRate: 0,
        currency: 'USD',
        seasonalAdjustments: [],
        dayOfWeekModifiers: {},
        minStay: 1,
        includesBreakfast: false,
        cancellationPolicy: 'moderate',
        isActive: true,
    });

    // Get unique room types
    const roomTypes = rooms.reduce((acc, room) => {
        const type = room.attributes?.roomType || 'Standard';
        const id = type; // Use roomType as the id since roomTypeId doesn't exist
        if (!acc.find(t => t.id === id)) {
            acc.push({ id, name: type });
        }
        return acc;
    }, [] as { id: string; name: string }[]);

    const handleEdit = (plan: RatePlan) => {
        setSelectedPlan(plan);
        setFormData(plan);
        setShowForm(true);
    };

    const handleCreate = () => {
        setSelectedPlan(null);
        setFormData({
            name: '',
            roomTypeId: roomTypes[0]?.id || '',
            roomTypeName: roomTypes[0]?.name || '',
            baseRate: 100,
            currency: 'USD',
            seasonalAdjustments: [],
            dayOfWeekModifiers: { 5: 1.2, 6: 1.2 }, // Default weekend premium
            minStay: 1,
            includesBreakfast: false,
            cancellationPolicy: 'moderate',
            isActive: true,
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSave({
                ...formData,
                id: selectedPlan?.id,
            });
            setShowForm(false);
        } catch (err) {
            console.error('Failed to save rate plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateDayModifier = (day: number, value: number) => {
        setFormData({
            ...formData,
            dayOfWeekModifiers: {
                ...formData.dayOfWeekModifiers,
                [day]: value,
            },
        });
    };

    const addSeasonalRate = () => {
        const newSeason: SeasonalRate = {
            id: `season-${Date.now()}`,
            name: 'New Season',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            multiplier: 1.0,
        };
        setFormData({
            ...formData,
            seasonalAdjustments: [...(formData.seasonalAdjustments || []), newSeason],
        });
    };

    const updateSeasonalRate = (index: number, field: keyof SeasonalRate, value: any) => {
        const updated = [...(formData.seasonalAdjustments || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, seasonalAdjustments: updated });
    };

    const removeSeasonalRate = (index: number) => {
        const updated = [...(formData.seasonalAdjustments || [])];
        updated.splice(index, 1);
        setFormData({ ...formData, seasonalAdjustments: updated });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Rate Plans</h2>
                    <p className="text-sm text-gray-400">Manage pricing for room types</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
            font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                    Add Rate Plan
                </button>
            </div>

            {/* Rate Plans List */}
            <div className="space-y-4">
                {ratePlans.length === 0 ? (
                    <PMSCard>
                        <div className="text-center py-12">
                            <p className="text-gray-400">No rate plans configured</p>
                            <button
                                onClick={handleCreate}
                                className="mt-4 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Create your first rate plan
                            </button>
                        </div>
                    </PMSCard>
                ) : (
                    ratePlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-white">{plan.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs ${plan.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">{plan.roomTypeName}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">
                                        ${plan.baseRate.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500">per night base</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span>Min Stay: {plan.minStay} night{plan.minStay > 1 ? 's' : ''}</span>
                                <span>Policy: {plan.cancellationPolicy}</span>
                                {plan.includesBreakfast && <span>🍳 Breakfast</span>}
                                {plan.seasonalAdjustments?.length > 0 && (
                                    <span>📅 {plan.seasonalAdjustments.length} Season(s)</span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-sm
                    text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(plan.id)}
                                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit/Create Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {selectedPlan ? 'Edit Rate Plan' : 'New Rate Plan'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Standard Rate"
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                      text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Room Type *</label>
                                    <select
                                        value={formData.roomTypeId || ''}
                                        onChange={(e) => {
                                            const type = roomTypes.find(t => t.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                roomTypeId: e.target.value,
                                                roomTypeName: type?.name || '',
                                            });
                                        }}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                      text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {roomTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Base Rate ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.baseRate || ''}
                                        onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                      text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Min Stay (nights)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.minStay || 1}
                                        onChange={(e) => setFormData({ ...formData, minStay: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                      text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Cancel Policy</label>
                                    <select
                                        value={formData.cancellationPolicy || 'moderate'}
                                        onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                      text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="flexible">Flexible</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="strict">Strict</option>
                                        <option value="non_refundable">Non-Refundable</option>
                                    </select>
                                </div>
                            </div>

                            {/* Day of Week Modifiers */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">Day of Week Pricing</label>
                                <div className="grid grid-cols-7 gap-2">
                                    {DAYS.map((day, idx) => (
                                        <div key={day} className="text-center">
                                            <div className="text-xs text-gray-500 mb-1">{day}</div>
                                            <input
                                                type="number"
                                                min="0.5"
                                                max="3"
                                                step="0.1"
                                                value={formData.dayOfWeekModifiers?.[idx] || 1}
                                                onChange={(e) => updateDayModifier(idx, parseFloat(e.target.value) || 1)}
                                                className="w-full px-2 py-2 bg-gray-800/50 border border-gray-700 rounded
                          text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">1.0 = base rate, 1.2 = 20% increase, 0.8 = 20% decrease</p>
                            </div>

                            {/* Seasonal Rates */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-300">Seasonal Rates</label>
                                    <button
                                        type="button"
                                        onClick={addSeasonalRate}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        + Add Season
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(formData.seasonalAdjustments || []).map((season, idx) => (
                                        <div key={season.id} className="grid grid-cols-5 gap-2 p-3 bg-gray-800/30 rounded-lg">
                                            <input
                                                type="text"
                                                value={season.name}
                                                onChange={(e) => updateSeasonalRate(idx, 'name', e.target.value)}
                                                placeholder="Name"
                                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                                            />
                                            <input
                                                type="date"
                                                value={season.startDate}
                                                onChange={(e) => updateSeasonalRate(idx, 'startDate', e.target.value)}
                                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                                            />
                                            <input
                                                type="date"
                                                value={season.endDate}
                                                onChange={(e) => updateSeasonalRate(idx, 'endDate', e.target.value)}
                                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                                            />
                                            <input
                                                type="number"
                                                min="0.5"
                                                max="3"
                                                step="0.1"
                                                value={season.multiplier}
                                                onChange={(e) => updateSeasonalRate(idx, 'multiplier', parseFloat(e.target.value))}
                                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSeasonalRate(idx)}
                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.includesBreakfast || false}
                                        onChange={(e) => setFormData({ ...formData, includesBreakfast: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                                    />
                                    <span className="text-sm text-gray-300">Includes Breakfast</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive !== false}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                                    />
                                    <span className="text-sm text-gray-300">Active</span>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700/50">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-3 rounded-lg font-medium text-gray-300 bg-gray-700/50
                  hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3 rounded-lg font-medium text-white bg-gradient-to-r
                  from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
                  transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Rate Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
