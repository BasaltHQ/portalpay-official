/**
 * WorkOrderForm Component
 * Create/Edit maintenance work order
 */

'use client';

import { useState, FormEvent } from 'react';
import { PMSCard } from '../shared';
import type {
    PMSWorkOrder,
    CreateWorkOrderInput,
    WorkOrderCategory,
    WorkOrderPriority,
    PMSStaffUser,
    RoomInventoryItem,
} from '@/lib/pms/types';

interface WorkOrderFormProps {
    workOrder?: PMSWorkOrder; // If provided, we're editing
    rooms: RoomInventoryItem[];
    staff: PMSStaffUser[];
    onSubmit: (data: CreateWorkOrderInput) => Promise<void>;
    onCancel: () => void;
}

const CATEGORIES: { value: WorkOrderCategory; label: string; icon: string }[] = [
    { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'hvac', label: 'HVAC', icon: '❄️' },
    { value: 'appliances', label: 'Appliances', icon: '🔌' },
    { value: 'structural', label: 'Structural', icon: '🏗️' },
    { value: 'furniture', label: 'Furniture', icon: '🪑' },
    { value: 'other', label: 'Other', icon: '🔧' },
];

const PRIORITIES: { value: WorkOrderPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-500' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

export function WorkOrderForm({
    workOrder,
    rooms,
    staff,
    onSubmit,
    onCancel,
}: WorkOrderFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateWorkOrderInput>({
        roomId: workOrder?.roomId || '',
        roomNumber: workOrder?.roomNumber || '',
        location: workOrder?.location || '',
        category: workOrder?.category || 'other',
        title: workOrder?.title || '',
        description: workOrder?.description || '',
        priority: workOrder?.priority || 'medium',
        assignedTo: workOrder?.assignedTo || '',
        estimatedCost: workOrder?.estimatedCost,
        estimatedDuration: workOrder?.estimatedDuration,
        notes: workOrder?.notes || '',
    });

    const maintenanceStaff = staff.filter(
        (s) => s.role === 'maintenance' || s.role === 'manager'
    );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to save work order');
        } finally {
            setLoading(false);
        }
    };

    const handleRoomSelect = (roomId: string) => {
        const room = rooms.find((r) => r.id === roomId);
        setFormData({
            ...formData,
            roomId,
            roomNumber: room?.attributes?.roomNumber || '',
            location: room ? `Room ${room.attributes?.roomNumber}` : formData.location,
        });
    };

    return (
        <PMSCard
            title={workOrder ? 'Edit Work Order' : 'Create Work Order'}
            subtitle="Enter the details for this maintenance request"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Category Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category *
                    </label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                className={`p-3 rounded-lg border text-center transition-all ${formData.category === cat.value
                                        ? 'bg-blue-500/20 border-blue-500 text-white'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <span className="text-xl block mb-1">{cat.icon}</span>
                                <span className="text-xs">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Priority Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {PRIORITIES.map((pri) => (
                            <button
                                key={pri.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, priority: pri.value })}
                                className={`p-3 rounded-lg border text-center transition-all ${formData.priority === pri.value
                                        ? `${pri.color}/20 border-current text-white`
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <div className={`w-3 h-3 rounded-full ${pri.color} mx-auto mb-1`} />
                                <span className="text-sm">{pri.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Room (Optional)
                        </label>
                        <select
                            value={formData.roomId || ''}
                            onChange={(e) => handleRoomSelect(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select room...</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    Room {room.attributes?.roomNumber} - {room.attributes?.roomType}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Room 101, Lobby, Pool Area"
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Brief description of the issue"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
              text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                    </label>
                    <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed description of the maintenance issue..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
              text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Assignment */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Assign To
                    </label>
                    <select
                        value={formData.assignedTo || ''}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
              text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Unassigned</option>
                        {maintenanceStaff.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.displayName} ({s.role})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Estimates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estimated Cost ($)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.estimatedCost || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || undefined })}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estimated Duration (minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.estimatedDuration || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || undefined })}
                            placeholder="30"
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Internal Notes
                    </label>
                    <textarea
                        rows={2}
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
              text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 rounded-lg font-medium text-gray-300 bg-gray-700/50
              hover:bg-gray-700 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 rounded-lg font-medium text-white bg-gradient-to-r
              from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
              transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : workOrder ? 'Update Work Order' : 'Create Work Order'}
                    </button>
                </div>
            </form>
        </PMSCard>
    );
}
