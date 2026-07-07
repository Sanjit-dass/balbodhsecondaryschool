import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SubjectForm from '../components/SubjectForm';
import ExportActions from '../components/ExportActions';

const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
const ACADEMIC_YEAR_OPTIONS = ['2026', '2027', '2028'];

export default function Subjects(){
  const { className } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionTargetClass, setPromotionTargetClass] = useState('');
  const [promotionAcademicYear, setPromotionAcademicYear] = useState('2026');
  const [promotionSubjects, setPromotionSubjects] = useState([]);
  const [selectedPromotionSubjectIds, setSelectedPromotionSubjectIds] = useState([]);
  const [promotingSubjects, setPromotingSubjects] = useState(false);
  const [subjectPromotionMessage, setSubjectPromotionMessage] = useState('');
  const [subjectPromotionError, setSubjectPromotionError] = useState('');

  useEffect(() => { fetch(); }, []);
  
  const fetch = async () => {
    try {
      const res = await api.get('/subjects');
      setList(res.data.subjects || []);
    } catch(err) {
      console.error(err);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
    try {
      await api.delete(`/subjects/${id}`);
      fetch();
    } catch(err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const getSubjectsForClass = (cls) => {
    return list.filter(s => ((s.className || s.class || '').toString()) === cls.toString());
  };

  const resetSubjectPromotionState = () => {
    setShowPromotionModal(false);
    setPromotionTargetClass('');
    setPromotionAcademicYear('2026');
    setPromotionSubjects([]);
    setSelectedPromotionSubjectIds([]);
    setSubjectPromotionMessage('');
    setSubjectPromotionError('');
  };

  const openSubjectPromotionModal = async () => {
    if (!className) return;
    try {
      setPromotingSubjects(true);
      setSubjectPromotionError('');
      setSubjectPromotionMessage('');
      const res = await api.get('/subjects', { params: { class: className } });
      const items = res.data.subjects || [];
      setPromotionSubjects(items);
      setSelectedPromotionSubjectIds(items.map((subject) => subject._id));
      setShowPromotionModal(true);
    } catch (err) {
      console.error(err);
      setSubjectPromotionError('Unable to load subjects for promotion right now.');
    } finally {
      setPromotingSubjects(false);
    }
  };

  const toggleSubjectPromotionSelection = (subjectId) => {
    setSelectedPromotionSubjectIds((prev) => prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]);
  };

  const handleSelectAllPromotionSubjects = () => {
    setSelectedPromotionSubjectIds(promotionSubjects.map((subject) => subject._id));
  };

  const handleClearPromotionSubjectsSelection = () => {
    setSelectedPromotionSubjectIds([]);
  };

  const handlePromoteSubjects = async () => {
    if (!className || !promotionAcademicYear || !promotionTargetClass) {
      setSubjectPromotionError('Please choose a destination class and academic year.');
      return;
    }

    if (promotionTargetClass === className) {
      setSubjectPromotionError('The destination class cannot be the same as the current class.');
      return;
    }

    if (!selectedPromotionSubjectIds.length) {
      setSubjectPromotionError('Select at least one subject to promote.');
      return;
    }

    const confirmed = window.confirm(`Promote ${selectedPromotionSubjectIds.length} selected subjects from ${className} to ${promotionTargetClass}?`);
    if (!confirmed) return;

    try {
      setPromotingSubjects(true);
      setSubjectPromotionError('');
      setSubjectPromotionMessage('');
      const res = await api.post('/subjects/promote', {
        currentClass: className,
        academicYear: promotionAcademicYear,
        targetClass: promotionTargetClass,
        subjectIds: selectedPromotionSubjectIds
      });
      setSubjectPromotionMessage(res.data.message || 'Subjects promoted successfully.');
      await fetch();
      setShowPromotionModal(false);
    } catch (err) {
      console.error(err);
      setSubjectPromotionError(err?.response?.data?.message || 'Unable to promote subjects right now.');
    } finally {
      setPromotingSubjects(false);
    }
  };

  // Detail Page (when className is selected)
  if (className) {
    const classSubjects = getSubjectsForClass(className);

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/admin/subjects')}
                className="text-white hover:text-gray-200 mb-3 flex items-center gap-1 font-medium transition"
              >
                ← Back to classes
              </button>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Class {className}</h1>
              <p className="text-white mt-1 font-medium">
                Subject roster for Class {className}. Add, edit, or remove subjects for this class.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openSubjectPromotionModal}
                className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                🔄 Promote Subjects
              </button>
              <ExportActions resource="subjects" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-4xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                  <h2 className="text-lg font-bold">Add Subject</h2>
                </div>
                <div className="p-4">
                  <SubjectForm
                    existing={editing}
                    defaultClass={className}
                    onSaved={() => {
                      setEditing(null);
                      fetch();
                    }}
                  />
                  {editing && (
                    <button
                      onClick={() => setEditing(null)}
                      className="mt-2 w-full px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                  <h2 className="text-lg font-bold">Subjects</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {classSubjects.length} subject{classSubjects.length !== 1 ? 's' : ''} in this class
                  </p>
                </div>
                <div className="p-6">
                  {classSubjects.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-500 text-lg">No subjects yet.</p>
                      <p className="text-slate-400 text-sm mt-2">Add one using the form on the left.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classSubjects.map(s => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{s.name}</div>
                            <div className="text-sm text-slate-600 mt-1">Code: {s.code || '—'}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditing(s)}
                              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-medium text-sm rounded transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(s._id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPromotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-2 py-3 sm:px-3 sm:py-4">
          <div className="mx-2 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 md:px-7">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Promote Subjects</h3>
                <p className="mt-1 text-sm text-slate-500">Move selected subjects to another class for the chosen academic year.</p>
              </div>
              <button type="button" onClick={resetSubjectPromotionState} className="self-start text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid gap-4 border-b border-slate-200 px-4 py-4 sm:grid-cols-2 sm:px-5 md:px-7">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Current Class</label>
                <input value={className || ''} readOnly className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
                <select value={promotionAcademicYear} onChange={(e) => setPromotionAcademicYear(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {ACADEMIC_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Promote To</label>
                <select value={promotionTargetClass} onChange={(e) => setPromotionTargetClass(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select destination class</option>
                  {CLASS_OPTIONS.filter((cls) => cls !== className).map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5 md:px-7">
              {subjectPromotionError ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{subjectPromotionError}</div> : null}
              {subjectPromotionMessage ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{subjectPromotionMessage}</div> : null}

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">{promotionSubjects.length} subjects available in {className}</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSelectAllPromotionSubjects} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Select All</button>
                  <button type="button" onClick={handleClearPromotionSubjectsSelection} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Unselect All</button>
                </div>
              </div>

              <div className="max-h-[240px] overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200 sm:max-h-[320px]">
                {promotingSubjects && !promotionSubjects.length ? (
                  <div className="py-8 text-center text-sm text-slate-500">Loading subjects...</div>
                ) : promotionSubjects.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No subjects found for promotion in this class.</div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-3">Select</th>
                        <th className="px-3 py-3">Subject Name</th>
                        <th className="px-3 py-3">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotionSubjects.map((subject) => (
                        <tr key={subject._id} className="border-t border-slate-100">
                          <td className="px-3 py-3"><input type="checkbox" checked={selectedPromotionSubjectIds.includes(subject._id)} onChange={() => toggleSubjectPromotionSelection(subject._id)} /></td>
                          <td className="px-3 py-3">{subject.name || 'Unnamed subject'}</td>
                          <td className="px-3 py-3">{subject.code || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-5 md:px-7">
              <button type="button" onClick={resetSubjectPromotionState} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handlePromoteSubjects} disabled={promotingSubjects} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400">
                {promotingSubjects ? 'Promoting...' : 'Move Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  }

  // Class Selection Page (default view)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Subject Management</h1>
            <p className="text-white mt-1 font-medium">Select a class to manage subjects.</p>
          </div>
          <ExportActions resource="subjects" />
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CLASS_OPTIONS.map(cls => {
            const classSubjects = getSubjectsForClass(cls);

            return (
              <div
                key={cls}
                onClick={() => navigate(`/admin/subjects/${cls}`)}
                className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                {/* Class Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 text-center">
                  <h2 className="text-2xl font-bold drop-shadow-lg">Class {cls}</h2>
                </div>

                {/* Stats */}
                <div className="p-4 text-center border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                  <div className="text-4xl font-bold text-blue-600">{classSubjects.length}</div>
                  <p className="text-slate-700 text-sm mt-1 font-medium">
                    {classSubjects.length === 1 ? 'Subject' : 'Subjects'}
                  </p>
                </div>

                {/* CTA */}
                <div className="p-4 text-center bg-blue-50 border-t border-blue-100">
                  <button
                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/subjects/${cls}`);
                    }}
                  >
                    Manage Subjects →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showPromotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-2 py-3 sm:px-3 sm:py-4">
          <div className="mx-2 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 md:px-7">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Promote Subjects</h3>
                <p className="mt-1 text-sm text-slate-500">Move selected subjects to another class for the chosen academic year.</p>
              </div>
              <button type="button" onClick={resetSubjectPromotionState} className="self-start text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid gap-4 border-b border-slate-200 px-4 py-4 sm:grid-cols-2 sm:px-5 md:px-7">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Current Class</label>
                <input value={className || ''} readOnly className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
                <select value={promotionAcademicYear} onChange={(e) => setPromotionAcademicYear(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {ACADEMIC_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Promote To</label>
                <select value={promotionTargetClass} onChange={(e) => setPromotionTargetClass(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select destination class</option>
                  {CLASS_OPTIONS.filter((cls) => cls !== className).map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5 md:px-7">
              {subjectPromotionError ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{subjectPromotionError}</div> : null}
              {subjectPromotionMessage ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{subjectPromotionMessage}</div> : null}

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">{promotionSubjects.length} subjects available in {className}</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSelectAllPromotionSubjects} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Select All</button>
                  <button type="button" onClick={handleClearPromotionSubjectsSelection} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Unselect All</button>
                </div>
              </div>

              <div className="max-h-[240px] overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200 sm:max-h-[320px]">
                {promotingSubjects && !promotionSubjects.length ? (
                  <div className="py-8 text-center text-sm text-slate-500">Loading subjects...</div>
                ) : promotionSubjects.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No subjects found for promotion in this class.</div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-3">Select</th>
                        <th className="px-3 py-3">Subject Name</th>
                        <th className="px-3 py-3">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotionSubjects.map((subject) => (
                        <tr key={subject._id} className="border-t border-slate-100">
                          <td className="px-3 py-3"><input type="checkbox" checked={selectedPromotionSubjectIds.includes(subject._id)} onChange={() => toggleSubjectPromotionSelection(subject._id)} /></td>
                          <td className="px-3 py-3">{subject.name || 'Unnamed subject'}</td>
                          <td className="px-3 py-3">{subject.code || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-5 md:px-7">
              <button type="button" onClick={resetSubjectPromotionState} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handlePromoteSubjects} disabled={promotingSubjects} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400">
                {promotingSubjects ? 'Promoting...' : 'Move Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
