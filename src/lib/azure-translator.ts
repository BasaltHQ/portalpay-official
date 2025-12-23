/**
 * Azure Text Translation v3 API integration
 * Uses the multi-service Cognitive Services endpoint
 */

import { getLocaleFromLanguage, type Locale } from './i18n/config';

const TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT?.replace(/\/$/, '') || 'https://api.cognitive.microsofttranslator.com';
const TRANSLATOR_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const TRANSLATOR_REGION = 'eastus2'; // Region for Panopticon resource
const API_VERSION = '3.0';

export interface TranslationRequest {
  text: string;
}

export interface TranslationResult {
  translations: Array<{
    text: string;
    to: string;
  }>;
}

export interface BatchTranslationResult {
  [sourceText: string]: string;
}

/**
 * Translate multiple texts to a target language using Azure Text Translation v3
 * @param texts Array of texts to translate
 * @param targetLocale Target language locale (e.g., 'es', 'fr', 'de')
 * @param sourceLocale Source language locale (defaults to 'en')
 * @returns Object mapping source texts to translated texts
 */
export async function translateTexts(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale = 'en'
): Promise<BatchTranslationResult> {
  if (!TRANSLATOR_KEY) {
    throw new Error('Azure Translator API key not configured');
  }

  if (texts.length === 0) {
    return {};
  }

  // Azure Translator supports up to 100 texts per request
  const batchSize = 100;
  const results: BatchTranslationResult = {};

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await translateBatch(batch, targetLocale, sourceLocale);
    Object.assign(results, batchResults);
  }

  return results;
}

async function translateBatch(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale,
  retryCount = 0
): Promise<BatchTranslationResult> {
  const MAX_RETRIES = 2;
  const url = `${TRANSLATOR_ENDPOINT}/translate?api-version=${API_VERSION}&from=${sourceLocale}&to=${targetLocale}`;

  const requestBody: TranslationRequest[] = texts.map(text => ({ text }));

  try {
    console.log('Translation request URL:', url);
    console.log('Request body sample:', requestBody.slice(0, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error response:', errorText);
      throw new Error(`Translation API error: ${response.status} - ${errorText}`);
    }

    const translationResults: TranslationResult[] = await response.json();
    console.log('Translation API response sample:', translationResults.slice(0, 2));

    // Map source texts to translated texts
    const results: BatchTranslationResult = {};
    texts.forEach((sourceText, index) => {
      const translatedText = translationResults[index]?.translations[0]?.text;
      if (translatedText) {
        results[sourceText] = translatedText;
      } else {
        // Fallback to source text if translation failed
        results[sourceText] = sourceText;
      }
    });

    return results;
  } catch (error) {
    console.error(`Translation error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
    
    // Retry on network errors or timeouts
    if (retryCount < MAX_RETRIES && (error instanceof TypeError || (error as any).name === 'AbortError')) {
      console.log(`Retrying translation in ${(retryCount + 1) * 1000}ms...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      return translateBatch(texts, targetLocale, sourceLocale, retryCount + 1);
    }
    
    // Return source texts as fallback after all retries exhausted
    const fallback: BatchTranslationResult = {};
    texts.forEach(text => {
      fallback[text] = text;
    });
    return fallback;
  }
}

/**
 * Language name to Azure Translator language code mapping
 * Based on Azure Translator supported languages: https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support
 */
export const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  // Major languages
  'English': 'en',
  'English (US)': 'en',
  'English (British)': 'en',
  'English (Australian)': 'en',
  'English (Canadian)': 'en',
  'English (Indian)': 'en',
  'English (Nigerian)': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'French (Canadian)': 'fr-ca',
  'German': 'de',
  'Portuguese (Portugal)': 'pt-pt',
  'Portuguese (Brazil)': 'pt',
  'Chinese (Mandarin)': 'zh-Hans',
  'Chinese (Cantonese)': 'yue',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Arabic (MSA)': 'ar',
  'Hindi': 'hi',
  'Russian': 'ru',
  'Italian': 'it',
  
  // African languages (only verified working languages)
  'Afrikaans': 'af',
  'Amharic': 'am',
  'Somali': 'so',
  'Swahili': 'sw',
  'Zulu': 'zu',
  
  // Asian languages - South
  'Kannada': 'kn',
  'Malayalam': 'ml',
  'Marathi': 'mr',
  'Nepali': 'ne',
  'Odia': 'or',
  'Punjabi (Gurmukhi)': 'pa',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Urdu': 'ur',
  
  // Asian languages - Southeast
  'Burmese': 'my',
  'Filipino': 'fil',
  'Indonesian': 'id',
  'Khmer': 'km',
  'Lao': 'lo',
  'Malay': 'ms',
  'Thai': 'th',
  'Vietnamese': 'vi',
  
  // Asian languages - East
  'Cantonese (Chinese)': 'yue',
  'Mongolian': 'mn',
  
  // Asian languages - Central
  'Kazakh': 'kk',
  'Kyrgyz': 'ky',
  'Tajik': 'tg',
  'Turkmen': 'tk',
  'Uzbek': 'uz',
  
  // Middle Eastern languages
  'Arabic (Algeria)': 'ar',
  'Arabic (Egypt)': 'ar',
  'Arabic (Gulf)': 'ar',
  'Arabic (Iraq)': 'ar',
  'Arabic (Levant)': 'ar',
  'Arabic (Morocco)': 'ar',
  'Arabic (Sudan)': 'ar',
  'Armenian (Eastern)': 'hy',
  'Armenian (Western)': 'hy',
  'Azerbaijani (North)': 'az',
  'Hebrew': 'he',
  'Kurdish (Kurmanji)': 'ku',
  'Pashto': 'ps',
  'Persian (Farsi)': 'fa',
  'Turkish': 'tr',
  
  // European languages - Western
  'Catalan': 'ca',
  'Danish': 'da',
  'Dutch': 'nl',
  'Finnish': 'fi',
  'Galician': 'gl',
  'Icelandic': 'is',
  'Irish': 'ga',
  'Norwegian': 'nb',
  'Norwegian (Bokmål)': 'nb',
  'Swedish': 'sv',
  'Welsh': 'cy',
  
  // European languages - Eastern
  'Albanian': 'sq',
  'Bosnian': 'bs',
  'Bulgarian': 'bg',
  'Croatian': 'hr',
  'Czech': 'cs',
  'Estonian': 'et',
  'Greek': 'el',
  'Hungarian': 'hu',
  'Latvian': 'lv',
  'Lithuanian': 'lt',
  'Macedonian': 'mk',
  'Maltese': 'mt',
  'Polish': 'pl',
  'Romanian': 'ro',
  'Serbian': 'sr-Cyrl',
  'Slovak': 'sk',
  'Slovenian': 'sl',
  'Ukrainian': 'uk',
  
  // Americas
  'Haitian Creole': 'ht',
  'Guarani': 'gn',
  'Quechua': 'qu',
  
  // Pacific
  'Fijian': 'fj',
  'Maori': 'mi',
  'Samoan': 'sm',
  'Tahitian': 'ty',
  'Tongan': 'to',
};

/**
 * Get Azure Translator language code from language name or code
 * @param languageNameOrCode - Either a language name (e.g., "Spanish") or code (e.g., "es")
 * @returns The language code, or null if not supported
 */
export function getLanguageCode(languageNameOrCode: string): string | null {
  // Special case mappings for common locale codes
  const specialCases: Record<string, string> = {
    'zh': 'zh-Hans', // Chinese simplified
    'zh-CN': 'zh-Hans',
    'zh-TW': 'zh-Hant',
    'pt': 'pt',
    'fr': 'fr',
    'en': 'en',
    'es': 'es',
  };
  
  if (specialCases[languageNameOrCode]) {
    return specialCases[languageNameOrCode];
  }
  
  // If it's already a valid language code, return it
  const allCodes = new Set(Object.values(LANGUAGE_NAME_TO_CODE));
  if (allCodes.has(languageNameOrCode)) {
    return languageNameOrCode;
  }
  
  // Direct lookup by name
  if (LANGUAGE_NAME_TO_CODE[languageNameOrCode]) {
    return LANGUAGE_NAME_TO_CODE[languageNameOrCode];
  }
  
  // Try normalized lookup (remove parentheticals, lowercase)
  const normalized = languageNameOrCode.replace(/\s*\([^)]*\)/g, '').trim();
  if (LANGUAGE_NAME_TO_CODE[normalized]) {
    return LANGUAGE_NAME_TO_CODE[normalized];
  }
  
  // Try case-insensitive lookup
  const lowerName = languageNameOrCode.toLowerCase();
  for (const [key, value] of Object.entries(LANGUAGE_NAME_TO_CODE)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  return null;
}

/**
 * Get supported language codes for translation
 */
export function getSupportedLanguages(): Locale[] {
  // Return unique language codes from our mapping
  const codes = new Set(Object.values(LANGUAGE_NAME_TO_CODE));
  return Array.from(codes) as Locale[];
}

/**
 * Check if a language is supported by Azure Translator
 */
export function isLanguageSupported(languageName: string): boolean {
  return getLanguageCode(languageName) !== null;
}
