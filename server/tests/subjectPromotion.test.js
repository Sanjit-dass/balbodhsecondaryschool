const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSubjectClassValue, getSubjectPromotionPayload, buildSubjectPromotionPlan } = require('../src/utils/subjectPromotion');

test('normalizes class names for subject storage', () => {
  assert.equal(normalizeSubjectClassValue('Nursery'), 'Nursery');
  assert.equal(normalizeSubjectClassValue('Class 1'), '1');
  assert.equal(normalizeSubjectClassValue('class 10:2026'), '10');
});

test('builds a copied subject payload with the target class and academic year', () => {
  const source = {
    name: 'English',
    code: 'ENG',
    class: 'Nursery',
    marksDistribution: { theory: 80 },
    displayOrder: 1,
    subjectType: 'core'
  };

  const payload = getSubjectPromotionPayload(source, 'LKG', '2027');
  assert.equal(payload.name, 'English');
  assert.equal(payload.class, 'LKG');
  assert.equal(payload.academicYear, '2027');
  assert.deepEqual(payload.marksDistribution, { theory: 80 });
});

test('skips duplicate subject names while building a promotion plan', () => {
  const plan = buildSubjectPromotionPlan(
    [{ _id: 'subject-1', name: 'English' }, { _id: 'subject-2', name: 'Math' }],
    [{ name: 'English' }],
    'LKG',
    '2027'
  );

  assert.equal(plan.duplicateFound, true);
  assert.equal(plan.copiedCount, 1);
  assert.equal(plan.payloads[0].name, 'Math');
  assert.deepEqual(plan.sourceSubjectIdsToDelete, ['subject-1', 'subject-2']);
});
