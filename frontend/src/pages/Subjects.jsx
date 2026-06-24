import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SubjectForm from '../components/SubjectForm';
import ExportActions from '../components/ExportActions';

const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];

export default function Subjects(){
  const { className } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);

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
            <ExportActions resource="subjects" />
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
    </div>
  );
}
