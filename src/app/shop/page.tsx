import { redirect } from 'next/navigation';

export default function ShopRedirectPage() {
  redirect('/admin?tab=shopSetup');
}
