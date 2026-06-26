import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
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
  return student?.rollNumber || student?.admissionNumber || 'N/A';
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

export default function AdmitCard() {
  const { user } = useContext(AuthContext);
  const [studentData, setStudentData] = useState(null);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentRes, examsRes, subjectsRes] = await Promise.all([
          api.get('/students/me').catch(() => ({ data: { student: null } })),
          api.get('/exams').catch(() => ({ data: { exams: [] } })),
          api.get('/subjects').catch(() => ({ data: { subjects: [] } }))
        ]);

        setStudentData(studentRes.data.student || user || {});
        setExams(examsRes.data.exams || []);
        setSubjects(subjectsRes.data.subjects || []);
      } catch (err) {
        console.error('Error fetching admit card data:', err);
        setError('Unable to load admit card data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const downloadPDF = async () => {
    try {
      const element = document.getElementById('admit-card-content');
      if (!element) return;

      // Embed images as data URLs when possible and relax overflow styles to avoid clipping
      const embedImages = async (root) => {
        const imgs = Array.from(root.querySelectorAll('img'));
        for (const img of imgs) {
          const src = img.src;
          if (!src || src.startsWith('data:')) continue;
          try {
            const resp = await fetch(src, { mode: 'cors' });
            const blob = await resp.blob();
            const dataUrl = await new Promise((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result);
              fr.onerror = reject;
              fr.readAsDataURL(blob);
            });
            img.src = dataUrl;
          } catch (e) {
            try {
              await new Promise((res, rej) => {
                const I = new Image();
                I.crossOrigin = 'Anonymous';
                I.onload = () => {
                  try {
                    const c = document.createElement('canvas');
                    c.width = I.naturalWidth || I.width;
                    c.height = I.naturalHeight || I.height;
                    const cx = c.getContext('2d');
                    cx.drawImage(I, 0, 0);
                    img.src = c.toDataURL('image/png');
                    res(true);
                  } catch (err) { rej(err); }
                };
                I.onerror = rej;
                I.src = src;
              });
            } catch (_) {
              // can't embed this image
            }
          }
        }
      };

      const relaxOverflow = (root) => {
        const elems = Array.from(root.querySelectorAll('*'));
        elems.push(root);
        elems.forEach((el) => {
          if (el && el.style) {
            el.style.overflow = 'visible';
            el.style.maxHeight = 'none';
            el.style.height = 'auto';
          }
        });
      };

      await embedImages(element);
      relaxOverflow(element);

      // Ensure there's extra bottom space so signatures aren't clipped
      const originalPaddingBottom = element.style.paddingBottom;
      element.style.paddingBottom = element.style.paddingBottom || '60mm';

      // Render at higher scale for sharpness
      const canvas = await html2canvas(element, { scale: 2.5, useCORS: true, allowTaint: true, logging: false });

      // PDF export (A4) - try to fit to a single page when possible, otherwise slice into pages
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm
      const imgWidthMm = pdfWidth - margin * 2;

      const canvasWidthPx = canvas.width;
      const canvasHeightPx = canvas.height;
      const pxPerMm = canvasWidthPx / imgWidthMm;

      // Height in mm when scaled to pdf width
      const totalHeightMm = canvasHeightPx / pxPerMm;

      // Try single-page export first using a reasonably large minimum scale.
      const availableHeightMm = pdfHeight - margin * 2;
      const availableWidthMm = imgWidthMm;
      const minScale = 0.8; // prefer minimal shrink; fall back to multi-page if it can't fit
      const naturalScale = Math.min(1, availableHeightMm / totalHeightMm);

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      if (naturalScale >= minScale) {
        // fits on a single page without excessive shrinking
        const scaleDown = naturalScale;
        const displayWidth = imgWidthMm * scaleDown;
        const displayHeight = totalHeightMm * scaleDown;
        const x = margin + (availableWidthMm - displayWidth) / 2;
        const y = margin;
        pdf.addImage(imgData, 'JPEG', x, y, displayWidth, displayHeight);
        element.style.paddingBottom = originalPaddingBottom || '';
        pdf.save(`admit-card-${getStudentRollNumber(studentData).replace(/\s+/g, '_') || 'student'}.pdf`);
        return;
      }

      // Otherwise, fall back to multi-page slicing so nothing is ever clipped.
      const overlapMm = 12; // overlap in mm to avoid clipping at page breaks
      const overlapPx = Math.round(overlapMm * pxPerMm);
      const pageHeightPx = Math.floor(pdfHeight * pxPerMm) - overlapPx;

      let yOffsetPx = 0;
      let pageIndex = 0;

      while (yOffsetPx < canvasHeightPx) {
        const srcY = pageIndex === 0 ? 0 : Math.max(0, yOffsetPx - overlapPx);
        const remaining = canvasHeightPx - srcY;
        const sliceHeight = remaining > pageHeightPx + overlapPx ? pageHeightPx + overlapPx : remaining;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidthPx;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvasWidthPx, sliceHeight, 0, 0, canvasWidthPx, sliceHeight);

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        const imgHeightMm = pageCanvas.height / pxPerMm;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidthMm, imgHeightMm);

        yOffsetPx += pageHeightPx;
        pageIndex++;
      }

      // restore original padding
      element.style.paddingBottom = originalPaddingBottom || '';

      pdf.save(`admit-card-${getStudentRollNumber(studentData).replace(/\s+/g, '_') || 'student'}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Could not generate PDF. Please try printing instead.');
    }
  }

  const handlePrint = () => {
    const element = document.getElementById('admit-card-content');
    if (!element) return;

    // Clone the node and inline computed styles to preserve layout in the new window
    const cloneWithInlineStyles = (node) => {
      const clone = node.cloneNode(false);
      if (node.nodeType === Node.ELEMENT_NODE) {
        const cs = window.getComputedStyle(node);
        try {
          clone.style.cssText = cs.cssText;
        } catch (e) {
          // some browsers may not allow setting cssText from computed style; fallback below
        }
        // copy important attributes
        if (node.tagName === 'IMG') {
          clone.src = node.src;
        }
      }
      for (let child = node.firstChild; child; child = child.nextSibling) {
        clone.appendChild(cloneWithInlineStyles(child));
      }
      return clone;
    };

    const cloned = cloneWithInlineStyles(element);
    const wrapper = document.createElement('div');
    wrapper.className = 'admit-card';
    wrapper.appendChild(cloned);

    const printWindow = window.open('', '', 'height=1400,width=900');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Admit Card</title>');
    printWindow.document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">');
    printWindow.document.write(`
      <style>
        html, body { margin: 0; padding: 0; background: white; }
        .admit-card { width: 210mm; max-width: 100%; margin: 0 auto; padding: 12mm; box-sizing: border-box; background: white; }
        img { max-width: 100%; height: auto; display: block; }
        table { border-collapse: collapse; }
        @page { size: A4 portrait; margin: 8mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .admit-card { margin: 0; padding: 0; }
          button, .no-print { display: none !important; }
          img { -webkit-print-color-adjust: exact; }
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.body.appendChild(wrapper);
    // Because we appended DOM nodes, serialize the document properly
    const serialized = printWindow.document.documentElement.outerHTML;
    // rewrite document to ensure the serialized content is used
    printWindow.document.open();
    printWindow.document.write(serialized);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { try { printWindow.print(); } catch (e) {} finally { printWindow.close(); } }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-12 w-48 rounded-lg bg-slate-200" />
              <div className="h-6 w-full rounded-lg bg-slate-100" />
              <div className="h-6 w-3/4 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-lg font-semibold text-red-900">Error Loading Admit Card</h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const studentPhoto = studentData?.profilePhoto || studentData?.profilePhotoUrl || studentData?.photoUrl || studentData?.profilePhotoObj?.fileUrl || '';
  const studentName = studentData?.fullName || user?.name || 'N/A';
  const rollNumber = getStudentRollNumber(studentData);
  const studentClass = formatClassLabel(
    studentData?.className ||
    studentData?.class?.name ||
    studentData?.class ||
    studentData?.studentClass ||
    studentData?.classId?.name ||
    studentData?.classId ||
    ''
  );
  console.log('Student Data:', studentData);
  const section = studentData?.section || '';
  const dob = studentData?.dateOfBirth ? formatDate(studentData.dateOfBirth) : 'N/A';
  const gender = studentData?.gender || '';
  const fatherName = studentData?.fatherName || '';
  const motherName = studentData?.motherName || '';

  const upcomingExams = exams.filter(e => !e.completed).slice(0, 5);
  const academicYear = '2026-2027';

  const examSubjects = subjects.slice(0, 5).map((sub, idx) => ({
    sn: idx + 1,
    subject: sub.name || sub,
    code: sub.code || `SUB${idx + 1}`,
    date: formatDate(upcomingExams[idx]?.startDate || new Date(2027, 2, 10 + idx * 3)),
    time: '10:00 AM'
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={downloadPDF}
            className="no-print inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            📥 Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            🖨️ Print Admit Card
          </button>
        </div>

        {/* Admit Card */}
        <div id="admit-card-content" className="rounded-xl bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="border-b-4 border-[#DC2626] pb-4 text-center">
            {/* School Name */}
            <h1 className="text-3xl font-bold text-[#DC2626]">BAL BODH SECONDARY SCHOOL</h1>
            <p className="mt-1 text-sm text-[#2563EB] font-semibold">Kanchanrup Municipality-8, Kanchanpur</p>
            <p className="text-sm font-semibold text-[#64748B]">ESTD. 2055</p>
            
            {/* Divider */}
            <div className="my-2 border-t border-[#E2E8F0]" />
            
            {/* Academic Year */}
            <p className="text-sm font-bold text-[#059669]">Academic Year: {academicYear}</p>
            
            {/* Exam Title */}
            <h2 className="mt-3 text-xl font-bold text-[#7C3AED]">EXAMINATION ADMIT CARD</h2>
          </div>

          {/* Main Content */}
          <div className="mt-6 space-y-4">
            {/* Student Info Section - Professional Layout */}
            <div className="border-2 border-[#1F2937] p-6">
              <div className="flex gap-8 items-start">
                {/* Left: Student Details */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex">
                      <span className="w-32 font-bold text-[#0F172A]">Name :</span>
                      <span className="text-[#0F172A]">{studentName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-[#0F172A]">Roll No :</span>
                      <span className="text-[#0F172A]">{rollNumber}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-[#0F172A]">Class :</span>
                      <span className="text-[#0F172A]">{studentClass}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-[#0F172A]">Section :</span>
                      <span className="text-[#0F172A]">{section || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-[#0F172A]">Date of Birth :</span>
                      <span className="text-[#0F172A]">{dob}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-[#0F172A]">Gender :</span>
                      <span className="text-[#0F172A]">{gender || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Student Photo */}
                {(studentPhoto || studentData?.photo || studentData?.image) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={studentPhoto || studentData?.photo || studentData?.image} 
                      alt="Student Photo" 
                      className="h-32 w-28 rounded-lg object-cover border-4 border-[#0F172A] shadow-md" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Student Details */}
            <div className="border-b-2 border-[#E2E8F0] pb-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex">
                  <span className="font-bold text-[#0F172A]">Father's Name :</span>
                  <span className="ml-3 text-[#0F172A]">{fatherName || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-[#0F172A]">Mother's Name :</span>
                  <span className="ml-3 text-[#0F172A]">{motherName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Exam Information - Compact */}
            <div className="py-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex">
                  <span className="font-bold text-[#0F172A]">Exam :</span>
                  <span className="ml-3 text-[#0F172A]">Annual Examination 2026</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-[#0F172A]">Center :</span>
                  <span className="ml-3 text-[#0F172A]">Bal Bodh School</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-[#0F172A]">Issue Date :</span>
                  <span className="ml-3 text-[#0F172A]">{formatDate(new Date())}</span>
                </div>
              </div>
            </div>

          {/* Subject Table */}
          <div className="my-4">
            <h3 className="text-xs font-bold text-[#0F172A] mb-2">EXAM SUBJECTS</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="border border-[#2563EB] px-2 py-1 text-left font-semibold">S.N.</th>
                    <th className="border border-[#2563EB] px-2 py-1 text-left font-semibold">Subject</th>
                    <th className="border border-[#2563EB] px-2 py-1 text-left font-semibold">Code</th>
                    <th className="border border-[#2563EB] px-2 py-1 text-left font-semibold">Exam Date</th>
                  </tr>
                </thead>
                <tbody>
                  {examSubjects.map((item) => (
                    <tr key={item.sn} className="hover:bg-[#F8FAFC]">
                      <td className="border border-[#E2E8F0] px-2 py-1 text-[#0F172A]">{item.sn}</td>
                      <td className="border border-[#E2E8F0] px-2 py-1 text-[#0F172A]">{item.subject}</td>
                      <td className="border border-[#E2E8F0] px-2 py-1 text-[#0F172A]">{item.code}</td>
                      <td className="border border-[#E2E8F0] px-2 py-1 text-[#0F172A]">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exam Instructions */}
          <div className="my-4 py-3 border-y-2 border-[#E2E8F0]">
            <p className="text-xs text-[#0F172A]">
              <span className="font-bold">Instructions: </span>
              Bring this admit card to every examination. Reach 30 minutes before exam. Mobile phones prohibited. Keep safe during exam period.
            </p>
          </div>

          {/* Signature Section */}
          <div className="mt-6 pt-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Accountant Signature */}
              <div className="text-center">
                <div className="mb-12 h-16 border-b-2 border-[#0F172A] signature-line" />
                <p className="text-xs font-semibold text-[#0F172A]">Accountant Signature</p>
              </div>

              {/* Founder Signature */}
              <div className="text-center">
                <div className="mb-12 h-16 border-b-2 border-[#0F172A] signature-line" />
                <p className="text-xs font-semibold text-[#0F172A]">Founder Signature</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t-2 border-[#E2E8F0] pt-4 text-center text-xs text-[#64748B]">
            <p>This is an official document issued by Bal Bodh Secondary School. Keep it safe during the examination period.</p>
            <p className="mt-2">Generated on {formatDate(new Date())}</p>
          </div>
        </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            html, body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            #admit-card-content, .admit-card { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; overflow: visible !important; height: auto !important; max-height: none !important; }
            * { overflow: visible !important; }
            img { max-width: 100% !important; height: auto !important; display: block !important; }
            .no-print, button { display: none !important; }
            .signature-line { page-break-inside: avoid; }
            table, thead, tbody, tr, td, th { page-break-inside: avoid; }
            @page { size: A4 portrait; margin: 8mm; }
          }
        `}</style>
      </div>
    </div>
  );
}