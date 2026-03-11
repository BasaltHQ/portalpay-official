import { getLocaleFromLanguage, type Locale } from './i18n/config';
import { MASTER_LANGS_FLAT } from './master-langs';

export interface BatchTranslationResult {
  [sourceText: string]: string;
}

// ── Cloudflare M2M100 language set (100 languages) ───────────────────────
// Cloudflare expects the EXACT ISO code string for source_lang and target_lang.
const CF_SUPPORTED_CODES = new Set([
  "af", "am", "ar", "ast", "az", "ba", "be", "bg", "bn", "br",
  "bs", "ca", "ceb", "cs", "cy", "da", "de", "el", "en", "es",
  "et", "fa", "ff", "fi", "fr", "fy", "ga", "gd", "gl", "gu",
  "ha", "he", "hi", "hr", "ht", "hu", "hy", "id", "ig", "ilo",
  "is", "it", "ja", "jv", "ka", "kk", "km", "kn", "ko", "lb",
  "lg", "ln", "lo", "lt", "lv", "mg", "mk", "ml", "mn", "mr",
  "ms", "my", "ne", "nl", "no", "ns", "oc", "or", "pa", "pl",
  "ps", "pt", "ro", "ru", "sd", "si", "sk", "sl", "so", "sq",
  "sr", "ss", "su", "sv", "sw", "ta", "th", "tl", "tn", "tr",
  "uk", "ur", "uz", "vi", "wo", "xh", "yi", "yo", "zh", "zu",
  // Aliases that getLanguageCode() may produce — normalized below before calling CF
  "zh-Hans",
]);

// Map i18n-style locale codes back to what Cloudflare M2M100 actually accepts
const CF_CODE_NORMALIZE: Record<string, string> = {
  'zh-Hans': 'zh',
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

  const cfSource = CF_SUPPORTED_CODES.has(sourceLocale) ? (CF_CODE_NORMALIZE[sourceLocale] || sourceLocale) : 'en';
  const cfTargetRaw = CF_SUPPORTED_CODES.has(targetLocale) ? targetLocale : null;

  if (!cfTargetRaw) {
    throw new Error(`Cloudflare does not support locale: ${targetLocale}`);
  }

  // Normalize i18n codes back to what M2M100 actually accepts (e.g., zh-Hans → zh)
  const cfTarget = CF_CODE_NORMALIZE[cfTargetRaw] || cfTargetRaw;

  console.log(`[site-translator] 🌐 Cloudflare: translating ${texts.length} texts (${cfSource} → ${cfTarget})`);

  const results: BatchTranslationResult = {};
  const chunkSize = 25; // Reduced from 50 to prevent hammering the CF rate limits and stalling.
  let successCount = 0;
  let errorCount = 0;
  let lastError = '';

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);

    await Promise.all(chunk.map(async (text) => {
      let textSuccess = false;
      let retries = 0;
      const maxRetries = 3;

      while (!textSuccess && retries <= maxRetries) {
        if (retries > 0) {
          const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
          console.log(`[site-translator] CF Retry ${retries}/${maxRetries} after ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
        }

        try {
          // 30s timeout per request so one slow response doesn't block the batch
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 30000);

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
          const translatedText = data.result?.translated_text ?? data.result?.translated__text ?? '';
          if (data.success) {
            // If CF returns success but empty translated_text, the input is
            // untranslatable (brand names, ticker symbols, etc.) — pass it through.
            results[text] = translatedText || text;
            successCount++;
            textSuccess = true;
          } else {
            lastError = `CF returned success=${data.success}, result=${JSON.stringify(data.result).substring(0, 200)}`;
            throw new Error(lastError);
          }
        } catch (err) {
          if (err instanceof Error) lastError = err.message;
          console.error(`[site-translator] CF single text attempt ${retries + 1} failed: ${lastError}`);
          retries++;
          
          if (retries > maxRetries) {
            errorCount++;
            console.error(`[site-translator] CF single text permanently failed after ${maxRetries} retries.`);
          }
        }
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
 * SECONDARY ENGINE: Cloudflare Llama 3.1 (8B) 
 * Used exclusively for fictional/constructed languages (e.g. Elvish, Klingon, Pirate Speak)
 * that don't have an ISO code but can be generated creatively by an LLM.
 */
async function translateWithLlama(
  texts: string[],
  targetLanguageName: string
): Promise<BatchTranslationResult> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error('Cloudflare credentials missing for LLM translation.');
  }

  console.log(`[site-translator] 🦙 LLM: translating ${texts.length} texts to ${targetLanguageName} (1-at-a-time mode)`);

  const results: BatchTranslationResult = {};
  let successCount = 0;
  let errorCount = 0;
  let lastError = '';

  const systemPrompt = `You are an expert pop-culture linguist. Translate the user's text into ${targetLanguageName}.
RULES:
1. Return ONLY the translated text. Nothing else.
2. No quotes, no explanations, no labels, no prefixes like "Translation:".
3. If ${targetLanguageName} is a phonetic accent, cipher, or fictional gibberish (e.g. Minionese, Groot, Pirate Speak, Gen Z Slang), generate a highly thematic approximation.
4. If the input is a number, symbol, or untranslatable token (like "$1.00"), return it unchanged.`;

  // Translate each string individually via concurrent batches of 5
  const concurrency = 5;
  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);

    await Promise.all(batch.map(async (text) => {
      // Skip very short or purely numeric/symbol strings
      if (!text.trim() || /^[\d$€£¥%.,\s:;/\\()\-+=#@!?&*]+$/.test(text.trim())) {
        results[text] = text;
        successCount++;
        return;
      }

      let retries = 0;
      const maxRetries = 3;

      while (retries <= maxRetries) {
        if (retries > 0) {
          const waitTime = Math.pow(2, retries) * 1000;
          await new Promise(r => setTimeout(r, waitTime));
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 30000);

          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                max_tokens: 256,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: text }
                ]
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timer);

          if (!response.ok) {
            throw new Error(`LLM ${response.status}`);
          }

          const data = await response.json();
          if (data.success && data.result?.response) {
            let translated = data.result.response.trim();
            // Strip any quotes the LLM may have wrapped around the response
            if (translated.startsWith('"') && translated.endsWith('"')) {
              translated = translated.slice(1, -1);
            }
            results[text] = translated;
            successCount++;
            return; // Success — exit retry loop
          } else {
            throw new Error('LLM no response');
          }
        } catch (err) {
          if (err instanceof Error) lastError = err.message;
          retries++;
          if (retries > maxRetries) {
            errorCount++;
            console.error(`[site-translator] LLM single-text failed after ${maxRetries} retries: "${text.substring(0, 30)}..."`);
          }
        }
      }
    }));
  }

  console.log(`[site-translator] 🦙 LLM results: ${successCount} success, ${errorCount} errors`);

  if (successCount === 0 && texts.length > 0) {
    throw new Error(`Cloudflare LLM failed for all texts. Last error: ${lastError}`);
  }

  return results;
}

/**
 * Main translation router
 */
export async function translateTexts(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: Locale = 'en'
): Promise<BatchTranslationResult> {
  if (!texts.length) return {};

  // Find if this is a standard ISO language (m2m100) or an LLM target
  // targetLocale is typically the ISO code OR the raw language name if it doesn't have an ISO code.
  if (CF_SUPPORTED_CODES.has(targetLocale)) {
    // ─── Standard Cloudflare M2M100 ────────────────────────────────
    try {
      return await translateWithCloudflare(texts, targetLocale, sourceLocale);
    } catch (cfError) {
      console.error('[site-translator] ⚠️ Cloudflare primary failed:', cfError);
      // Fallback to Google if m2m100 fails
      try {
        return await translateWithGoogle(texts, targetLocale, sourceLocale);
      } catch (googleError) {
        console.error('[site-translator] ⚠️ Google fallback also failed:', googleError);
      }
    }
  } else {
    // ─── Fictional/Constructed languages (LLM) ─────────────────────
    // Since it doesn't have an ISO code, targetLocale is just the English name of the fictional language
    try {
      return await translateWithLlama(texts, targetLocale);
    } catch (llmError) {
      console.error('[site-translator] ⚠️ Cloudflare LLM failed:', llmError);
    }
  }

  // ─── Failed ──────
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
  "Afrikaans": "af",
  "Amharic": "am",
  "Arabic": "ar",
  "Arabic (MSA)": "ar",
  "Arabic (Egypt)": "ar",
  "Arabic (Algeria)": "ar",
  "Arabic (Morocco)": "ar",
  "Arabic (Sudan)": "ar",
  "Arabic (Gulf)": "ar",
  "Arabic (Iraq)": "ar",
  "Arabic (Levant)": "ar",
  "Asturian": "ast",
  "Azerbaijani (North)": "az",
  "Azerbaijani (South)": "az",
  "Bashkir": "ba",
  "Belarusian": "be",
  "Bulgarian": "bg",
  "Bengali": "bn",
  "Breton": "br",
  "Bosnian": "bs",
  "Catalan": "ca",
  "Cebuano": "ceb",
  "Czech": "cs",
  "Welsh": "cy",
  "Danish": "da",
  "German": "de",
  "German (Austrian)": "de",
  "German (Swiss)": "de",
  "Swiss German": "de",
  "Greek": "el",
  "English": "en",
  "English (US)": "en",
  "English (British)": "en",
  "English (Canadian)": "en",
  "English (Australian)": "en",
  "English (Indian)": "en",
  "English (Nigerian)": "en",
  "Spanish": "es",
  "Estonian": "et",
  "Persian (Farsi)": "fa",
  "Dari": "fa",
  "Tajik": "fa",
  "Fula": "ff",
  "Fulah (Fulfulde)": "ff",
  "Finnish": "fi",
  "French": "fr",
  "French (Canadian)": "fr",
  "French (Belgian)": "fr",
  "French (Swiss)": "fr",
  "Western Frisian": "fy",
  "Frisian": "fy",
  "Irish": "ga",
  "Scottish Gaelic": "gd",
  "Galician": "gl",
  "Gujarati": "gu",
  "Hausa": "ha",
  "Hebrew": "he",
  "Hindi": "hi",
  "Croatian": "hr",
  "Haitian Creole": "ht",
  "Hungarian": "hu",
  "Armenian (Eastern)": "hy",
  "Armenian (Western)": "hy",
  "Indonesian": "id",
  "Igbo": "ig",
  "Ilocano": "ilo",
  "Icelandic": "is",
  "Italian": "it",
  "Japanese": "ja",
  "Javanese": "jv",
  "Georgian": "ka",
  "Kazakh": "kk",
  "Central Khmer": "km",
  "Khmer": "km",
  "Kannada": "kn",
  "Korean": "ko",
  "Luxembourgish": "lb",
  "Ganda": "lg",
  "Luganda": "lg",
  "Lingala": "ln",
  "Lao": "lo",
  "Lithuanian": "lt",
  "Latvian": "lv",
  "Malagasy": "mg",
  "Macedonian": "mk",
  "Malayalam": "ml",
  "Mongolian": "mn",
  "Marathi": "mr",
  "Malay": "ms",
  "Malaysian": "ms",
  "Burmese": "my",
  "Nepali": "ne",
  "Nepali (Indian)": "ne",
  "Dutch": "nl",
  "Flemish": "nl",
  "Norwegian": "no",
  "Norwegian (Bokmål)": "no",
  "Norwegian (Nynorsk)": "no",
  "Northern Sotho": "ns",
  "Occitan": "oc",
  "Odia": "or",
  "Oriya": "or",
  "Punjabi (Gurmukhi)": "pa",
  "Punjabi (Shahmukhi)": "pa",
  "Punjabi": "pa",
  "Polish": "pl",
  "Pashto": "ps",
  "Portuguese": "pt",
  "Portuguese (Brazil)": "pt",
  "Portuguese (Portugal)": "pt",
  "Romanian": "ro",
  "Russian": "ru",
  "Sindhi": "sd",
  "Sinhala": "si",
  "Slovak": "sk",
  "Slovenian": "sl",
  "Somali": "so",
  "Albanian": "sq",
  "Serbian": "sr",
  "Serbo-Croatian": "sr",
  "Swati": "ss",
  "Sundanese": "su",
  "Swedish": "sv",
  "Swahili": "sw",
  "Tamil": "ta",
  "Thai": "th",
  "Tagalog": "tl",
  "Filipino": "tl",
  "Tswana": "tn",
  "Setswana": "tn",
  "Turkish": "tr",
  "Ukrainian": "uk",
  "Urdu": "ur",
  "Urdu (Indian)": "ur",
  "Uzbek": "uz",
  "Vietnamese": "vi",
  "Wolof": "wo",
  "Xhosa": "xh",
  "Yiddish": "yi",
  "Yoruba": "yo",
  "Chinese (Mandarin)": "zh",
  "Chinese (Cantonese)": "zh",
  "Cantonese (Chinese)": "zh",
  "Chinese (Min)": "zh",
  "Chinese (Wu)": "zh",
  "Chinese (Hakka)": "zh",
  "Zulu": "zu"
};

export function getLanguageCode(languageNameOrCode: string): string | null {
  const specialCases: Record<string, string> = {
    'zh': 'zh-Hans',
    'zh-CN': 'zh-Hans',
    'zh-Hans': 'zh-Hans',
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
  
  // If it's a fictional language supported by LLM, its "code" is just its name.
  if (MASTER_LANGS_FLAT.includes(languageNameOrCode)) {
    return languageNameOrCode;
  }
  
  return null;
}

export function getSupportedLanguages(): Locale[] {
  // Now we support ALL languages defined in our flat master list
  return MASTER_LANGS_FLAT.filter(l => !l.toUpperCase().includes(' - ')) as Locale[];
}

export function isLanguageSupported(languageName: string): boolean {
  // Check if it's one of the ISO mapped ones
  if (getLanguageCode(languageName) !== null) return true;
  // Otherwise, if it's in our master list, Llama supports it!
  return MASTER_LANGS_FLAT.includes(languageName);
}

