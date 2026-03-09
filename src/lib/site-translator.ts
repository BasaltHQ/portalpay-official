import { getLocaleFromLanguage, type Locale } from './i18n/config';

export interface BatchTranslationResult {
  [sourceText: string]: string;
}

/**
 * Fallback to Cloudflare Workers AI using the @cf/meta/m2m100-1.2b model
 */
async function fallbackToCloudflare(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale
): Promise<BatchTranslationResult> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    console.warn('Cloudflare tokens missing. Returning original texts.');
    return returnFallback(texts);
  }

  // Cloudflare M2M100 supported language English names mapping
  // Map ISO codes to full language names since CF requires them
  const CF_LANGUAGE_MAP: Record<string, string> = {
    'en': 'english',
    'es': 'spanish',
    'fr': 'french',
    'de': 'german',
    'pt': 'portuguese',
    'zh-Hans': 'chinese',
    'ja': 'japanese',
    'ko': 'korean',
    'ar': 'arabic',
    'hi': 'hindi',
    'ru': 'russian',
    'it': 'italian',
    // add more if needed
  };

  const cfSource = CF_LANGUAGE_MAP[sourceLocale] || 'english';
  const cfTarget = CF_LANGUAGE_MAP[targetLocale];

  if (!cfTarget) {
    console.warn(`Cloudflare fallback does not support locale: ${targetLocale}`);
    return returnFallback(texts);
  }

  const results: BatchTranslationResult = {};
  
  // M2M100 handles one text per request. To avoid rate limits on CF, we chunk parallel requests 
  // into small batches of 5 at a time, or we just do them consecutively. We'll do simple consecutive to be safe, 
  // as this is just the fallback mechanism. It might be slower but highly resilient.
  for (const text of texts) {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          source_lang: cfSource,
          target_lang: cfTarget
        })
      });

      if (!response.ok) {
        throw new Error('CF API Error: ' + response.status);
      }

      const data = await response.json();
      if (data.success && data.result && data.result.translated_text) {
        results[text] = data.result.translated_text;
      } else {
        results[text] = text;
      }
    } catch (err) {
      console.error('Cloudflare Translation single text failed:', err);
      results[text] = text;
    }
  }

  return results;
}

/**
 * Primary Engine: Google Translate API (Free Undocumented)
 * Handles bulk arrays joined by a separator character
 */
export async function translateTexts(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale = 'en'
): Promise<BatchTranslationResult> {
  if (texts.length === 0) return {};

  const DELIMITER = '\\n__SEP__\\n';
  
  // Google limits get tricky around 5000 characters, so we batch them safely.
  const batchSize = 30; // Handle 30 at a time via Google to keep URL query strings short
  let results: BatchTranslationResult = {};

  try {
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const joinedText = batch.join(DELIMITER);
      
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLocale}&tl=${targetLocale}&dt=t&q=${encodeURIComponent(joinedText)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google API failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Google splits string responses sometimes, join them first
      const fullTranslationString = data[0].map((s: any) => s[0]).join('');
      
      // Split the string by the translated delimiter (allow for minor space shifts)
      const splitRegex = new RegExp(`\\\\n__SEP__\\\\n|__SEP__`, 'gi');
      const splits = fullTranslationString.split(splitRegex).map((s: string) => s.trim());

      if (splits.length === batch.length) {
        batch.forEach((text, index) => {
          results[text] = splits[index];
        });
      } else {
        // Delimiter was lost or mangled in translation! 
        // Fallback to translating that specific batch sequentially or use CF.
        console.warn(`Google Translate scramble: expected ${batch.length} elements but got ${splits.length}`);
        throw new Error('Google Translate scrambled the delimiters, falling back.');
      }
    }

    return results;

  } catch (error) {
    console.error('Primary Google Translate failed:', error);
    console.log('Failing over to Cloudflare Workers AI...');
    // Fall back to cloudflare! 
    return await fallbackToCloudflare(texts, targetLocale, sourceLocale);
  }
}

function returnFallback(texts: string[]): BatchTranslationResult {
  const fallback: BatchTranslationResult = {};
  texts.forEach(text => {
    fallback[text] = text;
  });
  return fallback;
}

/**
 * Language name to Language code mapping
 */
export const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  'English': 'en',
  'English (US)': 'en',
  'English (British)': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'French (Canadian)': 'fr',
  'German': 'de',
  'Portuguese (Portugal)': 'pt',
  'Portuguese (Brazil)': 'pt',
  'Chinese (Mandarin)': 'zh-Hans',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Arabic (MSA)': 'ar',
  'Hindi': 'hi',
  'Russian': 'ru',
  'Italian': 'it',
  // Extrapolate list... (reduced to key ones as per config)
};

export function getLanguageCode(languageNameOrCode: string): string | null {
  const specialCases: Record<string, string> = {
    'zh': 'zh-Hans',
    'zh-CN': 'zh-Hans',
    'pt': 'pt',
    'fr': 'fr',
    'en': 'en',
    'es': 'es',
  };
  
  if (specialCases[languageNameOrCode]) {
    return specialCases[languageNameOrCode];
  }
  
  const allCodes = new Set(Object.values(LANGUAGE_NAME_TO_CODE));
  if (allCodes.has(languageNameOrCode)) {
    return languageNameOrCode;
  }
  
  if (LANGUAGE_NAME_TO_CODE[languageNameOrCode]) {
    return LANGUAGE_NAME_TO_CODE[languageNameOrCode];
  }
  
  const lowerName = languageNameOrCode.toLowerCase();
  for (const [key, value] of Object.entries(LANGUAGE_NAME_TO_CODE)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  return null;
}

export function getSupportedLanguages(): Locale[] {
  const codes = new Set(Object.values(LANGUAGE_NAME_TO_CODE));
  return Array.from(codes) as Locale[];
}

export function isLanguageSupported(languageName: string): boolean {
  return getLanguageCode(languageName) !== null;
}
