/**
 * PMS Staff Login Page
 * Entry point for staff authentication
 */

import { notFound } from 'next/navigation';
import { getContainer } from '@/lib/cosmos';
import { StaffLoginForm } from '@/components/pms/auth/StaffLoginForm';
import type { PMSInstance } from '@/lib/pms';

interface LoginPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPMSInstance(slug: string): Promise<PMSInstance | null> {
  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_instance' 
          AND c.slug = @slug
        `,
        parameters: [{ name: '@slug', value: slug }],
      })
      .fetchAll();

    return resources && resources.length > 0 ? (resources[0] as PMSInstance) : null;
  } catch (error) {
    console.error('Failed to fetch PMS instance:', error);
    return null;
  }
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { slug } = await params;
  const instance = await getPMSInstance(slug);

  if (!instance) {
    notFound();
  }

  return <StaffLoginForm instance={instance} />;
}

export async function generateMetadata({ params }: LoginPageProps) {
  const { slug } = await params;
  const instance = await getPMSInstance(slug);

  return {
    title: instance ? `${instance.name} - Staff Login` : 'Staff Login',
    description: 'Staff portal login for property management system',
  };
}
