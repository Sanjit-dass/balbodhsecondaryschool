import React, { useRef } from 'react';
import { calculateGrade, getGradeColor } from '../utils/gradingSystem';
import html2pdf from 'html2pdf.js';

export default function Marksheet({ result, exam, school = {} }) {
  const marksheetRef = useRef();

  const schoolName = school.name || 'BAL BODH SECONDARY SCHOOL';
  const schoolLocation = school.location || 'Kanchanrup Municipality-08, Kanchanpur';
  const schoolLogo = school.logo || '/logo.png';

  const handleDownloadPDF = async () => {
    try {
      const element = marksheetRef.current;
      if (!element) return;

      const studentName = result.student?.user?.name || result.student?.fullName || 'Marksheet';
      const fileName = `${studentName}-Marksheet.pdf`;

      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true);
      
      html2pdf().set(opt).from(clonedElement).save();
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (!result) {
    return <div className="text-center text-slate-500 p-6">No result found</div>;
  }

  const totalMaxMarks = result.totalMaxMarks || 0;
  const totalObtained = result.totalMarksObtained || 0;
  const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100) : 0;
  const passMarks = exam?.passMarks || 40;
  const studentFailedAnySubject = result.subjectMarks?.some(
    (subject) => Number(subject?.marksObtained) < passMarks
  );
  const passStatus = result.passStatus || (studentFailedAnySubject ? 'Fail' : 'Pass');
  const gradeInfo = calculateGrade(percentage);
  const grade = gradeInfo.grade;
  const gpa = gradeInfo.gpa;
  const position = result.classPosition || 'N/A';

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4 no-print print:hidden">
        <button 
          onClick={handleDownloadPDF} 
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          📄 Download PDF
        </button>
      </div>

      <div ref={marksheetRef} className="marksheet-container bg-white p-8 shadow-lg rounded-lg" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-slate-300 pb-4 mb-4">
          {schoolLogo && (
            <img src={schoolLogo} alt="School Logo" className="h-16 mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold text-[#DC2626]">{schoolName}</h1>
          <p className="mt-1 text-sm font-semibold text-[#2563EB]">{school.address || 'Kanchanrup Municipality-08, Kanchanpur'}</p>
          <p className="text-sm font-semibold text-[#64748B]">ESTD. {school.established || 2055}</p>
        </div>

        {/* Exam Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{exam?.type || 'EXAMINATION RESULT'}</h2>
          <p className="text-sm text-slate-600">Academic Year: {exam?.academicYear}</p>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="font-semibold">Student Name:</span>
            <p className="border-b border-slate-300 mt-1">
              {result.student?.user?.name || result.student?.fullName || result.student?.name || '___________________'}
            </p>
          </div>
          <div>
            <span className="font-semibold">Roll Number:</span>
            <p className="border-b border-slate-300 mt-1">{result.student?.rollNumber || result.student?.admissionNumber || '____________________'}</p>
          </div>
          <div>
            <span className="font-semibold">Class:</span>
            <p className="border-b border-slate-300 mt-1">{result.class?.name || '___________________'}</p>
          </div>
          <div>
            <span className="font-semibold">Academic Year:</span>
            <p className="border-b border-slate-300 mt-1">{exam?.academicYear || '_________________'}</p>
          </div>
        </div>

        {/* Marks Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border border-slate-300">
                <th className="border border-slate-300 px-2 py-2 text-left">S.N</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Subject Name</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Max Theory</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Obtained Theory</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Max Practical</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Obtained Practical</th>
                <th className="border border-slate-300 px-2 py-2 text-center">GPA</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Grade</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.subjectMarks && result.subjectMarks.map((sm, idx) => {
                const theoryMarks = sm.theoryMarks != null ? sm.theoryMarks : (sm.marksObtained != null ? Math.round(sm.marksObtained / 2) : 0);
                const practicalMarks = sm.practicalMarks != null ? sm.practicalMarks : (sm.marksObtained != null ? Math.round(sm.marksObtained / 2) : 0);
                const maxTheory = sm.maxTheoryMarks != null ? sm.maxTheoryMarks : 50;
                const maxPractical = sm.maxPracticalMarks != null ? sm.maxPracticalMarks : 50;
                const totalMarks = (theoryMarks || 0) + (practicalMarks || 0);
                const maxTotal = maxTheory + maxPractical;
                const subjectPercentage = maxTotal > 0 ? (totalMarks / maxTotal) * 100 : 0;
                const theoryPassMark = Math.min(20, maxTheory);
                const practicalPassMark = Math.min(20, maxPractical);
                const subjectPassed = theoryMarks > theoryPassMark && practicalMarks > practicalPassMark;
                const subjectStatusText = subjectPassed ? 'PASS' : (theoryMarks <= theoryPassMark && practicalMarks <= practicalPassMark ? 'FAIL (Theory & Practical)' : (theoryMarks <= theoryPassMark ? 'FAIL (Theory)' : 'FAIL (Practical)'));
                const subjectGradeInfo = calculateGrade(subjectPercentage);
                return (
                  <tr key={idx} className="border border-slate-300">
                    <td className="border border-slate-300 px-2 py-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 px-2 py-2">{sm.subject?.name || 'N/A'}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{maxTheory}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{theoryMarks}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{maxPractical}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{practicalMarks}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-semibold">{subjectGradeInfo.gpa.toFixed(1)}</td>
                    <td className={`border border-slate-300 px-2 py-2 text-center font-semibold ${getGradeColor(subjectGradeInfo.grade)}`}>{subjectGradeInfo.grade}</td>
                    <td className={`border border-slate-300 px-2 py-2 text-center font-semibold ${subjectPassed ? 'text-green-600' : 'text-red-600'}`}>{subjectStatusText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border border-slate-300 p-3">
            <span className="font-semibold">Result Status:</span>
            <p className={`text-lg font-bold ${passStatus === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
              {passStatus}
            </p>
          </div>
          <div className="border border-slate-300 p-3">
            <span className="font-semibold">Grade:</span>
            <p className={`text-lg font-bold ${getGradeColor(grade)}`}>{grade}</p>
          </div>
          <div className="border border-slate-300 p-3">
            <span className="font-semibold">GPA:</span>
            <p className="text-lg font-bold">{gpa.toFixed(1)}</p>
          </div>
          <div className="border border-slate-300 p-3">
            <span className="font-semibold">Position in Class:</span>
            <p className="text-lg font-bold">{position}</p>
          </div>
        </div>

        <div className="flex justify-center mt-4 no-print print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            📄 Download PDF
          </button>
        </div>

      </div>
    </div>
  );
}
