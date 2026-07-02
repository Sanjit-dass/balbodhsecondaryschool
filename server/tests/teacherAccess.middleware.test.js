const test = require('node:test');
const assert = require('node:assert/strict');

const teacherAccess = require('../src/middleware/teacherAccess');
const Teacher = require('../src/models/Teacher');
const User = require('../src/models/User');

test('returns 404 for a teacher with a non-objectid user id instead of crashing', async () => {
  const originalTeacherFindOne = Teacher.findOne;
  const originalUserFindById = User.findById;

  let userLookupCalled = false;

  Teacher.findOne = () => ({
    lean: async () => null
  });
  User.findById = async () => {
    userLookupCalled = true;
    return null;
  };

  const req = {
    user: {
      role: 'teacher',
      id: 'not-a-valid-object-id'
    }
  };

  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  try {
    await teacherAccess(req, res, next);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Teacher not found' });
    assert.equal(nextCalled, false);
    assert.equal(userLookupCalled, false);
  } finally {
    Teacher.findOne = originalTeacherFindOne;
    User.findById = originalUserFindById;
  }
});
