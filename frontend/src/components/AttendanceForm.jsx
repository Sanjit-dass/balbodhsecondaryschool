import React, { useState, useEffect, useMemo, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];

const initialFormState = {
  date: new Date().toISOString().slice(0,10),
  class: '',
  subject: '',
  topic: '',
  notes: '',
  records: []
};

export default function AttendanceForm({ existing, onSaved }) {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'teacher';
  const [form, setForm] = useState(initialFormState);
  const [subjects, setSubjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [attendanceId, setAttendanceId] = useState(null);
  const [existingMatch, setExistingMatch] = useState(false);
  const [search, setSearch] = useState('');
  const [teacherSubjectError, setTeacherSubjectError] = useState('');

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    // fetch subjects whenever class changes
    if (!form.class || existing) return;
    const timer = setTimeout(() => {
      fetchSubjectsForClass(form.class);
    }, 100);
    return () => clearTimeout(timer);
  }, [form.class, existing]);

  useEffect(() => {
    if (!existing) return;
    const normalizeClass = (v) => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      return v.name || v.class || v.className || v.label || v._id || '';
    };
    setAttendanceId(existing._id || null);
    setExistingMatch(true);
    setForm(prev => ({
      ...prev,
      date: existing.date ? new Date(existing.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      class: normalizeClass(existing.class) || '',
      subject: existing.subject || prev.subject || '',
      topic: existing.topic || prev.topic || '',
      notes: existing.notes || prev.notes || '',
      records: (existing.records || []).map(r => ({
        person: r.person,
        rollNumber: r.rollNumber,
        name: r.name,
        status: r.status === 'present' || r.status === 'absent' ? r.status : '',
        note: r.note || ''
      }))
    }));
    setLoaded(true);
  }, [existing]);

  useEffect(() => {
    if (!form.class || !form.date || !form.subject || existing) return;
    const timer = setTimeout(() => {
      findExistingAttendance();
    }, 300);
    return () => clearTimeout(timer);
  }, [form.class, form.date, form.subject, existing]);

  const fetchMeta = async () => {
    try {
      // initial load - fetch all subjects
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || res.data || []);
    } catch (err) {
      // no default subjects — admin/teacher will enter subjects for each class
      setSubjects([]);
    }
  };

  const fetchSubjectsForClass = async (className) => {
    setTeacherSubjectError('');
    try {
      const res = await api.get('/subjects', { params: { class: className } });
      const list = res.data.subjects || res.data || [];
      setSubjects(list);
      if (!form.subject && list.length > 0) {
        const firstSubject = list[0].name || list[0];
        setForm(prev => ({ ...prev, subject: firstSubject }));
      }
    } catch (err) {
      console.error('Failed to load subjects for class', className, err);
      setSubjects([]);
      setForm(prev => ({ ...prev, subject: '' }));
      setTeacherSubjectError('Unable to load subjects for this class.');
    }
  };

  const findExistingAttendance = async () => {
    try {
      if (!form.subject) return;
      const params = { class: form.class, date: form.date, subject: form.subject };
      const res = await api.get('/attendance', { params });
      const existingAttendance = (res.data.attendance || [])[0];
      if (existingAttendance) {
        setAttendanceId(existingAttendance._id);
        setExistingMatch(true);
        setForm(prev => ({
          ...prev,
          date: existingAttendance.date ? new Date(existingAttendance.date).toISOString().slice(0,10) : prev.date,
          class: existingAttendance.class || prev.class,
          subject: existingAttendance.subject || prev.subject || '',
          topic: existingAttendance.topic || prev.topic || '',
          notes: existingAttendance.notes || prev.notes || '',
          records: (existingAttendance.records || []).map(r => ({
            person: r.person,
            rollNumber: r.rollNumber,
            name: r.name,
            status: r.status === 'present' || r.status === 'absent' ? r.status : '',
            note: r.note || ''
          }))
        }));
        setLoaded(true);
        if (!existingAttendance.records || !existingAttendance.records.length) {
          await loadStudents(existingAttendance.class || form.class);
        }
      } else {
        setExistingMatch(false);
        if (!form.records.length) {
          await loadStudents();
        }
      }
    } catch (err) {
      console.error(err);
      if (!form.records.length) {
        await loadStudents();
      }
    }
  };

  const loadStudents = async (classNameOverride) => {
    const rawClass = classNameOverride || form.class;
    const classToUse = (typeof rawClass === 'string') ? rawClass : (rawClass && (rawClass.name || rawClass.class || rawClass.className || rawClass.label || rawClass._id || ''));
    if (!classToUse) return alert('Please select class to load students.');
    try {
      const params = { className: classToUse, limit: 1000 };
      const res = await api.get('/students', { params });
      const list = (res.data.students || res.data || []).map(s => ({
        person: s._id,
        rollNumber: s.admissionNumber || '',
        name: s.fullName || '',
        gender: s.gender || '',
        dob: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '',
        status: '',
        note: ''
      }));
      if (!list.length) {
        alert(`No students found for class ${classToUse}. Please verify the class name or student assignments.`);
      }
      list.sort((a, b) => ('' + a.rollNumber).localeCompare('' + b.rollNumber, undefined, { numeric: true }));
      setForm(f => ({ ...f, records: list }));
      setLoaded(true);
    } catch (err) {
      console.error(err);
      alert('Unable to load students for this class.');
    }
  };

  const handleStatusChange = (studentId, status) => {
    const records = form.records.map(r => r.person === studentId ? { ...r, status } : r);
    setForm({ ...form, records });
  };

  const attendanceTotals = useMemo(() => {
    const total = (form.records || []).length;
    const present = (form.records || []).filter(r => r.status === 'present').length;
    const absent = (form.records || []).filter(r => r.status === 'absent').length;
    const percent = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percent };
  }, [form.records]);

  const isLocked = useMemo(() => {
    if (!attendanceId || !existingMatch) return false;
    if (user?.role === 'teacher') {
      return new Date(form.date).toDateString() !== new Date().toDateString();
    }
    return false;
  }, [attendanceId, existingMatch, form.date, user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.class) return alert('Please select a class.');
    if (!form.subject) return alert('Please select a subject.');
    if (!form.records.length) return alert('Please load students before submitting attendance.');
    const incomplete = form.records.some(r => r.status !== 'present' && r.status !== 'absent');
    if (incomplete) return alert('Please mark Present or Absent for every student.');

    const payload = {
      date: form.date,
      class: form.class,
      subject: form.subject,
      topic: form.topic,
      notes: form.notes,
      records: form.records.map(r => ({
        person: r.person,
        rollNumber: r.rollNumber,
        name: r.name,
        status: r.status,
        note: r.note
      }))
    };

    try {
      if (attendanceId) {
        await api.put(`/attendance/${attendanceId}`, payload);
      } else {
        await api.post('/attendance', payload);
      }
      onSaved && onSaved();
      alert('Attendance saved successfully.');
      setForm(initialFormState);
      setAttendanceId(null);
      setExistingMatch(false);
      setLoaded(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Unable to save attendance.');
    }
  };

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return form.records;
    return form.records.filter(r => (r.name || '').toLowerCase().includes(q) || (r.rollNumber || '').toLowerCase().includes(q));
  }, [form.records, search]);

  return (
    <form onSubmit={submit} className="bg-white p-4 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl shadow-xl border border-slate-200">
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-5">
        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-700">Attendance Date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-2xl md:rounded-3xl border border-slate-300 px-3 md:px-4 py-3 md:py-4 min-h-[48px] md:min-h-[54px] text-sm md:text-base"
            value={form.date}
            disabled={isLocked}
            onChange={e => { setForm({ ...form, date: e.target.value, records: [] }); setAttendanceId(null); setExistingMatch(false); }}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-slate-700">Class</label>
          <select
            className="mt-1 w-full rounded-2xl md:rounded-3xl border border-slate-300 px-3 md:px-4 py-3 text-sm md:text-base"
            value={form.class}
            disabled={isLocked}
            onChange={e => { setForm({ ...form, class: e.target.value, records: [] }); setAttendanceId(null); setExistingMatch(false); }}
          >
            <option value="">Select class</option>
            {CLASS_OPTIONS.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-slate-700">Subject</label>
          <input
            list="subject-options"
            className="mt-1 w-full rounded-2xl md:rounded-3xl border border-slate-300 bg-slate-50 px-3 md:px-4 py-3 md:py-4 min-h-[48px] md:min-h-[54px] shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm md:text-base"
            placeholder="Enter subject"
            value={form.subject}
            disabled={isLocked}
            onChange={e => setForm({ ...form, subject: e.target.value })}
          />
          <datalist id="subject-options">
            {subjects.map(subject => (
              <option key={subject._id || subject.name || subject} value={subject.name || subject} />
            ))}
          </datalist>
          {teacherSubjectError && <p className="mt-2 text-xs text-rose-600">{teacherSubjectError}</p>}
        </div>
        <div className="hidden sm:block sm:col-span-3" />
      </div>

      <div className="mt-4 md:mt-5 flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button
            type="button"
            className="rounded-2xl md:rounded-3xl bg-indigo-600 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition"
            disabled={!form.class || isLocked}
            onClick={loadStudents}
          >
            Load Students
          </button>
          <button
            type="button"
            className="rounded-2xl md:rounded-3xl bg-slate-200 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-300 transition"
            onClick={() => {
              setForm(initialFormState);
              setAttendanceId(null);
              setExistingMatch(false);
              setLoaded(false);
              setTeacherSubjectError('');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 md:mt-6 overflow-x-auto rounded-2xl md:rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-3 md:p-4">
          <input
            type="search"
            className="w-full rounded-2xl md:rounded-3xl border border-slate-300 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm"
            placeholder="Search students by name or roll number"
            value={search}
            disabled={!loaded}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="min-w-full text-xs md:text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 md:px-4 py-2 md:py-3 text-left">#</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-left">Roll No</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-left">Student Name</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-left">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 md:px-4 py-8 md:py-10 text-center text-slate-500 text-xs md:text-sm">No students loaded yet. Use the class selector and Load Students button.</td>
              </tr>
            ) : filteredStudents.map((student, index) => (
              <tr key={student.person || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 md:px-4 py-2 md:py-3 border-t border-slate-200">{index + 1}</td>
                <td className="px-3 md:px-4 py-2 md:py-3 border-t border-slate-200">{student.rollNumber}</td>
                <td className="px-3 md:px-4 py-2 md:py-3 border-t border-slate-200">{student.name}</td>
                <td className="px-3 md:px-4 py-2 md:py-3 border-t border-slate-200">
                  <div className="flex flex-wrap gap-2 md:gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`attendance-${student.person}`}
                        disabled={!loaded || isLocked}
                        checked={student.status === 'present'}
                        onChange={() => handleStatusChange(student.person, 'present')}
                        className="text-emerald-600 w-4 h-4 md:w-5 md:h-5"
                      />
                      <span className="text-xs md:text-sm">Present</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`attendance-${student.person}`}
                        disabled={!loaded || isLocked}
                        checked={student.status === 'absent'}
                        onChange={() => handleStatusChange(student.person, 'absent')}
                        className="text-rose-600 w-4 h-4 md:w-5 md:h-5"
                      />
                      <span className="text-xs md:text-sm">Absent</span>
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 md:mt-6 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-700">Topic Taught Today</label>
          <textarea
            className="mt-1 w-full min-h-[100px] md:min-h-[120px] rounded-2xl md:rounded-3xl border border-slate-300 px-3 md:px-4 py-3 text-sm md:text-base"
            value={form.topic}
            disabled={isLocked}
            onChange={e => setForm({ ...form, topic: e.target.value })}
            placeholder="Example: Chapter 3 - Fractions"
          />
        </div>
        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-700">Remarks</label>
          <textarea
            className="mt-1 w-full min-h-[100px] md:min-h-[120px] rounded-2xl md:rounded-3xl border border-slate-300 px-3 md:px-4 py-3 text-sm md:text-base"
            value={form.notes}
            disabled={isLocked}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional remarks"
          />
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        <button
          type="submit"
          disabled={isLocked}
          className="w-full rounded-2xl md:rounded-3xl bg-indigo-700 px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-semibold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-600 transition"
        >
          Submit Attendance
        </button>
        {isLocked && (
          <p className="mt-3 text-xs md:text-sm text-rose-600">Attendance is locked. Teachers may edit same-day records only.</p>
        )}
      </div>
    </form>
  );
}
