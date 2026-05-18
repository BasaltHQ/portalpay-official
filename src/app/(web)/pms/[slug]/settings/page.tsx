/**
 * Settings Page
 * PMS configuration and staff management
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { SettingsClient } from './client';
import type { PMSInstance } from '@/lib/pms';

interface SettingsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPageData(slug: string) {
  // Check staff session
  const session = await getStaffSession();
  if (!session || session.pmsSlug !== slug) {
    redirect(`/pms/${slug}/login`);
  }

  // Get PMS instance
  const container = await getContainer();
  const { resources: instances } = await container.items
    .query({
      query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
      parameters: [{ name: '@slug', value: slug }],
    })
    .fetchAll();

  if (!instances || instances.length === 0) {
    redirect('/404');
  }

  const instance = instances[0] as PMSInstance;

  return { session, instance };
}

export default async function SettingsPage(props: SettingsPageProps) {
  const params = await props.params;
  const { session, instance } = await getPageData(params.slug);

  return (
    <PMSLayout session={session} instance={instance}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Configure your PMS and manage staff
          </p>
        </div>

        {/* Client Component */}
        <SettingsClient instance={instance} />
      </div>
    </PMSLayout>
  );
}

export async function generateMetadata(props: SettingsPageProps) {
  const params = await props.params;
  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
        parameters: [{ name: '@slug', value: params.slug }],
      })
      .fetchAll();

    const instance = resources?.[0] as PMSInstance | undefined;

    return {
      title: instance ? `${instance.name} - Settings` : 'Settings',
      description: 'PMS configuration and staff management',
    };
  } catch {
    return {
      title: 'Settings',
      description: 'PMS settings',
    };
  }
}
