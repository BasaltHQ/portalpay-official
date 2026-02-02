/**
 * WorkOrderList Component
 * Displays list of maintenance work orders with filters
 */

'use client';

import { useState } from 'react';
import { PMSCard, StatusBadge } from '../shared';
import type { PMSWorkOrder, WorkOrderPriority, WorkOrderStatus, PMSStaffUser } from '@/lib/pms/types';

interface WorkOrderListProps {
    workOrders: PMSWorkOrder[];
    staff: PMSStaffUser[];
    onSelect: (workOrder: PMSWorkOrder) => void;
    onStatusChange: (id: string, status: WorkOrderStatus) => void;
    loading?: boolean;
}

const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
    low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
    open: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    assigned: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    in_progress: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const CATEGORY_ICONS: Record<string, string> = {
    plumbing: '🚿',
    electrical: '⚡',
    hvac: '❄️',
    appliances: '🔌',
    structural: '🏗️',
    furniture: '🪑',
    other: '🔧',
};

export function WorkOrderList({
    workOrders,
    staff,
    onSelect,
    onStatusChange,
    loading,
}: WorkOrderListProps) {
    const [filter, setFilter] = useState<{
        status?: WorkOrderStatus;
        priority?: WorkOrderPriority;
    }>({});

    const filteredOrders = workOrders.filter((wo) => {
        if (filter.status && wo.status !== filter.status) return false;
        if (filter.priority && wo.priority !== filter.priority) return false;
        return true;
    });

    // Group by status for better organization
    const openOrders = filteredOrders.filter((wo) => wo.status === 'open');
    const assignedOrders = filteredOrders.filter((wo) => wo.status === 'assigned');
    const inProgressOrders = filteredOrders.filter((wo) => wo.status === 'in_progress');
    const completedOrders = filteredOrders.filter((wo) => wo.status === 'completed');

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderWorkOrder = (wo: PMSWorkOrder) => (
        <div
            key={wo.id}
            onClick={() => onSelect(wo)}
            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 
        hover:border-gray-600 cursor-pointer transition-all group"
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_ICONS[wo.category] || '🔧'}</span>
                    <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {wo.title}
                    </h4>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_COLORS[wo.priority]}`}>
                        {wo.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[wo.status]}`}>
                        {wo.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{wo.description}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>📍 {wo.location}</span>
                {wo.roomNumber && <span>🚪 Room {wo.roomNumber}</span>}
                {wo.assignedToName && <span>👤 {wo.assignedToName}</span>}
                <span>📅 {formatDate(wo.createdAt)}</span>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-gray-400 mt-4">Loading work orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={filter.status || ''}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value as WorkOrderStatus || undefined })}
                    className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>

                <select
                    value={filter.priority || ''}
                    onChange={(e) => setFilter({ ...filter, priority: e.target.value as WorkOrderPriority || undefined })}
                    className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <button
                    onClick={() => setFilter({})}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Clear Filters
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">{openOrders.length}</div>
                    <div className="text-xs text-gray-400">Open</div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{assignedOrders.length}</div>
                    <div className="text-xs text-gray-400">Assigned</div>
                </div>
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">{inProgressOrders.length}</div>
                    <div className="text-xs text-gray-400">In Progress</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{completedOrders.length}</div>
                    <div className="text-xs text-gray-400">Completed</div>
                </div>
            </div>

            {/* Work Orders List */}
            {filteredOrders.length === 0 ? (
                <PMSCard>
                    <div className="text-center py-12">
                        <p className="text-gray-400">No work orders found</p>
                    </div>
                </PMSCard>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map(renderWorkOrder)}
                </div>
            )}
        </div>
    );
}
