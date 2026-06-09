import React from 'react';
import { useTranslate } from '../../hooks/useTranslate';
import TranslateText from '../../components/public/TranslateText';

/**
 * ✅ DEMO - Language Toggle Testing
 * 
 * Navigate to: http://localhost:5173/staff
 * Click ने button in navbar - the page will now update to Nepali!
 * 
 * This shows:
 * - "Staff Directory" → "कर्मचारी निर्देशिका"
 * - "Search..." → "नाम वा पद अनुसार खोज्नुहोस्"
 * - "All Staff" → "सबै"
 * - Stats labels translate too
 */
export default function LanguageToggleTest() {
  const { t, language } = useTranslate();

  return (
    <TranslateText>
      <div className="p-8 bg-green-50 border-2 border-green-500 rounded-lg max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-green-900 mb-4">✅ Bilingual System Working!</h2>
      
      <div className="bg-white p-4 rounded-lg mb-4">
        <p className="text-lg font-semibold text-gray-900 mb-2">
          Current Language: <span className="font-mono text-blue-600">{language}</span>
        </p>
        <p className="text-gray-700 mb-4">
          Click the <strong>EN / ने</strong> button in the navbar to see all content change instantly.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-bold text-blue-900 mb-2">📍 Pages with Translation:</h3>
        <ul className="text-blue-900 space-y-1">
          <li>✓ <strong>/staff</strong> - Staff Directory (fully translated)</li>
          <li>✓ <strong>Navbar</strong> - Language toggle buttons</li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-bold text-amber-900 mb-2">🔄 How to Add Translations to More Pages:</h3>
        <ol className="text-amber-900 space-y-2 ml-4 list-decimal">
          <li>Add translation keys to <code className="bg-white px-2 py-1 rounded">src/constants/translations.js</code></li>
          <li>Import hook: <code className="bg-white px-2 py-1 rounded text-xs">import {'{t}'} from '../hooks/useTranslate'</code></li>
          <li>Use in JSX: <code className="bg-white px-2 py-1 rounded text-xs">{'{t("key")}'}</code></li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
        <p><strong>Debug Info:</strong></p>
        <p>Language State: <span className="font-mono">{language}</span></p>
        <p>localStorage: <code className="bg-white px-2 py-1 rounded">appLanguage = {language}</code></p>
      </div>
    </div>
    </TranslateText>
  );
}
