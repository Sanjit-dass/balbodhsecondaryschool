import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StudentForm from '../components/StudentForm';
import ExportActions from '../components/ExportActions';

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

export default function Students() {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

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

  return (
    <div className="space-y-4 md:space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Student Management</h1>
          <p className="text-slate-200 max-w-2xl mt-1 md:mt-2 text-sm md:text-base">
            Select a class to manage students, add new records, or update existing profiles. Class selection is the first step in your admin workflow.
          </p>
        </div>
        <ExportActions resource="students" />
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
                        <img src={student.profilePhotoObj?.fileUrl || student.profilePhoto || student.photoUrl} alt="avatar" className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm md:text-base truncate">{student.fullName}</div>
                          <div className="text-xs md:text-sm text-slate-500">{student.section ? `Section ${student.section}` : 'No section'}</div>
                          <div className="text-xs md:text-sm text-slate-700 mt-1 md:mt-2">Roll: {student.admissionNumber || 'N/A'}</div>
                          <div className="text-xs md:text-sm text-slate-700">Gender: {student.gender || 'N/A'}</div>
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
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Parent Info</th>
                    <th className="pb-2 md:pb-3 px-3 md:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-8 md:py-12 text-center text-slate-500 text-xs md:text-sm">Loading students...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 md:py-12 text-center text-slate-500 text-xs md:text-sm">No students found in this class.</td>
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
    </div>
  );
}
