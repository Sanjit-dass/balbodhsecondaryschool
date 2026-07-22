import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import Marksheet from '../components/Marksheet';
import ResponsiveSelect from '../components/ResponsiveSelect';

export default function StudentResults() {
  const { user } = useContext(AuthContext);

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const isStudent = user?.role === 'student';

  // ---------------- PROFILE + EXAMS ----------------
  useEffect(() => {
    if (!isStudent) return;
    if (!profile) fetchStudentProfile();
  }, [isStudent, profile, exams.length]);

  // Ensure exams load after profile is available so we can filter by student's class
  useEffect(() => {
    if (!isStudent) return;
    if (profile && exams.length === 0) loadExams();
  }, [isStudent, profile, exams.length]);

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get('/students/me');
      const student = res.data.student;

      setProfile(student);

      const nameValue =
        student?.fullName ||
        student?.name ||
        `${student?.firstName || ''} ${student?.lastName || ''}`.trim();

      setStudentName(nameValue);
      setClassName(student?.class?.name || student?.className || '');
      setRollNumber(student?.admissionNumber || student?.rollNumber || '');
    } catch (err) {
      console.error(err);
    }
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams');

      let publishedExams = res.data.exams?.filter(e => e.resultsPublished) || [];

      // If we have a student profile with a class, restrict exams to the student's class
      if (profile && (profile?.class?.name || profile?.className)) {
        const profileClass = profile?.class?.name || profile?.className || '';
        const filteredByClass = publishedExams.filter(e => {
          const examClassName = e?.class?.name || e?.className || '';
          return classMatches(profileClass, examClassName);
        });
        // If class filter returns exams, use filtered list; otherwise show all published exams
        publishedExams = filteredByClass.length > 0 ? filteredByClass : publishedExams;
      }

      setExams(publishedExams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- NORMALIZE ----------------
  const normalize = (v) =>
    String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

  const normalizeClass = (v) => {
    const text = normalize(v);
    const match = text.match(/(\d+)/);
    return match ? match[1] : text;
  };

  // 🚀 FIXED: relaxed matching (prevents your error)
  const classMatches = (a, b) => {
    if (!a || !b) return false;

    const x = normalizeClass(a);
    const y = normalizeClass(b);

    return x === y || x.includes(y) || y.includes(x);
  };
  
  const loadResult = async () => {
    setSearchError('');
    setHasSearched(true);

    if (!selectedExam) {
      setSearchError('Please select an exam');
      return;
    }

    if (!studentName.trim()) {
      setSearchError('Please enter student name');
      return;
    }

    if (!rollNumber.trim()) {
      setSearchError('Please enter roll number');
      return;
    }

    setSearchLoading(true);
    setResult(null);

    try {
      const res = await api.get(`/exams/${selectedExam?._id || selectedExam}/results`);
      const allResults = res.data.results || [];

      const searchName = studentName.toLowerCase().trim();
      const searchRoll = rollNumber.toLowerCase().trim();

      const studentResult = allResults.find(r => {
        const resultName = (r.student?.user?.name || r.student?.fullName || '').toLowerCase().trim();
        const resultRoll = (r.student?.rollNumber || r.student?.admissionNumber || '').toLowerCase().trim();
        return resultName.includes(searchName) && resultRoll.includes(searchRoll);
      });

      if (!studentResult) {
        setSearchError('No result found for the provided details in this exam.');
        setSearchLoading(false);
        return;
      }

      const ecaResponse = await api.get('/students/me/results');
      const ecaMarks = ecaResponse?.data?.ecaMarks || [];
      setResult({ ...studentResult, ecaMarks });
      setClassName(studentResult.student?.class?.name || studentResult.student?.className || studentResult.class?.name || '');
    } catch (err) {
      console.error('Error fetching result:', err);
      setSearchError('Error fetching result. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadResult();
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    alert('Use Print button and select "Save as PDF" option in the print dialog to download as PDF.');
    window.print();
  };

  if (!isStudent) {
    return (
      <div className="p-6 text-center">
        Access denied. Students only.
      </div>
    );
  }

  // ---------------- UI ----------------
  const truncate = (s, n = 50) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">My Results</h1>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading exams...</p>
      ) : profile ? (
        <>
          {exams.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-slate-700 font-semibold mb-2">No results published yet.</p>
              <p className="text-sm text-slate-600">
                Your Class: <strong>{className || 'Not set'}</strong> | Your Roll Number: <strong>{rollNumber || 'Not set'}</strong>
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Results will appear here once the school publishes exam results for your class.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSearchSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Exam *</label>
                {/* Desktop select */}
                <select
                  value={selectedExam?._id || ''}
                  onChange={(e) =>
                    setSelectedExam(exams.find(x => x._id === e.target.value))
                  }
                  className="hidden sm:block w-full max-w-full truncate whitespace-nowrap border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select an Exam --</option>
                  {exams.map(e => {
                    const label = e.title || e.type || '';
                    return (
                      <option key={e._id} value={e._id} title={label}>
                        {truncate(label, 50)}
                      </option>
                    );
                  })}
                </select>

                {/* Mobile picker */}
                <div className="sm:hidden">
                  <button
                    type="button"
                    onClick={() => setShowExamPicker(true)}
                    className="w-full text-left p-2 border border-slate-300 rounded bg-white text-slate-900 picker-trigger"
                  >
                    {selectedExam ? (selectedExam.title || selectedExam.type) : '-- Select an Exam --'}
                  </button>

                    {showExamPicker && (
                      <div className="fixed left-3 right-3 z-50 mt-2 overflow-hidden rounded-3xl border border-transparent bg-blue-600 text-white shadow-2xl">
                        <div className="w-full px-4 mx-auto">
                          <div className="px-4 py-4 border-b border-blue-700 bg-blue-600 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">Select Exam</p>
                              <p className="text-xs text-blue-100">Tap an exam to choose</p>
                            </div>
                            <button onClick={() => setShowExamPicker(false)} className="text-sm text-white">Close</button>
                          </div>

                          <div className="max-h-[60vh] overflow-y-auto">
                            {exams.length === 0 ? (
                              <div className="p-4 text-sm text-blue-100">No exams available.</div>
                            ) : (
                              exams.map(e => {
                                const fullLabel = `${e.type} - ${e.class?.name || 'N/A'} (${e.academicYear})`;
                                return (
                                  <button
                                    key={e._id}
                                    type="button"
                                    onClick={() => { setSelectedExam(e); setShowExamPicker(false); }}
                                    className="w-full text-left px-4 py-3 border-b border-blue-700 bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <div className="text-sm font-medium truncate">{fullLabel}</div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number *</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                    placeholder="Enter roll number"
                    className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Class (Auto-detected)</label>
                <input
                  type="text"
                  value={className}
                  readOnly
                  disabled
                  placeholder="Class will be shown after search"
                  className="w-full border border-slate-300 p-2 rounded bg-slate-100 text-slate-600"
                />
              </div>

              <button 
                type="submit"
                disabled={searchLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold p-2 rounded"
              >
                {searchLoading ? 'Searching...' : 'Search Result'}
              </button>
            </form>
          )}
        </>
      ) : (
        <div className="bg-slate-50 border border-slate-300 rounded p-4 text-center">
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      )}

      {searchError && (
        <p className="text-red-600">{searchError}</p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex gap-2 no-print print:hidden">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            >
              Download PDF
            </button>
          </div>
          <Marksheet result={result} exam={selectedExam} />
        </div>
      )}

      {selectedExam && !result && hasSearched && (
        <p>No result found.</p>
      )}

    </div>
  );
}