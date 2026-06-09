import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function TeacherPortal(){
  const { user } = useContext(AuthContext);
  const teacherName = user?.name || user?.email || 'Teacher';
  const academicYear = user?.academicYear;
  const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }), []);

  const actionCards = [
    {
      title: 'Attendance',
      items: ['Mark Attendance', 'View Attendance History', 'Attendance Reports'],
      icon: '✅',
      link: '/teacher/attendance',
      buttonLabel: 'Open Attendance →',
    },
    {
      title: 'Assignments',
      items: ['Create Assignment', 'Review Submissions', 'Publish Marks'],
      icon: '📝',
      link: '/teacher/assignments',
      buttonLabel: 'Open Assignments →',
    },
    {
      title: 'Student Reports',
      items: ['View Student Performance', 'Generate Report Cards', 'Subject-wise Analytics'],
      icon: '📊',
      link: '/teacher/results',
      buttonLabel: 'Open Reports →',
    },
    {
      title: 'Account Settings',
      items: ['Profile Settings', 'Password Settings', 'Teacher Preferences'],
      icon: '⚙️',
      link: '/teacher/settings',
      buttonLabel: 'Open Settings →',
    },
  ];

  const activity = [];

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-8 shadow-2xl shadow-indigo-500/20 text-white sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_36%)] pointer-events-none" />
        <div className="relative max-w-5xl">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
            <span className="text-2xl">👋</span> Welcome Back
          </div>
          <div className="mt-6 max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Welcome Back, {teacherName}</h1>
            <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
              Manage classes, attendance, assignments, and student performance efficiently.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {academicYear && (
              <div className="rounded-3xl bg-white/12 px-5 py-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="text-sm uppercase tracking-[0.22em] text-white/75">Academic Year</div>
                <div className="mt-3 text-2xl font-semibold text-white">{academicYear}</div>
              </div>
            )}
            <div className="rounded-3xl bg-white/12 px-5 py-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
              <div className="text-sm uppercase tracking-[0.22em] text-white/75">Today</div>
              <div className="mt-3 text-2xl font-semibold text-white">{today}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        {actionCards.map((card) => (
          <div key={card.title} className="group overflow-hidden rounded-[2rem] border border-[#E2E8F0] bg-white p-6 shadow-lg shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-xl text-white shadow-lg shadow-slate-900/10 transition duration-300 group-hover:scale-105">
              {card.icon}
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {card.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to={card.link} className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:bg-white hover:text-slate-900">
              {card.buttonLabel}
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-[#E2E8F0] bg-white p-6 shadow-lg shadow-slate-900/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent Activity</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Latest updates</h2>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 text-slate-600">
          <p className="text-sm">No recent activity available.</p>
        </div>
      </section>
    </div>
  );
}
