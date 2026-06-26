import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const LanguageContext = createContext();

/**
 * LanguageProvider - Manages app language state globally
 * Persists user language preference to localStorage
 * 
 * ⚠️ IMPORTANT: Must wrap entire app to make context available everywhere
 */
export const LanguageProvider = ({ children }) => {
  // Detect mobile devices (basic heuristic: viewport width or userAgent)
  const isBrowser = typeof window !== 'undefined';
  const initialIsMobile = isBrowser && (window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|Phone/i.test(navigator.userAgent));

  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [language, setLanguage] = useState(() => {
    // On initial load, prefer saved setting
    if (!isBrowser) return 'en';
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'ne' || saved === 'en') ? saved : 'en';
  });

  // Keep isMobile updated on resize / orientation change
  useEffect(() => {
    if (!isBrowser) return;
    const onResize = () => {
      const mobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|Phone/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change language and persist to localStorage
  const changeLanguage = (lang) => {
    if (!['en', 'ne'].includes(lang)) return;
    setLanguage(lang);
    try { localStorage.setItem('appLanguage', lang); } catch (e) {}
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