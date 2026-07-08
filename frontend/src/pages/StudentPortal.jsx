import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import ExportActions from '../components/ExportActions';
import { COLORS } from '../constants/schoolData';

export default function StudentPortal(){
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const isStudent = user?.role === 'student';

  useEffect(()=>{
    api.get('/notices').then(r=>setNotices(r.data.notices||[])).catch(()=>{});
    api.get('/attendance').then(r=>setAttendance(r.data.attendance||[])).catch(()=>{});
    api.get('/fees').then(r=>setFees(r.data.fees||[])).catch(()=>{});
    api.get('/assignments').then(r=>setAssignments(r.data.assignments||[])).catch(()=>{});

    if (isStudent) {
      fetchResults();
    }
  },[isStudent]);

  const attendanceSummary = useMemo(() => {
    const entries = attendance.flatMap(record => {
      return (record.records || []).filter(item => String(item.person) === String(user?._id || user?.id)).map(item => ({
        status: item.status,
        subject: record.subject || record.class || 'N/A',
        date: record.date,
        classTitle: record.class?.name || record.class || record.section || 'Class'
      }));
    });

    const total = entries.length;
    const present = entries.filter(item => item.status === 'present').length;
    const absent = entries.filter(item => item.status !== 'present').length;

    const byClass = entries.reduce((acc, entry) => {
      const key = entry.classTitle;
      const current = acc[key] || { total: 0, present: 0 };
      current.total += 1;
      if (entry.status === 'present') current.present += 1;
      acc[key] = current;
      return acc;
    }, {});

    return { total, present, absent, byClass };
  }, [attendance, user]);

  const feeSummary = useMemo(() => {
    const totalAmount = fees.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paidAmount = fees.filter(item => item.paid).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const dueAmount = totalAmount - paidAmount;
    const paymentPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    return { total: fees.length, paid: paidAmount, due: dueAmount, totalAmount, paymentPercentage };
  }, [fees]);

  const latestResult = results[0];
  const recentNotices = notices.slice(0, 4);
  
  // Get student initials for avatar
  const getInitials = () => {
    const name = user?.name || user?.fullName || 'SD';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };
  
  // Calculate percentages
  const attendancePercentage = attendanceSummary.total > 0 
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) 
    : 0;

  const fetchResults = async () => {
    try {
      const res = await api.get('/results');
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Error fetching results:', err);
    }
  };

  return (
    <div className="min-h-screen pb-6 md:pb-8"
      style={{ background: `linear-gradient(135deg, ${COLORS.gray}, white)` }}
    >
      {/* WELCOME HEADER CARD */}
      <div className="mb-6 md:mb-8">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-5 md:p-6 lg:p-8 shadow-xl md:shadow-2xl text-white"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full -mr-32 -mt-32 md:-mr-48 md:-mt-48" style={{ backgroundColor: `${COLORS.white}05` }}></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-72 md:h-72 rounded-full -ml-24 -mb-24 md:-ml-36 md:-mb-36" style={{ backgroundColor: `${COLORS.white}05` }}></div>

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3">
                👋 Welcome back, {(user?.name || user?.fullName || 'Student').split(' ')[0]}!
              </h1>
              <div className="flex flex-wrap gap-2 md:gap-4 text-white/90 text-xs md:text-sm font-medium">
                <span className="flex items-center gap-1">📚 {user?.class?.name || user?.className || user?.class || 'Class'}</span>
                <span className="flex items-center gap-1">🎯 Roll No: {user?.admissionNumber || user?.rollNumber || '—'}</span>
                <span className="flex items-center gap-1">📅 2026-2027</span>
              </div>
            </div>

            {/* Avatar Circle */}
            <div className="hidden sm:flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full backdrop-blur-md border-2"
              style={{ backgroundColor: `${COLORS.white}20`, borderColor: `${COLORS.white}30` }}
            >
              <span className="text-3xl md:text-5xl font-bold text-white">{getInitials()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
        <ExportActions resource="attendance" filenamePrefix="attendance-summary" />
        <button
          onClick={()=>window.print()}
          className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-white font-semibold text-xs md:text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
          style={{ background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.primary})` }}
        >
          🖨️ Print Page
        </button>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        {/* Attendance Card */}
        {attendanceSummary.total > 0 && <Link to="/student/attendance" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.primary})` }}
        >
          <div className="absolute right-0 top-0 opacity-10 text-5xl md:text-8xl group-hover:scale-110 transition-transform">✓</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">Attendance</div>
              <div className="text-2xl md:text-3xl">✓</div>
            </div>
            <div className="mb-2">
              <div className="text-2xl md:text-3xl font-bold">{attendanceSummary.present}/{attendanceSummary.total}</div>
              <div className="text-xs md:text-sm opacity-90">Present / Total Days</div>
            </div>
            {attendanceSummary.total > 0 && (
              <div className="w-full rounded-full h-1.5 md:h-2" style={{ backgroundColor: `${COLORS.white}20` }}>
                <div
                  className="h-1.5 md:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${attendancePercentage}%`, backgroundColor: COLORS.white }}
                ></div>
              </div>
            )}
            {attendanceSummary.total > 0 && (
              <div className="text-[10px] md:text-xs mt-1.5 md:mt-2 opacity-80">{attendancePercentage}% Attendance</div>
            )}
          </div>
        </Link>}

        {/* Fee Status Card */}
        {feeSummary.total > 0 && <Link to="/student/fees" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})` }}
        >
          <div className="absolute right-0 top-0 opacity-10 text-5xl md:text-8xl group-hover:scale-110 transition-transform">💰</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">Payment Status</div>
              <div className="text-2xl md:text-3xl">💰</div>
            </div>
            <div className="mb-2">
              <div className="text-2xl md:text-3xl font-bold">{feeSummary.paymentPercentage}%</div>
              <div className="text-xs md:text-sm opacity-90">Payment Progress</div>
            </div>
            {feeSummary.totalAmount > 0 && (
              <div className="w-full rounded-full h-1.5 md:h-2" style={{ backgroundColor: `${COLORS.white}20` }}>
                <div
                  className="h-1.5 md:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${feeSummary.paymentPercentage}%`, backgroundColor: COLORS.white }}
                ></div>
              </div>
            )}
            <div className="text-[10px] md:text-xs mt-1.5 md:mt-2 opacity-80">
              ₹{feeSummary.paid.toLocaleString()} Paid • ₹{feeSummary.due.toLocaleString()} Due
            </div>
          </div>
        </Link>}

        {/* Results Card */}
        {results.length > 0 && <Link to="/student/results" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
        >
          <div className="absolute right-0 top-0 opacity-10 text-5xl md:text-8xl group-hover:scale-110 transition-transform">★</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">Results</div>
              <div className="text-2xl md:text-3xl">🏆</div>
            </div>
            <div className="mb-2">
              <div className="text-2xl md:text-3xl font-bold">{results.length}</div>
              <div className="text-xs md:text-sm opacity-90">Scorecards Published</div>
            </div>
            {latestResult && (
              <div className="text-[10px] md:text-xs mt-1.5 md:mt-2 opacity-80">
                Latest: {latestResult.exam?.title || 'Exam'}
              </div>
            )}
          </div>
        </Link>}

        {/* Assignments Card */}
        {assignments.length > 0 && <Link to="/student/assignments" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.primary})` }}
        >
          <div className="absolute right-0 top-0 opacity-10 text-5xl md:text-8xl group-hover:scale-110 transition-transform">📚</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">Assignments</div>
              <div className="text-2xl md:text-3xl">📝</div>
            </div>
            <div className="mb-3 md:mb-4">
              <div className="text-2xl md:text-3xl font-bold">{assignments.length}</div>
              <div className="text-xs md:text-sm opacity-90">Pending Tasks</div>
            </div>
          </div>
        </Link>}
      </div>

      {/* QUICK ACCESS SECTION */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: COLORS.dark }}>Quick Access</h2>
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
          <Link to="/student/attendance" className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${COLORS.success}10, transparent)` }}></div>
            <div className="relative z-10">
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">📅</div>
              <h3 className="text-sm md:text-lg font-bold group-hover:transition-colors" style={{ color: COLORS.dark }}>Attendance</h3>
              <p className="text-xs md:text-sm mt-1 md:mt-2" style={{ color: COLORS.slate }}>View daily attendance records</p>
            </div>
          </Link>

          <Link to="/student/fees" className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${COLORS.warning}10, transparent)` }}></div>
            <div className="relative z-10">
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">💰</div>
              <h3 className="text-sm md:text-lg font-bold group-hover:transition-colors" style={{ color: COLORS.dark }}>Fees & Payments</h3>
              <p className="text-xs md:text-sm mt-1 md:mt-2" style={{ color: COLORS.slate }}>Check fee status and history</p>
            </div>
          </Link>

          <Link to="/student/results" className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${COLORS.primary}10, transparent)` }}></div>
            <div className="relative z-10">
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">🏆</div>
              <h3 className="text-sm md:text-lg font-bold group-hover:transition-colors" style={{ color: COLORS.dark }}>Results</h3>
              <p className="text-xs md:text-sm mt-1 md:mt-2" style={{ color: COLORS.slate }}>View exam scorecards</p>
            </div>
          </Link>

          <Link to="/student/assignments" className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${COLORS.secondary}10, transparent)` }}></div>
            <div className="relative z-10">
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">📝</div>
              <h3 className="text-sm md:text-lg font-bold group-hover:transition-colors" style={{ color: COLORS.dark }}>Assignments</h3>
              <p className="text-xs md:text-sm mt-1 md:mt-2" style={{ color: COLORS.slate }}>Submit and view work</p>
            </div>
          </Link>

          <Link to="/student/dashboard" className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${COLORS.error}10, transparent)` }}></div>
            <div className="relative z-10">
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">📅</div>
              <h3 className="text-sm md:text-lg font-bold group-hover:transition-colors" style={{ color: COLORS.dark }}>Timetable</h3>
              <p className="text-xs md:text-sm mt-1 md:mt-2" style={{ color: COLORS.slate }}>Class schedule and periods</p>
            </div>
          </Link>
        </div>
      </div>

      {/* PROGRESS SECTION */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: COLORS.dark }}>Your Progress</h2>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Attendance Progress */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold" style={{ color: COLORS.dark }}>Attendance Progress</h3>
                <p className="text-xs md:text-sm" style={{ color: COLORS.slate }}>Days present vs total</p>
              </div>
              <div className="text-3xl md:text-4xl">✓</div>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm font-semibold" style={{ color: COLORS.dark }}>Overall</span>
                  <span className="text-xs md:text-sm font-bold" style={{ color: COLORS.success }}>{attendancePercentage}%</span>
                </div>
                <div className="w-full rounded-full h-2 md:h-3" style={{ backgroundColor: COLORS.gray }}>
                  <div
                    className="h-2 md:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${attendancePercentage}%`, background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.primary})` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                <div className="rounded-lg md:rounded-xl p-2.5 md:p-3" style={{ backgroundColor: `${COLORS.success}10` }}>
                  <div className="text-xl md:text-2xl font-bold" style={{ color: COLORS.success }}>{attendanceSummary.present}</div>
                  <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Days Present</div>
                </div>
                <div className="rounded-lg md:rounded-xl p-2.5 md:p-3" style={{ backgroundColor: `${COLORS.error}10` }}>
                  <div className="text-xl md:text-2xl font-bold" style={{ color: COLORS.error }}>{attendanceSummary.absent}</div>
                  <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Days Absent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Payment Progress */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold" style={{ color: COLORS.dark }}>Fee Payment Progress</h3>
                <p className="text-xs md:text-sm" style={{ color: COLORS.slate }}>Dues and payments</p>
              </div>
              <div className="text-3xl md:text-4xl">💰</div>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm font-semibold" style={{ color: COLORS.dark }}>Payment Status</span>
                  <span className="text-xs md:text-sm font-bold" style={{ color: COLORS.warning }}>{Math.round((feeSummary.paid / (feeSummary.paid + feeSummary.due || 1)) * 100)}%</span>
                </div>
                <div className="w-full rounded-full h-2 md:h-3" style={{ backgroundColor: COLORS.gray }}>
                  <div
                    className="h-2 md:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((feeSummary.paid / (feeSummary.paid + feeSummary.due || 1)) * 100)}%`, background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                <div className="rounded-lg md:rounded-xl p-2.5 md:p-3" style={{ backgroundColor: `${COLORS.success}10` }}>
                  <div className="base md:text-lg font-bold" style={{ color: COLORS.success }}>₹{feeSummary.paid.toLocaleString()}</div>
                  <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Amount Paid</div>
                </div>
                <div className="rounded-lg md:rounded-xl p-2.5 md:p-3" style={{ backgroundColor: `${COLORS.warning}10` }}>
                  <div className="base md:text-lg font-bold" style={{ color: COLORS.warning }}>₹{feeSummary.due.toLocaleString()}</div>
                  <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Amount Due</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: COLORS.dark }}>Recent Activity</h2>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md">
          <div className="space-y-1.5 md:space-y-2">
            {attendanceSummary.total > 0 && (
              <Link to="/student/attendance" className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl transition-colors cursor-pointer border border-transparent"
                style={{ ':hover': { backgroundColor: `${COLORS.success}10`, borderColor: `${COLORS.success}30` } }}
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full transition-colors" style={{ backgroundColor: `${COLORS.success}20` }}>
                    <span className="text-base md:text-lg">✓</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold group-hover:transition-colors" style={{ color: COLORS.dark }}>Attendance Marked</p>
                  <p className="text-xs md:text-sm mt-1" style={{ color: COLORS.slate }}>Today's attendance has been recorded</p>
                  <p className="text-[10px] md:text-xs mt-1" style={{ color: COLORS.gray }}>Just now</p>
                </div>
                <div className="text-lg md:text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}

            {feeSummary.paid > 0 && (
              <Link to="/student/fees" className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-green-50 transition-colors cursor-pointer border border-transparent hover:border-green-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                    <span className="text-base md:text-lg">✓</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-slate-900 group-hover:text-green-700">Fee Payment Completed</p>
                  <p className="text-xs md:text-sm text-slate-600 group-hover:text-slate-700">₹{feeSummary.paid.toLocaleString()} paid successfully</p>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1">2 days ago</p>
                </div>
                <div className="text-lg md:text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}

            {results.length > 0 && (
              <Link to="/student/results" className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                    <span className="text-base md:text-lg">★</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-slate-900 group-hover:text-purple-700">Result Published</p>
                  <p className="text-xs md:text-sm text-slate-600 group-hover:text-slate-700">{latestResult?.exam?.title || 'Exam'} results are now available</p>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1">1 week ago</p>
                </div>
                <div className="text-lg md:text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}

            {assignments.length > 0 && (
              <Link to="/student/assignments" className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <span className="text-base md:text-lg">📝</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-slate-900 group-hover:text-blue-700">New Assignment</p>
                  <p className="text-xs md:text-sm text-slate-600 group-hover:text-slate-700">You have {assignments.length} pending assignment{assignments.length > 1 ? 's' : ''}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1">3 days ago</p>
                </div>
                <div className="text-lg md:text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}

            {!attendanceSummary.total && !feeSummary.paid && !results.length && !assignments.length && (
              <p className="text-xs md:text-sm py-6 md:py-8" style={{ color: COLORS.slate }}>No recent activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* NOTICES AND RESULTS */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <section className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-bold" style={{ color: COLORS.dark }}>📢 Latest Notices</h2>
            <Link to="/student/dashboard" className="text-xs md:text-sm font-semibold" style={{ color: COLORS.secondary }}>View all →</Link>
          </div>
          {recentNotices.length === 0 ? (
            <p className="text-xs md:text-sm py-3 md:py-4" style={{ color: COLORS.slate }}>No notices published yet.</p>
          ) : (
            <ul className="space-y-2 md:space-y-3">
              {recentNotices.map(n => (
                <li key={n._id} className="rounded-lg md:rounded-xl border p-3 md:p-4 transition-all cursor-pointer" style={{ borderColor: COLORS.lightGray }}>
                  <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.dark }}>{n.title}</div>
                  <div className="text-[10px] md:text-xs mt-1" style={{ color: COLORS.slate }}>{n.audience || 'All students'}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-bold" style={{ color: COLORS.dark }}>🏆 Latest Result</h2>
            <Link to="/student/results" className="text-xs md:text-sm font-semibold" style={{ color: COLORS.secondary }}>View all →</Link>
          </div>
          {latestResult ? (
            <div className="rounded-lg md:rounded-xl border p-3 md:p-4" style={{ borderColor: COLORS.lightGray, background: `linear-gradient(135deg, ${COLORS.primary}10, ${COLORS.secondary}10)` }}>
              <div className="text-sm md:text-lg font-bold" style={{ color: COLORS.dark }}>{latestResult.exam?.title || 'Exam'}</div>
              <div className="mt-2 md:mt-3 grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <div className="text-xl md:text-2xl font-bold" style={{ color: COLORS.primary }}>{latestResult.grade || 'N/A'}</div>
                  <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Grade</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold" style={{ color: COLORS.primary }}>{latestResult.gpa || 'N/A'}</div>
                  <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>GPA</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs md:text-sm py-3 md:py-4" style={{ color: COLORS.slate }}>No published results available yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
