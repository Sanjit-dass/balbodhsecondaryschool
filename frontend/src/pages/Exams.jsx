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
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'examcontroller' || user?.role === 'superadmin';

  useEffect(() => {
    fetch();
  }, []);

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
      const res = await api.post(`/exams/${examId}/generate-results`, {});
      setMessage(res.data.message || 'Results generated successfully');
      setTimeout(() => setMessage(''), 3000);
      fetch();
    } catch (err) {
      console.error(err);
      alert('Error generating results: ' + err.message);
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

  const loadResults = async (examId) => {
    try {
      const res = await api.get(`/exams/${examId}/results`);
      setResults(res.data.results || []);
      setTab('results');
    } catch (err) {
      console.error(err);
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
          <MarksEntry examId={selectedExam._id} exam={selectedExam} />
        </div>
      )}

      {tab === 'results' && results.length > 0 && (
        <div className="bg-white p-6 shadow rounded-lg">
          <style>{`@media print { body * { visibility: hidden !important; } .print-area, .print-area * { visibility: visible !important; } .print-area { position: absolute; top: 0; left: 0; width: 100%; } .print-hidden { display: none !important; } }`}</style>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 print-hidden">
            <div>
              <h2 className="text-xl font-semibold">Results - {selectedExam?.title}</h2>
              <div className="text-sm text-slate-600">
                Class: {selectedExam?.class?.name} • Year: {selectedExam?.academicYear}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
            </div>
          </div>

          <div ref={printRef} className="space-y-6 print-area print:bg-white print:text-slate-900">
            <div className="text-center pb-4">
              {/* School Logo */}
              <div className="mb-3">
                <img src="/logo.png" alt="School Logo" className="h-12 mx-auto" onError={(e) => e.target.style.display = 'none'} />
              </div>
              <div className="text-2xl font-bold text-red-600">BAL BODH SECONDARY SCHOOL</div>
              <div className="text-sm text-blue-600 mt-1">Kanchanpur-08, Saptari</div>
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
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Position</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Student Name</th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Total Marks</th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Percentage</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Grade</th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-semibold">GPA</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => {
                    const percentage = result.totalMaxMarks > 0 ? (result.totalMarksObtained / result.totalMaxMarks) * 100 : 0;
                    const gradeInfo = calculateGrade(percentage);
                    return (
                      <tr key={idx} className="border-b border-slate-300">
                        <td className="border border-slate-300 px-3 py-2 text-sm font-semibold">{result.classPosition || idx + 1}</td>
                        <td className="border border-slate-300 px-3 py-2 text-sm">{result.student?.user?.name || result.student?.fullName || result.student?.name || 'N/A'}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-sm">{result.totalMarksObtained}/{result.totalMaxMarks}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-sm">{percentage.toFixed(2)}%</td>
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
        </div>
      )}
    </div>
  );
}
