import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';
import { isDemoMode, isDemoStubsEnabled } from '@/lib/config/demo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');
    if (!restaurantGuid) {
      return NextResponse.json({ success: false, error: 'restaurantGuid required' }, { status: 400 });
    }
    if (isDemoMode() && isDemoStubsEnabled()) {
      return NextResponse.json({ success: true, data: {
        menus: [{ name: 'Demo Menu', menuGroups: [{ name: 'Entrees', menuItems: [{ guid: 'demo-item-1', name: 'Margherita Pizza', description: 'Fresh basil, tomatoes, mozzarella', pricing: { basePrice: 12.0 }, disabled: false }] }] }],
        lastUpdated: new Date().toISOString()
      }});
    }
    const client = new ToastAPIClient();
    // Menus V3 per Toast docs; fall back to V2 if needed
    try {
      const response = await client.makeRequest<any>(
        '/menus/v3/menus',
        'GET',
        undefined,
        undefined,
        { 'Toast-Restaurant-External-ID': restaurantGuid }
      );
      return NextResponse.json({ success: true, data: response });
    } catch (e) {
      const fallback = await client.makeRequest<any>(
        '/menus/v2/menus',
        'GET',
        undefined,
        { restaurantGuid },
        { 'Toast-Restaurant-External-ID': restaurantGuid }
      );
      return NextResponse.json({ success: true, data: fallback });
    }
  } catch (e) {
    console.error('GET /api/toast/menus error', e);
    return NextResponse.json({ success: false, error: 'Failed to load menus' }, { status: 500 });
  }
}