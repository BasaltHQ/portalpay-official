import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale } from '@/lib/i18n/config';

export default getRequestConfig(async () => {
  // Get locale from localStorage or default
  let locale: Locale = defaultLocale;
  
  // In server context, we can't access localStorage
  // The locale will be managed client-side via the language selector
  
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'America/Denver' // Default timezone to prevent environment mismatches
  };
});
