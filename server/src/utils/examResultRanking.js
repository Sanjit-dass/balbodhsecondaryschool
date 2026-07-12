function getResultRankKey(result) {
  return {
    passScore: result?.passStatus === 'Pass' ? 0 : 1,
    totalMarks: Number(result?.totalMarksObtained) || 0,
    totalPercentage: Number(result?.totalPercentage) || 0,
    studentKey: String(
      result?.student?._id || result?.student || result?.studentId || ''
    )
  };
}

function compareExamResultsForRanking(a, b) {
  const aKey = getResultRankKey(a);
  const bKey = getResultRankKey(b);

  if (aKey.passScore !== bKey.passScore) return aKey.passScore - bKey.passScore;
  if (aKey.totalMarks !== bKey.totalMarks) return bKey.totalMarks - aKey.totalMarks;
  if (aKey.totalPercentage !== bKey.totalPercentage) return bKey.totalPercentage - aKey.totalPercentage;

  return aKey.studentKey.localeCompare(bKey.studentKey);
}

function sortExamResultsForRanking(results) {
  return [...results].sort(compareExamResultsForRanking);
}

function attachClassPositions(results) {
  const rankedResults = sortExamResultsForRanking(results);
  return rankedResults.map((result, index) => ({
    ...result,
    classPosition: index + 1
  }));
}

module.exports = {
  compareExamResultsForRanking,
  sortExamResultsForRanking,
  attachClassPositions
};
