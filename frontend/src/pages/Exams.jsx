import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { calculateGrade, getGradeColor } from '../utils/gradingSystem';
import ExamForm from '../components/ExamForm';
import MarksEntry from '../components/MarksEntry';

export default function Exams() {
  const { user } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [tab, setTab] = useState('list'); // list, create, marks, results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsError, setResultsError] = useState('');
  const [message, setMessage] = useState('');
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'examcontroller' || user?.role === 'superadmin';

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (selectedExam && tab === 'marks') {
      loadExamProgress(selectedExam._id);
    } else {
      setSubjectProgress([]);
    }
  }, [selectedExam, tab]);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams');
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  const generateResults = async (examId) => {
    try {
      const progressRes = await api.get(`/exams/${examId}/progress`);
      const incompleteSubjects = (progressRes.data.subjectProgress || []).filter(item => !item.completed);
      if (incompleteSubjects.length) {
        const pendingNames = incompleteSubjects.map(item => item.subject?.name || 'Unnamed Subject').join(', ');
        const messageText = `Results cannot be generated until all subjects are fully marked. Pending: ${pendingNames}`;
        setResultsError(messageText);
        alert(messageText);
        return;
      }

      const res = await api.post(`/exams/${examId}/generate-results`, {});
      setMessage(res.data.message || 'Results generated successfully');
      setResultsError('');
      setTimeout(() => setMessage(''), 3000);
      fetch();
      await loadResults(examId);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Error generating results';
      setResultsError(errorMessage);
      alert('Error generating results: ' + errorMessage);
    }
  };

  const publishResults = async (examId) => {
    try {
      const res = await api.post(`/exams/${examId}/publish-results`, {});
      setMessage('Results published successfully');
      setTimeout(() => setMessage(''), 3000);
      fetch();
    } catch (err) {
      console.error(err);
      alert('Error publishing results');
    }
  };

  const printRef = useRef(null);

  const loadExamProgress = async (examId) => {
    if (!examId) {
      setSubjectProgress([]);
      return;
    }

    try {
      setProgressLoading(true);
      const res = await api.get(`/exams/${examId}/progress`);
      setSubjectProgress(res.data.subjectProgress || []);
    } catch (err) {
      console.error(err);
      setSubjectProgress([]);
    } finally {
      setProgressLoading(false);
    }
  };

  const loadResults = async (examId) => {
    try {
      setResultsError('');
      const res = await api.get(`/exams/${examId}/results`);
      const resultList = Array.isArray(res.data.results) ? res.data.results : [];
      setResults(resultList);
      if (!resultList.length) {
        setResultsError('No results are available yet for this exam. Generate results first.');
      }
      setTab('results');
    } catch (err) {
      console.error(err);
      setResults([]);
      setResultsError(err.response?.data?.message || 'Unable to load results right now.');
      setTab('results');
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };



  if (!isAdmin) {
    return <div className="p-6 text-center text-slate-600">Access denied. Admin or Exam Controller only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Examination Management</h1>
          <p className="text-sm text-slate-600">Create exams, enter marks, and manage results</p>
        </div>
        {tab === 'list' && (
          <button
            onClick={() => { setTab('create'); setEditing(null); }}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            New Exam
          </button>
        )}
      </div>

      {message && <div className="p-3 bg-green-100 text-green-700 rounded">{message}</div>}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
        Exam workflow: Create exam → Select exam from the list → Enter student marks → Generate results → Publish results.
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 ${tab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600'}`}
        >
          Exams
        </button>
        {selectedExam && (
          <>
            <button
              onClick={() => setTab('marks')}
              className={`px-4 py-2 ${tab === 'marks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600'}`}
            >
              Enter Marks
            </button>
            <button
              onClick={() => loadResults(selectedExam._id)}
              className={`px-4 py-2 ${tab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600'}`}
            >
              View Results
            </button>
          </>
        )}
      </div>

      {tab === 'list' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-500">Loading...</div>
          ) : exams.length === 0 ? (
            <div className="text-center text-slate-500">No exams found. Create one to get started.</div>
          ) : (
            <div className="grid gap-4">
              {exams.map(exam => (
                <div key={exam._id} className="bg-white p-4 shadow rounded-lg border border-slate-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{exam.title}</h3>
                      <p className="text-sm text-slate-600">Type: {exam.type}</p>
                      <p className="text-sm text-slate-600">Class: {exam.class?.name}</p>
                      <p className="text-sm text-slate-600">Year: {exam.academicYear}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {exam.resultsPublished ? '✓ Results Published' : 'Pending Results'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setSelectedExam(exam); setTab('marks'); }}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Enter Marks
                      </button>
                      <button
                        onClick={() => generateResults(exam._id)}
                        className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        Generate Results
                      </button>
                      <button
                        onClick={() => publishResults(exam._id)}
                        disabled={exam.resultsPublished}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {exam.resultsPublished ? 'Published' : 'Publish'}
                      </button>
                      <button
                        onClick={() => { setSelectedExam(exam); loadResults(exam._id); }}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => { setEditing(exam); setTab('create'); }}
                        className="px-3 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(exam._id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div>
          <ExamForm
            existing={editing}
            onSaved={() => { fetch(); setTab('list'); setEditing(null); }}
          />
        </div>
      )}

      {tab === 'marks' && selectedExam && (
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Enter Marks for {selectedExam.title}</h2>
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-700">Marks Completion Status</div>
            {progressLoading ? (
              <div className="text-sm text-slate-500">Loading subject status...</div>
            ) : subjectProgress.length === 0 ? (
              <div className="text-sm text-slate-500">No subject progress is available yet.</div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {subjectProgress.map((item) => (
                  <div key={item.subject?._id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">{item.subject?.name || 'Subject'}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.submittedBy ? `Submitted by ${item.submittedBy}` : 'No teacher submission yet'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.marksCount}/{item.studentCount} students marked
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <MarksEntry examId={selectedExam._id} exam={selectedExam} />
        </div>
      )}

      {tab === 'results' && (
        <div className="bg-white p-6 shadow rounded-lg">
          <style>{`@media print { body * { visibility: hidden !important; } .print-area, .print-area * { visibility: visible !important; } .print-area { position: absolute; top: 0; left: 0; width: 100%; } .print-hidden { display: none !important; } }`}</style>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 print-hidden">
            <div>
              <h2 className="text-xl font-semibold">Results - {selectedExam?.title}</h2>
              <div className="text-sm text-slate-600">
                Class: {selectedExam?.class?.name} • Year: {selectedExam?.academicYear}
              </div>
            </div>
          </div>

          {resultsError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              {resultsError}
            </div>
          )}

          {!results.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              <p className="mb-3 font-medium">No result sheet is available yet for this exam.</p>
              <button
                type="button"
                onClick={() => generateResults(selectedExam._id)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Generate Results
              </button>
            </div>
          ) : (
            <div ref={printRef} className="space-y-6 print-area print:bg-white print:text-slate-900">
            <div className="text-center pb-4">
              {/* School Logo */}
              <div className="mb-3">
                <img src="/logo.png" alt="School Logo" className="h-12 mx-auto" onError={(e) => e.target.style.display = 'none'} />
              </div>
              <div className="text-2xl font-bold text-red-600">BAL BODH SECONDARY SCHOOL</div>
              <p className="mt-1 text-sm font-semibold text-[#2563EB]">Kanchanrup Municipality-08, Kanchanpur</p>
              <p className="text-sm font-semibold text-[#64748B]">ESTD. 2055</p>
            </div>

            <div className="space-y-2 text-sm text-slate-700 text-center border-b border-slate-300 pb-4">
              <div>
                <span className="font-semibold">Exam Name: </span>
                <span>{selectedExam?.title}</span>
              </div>
              <div>
                <span className="font-semibold">Class: </span>
                <span>{selectedExam?.class?.name}</span>
              </div>
              <div>
                <span className="font-semibold">Academic Year: </span>
                <span>{selectedExam?.academicYear}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="border-collapse text-sm min-w-max">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Position</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Student Name</th>
                    {selectedExam?.class?.subjects?.length > 0 ? (
                      selectedExam.class.subjects.map((sub, idx) => (
                        <th key={idx} colSpan={2} className="border border-slate-300 px-3 py-2 text-center font-semibold">
                          {typeof sub === 'object' ? sub.name : sub}
                        </th>
                      ))
                    ) : (
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Total Marks</th>
                    )}
                    <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Total</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Grade</th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-semibold">GPA</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Status</th>
                  </tr>
                  {selectedExam?.class?.subjects?.length > 0 && (
                    <tr className="bg-slate-50">
                      <th className="border border-slate-300 px-3 py-2"></th>
                      <th className="border border-slate-300 px-3 py-2"></th>
                      {selectedExam.class.subjects.map((sub, idx) => (
                        <React.Fragment key={idx}>
                          <th className="border border-slate-300 px-2 py-2 text-center text-xs font-semibold">T</th>
                          <th className="border border-slate-300 px-2 py-2 text-center text-xs font-semibold">P</th>
                        </React.Fragment>
                      ))}
                      <th className="border border-slate-300 px-3 py-2"></th>
                      <th className="border border-slate-300 px-3 py-2"></th>
                      <th className="border border-slate-300 px-3 py-2"></th>
                      <th className="border border-slate-300 px-3 py-2"></th>
                      <th className="border border-slate-300 px-3 py-2"></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {results.map((result, idx) => {
                    const percentage = result.totalMaxMarks > 0 ? (result.totalMarksObtained / result.totalMaxMarks) * 100 : 0;
                    const gradeInfo = calculateGrade(percentage);
                    return (
                      <tr key={idx} className="border-b border-slate-300">
                        <td className="border border-slate-300 px-3 py-2 text-sm font-semibold">{result.classPosition || idx + 1}</td>
                        <td className="border border-slate-300 px-3 py-2 text-sm">{result.student?.user?.name || result.student?.fullName || result.student?.name || 'N/A'}</td>
                        {selectedExam?.class?.subjects?.length > 0 ? (
                          selectedExam.class.subjects.map((sub, idx) => {
                            const subjectMark = result.subjectMarks?.find(sm => {
                              const subId = typeof sub === 'object' ? sub._id : sub;
                              return sm.subject?.toString() === subId?.toString();
                            });
                            return (
                              <React.Fragment key={idx}>
                                <td className="border border-slate-300 px-2 py-2 text-center text-sm">
                                  {subjectMark?.theoryMarks ?? '-'}
                                </td>
                                <td className="border border-slate-300 px-2 py-2 text-center text-sm">
                                  {subjectMark?.practicalMarks ?? '-'}
                                </td>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <td className="border border-slate-300 px-3 py-2 text-right text-sm">{result.totalMarksObtained}/{result.totalMaxMarks}</td>
                        )}
                        <td className="border border-slate-300 px-3 py-2 text-right text-sm font-semibold">{result.totalMarksObtained}</td>
                        <td className={`border border-slate-300 px-3 py-2 text-sm font-semibold ${getGradeColor(gradeInfo.grade)}`}>{gradeInfo.grade}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-sm font-semibold">{gradeInfo.gpa.toFixed(1)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-sm font-semibold" style={{color: result.passStatus === 'Pass' ? 'green' : 'red'}}>
                          {result.passStatus}
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
      )}
    </div>
  );
}
