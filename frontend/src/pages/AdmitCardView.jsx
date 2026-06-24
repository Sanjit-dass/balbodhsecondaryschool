import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
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

const getStudentRollNumber = (student) => {
  return student?.rollNumber || student?.admissionNumber || '';
};

const getAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const formatExamDisplayName = (examName) => {
  if (!examName) return 'N/A';
  return examName.replace(/Exam$/i, 'Examination');
};

const titleCase = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
};

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

export default function AdmitCardView() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const examName = searchParams.get('examName');
  const examId = searchParams.get('examId');
  const selectedClassName = searchParams.get('className') || '';
  const [student, setStudent] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [studentRes, examRes] = await Promise.all([
          api.get(`/students/${studentId}`),
          examId ? api.get(`/exams/${examId}`) : Promise.resolve({ data: { exam: null } })
        ]);
        setStudent(studentRes.data);
        setExam(examRes.data.exam || null);
      } catch (err) {
        console.error('Failed to load admit card view data:', err);
        setError('Unable to load admit card details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    }
  }, [studentId, examId]);

    const downloadPDF = async () => {
      try {
        const element = document.getElementById('admit-card-view');
        if (!element) return;
        const rect = element.getBoundingClientRect();

        // temporarily increase bottom padding so signatures and bottom border are included
        const origPaddingBottom = element.style.paddingBottom;
        const origOverflow = element.style.overflow;
        try {
          element.style.paddingBottom = '64px';
          element.style.overflow = 'visible';
          element.scrollIntoView({ behavior: 'auto', block: 'end' });

          const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: Math.ceil(rect.width), height: Math.ceil(rect.height) + 64, scrollY: -window.scrollY });
          const imgData = canvas.toDataURL('image/png', 1.0);

          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10; // mm
          const usableWidth = pageWidth - margin * 2;

          let imgWidth = usableWidth;
          let imgHeight = (canvas.height * imgWidth) / canvas.width;

          const usableHeight = pageHeight - margin * 2;
          if (imgHeight > usableHeight) {
            const scale = usableHeight / imgHeight;
            imgHeight = imgHeight * scale;
            imgWidth = imgWidth * scale;
          }

          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
          pdf.save(`admit-card-${getStudentRollNumber(student).replace(/\s+/g, '_') || 'student'}.pdf`);
        } finally {
          element.style.paddingBottom = origPaddingBottom;
          element.style.overflow = origOverflow;
        }
      } catch (err) {
        console.error(err);
        setError('PDF generation failed.');
      }
    };

  const printCard = () => {
    const element = document.getElementById('admit-card-view');
    if (!element) return;
    const printWindow = window.open('', '', 'width=900,height=900');
    if (!printWindow) {
      setError('Unable to open print preview. Please allow pop-ups.');
      return;
    }

    // Clone the element and inline computed styles so the printed output matches the screen
    const clone = element.cloneNode(true);

    const inlineStyles = (source, target) => {
      if (!source || !target) return;
      const computed = window.getComputedStyle(source);
      let cssText = '';
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        try {
          cssText += `${prop}: ${computed.getPropertyValue(prop)}; `;
        } catch (e) {}
      }
      target.setAttribute('style', cssText);
      const sourceChildren = Array.from(source.children || []);
      const targetChildren = Array.from(target.children || []);
      for (let i = 0; i < sourceChildren.length; i++) {
        inlineStyles(sourceChildren[i], targetChildren[i]);
      }
    };

    inlineStyles(element, clone);

    const html = `<!doctype html><html><head><title>Admit Card</title><style>html,body{margin:0;padding:0;background:#fff;color:#111;}@page{size:auto;margin:0;}body{display:flex;align-items:flex-start;justify-content:center;padding:0;margin:0;} .admit-card{box-shadow:none !important;margin:0;padding:0;} .admit-card *{box-shadow:none !important;}</style></head><body>${clone.outerHTML}</body></html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // wait a short time for content to render
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm border border-rose-200">
          <h2 className="text-xl font-semibold text-rose-700">Error</h2>
          <p className="mt-3 text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const studentName = student?.fullName || student?.name || '';
  const selectedClass = selectedClassName;

  console.log('ADMIT CARD STUDENT:', student);
  console.log('SELECTED CLASS:', selectedClass);

  const classValueRaw = student?.className || student?.class?.name || student?.class || selectedClass || '';
  const studentClass = formatClassLabel(classValueRaw) || classValueRaw || selectedClass || '';
  const rollNumber = getStudentRollNumber(student);
  const examTitle = formatExamDisplayName(examName || exam?.title || '');
  const academicYear = getAcademicYear();
  const studentPhoto = student?.profilePhoto || student?.profilePhotoUrl || student?.photoUrl || student?.photo || student?.image || student?.profilePhotoObj?.fileUrl || '';
  const hasPhoto = Boolean(studentPhoto);

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 sm:p-8">
      <div className="mx-auto max-w-[520px]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Admit Card</h1>
            <p className="mt-1 text-sm text-slate-500">Print the admit card only, without dashboard or controls.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadPDF} className="no-print rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Download PDF</button>
            <button onClick={printCard} className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print</button>
            <button onClick={() => navigate(-1)} className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </div>

        <div id="admit-card-view" className="admit-card mx-auto w-full max-w-[420px] rounded-[8px] border-2 border-[#B91C1C] bg-white p-[16px] pb-[32px] shadow-[0_6px_12px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col items-center text-center">
            <img src="/logo.png" alt="School Logo" className="mx-auto h-[60px] w-[60px] object-contain" />
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
                <div className="h-[120px] w-[100px] overflow-hidden rounded-xl border border-slate-300 shadow-sm bg-slate-100">
                  <img
                    src={studentPhoto}
                    alt="Student Photo"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-row gap-6 text-sm text-slate-900 items-end justify-between">
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
    </div>
  );
}
