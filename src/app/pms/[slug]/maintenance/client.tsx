/**
 * Maintenance Client Component
 * Full maintenance work order management interface
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkOrderList, WorkOrderForm } from '@/components/pms/maintenance';
import { PMSCard } from '@/components/pms/shared';
import type {
  PMSInstance,
  StaffSession,
  PMSWorkOrder,
  PMSStaffUser,
  RoomInventoryItem,
  CreateWorkOrderInput,
  WorkOrderStatus,
} from '@/lib/pms';

interface MaintenanceClientProps {
  instance: PMSInstance;
  session: StaffSession;
}

export function MaintenanceClient({ instance, session }: MaintenanceClientProps) {
  const [workOrders, setWorkOrders] = useState<PMSWorkOrder[]>([]);
  const [staff, setStaff] = useState<PMSStaffUser[]>([]);
  const [rooms, setRooms] = useState<RoomInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<PMSWorkOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/pms/${instance.slug}/work-orders`);
      const data = await res.json();
      if (data.ok) {
        setWorkOrders(data.workOrders || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [instance.slug]);

  // Fetch staff
  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/pms/${instance.slug}/users`);
      const data = await res.json();
      if (data.ok) {
        setStaff(data.users || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
    }
  }, [instance.slug]);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory?wallet=${instance.wallet}&pack=hotel`);
      const data = await res.json();
      setRooms(data.items || []);
    } catch (err: any) {
      console.error('Failed to fetch rooms:', err);
    }
  }, [instance.wallet]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWorkOrders(), fetchStaff(), fetchRooms()])
      .finally(() => setLoading(false));
  }, [fetchWorkOrders, fetchStaff, fetchRooms]);

  // Auto-refresh work orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchWorkOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchWorkOrders]);

  // Handle create work order
  const handleCreate = async (data: CreateWorkOrderInput) => {
    const res = await fetch(`/api/pms/${instance.slug}/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    await fetchWorkOrders();
    setShowForm(false);
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: WorkOrderStatus) => {
    const res = await fetch(`/api/pms/${instance.slug}/work-orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    await fetchWorkOrders();
    setSelectedWorkOrder(null);
  };

  // Handle select work order
  const handleSelect = (wo: PMSWorkOrder) => {
    setSelectedWorkOrder(wo);
  };

  // Detail modal
  const renderDetailModal = () => {
    if (!selectedWorkOrder) return null;

    const wo = selectedWorkOrder;
    const formatDate = (ts: number) => new Date(ts).toLocaleString();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">{wo.title}</h3>
              <p className="text-sm text-gray-400">ID: {wo.id}</p>
            </div>
            <button
              onClick={() => setSelectedWorkOrder(null)}
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
                <label className="text-xs text-gray-500 uppercase">Category</label>
                <p className="text-white capitalize">{wo.category}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Priority</label>
                <p className="text-white capitalize">{wo.priority}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <p className="text-white capitalize">{wo.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Location</label>
                <p className="text-white">{wo.location}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">Description</label>
              <p className="text-gray-300">{wo.description}</p>
            </div>

            {wo.assignedToName && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Assigned To</label>
                <p className="text-white">{wo.assignedToName}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs text-gray-500 uppercase">Created</label>
                <p className="text-gray-400">{formatDate(wo.createdAt)}</p>
              </div>
              {wo.startedAt && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Started</label>
                  <p className="text-gray-400">{formatDate(wo.startedAt)}</p>
                </div>
              )}
              {wo.completedAt && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Completed</label>
                  <p className="text-gray-400">{formatDate(wo.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="border-t border-gray-700/50 pt-4 space-y-3">
            <p className="text-sm text-gray-400 font-medium">Update Status:</p>
            <div className="grid grid-cols-2 gap-2">
              {wo.status !== 'in_progress' && wo.status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange(wo.id, 'in_progress')}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg
                    text-purple-300 hover:bg-purple-500/30 transition-colors"
                >
                  Start Work
                </button>
              )}
              {wo.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange(wo.id, 'completed')}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg
                    text-green-300 hover:bg-green-500/30 transition-colors"
                >
                  Mark Complete
                </button>
              )}
              {wo.status !== 'cancelled' && wo.status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange(wo.id, 'cancelled')}
                  className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg
                    text-gray-300 hover:bg-gray-500/30 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Work Orders</h2>
          <p className="text-sm text-gray-400">Manage maintenance requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
            font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-all
            flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Work Order
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Work Order List */}
      <WorkOrderList
        workOrders={workOrders}
        staff={staff}
        onSelect={handleSelect}
        onStatusChange={handleStatusChange}
        loading={loading}
      />

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <WorkOrderForm
              rooms={rooms}
              staff={staff}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
}
