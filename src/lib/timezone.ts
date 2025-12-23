// Centralized timezone helpers for consistent Mountain Time handling

export function getDefaultTimeZone(): string {
  return process.env.TOAST_TIMEZONE || 'America/Denver';
}

export function formatYMDInTimeZone(timeZone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value || '1970';
  const m = parts.find(p => p.type === 'month')?.value || '01';
  const d = parts.find(p => p.type === 'day')?.value || '01';
  return `${y}-${m}-${d}`;
}

// Compute the timezone offset in milliseconds for a specific date and timeZone.
// This follows the approach used by date-fns-tz to derive the offset via Intl.
export function getTimeZoneOffsetInMilliseconds(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const year = Number(map.year);
  const month = Number(map.month) - 1;
  const day = Number(map.day);
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  const second = Number(map.second);
  const asUTC = Date.UTC(year, month, day, hour, minute, second);
  return asUTC - date.getTime();
}

export function zonedTimeToUtcDate(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): Date {
  // Treat the provided components as wall time in the specified timeZone
  const localAsUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
  const offset = getTimeZoneOffsetInMilliseconds(timeZone, localAsUTC);
  return new Date(localAsUTC.getTime() - offset);
}

export function getDayRangeForYmdInTz(timeZone: string, ymd: string): { start: Date; end: Date } {
  const [y, m, d] = ymd.split('-').map(Number);
  const start = zonedTimeToUtcDate(timeZone, y, m, d, 0, 0, 0, 0);
  const end = zonedTimeToUtcDate(timeZone, y, m, d, 23, 59, 59, 999);
  return { start, end };
}


