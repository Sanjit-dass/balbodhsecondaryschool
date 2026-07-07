function normalizeClassName(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  return raw
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^class\s*/i, '')
    .replace(/(?:st|nd|rd|th)$/i, '')
    .trim();
}

function isSameClass(currentClass, targetClass) {
  return normalizeClassName(currentClass) === normalizeClassName(targetClass);
}

module.exports = {
  normalizeClassName,
  isSameClass,
};
