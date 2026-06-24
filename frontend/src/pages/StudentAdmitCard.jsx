import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ResponsiveSelect from '../components/ResponsiveSelect';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

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
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
};

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const isMongoObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value.trim());

const normalizeClassLabel = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    return normalizeClassLabel(value.name ?? value.className ?? value.class ?? '');
  }
  const raw = String(value).trim();
  if (!raw || isMongoObjectId(raw)) return '';
  return raw.replace(/^[cC]lass\s+/i, '').trim();
};

const formatClassLabel = (value) => {
  const normalized = normalizeClassLabel(value);
  if (!normalized) return '';
  const upperValue = normalized.toUpperCase();
  const knownAcronyms = new Set(['LKG', 'UKG', 'KG']);
  if (knownAcronyms.has(upperValue)) return upperValue;
  if (/^[A-Z0-9\s\/\-]+$/.test(normalized)) return normalized;
  return normalized
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatExamDisplayName = (examName) => {
  if (!examName) return 'Examination';
  return examName.replace(/Exam$/i, 'Examination');
};

export default function StudentAdmitCard() {
  const [formData, setFormData] = useState({
    fullName: '',
    class: '',
    rollNumber: ''
  });
  const [student, setStudent] = useState(null);
  const [exam, setExam] = useState(null);
  const [examName, setExamName] = useState('First Terminal Exam');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const EXAM_OPTIONS = [
    'First Terminal Exam',
    'Second Terminal Exam',
    'Third Terminal Exam',
    'Fourth Terminal Exam',
    'Final Exam'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handleGenerateAdmitCard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.fullName.trim() || !formData.class || !formData.rollNumber.trim()) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Search for matching student in database
      const searchRes = await api.get(
        `/students?q=${encodeURIComponent(formData.fullName)}&className=${encodeURIComponent(formData.class)}`
      );
      const students = searchRes.data.students || [];

      // Find exact match by roll number
      const matchedStudent = students.find(
        s => (s.rollNumber || s.admissionNumber) === formData.rollNumber.trim()
      );

      if (!matchedStudent) {
        setError('Student not found. Please verify your details and try again.');
        setLoading(false);
        return;
      }

      setStudent(matchedStudent);
      setSuccessMessage('Admit card generated successfully!');
    } catch (err) {
      console.error('Failed to generate admit card:', err);
      setError('Unable to generate admit card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      if (!student) return;
      const element = document.getElementById('admit-card-display');
      if (!element) return;
      const origPaddingBottom = element.style.paddingBottom;
      const origOverflow = element.style.overflow;
      const origWidth = element.style.width;
      const origHeight = element.style.height;

      try {
        // Add modest extra bottom padding so signatures/footer aren't clipped in the PDF
        element.style.paddingBottom = '60px';
        element.style.overflow = 'visible';
        element.scrollIntoView({ behavior: 'auto', block: 'center' });

        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        const imgWidth = pageWidth - margin * 2;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        const usableHeight = pageHeight - margin * 2;
        if (imgHeight > usableHeight) {
          const scale = usableHeight / imgHeight;
          imgHeight = imgHeight * scale;
        }

        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        pdf.save(`admit-card-${student.rollNumber || student.admissionNumber || 'student'}.pdf`);
      } finally {
        element.style.paddingBottom = origPaddingBottom;
        element.style.overflow = origOverflow;
        element.style.width = origWidth;
        element.style.height = origHeight;
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('PDF generation failed.');
    }
  };

  const studentClass = student ? formatClassLabel(student.class?.name || student.className) : '';
  const studentName = student ? (student.fullName || student.name || '') : '';
  const rollNumber = student ? (student.rollNumber || student.admissionNumber || '') : '';
  const academicYear = getAcademicYear();
  const examTitle = formatExamDisplayName(examName);
  const studentPhoto = student?.profilePhoto || student?.profilePhotoUrl || student?.photoUrl || student?.photo || student?.image || student?.profilePhotoObj?.fileUrl || '';
  const hasPhoto = Boolean(studentPhoto);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Generate Admit Card</h1>
          <p className="mt-2 text-slate-600">Enter your details to generate your admission certificate for the exam.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl bg-rose-50 border border-rose-200 px-6 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-3xl bg-emerald-50 border border-emerald-200 px-6 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {!student ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleGenerateAdmitCard} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Class</label>
                <ResponsiveSelect
                  value={formData.class}
                  onChange={(v) => setFormData(prev => ({ ...prev, class: v }))}
                  options={CLASS_OPTIONS.map(c => ({ value: c, label: c }))}
                  placeholder="Select Class"
                  className="w-full"
                  maxHeight={500}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Roll No / Admission No</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your roll number"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Exam</label>
                <select
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                >
                  {EXAM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate Admit Card'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPDF}
                className="no-print rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Download PDF
              </button>
              <button
                onClick={() => {
                  setStudent(null);
                  setFormData({ fullName: '', class: '', rollNumber: '' });
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Generate Another
              </button>
            </div>

            <div
              id="admit-card-display"
              className="admit-card mx-auto w-full max-w-[420px] -mt-4 rounded-[8px] border-2 border-[#B91C1C] bg-white p-[10px] pb-[28px] shadow-[0_6px_12px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col items-center text-center">
                <img src="/logo.png" alt="School Logo" className="mx-auto h-[80px] w-[80px] object-contain" />
                <h2 className="mt-3 text-[18px] font-bold uppercase tracking-[0.06em] text-[#B91C1C]">BAL BODH SECONDARY SCHOOL</h2>
                <p className="mt-1 text-[12px] font-normal text-[#2563EB]">Kanchanrup Municipality-8, Kanchanpur</p>
                <p className="text-[12px] font-semibold text-[#64748B]">ESTD. 2055</p>
                <p className="mt-3 text-[14px] font-semibold text-[#15803D]">Academic Year: {academicYear}</p>
                <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.06em] text-[#EA580C]">{examTitle}</p>
                <p className="mt-1 text-[14px] font-bold uppercase tracking-[0.08em] text-[#7C3AED]">EXAMINATION ADMIT CARD</p>
              </div>

              <div className={"mt-8 grid gap-4" + (hasPhoto ? ' sm:grid-cols-[1fr_auto]' : '')}>
                <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
                  <dl className="space-y-3 text-sm text-slate-800">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                      <dt className="font-semibold text-slate-600">Name :</dt>
                      <dd className="text-slate-900 font-semibold">{titleCase(studentName)}</dd>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                      <dt className="font-semibold text-slate-600">Class :</dt>
                      <dd className="text-slate-900 font-semibold">{studentClass || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                      <dt className="font-semibold text-slate-600">Roll No :</dt>
                      <dd className="text-slate-900 font-semibold">{rollNumber || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {hasPhoto && (
                  <div className="flex justify-end">
                    <div className="h-[110px] w-[110px] overflow-hidden rounded-md border border-slate-300 shadow-sm bg-slate-100 mx-auto">
                        <img
                          src={studentPhoto}
                          alt="Student Photo"
                          className="h-full w-full object-cover object-center"
                          style={{ display: 'block' }}
                        />
                      </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-row gap-6 text-sm text-slate-900 items-end justify-between">
                <div className="flex flex-col items-start">
                  <div className="h-[1px] w-[120px] bg-black" />
                  <div className="mt-2 font-semibold">Accountant Signature</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="h-[1px] w-[120px] bg-black" />
                  <div className="mt-2 font-semibold">Founder Signature</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
