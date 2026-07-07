import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ResponsiveSelect from '../components/ResponsiveSelect';

const EXAM_OPTIONS = [
  'First Terminal Exam',
  'Second Terminal Exam',
  'Third Terminal Exam',
  'Fourth Terminal Exam',
  'Final Exam'
];

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const getAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const titleCase = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatExamDisplayName = (examName) => {
  if (!examName) return 'N/A';
  return examName.replace(/Exam$/i, 'Examination');
};

const escapeHtml = (value) => {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getStudentRollNumber = (student) => {
  return student?.rollNumber || student?.admissionNumber || '';
};

const normalizeRoll = (value) => {
  if (value == null || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : String(value);
};

const formatClassLabel = (cls) => {
  if (cls === undefined || cls === null) return '';
  if (typeof cls === 'object') return cls.name || cls.className || '';
  return String(cls).replace(/^[cC]lass\s+/i, '').trim();
};

export default function AdminAdmitCardNew() {
  const [selectedExam, setSelectedExam] = useState('');
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPreparingBulkPrint, setIsPreparingBulkPrint] = useState(false);
  const [bulkPrintProgress, setBulkPrintProgress] = useState(0);
  const navigate = useNavigate();

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => {
      const aRoll = normalizeRoll(getStudentRollNumber(a));
      const bRoll = normalizeRoll(getStudentRollNumber(b));
      if (typeof aRoll === 'number' && typeof bRoll === 'number') return aRoll - bRoll;
      return String(aRoll).localeCompare(String(bRoll));
    }),
    [students]
  );

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setErrorMessage('');
      return;
    }

    const loadStudents = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await api.get(`/students?className=${encodeURIComponent(selectedClass)}`);
        const fetchedStudents = res.data.students || [];
        setStudents(fetchedStudents);
      } catch (err) {
        console.error('Failed to load students:', err);
        setErrorMessage('Unable to load students. Please try again.');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass]);

  const handleViewAdmitCard = (studentId) => {
    if (!selectedExam) {
      setErrorMessage('Please select an exam before viewing admit cards.');
      return;
    }
    navigate(`view/${studentId}?examName=${encodeURIComponent(selectedExam)}&className=${encodeURIComponent(selectedClass)}`, { relative: 'path' });
  };

  const handlePrintAllAdmitCards = async () => {
    if (!selectedExam || !selectedClass || !sortedStudents.length) {
      setErrorMessage('Please select an exam, choose a class, and ensure students are loaded before printing all admit cards.');
      return;
    }

    setErrorMessage('');
    setIsPreparingBulkPrint(true);
    setBulkPrintProgress(0);

    try {
      const cards = [];

      for (const [index, student] of sortedStudents.entries()) {
        const studentName = student?.fullName || student?.name || '';
        const studentClass = student?.className || student?.class?.name || student?.class || selectedClass || '';
        const rollNumber = getStudentRollNumber(student);
        const academicYear = getAcademicYear();
        const examTitle = formatExamDisplayName(selectedExam);

        cards.push(`
          <div class="admit-card">
            <div class="admit-card-header">
              <img src="/logo.png" alt="School Logo" class="admit-card-logo" />
              <h2 class="admit-card-school-name">BAL BODH SECONDARY SCHOOL</h2>
              <p class="admit-card-school-address">Kanchanrup Municipality-8, Kanchanpur</p>
              <p class="admit-card-school-meta">ESTD. 2055</p>
              <p class="admit-card-academic-year">Academic Year: ${escapeHtml(academicYear)}</p>
              <p class="admit-card-exam-title">${escapeHtml(examTitle)}</p>
              <p class="admit-card-exam-label">EXAMINATION ADMIT CARD</p>
            </div>

            <div class="admit-card-details">
              <div class="admit-card-detail-panel">
                <dl class="admit-card-detail-list">
                  <div class="admit-card-detail-row">
                    <dt>Name :</dt>
                    <dd>${escapeHtml(titleCase(studentName)) || 'N/A'}</dd>
                  </div>
                  <div class="admit-card-detail-row">
                    <dt>Class :</dt>
                    <dd>${escapeHtml(titleCase(studentClass)) || 'N/A'}</dd>
                  </div>
                  <div class="admit-card-detail-row">
                    <dt>Roll No :</dt>
                    <dd>${escapeHtml(rollNumber) || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div class="admit-card-signature-row">
              <div class="admit-card-signature-block">
                <div class="admit-card-signature-line"></div>
                <div class="admit-card-signature-label">Accountant Signature</div>
              </div>
              <div class="admit-card-signature-block admit-card-signature-block-end">
                <div class="admit-card-signature-line"></div>
                <div class="admit-card-signature-label">Founder Signature</div>
              </div>
            </div>
          </div>
        `);

        setBulkPrintProgress(Math.round(((index + 1) / sortedStudents.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      const pages = [];
      for (let pageIndex = 0; pageIndex < cards.length; pageIndex += 4) {
        const pageCards = cards.slice(pageIndex, pageIndex + 4);
        const pageNumber = Math.floor(pageIndex / 4) + 1;
        const startStudent = pageIndex + 1;
        const endStudent = Math.min(pageIndex + 4, cards.length);
        pages.push(`
          <section class="bulk-page">
            <div class="bulk-grid">${pageCards.join('')}</div>
            <div class="bulk-page-footer">Page ${pageNumber} • Students ${startStudent}-${endStudent}</div>
          </section>
        `);
      }

      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        throw new Error('Unable to open print preview. Please allow pop-ups.');
      }

      printWindow.document.write(`<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Bulk Admit Cards</title>
            <style>
              @page { size: A4 portrait; margin: 5mm; }
              html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
              body { background: #ffffff; padding: 0; }
              .bulk-toolbar { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
              .bulk-toolbar button { border: 1px solid #cbd5e1; background: #ffffff; color: #0f172a; border-radius: 999px; padding: 8px 12px; font-size: 12px; cursor: pointer; }
              .bulk-page { width: auto; min-height: auto; box-sizing: border-box; margin: 0 auto; page-break-after: always; padding: 0; }
              .bulk-grid { width: 100%; max-width: calc(210mm - 10mm); margin: 0 auto; display: grid; grid-template-columns: repeat(2, 88mm); gap: 3mm; justify-content: center; align-items: start; padding: 0 0 4mm; box-sizing: border-box; }
              .admit-card { width: 88mm; max-width: 88mm; border: 2px solid #B91C1C; border-radius: 8px; background: #ffffff; padding: 12px 12px 24px; box-sizing: border-box; display: flex; flex-direction: column; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.06); page-break-inside: avoid; break-inside: avoid; }
              .admit-card-header { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.1rem; }
              .admit-card-logo { width: 54px; height: 54px; object-fit: contain; }
              .admit-card-school-name { margin-top: 10px; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #B91C1C; line-height: 1.05; }
              .admit-card-school-address, .admit-card-school-meta { margin: 0; font-size: 11px; color: #2563EB; }
              .admit-card-school-meta { color: #64748B; }
              .admit-card-academic-year { margin-top: 10px; font-size: 13px; font-weight: 600; color: #15803D; }
              .admit-card-exam-title { margin-top: 6px; font-size: 13px; font-weight: 700; color: #EA580C; text-transform: uppercase; }
              .admit-card-exam-label { margin-top: 4px; font-size: 13px; font-weight: 700; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.05em; }
              .admit-card-details { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
              .admit-card-detail-panel { border-radius: 20px; background: #f8fafc; padding: 16px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
              .admit-card-detail-list { margin: 0; padding: 0; display: grid; gap: 10px; color: #0f172a; }
              .admit-card-detail-row { display: grid; grid-template-columns: auto 1fr; gap: 6px; align-items: center; font-size: 13px; color: #334155; }
              .admit-card-detail-row dt { margin: 0; font-weight: 600; color: #64748B; }
              .admit-card-detail-row dd { margin: 0; font-weight: 600; color: #0f172a; }
              .admit-card-signature-row { margin-top: 32px; display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; }
              .admit-card-signature-block { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; font-size: 13px; font-weight: 600; color: #0f172a; }
              .admit-card-signature-block-end { align-items: flex-end; }
              .admit-card-signature-line { width: 102px; height: 1px; background: #000000; }
              .bulk-page-footer { margin-top: 5mm; text-align: center; font-size: 8px; color: #475569; }
              @media print { .bulk-toolbar { display: none !important; } body { background: #ffffff; padding: 0; } .bulk-page { margin: 0; } .bulk-grid { gap: 8mm; padding: 0; } }
            </style>
          </head>
          <body>
            <div class="bulk-toolbar no-print">
              <button type="button" onclick="window.print()">Print</button>
              <button type="button" onclick="window.close()">Close</button>
            </div>
            ${pages.join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    } catch (err) {
      console.error('Bulk admit card print failed:', err);
      setErrorMessage(err?.message || 'Unable to prepare bulk admit card preview.');
    } finally {
      setIsPreparingBulkPrint(false);
      setBulkPrintProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Examination Admit Card</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Select a class to view students and generate their admit cards.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-3xl bg-rose-50 border border-rose-200 px-6 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Exam</h2>
              <p className="mt-1 text-sm text-slate-600">Choose the exam before generating admit cards.</p>
            </div>
            <div className="w-full sm:min-w-[250px]">
                <ResponsiveSelect
                  value={selectedExam}
                  onChange={(v) => { setSelectedExam(v); setErrorMessage(''); }}
                  options={EXAM_OPTIONS.map(o => ({ value: o, label: o }))}
                  placeholder="Select Exam"
                  className="w-full"
                  maxHeight={500}
                />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Class</h2>
              <p className="mt-1 text-sm text-slate-600">Choose a class to load students for the selected exam.</p>
            </div>
            <div className="w-full sm:min-w-[250px]">
              <ResponsiveSelect
                value={selectedClass}
                onChange={(v) => setSelectedClass(v)}
                options={[{ value: '', label: 'Select Class' }, ...CLASS_OPTIONS.map(c => ({ value: c, label: c }))]}
                placeholder="Select Class"
                maxHeight={600}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Students</h2>
              <p className="mt-1 text-sm text-slate-600">Click "View Admit Card" to open the admit card in a new page.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrintAllAdmitCards}
                disabled={isPreparingBulkPrint || !selectedExam || !selectedClass || sortedStudents.length === 0}
                className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                {isPreparingBulkPrint ? 'Preparing...' : '🖨 Print All Admit Cards'}
              </button>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {students.length} {students.length === 1 ? 'student' : 'students'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Roll No</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Student Name</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Class</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Loading students...</td>
                  </tr>
                ) : !selectedExam ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Select an exam to load students.</td>
                  </tr>
                ) : !selectedClass ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Select a class to view students.</td>
                  </tr>
                ) : sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No students found in this class.</td>
                  </tr>
                ) : (
                  sortedStudents.map((student) => (
                    <tr key={student._id} className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                      <td className="px-4 py-4 text-slate-900 font-medium">{getStudentRollNumber(student) || 'N/A'}</td>
                      <td className="px-4 py-4 text-slate-900">{student.fullName || student.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-slate-600">{formatClassLabel(student.class?.name || student.className || student.classId?.name) || selectedClass || 'N/A'}</td>
                      <td className="px-4 py-4">
                          <button
                          type="button"
                          onClick={() => handleViewAdmitCard(student._id)}
                          disabled={!selectedExam}
                          className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${selectedExam ? 'bg-slate-900 text-white hover:bg-slate-700 active:bg-slate-800' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                        >
                          View Admit Card
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isPreparingBulkPrint && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              <div>
                <h3 className="text-base font-semibold text-slate-900">Preparing admit cards...</h3>
                <p className="text-sm text-slate-600">Generating a print-ready layout for all selected students.</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${bulkPrintProgress}%` }} />
            </div>
            <div className="mt-2 text-sm font-medium text-slate-600">{bulkPrintProgress}% complete</div>
          </div>
        </div>
      )}
    </div>
  );
}