import { useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../constants/translations";

/**
 * Custom hook for translations
 * Returns t(key) function and current language
 * 
 * Features:
 * - Reactive to language changes (re-renders when language changes)
 * - Smart fallback: current language → English → key itself
 * - Memoized for performance
 * 
 * Usage:
 * const { t, language } = useTranslate();
 * <h1>{t('staffTitle')}</h1>
 */
export const useTranslate = () => {
  const { language } = useLanguage();

  const buildEnglishLookup = () => {
    const map = new Map();
    if (translations.en) {
      Object.entries(translations.en).forEach(([key, value]) => {
        if (typeof value === "string") {
          const normalized = value.trim();
          if (!map.has(normalized)) {
            map.set(normalized, key);
          }
        }
      });
    }
    return map;
  };

  const englishLookup = useMemo(() => buildEnglishLookup(), []);

  const t = useMemo(
    () => (input) => {
      if (typeof input !== "string") {
        return input;
      }

      const keyword = input.trim();
      const currentTranslations = translations[language] || {};
      const englishTranslations = translations.en || {};

      if (currentTranslations[keyword]) {
        return currentTranslations[keyword];
      }

      if (englishTranslations[keyword]) {
        return englishTranslations[keyword];
      }

      const reverseKey = englishLookup.get(keyword);
      if (reverseKey) {
        return currentTranslations[reverseKey] || englishTranslations[reverseKey];
      }

      console.warn(`Translation missing for key/text: "${input}" in language: "${language}"`);
      return input;
    },
    [language, englishLookup]
  );

  return { t, language };
};