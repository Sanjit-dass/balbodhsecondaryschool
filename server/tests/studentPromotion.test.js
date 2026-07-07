const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeClassName, isSameClass } = require('../src/utils/studentPromotion');

test('normalizes class names consistently', () => {
  assert.equal(normalizeClassName('Nursery'), 'nursery');
  assert.equal(normalizeClassName('Class 1'), '1');
  assert.equal(normalizeClassName('class 10:2026'), '10');
});

test('detects when source and target class are the same', () => {
  assert.equal(isSameClass('Nursery', 'nursery'), true);
  assert.equal(isSameClass('Class 1', '1'), true);
  assert.equal(isSameClass('LKG', 'UKG'), false);
});
