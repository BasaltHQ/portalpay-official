/**
 * Housekeeping Page
 * Room status management and cleaning tasks
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { HousekeepingClient } from './client';
import type { PMSInstance } from '@/lib/pms';

interface HousekeepingPageProps {
  params: {
    slug: string;
  };
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

export default async function HousekeepingPage({ params }: HousekeepingPageProps) {
  const { session, instance } = await getPageData(params.slug);

  return (
    <PMSLayout session={session} instance={instance}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Housekeeping</h1>
          <p className="text-gray-400">
            Manage room status and cleaning tasks
          </p>
        </div>

        {/* Client Component */}
        <HousekeepingClient instance={instance} />
      </div>
    </PMSLayout>
  );
}

export async function generateMetadata({ params }: HousekeepingPageProps) {
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
      title: instance ? `${instance.name} - Housekeeping` : 'Housekeeping',
      description: 'Room status management and cleaning tasks',
    };
  } catch {
    return {
      title: 'Housekeeping',
      description: 'Room status management',
    };
  }
}
