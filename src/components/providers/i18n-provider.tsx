"use client";

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';
import { defaultLocale, getLocaleFromLanguage, getLanguageDirection, type Locale } from '@/lib/i18n/config';
import { getLanguageCode } from '@/lib/azure-translator';

interface I18nProviderProps {
  children: React.ReactNode;
  messages: Record<string, any>;
}

/**
 * Flatten nested message object into array of leaf values
 */
function flattenMessages(messages: Record<string, any>, prefix = ''): string[] {
  const texts: string[] = [];
  
  for (const key in messages) {
    const value = messages[key];
    if (typeof value === 'string') {
      texts.push(value);
    } else if (typeof value === 'object' && value !== null) {
      texts.push(...flattenMessages(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  
  return texts;
}

/**
 * Rebuild message structure with translated texts
 */
function rebuildMessages(
  originalMessages: Record<string, any>,
  translations: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in originalMessages) {
    const value = originalMessages[key];
    if (typeof value === 'string') {
      result[key] = translations[value] || value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = rebuildMessages(value, translations);
    }
  }
  
  return result;
}

export function I18nProvider({ children, messages: initialMessages }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState(initialMessages);
  const [isTranslating, setIsTranslating] = useState(false);
  const [version, setVersion] = useState(0); // Force remount counter

  useEffect(() => {
    // Load saved language preference on mount only
    try {
      const savedLocale = localStorage.getItem("pp:locale");
      const savedLanguage = localStorage.getItem("pp:language");
      const newLocale = savedLocale || (savedLanguage ? (getLanguageCode(savedLanguage) || getLocaleFromLanguage(savedLanguage)) : null);
      if (newLocale && newLocale !== defaultLocale) {
        setLocale(newLocale as Locale);
        translateMessages(newLocale as Locale);
      }
    } catch {}
  }, []); // Run only on mount

  useEffect(() => {
    // Listen for language change events
    const handleLanguageChange = (event: CustomEvent) => {
      const language = event.detail?.language as string | undefined;
      const localeFromEvent = event.detail?.locale as string | undefined;
      const newLocale = (localeFromEvent || (language ? (getLanguageCode(language) || getLocaleFromLanguage(language)) : defaultLocale)) as Locale;
      console.log('Language changed to:', language, 'locale:', newLocale);
      setLocale(newLocale);
      
      // If switching back to English, use original messages
      if (newLocale === defaultLocale) {
        setMessages(initialMessages);
      } else {
        translateMessages(newLocale);
      }
    };

    window.addEventListener('pp:language:changed', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('pp:language:changed', handleLanguageChange as EventListener);
    };
  }, [initialMessages]); // Only depend on initialMessages

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = getLanguageDirection(locale);
    } catch {}
  }, [locale]);

  async function translateMessages(targetLocale: Locale) {
    if (isTranslating) {
      console.log('Translation already in progress, skipping...');
      return;
    }
    
    console.log('Starting translation to:', targetLocale);
    setIsTranslating(true);
    
    try {
      // Flatten all message texts
      const texts = flattenMessages(initialMessages);
      console.log('Translating', texts.length, 'texts to', targetLocale);
      
      // Convert locale to language code if needed
      const targetCode = getLanguageCode(targetLocale) || targetLocale;
      const sourceCode = getLanguageCode(defaultLocale) || defaultLocale;
      
      // Call translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          texts,
          targetLang: targetCode,
          sourceLang: sourceCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Emit failure event if this was due to unsupported language
        if (errorData.failedLanguage) {
          window.dispatchEvent(new CustomEvent('pp:translation:failed', { 
            detail: { language: errorData.failedLanguage } 
          }));
        }
        throw new Error('Translation failed');
      }

      const data = await response.json();
      console.log('Translation complete, received', Object.keys(data.translations).length, 'translations');
      console.log('Sample translations:', Object.entries(data.translations).slice(0, 3));
      
      // Rebuild message structure with translations
      const translatedMessages = rebuildMessages(initialMessages, data.translations);
      console.log('Rebuilt messages structure, updating UI...');
      console.log('Sample rebuilt:', {
        'navbar.console': translatedMessages.navbar?.console,
        'common.login': translatedMessages.common?.login
      });
      setMessages(translatedMessages);
      setVersion(v => v + 1); // Increment to force remount
      try {
        window.dispatchEvent(new CustomEvent('pp:messages:translated', { detail: { locale: targetLocale } }));
      } catch {}
      console.log('✅ UI updated with translated messages, version:', version + 1);
    } catch (error) {
      console.error('Failed to translate messages:', error);
      // Fallback to original messages
      setMessages(initialMessages);
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <NextIntlClientProvider 
      key={`${locale}-${version}`} // Force remount when locale or version changes
      locale={locale} 
      messages={messages}
      timeZone="America/Denver"
    >
      {children}
    </NextIntlClientProvider>
  );
}
