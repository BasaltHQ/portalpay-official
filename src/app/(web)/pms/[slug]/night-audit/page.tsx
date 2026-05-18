/**
 * Night Audit Page
 * End-of-day workflow for hotel operations
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { NightAuditClient } from './client';
import type { PMSInstance, PMSFolio } from '@/lib/pms';

interface NightAuditPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function NightAuditPage({ params }: NightAuditPageProps) {
    const { slug } = await params;
    const session = await getStaffSession();

    if (!session || session.pmsSlug !== slug) {
        redirect(`/pms/${slug}/login`);
    }

    // Only managers can run night audit
    if (session.role !== 'manager') {
        redirect(`/pms/${slug}`);
    }

    const container = await getContainer();

    // Fetch PMS instance
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

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if audit already run today
    const { resources: existingAudits } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_night_audit' AND c.pmsSlug = @slug AND c.auditDate = @date`,
            parameters: [
                { name: '@slug', value: slug },
                { name: '@date', value: today },
            ],
        })
        .fetchAll();

    // Fetch open folios
    const { resources: openFolios } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_folio' AND c.pmsSlug = @slug AND c.status = 'open'`,
            parameters: [{ name: '@slug', value: slug }],
        })
        .fetchAll();

    // Fetch rooms for count
    const { resources: rooms } = await container.items
        .query({
            query: `SELECT VALUE COUNT(1) FROM c WHERE c.type = 'inventory_item' AND c.wallet = @wallet AND c.attributes.industry = 'hotel'`,
            parameters: [{ name: '@wallet', value: instance.wallet }],
        })
        .fetchAll();

    return (
        <PMSLayout instance={instance} session={session}>
            <NightAuditClient
                instance={instance}
                session={session}
                auditDate={today}
                existingAudit={existingAudits?.[0] || null}
                openFolios={openFolios || []}
                totalRooms={rooms?.[0] || 0}
            />
        </PMSLayout>
    );
}
