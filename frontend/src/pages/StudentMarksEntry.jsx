import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MarksEntry from '../components/MarksEntry';

const EXAM_TYPES = [
  'First Terminal Exam',
  'Second Terminal Exam',
  'Third Terminal Exam',
  'Final Exam'
];

const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];

export default function StudentMarksEntry() {
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [exam, setExam] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // clear exam when selections change
    setExam(null);
  }, [examType, selectedClass, subject]);

  useEffect(() => {
    if (!selectedClass) return setSubjects([]);
    let mounted = true;
    api.get('/subjects', { params: { class: selectedClass } }).then(res => {
      if (!mounted) return;
      setSubjects(res.data.subjects || res.data || []);
    }).catch(err => {
      console.error(err);
      setSubjects([]);
    });
    return () => { mounted = false; };
  }, [selectedClass]);

  const findOrCreateExam = async () => {
    if (!examType || !selectedClass) return;
    setLoadingExam(true);
    try {
      const res = await api.get('/exams');
      const exams = res.data.exams || [];
      const found = exams.find(e => e.type === examType && String((e.class && e.class._id) || e.class) === String(selectedClass));
      if (found) {
        setExam(found);
        return found;
      }
      // create exam automatically
      const createRes = await api.post('/exams', {
        type: examType,
        class: selectedClass,
        academicYear: new Date().getFullYear().toString()
      });
      setExam(createRes.data || createRes);
      setMessage('Exam created');
      setTimeout(() => setMessage(''), 3000);
      return createRes.data || createRes;
    } catch (err) {
      console.error(err);
      alert('Error finding/creating exam: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoadingExam(false);
    }
  };

  const handleProceed = async () => {
    if (!examType || !selectedClass || !subject) {
      alert('Please select exam type, class, and enter subject');
      return;
    }

    const ex = await findOrCreateExam();
    if (!ex) return;
    // ensure subject is set in exam? MarksEntry will resolve subject when saving
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Student Marks Entry</h1>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam Type</label>
          <select value={examType} onChange={e => setExamType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
            <option value="">Select Class</option>
            {CLASS_OPTIONS.map(className => <option key={className} value={className}>{className}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <input list="subject-options" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Type subject name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          <datalist id="subject-options">
            {subjects.map(s => <option key={s._id || s.name} value={s.name || s} />)}
          </datalist>
        </div>

        <div className="flex items-end">
          <button onClick={handleProceed} disabled={loadingExam} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-60">Proceed</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}

      {exam ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Exam: {exam.title || exam.type}</h2>
          <MarksEntry examId={exam._id || exam.id} exam={exam} initialSubject={subject} />
        </div>
      ) : (
        <div className="text-sm text-slate-500">Select exam type, class, and enter a subject, then click Proceed to load students and enter marks.</div>
      )}
    </div>
  );
}
