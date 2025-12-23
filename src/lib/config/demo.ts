export function isDemoMode(): boolean {
  try {
    if (process.env.DEMO_MODE === 'true') return true;
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  } catch {}
  return false;
}

export function getBrandName(): string {
  return process.env.BRAND_NAME || process.env.NEXT_PUBLIC_APP_NAME || 'LedgerOne Auto';
}

export function getBackofficeName(): string {
  return process.env.BACKOFFICE_NAME || 'LedgerOne Auto Shop';
}

// Demo clock: allows freezing the platform "now" so seeded data stays in-range
export function getDemoNow(): Date {
  if (!isDemoMode()) return new Date();
  const fromEnv = process.env.DEMO_FREEZE_DATE || process.env.NEXT_PUBLIC_DEMO_FREEZE_DATE;
  if (fromEnv) {
    const d = new Date(fromEnv);
    if (!isNaN(d.getTime())) return d;
  }
  // Support daily freeze time via HH or HH:mm (local time)
  const timeStr = process.env.DEMO_FREEZE_TIME || process.env.NEXT_PUBLIC_DEMO_FREEZE_TIME;
  const t = new Date();
  if (timeStr) {
    const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(timeStr.trim());
    if (m) {
      const hh = Math.max(0, Math.min(23, parseInt(m[1], 10)));
      const mm = m[2] ? Math.max(0, Math.min(59, parseInt(m[2], 10))) : 0;
      t.setHours(hh, mm, 0, 0);
      return t;
    }
  }
  // Default freeze: today at 12:00 local time to make UX stable
  t.setHours(12, 0, 0, 0);
  return t;
}

// Control whether to use hardcoded demo stubs (GraphQL/REST) in demo mode
export function isDemoStubsEnabled(): boolean {
  try {
    const v = process.env.DEMO_STUBS || process.env.NEXT_PUBLIC_DEMO_STUBS;
    return v === 'true';
  } catch {}
  return false;
}
