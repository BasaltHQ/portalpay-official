import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';
import { isDemoMode, isDemoStubsEnabled, getDemoNow } from '@/lib/config/demo';

// Wraps Toast Orders Bulk: GET /orders/v2/ordersBulk
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');
    const businessDate = searchParams.get('businessDate') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = searchParams.get('page') || undefined;
    const pageSize = searchParams.get('pageSize') || undefined;

    if (!restaurantGuid) {
      return NextResponse.json({ success: false, error: 'restaurantGuid required' }, { status: 400 });
    }

    // Demo stub: return stable sample orders only if DEMO_STUBS=true
    if (isDemoMode() && isDemoStubsEnabled()) {
      const when = getDemoNow().toISOString();
      return NextResponse.json({ success: true, data: [{ guid: 'demo-order-1', number: '1001', createdDate: when, checks: [{ guid: 'chk1', openedDate: when, selections: [] }] }] });
    }

    const client = new ToastAPIClient();
    const headers = { 'Toast-Restaurant-External-ID': restaurantGuid } as Record<string, string>;
    const params: Record<string, string> = {};
    if (businessDate) params.businessDate = businessDate;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;

    const resp = await client.makeRequest<any>(
      '/orders/v2/ordersBulk',
      'GET',
      undefined,
      params,
      headers
    );

    return NextResponse.json({ success: true, data: resp });
  } catch (e) {
    console.error('GET /api/toast/orders-bulk error', e);
    return NextResponse.json({ success: false, error: 'Failed to load orders' }, { status: 500 });
  }
}


