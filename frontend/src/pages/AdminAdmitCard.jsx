import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const defaultSettings = {
  schoolName: 'Bal Bodh Secondary School',
  schoolAddress: 'Kanchanrup Municipality-8, Kanchanpur\nESTD. 2055',
  admitCardHeader: 'Student Admit Card',
  admitCardWatermark: 'Bal Bodh Secondary School',
  logoUrl: ''
};

function CardPreview({ student, exam, settings, index, total, className, selectedClass }) {
  if (!student) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
        Select a student to preview the admit card here.
      </div>
    );
  }

  const studentClass = formatClassLabel(
    student.class?.name ||
    student.className ||
    student.studentClass ||
    student.classId?.name ||
    className ||
    selectedClass ||
    ''
  );

  console.log('Selected Class:', className || selectedClass);
  console.log('Student:', student);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <span className="max-w-full whitespace-nowrap text-5xl font-black uppercase tracking-[0.5em] text-slate-300">
          {settings.admitCardWatermark || defaultSettings.admitCardWatermark}
        </span>
      </div>
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-3xl font-bold text-white shadow-lg">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-20 w-20 rounded-3xl object-cover" />
              ) : (
                <span>📚</span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{settings.admitCardHeader || defaultSettings.admitCardHeader}</p>
              <h1 className="text-2xl font-bold text-slate-900">{settings.schoolName || defaultSettings.schoolName}</h1>
              {
                (settings.schoolAddress || defaultSettings.schoolAddress).split('\n').map((line, i) => (
                  <p key={i} className="text-sm text-slate-500">{line}</p>
                ))
              }
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-right text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Issue Date</p>
            <p>{formatDate(new Date())}</p>
            <p className="mt-3 font-semibold text-slate-700">Preview</p>
            <p>{index && total ? `${index} of ${total}` : 'Item preview'}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Student Details</h2>
            <div className="mt-4 flex gap-4">
              {/* Student Photo */}
              {(student?.profilePhoto || student?.profilePhotoUrl || student?.photoUrl || student?.photo || student?.image || student?.profilePhotoObj?.fileUrl) && (
                <div className="flex-shrink-0">
                  <img
                    src={student.profilePhoto || student.profilePhotoUrl || student.photoUrl || student.photo || student.image || student.profilePhotoObj?.fileUrl}
                    alt="Student Photo"
                    className="h-24 w-20 rounded-lg object-cover border-2 border-indigo-600 shadow-sm"
                  />
                </div>
              )}
              {/* Student Info */}
              <dl className="flex-1 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Name</span>
                  <span>{student.fullName || student.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Admission No.</span>
                  <span>{student.admissionNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Roll No.</span>
                  <span>{student.rollNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Class / Section</span>
                  <span>{studentClass || className || selectedClass || ''}{student.section ? ` / ${student.section}` : ''}</span>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Exam Details</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Exam</span>
                <span>{exam?.title || 'Select an exam'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Type</span>
                <span>{exam?.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Duration</span>
                <span>{exam?.startDate ? `${formatDate(exam.startDate)} - ${formatDate(exam.endDate)}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Academic Year</span>
                <span>{exam?.academicYear || 'N/A'}</span>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Instructions</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>• Carry this admit card during the exam.</li>
            <li>• Reach the exam center 30 minutes early.</li>
            <li>• Mobile phones and smart devices are prohibited.</li>
            <li>• Keep this document safe and present on demand.</li>
          </ul>
        </div>

        </div>

        {/* Removed separate photo section - now displayed beside name */}
      </div>
    </div>
  );
}

export default function AdminAdmitCard() {
  const [settings, setSettings] = useState(defaultSettings);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef(null);

  const selectedExam = useMemo(() => exams.find((exam) => exam._id === selectedExamId), [exams, selectedExamId]);
  const selectedStudents = useMemo(
    () => students.filter((student) => selectedStudentIds.includes(student._id)),
    [students, selectedStudentIds]
  );
  const activeStudent = useMemo(
    () => students.find((student) => student._id === activeStudentId) || selectedStudents[0] || null,
    [students, activeStudentId, selectedStudents]
  );
  const selectedClassName = useMemo(() => {
    const selected = classes.find((cls) => cls._id === selectedClass);
    return selected?.name || selected?.className || '';
  }, [classes, selectedClass]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        const [classesRes, settingsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/settings')
        ]);
        setClasses(classesRes.data.classes || []);
        setSettings({ ...defaultSettings, ...(settingsRes.data.setting || {}) });
      } catch (err) {
        console.error('Failed to load admit card admin page:', err);
        setError('Unable to load admit card admin data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setExams([]);
      setStudents([]);
      setSelectedExamId('');
      setSelectedStudentIds([]);
      setActiveStudentId(null);
      return;
    }

    const loadClassData = async () => {
      try {
        setError('');
        const [studentsRes, examsRes] = await Promise.all([
          api.get(`/students?class=${encodeURIComponent(selectedClass)}`),
          api.get(`/exams?class=${encodeURIComponent(selectedClass)}`)
        ]);
        const fetchedStudents = studentsRes.data.students || [];
        setStudents(fetchedStudents);
        setSelectedStudentIds(fetchedStudents.map((student) => student._id));
        setActiveStudentId(fetchedStudents[0]?._id || null);
        setExams(examsRes.data.exams || []);
        setSelectedExamId(examsRes.data.exams?.[0]?._id || '');
      } catch (err) {
        console.error('Failed to load class data:', err);
        setError('Unable to fetch students or exams for this class. Please try again.');
      }
    };

    loadClassData();
  }, [selectedClass]);

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      const payload = {
        schoolName: settings.schoolName,
        schoolAddress: settings.schoolAddress,
        admitCardHeader: settings.admitCardHeader,
        admitCardWatermark: settings.admitCardWatermark
      };
      const res = await api.put('/settings', payload);
      setSettings((prev) => ({ ...prev, ...(res.data.setting || {}) }));
      setMessage('Admit card branding settings were saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      const res = await api.post('/settings/logo', formData);
      setSettings((prev) => ({ ...prev, ...(res.data.setting || {}) }));
      setMessage('School logo uploaded successfully.');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Logo upload failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(students.map((student) => student._id));
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const generatePDF = async () => {
    if (!selectedExam) {
      setError('Please select an exam before exporting admit cards.');
      return;
    }
    if (!selectedStudents.length) {
      setError('Please select at least one student.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let pageIndex = 0;

      for (const [index, student] of selectedStudents.entries()) {
        setActiveStudentId(student._id);
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!previewRef.current) continue;
        const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
        pageIndex += 1;
      }

      pdf.save(`admit-cards-${selectedClassName || 'class'}-${formatDate(new Date()).replaceAll('/', '-')}.pdf`);
      setMessage(`Generated ${selectedStudents.length} admit card(s) successfully.`);
    } catch (err) {
      console.error('Bulk PDF generation failed:', err);
      setError('Unable to generate bulk PDF. Please try again.');
    }
  };

  const printSelected = () => {
    if (!selectedExam) {
      setError('Please select an exam before printing admit cards.');
      return;
    }
    if (!selectedStudents.length) {
      setError('Please select at least one student.');
      return;
    }

    const buildCardHtml = (student) => {
      return `
        <div style="page-break-after: always; margin-bottom: 24px;">
          <div style="border:1px solid #CBD5E1;border-radius:24px;padding:24px;font-family:Inter,system-ui,sans-serif;color:#0F172A;background:#fff;position:relative;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.06;pointer-events:none;">
              <div style="font-size:64px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:#0F172A;">${settings.admitCardWatermark || defaultSettings.admitCardWatermark}</div>
            </div>
            <div style="position:relative;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center;margin-bottom:20px;">
              <div style="display:flex;gap:16px;align-items:center;">
                <div style="width:80px;height:80px;border-radius:24px;background:#4338CA;color:white;display:flex;align-items:center;justify-content:center;font-size:32px;">
                  ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="width:80px;height:80px;object-fit:cover;border-radius:24px;" />` : '📚'}
                </div>
                <div>
                  <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#475569;">${settings.admitCardHeader || defaultSettings.admitCardHeader}</div>
                  <h1 style="font-size:24px;font-weight:800;line-height:1.1;margin-top:8px;">${settings.schoolName || defaultSettings.schoolName}</h1>
                  <p style="color:#64748B;margin-top:6px;font-size:14px;max-width:420px;">${settings.schoolAddress || defaultSettings.schoolAddress}</p>
                </div>
              </div>
              <div style="border:1px solid #E2E8F0;border-radius:24px;padding:12px;text-align:right;min-width:160px;">
                <div style="font-size:12px;font-weight:700;color:#334155;">Issue Date</div>
                <div style="margin-top:8px;color:#0F172A;font-size:14px;">${formatDate(new Date())}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
              <div style="border:1px solid #E2E8F0;border-radius:24px;padding:16px;background:#F8FAFC;">
                <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.18em;">Student Details</div>
                <div style="margin-top:14px;line-height:1.8;font-size:14px;color:#0F172A;">
                  <div><strong>Name:</strong> ${student.fullName || student.name || 'N/A'}</div>
                  <div><strong>Admission:</strong> ${student.admissionNumber || 'N/A'}</div>
                  <div><strong>Roll:</strong> ${student.rollNumber || 'N/A'}</div>
                  <div><strong>Class:</strong> ${formatClassLabel(student.class?.name || student.className || student.studentClass || student.classId?.name || selectedClassName || selectedClass) || selectedClassName || selectedClass || ''} ${student.section ? ` / ${student.section}` : ''}</div>
                </div>
              </div>
              <div style="border:1px solid #E2E8F0;border-radius:24px;padding:16px;background:#F8FAFC;">
                <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.18em;">Exam Details</div>
                <div style="margin-top:14px;line-height:1.8;font-size:14px;color:#0F172A;">
                  <div><strong>Exam:</strong> ${selectedExam.title || 'N/A'}</div>
                  <div><strong>Type:</strong> ${selectedExam.type || 'N/A'}</div>
                  <div><strong>Dates:</strong> ${selectedExam.startDate ? `${formatDate(selectedExam.startDate)} - ${formatDate(selectedExam.endDate)}` : 'N/A'}</div>
                  <div><strong>Year:</strong> ${selectedExam.academicYear || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div style="border:1px solid #E2E8F0;border-radius:24px;padding:16px;background:#F8FAFC;">
              <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.18em;">Important Instructions</div>
              <ul style="margin-top:12px;color:#334155;font-size:14px;line-height:1.8;">
                <li>Bring this admit card to the examination hall.</li>
                <li>Mobile phones are prohibited inside the exam room.</li>
                <li>Arrive 30 minutes before the scheduled start time.</li>
                <li>Maintain silence and follow the invigilator instructions.</li>
              </ul>
            </div>
            ${(student?.profilePhoto || student?.profilePhotoUrl || student?.photoUrl || student?.photo || student?.image || student?.profilePhotoObj?.fileUrl) ? `
            <div style="border:1px solid #E2E8F0;border-radius:24px;padding:16px;background:#F8FAFC;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.18em;margin-bottom:12px;">Student Photo</div>
              <img src="${student.profilePhoto || student.profilePhotoUrl || student.photoUrl || student.photo || student.image || student.profilePhotoObj?.fileUrl}" alt="Student Photo" style="max-width:120px;height:auto;border-radius:8px;border:2px solid #cbd5e1;" />
            </div>
            ` : ''}
          </div>
        </div>
      `;
    };

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (!printWindow) {
      setError('Unable to open print preview. Please check your browser pop-up settings.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Admit Cards</title>
          <style>
            body { margin: 0; padding: 24px; background: #F8FAFC; font-family: Inter, system-ui, sans-serif; }
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          ${selectedStudents.map((student) => buildCardHtml(student)).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleSaveSettings = async (field) => {
    setSettings((prev) => ({ ...prev, ...field }));
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#F8FAFC] p-6 sm:p-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Premium Admit Card Generator</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Configure school branding, choose a class and exam, then generate professional admit cards with watermark, header and bulk export support.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving}
              className="rounded-3xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Branding'}
            </button>
            <button
              type="button"
              onClick={generatePDF}
              className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Export Selected PDF
            </button>
            <button
              type="button"
              onClick={printSelected}
              className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Print Selected
            </button>
          </div>
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-3xl p-4 text-sm ${message ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message || error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Admit Card Branding</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">School name</span>
                <input
                  value={settings.schoolName}
                  onChange={(e) => handleSaveSettings({ schoolName: e.target.value })}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="School name"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">School address</span>
                <input
                  value={settings.schoolAddress}
                  onChange={(e) => handleSaveSettings({ schoolAddress: e.target.value })}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="Address shown on admit card"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                <span className="font-semibold">Admit card header</span>
                <input
                  value={settings.admitCardHeader}
                  onChange={(e) => handleSaveSettings({ admitCardHeader: e.target.value })}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="Premium Admit Card"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                <span className="font-semibold">Watermark text</span>
                <input
                  value={settings.admitCardWatermark}
                  onChange={(e) => handleSaveSettings({ admitCardWatermark: e.target.value })}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="School name or custom watermark"
                />
              </label>
              <div className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">School logo</span>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, logoUrl: '' }))}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo preview" className="h-16 w-16 rounded-3xl object-cover border border-slate-200" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-200 text-xl text-slate-600">Logo</div>
                    )}
                    <div>
                      <input type="file" accept="image/*" onChange={uploadLogo} />
                      <p className="text-xs text-slate-500">Upload a transparent PNG or JPG logo.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">This logo is used on all generated admit cards.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Class & Exam Selection</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">Class</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                >
                  <option value="">Choose a class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name || cls.numeric || 'Class'}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">Exam</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                >
                  <option value="">Choose an exam</option>
                  {exams.map((exam) => {
                    const full = exam.title || exam.type || '';
                    const short = full.length > 50 ? full.slice(0, 47) + '…' : full;
                    return <option key={exam._id} value={exam._id} title={full}>{short}</option>;
                  })}
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                <span>{students.length} students found</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={selectAllStudents} className="rounded-full bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-500">Select All</button>
                  <button type="button" onClick={clearSelection} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100">Clear</button>
                </div>
              </div>
              <div className="mt-4 max-h-72 overflow-y-auto rounded-3xl bg-white p-3">
                {students.length === 0 ? (
                  <p className="text-sm text-slate-500">Select a class to load students and exams.</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <label key={student._id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 px-4 py-3 hover:border-indigo-500">
                        <span className="text-sm text-slate-700">{student.fullName || student.name || 'Unnamed student'}</span>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>{student.admissionNumber || student.rollNumber || '—'}</span>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Live Admit Card Preview</h2>
                <p className="mt-2 text-sm text-slate-500">Preview the currently selected student card before exporting or printing.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {selectedStudents.length} selected
              </div>
            </div>
            <div className="mt-6" ref={previewRef}>
              <CardPreview student={activeStudent} exam={selectedExam} settings={settings} index={selectedStudents.findIndex((s) => s._id === activeStudent?._id) + 1} total={selectedStudents.length} className={selectedClassName} selectedClass={selectedClass} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
