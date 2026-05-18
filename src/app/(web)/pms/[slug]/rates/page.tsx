/**
 * Rates Page
 * Rate plan management for room pricing
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { RatesClient } from './client';
import type { PMSInstance, RatePlan } from '@/lib/pms';

interface RatesPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function RatesPage({ params }: RatesPageProps) {
    const { slug } = await params;
    const session = await getStaffSession();

    if (!session || session.pmsSlug !== slug) {
        redirect(`/pms/${slug}/login`);
    }

    // Only managers can access rates
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

    // Fetch rate plans
    const { resources: ratePlans } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_rate_plan' AND c.pmsSlug = @slug ORDER BY c.roomTypeName ASC`,
            parameters: [{ name: '@slug', value: slug }],
        })
        .fetchAll();

    // Fetch rooms for room types
    const { resources: rooms } = await container.items
        .query({
            query: `
        SELECT * FROM c 
        WHERE c.type = 'inventory_item' 
        AND c.wallet = @wallet
        AND c.attributes.industry = 'hotel'
      `,
            parameters: [{ name: '@wallet', value: instance.wallet }],
        })
        .fetchAll();

    return (
        <PMSLayout instance={instance} session={session}>
            <RatesClient
                instance={instance}
                session={session}
                initialRatePlans={ratePlans || []}
                rooms={rooms || []}
            />
        </PMSLayout>
    );
}
