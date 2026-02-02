/**
 * Rates Client Component
 * Interactive rate management interface
 */

'use client';

import { useState, useCallback } from 'react';
import { RateManager } from '@/components/pms/rates';
import type {
    PMSInstance,
    StaffSession,
    RatePlan,
    RoomInventoryItem,
} from '@/lib/pms';

interface RatesClientProps {
    instance: PMSInstance;
    session: StaffSession;
    initialRatePlans: RatePlan[];
    rooms: RoomInventoryItem[];
}

export function RatesClient({
    instance,
    session,
    initialRatePlans,
    rooms,
}: RatesClientProps) {
    const [ratePlans, setRatePlans] = useState<RatePlan[]>(initialRatePlans);

    // Refresh rate plans
    const refreshRatePlans = useCallback(async () => {
        try {
            const res = await fetch(`/api/pms/${instance.slug}/rates`);
            const data = await res.json();
            if (data.ok) {
                setRatePlans(data.ratePlans || []);
            }
        } catch (err) {
            console.error('Failed to refresh rate plans:', err);
        }
    }, [instance.slug]);

    // Save rate plan
    const handleSave = async (ratePlan: Partial<RatePlan>) => {
        const res = await fetch(`/api/pms/${instance.slug}/rates`, {
            method: ratePlan.id ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ratePlan),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        await refreshRatePlans();
    };

    // Delete rate plan
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rate plan?')) return;

        const res = await fetch(`/api/pms/${instance.slug}/rates?id=${id}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        await refreshRatePlans();
    };

    return (
        <RateManager
            ratePlans={ratePlans}
            rooms={rooms}
            onSave={handleSave}
            onDelete={handleDelete}
        />
    );
}
