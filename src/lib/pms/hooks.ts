/**
 * PMS React Hooks
 * Custom hooks for data fetching and real-time updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PMSFolio, RoomInventoryItem, DashboardMetrics } from './types';

/**
 * Hook to fetch and auto-refresh folios
 */
export function useFolios(pmsSlug: string, refreshInterval: number = 5000) {
  const [folios, setFolios] = useState<PMSFolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolios = useCallback(async () => {
    try {
      const res = await fetch(`/api/pms/${pmsSlug}/folios`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch folios');
      }

      setFolios(data.folios || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pmsSlug]);

  useEffect(() => {
    fetchFolios();

    const interval = setInterval(fetchFolios, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchFolios, refreshInterval]);

  return { folios, loading, error, refetch: fetchFolios };
}

/**
 * Hook to fetch available room types and their rooms
 * Returns room types (not flattened) for better UI presentation
 */
export function useAvailableRooms(wallet: string) {
  const [rooms, setRooms] = useState<RoomInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory?wallet=${wallet}&pack=hotel`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch rooms');
      }

      // Filter for actual room types only (not services like spa, shuttle, etc.)
      // Room types have attributes.isRoomType === true and contain room numbers
      const roomTypes = (data.items || []).filter(
        (item: any) => 
          item.attributes?.isRoomType === true &&
          Array.isArray(item.attributes?.rooms) &&
          item.attributes.rooms.length > 0
      );

      setRooms(roomTypes as RoomInventoryItem[]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, refetch: fetchRooms };
}

/**
 * Hook to fetch all rooms (for housekeeping)
 */
export function useAllRooms(wallet: string, refreshInterval: number = 10000) {
  const [rooms, setRooms] = useState<RoomInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory?wallet=${wallet}&pack=hotel`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch rooms');
      }

      setRooms(data.items || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchRooms();

    const interval = setInterval(fetchRooms, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRooms, refreshInterval]);

  return { rooms, loading, error, refetch: fetchRooms };
}

/**
 * Hook to fetch dashboard metrics with auto-refresh
 */
export function useDashboardMetrics(pmsSlug: string, refreshInterval: number = 5000) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`/api/pms/${pmsSlug}/dashboard`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }

      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pmsSlug]);

  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

/**
 * Hook to update room status
 */
export function useUpdateRoomStatus(wallet: string) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (roomId: string, newStatus: string) => {
    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          attributes: {
            status: newStatus,
            lastCleaned: newStatus === 'available' ? Date.now() : undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update room status');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [wallet]);

  return { updateStatus, updating, error };
}
