import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const LanguageContext = createContext();

/**
 * LanguageProvider - Manages app language state globally
 * Persists user language preference to localStorage
 * 
 * ⚠️ IMPORTANT: Must wrap entire app to make context available everywhere
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("appLanguage");
    if (savedLang && ["en", "ne"].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  // Change language and persist to localStorage
  const changeLanguage = (lang) => {
    if (["en", "ne"].includes(lang)) {
      setLanguage(lang);
      localStorage.setItem("appLanguage", lang);
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  // This ensures only components consuming the context re-render when language changes
  const contextValue = useMemo(
    () => ({ language, changeLanguage }),
    [language]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to access language context
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};