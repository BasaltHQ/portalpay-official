import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';
import { isDemoMode } from '@/lib/config/demo';
import { getDefaultTimeZone, formatYMDInTimeZone, getDayRangeForYmdInTz } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantGuid = searchParams.get('restaurantGuid') || process.env.TOAST_RESTAURANT_ID || '';
  let startDate = searchParams.get('startDate');
  let endDate = searchParams.get('endDate');

  try {
    // Default to current business day in restaurant timezone if dates are missing
    if (!startDate || !endDate) {
      const client = new ToastAPIClient();
      // Resolve timezone via env override, else fetch restaurant info
      let tz = process.env.TOAST_TIMEZONE || '';
      if (!tz) {
        try { tz = (await client.getRestaurant(restaurantGuid as string) as any)?.timeZone || ''; } catch { /* ignore */ }
      }
      if (!tz) tz = getDefaultTimeZone();
      const ymd = formatYMDInTimeZone(tz, new Date());
      const { start, end } = getDayRangeForYmdInTz(tz, ymd);
      if (!startDate) startDate = start.toISOString();
      if (!endDate) endDate = new Date().toISOString();
    }

    if (isDemoMode()) {
      const now = new Date().toISOString();
      return NextResponse.json([
        { id: 'te1', employeeId: 'tm2', clockIn: now, clockOut: null, role: 'Server' },
        { id: 'te2', employeeId: 'tm1', clockIn: now, clockOut: null, role: 'Head Chef' },
      ]);
    }

    const toastClient = new ToastAPIClient();
    const timeEntries = await toastClient.getTimeEntries(restaurantGuid, startDate, endDate);
    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('Failed to get time entries:', error);
    return NextResponse.json({
      error: 'Failed to retrieve time entries',
    }, { status: 500 });
  }
}
