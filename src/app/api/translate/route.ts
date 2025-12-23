import { NextRequest, NextResponse } from 'next/server';
import { translateTexts, getLanguageCode, isLanguageSupported } from '@/lib/azure-translator';
import { getOrTranslate } from '@/lib/translation-cache';
import { type Locale } from '@/lib/i18n/config';

export interface TranslateRequest {
  texts: string[];
  targetLang: Locale;
  sourceLang?: Locale;
}

export interface TranslateResponse {
  translations: Record<string, string>;
  cached: number;
  translated: number;
}

/**
 * POST /api/translate
 * Translate multiple texts to a target language with automatic caching
 */
export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();

    let { texts, targetLang, sourceLang = 'en' } = body;

    // Validation
    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'texts must be a non-empty array' },
        { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    if (!targetLang) {
      return NextResponse.json(
        { error: 'targetLang is required' },
        { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    // Convert language names to language codes if needed
    // This handles cases where the frontend passes language names like "Hausa" or "Gujarati"
    const targetCode = getLanguageCode(targetLang);
    const sourceCode = getLanguageCode(sourceLang) || sourceLang;

    if (!targetCode) {
      console.warn(`Unsupported target language: ${targetLang}`);
      return NextResponse.json(
        { 
          error: `Language "${targetLang}" is not supported by the translation service`,
          supportedLanguages: 'Check language mapping in azure-translator.ts',
          failedLanguage: targetLang
        },
        { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    // Use the language codes for translation
    targetLang = targetCode as Locale;
    sourceLang = sourceCode as Locale;

    // If source and target are the same, return identity mapping
    if (sourceLang === targetLang) {
      const translations: Record<string, string> = {};
      texts.forEach(text => {
        translations[text] = text;
      });
      return NextResponse.json({
        translations,
        cached: texts.length,
        translated: 0,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    // Get translations with caching
    const translationMap = await getOrTranslate(
      texts,
      targetLang,
      sourceLang,
      translateTexts
    );

    // Convert Map to object for JSON response
    const translations: Record<string, string> = {};
    translationMap.forEach((value, key) => {
      translations[key] = value;
    });

    // Calculate stats (this is approximate since we don't track which were cached vs translated)
    const response: TranslateResponse = {
      translations,
      cached: 0, // Would need to track this in getOrTranslate
      translated: texts.length,
    };

    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Translation API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Translation failed';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

/**
 * GET /api/translate
 * Get translation service status
 */
export async function GET() {
  const configured = !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
  const cosmosConfigured = !!process.env.COSMOS_CONNECTION_STRING;

  return NextResponse.json({
    status: 'ok',
    translatorConfigured: configured,
    cacheConfigured: cosmosConfigured,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'not configured',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
