// Server-only lightweight scheduler for periodic Toast sync
// Runs every 30 minutes per connected restaurant

import { syncEmployeesForRestaurant } from '@/lib/services/toast-sync';
import ToastAPIClient from '@/lib/services/toast-api-client';
import { isDemoMode } from '@/lib/config/demo';

let schedulerInitialized = false;

async function runSyncCycle(): Promise<void> {
  try {
    if (isDemoMode()) {
      console.log('[Toast Scheduler] Demo mode: skipping sync cycle');
      return;
    }
    const api = new ToastAPIClient();
    const restaurants = await api.getConnectedRestaurants();

    for (const r of restaurants.data) {
      const restaurantGuid = r.guid;
      if (!restaurantGuid) continue;

      console.log(`[Toast Scheduler] Running employee sync for ${restaurantGuid}`);
      const res = await syncEmployeesForRestaurant(restaurantGuid);
      console.log(`[Toast Scheduler] Employee sync for ${restaurantGuid} -> processed=${res.processed} created=${res.created} updated=${res.updated} errors=${res.errors}`);
    }
  } catch (err) {
    console.error('[Toast Scheduler] cycle error', err);
  }
}

export function initToastScheduler(): void {
  if (schedulerInitialized) return;
  schedulerInitialized = true;

  // Kick off once on boot after short delay to avoid cold start contention
  setTimeout(() => {
    runSyncCycle();
  }, 10_000);

  // Then every 30 minutes
  const THIRTY_MINUTES = 30 * 60 * 1000;
  setInterval(() => {
    runSyncCycle();
  }, THIRTY_MINUTES);
}


