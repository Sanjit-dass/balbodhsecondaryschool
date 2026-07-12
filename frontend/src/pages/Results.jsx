import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { calculateGrade, getGradeColor, calculateStatus } from '../utils/gradingSystem';
import html2pdf from 'html2pdf.js';
import Marksheet from '../components/Marksheet';

export default function Results() {
  const { user } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noticeStatus, setNoticeStatus] = useState('');
  const [noticeError, setNoticeError] = useState('');
  const [search, setSearch] = useState('');

  const downloadCSV = () => {
    if (!selectedExam || !results.length) return;
    const headers = ['Roll No', 'Student Name', 'Total Marks', 'Grade', 'GPA', 'Status', 'Position'];
    const rows = results.map((result, index) => {
      const percentage = result.totalMaxMarks > 0 ? (result.totalMarksObtained / result.totalMaxMarks) * 100 : 0;
      const gradeInfo = calculateGrade(percentage);
      const statusInfo = calculateStatus(percentage, result.passStatus);
      return [
        result.student?.rollNumber || result.student?.admissionNumber || '',
        result.student?.user?.name || result.student?.fullName || '',
        result.totalMarksObtained || 0,
        gradeInfo.grade,
        gradeInfo.gpa.toFixed(1),
        statusInfo.text,
        index + 1
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `${exam?.type || 'exam'}-${exam?.class?.name || 'class'}-${exam?.academicYear || ''}.csv`.replace(/\s+/g, '_');
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadFullClassResultPDF = async () => {
    if (!selectedExam || !results.length) return;

    const examTitle = exam?.type || exam?.title || 'Exam Result';
    const className = exam?.class?.name || 'Class';
    const academicYear = exam?.academicYear || '';
    const logoSrc = '/logo.png';

    const rowsHtml = results
      .slice()
      .sort((a, b) => {
        const passA = a.passStatus === 'Pass' ? 0 : 1;
        const passB = b.passStatus === 'Pass' ? 0 : 1;
        if (passA !== passB) return passA - passB;

        const marksA = Number(a.totalMarksObtained) || 0;
        const marksB = Number(b.totalMarksObtained) || 0;
        if (marksA !== marksB) return marksB - marksA;

        const percentageA = Number(a.totalPercentage) || 0;
        const percentageB = Number(b.totalPercentage) || 0;
        if (percentageA !== percentageB) return percentageB - percentageA;

        return (a.student?.user?.name || a.student?.fullName || '').localeCompare(b.student?.user?.name || b.student?.fullName || '');
      })
      .map((result, index) => {
        const totalMax = result.totalMaxMarks || 0;
        const obtained = result.totalMarksObtained || 0;
        const percentage = totalMax > 0 ? (obtained / totalMax) * 100 : 0;
        const gradeInfo = calculateGrade(percentage);
        const statusInfo = calculateStatus(percentage, result.passStatus);
        const statusColor = statusInfo.color;
        return `
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; white-space: nowrap;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 10px; white-space: normal; word-break: break-word;">${result.student?.user?.name || result.student?.fullName || 'N/A'}</td>
            <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; white-space: nowrap;">${obtained}/${totalMax}</td>
            <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; white-space: nowrap;">${gradeInfo.grade}</td>
            <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; white-space: nowrap;">${gradeInfo.gpa.toFixed(1)}</td>
            <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; white-space: nowrap; font-weight: bold; color: ${statusColor};">${statusInfo.display}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; width: 100%; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoSrc}" alt="School Logo" style="display: inline-block; height: 72px; margin-bottom: 10px;" />
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; color: red;">BAL BODH SECONDARY SCHOOL</h1>
            <p style="margin:6px 0 0; font-size:14px; color:#2563EB; font-weight:600;">Kanchanrup Municipality-08, Kanchanpur</p>
            <p style="margin:0; font-size:13px; color:#64748B; font-weight:600;">ESTD. 2055</p>
        </div>
        <div style="margin-bottom: 16px; width: 100%; display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; font-size: 14px;">
          <div style="min-width: 180px; max-width: 280px; text-align: center; line-height: 1.6;">
            <div><strong>Exam Name:</strong> ${examTitle}</div>
            <div><strong>Class:</strong> ${className}</div>
          </div>
          <div style="min-width: 180px; max-width: 280px; text-align: center; line-height: 1.6;">
            <div><strong>Academic Year:</strong> ${academicYear}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div style="width: 100%; border-top: 2px solid #222; margin-bottom: 16px;"></div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; text-align: center;">
              <th style="border: 1px solid #d1d5db; padding: 10px; min-width: 50px;">Position</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; min-width: 160px;">Student Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; min-width: 110px;">Total Marks</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; min-width: 90px;">Grade</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; min-width: 70px;">GPA</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; min-width: 100px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    const container = document.createElement('div');
    container.style.maxWidth = '210mm';
    container.style.width = '100%';
    container.style.padding = '16px';
    container.style.background = '#fff';
    container.style.boxSizing = 'border-box';
    container.innerHTML = html;
    document.body.appendChild(container);

    const filename = `${examTitle} - ${className} - ${academicYear} - Full Class Result.pdf`.replace(/\s+/g, '_');

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();
    } catch (error) {
      console.error('Full class result PDF download failed:', error);
      alert('Failed to download the full class result PDF. Please try again.');
    } finally {
      document.body.removeChild(container);
    }
  };

  const publishResultNotice = async () => {
    if (!exam || !results.length) return;
    setNoticeError('');
    setNoticeStatus('Publishing notice...');

    const title = `${exam.type} - ${exam.class?.name || 'Class'} (${exam.academicYear || ''})`;
    const topPerformers = results.slice(0, 5).map((result, index) => {
      const percentage = result.totalMaxMarks > 0 ? (result.totalMarksObtained / result.totalMaxMarks) * 100 : 0;
      const gradeInfo = calculateGrade(percentage);
      return `${index + 1}. ${result.student?.user?.name || result.student?.fullName || 'N/A'} — ${result.totalMarksObtained || 0}/${result.totalMaxMarks || 0}, Grade: ${gradeInfo.grade}, GPA: ${gradeInfo.gpa.toFixed(1)}`;
    }).join('\n');
    
    const body = `Results for ${exam.type} (${exam.class?.name || 'Class'}) are now available.\n\nTop performers:\n${topPerformers}\n\nDownload the detailed result from the admin portal or view the notice board for full details.`;

    try {
      await api.post('/notices', {
        title,
        body,
        audience: 'all',
        category: 'Exam',
        priority: 'Medium',
        status: 'published',
        targetClassId: exam.class?._id || null
      });
      setNoticeStatus('Result notice published successfully.');
    } catch (err) {
      console.error(err);
      setNoticeError(err.response?.data?.message || 'Failed to publish result notice.');
      setNoticeStatus('');
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadResults(selectedExam);
    }
  }, [selectedExam]);

  const loadExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
    }
  };

  const sortResults = (results) => {
    return [...results].sort((a, b) => {
      const passA = a.passStatus === 'Pass' ? 0 : 1;
      const passB = b.passStatus === 'Pass' ? 0 : 1;
      if (passA !== passB) return passA - passB;

      const marksA = Number(a.totalMarksObtained) || 0;
      const marksB = Number(b.totalMarksObtained) || 0;
      if (marksA !== marksB) return marksB - marksA;

      const percentageA = Number(a.totalPercentage) || 0;
      const percentageB = Number(b.totalPercentage) || 0;
      if (percentageA !== percentageB) return percentageB - percentageA;

      const positionA = Number.isFinite(a.classPosition) ? a.classPosition : Number.MAX_SAFE_INTEGER;
      const positionB = Number.isFinite(b.classPosition) ? b.classPosition : Number.MAX_SAFE_INTEGER;
      if (positionA !== positionB) return positionA - positionB;
      return (a.student?.user?.name || a.student?.fullName || '').localeCompare(b.student?.user?.name || b.student?.fullName || '');
    });
  };

  const loadResults = async (examId) => {
    try {
      setLoading(true);
      const res = await api.get(`/exams/${examId}/results`);
      setResults(sortResults(res.data.results || []));
      setSelectedResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exam = exams.find(e => e._id === selectedExam);
  const filteredResults = results.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.student?.user?.name || r.student?.fullName || '').toLowerCase().includes(q) || String(r.student?.rollNumber || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Results / Marksheet</h1>
      </div>

      {!selectedResult ? (
        <>
          <div className="bg-white p-6 shadow rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Exam</label>
            {/* Desktop/tablet: native select. Mobile: use a fixed, narrow picker panel for better responsiveness */}
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="hidden sm:block w-full px-3 py-2 border border-slate-300 rounded-lg mb-4"
            >
              <option value="">Select an Exam</option>
              {exams.map(e => {
                const fullLabel = `${e.type} - ${e.class?.name || 'N/A'} (${e.academicYear})`;
                const truncated = fullLabel.length > 50 ? fullLabel.slice(0, 47) + '…' : fullLabel;
                return <option key={e._id} value={e._id} title={fullLabel}>{truncated}</option>;
              })}
            </select>

            {/* Mobile picker button */}
              <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setShowExamPicker(true)}
                className="w-full text-left px-3 py-2 border border-slate-300 rounded-lg mb-4 bg-white text-slate-900 picker-trigger"
              >
                {selectedExam ? (
                  (() => {
                    const e = exams.find(x => x._id === selectedExam);
                    const fullLabel = e ? `${e.type} - ${e.class?.name || 'N/A'} (${e.academicYear})` : 'Select an Exam';
                    const truncated = fullLabel.length > 40 ? fullLabel.slice(0, 37) + '…' : fullLabel;
                    return truncated;
                  })()
                ) : 'Select an Exam'}
              </button>

              {showExamPicker && (
                <div className="fixed left-3 right-3 z-50 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                  <div className="w-full px-4 mx-auto">
                    <div className="px-4 py-4 border-b border-slate-200 bg-blue-600 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Select Exam</p>
                        <p className="text-xs text-blue-100">Tap an exam to choose</p>
                      </div>
                      <button onClick={() => setShowExamPicker(false)} className="text-sm text-white">Close</button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {exams.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">No exams available.</div>
                      ) : (
                        exams.map(e => {
                          const fullLabel = `${e.type} - ${e.class?.name || 'N/A'} (${e.academicYear})`;
                          return (
                            <button
                              key={e._id}
                              type="button"
                              onClick={() => { setSelectedExam(e._id); setShowExamPicker(false); }}
                              className="w-full text-left px-4 py-3 border-b border-slate-100 bg-white hover:bg-slate-50"
                            >
                              <div className="text-sm font-medium text-slate-900">{fullLabel}</div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedExam && (
              <>
                <div className="mb-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by student name or roll number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={downloadCSV}
                        disabled={loading || !results.length}
                        className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        Download CSV
                      </button>
                        <button
                        type="button"
                        onClick={publishResultNotice}
                        disabled={loading || !results.length}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        Publish Result Notice
                      </button>
                    </div>
                  </div>
                  {noticeStatus && (
                    <div className="text-sm text-green-700">{noticeStatus}</div>
                  )}
                  {noticeError && (
                    <div className="text-sm text-rose-700">{noticeError}</div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center text-slate-500">Loading results...</div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center text-slate-500">No results found</div>
                ) : (
                  <>
                  <div className="space-y-3">
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead className="bg-slate-100 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Roll No.</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Student Name</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">Total Marks</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">Grade</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">GPA</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">Status</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">Position</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.map((result, idx) => {
                            const percentage = result.totalMaxMarks > 0 ? (result.totalMarksObtained / result.totalMaxMarks) * 100 : 0;
                            const gradeInfo = calculateGrade(percentage);
                            const statusInfo = calculateStatus(percentage, result.passStatus);
                            return (
                              <tr key={idx} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-2 text-sm">{result.student?.rollNumber || result.student?.admissionNumber || '-'}</td>
                                <td className="px-4 py-2 text-sm">{result.student?.user?.name || result.student?.fullName || 'N/A'}</td>
                                <td className="px-4 py-2 text-center text-sm">{result.totalMarksObtained || 0}</td>
                                <td className={`px-4 py-2 text-center text-sm font-semibold ${getGradeColor(gradeInfo.grade)}`}>{gradeInfo.grade}</td>
                                <td className="px-4 py-2 text-center text-sm font-semibold">{gradeInfo.gpa.toFixed(1)}</td>
                                <td className={`px-4 py-2 text-center text-sm font-bold ${statusInfo.className}`}>{statusInfo.display}</td>
                                <td className="px-4 py-2 text-center text-sm">{idx + 1}</td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => setSelectedResult(result)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3 md:hidden">
                      {filteredResults.map((result, idx) => {
                        const percentage = result.totalMaxMarks > 0 ? (result.totalMarksObtained / result.totalMaxMarks) * 100 : 0;
                        const gradeInfo = calculateGrade(percentage);
                        const statusInfo = calculateStatus(percentage, result.passStatus);
                        return (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">#{idx + 1}</div>
                                <div className="text-sm font-semibold text-slate-900">{result.student?.user?.name || result.student?.fullName || 'N/A'}</div>
                                <div className="text-xs text-slate-500">Roll No. {result.student?.rollNumber || result.student?.admissionNumber || '-'}</div>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.className}`}>{statusInfo.display}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="rounded-lg bg-slate-50 p-2">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Marks</div>
                                <div className="font-semibold text-slate-900">{result.totalMarksObtained || 0}</div>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Grade</div>
                                <div className={`font-semibold ${getGradeColor(gradeInfo.grade)}`}>{gradeInfo.grade}</div>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">GPA</div>
                                <div className="font-semibold text-slate-900">{gradeInfo.gpa.toFixed(1)}</div>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Position</div>
                                <div className="font-semibold text-slate-900">{idx + 1}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              View details
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedExam && results.length > 0 && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={downloadFullClassResultPDF}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        📄 Download Full Class Result
                      </button>
                    </div>
                  )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={() => setSelectedResult(null)}
          className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
        >
          Back to Results List
        </button>

      </div>
      <Marksheet result={selectedResult} exam={exam} />
        </div>
      )}
    </div>
  );
}
