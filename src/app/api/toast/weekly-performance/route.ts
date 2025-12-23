import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';
import { getDefaultTimeZone, formatYMDInTimeZone } from '@/lib/timezone';
import { isDemoMode, getDemoNow } from '@/lib/config/demo';

function daysAgo(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - n);
  return x;
}

let cachedTimeZone: string | null = null;

async function getTimeZone(client: ToastAPIClient, restaurantGuid: string): Promise<string> {
  if (process.env.TOAST_TIMEZONE) return process.env.TOAST_TIMEZONE;
  if (cachedTimeZone) return cachedTimeZone;
  try {
    const restaurant = await client.getRestaurant(restaurantGuid);
    const tz = (restaurant as any)?.timeZone || getDefaultTimeZone();
    cachedTimeZone = tz;
    return tz;
  } catch {
    return getDefaultTimeZone();
  }
}

function formatYMD(tz: string, d: Date): string {
  return formatYMDInTimeZone(tz, d);
}

function formatYMDCompact(ymd: string): string {
  return ymd.replaceAll('-', '');
}

export async function GET(_req: NextRequest) {
  try {
    if (isDemoMode()) {
      const tz = getDefaultTimeZone();
      const today = getDemoNow();
      const series: Array<{ date: string; sales: number; orders: number; avgTurnoverMinutes: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = daysAgo(today, i);
        const ymd = formatYMD(tz, d);
        const base = 4200 + (6 - i) * 400;
        const sales = Math.round(base + Math.sin(i) * 200);
        const orders = 20 + (6 - i) * 4 + (i % 3);
        const avgTurnoverMinutes = 10 + ((6 - i) % 4);
        series.push({ date: ymd, sales, orders, avgTurnoverMinutes });
      }
      return NextResponse.json({ success: true, data: series, timeZone: tz });
    }

    const restaurantGuid = process.env.TOAST_RESTAURANT_ID || '';
    if (!restaurantGuid) return NextResponse.json({ success: false, error: 'Missing TOAST_RESTAURANT_ID' }, { status: 400 });

    const client = new ToastAPIClient();
    const tz = await getTimeZone(client, restaurantGuid);
    const headers = { 'Toast-Restaurant-External-ID': restaurantGuid } as Record<string, string>;

    const today = new Date();
    const series: Array<{ date: string; sales: number; orders: number; avgTurnoverMinutes: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(today, i);
      const ymd = formatYMD(tz, d);
      const compact = formatYMDCompact(ymd);

      let page = 1;
      const pageSize = 100;
      let dayOrders: any[] = [];
      for (let p = 0; p < 10; p++) {
        const resp = await client.makeRequest<any>(
          '/orders/v2/ordersBulk',
          'GET',
          undefined,
          { businessDate: compact, page: String(page), pageSize: String(pageSize) },
          headers
        );
        const arr: any[] = Array.isArray(resp) ? resp : ((resp as any)?.data || []);
        dayOrders = dayOrders.concat(arr);
        if (!Array.isArray(resp)) {
          if ((resp as any)?.hasMore === true) {
            page += 1;
            if (arr.length === 0) break;
          } else {
            break;
          }
        } else {
          if (arr.length < pageSize) break;
          page += 1;
        }
      }

      const isCompleted = (o: any) => {
        if (!o || o.voided === true) return false;
        if (o.closedDate) return true;
        if (o.paymentStatus && String(o.paymentStatus).toUpperCase() !== 'OPEN') return true;
        const checks = Array.isArray(o.checks) ? o.checks : [];
        return checks.some((c: any) => {
          if (c?.closedDate) return true;
          const payments = Array.isArray(c?.payments) ? c.payments : [];
          return payments.some((p: any) => p?.paidDate || (p?.paymentStatus && String(p.paymentStatus).toUpperCase() !== 'OPEN'));
        });
      };

      const completed = dayOrders.filter(isCompleted);
      const orders = completed.length;
      let totalTurnoverMs = 0;
      let turnoverCount = 0;
      const sales = completed.reduce((sum, o) => {
        const checks = Array.isArray(o.checks) ? o.checks : [];
        const orderBase = checks.reduce((csum: number, c: any) => {
          const payments = Array.isArray(c?.payments) ? c.payments : [];
          const paidBase = payments.reduce((pSum: number, p: any) => {
            const amount = Number(p?.amount ?? 0);
            const tip = Number(p?.tipAmount ?? 0);
            const refund = Number((p?.refund && p.refund.refundAmount) ?? 0);
            return pSum + Math.max(0, amount - tip) - refund;
          }, 0);
          const opened = c?.openedDate ? new Date(c.openedDate).getTime() : null;
          const closed = c?.closedDate ? new Date(c.closedDate).getTime() : null;
          if (opened && closed && closed > opened) {
            totalTurnoverMs += (closed - opened);
            turnoverCount += 1;
          }
          return csum + paidBase;
        }, 0);
        return sum + orderBase;
      }, 0);
      const avgTurnoverMinutes = turnoverCount > 0 ? (totalTurnoverMs / turnoverCount) / 60000 : 0;
      series.push({ date: ymd, sales, orders, avgTurnoverMinutes });
    }

    return NextResponse.json({ success: true, data: series, timeZone: tz });
  } catch (error) {
    console.error('GET /api/toast/weekly-performance error', error);
    return NextResponse.json({ success: false, error: 'Failed to load weekly performance' }, { status: 500 });
  }
}


