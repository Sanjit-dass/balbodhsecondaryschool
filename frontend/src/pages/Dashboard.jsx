import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

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
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8 font-sans">
      <style>{`
        .group:hover { 
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12) !important; 
          transform: translateY(-4px);
        }
      `}</style>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-8 shadow-2xl shadow-indigo-500/20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_24%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.75fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.32em] text-indigo-100/80">Admin Command Center</p>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Welcome back, {adminName}</h1>
              <p className="max-w-2xl text-base text-white/90 sm:text-lg">
                Manage school operations, student lifecycle, staff, finance, and communications from one premium dashboard.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 border border-white/15 px-5 py-4 shadow-lg shadow-slate-950/5 backdrop-blur transition hover:-translate-y-0.5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-100/80">Today</div>
                <div className="mt-3 text-xl font-semibold text-white">{currentDate}</div>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/15 px-5 py-4 shadow-lg shadow-slate-950/5 backdrop-blur transition hover:-translate-y-0.5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-100/80">Data refresh</div>
                <div className="mt-3 text-xl font-semibold text-white">Real-time insights</div>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/15 px-5 py-4 shadow-lg shadow-slate-950/5 backdrop-blur transition hover:-translate-y-0.5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-100/80">Action hub</div>
                <div className="mt-3 text-xl font-semibold text-white">Centralized control</div>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/80">Admin status</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Live operational view</h2>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/90 text-2xl font-bold text-slate-900 shadow-lg shadow-slate-950/10">A</div>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl bg-white/10 p-4 border border-white/15">
                <div className="text-xs uppercase tracking-[0.24em] text-white/70">Primary controls</div>
                <div className="mt-2 text-sm text-white/90">Explore quick actions to manage students, teachers, fees and notices.</div>
              </div>
              <Link to="/admin/settings" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/10 transition hover:bg-slate-100">
                Open Admin Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse mt-8">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-[18px]" />
          ))}
        </div>
      ) : (
        <>
          {/* Premium ERP Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            {/* Total Students Card */}
            <Link
              to="/admin/students"
              className="group relative overflow-hidden rounded-[18px] bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: '#2563EB' }} />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#64748B' }}>Total Students</div>
                    <div className="text-4xl font-bold mt-1" style={{ color: '#0F172A' }}>{stats.totalStudents ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-3xl">👨‍🎓</div>
                </div>
                <div className="text-xs font-medium mt-auto" style={{ color: '#2563EB' }}>View Details →</div>
              </div>
            </Link>

            {/* Total Teachers Card */}
            <Link
              to="/admin/teachers"
              className="group relative overflow-hidden rounded-[18px] bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: '#475569' }} />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#64748B' }}>Total Teachers</div>
                    <div className="text-4xl font-bold mt-1" style={{ color: '#0F172A' }}>{stats.totalTeachers ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-3xl">👨‍🏫</div>
                </div>
                <div className="text-xs font-medium mt-auto" style={{ color: '#2563EB' }}>View Details →</div>
              </div>
            </Link>

            {/* Total Subjects Card */}
            <Link
              to="/admin/subjects"
              className="group relative overflow-hidden rounded-[18px] bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: '#4F46E5' }} />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#64748B' }}>Total Subjects</div>
                    <div className="text-4xl font-bold mt-1" style={{ color: '#0F172A' }}>{stats.totalSubjects ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-3xl">📚</div>
                </div>
                <div className="text-xs font-medium mt-auto" style={{ color: '#2563EB' }}>View Details →</div>
              </div>
            </Link>

            {/* Scheduled Exams Card */}
            <Link
              to="/admin/exams"
              className="group relative overflow-hidden rounded-[18px] bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: '#D97706' }} />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#64748B' }}>Scheduled Exams</div>
                    <div className="text-4xl font-bold mt-1" style={{ color: '#0F172A' }}>{stats.totalExams ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-3xl">📝</div>
                </div>
                <div className="text-xs font-medium mt-auto" style={{ color: '#2563EB' }}>View Details →</div>
              </div>
            </Link>

            {/* Invoiced Fees Card */}
            <Link
              to="/admin/fees"
              className="group relative overflow-hidden rounded-[18px] bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: '#059669' }} />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#64748B' }}>Invoiced Fees</div>
                    <div className="text-4xl font-bold mt-1" style={{ color: '#0F172A' }}>{stats.totalFees ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-center text-3xl">💰</div>
                </div>
                <div className="text-xs font-medium mt-auto" style={{ color: '#2563EB' }}>View Details →</div>
              </div>
            </Link>
          </div>

          

          <div className="mt-6">
            <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-400">Latest system events</p>
              <div className="mt-4 space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="text-sm text-slate-500">No recent activity available.</div>
                ) : (
                  recentActivities.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-700 font-semibold">{act.type[0].toUpperCase()}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{act.title}</div>
                        <div className="text-xs text-slate-500">{new Date(act.date).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Announcements</h3>
              <p className="text-xs text-slate-400">Create, edit, and publish notices. Latest notices shown below.</p>
              <div className="mt-4 space-y-3">
                {noticesList.length === 0 ? (
                  <div className="text-sm text-slate-500">No notices published yet.</div>
                ) : (
                  noticesList.map((n,i) => (
                    <div key={n._id || i} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-800">{n.title}</div>
                        <div className="text-xs text-slate-400">{new Date(n.publishedAt || n.createdAt || n.date || Date.now()).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm text-slate-600 mt-1">{(n.body || n.description || '').slice(0,120)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Link to="/admin/notices" className="btn-primary inline-flex items-center">Manage Notices</Link>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
              <p className="text-xs text-slate-400">Common admin tasks</p>
              <div className="mt-4 grid grid-cols-1 gap-2">
                <Link to="/register?role=student" className="btn-primary">Add Student</Link>
                <Link to="/register?role=teacher" className="btn-secondary">Add Teacher</Link>
                <Link to="/register?role=accountant" className="btn-secondary">Add Accountant</Link>
                <Link to="/admin/fees" className="btn-secondary">Collect Fee</Link>
                <Link to="/admin/attendance" className="btn-secondary">Mark Attendance</Link>
                <Link to="/admin/assignments" className="btn-secondary">Create Assignment</Link>
                <Link to="/admin/results" className="btn-secondary">Publish Result</Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr] gap-6 mt-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Administrative Actions</h3>
                  <p className="text-xs text-slate-400">Launch the most frequently used admin workflows.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/admin/students" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Manage Students
                </Link>
                <Link to="/admin/teachers" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Manage Teachers
                </Link>
                <Link to="/admin/accountants" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Manage Accountants
                </Link>
                <Link to="/admin/assignments" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Review Assignments
                </Link>
                <Link to="/admin/fees" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Manage Fees
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div>
                <h3 className="text-base font-bold text-slate-900">System Resources</h3>
                <p className="text-xs text-slate-400">Auxiliary totals and management shortcuts.</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {secondaryStats.map(stat => (
                  <Link
                    to={stat.path}
                    key={stat.label}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:bg-slate-100"
                  >
                    <div className="text-2xl font-bold text-slate-900">{stat.value ?? 0}</div>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-500">{stat.label.replace('Global ', '').replace('Active ', '').replace('Pending ', '').replace('Library ', '').replace('Transport ', '').replace('Published ', '')}</div>
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
