const test = require('node:test');
const assert = require('node:assert/strict');
const { isClassApplicableForCategory } = require('../src/utils/ecaHelpers');

test('applies ECA categories to all classes when marked', () => {
  const category = {
    applyToAllClasses: true,
    applicableClasses: ['1', '2']
  };

  assert.equal(isClassApplicableForCategory(category, '10'), true);
  assert.equal(isClassApplicableForCategory(category, 'Class 2'), true);
});

test('matches individual class names case-insensitively', () => {
  const category = {
    applyToAllClasses: false,
    applicableClasses: ['Nursery', '6', '10']
  };

  assert.equal(isClassApplicableForCategory(category, 'nursery'), true);
  assert.equal(isClassApplicableForCategory(category, 'class 10'), true);
  assert.equal(isClassApplicableForCategory(category, '7'), false);
});
