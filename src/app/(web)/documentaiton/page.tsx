import { redirect } from 'next/navigation';

export default function DocumentationRedirectTypo() {
  // Alias for common typo: /documentaiton -> /docs
  redirect('/docs');
  return null;
}
