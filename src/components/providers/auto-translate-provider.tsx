"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleFromLanguage, defaultLocale, type Locale } from '@/lib/i18n/config';
import { getLanguageCode } from '@/lib/azure-translator';

/**
 * AutoTranslateProvider
 * Automatically translates all text content in the DOM when language changes
 */
export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const originalTextsRef = useRef<Map<Node, string>>(new Map());
  const isTranslatingRef = useRef(false);
  const lastPathnameRef = useRef(pathname);
  const originalAttrsRef = useRef<Map<Element, Map<string, string>>>(new Map());
  const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label', 'alt'];

  useEffect(() => {
    // Load saved language/locale on mount
    try {
      const savedLocale = localStorage.getItem("pp:locale");
      const savedLanguage = localStorage.getItem("pp:language");
      const locale = savedLocale || (savedLanguage ? (getLanguageCode(savedLanguage) || getLocaleFromLanguage(savedLanguage)) : null);
      if (locale && locale !== defaultLocale) {
        setCurrentLocale(locale as Locale);
      }
    } catch {}

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent) => {
      const language = event.detail?.language as string | undefined;
      const localeFromEvent = event.detail?.locale as string | undefined;
      const locale = (localeFromEvent || (language ? (getLanguageCode(language) || getLocaleFromLanguage(language)) : defaultLocale)) as Locale;
      setCurrentLocale(locale);
      // Clear caches when language changes to avoid stale text/attrs on mobile
      try {
        originalTextsRef.current.clear();
        originalAttrsRef.current.clear();
      } catch {}
    };

    window.addEventListener('pp:language:changed', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('pp:language:changed', handleLanguageChange as EventListener);
    };
  }, []);

  // Translate when locale changes
  useEffect(() => {
    if (currentLocale === defaultLocale) {
      restoreOriginalTexts();
    } else {
      translatePageContent(currentLocale);
    }
  }, [currentLocale]);

  // Re-translate when navigating to new pages (Next.js route changes)
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      console.log('🔄 Route changed to:', pathname);
      
      if (currentLocale !== defaultLocale && !isTranslatingRef.current) {
        // Clear original texts/attrs cache for new page
        originalTextsRef.current.clear();
        try { originalAttrsRef.current.clear(); } catch {}
        
        // Translate new page content after a short delay to let DOM settle
        setTimeout(() => {
          if (!isTranslatingRef.current) {
            translatePageContent(currentLocale);
          }
        }, 500);
      }
    }
  }, [pathname, currentLocale]);

  // Observe DOM mutations and re-translate newly inserted content (modals, carts, etc.)
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;

    let debounceTimer: number | null = null;
    const schedule = () => {
      if (debounceTimer) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        if (currentLocale !== defaultLocale && !isTranslatingRef.current) {
          translatePageContent(currentLocale);
        }
      }, 300);
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          // New nodes added/removed (e.g., opening a modal or cart updates)
          schedule();
          break;
        }
        if (m.type === 'characterData' && m.target && (m.target as Node).nodeType === Node.TEXT_NODE) {
          // Text node content changed
          schedule();
          break;
        }
        if (m.type === 'attributes' && ATTRS_TO_TRANSLATE.includes(m.attributeName || '')) {
          // Watched attribute changed (placeholder/title/aria-label/alt)
          schedule();
          break;
        }
      }
    });

    try {
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS_TO_TRANSLATE
      });
    } catch {}

    return () => {
      try { observer.disconnect(); } catch {}
      if (debounceTimer) {
        try { clearTimeout(debounceTimer); } catch {}
        debounceTimer = null;
      }
    };
  }, [currentLocale]);

  function shouldSkipElement(element: Element): boolean {
    // Skip translation for certain elements
    const skipTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT'];
    if (skipTags.includes(element.tagName)) return true;

    // Skip elements with data-notranslate attribute
    if (element.hasAttribute('data-notranslate')) return true;

    // Skip elements with translate="no"
    if (element.getAttribute('translate') === 'no') return true;

    // Skip class="notranslate"
    if (element.classList.contains('notranslate')) return true;

    return false;
  }

  function collectTextNodes(root: Node, textNodes: Array<{ node: Node; text: string }> = []): Array<{ node: Node; text: string }> {
    // Walk the DOM tree and collect all text nodes
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (shouldSkipElement(element)) {
              return NodeFilter.FILTER_REJECT;
            }
          }
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim() || '';
            // Only include non-empty text nodes
            if (text.length > 0 && !/^[\s\n\r]*$/.test(text)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() || '';
        if (text) {
          textNodes.push({ node, text });
          // Store original text if not already stored
          if (!originalTextsRef.current.has(node)) {
            originalTextsRef.current.set(node, node.textContent || '');
          }
        }
      }
    }

    return textNodes;
  }

  // Collect translatable attribute texts from elements
  function collectAttributeTexts(root: Element): Array<{ element: Element; attr: string; text: string }> {
    const out: Array<{ element: Element; attr: string; text: string }> = [];
    try {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            const el = node as Element;
            if (shouldSkipElement(el)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          for (const attr of ATTRS_TO_TRANSLATE) {
            if (el.hasAttribute(attr)) {
              const val = (el.getAttribute(attr) || '').trim();
              if (val.length > 0 && !/^[\s\n\r]*$/.test(val)) {
                out.push({ element: el, attr, text: val });
                // Store original attr value once for restoration
                if (!originalAttrsRef.current.has(el)) {
                  originalAttrsRef.current.set(el, new Map<string, string>());
                }
                const m = originalAttrsRef.current.get(el)!;
                if (!m.has(attr)) {
                  m.set(attr, el.getAttribute(attr) || '');
                }
              }
            }
          }
        }
      }
    } catch {}
    return out;
  }

  async function translatePageContent(targetLocale: Locale) {
    if (isTranslatingRef.current) return;
    
    isTranslatingRef.current = true;
    console.log('🌍 Auto-translating page content to:', targetLocale);

    try {
      // Collect all text nodes from the body
      const textNodes = collectTextNodes(document.body);
      console.log(`Found ${textNodes.length} text nodes to translate`);

      if (textNodes.length === 0) {
        isTranslatingRef.current = false;
        return;
      }

      // Extract unique texts (avoid translating duplicates)
      const attrEntries = collectAttributeTexts(document.body);
      const uniqueTexts = Array.from(new Set([
        ...textNodes.map(tn => tn.text),
        ...attrEntries.map(ae => ae.text)
      ]));
      console.log(`Translating ${uniqueTexts.length} unique texts`);

      // Convert locale to language code for consistent caching
      const targetCode = getLanguageCode(targetLocale) || targetLocale;
      const sourceCode = getLanguageCode(defaultLocale) || defaultLocale;

      // Call translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          texts: uniqueTexts,
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
      const translations: Record<string, string> = data.translations;
      console.log(`Received ${Object.keys(translations).length} translations`);
      let updatedAttrs = 0;

      // Apply translations to text nodes
      let updatedCount = 0;
      let sameCount = 0;
      textNodes.forEach(({ node, text }) => {
        const translated = translations[text];
        if (translated) {
          if (translated !== text) {
            node.textContent = translated;
            updatedCount++;
          } else {
            sameCount++;
          }
        }
      });

      // Apply translations to watched attributes (placeholder, title, aria-label, alt)
      try {
        attrEntries.forEach(({ element, attr, text }) => {
          const translated = translations[text];
          if (translated && translated !== text) {
            element.setAttribute(attr, translated);
            updatedAttrs++;
          }
        });
      } catch {}

      console.log(`✅ Updated ${updatedCount} text nodes and ${updatedAttrs} attributes with translations`);
      console.log(`⚠️ ${sameCount} translations were identical to source (API not translating properly)`);
      if (sameCount > 0) {
        console.log('Sample identical:', Object.entries(translations).slice(0, 3));
      }
    } catch (error) {
      console.error('Auto-translation failed:', error);
    } finally {
      isTranslatingRef.current = false;
    }
  }

  function restoreOriginalTexts() {
    console.log('🔄 Restoring original English text and attributes');
    let restored = 0;
    originalTextsRef.current.forEach((originalText, node) => {
      if (node.textContent !== originalText) {
        node.textContent = originalText;
        restored++;
      }
    });
    let restoredAttrs = 0;
    originalAttrsRef.current.forEach((attrMap, el) => {
      attrMap.forEach((val, attr) => {
        if (el.getAttribute(attr) !== val) {
          el.setAttribute(attr, val);
          restoredAttrs++;
        }
      });
    });
    console.log(`✅ Restored ${restored} text nodes and ${restoredAttrs} attributes to English`);
  }

  // Ensure DOM auto-translation follows after i18n messages complete (navbar translated) on mobile
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      try {
        const locale = (e.detail?.locale || currentLocale) as Locale;
        if (locale !== defaultLocale && !isTranslatingRef.current) {
          translatePageContent(locale);
        }
      } catch {}
    };
    window.addEventListener('pp:messages:translated', handler as EventListener);
    return () => window.removeEventListener('pp:messages:translated', handler as EventListener);
  }, [currentLocale]);

  return <>{children}</>;
}
