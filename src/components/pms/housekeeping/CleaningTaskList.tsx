/**
 * CleaningTaskList Component
 * Housekeeping task management with assignment and time tracking
 */

'use client';

import { useState } from 'react';
import { PMSCard } from '../shared';
import type { PMSCleaningTask, CleaningPriority, CleaningStatus, PMSStaffUser } from '@/lib/pms/types';

interface CleaningTaskListProps {
    tasks: PMSCleaningTask[];
    staff: PMSStaffUser[];
    onStatusChange: (id: string, status: CleaningStatus) => void;
    onAssign: (id: string, staffId: string) => void;
    loading?: boolean;
}

const PRIORITY_CONFIG: Record<CleaningPriority, { label: string; color: string; icon: string }> = {
    checkout: { label: 'Checkout', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🚪' },
    stayover: { label: 'Stayover', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🛏️' },
    deep_clean: { label: 'Deep Clean', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '✨' },
    turndown: { label: 'Turndown', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: '🌙' },
};

const STATUS_CONFIG: Record<CleaningStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-gray-500/20 text-gray-300' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300' },
    completed: { label: 'Completed', color: 'bg-green-500/20 text-green-300' },
    inspected: { label: 'Inspected', color: 'bg-emerald-500/20 text-emerald-300' },
    failed: { label: 'Failed', color: 'bg-red-500/20 text-red-300' },
};

export function CleaningTaskList({
    tasks,
    staff,
    onStatusChange,
    onAssign,
    loading,
}: CleaningTaskListProps) {
    const [filter, setFilter] = useState<{
        status?: CleaningStatus;
        priority?: CleaningPriority;
    }>({});

    const housekeepingStaff = staff.filter(s => s.role === 'housekeeping' || s.role === 'manager');

    const filteredTasks = tasks.filter((task) => {
        if (filter.status && task.status !== filter.status) return false;
        if (filter.priority && task.priority !== filter.priority) return false;
        return true;
    });

    // Group tasks by status for Kanban-style view
    const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.status === 'inspected');

    const formatTime = (ts?: number) => {
        if (!ts) return '--';
        return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '--';
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const renderTask = (task: PMSCleaningTask) => {
        const priority = PRIORITY_CONFIG[task.priority];
        const status = STATUS_CONFIG[task.status];

        return (
            <div
                key={task.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{priority.icon}</span>
                        <div>
                            <h4 className="font-medium text-white">Room {task.roomNumber}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded border ${priority.color}`}>
                                {priority.label}
                            </span>
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                        {status.label}
                    </span>
                </div>

                {/* Assignment & Timing */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    {task.assignedToName ? (
                        <span>👤 {task.assignedToName}</span>
                    ) : (
                        <span className="text-yellow-400">⚠️ Unassigned</span>
                    )}
                    {task.guestCheckoutTime && (
                        <span>🚪 Checkout: {formatTime(task.guestCheckoutTime)}</span>
                    )}
                    {task.expectedArrivalTime && (
                        <span>🎯 Arrival: {formatTime(task.expectedArrivalTime)}</span>
                    )}
                    {task.duration && (
                        <span>⏱️ {formatDuration(task.duration)}</span>
                    )}
                </div>

                {/* Special Instructions */}
                {task.specialInstructions && task.specialInstructions.length > 0 && (
                    <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
                        {task.specialInstructions.map((instr, i) => (
                            <div key={i}>• {instr}</div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                    {task.status === 'pending' && (
                        <>
                            <select
                                value={task.assignedTo || ''}
                                onChange={(e) => onAssign(task.id, e.target.value)}
                                className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-xs text-white"
                            >
                                <option value="">Assign to...</option>
                                {housekeepingStaff.map(s => (
                                    <option key={s.id} value={s.id}>{s.displayName}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => onStatusChange(task.id, 'in_progress')}
                                className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300
                  hover:bg-blue-500/30 transition-colors"
                            >
                                Start Cleaning
                            </button>
                        </>
                    )}
                    {task.status === 'in_progress' && (
                        <>
                            <button
                                onClick={() => onStatusChange(task.id, 'completed')}
                                className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300
                  hover:bg-green-500/30 transition-colors"
                            >
                                Mark Complete
                            </button>
                            <button
                                onClick={() => onStatusChange(task.id, 'failed')}
                                className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300
                  hover:bg-red-500/30 transition-colors"
                            >
                                Report Issue
                            </button>
                        </>
                    )}
                    {task.status === 'completed' && (
                        <button
                            onClick={() => onStatusChange(task.id, 'inspected')}
                            className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300
                hover:bg-emerald-500/30 transition-colors"
                        >
                            ✓ Approve / Inspect
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-gray-400 mt-4">Loading cleaning tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={filter.status || ''}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value as CleaningStatus || undefined })}
                    className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="inspected">Inspected</option>
                </select>

                <select
                    value={filter.priority || ''}
                    onChange={(e) => setFilter({ ...filter, priority: e.target.value as CleaningPriority || undefined })}
                    className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white"
                >
                    <option value="">All Types</option>
                    <option value="checkout">Checkout</option>
                    <option value="stayover">Stayover</option>
                    <option value="deep_clean">Deep Clean</option>
                    <option value="turndown">Turndown</option>
                </select>

                <button
                    onClick={() => setFilter({})}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Clear Filters
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">{pendingTasks.length}</div>
                    <div className="text-xs text-gray-400">Pending</div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{inProgressTasks.length}</div>
                    <div className="text-xs text-gray-400">In Progress</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{completedTasks.length}</div>
                    <div className="text-xs text-gray-400">Completed</div>
                </div>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <PMSCard>
                    <div className="text-center py-12">
                        <p className="text-gray-400">No cleaning tasks for today</p>
                    </div>
                </PMSCard>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(renderTask)}
                </div>
            )}
        </div>
    );
}
