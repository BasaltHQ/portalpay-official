"use client";

import React, { useEffect, useMemo, useState } from "react";
import { isLanguageSupported, getLanguageCode } from "@/lib/azure-translator";

interface Props {
  className?: string;
}

// Popular/common languages for a compact inline selector
const POPULAR_LANGUAGES = [
  "English (US)",
  "Spanish",
  "French",
  "German",
  "Portuguese (Brazil)",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Arabic (MSA)",
  "Hindi",
  "Turkish",
  "Italian",
  "Dutch",
];

export default function ShopLanguageSelectorInline({ className = "" }: Props) {
  const [currentLanguage, setCurrentLanguage] = useState("English (US)");
  const [failedLanguages, setFailedLanguages] = useState<Set<string>>(new Set());

  // Load initial language and failed languages
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pp:language");
      if (saved) setCurrentLanguage(saved);
      const failed = localStorage.getItem("pp:failed-languages");
      if (failed) setFailedLanguages(new Set(JSON.parse(failed)));
    } catch {}
  }, []);

  // React to translation failure events to revert to English
  useEffect(() => {
    const handleTranslationFailed = (event: Event) => {
      try {
        const detail = (event as CustomEvent).detail || {};
        const language = detail.language as string | undefined;
        if (!language) return;

        setFailedLanguages((prev) => {
          const next = new Set(prev);
          next.add(language);
          try {
            localStorage.setItem("pp:failed-languages", JSON.stringify(Array.from(next)));
          } catch {}
          return next;
        });

        // Revert to English on failure
        setCurrentLanguage("English (US)");
        try {
          localStorage.setItem("pp:language", "English (US)");
          localStorage.setItem("pp:locale", "en");
          window.dispatchEvent(
            new CustomEvent("pp:language:changed", { detail: { language: "English (US)", locale: "en" } })
          );
        } catch {}
      } catch {}
    };

    window.addEventListener("pp:translation:failed", handleTranslationFailed as EventListener);
    return () => {
      window.removeEventListener("pp:translation:failed", handleTranslationFailed as EventListener);
    };
  }, []);

  // Options limited to supported popular languages for a concise dropdown
  const languageOptions = useMemo(() => {
    const opts = POPULAR_LANGUAGES.filter((lang) => isLanguageSupported(lang));
    // Ensure the current language is present even if not in popular list
    if (currentLanguage && !opts.includes(currentLanguage) && isLanguageSupported(currentLanguage)) {
      opts.unshift(currentLanguage);
    }
    return opts;
  }, [currentLanguage]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    if (!language) return;
    if (failedLanguages.has(language)) return;

    const locale = getLanguageCode(language) || language;

    setCurrentLanguage(language);
    try {
      localStorage.setItem("pp:language", language);
      localStorage.setItem("pp:locale", locale);
      window.dispatchEvent(new CustomEvent("pp:language:changed", { detail: { language, locale } }));
    } catch {}
  };

  return (
    <select
      aria-label="Select language"
      value={currentLanguage}
      onChange={onChange}
      className={`h-8 px-2 rounded-md border bg-white text-black text-xs ${className}`}
    >
      {languageOptions.map((lang) => {
        const isFailed = failedLanguages.has(lang);
        return (
          <option key={lang} value={lang} disabled={isFailed}>
            {lang}
            {isFailed ? " (Coming soon)" : ""}
          </option>
        );
      })}
    </select>
  );
}
