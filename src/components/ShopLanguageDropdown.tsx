"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Globe, Search } from "lucide-react";
import { GROUPS, LANGS_BY_REGION_OR_GROUP } from "@/lib/master-langs";
import { isLanguageSupported, getLanguageCode } from "@/lib/azure-translator";
import { useTranslations } from "next-intl";

/**
 * ShopLanguageDropdown
 * - Reuses the original dropdown styling and extensive language list from LanguageSelectorBar
 * - Excludes the top-site nav, presenting only the language button + dropdown
 * - Fully wired to pp:language and pp:locale with pp:language:changed events
 */
export default function ShopLanguageDropdown({ className = "" }: { className?: string }) {
  const tLanguageBar = useTranslations("languageBar");
  const [currentLanguage, setCurrentLanguage] = useState("English (US)");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedLanguages, setFailedLanguages] = useState<Set<string>>(new Set());
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [unsupportedLanguageName, setUnsupportedLanguageName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 288 }); // default width ~ w-72

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
    } catch {}

    // Listen for translation failures
    const handleTranslationFailed = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const language = detail?.language as string | undefined;
      if (language) {
        setFailedLanguages(prev => {
          const newSet = new Set(prev);
          newSet.add(language);
          try {
            localStorage.setItem("pp:failed-languages", JSON.stringify(Array.from(newSet)));
          } catch {}
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
        } catch {}
      }
    };

    window.addEventListener("pp:translation:failed", handleTranslationFailed as EventListener);
    return () => {
      window.removeEventListener("pp:translation:failed", handleTranslationFailed as EventListener);
    };
  }, []);

  // Close dropdown when clicking outside (ignore clicks inside portal menu)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element | null;
      const clickedMenu = !!target && !!(target.closest && target.closest('[data-shop-lang-menu="true"]'));
      if (clickedMenu) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
        setIsOpen(false);
        setSearchQuery(""); // Clear search when closing
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute anchored menu position and focus search input when dropdown opens; update on scroll/resize
  useEffect(() => {
    function updateMenu() {
      const el = dropdownRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = 288; // matches w-72
      const top = Math.round(rect.bottom + 4); // small gap below trigger
      const left = Math.round(rect.right - width); // right-align
      setMenuPos({ top, left, width });
    }
    if (isOpen) {
      updateMenu();
      setTimeout(() => {
        updateMenu();
        searchInputRef.current?.focus();
      }, 50);
      window.addEventListener("scroll", updateMenu, true);
      window.addEventListener("resize", updateMenu, true);
      return () => {
        window.removeEventListener("scroll", updateMenu, true);
        window.removeEventListener("resize", updateMenu, true);
      };
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
    } catch {}
  };

  const isLanguageFailed = (lang: string) => failedLanguages.has(lang);

  return (
    <div className={`relative z-50 ${className}`} ref={dropdownRef}>
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

      {/* Trigger button (retains original microtext aesthetic) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-foreground/5 transition-colors"
        aria-label={tLanguageBar("selectLanguage")}
        title={tLanguageBar("selectLanguage")}
      >
        <Globe className="h-3 w-3 opacity-60" />
        <span className="microtext text-[9px] opacity-80">{currentLanguage}</span>
      </button>

      {/* Dropdown (rendered to portal with fixed positioning to avoid clipping) */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-shop-lang-menu="true"
            className="max-h-[400px] glass-float rounded-md border shadow-xl z-[2000] flex flex-col"
            style={{
              position: "fixed",
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: `${menuPos.width}px`,
            }}
          >
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
                              className={`w-full text-left px-1.5 py-0.5 rounded microtext text-[9px] transition-colors flex items-center justify-between ${
                                isFailed
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
              ) : (
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
                              className={`w-full text-left px-1.5 py-0.5 rounded microtext text-[9px] transition-colors flex items-center justify-between ${
                                isFailed
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
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
