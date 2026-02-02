/**
 * Groups & Corporate Page
 * Group booking and corporate account management
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { GroupsClient } from './client';
import type { PMSInstance, GroupBooking, CorporateAccount } from '@/lib/pms';

interface GroupsPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function GroupsPage({ params }: GroupsPageProps) {
    const { slug } = await params;
    const session = await getStaffSession();

    if (!session || session.pmsSlug !== slug) {
        redirect(`/pms/${slug}/login`);
    }

    // Only managers and front desk can access groups
    if (!['manager', 'front_desk'].includes(session.role)) {
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

    // Get group bookings
    const { resources: groups } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_group' AND c.pmsSlug = @slug ORDER BY c.checkInDate ASC`,
            parameters: [{ name: '@slug', value: slug }],
        })
        .fetchAll();

    // Get corporate accounts
    const { resources: corporates } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_corporate' AND c.pmsSlug = @slug ORDER BY c.companyName ASC`,
            parameters: [{ name: '@slug', value: slug }],
        })
        .fetchAll();

    return (
        <PMSLayout session={session} instance={instance}>
            <GroupsClient
                instance={instance}
                session={session}
                groups={(groups || []) as GroupBooking[]}
                corporateAccounts={(corporates || []) as CorporateAccount[]}
            />
        </PMSLayout>
    );
}
