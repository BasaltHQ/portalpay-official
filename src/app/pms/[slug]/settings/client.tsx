/**
 * Settings Client Component
 * PMS configuration interface
 */

'use client';

import { useState } from 'react';
import { PMSSettings } from '@/components/pms/settings/PMSSettings';
import type { PMSInstance } from '@/lib/pms';

interface SettingsClientProps {
  instance: PMSInstance;
}

export function SettingsClient({ instance }: SettingsClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    // Trigger a re-render or refresh
    setRefreshKey(prev => prev + 1);
    // Optionally reload the page to get fresh data
    window.location.reload();
  };

  return (
    <div className="max-w-4xl">
      <PMSSettings key={refreshKey} instance={instance} onUpdate={handleUpdate} />
    </div>
  );
}
