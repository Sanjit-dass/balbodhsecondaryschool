import React, { useState } from 'react';
import { useTranslate } from '../../hooks/useTranslate';
import TranslateText from '../../components/public/TranslateText';

/**
 * ✅ CORRECT PRODUCTION READY EXAMPLE
 * Staff Page with Full Bilingual Support
 * 
 * This component demonstrates:
 * 1. Using useTranslate hook correctly
 * 2. Language change causes instant UI re-render
 * 3. All text is translatable
 * 4. No page reload needed
 * 5. Works perfectly with React Router
 * 
 * When user changes language from Navbar:
 * ✓ useTranslate hook updates
 * ✓ Component re-renders
 * ✓ UI shows new language immediately
 */
export default function StaffPage() {
  const { t, language } = useTranslate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Sample staff data
  const staffData = [
    {
      id: 1,
      name: 'Mr. Sharma',
      position: 'Principal',
      department: 'Administration',
    },
    {
      id: 2,
      name: 'Ms. Paudel',
      position: 'Vice Principal',
      department: 'Administration',
    },
    {
      id: 3,
      name: 'Mr. Singh',
      position: 'Math Teacher',
      department: 'Academics',
    },
    {
      id: 4,
      name: 'Ms. Oli',
      position: 'English Teacher',
      department: 'Academics',
    },
  ];

  // Filter staff
  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch = staff.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      selectedDept === 'all' || staff.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const departments = ['all', ...new Set(staffData.map((s) => s.department))];

  return (
    <TranslateText>
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Translation - Updates when language changes */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('staffTitle')}
          </h1>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Meet our dedicated team of educators'
              : 'हाम्रो समर्पित शिक्षक टोली से परिचित हुनुहोस्'}
          </p>
        </div>

        {/* Search Section - Placeholder translates */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Tabs - Button text translates instantly */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedDept === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('all')}
            </button>
            {departments.slice(1).map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedDept === dept
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Department header translates */}
          <div className="text-sm font-semibold text-gray-600">
            {t('departments')}: {selectedDept}
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {staff.name}
              </h3>
              <p className="text-blue-600 font-semibold mb-1">
                {staff.position}
              </p>
              <p className="text-gray-600 text-sm">{staff.department}</p>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredStaff.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              {language === 'en'
                ? 'No staff members found'
                : 'कोई कर्मचारी नहीं मिला'}
            </p>
          </div>
        )}

        {/* Debug Info - Shows current language */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-900">
            <strong>Debug Info:</strong> Current Language: <span className="font-mono">{language}</span>
          </p>
          <p className="text-sm text-blue-900 mt-2">
            Try clicking EN/ने button in navbar - this page will update instantly!
          </p>
        </div>
      </div>
    </div>
    </TranslateText>
  );
}
