/**
 * Toast Order Push Service
 *
 * Pushes BasaltSurge orders to Toast POS for bidirectional recordkeeping.
 * Enables orders placed on BasaltSurge handhelds to appear in Toast's
 * reporting system, with support for tips and cash payment tracking.
 *
 * Flow:
 * 1. Map BasaltSurge line items to Toast menu item GUIDs (via sku field)
 * 2. Build Toast Order JSON with checks, selections, and payment
 * 3. Call POST /orders/v2/prices to get the priced order
 * 4. Call POST /orders/v2/orders to create the order in Toast
 *
 * References:
 * - https://doc.toasttab.com/openapi/#tag/Orders
 * - Payment types: CREDIT, OTHER (cash uses OTHER with label)
 */

import ToastAuthService from './toast-auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BasaltSurgeLineItem {
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

export interface PushOrderRequest {
    receiptId: string;
    restaurantGuid: string;
    lineItems: BasaltSurgeLineItem[];
    totalUsd: number;
    tipUsd?: number;
    paymentMethod?: string;
    amountTendered?: number;
    orderType?: string;
    serverName?: string;
    tableNumber?: string;
    guestCount?: number;
}

export interface PushOrderResult {
    ok: boolean;
    toastOrderGuid?: string;
    error?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const TOAST_API_BASE = process.env.TOAST_API_HOSTNAME || 'https://ws-api.toasttab.com';

async function getAuthHeaders(restaurantGuid: string): Promise<Record<string, string>> {
    const authService = ToastAuthService.getInstance();
    const headers = await authService.getAuthHeaders();
    return {
        ...headers,
        'Toast-Restaurant-External-ID': restaurantGuid,
    };
}

/**
 * Build a Toast Order JSON from BasaltSurge receipt data.
 */
function buildToastOrder(req: PushOrderRequest): Record<string, unknown> {
    const selections = req.lineItems
        .filter(item => {
            const label = (item.label || '').toLowerCase();
            return !label.includes('processing fee') && !label.includes('service fee');
        })
        .map(item => {
            const selection: Record<string, unknown> = {
                quantity: item.qty || 1,
                price: item.priceUsd,
                displayName: item.label,
            };

            // If SKU looks like a Toast GUID, use it as menu item reference
            if (item.sku && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.sku)) {
                selection.item = { guid: item.sku };
            }

            if (item.modifiers && item.modifiers.length > 0) {
                selection.modifiers = item.modifiers
                    .filter(m => m.id || m.groupId)
                    .map(m => ({
                        optionGroup: m.groupId ? { guid: m.groupId } : undefined,
                        modifier: m.id ? { guid: m.id } : undefined,
                        displayName: m.name,
                        price: m.priceAdjustment || 0,
                    }));
            }

            return selection;
        });

    const paymentMethod = (req.paymentMethod || '').toLowerCase();
    const isCash = paymentMethod === 'cash' || paymentMethod === 'other';
    const isCard = paymentMethod === 'card' || paymentMethod === 'credit';

    const payment: Record<string, unknown> = {
        type: isCash ? 'OTHER' : (isCard ? 'CREDIT' : 'OTHER'),
        amount: req.totalUsd + (req.tipUsd || 0),
        tipAmount: req.tipUsd || 0,
    };

    if (payment.type === 'OTHER') {
        payment.otherPayment = {
            label: isCash ? 'BasaltSurge Cash' : `BasaltSurge ${req.paymentMethod || 'Payment'}`,
        };
        if (req.amountTendered && req.amountTendered > 0) {
            payment.amountTendered = req.amountTendered;
        }
    }

    const diningOption: Record<string, boolean> = {};
    switch (req.orderType) {
        case 'takeout': diningOption.takeOut = true; break;
        case 'delivery': diningOption.delivery = true; break;
        case 'curbside': diningOption.curbside = true; break;
        default: diningOption.dineIn = true;
    }

    return {
        externalId: req.receiptId,
        source: 'API',
        diningOption,
        checks: [{
            selections,
            payments: [payment],
            customer: {},
            ...(req.guestCount ? { guestCount: req.guestCount } : {}),
        }],
        ...(req.serverName ? { server: { firstName: req.serverName } } : {}),
        ...(req.tableNumber ? { table: { name: req.tableNumber } } : {}),
    };
}

async function getToastPrices(
    restaurantGuid: string,
    order: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const headers = await getAuthHeaders(restaurantGuid);
    const response = await fetch(`${TOAST_API_BASE}/orders/v2/prices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(order),
    });
    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Toast /prices failed: ${response.status} - ${errorText}`);
    }
    return response.json();
}

async function createToastOrder(
    restaurantGuid: string,
    order: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const headers = await getAuthHeaders(restaurantGuid);
    const response = await fetch(`${TOAST_API_BASE}/orders/v2/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(order),
    });
    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Toast /orders failed: ${response.status} - ${errorText}`);
    }
    return response.json();
}

/**
 * Full pipeline: Map items → Price → Create order in Toast.
 * Only call this when order status is PAID.
 */
export async function pushOrderToToast(req: PushOrderRequest): Promise<PushOrderResult> {
    try {
        const order = buildToastOrder(req);

        let pricedOrder: Record<string, unknown>;
        try {
            pricedOrder = await getToastPrices(req.restaurantGuid, order);
        } catch (priceError) {
            console.warn('[TOAST PUSH] Price call failed, using BasaltSurge totals:', priceError);
            pricedOrder = order;
        }

        const result = await createToastOrder(req.restaurantGuid, pricedOrder);
        const toastOrderGuid = (result as any)?.guid || (result as any)?.orderGuid;

        console.log(`[TOAST PUSH] Order ${req.receiptId} → Toast ${toastOrderGuid}`);

        return { ok: true, toastOrderGuid };
    } catch (error: any) {
        console.error('[TOAST PUSH] Failed:', error);
        return { ok: false, error: error?.message || 'Unknown error pushing order to Toast' };
    }
}

export { buildToastOrder };
