import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { COLORS } from '../constants/schoolData';

export default function ParentPortal(){
  const { user } = useContext(AuthContext);
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(()=>{
    api.get('/fees').then(r=>setFees(r.data.fees||[])).catch(()=>{});
    api.get('/attendance').then(r=>setAttendance(r.data.attendance||[])).catch(()=>{});
    api.get('/results').then(r=>setResults(r.data.results||[])).catch(()=>{});
  },[]);

  const feeSummary = useMemo(() => {
    const paid = fees.filter(item => item.paid).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const due = fees.filter(item => !item.paid).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { total: fees.length, paid, due };
  }, [fees]);

  const attendanceSummary = useMemo(() => {
    const entries = attendance.flatMap(record => {
      return (record.records || []).map(item => ({
        status: item.status,
        date: record.date,
        classTitle: record.class?.name || record.class || record.section || 'Class'
      }));
    });

    const total = entries.length;
    const present = entries.filter(item => item.status === 'present').length;
    const absent = entries.filter(item => item.status !== 'present').length;

    return { total, present, absent };
  }, [attendance]);

  const attendancePercentage = attendanceSummary.total > 0 
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) 
    : 0;

  const parentName = user?.name || user?.fullName || user?.email || 'Parent';
  const studentName = user?.studentName || user?.childName || 'Your Child';

  const actionCards = [
    {
      title: 'Fee Ledger',
      description: 'View fee summary, pending dues, payment history, and receipts',
      icon: '💰',
      link: '/parent/fees',
      color: 'from-orange-500 via-amber-500 to-rose-500',
      badge: `${feeSummary.due > 0 ? '₹' + feeSummary.due.toLocaleString() + ' Due' : 'All Paid'}`
    },
    {
      title: 'Attendance',
      description: 'Track daily attendance records and overall attendance percentage',
      icon: '✓',
      link: '/parent/attendance',
      color: 'from-emerald-500 via-teal-500 to-cyan-600',
      badge: `${attendancePercentage}% Present`
    },
    {
      title: 'Results',
      description: 'View exam scorecards, grades, and academic performance',
      icon: '🏆',
      link: '/parent/results',
      color: 'from-violet-600 via-fuchsia-600 to-pink-600',
      badge: `${results.length} Results`
    },
    {
      title: 'Settings',
      description: 'Manage account preferences and profile settings',
      icon: '⚙️',
      link: '/parent/settings',
      color: 'from-blue-500 via-cyan-500 to-teal-600',
      badge: 'Account'
    }
  ];

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

          <div className="relative">
            <div className="inline-flex items-center gap-2 md:gap-3 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white/90 backdrop-blur mb-4 md:mb-6"
              style={{ backgroundColor: `${COLORS.white}15` }}
            >
              <span className="text-xl md:text-2xl">👨‍👩‍👧</span> Parent Portal
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3">
              Welcome, {parentName.split(' ')[0]}!
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-white/85 max-w-2xl">
              Monitor your child's academic progress, attendance, and fee payments in one secure portal.
            </p>
            <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-4 text-white/90 text-xs md:text-sm font-medium">
              <span className="flex items-center gap-1">👤 Student: {studentName}</span>
              <span className="flex items-center gap-1">📚 Class: {user?.class?.name || user?.className || 'N/A'}</span>
              <span className="flex items-center gap-1">📅 2026-2027</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        {/* Fee Status Card */}
        <Link to="/parent/fees" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})` }}
        >
          <div className="absolute right-0 top-0 opacity-10 text-5xl md:text-8xl group-hover:scale-110 transition-transform">₹</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">Fee Status</div>
              <div className="text-2xl md:text-3xl">💰</div>
            </div>
            <div className="mb-2">
              <div className="text-2xl md:text-3xl font-bold">₹{feeSummary.due.toLocaleString()}</div>
              <div className="text-xs md:text-sm opacity-90">Outstanding Balance</div>
            </div>
            <div className="text-[10px] md:text-xs mt-1.5 md:mt-2 opacity-80">
              ₹{feeSummary.paid.toLocaleString()} Paid
            </div>
          </div>
        </Link>

        {/* Attendance Card */}
        {attendanceSummary.total > 0 && (
          <Link to="/parent/attendance" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
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
                <div className="text-[10px] md:text-xs mt-1.5 md:mt-2 opacity-80">{attendancePercentage}% Attendance</div>
              )}
            </div>
          </Link>
        )}

        {/* Results Card */}
        {results.length > 0 && (
          <Link to="/parent/results" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
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
            </div>
          </Link>
        )}

        {/* Settings Card */}
        <Link to="/parent/settings" className="group relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.primary})` }}
        >
          <div className="absolute right-0 top-0 opacity-10 text-5xl md:text-8xl group-hover:scale-110 transition-transform">⚙️</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-80">Settings</div>
              <div className="text-2xl md:text-3xl">⚙️</div>
            </div>
            <div className="mb-2">
              <div className="text-2xl md:text-3xl font-bold">Account</div>
              <div className="text-xs md:text-sm opacity-90">Manage Preferences</div>
            </div>
          </div>
        </Link>
      </div>

      {/* QUICK ACCESS SECTION */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: COLORS.dark }}>Quick Access</h2>
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
          {actionCards.map((card) => (
            <Link key={card.title} to={card.link} className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${COLORS.gray}, transparent)` }}></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="text-3xl md:text-4xl">{card.icon}</div>
                  <span className="text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.primary})` }}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-sm md:text-lg font-bold group-hover:transition-colors" style={{ color: COLORS.dark }}>{card.title}</h3>
                <p className="text-xs md:text-sm mt-1 md:mt-2" style={{ color: COLORS.slate }}>{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* PROGRESS SECTION */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: COLORS.dark }}>Child's Progress</h2>
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
                  <span className="text-xs md:text-sm font-bold" style={{ color: COLORS.warning }}>{feeSummary.total > 0 ? Math.round((feeSummary.paid / (feeSummary.paid + feeSummary.due || 1)) * 100) : 100}%</span>
                </div>
                <div className="w-full rounded-full h-2 md:h-3" style={{ backgroundColor: COLORS.gray }}>
                  <div
                    className="h-2 md:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${feeSummary.total > 0 ? Math.round((feeSummary.paid / (feeSummary.paid + feeSummary.due || 1)) * 100) : 100}%`, background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})` }}
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

      {/* RECENT ATTENDANCE */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: COLORS.dark }}>Recent Attendance</h2>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md">
          {attendance.length === 0 ? (
            <p className="text-xs md:text-sm py-6 md:py-8" style={{ color: COLORS.slate }}>No attendance records available yet.</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {attendance.slice(0, 5).map((a) => (
                <div key={a._id} className="flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl border transition-all" style={{ borderColor: COLORS.lightGray }}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full" style={{ backgroundColor: `${COLORS.success}20` }}>
                      <span className="text-base md:text-lg">📅</span>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.dark }}>{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>{a.class?.name || a.class || 'Class'}</div>
                    </div>
                  </div>
                  <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.success }}>
                    {a.records?.length || 0} Records
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
