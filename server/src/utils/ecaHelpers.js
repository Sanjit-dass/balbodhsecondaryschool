function normalizeClassLabel(value) {
  if (!value && value !== 0) return '';
  return String(value).trim().toLowerCase().replace(/^class\s+/i, '').replace(/\s+/g, '');
}

function isClassApplicableForCategory(category, classValue) {
  if (!category) return false;
  if (category.applyToAllClasses) return true;

  const normalizedTarget = normalizeClassLabel(classValue);
  if (!normalizedTarget) return false;

  const applicableClasses = Array.isArray(category.applicableClasses)
    ? category.applicableClasses.map((entry) => normalizeClassLabel(entry))
    : [];

  return applicableClasses.includes(normalizedTarget);
}

module.exports = {
  normalizeClassLabel,
  isClassApplicableForCategory
};
