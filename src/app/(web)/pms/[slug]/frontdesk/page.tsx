/**
 * Front Desk Page
 * Guest check-in, checkout, and folio management
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { FrontDeskClient } from './client';
import type { PMSInstance } from '@/lib/pms';

interface FrontDeskPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPageData(slug: string) {
  const container = await getContainer();
  
  // Check if setup is complete (owner account exists)
  const { resources: ownerAccounts } = await container.items
    .query({
      query: `
        SELECT * FROM c 
        WHERE c.type = 'pms_staff' 
        AND c.pmsSlug = @slug
        AND c.role = 'manager'
        AND c.username = 'owner'
      `,
      parameters: [{ name: '@slug', value: slug }],
    })
    .fetchAll();
  
  if (!ownerAccounts || ownerAccounts.length === 0) {
    redirect(`/pms/${slug}/setup`);
  }
  
  // Check staff session
  const session = await getStaffSession();
  if (!session || session.pmsSlug !== slug) {
    redirect(`/pms/${slug}/login`);
  }

  // Get PMS instance
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

export default async function FrontDeskPage({ params }: FrontDeskPageProps) {
  const { slug } = await params;
  const { session, instance } = await getPageData(slug);

  return (
    <PMSLayout session={session} instance={instance}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Front Desk</h1>
          <p className="text-gray-400">
            Manage guest check-ins, checkouts, and folios
          </p>
        </div>

        {/* Client Component */}
        <FrontDeskClient instance={instance} />
      </div>
    </PMSLayout>
  );
}

export async function generateMetadata({ params }: FrontDeskPageProps) {
  try {
    const { slug } = await params;
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();

    const instance = resources?.[0] as PMSInstance | undefined;

    return {
      title: instance ? `${instance.name} - Front Desk` : 'Front Desk',
      description: 'Front desk operations - check-in, checkout, and folio management',
    };
  } catch {
    return {
      title: 'Front Desk',
      description: 'Front desk operations',
    };
  }
}
