/**
 * CLASS SORTING UTILITIES
 * Properly orders classes: Nursery, LKG, UKG, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
 */

const CLASS_ORDER = {
  'Nursery': 0,
  'nursery': 0,
  'LKG': 1,
  'lkg': 1,
  'UKG': 2,
  'ukg': 2,
  '1': 3,
  '2': 4,
  '3': 5,
  '4': 6,
  '5': 7,
  '6': 8,
  '7': 9,
  '8': 10,
  '9': 11,
  '10': 12,
};

/**
 * Get numeric value for class name
 * Handles: "Nursery", "Class 1", "1", "LKG", "1A", etc.
 * Returns the position in the class order sequence
 */
function getClassOrder(className) {
  if (!className) return 999;
  
  const name = String(className).trim();
  
  // Remove "Class " prefix if present (case-insensitive)
  let cleanName = name.replace(/^class\s+/i, '').trim();
  
  // Check exact match first
  if (CLASS_ORDER.hasOwnProperty(cleanName)) {
    return CLASS_ORDER[cleanName];
  }
  
  // Check case-insensitive
  const lowerName = cleanName.toLowerCase();
  if (CLASS_ORDER.hasOwnProperty(lowerName)) {
    return CLASS_ORDER[lowerName];
  }
  
  // Try to extract numeric value
  const numMatch = cleanName.match(/^(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num >= 1 && num <= 10) {
      return num + 2; // 1 maps to 3, 2 maps to 4, etc.
    }
  }
  
  // Check if it's one of the special names (case-insensitive)
  const lower = cleanName.toLowerCase();
  if (lower.startsWith('nursery')) return 0;
  if (lower.startsWith('lkg')) return 1;
  if (lower.startsWith('ukg')) return 2;
  
  // Default sorting order (put unknowns at end)
  return 999;
}

/**
 * Sort classes in proper order
 * @param {Array} classes - Array of class objects with 'name' property
 * @returns {Array} - Sorted array
 */
function sortClasses(classes) {
  if (!Array.isArray(classes)) return [];
  
  return [...classes].sort((a, b) => {
    // Handle both object with .name property and plain strings
    const nameA = (typeof a === 'string') ? a : (a.name || a);
    const nameB = (typeof b === 'string') ? b : (b.name || b);
    
    const orderA = getClassOrder(nameA);
    const orderB = getClassOrder(nameB);
    
    return orderA - orderB;
  });
}

/**
 * Get class display name with proper formatting
 * Handles: "Nursery", "Class 1", "1", "LKG", "1A", etc.
 */
function formatClassName(name) {
  if (!name) return '';
  const str = String(name).trim();
  
  // Remove "Class " prefix if present
  const cleanName = str.replace(/^class\s+/i, '').trim();
  
  // Nursery
  if (/^nursery$/i.test(cleanName)) return 'Nursery';
  
  // LKG
  if (/^lkg$/i.test(cleanName)) return 'LKG';
  
  // UKG
  if (/^ukg$/i.test(cleanName)) return 'UKG';
  
  // Numbers - extract and return just the number
  const numMatch = cleanName.match(/^(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num >= 1 && num <= 10) {
      return String(num);
    }
  }
  
  return cleanName;
}

/**
 * Get all expected class names in order
 */
function getAllClassNames() {
  return [
    'Nursery',
    'LKG',
    'UKG',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10'
  ];
}

module.exports = {
  getClassOrder,
  sortClasses,
  formatClassName,
  getAllClassNames,
  CLASS_ORDER,
};
