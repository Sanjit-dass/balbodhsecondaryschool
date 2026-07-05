import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { SCHOOL_INFO } from '../constants/schoolData';

const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];

function getDefaultAcademicYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
  return `${startYear}-${startYear + 1}`;
}

function getAcademicYearBounds(value) {
  const [startYear] = value.split('-').map(Number);
  if (!startYear) return null;
  return {
    start: new Date(startYear, 3, 1, 0, 0, 0, 0),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999)
  };
}

function getStatusLabel(percentage) {
  if (percentage >= 90) return { label: 'Excellent', className: 'bg-emerald-100 text-emerald-700' };
  if (percentage >= 75) return { label: 'Good', className: 'bg-sky-100 text-sky-700' };
  if (percentage >= 60) return { label: 'Average', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Needs Attention', className: 'bg-rose-100 text-rose-700' };
}

export default function AttendanceReport() {
  const { user } = useContext(AuthContext);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(getDefaultAcademicYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportReady, setReportReady] = useState(false);

  const academicYearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const startYear = new Date().getMonth() >= 3 ? current : current - 1;
    return Array.from({ length: 5 }, (_, index) => {
      const year = startYear - index;
      return `${year}-${year + 1}`;
    });
  }, []);

  useEffect(() => {
    setReportReady(false);
  }, [selectedClass, selectedAcademicYear]);

  const fetchAttendance = async () => {
    if (!selectedClass) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/attendance', {
        params: {
          class: selectedClass,
          classId: selectedClass,
          page: 1,
          limit: 1000
        }
      });
      setRecords(res.data.attendance || []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedClass]);

  const yearBounds = useMemo(() => getAcademicYearBounds(selectedAcademicYear), [selectedAcademicYear]);

  const reportRows = useMemo(() => {
    if (!yearBounds) return [];

    const studentMap = new Map();

    records.forEach((record) => {
      const recordDate = new Date(record.date);
      if (recordDate < yearBounds.start || recordDate > yearBounds.end) return;

      (record.records || []).forEach((student) => {
        const key = student.person || `${student.rollNumber || ''}-${student.name || ''}`;
        const existing = studentMap.get(key) || {
          rollNumber: student.rollNumber || '—',
          name: student.name || '—',
          present: 0,
          total: 0
        };

        existing.total += 1;
        if (student.status === 'present') existing.present += 1;
        studentMap.set(key, existing);
      });
    });

    return Array.from(studentMap.values())
      .map((row) => ({
        ...row,
        percentage: row.total ? Math.round((row.present / row.total) * 100) : 0
      }))
      .sort((a, b) => {
        const left = String(a.rollNumber || '').toLowerCase();
        const right = String(b.rollNumber || '').toLowerCase();
        if (left && right && left !== right) return left.localeCompare(right);
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [records, yearBounds]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return reportRows;
    const term = searchTerm.trim().toLowerCase();
    return reportRows.filter((row) => {
      const haystack = `${row.name} ${row.rollNumber}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [reportRows, searchTerm]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const average = total
      ? Math.round(filteredRows.reduce((sum, row) => sum + row.percentage, 0) / total)
      : 0;
    return { total, average };
  }, [filteredRows]);

  const generateReport = () => {
    if (!selectedClass) {
      window.alert('Please select a class before generating the report.');
      return;
    }
    setReportReady(true);
  };

  const downloadExcel = () => {
    const header = ['Roll No', 'Student Name', 'Held', 'Attend', 'Attendance Percentage', 'Status'];
    const rows = filteredRows.map((row) => {
      const status = getStatusLabel(row.percentage).label;
      return [row.rollNumber, row.name, row.total, row.present, `${row.percentage}%`, status];
    });

    // Prepend school info (as top rows) for a professional CSV header
    const topInfo = [
      ['School Name', SCHOOL_INFO?.name || ''],
      ['Address', SCHOOL_INFO?.address || ''],
      ['Established', SCHOOL_INFO?.estd || ''],
      ['Class', selectedClass || ''],
      ['Academic Year', selectedAcademicYear || ''],
      []
    ];

    const csvLines = [
      ...topInfo,
      header,
      ...rows
    ];

    const csvContent = csvLines
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-report-${selectedClass}-${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      window.alert('Please allow pop-ups to print the attendance report.');
      return;
    }

    const rowsMarkup = filteredRows.length
      ? filteredRows.map((row) => {
          const status = getStatusLabel(row.percentage);
          return `
            <tr>
              <td>${row.rollNumber}</td>
              <td>${row.name}</td>
              <td>${row.total}</td>
              <td>${row.present}</td>
              <td>${row.percentage}%</td>
              <td><span class="badge ${status.className}">${status.label}</span></td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="6">No student records found for the selected filters.</td></tr>';

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
            <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 6px 0; }
            .small-meta { color: #475569; margin-bottom: 6px; font-size:12px }
            .top-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px }
            .title-center { text-align:center; flex:1 }
            .school-name { font-size: 24px; font-weight: 800; color: #b91c1c; text-align:center; }
            .school-address { color: #1e40af; font-size: 13px; text-align:center; }
            .school-estd { color: #475569; font-size: 13px; text-align:center; display:block; margin-top:4px }
            .class-title { text-align:center; font-size:18px; margin:10px 0; font-weight:700 }
            .left-meta { float:left; width:240px; font-size:13px; color:#334155; margin-top:8px }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size:13px }
            th { background: #f8fafc; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
            .bg-emerald-100 { background: #dcfce7; color: #166534; }
            .bg-sky-100 { background: #e0f2fe; color: #075985; }
            .bg-amber-100 { background: #fef3c7; color: #92400e; }
            .bg-rose-100 { background: #ffe4e6; color: #be123c; }
            .footer { text-align:center; margin-top:18px; color:#0f172a }
            .dash { margin:12px 0; color:#94a3b8 }
          </style>
        </head>
        <body>
          <div class="top-row">
            <div class="small-meta">${new Date().toLocaleString()}</div>
            <div class="title-center"><strong>Class ${selectedClass || '—'} Student Report</strong></div>
            <div style="width:120px;"></div>
          </div>

          <div>
            <div class="school-name">${SCHOOL_INFO?.name || ''}</div>
            <div class="school-address">${SCHOOL_INFO?.address || ''}</div>
            <div class="school-estd">ESTD. ${SCHOOL_INFO?.estd || ''}</div>
          </div>

          <div class="class-title">Class : ${selectedClass || '—'}</div>

          <div style="clear:both; margin-bottom:8px">
            <div class="left-meta">
              <div><strong>Academic Year:</strong> ${selectedAcademicYear}</div>
              <div><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:48px">S.N.</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Held</th>
                <th>Attend</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRows.length ? filteredRows.map((row, idx) => {
                const status = getStatusLabel(row.percentage);
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${row.rollNumber}</td>
                    <td>${row.name}</td>
                    <td>${row.total}</td>
                    <td>${row.present}</td>
                    <td>${row.percentage}%</td>
                    <td><span class="badge ${status.className}">${status.label}</span></td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="7">No student records found for the selected filters.</td></tr>'}
            </tbody>
          </table>

          <div class="dash">---------------------------------------------</div>
          <div class="footer">
            <div>Total Students: ${summary.total}</div>
            <div>Generated by: ${SCHOOL_INFO?.name || 'School Management System'}</div>
          </div>
          <div class="dash">---------------------------------------------</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance Report</h1>
          <p className="text-sm text-slate-600">Generate a yearly class-level attendance summary from the existing attendance records.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Logged in as <span className="font-semibold text-slate-800">{user?.fullName || user?.name || 'Administrator'}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Academic Year</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full rounded-3xl border border-slate-300 px-4 py-3"
            >
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Class</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-3xl border border-slate-300 px-4 py-3"
            >
              <option value="">Select class</option>
              {CLASS_OPTIONS.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Search Student</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name or roll number"
              className="w-full rounded-3xl border border-slate-300 px-4 py-3"
            />
          </label>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={generateReport}
              className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 transition"
            >
              Generate Report
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!reportReady || !filteredRows.length}
              className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={downloadExcel}
              disabled={!reportReady || !filteredRows.length}
              className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {!reportReady ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
          Choose a class and academic year, then generate the report to view the yearly attendance summary.
        </div>
      ) : loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          Loading attendance records…
        </div>
      ) : !filteredRows.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No attendance records were found for the selected class and academic year.
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Yearly Attendance Summary</h2>
              <p className="text-sm text-slate-600">Class {selectedClass} • {selectedAcademicYear}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                Students: {summary.total}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                Avg. Attendance: {summary.average}%
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="border px-4 py-3">Roll No</th>
                  <th className="border px-4 py-3">Student Name</th>
                  <th className="border px-4 py-3 text-center">Held</th>
                  <th className="border px-4 py-3 text-center">Attend</th>
                  <th className="border px-4 py-3 text-center">Attendance %</th>
                  <th className="border px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const status = getStatusLabel(row.percentage);
                  return (
                    <tr key={`${row.rollNumber}-${row.name}`} className="odd:bg-white even:bg-slate-50">
                      <td className="border px-4 py-3">{row.rollNumber}</td>
                      <td className="border px-4 py-3">{row.name}</td>
                      <td className="border px-4 py-3 text-center">{row.total}</td>
                      <td className="border px-4 py-3 text-center">{row.present}</td>
                      <td className="border px-4 py-3 text-center font-semibold">{row.percentage}%</td>
                      <td className="border px-4 py-3 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
