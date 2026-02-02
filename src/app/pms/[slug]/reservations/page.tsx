/**
 * Reservations Page
 * Reservation calendar and management interface
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { ReservationsClient } from './client';
import type { PMSInstance, PMSReservation } from '@/lib/pms';

interface ReservationsPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function ReservationsPage({ params }: ReservationsPageProps) {
    const { slug } = await params;
    const session = await getStaffSession();

    if (!session || session.pmsSlug !== slug) {
        redirect(`/pms/${slug}/login`);
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

    // Fetch reservations (last 30 days + next 90 days)
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ninetyDaysAhead = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { resources: reservations } = await container.items
        .query({
            query: `
        SELECT * FROM c 
        WHERE c.type = 'pms_reservation' 
        AND c.pmsSlug = @slug
        AND c.checkOutDate >= @startDate
        AND c.checkInDate <= @endDate
        ORDER BY c.checkInDate ASC
      `,
            parameters: [
                { name: '@slug', value: slug },
                { name: '@startDate', value: thirtyDaysAgo },
                { name: '@endDate', value: ninetyDaysAhead },
            ],
        })
        .fetchAll();

    // Fetch rooms from inventory
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
            <ReservationsClient
                instance={instance}
                session={session}
                initialReservations={reservations || []}
                rooms={rooms || []}
            />
        </PMSLayout>
    );
}
