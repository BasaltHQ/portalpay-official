export const locales = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
export type Locale = string;

export const defaultLocale: Locale = 'en';

// Map language display names to locale codes
export const languageToLocaleMap: Record<string, Locale> = {
  'English (US)': 'en',
  'English (British)': 'en',
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Portuguese (Brazil)': 'pt',
  'Portuguese (Portugal)': 'pt',
  'Portuguese': 'pt',
  'Chinese (Mandarin)': 'zh',
  'Chinese (Cantonese)': 'zh',
  'Chinese': 'zh',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Arabic (MSA)': 'ar',
  'Arabic': 'ar',
  'Hindi': 'hi',
};

export function getLocaleFromLanguage(language: string): Locale {
  const direct = languageToLocaleMap[language];
  if (direct) return direct;
  // Fallback: try normalized form without parentheticals, e.g., "Portuguese (Brazil)" -> "Portuguese"
  const normalized = (language || '').replace(/\s*\([^)]*\)/g, '').trim();
  return languageToLocaleMap[normalized] || defaultLocale;
}

export function getLanguageDirection(locale: Locale): 'ltr' | 'rtl' {
  // Determine RTL by base code; support common RTL languages
  const base = (locale || '').toLowerCase().split('-')[0];
  return ['ar', 'fa', 'he', 'ur', 'ps'].includes(base) ? 'rtl' : 'ltr';
}
