import { getLocaleFromLanguage, type Locale } from './i18n/config';

export interface BatchTranslationResult {
  [sourceText: string]: string;
}

// ── Cloudflare M2M100 language map ──────────────────────────────────────
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
  // add more as needed
};

/**
 * PRIMARY ENGINE: Cloudflare Workers AI (@cf/meta/m2m100-1.2b)
 * Uses authenticated API — works reliably from any server IP (datacenter or not).
 * Processes requests in parallel chunks to stay under rate limits.
 */
async function translateWithCloudflare(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale
): Promise<BatchTranslationResult> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    console.error('[site-translator] ❌ CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set!');
    console.error('[site-translator] Available env vars:', {
      hasCfToken: !!process.env.CLOUDFLARE_API_TOKEN,
      hasCfAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      tokenLength: token?.length || 0,
      accountIdLength: accountId?.length || 0,
    });
    throw new Error('Cloudflare credentials missing. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
  }

  const cfSource = CF_LANGUAGE_MAP[sourceLocale] || 'english';
  const cfTarget = CF_LANGUAGE_MAP[targetLocale];

  if (!cfTarget) {
    throw new Error(`Cloudflare does not support locale: ${targetLocale}`);
  }

  console.log(`[site-translator] 🌐 Cloudflare: translating ${texts.length} texts (${cfSource} → ${cfTarget})`);

  const results: BatchTranslationResult = {};
  const chunkSize = 50; // CF handles 50 concurrent well — confirmed by testing.
  let successCount = 0;
  let errorCount = 0;
  let lastError = '';

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);

    await Promise.all(chunk.map(async (text) => {
      try {
        // 15s timeout per request so one slow response doesn't block the batch
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              source_lang: cfSource,
              target_lang: cfTarget,
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timer);

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          lastError = `CF ${response.status}: ${body.substring(0, 200)}`;
          throw new Error(lastError);
        }

        const data = await response.json();
        // CF sometimes returns "translated__text" (double underscore) instead of "translated_text"
        const translatedText = data.result?.translated_text || data.result?.translated__text;
        if (data.success && translatedText) {
          results[text] = translatedText;
          successCount++;
        } else {
          lastError = `CF returned success=${data.success}, result=${JSON.stringify(data.result).substring(0, 200)}`;
          errorCount++;
        }
      } catch (err) {
        errorCount++;
        if (err instanceof Error) lastError = err.message;
        console.error(`[site-translator] CF single text failed: ${lastError}`);
      }
    }));
  }

  console.log(`[site-translator] Cloudflare results: ${successCount} success, ${errorCount} errors out of ${texts.length}`);

  if (successCount === 0 && texts.length > 0) {
    throw new Error(`Cloudflare failed for all ${texts.length} texts. Last error: ${lastError}`);
  }

  return results;
}

/**
 * FALLBACK ENGINE: Google Translate (free undocumented endpoint)
 * Works great from residential/consumer IPs but often blocked on datacenter IPs.
 */
async function translateWithGoogle(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale
): Promise<BatchTranslationResult> {
  const DELIMITER = '\\n__SEP__\\n';
  const batchSize = 30;
  let results: BatchTranslationResult = {};

  console.log(`[site-translator] 🔍 Google: translating ${texts.length} texts (${sourceLocale} → ${targetLocale})`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const joinedText = batch.join(DELIMITER);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLocale}&tl=${targetLocale}&dt=t&q=${encodeURIComponent(joinedText)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google API failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const fullTranslationString = data[0].map((s: any) => s[0]).join('');
    const splitRegex = new RegExp(`\\\\n__SEP__\\\\n|__SEP__`, 'gi');
    const splits = fullTranslationString.split(splitRegex).map((s: string) => s.trim());

    if (splits.length === batch.length) {
      batch.forEach((text, index) => {
        results[text] = splits[index];
      });
    } else {
      console.warn(`[site-translator] Google scrambled delimiters: expected ${batch.length} but got ${splits.length}`);
      throw new Error('Google Translate scrambled delimiters');
    }
  }

  console.log(`[site-translator] Google: successfully translated ${Object.keys(results).length} texts`);
  return results;
}

/**
 * Main translation function.
 * Strategy: Cloudflare FIRST (authenticated, works from any IP),
 *           Google SECOND (free, but blocked on datacenter IPs).
 *
 * If BOTH fail, this function THROWS so that upper layers do NOT cache
 * English text as a "translation".
 */
export async function translateTexts(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale = 'en'
): Promise<BatchTranslationResult> {
  if (texts.length === 0) return {};

  // ─── Try Cloudflare first (reliable from any IP) ───────────────
  try {
    return await translateWithCloudflare(texts, targetLocale, sourceLocale);
  } catch (cfError) {
    console.error('[site-translator] ⚠️ Cloudflare primary failed:', cfError);
    console.log('[site-translator] Falling back to Google Translate...');
  }

  // ─── Fallback to Google ────────────────────────────────────────
  try {
    return await translateWithGoogle(texts, targetLocale, sourceLocale);
  } catch (googleError) {
    console.error('[site-translator] ⚠️ Google fallback also failed:', googleError);
  }

  // ─── BOTH failed: throw so nothing gets cached as English ──────
  throw new Error(
    'All translation engines failed. Check CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID env vars, and network connectivity.'
  );
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
