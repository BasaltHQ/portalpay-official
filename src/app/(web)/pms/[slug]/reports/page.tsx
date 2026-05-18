/**
 * Reports Page
 * Analytics and reporting interface
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { ReportsClient } from './client';
import type { PMSInstance, NightAuditRecord } from '@/lib/pms';

interface ReportsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { slug } = await params;
  const session = await getStaffSession();

  if (!session || session.pmsSlug !== slug) {
    redirect(`/pms/${slug}/login`);
  }

  // Only managers can access reports
  if (session.role !== 'manager') {
    redirect(`/pms/${slug}`);
  }

  const container = await getContainer();

  // Get PMS instance
  const { resources: instances } = await container.items
    .query({
      query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
      parameters: [{ name: '@slug', value: slug }],
    })
    .fetchAll();

  if (!instances || instances.length === 0) {
    redirect('/pms/create');
  }

  const instance = instances[0] as PMSInstance;

  // Get room count
  const { resources: roomCount } = await container.items
    .query({
      query: `SELECT VALUE COUNT(1) FROM c WHERE c.type = 'inventory_item' AND c.wallet = @wallet AND c.attributes.industry = 'hotel'`,
      parameters: [{ name: '@wallet', value: instance.wallet }],
    })
    .fetchAll();

  // Get audit history (last 90 days)
  const { resources: auditHistory } = await container.items
    .query({
      query: `SELECT * FROM c WHERE c.type = 'pms_night_audit' AND c.pmsSlug = @slug ORDER BY c.auditDate DESC OFFSET 0 LIMIT 90`,
      parameters: [{ name: '@slug', value: slug }],
    })
    .fetchAll();

  return (
    <PMSLayout session={session} instance={instance}>
      <ReportsClient
        instance={instance}
        session={session}
        totalRooms={roomCount?.[0] || 0}
        auditHistory={(auditHistory || []) as NightAuditRecord[]}
      />
    </PMSLayout>
  );
}

