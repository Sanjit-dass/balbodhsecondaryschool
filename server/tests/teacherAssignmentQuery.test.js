const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTeacherAssignmentQuery } = require('../src/utils/teacherAssignmentQuery');

test('builds an assignment query for teacherId and teacher reference', () => {
  const query = buildTeacherAssignmentQuery({
    teacher: { _id: 'teacher-object-id', employeeId: 'BBS01' },
    classId: 'class-object-id'
  });

  assert.deepEqual(query, {
    status: 'active',
    class: 'class-object-id',
    $or: [
      { $and: [{ teacherId: 'BBS01' }] },
      { $and: [{ teacher: 'teacher-object-id' }] }
    ]
  });
});

test('includes subject filtering when provided', () => {
  const query = buildTeacherAssignmentQuery({
    teacher: { _id: 'teacher-object-id', employeeId: 'BBS01' },
    classId: 'class-object-id',
    subjectId: 'subject-object-id'
  });

  assert.equal(query.subjects, undefined);
  assert.equal(query.$or[0].$and[1].subjects, 'subject-object-id');
  assert.equal(query.$or[1].$and[1].subjects, 'subject-object-id');
});

test('supports academic year range variants', () => {
  const query = buildTeacherAssignmentQuery({
    teacher: { _id: 'teacher-object-id', employeeId: 'BBS01' },
    classId: 'class-object-id',
    academicYear: '2025-2026'
  });

  assert.deepEqual(query.$or[0].$and[1].academicYear, { $in: ['2025-2026', '2025', '2026'] });
  assert.deepEqual(query.$or[1].$and[1].academicYear, { $in: ['2025-2026', '2025', '2026'] });
});
