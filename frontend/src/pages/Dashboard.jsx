import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS } from '../constants/schoolData';

export default function Dashboard(){
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalExams: 0,
    totalFees: 0,
    totalNotices: 0,
    totalAssignments: 0,
    totalBooks: 0,
    totalVehicles: 0,
    totalNotifications: 0,
    totalResults: 0,
    classCounts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    api.get('/dashboard')
      .then(res => {
        if(mounted) {
          setStats(res.data);
          setLoading(false);
        }
      })
      .catch(()=>{
        if(mounted) setLoading(false);
      });
    return ()=> mounted = false;
  },[]);

  const cardConfig = [
    { label: 'Total Students', value: stats.totalStudents, color: '#2563EB', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: '/admin/students' },
    { label: 'Total Teachers', value: stats.totalTeachers, color: '#475569', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: '/admin/teachers' },
    { label: 'Total Subjects', value: stats.totalSubjects, color: '#4F46E5', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/admin/subjects' },
    { label: 'Scheduled Exams', value: stats.totalExams, color: '#D97706', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/admin/exams' },
    { label: 'Invoiced Fees', value: stats.totalFees, color: '#059669', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/admin/fees' }
  ];

  const secondaryStats = [
    { label: 'Active Notices', value: stats.totalNotices, path: '/admin/notices' },
    { label: 'Pending Assignments', value: stats.totalAssignments, path: '/admin/assignments' },
    { label: 'Library Books', value: stats.totalBooks, path: '/admin/library' },
    { label: 'Transport Vehicles', value: stats.totalVehicles, path: '/admin/vehicles' },
    { label: 'Global Notifications', value: stats.totalNotifications, path: '/admin/notifications' },
    { label: 'Published Results', value: stats.totalResults, path: '/admin/results' }
  ];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const { user } = useContext(AuthContext);
  const adminName = user?.name || user?.fullName || user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Administrator';
  const filteredClassCounts = (stats.classCounts || []).filter(item => (item?.className || '').trim() !== 'Class 10');
  const [recentActivities, setRecentActivities] = useState([]);
  const [noticesList, setNoticesList] = useState([]);

  useEffect(()=>{
    let mounted = true;
    const fetchRecent = async () =>{
      try{
        const [nRes, notifRes] = await Promise.all([
          api.get('/notices').catch(()=>({ data: { notices: [] } })),
          api.get('/notifications/center').catch(()=>({ data: { notifications: [] } }))
        ]);

        const notices = nRes.data.notices || [];
        const notifications = notifRes.data.notifications || [];

        const activities = [];

        notices.slice(0,6).forEach(n => activities.push({ type: 'notice', title: n.title || 'Notice', date: n.publishedAt || n.createdAt || n.date, meta: n }));
        notifications.slice(0,6).forEach(n => activities.push({ type: 'notification', title: n.title || n.message || 'Notification', date: n.createdAt || n.updatedAt || n.date, meta: n }));

        const sorted = activities
          .filter(it => it.date)
          .sort((a,b)=> new Date(b.date) - new Date(a.date))
          .slice(0,8);

        if(mounted){
          setRecentActivities(sorted);
          setNoticesList(notices.slice(0,5));
        }
      }catch(err){
        console.error('Recent activity fetch failed', err);
      }
    };

    if(!loading) fetchRecent();
    return ()=> mounted = false;
  },[loading]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 font-sans"
      style={{ backgroundColor: COLORS.gray }}
    >
      <style>{`
        .group:hover { 
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12) !important; 
          transform: translateY(-4px);
        }
      `}</style>
      {/* Mobile Hero Banner */}
      <div className="md:hidden relative overflow-hidden rounded-[1.5rem] p-6 shadow-xl text-white mb-6"
        style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_24%)]" />
        <div className="relative space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/80">Admin Command Center</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome, {adminName}</h1>
          <div className="rounded-2xl px-4 py-3 shadow-lg backdrop-blur"
            style={{ backgroundColor: `${COLORS.white}10`, border: `1px solid ${COLORS.white}15` }}
          >
            <div className="text-xs uppercase tracking-[0.24em] text-white/80">Today</div>
            <div className="mt-1 text-sm font-semibold text-white">{currentDate}</div>
          </div>
        </div>
      </div>

      {/* Desktop Hero Banner */}
      <div className="hidden md:block relative overflow-hidden rounded-[2rem] p-6 md:p-8 shadow-2xl text-white mb-8"
        style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_24%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.75fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.32em] text-white/80">Admin Command Center</p>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">Welcome back, {adminName}</h1>
              <p className="max-w-2xl text-sm sm:text-base md:text-lg text-white/90">
                Manage school operations, student lifecycle, staff, finance, and communications from one premium dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl md:rounded-3xl px-4 md:px-5 py-3 md:py-4 shadow-lg backdrop-blur transition hover:-translate-y-0.5"
                style={{ backgroundColor: `${COLORS.white}10`, border: `1px solid ${COLORS.white}15` }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-white/80">Today</div>
                <div className="mt-2 md:mt-3 text-lg md:text-xl font-semibold text-white">{currentDate}</div>
              </div>
              <div className="rounded-2xl md:rounded-3xl px-4 md:px-5 py-3 md:py-4 shadow-lg backdrop-blur transition hover:-translate-y-0.5"
                style={{ backgroundColor: `${COLORS.white}10`, border: `1px solid ${COLORS.white}15` }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-white/80">Data refresh</div>
                <div className="mt-2 md:mt-3 text-lg md:text-xl font-semibold text-white">Real-time insights</div>
              </div>
              <div className="rounded-2xl md:rounded-3xl px-4 md:px-5 py-3 md:py-4 shadow-lg backdrop-blur transition hover:-translate-y-0.5"
                style={{ backgroundColor: `${COLORS.white}10`, border: `1px solid ${COLORS.white}15` }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-white/80">Action hub</div>
                <div className="mt-2 md:mt-3 text-lg md:text-xl font-semibold text-white">Centralized control</div>
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] md:rounded-[2rem] border p-4 md:p-6 shadow-2xl backdrop-blur"
            style={{ backgroundColor: `${COLORS.white}10`, borderColor: `${COLORS.white}15` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-white/80">Admin status</p>
                <h2 className="mt-2 md:mt-3 text-2xl md:text-3xl font-bold text-white">Live operational view</h2>
              </div>
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl md:rounded-3xl text-xl md:text-2xl font-bold shadow-lg" style={{ backgroundColor: COLORS.white, color: COLORS.dark }}>A</div>
            </div>
            <div className="mt-4 md:mt-6 grid gap-2 md:gap-3">
              <div className="rounded-2xl md:rounded-3xl p-3 md:p-4"
                style={{ backgroundColor: `${COLORS.white}10`, borderColor: `${COLORS.white}15`, border: '1px solid' }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-white/70">Primary controls</div>
                <div className="mt-1 md:mt-2 text-xs sm:text-sm text-white/90">Explore quick actions to manage students, teachers, fees and notices.</div>
              </div>
              <Link to="/admin/settings" className="inline-flex items-center justify-center rounded-full px-4 md:px-5 py-2.5 md:py-3 text-xs sm:text-sm font-semibold shadow-lg transition hover:shadow-xl"
                style={{ backgroundColor: COLORS.white, color: COLORS.dark }}
              >
                Open Admin Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-pulse mt-6 md:mt-8">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-32 md:h-40 bg-slate-100 rounded-[1rem] md:rounded-[1.125rem]" />
          ))}
        </div>
      ) : (
        <>
          {/* Premium ERP Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mt-6 md:mt-8">
            {/* Total Students Card */}
            <Link
              to="/admin/students"
              className="group relative overflow-hidden rounded-[1rem] md:rounded-[1.125rem] bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: COLORS.lightGray, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: COLORS.secondary }} />
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.slate }}>Total Students</div>
                    <div className="text-2xl md:text-4xl font-bold mt-1" style={{ color: COLORS.dark }}>{stats.totalStudents ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-2xl md:text-3xl">👨‍🎓</div>
                </div>
                <div className="text-[10px] md:text-xs font-medium mt-auto" style={{ color: COLORS.secondary }}>View Details →</div>
              </div>
            </Link>

            {/* Total Teachers Card */}
            <Link
              to="/admin/teachers"
              className="group relative overflow-hidden rounded-[1rem] md:rounded-[1.125rem] bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: COLORS.lightGray, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: COLORS.dark }} />
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.slate }}>Total Teachers</div>
                    <div className="text-2xl md:text-4xl font-bold mt-1" style={{ color: COLORS.dark }}>{stats.totalTeachers ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-2xl md:text-3xl">👨‍🏫</div>
                </div>
                <div className="text-[10px] md:text-xs font-medium mt-auto" style={{ color: COLORS.secondary }}>View Details →</div>
              </div>
            </Link>

            {/* Total Subjects Card */}
            <Link
              to="/admin/subjects"
              className="group relative overflow-hidden rounded-[1rem] md:rounded-[1.125rem] bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: COLORS.lightGray, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: COLORS.primary }} />
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.slate }}>Total Subjects</div>
                    <div className="text-2xl md:text-4xl font-bold mt-1" style={{ color: COLORS.dark }}>{stats.totalSubjects ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-2xl md:text-3xl">📚</div>
                </div>
                <div className="text-[10px] md:text-xs font-medium mt-auto" style={{ color: COLORS.secondary }}>View Details →</div>
              </div>
            </Link>

            {/* Scheduled Exams Card */}
            <Link
              to="/admin/exams"
              className="group relative overflow-hidden rounded-[1rem] md:rounded-[1.125rem] bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: COLORS.lightGray, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: COLORS.warning }} />
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.slate }}>Scheduled Exams</div>
                    <div className="text-2xl md:text-4xl font-bold mt-1" style={{ color: COLORS.dark }}>{stats.totalExams ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-2xl md:text-3xl">📝</div>
                </div>
                <div className="text-[10px] md:text-xs font-medium mt-auto" style={{ color: COLORS.secondary }}>View Details →</div>
              </div>
            </Link>

            {/* Invoiced Fees Card */}
            <Link
              to="/admin/fees"
              className="group relative overflow-hidden rounded-[1rem] md:rounded-[1.125rem] bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: COLORS.lightGray, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: COLORS.success }} />
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-semibold" style={{ color: COLORS.slate }}>Invoiced Fees</div>
                    <div className="text-2xl md:text-4xl font-bold mt-1" style={{ color: COLORS.dark }}>{stats.totalFees ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-2xl md:text-3xl">💰</div>
                </div>
                <div className="text-[10px] md:text-xs font-medium mt-auto" style={{ color: COLORS.secondary }}>View Details →</div>
              </div>
            </Link>
          </div>

          

          <div className="mt-4 md:mt-6">
            <div className="bg-white rounded-[1rem] md:rounded-[1.5rem] border p-4 md:p-6 shadow-sm"
              style={{ borderColor: COLORS.lightGray }}
            >
              <h3 className="text-sm md:text-base font-bold" style={{ color: COLORS.dark }}>Recent Activity</h3>
              <p className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Latest system events</p>
              <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="text-xs md:text-sm" style={{ color: COLORS.slate }}>No recent activity available.</div>
                ) : (
                  recentActivities.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg border hover:bg-slate-50 transition"
                      style={{ borderColor: COLORS.lightGray }}
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm" style={{ backgroundColor: COLORS.gray, color: COLORS.dark }}>{act.type[0].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-semibold truncate" style={{ color: COLORS.dark }}>{act.title}</div>
                        <div className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>{new Date(act.date).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 bg-white rounded-[1rem] md:rounded-[1.5rem] border p-4 md:p-6 shadow-sm"
              style={{ borderColor: COLORS.lightGray }}
            >
              <h3 className="text-sm md:text-base font-bold" style={{ color: COLORS.dark }}>Announcements</h3>
              <p className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Create, edit, and publish notices. Latest notices shown below.</p>
              <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                {noticesList.length === 0 ? (
                  <div className="text-xs md:text-sm" style={{ color: COLORS.slate }}>No notices published yet.</div>
                ) : (
                  noticesList.map((n,i) => (
                    <div key={n._id || i} className="p-2 md:p-3 rounded-lg border hover:bg-slate-50 transition"
                      style={{ borderColor: COLORS.lightGray }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold" style={{ color: COLORS.dark }}>{n.title}</div>
                        <div className="text-xs" style={{ color: COLORS.slate }}>{new Date(n.publishedAt || n.createdAt || n.date || Date.now()).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm mt-1" style={{ color: COLORS.slate }}>{(n.body || n.description || '').slice(0,120)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Link to="/admin/notices" className="btn-primary inline-flex items-center">Manage Notices</Link>
              </div>
            </div>

            <div className="bg-white rounded-[1rem] md:rounded-[1.5rem] border p-4 md:p-6 shadow-sm"
              style={{ borderColor: COLORS.lightGray }}
            >
              <h3 className="text-sm md:text-base font-bold" style={{ color: COLORS.dark }}>Quick Actions</h3>
              <p className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Common admin tasks</p>
              <div className="mt-3 md:mt-4 grid grid-cols-1 gap-2">
                <Link to="/register?role=student" className="btn-primary text-xs md:text-sm py-2 md:py-2.5">Add Student</Link>
                <Link to="/register?role=teacher" className="btn-secondary text-xs md:text-sm py-2 md:py-2.5">Add Teacher</Link>
                <Link to="/register?role=accountant" className="btn-secondary text-xs md:text-sm py-2 md:py-2.5">Add Accountant</Link>
                <Link to="/admin/fees" className="btn-secondary text-xs md:text-sm py-2 md:py-2.5">Collect Fee</Link>
                <Link to="/admin/attendance" className="btn-secondary text-xs md:text-sm py-2 md:py-2.5">Mark Attendance</Link>
                <Link to="/admin/assignments" className="btn-secondary text-xs md:text-sm py-2 md:py-2.5">Create Assignment</Link>
                <Link to="/admin/results" className="btn-secondary text-xs md:text-sm py-2 md:py-2.5">Publish Result</Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr] gap-4 md:gap-6 mt-4 md:mt-6">
            <div className="rounded-[1.25rem] md:rounded-[2rem] border bg-white p-4 md:p-6 shadow-sm"
              style={{ borderColor: COLORS.lightGray }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-5">
                <div>
                  <h3 className="text-sm md:text-base font-bold" style={{ color: COLORS.dark }}>Administrative Actions</h3>
                  <p className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Launch the most frequently used admin workflows.</p>
                </div>
              </div>
              <div className="grid gap-2 md:gap-3 sm:grid-cols-2">
                <Link to="/admin/students" className="rounded-2xl md:rounded-3xl border px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold hover:bg-slate-50 transition"
                  style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.dark }}
                >
                  Manage Students
                </Link>
                <Link to="/admin/teachers" className="rounded-2xl md:rounded-3xl border px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold hover:bg-slate-50 transition"
                  style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.dark }}
                >
                  Manage Teachers
                </Link>
                <Link to="/admin/accountants" className="rounded-2xl md:rounded-3xl border px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold hover:bg-slate-50 transition"
                  style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.dark }}
                >
                  Manage Accountants
                </Link>
                <Link to="/admin/assignments" className="rounded-2xl md:rounded-3xl border px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold hover:bg-slate-50 transition"
                  style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.dark }}
                >
                  Review Assignments
                </Link>
                <Link to="/admin/fees" className="rounded-2xl md:rounded-3xl border px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold hover:bg-slate-50 transition"
                  style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.dark }}
                >
                  Manage Fees
                </Link>
              </div>
            </div>

            <div className="rounded-[1.25rem] md:rounded-[2rem] border bg-white p-4 md:p-6 shadow-sm"
              style={{ borderColor: COLORS.lightGray }}
            >
              <div>
                <h3 className="text-sm md:text-base font-bold" style={{ color: COLORS.dark }}>System Resources</h3>
                <p className="text-[10px] md:text-xs" style={{ color: COLORS.slate }}>Auxiliary totals and management shortcuts.</p>
              </div>
              <div className="mt-4 md:mt-5 grid grid-cols-2 gap-2 md:gap-3">
                {secondaryStats.map(stat => (
                  <Link
                    to={stat.path}
                    key={stat.label}
                    className="rounded-2xl md:rounded-3xl border p-3 md:p-4 text-center transition hover:bg-slate-100"
                    style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray }}
                  >
                    <div className="text-xl md:text-2xl font-bold" style={{ color: COLORS.dark }}>{stat.value ?? 0}</div>
                    <div className="mt-1 md:mt-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.20em]" style={{ color: COLORS.slate }}>{stat.label.replace('Global ', '').replace('Active ', '').replace('Pending ', '').replace('Library ', '').replace('Transport ', '').replace('Published ', '')}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
