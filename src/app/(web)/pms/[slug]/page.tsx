/**
 * PMS Dashboard Page
 * Main dashboard with metrics and quick actions
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import { PMSLayout } from '@/components/pms/layout';
import { DashboardMetricsDisplay } from '@/components/pms/dashboard/DashboardMetrics';
import type { PMSInstance, DashboardMetrics } from '@/lib/pms';

interface DashboardPageProps {
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

  // Calculate dashboard metrics directly (avoid SSR fetch issues)
  const { calculateDashboardMetrics } = await import('@/lib/pms');
  
  // Get all rooms from inventory
  const { resources: rooms } = await container.items
    .query({
      query: `
        SELECT * FROM c 
        WHERE c.type = 'inventory_item' 
        AND c.wallet = @wallet
        AND c.industryPack = 'hotel'
      `,
      parameters: [{ name: '@wallet', value: instance.wallet }],
    })
    .fetchAll();
  
  // Get all folios
  const { resources: folios } = await container.items
    .query({
      query: `
        SELECT * FROM c 
        WHERE c.type = 'pms_folio' 
        AND c.pmsSlug = @slug
      `,
      parameters: [{ name: '@slug', value: slug }],
    })
    .fetchAll();
  
  // Calculate metrics
  const metrics = calculateDashboardMetrics(
    (rooms || []) as any[],
    (folios || []) as any[]
  );

  return { session, instance, metrics };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const { session, instance, metrics } = await getPageData(slug);

  return (
    <PMSLayout session={session} instance={instance}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session.username}
          </h1>
          <p className="text-gray-400">
            Here's what's happening at {instance.name} today
          </p>
        </div>

        {/* Metrics Cards */}
        <DashboardMetricsDisplay metrics={metrics} instance={instance} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href={`/pms/${instance.slug}/frontdesk`}
            className="group p-6 bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-lg
              hover:border-gray-600 transition-all duration-200 hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${instance.branding.primaryColor}20` }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: instance.branding.primaryColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  Front Desk
                </h3>
                <p className="text-sm text-gray-400">
                  Check-in, checkout, folios
                </p>
              </div>
            </div>
          </a>

          <a
            href={`/pms/${instance.slug}/housekeeping`}
            className="group p-6 bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-lg
              hover:border-gray-600 transition-all duration-200 hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-yellow-400 transition-colors">
                  Housekeeping
                </h3>
                <p className="text-sm text-gray-400">
                  Room status, cleaning tasks
                </p>
              </div>
            </div>
          </a>

          <a
            href={`/pms/${instance.slug}/settings`}
            className="group p-6 bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-lg
              hover:border-gray-600 transition-all duration-200 hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${instance.branding.secondaryColor}20` }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: instance.branding.secondaryColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-gray-400">
                  Configure PMS settings
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </PMSLayout>
  );
}

export async function generateMetadata({ params }: DashboardPageProps) {
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
      title: instance ? `${instance.name} - Dashboard` : 'PMS Dashboard',
      description: 'Property management system dashboard',
    };
  } catch {
    return {
      title: 'PMS Dashboard',
      description: 'Property management system dashboard',
    };
  }
}
