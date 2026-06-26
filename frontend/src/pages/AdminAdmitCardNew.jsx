import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ResponsiveSelect from '../components/ResponsiveSelect';

const EXAM_OPTIONS = [
  'First Terminal Exam',
  'Second Terminal Exam',
  'Third Terminal Exam',
  'Fourth Terminal Exam',
  'Final Exam'
];

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const getStudentRollNumber = (student) => {
  return student?.rollNumber || student?.admissionNumber || '';
};

const normalizeRoll = (value) => {
  if (value == null || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : String(value);
};

const formatClassLabel = (cls) => {
  if (cls === undefined || cls === null) return '';
  if (typeof cls === 'object') return cls.name || cls.className || '';
  return String(cls).replace(/^[cC]lass\s+/i, '').trim();
};

export default function AdminAdmitCardNew() {
  const [selectedExam, setSelectedExam] = useState('');
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => {
      const aRoll = normalizeRoll(getStudentRollNumber(a));
      const bRoll = normalizeRoll(getStudentRollNumber(b));
      if (typeof aRoll === 'number' && typeof bRoll === 'number') return aRoll - bRoll;
      return String(aRoll).localeCompare(String(bRoll));
    }),
    [students]
  );

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setErrorMessage('');
      return;
    }

    const loadStudents = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await api.get(`/students?className=${encodeURIComponent(selectedClass)}`);
        const fetchedStudents = res.data.students || [];
        setStudents(fetchedStudents);
      } catch (err) {
        console.error('Failed to load students:', err);
        setErrorMessage('Unable to load students. Please try again.');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass]);

  const handleViewAdmitCard = (studentId) => {
    if (!selectedExam) {
      setErrorMessage('Please select an exam before viewing admit cards.');
      return;
    }
    navigate(`view/${studentId}?examName=${encodeURIComponent(selectedExam)}&className=${encodeURIComponent(selectedClass)}`, { relative: 'path' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Examination Admit Card</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Select a class to view students and generate their admit cards.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-3xl bg-rose-50 border border-rose-200 px-6 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Exam</h2>
              <p className="mt-1 text-sm text-slate-600">Choose the exam before generating admit cards.</p>
            </div>
            <div className="w-full sm:min-w-[250px]">
                <ResponsiveSelect
                  value={selectedExam}
                  onChange={(v) => { setSelectedExam(v); setErrorMessage(''); }}
                  options={EXAM_OPTIONS.map(o => ({ value: o, label: o }))}
                  placeholder="Select Exam"
                  className="w-full"
                  maxHeight={500}
                />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Class</h2>
              <p className="mt-1 text-sm text-slate-600">Choose a class to load students for the selected exam.</p>
            </div>
            <div className="w-full sm:min-w-[250px]">
              <ResponsiveSelect
                value={selectedClass}
                onChange={(v) => setSelectedClass(v)}
                options={[{ value: '', label: 'Select Class' }, ...CLASS_OPTIONS.map(c => ({ value: c, label: c }))]}
                placeholder="Select Class"
                maxHeight={600}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Students</h2>
              <p className="mt-1 text-sm text-slate-600">Click "View Admit Card" to open the admit card in a new page.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {students.length} {students.length === 1 ? 'student' : 'students'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Roll No</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Student Name</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Class</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Loading students...</td>
                  </tr>
                ) : !selectedExam ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Select an exam to load students.</td>
                  </tr>
                ) : !selectedClass ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Select a class to view students.</td>
                  </tr>
                ) : sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No students found in this class.</td>
                  </tr>
                ) : (
                  sortedStudents.map((student) => (
                    <tr key={student._id} className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                      <td className="px-4 py-4 text-slate-900 font-medium">{getStudentRollNumber(student) || 'N/A'}</td>
                      <td className="px-4 py-4 text-slate-900">{student.fullName || student.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-slate-600">{formatClassLabel(student.class?.name || student.className || student.classId?.name) || selectedClass || 'N/A'}</td>
                      <td className="px-4 py-4">
                          <button
                          type="button"
                          onClick={() => handleViewAdmitCard(student._id)}
                          disabled={!selectedExam}
                          className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${selectedExam ? 'bg-slate-900 text-white hover:bg-slate-700 active:bg-slate-800' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                        >
                          View Admit Card
                        </button>
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
  );
}