import { redirect } from 'next/navigation';

export default function DocumentationRedirect() {
  // Redirect /documentation to the main docs viewer
  redirect('/docs');
  return null;
}
