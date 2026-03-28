'use client';

import { useCallback } from 'react';

/**
 * Hook for pushing completed orders to Toast POS.
 * Fire-and-forget — never blocks order completion.
 */

interface LineItem {
    label: string;
    sku?: string;
    qty: number;
    priceUsd: number;
    modifiers?: Array<{
        groupId?: string;
        id?: string;
        name: string;
        priceAdjustment: number;
    }>;
}

interface PushToToastParams {
    receiptId: string;
    restaurantGuid: string;
    lineItems: LineItem[];
    totalUsd: number;
    tipUsd?: number;
    paymentMethod?: string;
    amountTendered?: number;
    orderType?: string;
    serverName?: string;
    tableNumber?: string;
    guestCount?: number;
}

export function useToastOrderPush() {
    const pushToToast = useCallback(async (params: PushToToastParams): Promise<string | null> => {
        try {
            const response = await fetch('/api/toast/orders/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            const data = await response.json();

            if (data.success && data.toastOrderGuid) {
                console.log(`[TOAST PUSH] Order synced to Toast POS: ${data.toastOrderGuid}`);
                alert(`Order synced to Toast POS`);
                return data.toastOrderGuid;
            } else {
                console.warn('[TOAST PUSH] Push failed:', data.error);
                alert(`Toast POS sync failed: ${data.error || 'Unknown error'}`);
                return null;
            }
        } catch (error) {
            console.error('[TOAST PUSH] Network error:', error);
            return null;
        }
    }, []);

    return { pushToToast };
}
