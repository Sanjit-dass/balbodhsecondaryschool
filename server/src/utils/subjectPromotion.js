function normalizeSubjectClassValue(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  const compact = raw
    .replace(/:\d+$/, '')
    .replace(/^class\s*/i, '')
    .replace(/(?:st|nd|rd|th)$/i, '')
    .trim();

  if (!compact) return raw;
  return compact;
}

function getSubjectPromotionPayload(sourceSubject, targetClass, academicYear) {
  const payload = {
    ...sourceSubject,
    class: normalizeSubjectClassValue(targetClass),
    academicYear: String(academicYear).trim(),
  };

  delete payload._id;
  delete payload.__v;
  delete payload.createdAt;
  delete payload.updatedAt;

  return payload;
}

function buildSubjectPromotionPlan(sourceSubjects, existingDestinationSubjects, targetClass, academicYear) {
  const existingNames = new Set(existingDestinationSubjects.map((subject) => String(subject.name).trim().toLowerCase()));
  const payloads = sourceSubjects
    .filter((subject) => !existingNames.has(String(subject.name).trim().toLowerCase()))
    .map((subject) => getSubjectPromotionPayload(subject, targetClass, academicYear));

  return {
    payloads,
    duplicateFound: existingDestinationSubjects.length > 0,
    copiedCount: payloads.length,
    sourceSubjectIdsToDelete: sourceSubjects.map((subject) => subject._id).filter(Boolean),
  };
}

module.exports = {
  normalizeSubjectClassValue,
  getSubjectPromotionPayload,
  buildSubjectPromotionPlan,
};
