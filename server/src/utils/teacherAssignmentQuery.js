function getAcademicYearCandidates(academicYear) {
  if (!academicYear) return [];

  const raw = String(academicYear).trim();
  if (!raw) return [];

  const variants = new Set([raw]);

  if (/^\d{4}$/.test(raw)) {
    const numericYear = Number(raw);
    variants.add(`${numericYear - 1}-${raw}`);
    variants.add(`${raw}-${numericYear + 1}`);
  } else if (/^\d{4}-\d{4}$/.test(raw)) {
    const [start, end] = raw.split('-');
    if (start && end) {
      variants.add(start);
      variants.add(end);
      variants.add(raw);
    }
  }

  return Array.from(variants).filter(Boolean);
}

function buildTeacherAssignmentQuery({ teacher, classId, subjectId, academicYear }) {
  if (!teacher) {
    return { status: 'active' };
  }

  const teacherCriteria = [];
  if (teacher.employeeId || teacher.teacherId || teacher.id || teacher._id) {
    teacherCriteria.push({ teacherId: teacher.employeeId || teacher.teacherId || teacher.id || teacher._id });
  }
  if (teacher._id) {
    teacherCriteria.push({ teacher: teacher._id });
  }

  const yearCandidates = getAcademicYearCandidates(academicYear);
  const teacherClauses = teacherCriteria.map(criteria => {
    const clause = { $and: [criteria] };
    if (subjectId) {
      clause.$and.push({ subjects: subjectId });
    }
    if (yearCandidates.length) {
      clause.$and.push({ academicYear: yearCandidates.length === 1 ? yearCandidates[0] : { $in: yearCandidates } });
    }
    return clause;
  });

  const query = {
    status: 'active',
    $or: teacherClauses
  };
  if (classId) {
    query.class = classId;
  }

  return query;
}

module.exports = {
  buildTeacherAssignmentQuery,
  getAcademicYearCandidates
};
