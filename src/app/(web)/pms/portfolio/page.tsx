/**
 * Portfolio Dashboard Page
 * Consolidated view of all PMS properties
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { PMSInstance, DashboardMetrics } from '@/lib/pms';
import Link from 'next/link';

export default async function PortfolioPage() {
    const session = await getStaffSession();

    if (!session) {
        redirect('/pms/create');
    }

    // Only managers can view portfolio
    if (session.role !== 'manager') {
        redirect(`/pms/${session.pmsSlug}`);
    }

    const container = await getContainer();

    // Get the current PMS to find the wallet
    const { resources: currentPms } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
            parameters: [{ name: '@slug', value: session.pmsSlug }],
        })
        .fetchAll();

    if (!currentPms || currentPms.length === 0) {
        redirect('/pms/create');
    }

    const wallet = currentPms[0].wallet;

    // Fetch all PMS instances for this wallet
    const { resources: instances } = await container.items
        .query({
            query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.wallet = @wallet`,
            parameters: [{ name: '@wallet', value: wallet }],
        })
        .fetchAll();

    // Fetch metrics for each instance
    const instancesWithMetrics = await Promise.all(
        (instances || []).map(async (instance: PMSInstance) => {
            // Get open folios count
            const { resources: folios } = await container.items
                .query({
                    query: `SELECT VALUE COUNT(1) FROM c WHERE c.type = 'pms_folio' AND c.pmsSlug = @slug AND c.status = 'open'`,
                    parameters: [{ name: '@slug', value: instance.slug }],
                })
                .fetchAll();

            // Get rooms count
            const { resources: rooms } = await container.items
                .query({
                    query: `SELECT VALUE COUNT(1) FROM c WHERE c.type = 'inventory_item' AND c.wallet = @wallet AND c.attributes.industry = 'hotel'`,
                    parameters: [{ name: '@wallet', value: instance.wallet }],
                })
                .fetchAll();

            return {
                ...instance,
                occupancy: folios?.[0] || 0,
                totalRooms: rooms?.[0] || 0,
            };
        })
    );

    // Calculate totals
    const totalOccupancy = instancesWithMetrics.reduce((sum, i) => sum + (i.occupancy || 0), 0);
    const totalRooms = instancesWithMetrics.reduce((sum, i) => sum + (i.totalRooms || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
                <div className="h-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/pms/${session.pmsSlug}`}
                            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-semibold text-white">Property Portfolio</h1>
                    </div>
                    <Link
                        href="/pms/create"
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
              font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-all
              flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Property
                    </Link>
                </div>
            </header>

            <main className="pt-24 px-6 pb-12">
                {/* Overall Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="p-6 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                        <div className="text-3xl font-bold text-white">{instancesWithMetrics.length}</div>
                        <div className="text-sm text-gray-400">Properties</div>
                    </div>
                    <div className="p-6 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                        <div className="text-3xl font-bold text-white">{totalRooms}</div>
                        <div className="text-sm text-gray-400">Total Rooms</div>
                    </div>
                    <div className="p-6 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                        <div className="text-3xl font-bold text-green-400">{totalOccupancy}</div>
                        <div className="text-sm text-gray-400">Currently Occupied</div>
                    </div>
                    <div className="p-6 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                        <div className="text-3xl font-bold text-blue-400">
                            {totalRooms > 0 ? Math.round((totalOccupancy / totalRooms) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-400">Portfolio Occupancy</div>
                    </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instancesWithMetrics.map((instance) => {
                        const occupancyRate = instance.totalRooms > 0
                            ? Math.round((instance.occupancy / instance.totalRooms) * 100)
                            : 0;

                        return (
                            <Link
                                key={instance.slug}
                                href={`/pms/${instance.slug}`}
                                className="block p-6 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 
                  rounded-xl hover:border-gray-600 transition-all group"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    {instance.branding.logo ? (
                                        <img
                                            src={instance.branding.logo}
                                            alt={instance.name}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="h-12 w-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                                            style={{ backgroundColor: instance.branding.primaryColor }}
                                        >
                                            {instance.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {instance.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">/{instance.slug}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xl font-bold text-white">{instance.totalRooms || 0}</div>
                                        <div className="text-xs text-gray-500">Rooms</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-green-400">{instance.occupancy || 0}</div>
                                        <div className="text-xs text-gray-500">Occupied</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-blue-400">{occupancyRate}%</div>
                                        <div className="text-xs text-gray-500">Rate</div>
                                    </div>
                                </div>

                                {/* Occupancy bar */}
                                <div className="mt-4 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${occupancyRate}%`,
                                            background: `linear-gradient(90deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
                                        }}
                                    />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {instancesWithMetrics.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-gray-400">No properties configured yet.</p>
                        <Link
                            href="/pms/create"
                            className="inline-block mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Create Your First Property
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
