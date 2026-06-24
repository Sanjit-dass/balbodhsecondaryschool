import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import AttendanceForm from '../components/AttendanceForm';

const FILTERS = [
  { key: 'month', label: 'This month' },
  { key: 'period', label: 'Last 30 days' },
  { key: 'all', label: 'All records' }
];

export default function Attendance(){
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('month');
  const [searchClass, setSearchClass] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [verifyName, setVerifyName] = useState('');
  const [verifyClass, setVerifyClass] = useState('');
  const [verifyRoll, setVerifyRoll] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verified, setVerified] = useState(false);
  const [studentProfileLoaded, setStudentProfileLoaded] = useState(true);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const useManualFallback = !studentProfileLoaded;
  const normalizeValue = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Special normalization for class names - handles "Class 10", "10", "Class X" etc
  const normalizeClass = (value) => {
    let normalized = String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    // Remove "class " prefix if present
    normalized = normalized.replace(/^class\s+/, '');
    return normalized;
  };

  const fetch = useCallback(async () => {
    if (isStudent || isTeacher) return;
    setLoading(true);
    try {
      const params = {};
      if (searchClass) params.class = searchClass;
      if (searchDate) params.date = searchDate;
      const res = await api.get('/attendance', { params });
      setRecords(res.data.attendance || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [searchClass, searchDate, isStudent]);

  const fetchStudentAttendance = useCallback(async (className, name, rollNumber) => {
    setStudentLoading(true);
    setStudentAttendance([]);
    try {
      const params = {
        studentUserId: user?.id || user?._id,
        class: className,
        studentName: name,
        rollNumber,
        page: 1,
        limit: 1000
      };
      console.log('[ATTENDANCE] Frontend: Fetching attendance with params:', params);
      const res = await api.get('/attendance', { params });
      console.log('[ATTENDANCE] Frontend: Response received:', {
        recordCount: (res.data.attendance || []).length,
        firstRecord: res.data.attendance && res.data.attendance[0] ? {
          class: res.data.attendance[0].class,
          date: res.data.attendance[0].date,
          period: res.data.attendance[0].period,
          studentRecordCount: (res.data.attendance[0].records || []).length
        } : null
      });
      setStudentAttendance(res.data.attendance || []);
    } catch (err) {
      console.error('[ATTENDANCE] Frontend: Error fetching attendance:', err);
      setVerifyError(err.response?.data?.message || 'Unable to load attendance. Please try again.');
    }
    setStudentLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    let intervalId;
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const delay = nextMidnight.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      fetch();
      intervalId = setInterval(fetch, 24 * 60 * 60 * 1000);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetch]);

  useEffect(() => {
    if (!isStudent) return;
    setLoadingProfile(true);
    api.get('/students/me')
      .then(res => {
        const student = res.data.student || null;
        console.log('Student profile loaded:', student);
        setStudentInfo(student);
        setVerifyName(String(student?.fullName || student?.name || user?.fullName || user?.name || ''));
        setVerifyClass(String(student?.class?.name || student?.className || student?.class || user?.class?.name || user?.className || user?.class || ''));
        setVerifyRoll(String(student?.admissionNumber || student?.rollNumber || user?.admissionNumber || user?.rollNumber || ''));
      })
      .catch((err) => {
        console.error('Failed to load student profile:', err.response?.status, err.response?.data);
        setStudentInfo(null);
        setStudentProfileLoaded(false);
        setVerifyError('Unable to load profile. Please verify class, name, and roll number manually.');
        // Fallback to user fields if endpoint fails
        setVerifyName(String(user?.fullName || user?.name || ''));
        setVerifyClass(String(user?.class?.name || user?.className || user?.class || ''));
        setVerifyRoll(String(user?.admissionNumber || user?.rollNumber || ''));
      })
      .finally(() => setLoadingProfile(false));
  }, [isStudent, user]);

  const remove = async (id)=>{ if(!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return; try{ await api.delete(`/attendance/${id}`); fetch(); }catch(err){console.error(err);} };

  const renderAttendanceRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading attendance records…</td>
        </tr>
      );
    }

    if (!records.length) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-10 text-center text-slate-500">No attendance records found.</td>
        </tr>
      );
    }

    return records.map(a => {
      const present = (a.records || []).filter(r => r.status === 'present').length;
      const absent = (a.records || []).length - present;
      const locked = a.submitted && (user?.role !== 'teacher' || new Date(a.date).toDateString() !== new Date().toDateString());
      return (
        <tr key={a._id} className="odd:bg-white even:bg-slate-50">
          <td className="px-4 py-3 border">{new Date(a.date).toLocaleDateString()}</td>
          <td className="px-4 py-3 border">{a.class?.name || a.class || ''}</td>
          <td className="px-4 py-3 border">{a.period || '–'}</td>
          <td className="px-4 py-3 border">{a.subject?.name || a.subject || '–'}</td>
          <td className="px-4 py-3 border text-center">{present}</td>
          <td className="px-4 py-3 border text-center">{absent}</td>
          <td className="px-4 py-3 border text-center">
            {locked ? <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Locked</span> : <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">Editable</span>}
          </td>
          <td className="px-4 py-3 border text-right">
            <button onClick={() => setEditing(a)} className="rounded-2xl bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-300 transition">Edit</button>
            <button onClick={() => remove(a._id)} className="ml-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition">Delete</button>
          </td>
        </tr>
      );
    });
  };

  const studentEntries = useMemo(() => {
    if (!isStudent) return [];
    return studentAttendance.flatMap(record => {
      return (record.records || []).filter(item => {
        const itemRoll = String(item.rollNumber || '').trim().toLowerCase();
        const itemName = String(item.name || '').trim().toLowerCase();
        const enteredRoll = String(verifyRoll || '').trim().toLowerCase();
        const enteredName = String(verifyName || '').trim().toLowerCase();
        return itemRoll === enteredRoll && itemName === enteredName;
      }).map(item => ({
        ...item,
        status: item.status,
        subject: record.subject?.name || record.subject || record.class?.name || record.class || 'N/A',
        date: record.date,
        day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        classTitle: record.class?.name || record.class || record.section || 'Class',
        recordId: record._id
      }));
    });
  }, [studentAttendance, verifyRoll, verifyName, isStudent]);

  const selectedDateEntries = useMemo(() => {
    if (!submittedDate || !isStudent) return [];
    const targetDate = new Date(submittedDate);
    if (Number.isNaN(targetDate.getTime())) return [];
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    return studentEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
  }, [submittedDate, studentEntries, isStudent]);

  const yearEntries = useMemo(() => {
    if (!isStudent) return [];
    const now = new Date();
    const begin = new Date(now);
    begin.setDate(now.getDate() - 365);
    begin.setHours(0, 0, 0, 0);
    return studentEntries.filter(entry => new Date(entry.date) >= begin);
  }, [studentEntries, isStudent]);

  const groupBySubject = useCallback((entries) => {
    return entries.reduce((acc, entry) => {
      const key = entry.subject || 'N/A';
      const current = acc[key] || { subject: key, date: entry.date, day: entry.day, held: 0, attended: 0 };
      current.held += 1;
      if (entry.status === 'present') current.attended += 1;
      acc[key] = current;
      return acc;
    }, {});
  }, []);

  const selectedDateGroups = useMemo(() => {
    return Object.values(groupBySubject(selectedDateEntries));
  }, [selectedDateEntries, groupBySubject]);

  const yearGroups = useMemo(() => {
    return Object.values(groupBySubject(yearEntries));
  }, [yearEntries, groupBySubject]);

  const selectedDateSummary = useMemo(() => {
    const total = selectedDateEntries.length;
    const attended = selectedDateEntries.filter(item => item.status === 'present').length;
    return {
      total,
      attended,
      percentage: total ? Math.round((attended / total) * 100) : 0
    };
  }, [selectedDateEntries]);

  const yearSummary = useMemo(() => {
    const total = yearEntries.length;
    const attended = yearEntries.filter(item => item.status === 'present').length;
    return {
      total,
      attended,
      percentage: total ? Math.round((attended / total) * 100) : 0
    };
  }, [yearEntries]);

  const filteredEntries = useMemo(() => {
    if (!isStudent) return studentEntries;
    const now = new Date();
    const start = new Date(now);
    if (filter === 'month') {
      start.setDate(1);
      start.setHours(0,0,0,0);
    } else if (filter === 'period') {
      start.setDate(now.getDate() - 30);
      start.setHours(0,0,0,0);
    } else {
      start.setTime(0);
    }
    return studentEntries.filter(entry => new Date(entry.date) >= start);
  }, [filter, isStudent, studentEntries]);

  const attendanceSummary = useMemo(() => {
    const total = filteredEntries.length;
    const present = filteredEntries.filter(item => item.status === 'present').length;
    const absent = filteredEntries.filter(item => item.status !== 'present').length;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [filteredEntries]);

  const subjectSummary = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const key = entry.subject;
      const current = acc[key] || { held: 0, present: 0 };
      current.held += 1;
      if (entry.status === 'present') current.present += 1;
      acc[key] = current;
      return acc;
    }, {});
  }, [filteredEntries]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyError('');
    const currentRoll = String(studentInfo?.admissionNumber || studentInfo?.rollNumber || user?.admissionNumber || user?.rollNumber || '').trim();
    const currentName = String(studentInfo?.fullName || studentInfo?.name || user?.fullName || user?.name || '').trim();
    const currentClass = String(studentInfo?.class?.name || studentInfo?.className || studentInfo?.class || user?.class?.name || user?.className || user?.class || '').trim();
    const enteredRoll = String(verifyRoll).trim();
    const enteredName = String(verifyName).trim();
    const enteredClass = String(verifyClass).trim();

    console.log('[ATTENDANCE] Verification attempt:', {
      userRole: user?.role,
      userId: user?.id || user?._id,
      profileLoaded: studentProfileLoaded,
      studentInfo: studentInfo ? { name: studentInfo.fullName, class: studentInfo.class, roll: studentInfo.admissionNumber } : null,
      entered: { name: enteredName, class: enteredClass, roll: enteredRoll }
    });

    if (!enteredRoll || !enteredName || !enteredClass) {
      setVerifyError('Please enter name, class, and roll number.');
      setVerified(false);
      console.log('[ATTENDANCE] Missing required fields');
      return;
    }

    if (!studentProfileLoaded || !currentRoll || !currentName || !currentClass) {
      // Profile is missing or incomplete, allow manual fallback verification by class/name/roll.
      console.log('[ATTENDANCE] Using manual fallback verification (profile not loaded)');
      setVerified(true);
      await fetchStudentAttendance(enteredClass, enteredName, enteredRoll);
      return;
    }

    if (normalizeValue(enteredRoll) !== normalizeValue(currentRoll) || normalizeValue(enteredName) !== normalizeValue(currentName) || normalizeClass(enteredClass) !== normalizeClass(currentClass)) {
      setVerifyError('Entered details do not match your profile.');
      setVerified(false);
      console.log('[ATTENDANCE] Details mismatch:', {
        rollMatch: normalizeValue(enteredRoll) === normalizeValue(currentRoll),
        nameMatch: normalizeValue(enteredName) === normalizeValue(currentName),
        classMatch: normalizeClass(enteredClass) === normalizeClass(currentClass),
        normalized: {
          enteredRoll: normalizeValue(enteredRoll),
          currentRoll: normalizeValue(currentRoll),
          enteredName: normalizeValue(enteredName),
          currentName: normalizeValue(currentName),
          enteredClass: normalizeClass(enteredClass),
          currentClass: normalizeClass(currentClass)
        }
      });
      return;
    }

    setVerified(true);
    await fetchStudentAttendance(enteredClass, enteredName, enteredRoll);
  };

  if (isStudent) {
    return (
      <div id="attendance-print-section" className="space-y-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Attendance Verification</h1>
          <p className="text-sm text-slate-600">Enter your name, class, and roll number to view only your attendance records.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleVerify} className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={verifyName}
                onChange={e => setVerifyName(e.target.value)}
                placeholder="Student name"
                className="w-full rounded-3xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Class</span>
              <input
                value={verifyClass}
                onChange={e => setVerifyClass(e.target.value)}
                placeholder="Class"
                className="w-full rounded-3xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Roll No</span>
              <input
                value={verifyRoll}
                onChange={e => setVerifyRoll(e.target.value)}
                placeholder="Roll number"
                className="w-full rounded-3xl border border-slate-300 px-4 py-3"
              />
            </label>
            <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">Verify and show attendance</button>
              {verifyError && <div className="text-sm text-rose-600">{verifyError}</div>}
            </div>
            {useManualFallback && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Student profile lookup failed. Attendance will be loaded using the manually entered class, name, and roll number.
              </div>
            )}
          </form>
        </div>

        {verified && (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Yearly attendance</h2>
                <p className="text-sm text-slate-600">Full year attendance summary by subject. This is the default view.</p>
              </div>
              {studentLoading ? (
                <p className="text-sm text-slate-500">Loading attendance records…</p>
              ) : yearGroups.length === 0 ? (
                <p className="text-sm text-slate-500">No attendance records found for the last year.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 border">Course</th>
                          <th className="px-4 py-3 border text-center">Held</th>
                          <th className="px-4 py-3 border text-center">Attend</th>
                          <th className="px-4 py-3 border text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearGroups.map(entry => (
                          <tr key={entry.subject} className="odd:bg-white even:bg-slate-50">
                            <td className="px-4 py-3 border">{entry.subject}</td>
                            <td className="px-4 py-3 border text-center">{entry.held}</td>
                            <td className="px-4 py-3 border text-center">{entry.attended}</td>
                            <td className="px-4 py-3 border text-center">{entry.held ? Math.round((entry.attended / entry.held) * 100) : 0}%</td>
                          </tr>
                        ))}
                        <tr className="font-semibold bg-slate-100">
                          <td className="px-4 py-3 border">TOTAL</td>
                          <td className="px-4 py-3 border text-center">{yearSummary.total}</td>
                          <td className="px-4 py-3 border text-center">{yearSummary.attended}</td>
                          <td className="px-4 py-3 border text-center">{yearSummary.percentage}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Day-wise attendance</h2>
                <p className="text-sm text-slate-600">Select a date and submit to view attendance for that day only.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSubmittedDate(selectedDate)}
                  disabled={!selectedDate}
                  className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Submit
                </button>
              </div>

              {studentLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading attendance records…</p>
              ) : !submittedDate ? (
                <p className="mt-4 text-sm text-slate-500">Use the date picker above and submit to see day-specific attendance.</p>
              ) : selectedDateEntries.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No attendance records found for {new Date(submittedDate).toLocaleDateString()}.</p>
              ) : (
                <>
                  <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 border">Course</th>
                          <th className="px-4 py-3 border text-center">Held</th>
                          <th className="px-4 py-3 border text-center">Attend</th>
                          <th className="px-4 py-3 border text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDateGroups.map(entry => (
                          <tr key={entry.subject} className="odd:bg-white even:bg-slate-50">
                            <td className="px-4 py-3 border">{entry.subject}</td>
                            <td className="px-4 py-3 border text-center">{entry.held}</td>
                            <td className="px-4 py-3 border text-center">{entry.attended}</td>
                            <td className="px-4 py-3 border text-center">{entry.held ? Math.round((entry.attended / entry.held) * 100) : 0}%</td>
                          </tr>
                        ))}
                        <tr className="font-semibold bg-slate-100">
                          <td className="px-4 py-3 border">TOTAL</td>
                          <td className="px-4 py-3 border text-center">{selectedDateSummary.total}</td>
                          <td className="px-4 py-3 border text-center">{selectedDateSummary.attended}</td>
                          <td className="px-4 py-3 border text-center">{selectedDateSummary.percentage}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div id="attendance-print-section" className="space-y-6">
      <div>
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Attendance Management</h1>
            <p className="text-sm text-slate-600">Create, search, edit and review daily attendance records for all classes.</p>
          </div>
          <button onClick={() => setEditing(null)} className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 transition">New Attendance</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <AttendanceForm existing={editing} onSaved={() => { setEditing(null); fetch(); }} />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900 mb-3">Search Attendance</div>
            <div className="grid gap-3">
              <input
                value={searchClass}
                onChange={e => setSearchClass(e.target.value)}
                placeholder="Class"
                className="w-full rounded-3xl border border-slate-300 px-4 py-3"
              />
              <input
                type="date"
                value={searchDate}
                onChange={e => setSearchDate(e.target.value)}
                className="w-full rounded-3xl border border-slate-300 px-4 py-3"
              />
              <button onClick={fetch} className="w-full rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">Apply filters</button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900 mb-3">Filter Options</div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(option => (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key)}
                  className={`rounded-3xl px-4 py-2 text-sm font-semibold ${filter === option.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isTeacher ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-slate-700 shadow-sm">
          <h2 className="text-lg font-semibold">Attendance history is admin-only</h2>
          <p className="mt-2 text-sm">Teachers can post daily attendance, but once attendance is submitted, only admin users can view the attendance record list.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 border">Date</th>
                <th className="px-4 py-3 border">Class</th>
                <th className="px-4 py-3 border">Period</th>
                <th className="px-4 py-3 border">Subject</th>
                <th className="px-4 py-3 border">Present</th>
                <th className="px-4 py-3 border">Absent</th>
                <th className="px-4 py-3 border">Status</th>
                <th className="px-4 py-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {renderAttendanceRows()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
