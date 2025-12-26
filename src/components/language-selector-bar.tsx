"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Globe, Search } from "lucide-react";
import Link from "next/link";
import { GROUPS, LANGS_BY_REGION_OR_GROUP } from "@/lib/master-langs";
import { useTheme } from "@/contexts/ThemeContext";
import { isLanguageSupported, getLanguageCode } from "@/lib/azure-translator";
import { useTranslations } from "next-intl";
import { getAllIndustries } from "@/lib/landing-pages/industries";
import { getAllComparisons } from "@/lib/landing-pages/comparisons";
import { getAllLocations } from "@/lib/landing-pages/locations";

type PageCategory = 'industries' | 'comparisons' | 'locations';

interface LanguageSelectorBarProps {
  className?: string;
}

// Most popular languages worldwide (in order of global usage)
const POPULAR_LANGUAGES = [
  "English (US)",
  "Chinese (Mandarin)",
  "Spanish",
  "Hindi",
  "Arabic (MSA)",
  "French",
  "Bengali",
  "Portuguese (Brazil)",
  "Russian",
  "Urdu",
  "Indonesian",
  "German",
  "Japanese",
  "Swahili",
  "Marathi",
  "Telugu",
  "Turkish",
  "Tamil",
  "Vietnamese",
  "Korean",
];

export function LanguageSelectorBar({ className = "" }: LanguageSelectorBarProps) {
  const { theme } = useTheme();
  const tLanguageBar = useTranslations("languageBar");
  const [currentLanguage, setCurrentLanguage] = useState("English (US)");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedLanguages, setFailedLanguages] = useState<Set<string>>(new Set());
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [unsupportedLanguageName, setUnsupportedLanguageName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // SEO page visibility state
  const [categoryVisibility, setCategoryVisibility] = useState<Record<PageCategory, boolean>>({
    industries: true,
    comparisons: true,
    locations: true,
  });

  // Load saved language preference and failed languages on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pp:language");
      if (saved) {
        setCurrentLanguage(saved);
      }

      const failed = localStorage.getItem("pp:failed-languages");
      if (failed) {
        setFailedLanguages(new Set(JSON.parse(failed)));
      }
    } catch { }

    // Load SEO page settings to determine category visibility
    async function loadSeoPageSettings() {
      try {
        const res = await fetch('/api/admin/seo-pages', {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!data.ok || !data.settings?.pageStatuses) return;

        const pageStatuses = data.settings.pageStatuses;

        // Get all page IDs for each category
        const industryIds = getAllIndustries().map(i => `industry-${i.slug}`);
        const comparisonIds = getAllComparisons().map(c => `comparison-${c.slug}`);
        const locationIds = getAllLocations().map(l => `location-${l.slug}`);

        // Check if ALL pages in a category are disabled
        const isAllDisabled = (ids: string[]) => {
          if (ids.length === 0) return false;
          return ids.every(id => pageStatuses[id]?.enabled === false);
        };

        setCategoryVisibility({
          industries: !isAllDisabled(industryIds),
          comparisons: !isAllDisabled(comparisonIds),
          locations: !isAllDisabled(locationIds),
        });
      } catch (err) {
        console.error('[LanguageSelectorBar] Failed to load SEO page settings:', err);
      }
    }

    loadSeoPageSettings();

    // Listen for translation failures
    const handleTranslationFailed = (event: CustomEvent) => {
      const language = event.detail?.language;
      if (language) {
        setFailedLanguages(prev => {
          const newSet = new Set(prev);
          newSet.add(language);
          try {
            localStorage.setItem("pp:failed-languages", JSON.stringify(Array.from(newSet)));
          } catch { }
          return newSet;
        });
        setUnsupportedLanguageName(language);
        setShowUnsupportedModal(true);

        // Revert to English
        setCurrentLanguage("English (US)");
        try {
          localStorage.setItem("pp:language", "English (US)");
          localStorage.setItem("pp:locale", "en");
          window.dispatchEvent(new CustomEvent("pp:language:changed", { detail: { language: "English (US)", locale: "en" } }));
        } catch { }
      }
    };

    window.addEventListener('pp:translation:failed', handleTranslationFailed as EventListener);
    return () => {
      window.removeEventListener('pp:translation:failed', handleTranslationFailed as EventListener);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery(""); // Clear search when closing
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Get all supported languages across all groups
  const allSupportedLanguages = useMemo(() => {
    const langs: string[] = [];
    GROUPS.forEach((group) => {
      const allLanguages = LANGS_BY_REGION_OR_GROUP[group] || [];
      allLanguages.forEach(lang => {
        if (isLanguageSupported(lang) && !langs.includes(lang)) {
          langs.push(lang);
        }
      });
    });
    return langs;
  }, []);

  // Filter popular languages that are supported
  const supportedPopularLanguages = useMemo(() => {
    return POPULAR_LANGUAGES.filter(lang =>
      isLanguageSupported(lang) && allSupportedLanguages.includes(lang)
    );
  }, [allSupportedLanguages]);

  // Filter languages based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return null;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, string[]> = {};

    GROUPS.forEach((group) => {
      const allLanguages = LANGS_BY_REGION_OR_GROUP[group] || [];
      const matchedLanguages = allLanguages.filter(lang =>
        isLanguageSupported(lang) && lang.toLowerCase().includes(query)
      );
      if (matchedLanguages.length > 0) {
        filtered[group] = matchedLanguages;
      }
    });

    return filtered;
  }, [searchQuery]);

  const handleLanguageChange = (language: string) => {
    // Don't allow selecting failed languages
    if (failedLanguages.has(language)) {
      return;
    }

    // Resolve ISO locale code from display name
    const locale = getLanguageCode(language) || language;

    setCurrentLanguage(language);
    setIsOpen(false);
    setSearchQuery(""); // Clear search

    // Save to localStorage and dispatch both language and locale
    try {
      localStorage.setItem("pp:language", language);
      localStorage.setItem("pp:locale", locale);
      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent("pp:language:changed", { detail: { language, locale } }));
    } catch { }
  };

  const isLanguageFailed = (lang: string) => failedLanguages.has(lang);

  return (
    <>
      {/* Unsupported Language Modal */}
      {showUnsupportedModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Language Not Yet Supported</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {unsupportedLanguageName} translation is coming soon! We're working on adding support for more languages.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              This language will be marked as "Coming Soon" in the language selector.
            </p>
            <button
              onClick={() => setShowUnsupportedModal(false)}
              className="w-full px-4 py-2 bg-foreground text-background rounded hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div
        className={`w-full border-b backdrop-blur-md relative z-40 ${className}`}
        style={{ backgroundColor: `${theme.primaryColor}1a` }} // 1a is ~10% opacity in hex
      >
        <div className="max-w-5xl mx-auto px-4 h-7 flex items-center justify-between">
          <nav className="flex items-center gap-1">
            {categoryVisibility.industries && (
              <Link href="/crypto-payments" className="microtext text-foreground/80 px-2 py-0.5 rounded hover:bg-foreground/5 transition-colors">
                Industries
              </Link>
            )}
            {categoryVisibility.comparisons && (
              <Link href="/vs" className="microtext text-foreground/80 px-2 py-0.5 rounded hover:bg-foreground/5 transition-colors">
                Comparisons
              </Link>
            )}
            {categoryVisibility.locations && (
              <Link href="/locations" className="microtext text-foreground/80 px-2 py-0.5 rounded hover:bg-foreground/5 transition-colors">
                Locations
              </Link>
            )}
            <Link href="/developers" className="microtext text-foreground/80 px-2 py-0.5 rounded hover:bg-foreground/5 transition-colors">
              Developers
            </Link>
          </nav>
          <div className="relative z-50" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-foreground/5 transition-colors"
              aria-label={tLanguageBar("selectLanguage")}
            >
              <Globe className="h-3 w-3 opacity-60" />
              <span className="microtext text-[9px] opacity-80">{currentLanguage}</span>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 max-h-[400px] glass-float rounded-md border shadow-xl z-50 flex flex-col">
                {/* Search field */}
                <div className="p-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search languages..."
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                      className="w-full pl-7 pr-2 py-1 text-xs rounded border bg-background/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </div>
                </div>

                {/* Language list */}
                <div className="overflow-y-auto flex-1 p-1">
                  {!searchQuery && supportedPopularLanguages.length > 0 && (
                    <div className="mb-2">
                      <div className="px-1.5 py-0.5 microtext text-[8px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                        POPULAR LANGUAGES
                      </div>
                      <div className="space-y-0">
                        {supportedPopularLanguages.map((lang) => {
                          const isFailed = isLanguageFailed(lang);
                          return (
                            <button
                              key={lang}
                              onClick={() => handleLanguageChange(lang)}
                              disabled={isFailed}
                              className={`w-full text-left px-1.5 py-0.5 rounded microtext text-[9px] transition-colors flex items-center justify-between ${isFailed
                                ? "opacity-50 cursor-not-allowed"
                                : currentLanguage === lang
                                  ? "bg-foreground/5 font-medium text-foreground"
                                  : "text-foreground/80 hover:bg-foreground/10"
                                }`}
                            >
                              <span>{lang}</span>
                              {isFailed && (
                                <span className="text-[7px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                  Coming Soon
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t my-2" />
                    </div>
                  )}

                  {searchQuery && filteredGroups ? (
                    Object.entries(filteredGroups).length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        No languages found matching "{searchQuery}"
                      </div>
                    ) : (
                      Object.entries(filteredGroups).map(([group, languages]) => (
                        <div key={group} className="mb-1 last:mb-0">
                          <div className="px-1.5 py-0.5 microtext text-[8px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                            {group}
                          </div>
                          <div className="space-y-0">
                            {languages.map((lang) => {
                              const isFailed = isLanguageFailed(lang);
                              return (
                                <button
                                  key={lang}
                                  onClick={() => handleLanguageChange(lang)}
                                  disabled={isFailed}
                                  className={`w-full text-left px-1.5 py-0.5 rounded microtext text-[9px] transition-colors flex items-center justify-between ${isFailed
                                    ? "opacity-50 cursor-not-allowed"
                                    : currentLanguage === lang
                                      ? "bg-foreground/5 font-medium text-foreground"
                                      : "text-foreground/80 hover:bg-foreground/10"
                                    }`}
                                >
                                  <span>{lang}</span>
                                  {isFailed && (
                                    <span className="text-[7px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                      Coming Soon
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )
                  ) : !searchQuery ? (
                    GROUPS.map((group) => {
                      const allLanguages = LANGS_BY_REGION_OR_GROUP[group] || [];
                      const languages = allLanguages.filter(lang => isLanguageSupported(lang));
                      if (languages.length === 0) return null;

                      return (
                        <div key={group} className="mb-1 last:mb-0">
                          <div className="px-1.5 py-0.5 microtext text-[8px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                            {group}
                          </div>
                          <div className="space-y-0">
                            {languages.map((lang) => {
                              const isFailed = isLanguageFailed(lang);
                              return (
                                <button
                                  key={lang}
                                  onClick={() => handleLanguageChange(lang)}
                                  disabled={isFailed}
                                  className={`w-full text-left px-1.5 py-0.5 rounded microtext text-[9px] transition-colors flex items-center justify-between ${isFailed
                                    ? "opacity-50 cursor-not-allowed"
                                    : currentLanguage === lang
                                      ? "bg-foreground/5 font-medium text-foreground"
                                      : "text-foreground/80 hover:bg-foreground/10"
                                    }`}
                                >
                                  <span>{lang}</span>
                                  {isFailed && (
                                    <span className="text-[7px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                      Coming Soon
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
