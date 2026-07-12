import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StudentForm from '../components/StudentForm';

const ACADEMIC_YEAR_OPTIONS = ['2026', '2027', '2028'];

const CLASS_OPTIONS = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10'
];

const CLASS_CARD_VARIANTS = [
  'from-sky-500 via-cyan-500 to-teal-500',
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-rose-500 via-orange-500 to-amber-500',
  'from-emerald-500 via-lime-500 to-cyan-500',
  'from-slate-600 via-slate-700 to-slate-900',
  'from-indigo-600 via-sky-600 to-cyan-600',
  'from-violet-600 via-fuchsia-600 to-pink-600'
];

const formatStudentPhone = (student) => {
  const phone = student?.phone || student?.contactNumber || student?.guardian?.contact || '';
  return phone ? phone : '-';
};

export default function Students() {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [exportingClassDetails, setExportingClassDetails] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionTargetClass, setPromotionTargetClass] = useState('');
  const [promotionAcademicYear, setPromotionAcademicYear] = useState('2026');
  const [promotionStudents, setPromotionStudents] = useState([]);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);
  const [promoting, setPromoting] = useState(false);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [promotionError, setPromotionError] = useState('');

  const fetchStudents = async (className, text = '') => {
    try {
      setLoading(true);
      const params = {};
      if (text) params.q = text;
      if (className) params.className = className;
      const res = await api.get('/students', { params });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass, filter);
    }
  }, [selectedClass, filter]);

  const handleClassClick = (className) => {
    setSelectedClass(className);
    setEditing(null);
    setShowForm(false);
    setFilter('');
  };

  const handleBack = () => {
    setSelectedClass('');
    setStudents([]);
    setEditing(null);
    setShowForm(false);
    setFilter('');
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const resetPromotionState = () => {
    setShowPromotionModal(false);
    setPromotionTargetClass('');
    setPromotionAcademicYear('2026');
    setPromotionStudents([]);
    setSelectedPromotionIds([]);
    setPromotionMessage('');
    setPromotionError('');
  };

  const openPromotionModal = async () => {
    if (!selectedClass) return;
    try {
      setPromoting(true);
      setPromotionError('');
      setPromotionMessage('');
      const res = await api.get('/students', { params: { className: selectedClass } });
      setPromotionStudents(res.data.students || []);
      setShowPromotionModal(true);
    } catch (err) {
      console.error(err);
      setPromotionError('Unable to load students for promotion right now.');
    } finally {
      setPromoting(false);
    }
  };

  const togglePromotionSelection = (studentId) => {
    setSelectedPromotionIds((prev) => prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]);
  };

  const handleSelectAllPromotion = () => {
    setSelectedPromotionIds(promotionStudents.map((student) => student._id));
  };

  const handleClearPromotionSelection = () => {
    setSelectedPromotionIds([]);
  };

  const handlePromoteSelected = async () => {
    if (!selectedClass || !promotionAcademicYear || !promotionTargetClass) {
      setPromotionError('Please choose a destination class and academic year.');
      return;
    }

    if (!selectedPromotionIds.length) {
      setPromotionError('Select at least one student to promote.');
      return;
    }

    if (promotionTargetClass === selectedClass) {
      setPromotionError('This student is already in the selected class.');
      return;
    }

    const confirmed = window.confirm(`Promote ${selectedPromotionIds.length} selected students from ${selectedClass} to ${promotionTargetClass}?`);
    if (!confirmed) return;

    try {
      setPromoting(true);
      setPromotionError('');
      setPromotionMessage('');
      const res = await api.post('/students/promote', {
        className: selectedClass,
        academicYear: promotionAcademicYear,
        targetClass: promotionTargetClass,
        studentIds: selectedPromotionIds
      });
      setPromotionMessage(res.data.message || 'Promotion completed successfully.');
      setSelectedPromotionIds([]);
      await fetchStudents(selectedClass, filter);
      setPromotionStudents((prev) => prev.filter((student) => !selectedPromotionIds.includes(student._id)));
    } catch (err) {
      console.error(err);
      setPromotionError(err?.response?.data?.message || 'Unable to promote students right now.');
    } finally {
      setPromoting(false);
    }
  };

  const onSaved = () => {
    setShowForm(false);
    setEditing(null);
    if (selectedClass) fetchStudents(selectedClass, filter);
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
    try {
      await api.delete(`/students/${studentId}`);
      fetchStudents(selectedClass, filter);
    } catch (err) {
      console.error(err);
      alert('Unable to delete student.');
    }
  };

  const handleExportClassDetails = () => {
    if (!selectedClass) {
      window.alert('Please select a class first.');
      return;
    }

    const reportRows = students.length
      ? students.map((student, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${student.admissionNumber || '-'}</td>
            <td>${student.fullName || '-'}</td>
            <td>${student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '-'}</td>
            <td>${student.guardian?.fatherName || '-'}</td>
            <td>${student.guardian?.motherName || '-'}</td>
            <td>${formatStudentPhone(student)}</td>
            <td>${student.guardian?.address || '-'}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="10" style="text-align:center; padding:16px;">No students found for this class.</td></tr>';

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedClass} Student Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
            .header { text-align: center; margin-bottom: 10px; }
            .school-name { margin: 2px 0; font-size: 22px; font-weight: 700; color: #dc2626; }
            .school-address { margin: 2px 0; font-size: 13px; color: #2563eb; }
            .school-meta { margin: 2px 0; font-size: 12px; color: #374151; }
            .meta { margin: 8px 0 16px; font-size: 12px; line-height: 1.3; }
            .class-title { font-size: 22px; font-weight: 700; margin: 8px 0 10px; color: #000000; text-align: center; }
            .meta-left { margin-top: 4px; text-align: left; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; }
            .footer { margin-top: 20px; font-size: 11px; text-align: center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">Bal Bodh Secondary School</div>
            <div class="school-address">Kanchanrup Municipality-08, Kanchanpur</div>
            <div class="school-meta">ESTD. 2055</div>
          </div>
          <div class="meta">
            <div class="class-title">Class : ${selectedClass.replace(/^Class\s+/i, '')}</div>
            <div class="meta-left">
              <div>Academic Year: 2026</div>
              <div>Generated Date: ${new Date().toLocaleDateString('en-GB')}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Roll No.</th>
                <th>Student Name</th>
                <th>Gender</th>
                <th>Father Name</th>
                <th>Mother Name</th>
                <th>Phone Number</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>${reportRows}</tbody>
          </table>
          <div class="footer">
            <div>----------------------------------------</div>
            <div>Total Students: ${students.length}</div>
            <div>Generated by:</div>
            <div>Bal Bodh Secondary School Management System</div>
            <div>----------------------------------------</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      window.alert('Please allow popups to print the student report.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();

    setExportingClassDetails(true);
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setExportingClassDetails(false);
    }, 300);
  };

  return (
    <div className="space-y-4 md:space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Student Management</h1>
          <p className="text-slate-200 max-w-2xl mt-1 md:mt-2 text-sm md:text-base">
            Select a class to manage students, add new records, or update existing profiles. Class selection is the first step in your admin workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            type="button"
            onClick={handleExportClassDetails}
            disabled={exportingClassDetails || !selectedClass}
            className="no-print px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl shadow-sm transition-colors"
          >
            {exportingClassDetails ? 'Generating PDF...' : '📄 Download Full Class Student Details'}
          </button>
        </div>
      </div>

      {!selectedClass ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {CLASS_OPTIONS.map((className, index) => {
            const variant = CLASS_CARD_VARIANTS[index % CLASS_CARD_VARIANTS.length];
            return (
              <button
                key={className}
                type="button"
                onClick={() => handleClassClick(className)}
                className={`group rounded-2xl md:rounded-3xl p-4 md:p-6 text-left shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${variant}`}
              >
                <div className="text-xs md:text-sm text-slate-100 uppercase tracking-[0.24em] mb-2 md:mb-4 opacity-80">Manage</div>
                <div className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">{className}</div>
                <div className="text-xs md:text-sm text-slate-100/90">View students, add new entries, and keep this class roster updated.</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button onClick={handleBack} className="mb-2 md:mb-3 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm md:text-base">
                ← Back to classes
              </button>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedClass}</h2>
              <p className="text-slate-500 mt-1 text-xs md:text-sm">Student roster for {selectedClass}. Add, edit, or remove students for this class.</p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button onClick={handleAdd} className="btn-primary py-2 md:py-3 text-xs md:text-sm">Add Student</button>
              <button
                type="button"
                onClick={openPromotionModal}
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl shadow-sm transition-colors"
              >
                🎓 Promote / Transfer Students
              </button>
            </div>
          </div>

          {showForm && (
            <StudentForm
              existing={editing}
              selectedClassName={selectedClass}
              onSaved={onSaved}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm p-4 md:p-6">
            <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900">Class student list</h3>
                <p className="text-xs md:text-sm text-slate-500">Showing students in {selectedClass}. Total: {students.length}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search name or roll no"
                  className="input-premium text-sm md:text-base"
                />
                <button onClick={() => fetchStudents(selectedClass, filter)} className="btn-secondary py-2 md:py-3 text-xs md:text-sm">
                  Search
                </button>
              </div>
            </div>

            <div className="mt-4 md:mt-6">
              {/* Mobile: stacked cards */}
              <div className="sm:hidden space-y-3 md:space-y-4">
                {loading ? (
                  <div className="py-8 md:py-12 text-center text-slate-500 text-xs md:text-sm">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="py-8 md:py-12 text-center text-slate-500 text-xs md:text-sm">No students found in this class.</div>
                ) : (
                  students.map((student) => (
                    <div key={student._id} className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-3 md:p-4 shadow-sm">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm md:text-base truncate">{student.fullName}</div>
                          <div className="text-xs md:text-sm text-slate-500">{student.section ? `Section ${student.section}` : 'No section'}</div>
                          <div className="text-xs md:text-sm text-slate-700 mt-1 md:mt-2">Roll: {student.admissionNumber || 'N/A'}</div>
                          <div className="text-xs md:text-sm text-slate-700">Gender: {student.gender || 'N/A'}</div>
                          <div className="text-xs md:text-sm text-slate-700">Phone: {formatStudentPhone(student)}</div>
                          <div className="text-xs md:text-sm text-slate-700 mt-1 md:mt-2">Parent: {student.guardian?.fatherName || 'Missing'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 md:mt-3">
                        <button type="button" onClick={() => { setEditing(student); setShowForm(true); }} className="btn-secondary flex-1 py-2 text-xs md:text-sm">Edit</button>
                        <button type="button" onClick={() => handleDelete(student._id)} className="btn-danger flex-1 py-2 text-xs md:text-sm">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop/table: visible on sm+ */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full text-left border-separate border-spacing-y-2 md:border-spacing-y-3">
                <thead>
                  <tr className="text-xs md:text-sm text-slate-500 uppercase tracking-[0.15em]">
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Name</th>
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Roll No</th>
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Gender</th>
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Phone Number</th>
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Parent Info</th>
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 md:py-12 text-center text-slate-500 text-xs md:text-sm">Loading students...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 md:py-12 text-center text-slate-500 text-xs md:text-sm">No students found in this class.</td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student._id} className="bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 mb-2 md:mb-3">
                        <td className="px-3 md:px-4 py-3 md:py-4 align-top">
                          <div className="font-semibold text-slate-900 text-xs md:text-sm">{student.fullName}</div>
                          <div className="text-xs md:text-sm text-slate-500">{student.section ? `Section ${student.section}` : 'No section'}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 align-top text-slate-700 text-xs md:text-sm">{student.admissionNumber || 'N/A'}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 align-top text-slate-700 capitalize text-xs md:text-sm">{student.gender || 'N/A'}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 align-top text-slate-700 text-xs md:text-sm">{formatStudentPhone(student)}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 align-top text-slate-700 text-xs md:text-sm">
                          <div className="text-xs md:text-sm font-semibold">{student.guardian?.fatherName || 'Father name missing'}</div>
                          <div className="text-xs md:text-sm text-slate-500">{student.guardian?.contact || 'No contact'}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 align-top">
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            <button
                              type="button"
                              onClick={() => { setEditing(student); setShowForm(true); }}
                              className="btn-secondary py-1.5 md:py-2 px-2 md:px-3 text-xs md:text-sm"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(student._id)}
                              className="btn-danger py-1.5 md:py-2 px-2 md:px-3 text-xs md:text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      )}

      {showPromotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-3 py-4">
          <div className="w-full max-w-full max-h-[calc(100vh-2rem)] rounded-3xl border border-slate-200 bg-white shadow-2xl md:max-w-5xl flex flex-col overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-7">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Promote / Transfer Students</h3>
                <p className="mt-1 text-sm text-slate-500">Move selected students to the next class for a new academic year without recreating their records.</p>
              </div>
              <button type="button" onClick={resetPromotionState} className="self-start text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="overflow-y-auto px-5 py-4 md:px-7 flex-1">
              <div className="grid gap-4 border-b border-slate-200 pb-5 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Current Class</label>
                  <input value={selectedClass} readOnly className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
                  <select value={promotionAcademicYear} onChange={(e) => setPromotionAcademicYear(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    {ACADEMIC_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Promote To</label>
                  <select value={promotionTargetClass} onChange={(e) => setPromotionTargetClass(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Select destination class</option>
                    {CLASS_OPTIONS.filter((className) => className !== selectedClass).map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
              </div>

              {promotionError ? <div className="mt-4 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{promotionError}</div> : null}
              {promotionMessage ? <div className="mt-4 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{promotionMessage}</div> : null}

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-500">{promotionStudents.length} students available in {selectedClass}</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSelectAllPromotion} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Select All</button>
                  <button type="button" onClick={handleClearPromotionSelection} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Unselect All</button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200">
                {promoting && !promotionStudents.length ? (
                  <div className="py-8 text-center text-sm text-slate-500">Loading students...</div>
                ) : promotionStudents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No students found for promotion in this class.</div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-3 text-left">Select</th>
                          <th className="px-3 py-3 text-left">Roll No.</th>
                          <th className="px-3 py-3 text-left">Student Name</th>
                          <th className="px-3 py-3 text-left">Gender</th>
                          <th className="px-3 py-3 text-left">Current Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotionStudents.map((student) => (
                          <tr key={student._id} className="border-t border-slate-100">
                            <td className="px-3 py-3 align-top"><input type="checkbox" checked={selectedPromotionIds.includes(student._id)} onChange={() => togglePromotionSelection(student._id)} /></td>
                            <td className="px-3 py-3 align-top">{student.admissionNumber || student.rollNumber || 'N/A'}</td>
                            <td className="px-3 py-3 align-top">{student.fullName || student.name || 'N/A'}</td>
                            <td className="px-3 py-3 align-top capitalize">{student.gender || 'N/A'}</td>
                            <td className="px-3 py-3 align-top">{student.className || selectedClass}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 md:px-7 bg-white">
              <button type="button" onClick={resetPromotionState} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handlePromoteSelected} disabled={promoting} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400">
                {promoting ? 'Promoting...' : 'Promote Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
