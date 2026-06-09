# 🌍 Bilingual System - Production Ready Guide

Your React school website now has a complete, professional bilingual system (English + Nepali).

## ✅ What's Set Up

### 1. **LanguageContext** (`src/contexts/LanguageContext.jsx`)
- ✓ Global language state management
- ✓ Persists language choice to localStorage
- ✓ Supports: "en" (English) and "ne" (Nepali)
- ✓ Default language: English

```javascript
// What you get:
{
  language: "en" | "ne",
  changeLanguage: (lang) => void
}
```

### 2. **useTranslate Hook** (`src/hooks/useTranslate.js`)
- ✓ Simple, clean API
- ✓ Smart fallback: missing key → English → key itself
- ✓ No page reload needed

### 3. **Language Toggle in Navbar**
- ✓ EN / ने button switch
- ✓ Active state styling with Tailwind
- ✓ Smooth transitions

### 4. **App Wrapped with LanguageProvider**
- ✓ Context available throughout the app

---

## 📝 How to Use

### Basic Usage in Any Component

```javascript
import { useTranslate } from '../hooks/useTranslate';

export default function MyComponent() {
  const { t, language } = useTranslate();

  return (
    <div>
      <h1>{t('staffTitle')}</h1>
      <p>{t('search')}</p>
      <small>Language: {language}</small>
    </div>
  );
}
```

### No Import Needed for useLanguage
If you only need to change language:

```javascript
import { useLanguage } from '../contexts/LanguageContext';

const { changeLanguage } = useLanguage();

// Change to Nepali
changeLanguage('ne');
```

---

## 🔄 Adding Translations

### Step 1: Add to `src/constants/translations.js`

```javascript
export const translations = {
  en: {
    staffTitle: "Staff Directory",
    search: "Search by name or position",
    all: "All Staff",
    departments: "Departments",
    // Add your new keys here
    newKey: "English text",
    welcome: "Welcome to Bal Bodh School",
  },
  ne: {
    staffTitle: "कर्मचारी निर्देशिका",
    search: "नाम वा पद अनुसार खोज्नुहोस्",
    all: "सबै कर्मचारी",
    departments: "विभागहरू",
    // Add your new keys here
    newKey: "नेपाली पाठ",
    welcome: "बाल बोध स्कूलमा स्वागतम्",
  },
};
```

### Step 2: Use in Component

```javascript
const { t } = useTranslate();

// Use immediately
<h1>{t('welcome')}</h1>
```

---

## 🎯 Features

### ✨ Automatic Fallback
If a translation key is missing in Nepali, it automatically falls back to English:

```javascript
// Missing 'futureKey' in Nepali?
{
  t('futureKey')  // → Returns English version automatically
}
```

### 💾 Persistent Language Choice
User's language preference is saved to localStorage:

```javascript
// User selects Nepali
// Even after page reload → remains in Nepali
```

### 🔒 Type-Safe Validation
Only "en" and "ne" are accepted:

```javascript
changeLanguage('en');   // ✓ Works
changeLanguage('ne');   // ✓ Works
changeLanguage('fr');   // ✗ Ignored (not supported)
```

### ⚡ Zero Re-renders on Missing Keys
Component won't break if translation is missing - it gracefully returns the key name.

---

## 🚀 Best Practices

### ✅ DO
```javascript
// Import in component that needs translations
import { useTranslate } from '../hooks/useTranslate';

// Use in JSX
<h1>{t('staffTitle')}</h1>

// Use in attributes
<input placeholder={t('search')} />

// Use in template strings
const message = `${t('welcome')}, ${userName}`;
```

### ❌ DON'T
```javascript
// Don't use translations outside components
// (context won't be available)

// Don't forget to import the hook
// <h1>{t('title')}</h1>  // ReferenceError

// Don't hardcode English/Nepali text when a translation exists
// Instead of: <h1>Staff Directory</h1>
// Use: <h1>{t('staffTitle')}</h1>
```

---

## 🧪 Testing the System

### In Browser Console
```javascript
// Check localStorage
localStorage.getItem('appLanguage')  // "en" or "ne"

// See current translations
import { translations } from './constants/translations'
translations.en
translations.ne
```

---

## 📁 File Structure

```
src/
├── contexts/
│   └── LanguageContext.jsx      ← Language state + provider
├── hooks/
│   └── useTranslate.js          ← Translation hook
├── constants/
│   └── translations.js          ← All translations (add yours here!)
├── components/
│   ├── Navbar.jsx               ← Has EN/ने toggle
│   └── ExampleTranslation.jsx   ← Example usage
└── App.jsx                       ← Wrapped with LanguageProvider
```

---

## 🔗 Real-World Example: Staff Component

```javascript
import React, { useState } from 'react';
import { useTranslate } from '../hooks/useTranslate';

export default function Staff() {
  const { t } = useTranslate();
  const [searchTerm, setSearchTerm] = useState('');

  const staff = [
    { name: 'Mr. Sharma', position: 'Principal' },
    { name: 'Ms. Paudel', position: 'Vice Principal' },
  ];

  return (
    <div className="p-6">
      {/* Use translations */}
      <h1 className="text-2xl font-bold mb-4">{t('staffTitle')}</h1>

      {/* Search with translated placeholder */}
      <input
        type="text"
        placeholder={t('search')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded-lg mb-4"
      />

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          {t('all')}
        </button>
        <button className="px-4 py-2 bg-gray-200 rounded">
          {t('departments')}
        </button>
      </div>

      {/* Display staff */}
      {staff.map((person) => (
        <div key={person.name} className="p-4 border rounded-lg mb-2">
          <p className="font-semibold">{person.name}</p>
          <p className="text-gray-600">{person.position}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: "useLanguage must be used within LanguageProvider"
**Solution:** Make sure App.jsx wraps your routes with `<LanguageProvider>`

### Issue: Translation not showing, shows key name instead
**Solution:** Check if key exists in `translations.js` for your language

### Issue: Language doesn't persist after refresh
**Solution:** Check browser's localStorage is enabled (Settings → Privacy)

### Issue: Can't access language context in deeply nested component
**Solution:** The context is available everywhere inside the app (after LanguageProvider). Import the hook in your component.

---

## 📦 Production Checklist

- ✅ LanguageContext.jsx - Complete
- ✅ useTranslate.js - Complete  
- ✅ translations.js - Ready for expansion
- ✅ App.jsx - Wrapped with LanguageProvider
- ✅ Navbar.jsx - Language toggle added
- ✅ localStorage persists choice
- ✅ Fallback to English when key missing
- ✅ Error handling for invalid languages

---

## 🎉 You're Ready!

Your bilingual system is production-ready. Start adding translations to `translations.js` and use `useTranslate()` hook in your components!

**Pro Tip:** Add more language keys as you build more components. Keep translations.js organized and updated. 🚀
