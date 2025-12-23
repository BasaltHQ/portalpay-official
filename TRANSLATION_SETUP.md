# Azure AI Translation Setup Guide

This guide explains how to set up and use the Azure AI Translator integration with caching.

## Prerequisites

1. **Azure Cognitive Services endpoint** (already configured)
   - Endpoint: `https://panopticon.cognitiveservices.azure.com`
   - API Key: Configured in `AZURE_OPENAI_API_KEY`

2. **Cosmos DB** (already configured)
   - Connection string: `COSMOS_CONNECTION_STRING`
   - Database: `payportal`

## Setup Steps

### 1. Create Cosmos DB Container for Translation Cache

Run this command using Azure CLI or execute in Azure Portal:

```bash
az cosmosdb sql container create \
  --account-name skynetpod \
  --database-name payportal \
  --name translations_cache \
  --partition-key-path "/id" \
  --throughput 400
```

Or create via Azure Portal:
1. Navigate to your Cosmos DB account (`skynetpod`)
2. Select database `payportal`
3. Click "New Container"
4. Container ID: `translations_cache`
5. Partition key: `/id`
6. Throughput: 400 RU/s (or use shared throughput)

### 2. Verify Configuration

Check that all environment variables are set:

```bash
# Should be configured in .env
AZURE_OPENAI_ENDPOINT=https://panopticon.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=APIKEY
COSMOS_CONNECTION_STRING=AccountEndpoint=https://skynetpod.documents.azure.com:443/;AccountKey=...
COSMOS_PAYPORTAL_DB_ID=payportal
```

### 3. Test the Translation Service

#### Test API Status
```bash
curl http://localhost:3001/api/translate
```

Expected response:
```json
{
  "status": "ok",
  "translatorConfigured": true,
  "cacheConfigured": true,
  "endpoint": "https://panopticon.cognitiveservices.azure.com"
}
```

#### Test Translation
```bash
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Goodbye", "Thank you"],
    "targetLang": "es",
    "sourceLang": "en"
  }'
```

Expected response:
```json
{
  "translations": {
    "Hello": "Hola",
    "Goodbye": "Adiós",
    "Thank you": "Gracias"
  },
  "cached": 0,
  "translated": 3
}
```

## How It Works

### Architecture

1. **Language Selection**
   - User selects language from dropdown in language selector bar
   - Selection saved to `localStorage` as `pp:language`
   - Event `pp:language:changed` dispatched

2. **Translation Flow**
   ```
   User selects language
   → I18nProvider detects change
   → Flattens all English messages
   → Calls /api/translate
   → API checks Cosmos cache
   → Translates uncached texts via Azure
   → Stores in Cosmos cache
   → Returns all translations
   → UI updates with translated messages
   ```

3. **Caching Strategy**
   - Each translation cached forever (translations don't change)
   - Cache key: `SHA256(sourceText|sourceLang|targetLang)`
   - First user pays for translation
   - Subsequent users get cached results (free)
   - Batch translations (up to 100 texts per API call)

### Cost Optimization

**Azure Translator Pricing:**
- Standard: $10 per million characters
- Free tier: 2M characters/month

**Typical Costs:**
- UI messages: ~50 strings × 20 chars = 1,000 chars
- Translation to one language: $0.01
- Translation to 10 languages: $0.10
- **After cache**: $0.00 (all subsequent requests free)

**Cosmos DB:**
- Container: 400 RU/s = ~$24/month
- Or use database-level shared throughput

### Supported Languages

The system supports translation to all languages in `master-langs.ts`:
- English (default)
- Spanish, French, German, Portuguese
- Chinese (Mandarin), Japanese, Korean
- Arabic, Hindi
- And many more...

## Usage in Components

The translation system works automatically. Components using `useTranslations()` from `next-intl` will receive translated strings:

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('navbar');
  
  return <button>{t('login')}</button>; // Automatically translated
}
```

## Troubleshooting

### Translations not working
1. Check API status: `GET /api/translate`
2. Check browser console for errors
3. Verify Azure endpoint and key are correct
4. Check Cosmos DB connection

### Translations not caching
1. Verify Cosmos DB container `translations_cache` exists
2. Check container has partition key `/id`
3. Review API logs for cache errors

### Language not changing
1. Check localStorage for `pp:language` key
2. Verify language name matches mapping in `i18n/config.ts`
3. Check browser console for `pp:language:changed` event

## Manual Cache Management

### View cached translations
Query Cosmos DB container `translations_cache`:
```sql
SELECT * FROM c WHERE c.targetLang = 'es'
```

### Clear cache for a language
Delete items:
```sql
SELECT * FROM c WHERE c.targetLang = 'es'
```
Then delete the returned items.

### Warm up cache
Pre-translate all languages by selecting each language in the UI once.

## Monitoring

### Track translation usage
- Check Azure portal for Translator service usage
- Monitor Cosmos DB RU consumption
- Review API logs for translation requests

### Performance metrics
- First translation: ~500-1000ms (API call)
- Cached translation: ~50-100ms (Cosmos lookup)
- Batch efficiency: Linear with text count up to 100 texts
