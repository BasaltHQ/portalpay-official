import { NextRequest, NextResponse } from 'next/server';
import { pushOrderToToast, type PushOrderRequest } from '@/lib/services/toast-order-push';

/**
 * POST /api/toast/orders/push
 *
 * Called by touchpoints after a successful payment (status=paid) to
 * record the order in Toast POS for reporting, tip tracking, and cash handling.
 * Fire-and-forget from the caller's perspective.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { receiptId, restaurantGuid, lineItems, totalUsd } = body;
        if (!receiptId || !restaurantGuid || !lineItems || totalUsd === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: receiptId, restaurantGuid, lineItems, totalUsd' },
                { status: 400 }
            );
        }

        const pushRequest: PushOrderRequest = {
            receiptId,
            restaurantGuid,
            lineItems,
            totalUsd,
            tipUsd: body.tipUsd,
            paymentMethod: body.paymentMethod,
            amountTendered: body.amountTendered,
            orderType: body.orderType,
            serverName: body.serverName,
            tableNumber: body.tableNumber,
            guestCount: body.guestCount,
        };

        const result = await pushOrderToToast(pushRequest);

        if (result.ok) {
            return NextResponse.json({
                success: true,
                toastOrderGuid: result.toastOrderGuid,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 502 }
            );
        }
    } catch (error) {
        console.error('[API] Toast order push error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
