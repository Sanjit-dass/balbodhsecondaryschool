import React from 'react';
import { useTranslate } from '../hooks/useTranslate';

/**
 * ✅ CORRECT EXAMPLE - Production Ready
 * This component WILL re-render when language changes
 * 
 * Key points:
 * 1. Import useTranslate hook
 * 2. Call it at the top of component
 * 3. Use t(key) in JSX
 * 4. Component automatically re-renders when language changes
 */
export default function ExampleTranslation() {
  const { t, language } = useTranslate();

  return (
    <div className="p-6 bg-white rounded-lg border border-slate-200">
      {/* ✅ This will update instantly when language changes */}
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        {t('staffTitle')}
      </h2>

      {/* ✅ Placeholder translates too */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('search')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* ✅ Button text translates */}
      <div className="flex gap-2 mb-6">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold">
          {t('all')}
        </button>
        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200">
          {t('departments')}
        </button>
      </div>

      {/* Debug info - shows current language */}
      <div className="text-sm text-slate-500">
        Current language: <span className="font-semibold text-slate-900">{language}</span>
      </div>
    </div>
  );
}
