import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import ExportActions from '../components/ExportActions';

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
    const paid = fees.filter(item => item.paid).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const due = fees.filter(item => !item.paid).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { total: fees.length, paid, due };
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
  const feePaymentPercentage = feeSummary.total > 0
    ? Math.round(((feeSummary.total - (feeSummary.due > 0 ? 1 : 0)) / feeSummary.total) * 100)
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
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen pb-8">
      {/* WELCOME HEADER CARD */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-36 -mb-36"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">
                👋 Welcome back, {(user?.name || user?.fullName || 'Student').split(' ')[0]}!
              </h1>
              <div className="flex flex-wrap gap-4 text-white/90 text-sm font-medium">
                <span className="flex items-center gap-1">📚 {user?.class?.name || user?.className || user?.class || 'Class'}</span>
                <span className="flex items-center gap-1">🎯 Roll No: {user?.admissionNumber || user?.rollNumber || '—'}</span>
                <span className="flex items-center gap-1">📅 2026-2027</span>
              </div>
            </div>
            
            {/* Avatar Circle */}
            <div className="hidden sm:flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30">
              <span className="text-5xl font-bold text-white">{getInitials()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mb-8 flex flex-wrap gap-3">
        <ExportActions resource="attendance" filenamePrefix="attendance-summary" />
        <button 
          onClick={()=>window.print()} 
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          🖨️ Print Page
        </button>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid gap-6 lg:grid-cols-4 mb-8">
        {/* Attendance Card */}
        {attendanceSummary.total > 0 && <Link to="/student/attendance" className="group relative overflow-hidden rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white hover:scale-105">
          <div className="absolute right-0 top-0 opacity-10 text-8xl group-hover:scale-110 transition-transform">✓</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Attendance</div>
              <div className="text-3xl">✓</div>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold">{attendanceSummary.present}/{attendanceSummary.total}</div>
              <div className="text-sm opacity-90">Present / Total Days</div>
            </div>
            {attendanceSummary.total > 0 && (
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
              </div>
            )}
            {attendanceSummary.total > 0 && (
              <div className="text-xs mt-2 opacity-80">{attendancePercentage}% Attendance</div>
            )}
          </div>
        </Link>}

        {/* Fee Status Card */}
        {feeSummary.total > 0 && <Link to="/student/fees" className="group relative overflow-hidden rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white hover:scale-105">
          <div className="absolute right-0 top-0 opacity-10 text-8xl group-hover:scale-110 transition-transform">₹</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Fee Status</div>
              <div className="text-3xl">💰</div>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold">₹{feeSummary.due.toLocaleString()}</div>
              <div className="text-sm opacity-90">Outstanding Balance</div>
            </div>
            <div className="text-xs mt-2 opacity-80">
              ₹{feeSummary.paid.toLocaleString()} Paid
            </div>
          </div>
        </Link>}

        {/* Results Card */}
        {results.length > 0 && <Link to="/student/results" className="group relative overflow-hidden rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white hover:scale-105">
          <div className="absolute right-0 top-0 opacity-10 text-8xl group-hover:scale-110 transition-transform">★</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Results</div>
              <div className="text-3xl">🏆</div>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold">{results.length}</div>
              <div className="text-sm opacity-90">Scorecards Published</div>
            </div>
            {latestResult && (
              <div className="text-xs mt-2 opacity-80">
                Latest: {latestResult.exam?.title || 'Exam'}
              </div>
            )}
          </div>
        </Link>}

        {/* Assignments Card */}
        {assignments.length > 0 && <Link to="/student/assignments" className="group relative overflow-hidden rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 text-white hover:scale-105">
          <div className="absolute right-0 top-0 opacity-10 text-8xl group-hover:scale-110 transition-transform">📚</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Assignments</div>
              <div className="text-3xl">📝</div>
            </div>
            <div className="mb-4">
              <div className="text-3xl font-bold">{assignments.length}</div>
              <div className="text-sm opacity-90">Pending Tasks</div>
            </div>
          </div>
        </Link>}
      </div>

      {/* QUICK ACCESS SECTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/student/attendance" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Attendance</h3>
              <p className="text-sm text-slate-600 mt-2">View daily attendance records</p>
            </div>
          </Link>

          <Link to="/student/fees" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Fees & Payments</h3>
              <p className="text-sm text-slate-600 mt-2">Check fee status and history</p>
            </div>
          </Link>

          <Link to="/student/results" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Results</h3>
              <p className="text-sm text-slate-600 mt-2">View exam scorecards</p>
            </div>
          </Link>

          <Link to="/student/assignments" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Assignments</h3>
              <p className="text-sm text-slate-600 mt-2">Submit and view work</p>
            </div>
          </Link>

          <Link to="/student/dashboard" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">Timetable</h3>
              <p className="text-sm text-slate-600 mt-2">Class schedule and periods</p>
            </div>
          </Link>

          <Link to="/student/admit-card" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">🎫</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Admit Card</h3>
              <p className="text-sm text-slate-600 mt-2">Generate exam admit cards</p>
            </div>
          </Link>
        </div>
      </div>

      {/* PROGRESS SECTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Progress</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendance Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Attendance Progress</h3>
                <p className="text-sm text-slate-600">Days present vs total</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Overall</span>
                  <span className="text-sm font-bold text-emerald-600">{attendancePercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-emerald-600">{attendanceSummary.present}</div>
                  <div className="text-xs text-slate-600">Days Present</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-rose-600">{attendanceSummary.absent}</div>
                  <div className="text-xs text-slate-600">Days Absent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Payment Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fee Payment Progress</h3>
                <p className="text-sm text-slate-600">Dues and payments</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Payment Status</span>
                  <span className="text-sm font-bold text-orange-600">{Math.round((feeSummary.paid / (feeSummary.paid + feeSummary.due || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.round((feeSummary.paid / (feeSummary.paid + feeSummary.due || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-lg font-bold text-green-600">₹{feeSummary.paid.toLocaleString()}</div>
                  <div className="text-xs text-slate-600">Amount Paid</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <div className="text-lg font-bold text-orange-600">₹{feeSummary.due.toLocaleString()}</div>
                  <div className="text-xs text-slate-600">Amount Due</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="space-y-2">
            {attendanceSummary.total > 0 && (
              <Link to="/student/attendance" className="group flex items-start gap-4 p-4 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                    <span className="text-lg">✓</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">Attendance Marked</p>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700">Today's attendance has been recorded</p>
                  <p className="text-xs text-slate-500 mt-1">Just now</p>
                </div>
                <div className="text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}
            
            {feeSummary.paid > 0 && (
              <Link to="/student/fees" className="group flex items-start gap-4 p-4 rounded-xl hover:bg-green-50 transition-colors cursor-pointer border border-transparent hover:border-green-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                    <span className="text-lg">✓</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-green-700">Fee Payment Completed</p>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700">₹{feeSummary.paid.toLocaleString()} paid successfully</p>
                  <p className="text-xs text-slate-500 mt-1">2 days ago</p>
                </div>
                <div className="text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}
            
            {results.length > 0 && (
              <Link to="/student/results" className="group flex items-start gap-4 p-4 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                    <span className="text-lg">★</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-700">Result Published</p>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700">{latestResult?.exam?.title || 'Exam'} results are now available</p>
                  <p className="text-xs text-slate-500 mt-1">1 week ago</p>
                </div>
                <div className="text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}
            
            {assignments.length > 0 && (
              <Link to="/student/assignments" className="group flex items-start gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <span className="text-lg">📝</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">New Assignment</p>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700">You have {assignments.length} pending assignment{assignments.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-slate-500 mt-1">3 days ago</p>
                </div>
                <div className="text-xl group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            )}
            
            {!attendanceSummary.total && !feeSummary.paid && !results.length && !assignments.length && (
              <p className="text-sm text-slate-500 text-center py-8">No recent activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* NOTICES AND RESULTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">📢 Latest Notices</h2>
            <Link to="/student/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View all →</Link>
          </div>
          {recentNotices.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No notices published yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentNotices.map(n => (
                <li key={n._id} className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <div className="text-xs text-slate-600 mt-1">{n.audience || 'All students'}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">🏆 Latest Result</h2>
            <Link to="/student/results" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View all →</Link>
          </div>
          {latestResult ? (
            <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-lg font-bold text-slate-900">{latestResult.exam?.title || 'Exam'}</div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{latestResult.grade || 'N/A'}</div>
                  <div className="text-xs text-slate-600">Grade</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{latestResult.gpa || 'N/A'}</div>
                  <div className="text-xs text-slate-600">GPA</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4">No published results available yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
