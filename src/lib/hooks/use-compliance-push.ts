'use client';

import { useCallback } from 'react';

/**
 * Hook for pushing completed orders to Cannabis Compliance Providers (METRC/BioTrack).
 * Fire-and-forget — never blocks POS order completion.
 */

interface ComplianceLineItem {
    label: string;
    sku?: string;
    qty: number;
    priceUsd: number;
    metrcTag?: string;
    biotrackId?: string;
    complianceBatchNumber?: string;
}

interface PushToComplianceParams {
    receiptId: string;
    lineItems: ComplianceLineItem[];
    totalUsd: number;
    paymentMethod?: string;
    serverName?: string;
    customerId?: string; // For medicinal/registered patients
}

export function useCompliancePush() {
    const pushToCompliance = useCallback(async (params: PushToComplianceParams, merchantWallet: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/compliance/sales/push', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-wallet': merchantWallet
                },
                body: JSON.stringify(params),
            });

            const data = await response.json();

            if (data.success) {
                console.log(`[COMPLIANCE PUSH] Order synced to ${data.provider}: ${params.receiptId}`);
                // Optional: alert(`Order synced to ${data.provider}`);
                return true;
            } else {
                console.warn('[COMPLIANCE PUSH] Push failed:', data.error);
                // Fail silently for the operator, flagged in backend for audit
                return false;
            }
        } catch (error) {
            console.error('[COMPLIANCE PUSH] Network error:', error);
            return false;
        }
    }, []);

    return { pushToCompliance };
}
