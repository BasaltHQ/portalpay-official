/**
 * Translation cache manager using Cosmos DB
 * Caches translations to minimize API calls and reduce costs
 */

import { Container, CosmosClient } from '@azure/cosmos';
import type { Locale } from './i18n/config';
import crypto from 'crypto';

// Cosmos DB configuration
const connectionString = process.env.COSMOS_CONNECTION_STRING || '';
const databaseId = process.env.COSMOS_PAYPORTAL_DB_ID || 'payportal';
const containerId = 'translations_cache';

let cosmosClient: CosmosClient | null = null;
let translationsContainer: Container | null = null;

/**
 * Initialize Cosmos DB client and container
 */
function getContainer(): Container | null {
  if (!connectionString) {
    console.warn('Cosmos DB connection string not configured, translation cache disabled');
    return null;
  }

  if (!cosmosClient) {
    cosmosClient = new CosmosClient(connectionString);
  }

  if (!translationsContainer) {
    translationsContainer = cosmosClient
      .database(databaseId)
      .container(containerId);
  }

  return translationsContainer;
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
  const container = getContainer();
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
  const container = getContainer();
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
      console.error('Translation failed:', error);
      // Return what we have cached, with source text fallback for failures
      uncached.forEach(text => {
        if (!cached.has(text)) {
          cached.set(text, text);
        }
      });
    }
  }

  return cached;
}
