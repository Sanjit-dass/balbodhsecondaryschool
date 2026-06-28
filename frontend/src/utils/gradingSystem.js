/**
 * New Grading System
 * Calculates grade and GPA based on percentage
 */

export const calculateGrade = (percentage) => {
  const percent = parseFloat(percentage);
  
  if (percent >= 90) return { grade: 'A+', gpa: 4.0, description: 'Outstanding' };
  if (percent >= 80) return { grade: 'A', gpa: 3.6, description: 'Excellent' };
  if (percent >= 70) return { grade: 'B+', gpa: 3.2, description: 'Very Good' };
  if (percent >= 60) return { grade: 'B', gpa: 2.8, description: 'Good' };
  if (percent >= 50) return { grade: 'C+', gpa: 2.4, description: 'Satisfactory' };
  if (percent >= 40) return { grade: 'C', gpa: 2.0, description: 'Acceptable' };
  if (percent >= 35) return { grade: 'D', gpa: 1.6, description: 'Basic' };
  return { grade: 'NG', gpa: 0.0, description: 'Not Graded' };
};

export const getGradeColor = (grade) => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-700';
    case 'B+':
    case 'B':
      return 'text-blue-700';
    case 'C+':
    case 'C':
      return 'text-orange-700';
    case 'D':
      return 'text-amber-700';
    case 'NG':
      return 'text-red-700';
    default:
      return 'text-slate-700';
  }
};

export const calculateStatus = (percentage, passStatus = null) => {
  // Use the backend passStatus if available, otherwise default to Pass
  // The backend calculates pass/fail based on subject-wise pass marks
  const passed = passStatus === 'Pass' || passStatus === null;
  return {
    passed,
    text: passed ? 'PASS' : 'FAIL',
    display: passed ? 'PASS' : 'FAIL',
    color: passed ? '#16A34A' : '#DC2626',
    className: passed ? 'text-green-600' : 'text-red-600'
  };
};
