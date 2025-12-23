/**
 * PMS Setup Page
 * Complete initial property setup (owner account + logo)
 */

import { redirect } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { SetupForm } from './client';
import type { PMSInstance } from '@/lib/pms';

interface SetupPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function checkSetupStatus(slug: string) {
  const container = await getContainer();
  
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
  
  // Check if owner account exists
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
  
  const hasOwnerAccount = ownerAccounts && ownerAccounts.length > 0;
  
  // If setup already complete, redirect to login
  if (hasOwnerAccount) {
    redirect(`/pms/${slug}/login`);
  }
  
  return instance;
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { slug } = await params;
  const instance = await checkSetupStatus(slug);
  
  return <SetupForm slug={slug} instanceName={instance.name} />;
}

export async function generateMetadata({ params }: SetupPageProps) {
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
      title: instance ? `${instance.name} - Setup` : 'PMS Setup',
      description: 'Complete your property management system setup',
    };
  } catch {
    return {
      title: 'PMS Setup',
      description: 'Complete your property management system setup',
    };
  }
}
