/**
 * Reports Page
 * Analytics and reporting interface
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { ReportsClient } from './client';
import type { PMSInstance } from '@/lib/pms';

interface ReportsPageProps {
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

  // Verify role access (only managers can access reports)
  if (session.role !== 'manager') {
    redirect(`/pms/${slug}`);
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

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { slug } = await params;
  const { session, instance } = await getPageData(slug);

  return (
    <PMSLayout session={session} instance={instance}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">
            View insights and generate reports for your property
          </p>
        </div>

        <ReportsClient instance={instance} session={session} />
      </div>
    </PMSLayout>
  );
}
