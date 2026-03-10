/**
 * Translation cache manager using the shared database adapter.
 * Caches translations to minimize API calls and reduce costs.
 * Routes through getContainer() which handles both Cosmos DB and MongoDB.
 */

import { getContainer as getSharedContainer } from '@/lib/cosmos';
import type { Container } from '@azure/cosmos';
import type { Locale } from './i18n/config';
import crypto from 'crypto';

// Use a dedicated collection for translations
const TRANSLATIONS_DB = process.env.DB_NAME || process.env.COSMOS_PAYPORTAL_DB_ID || 'payportal';
const TRANSLATIONS_COLLECTION = 'translations_cache';

let translationsContainer: Container | null = null;

/**
 * Initialize container via the shared adapter (MongoDB or Cosmos DB)
 */
async function getContainer(): Promise<Container | null> {
  if (translationsContainer) return translationsContainer;
  try {
    translationsContainer = await getSharedContainer(TRANSLATIONS_DB, TRANSLATIONS_COLLECTION);
    return translationsContainer;
  } catch (err) {
    console.warn('Translation cache container unavailable:', (err as Error)?.message || err);
    return null;
  }
}

/**
 * Generate a cache key for a translation
 */
function getCacheKey(sourceText: string, sourceLang: Locale, targetLang: Locale): string {
  const content = `${sourceText}|${sourceLang}|${targetLang}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export interface CachedTranslation {
  id: string;
  sourceText: string;
  sourceLang: Locale;
  targetLang: Locale;
  translatedText: string;
  timestamp: number;
}

/**
 * Get cached translations for multiple texts
 * @returns Map of source texts to their cached translations (only for texts that have cached translations)
 */
export async function getCachedTranslations(
  texts: string[],
  sourceLang: Locale,
  targetLang: Locale
): Promise<Map<string, string>> {
  const container = await getContainer();
  if (!container) {
    return new Map();
  }

  const results = new Map<string, string>();

  try {
    // Build queries for each text
    const queries = texts.map(text => {
      const id = getCacheKey(text, sourceLang, targetLang);
      return container!.item(id, id).read<CachedTranslation>();
    });

    // Execute all queries in parallel
    const responses = await Promise.allSettled(queries);

    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value.resource) {
        const cached = response.value.resource;
        results.set(texts[index], cached.translatedText);
      }
    });
  } catch (error) {
    console.error('Error reading from translation cache:', error);
  }

  return results;
}

/**
 * Cache multiple translations
 */
export async function cacheTranslations(
  translations: Map<string, string>,
  sourceLang: Locale,
  targetLang: Locale
): Promise<void> {
  const container = await getContainer();
  if (!container || translations.size === 0) {
    return;
  }

  try {
    const timestamp = Date.now();
    const items: CachedTranslation[] = [];

    translations.forEach((translatedText, sourceText) => {
      const id = getCacheKey(sourceText, sourceLang, targetLang);
      items.push({
        id,
        sourceText,
        sourceLang,
        targetLang,
        translatedText,
        timestamp,
      });
    });

    // Batch upsert all translations
    const upsertPromises = items.map(item =>
      container!.items.upsert(item).catch(err => {
        console.error(`Failed to cache translation for "${item.sourceText}":`, err);
      })
    );

    await Promise.all(upsertPromises);
  } catch (error) {
    console.error('Error caching translations:', error);
  }
}

/**
 * Get or translate texts with automatic caching
 * @param texts Texts to translate
 * @param targetLang Target language
 * @param sourceLang Source language (defaults to 'en')
 * @param translator Function to translate uncached texts
 * @returns Map of source texts to translated texts
 */
export async function getOrTranslate(
  texts: string[],
  targetLang: Locale,
  sourceLang: Locale,
  translator: (texts: string[], targetLang: Locale, sourceLang: Locale) => Promise<Record<string, string>>
): Promise<Map<string, string>> {
  // If target is same as source, return identity mapping
  if (targetLang === sourceLang) {
    const results = new Map<string, string>();
    texts.forEach(text => results.set(text, text));
    return results;
  }

  // Get cached translations
  const cached = await getCachedTranslations(texts, sourceLang, targetLang);

  // Identify texts that need translation
  const uncached = texts.filter(text => !cached.has(text));

  // Translate uncached texts if any
  if (uncached.length > 0) {
    try {
      const newTranslations = await translator(uncached, targetLang, sourceLang);

      // Cache the new translations
      const toCache = new Map<string, string>();
      Object.entries(newTranslations).forEach(([source, translated]) => {
        toCache.set(source, translated);
        cached.set(source, translated);
      });

      if (toCache.size > 0) {
        // Fire and forget caching - don't block on this
        cacheTranslations(toCache, sourceLang, targetLang).catch(err =>
          console.error('Failed to cache translations:', err)
        );
      }
    } catch (error) {
      console.error('[translation-cache] Translation engine failed:', error);
      // 🔥 CRITICAL FIX: Do NOT silently return English source text here.
      // If we return source text, the frontend will cache it as a valid translation.
      // Instead, we throw the error so the API returns a 500, and the frontend
      // knows to try again later instead of caching English as Spanish.
      throw error;
    }
  }

  return cached;
}
