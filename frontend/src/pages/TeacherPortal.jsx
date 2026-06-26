import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS } from '../constants/schoolData';

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
    <div className="space-y-6 md:space-y-8 px-4 py-4 md:py-6 sm:px-6 lg:px-8"
      style={{ backgroundColor: COLORS.gray }}
    >
      <section className="relative overflow-hidden rounded-[1.25rem] md:rounded-[1.5rem] lg:rounded-[2rem] p-5 md:p-6 lg:p-8 shadow-xl md:shadow-2xl text-white sm:p-10"
        style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_36%)] pointer-events-none" />
        <div className="relative max-w-5xl">
          <div className="inline-flex items-center gap-2 md:gap-3 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white/90 backdrop-blur"
            style={{ backgroundColor: `${COLORS.white}15` }}
          >
            <span className="text-xl md:text-2xl">👋</span> Welcome Back
          </div>
          <div className="mt-4 md:mt-6 max-w-3xl">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight sm:text-5xl">Welcome Back, {teacherName}</h1>
            <p className="mt-3 md:mt-4 max-w-2xl text-sm md:text-base text-white/85 sm:text-lg">
              Manage classes, attendance, assignments, and student performance efficiently.
            </p>
          </div>
          <div className="mt-6 md:mt-8 grid gap-3 md:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {academicYear && (
              <div className="rounded-2xl md:rounded-3xl px-4 md:px-5 py-3 md:py-5 backdrop-blur transition duration-300 hover:-translate-y-1"
                style={{ backgroundColor: `${COLORS.white}12` }}
              >
                <div className="text-[10px] md:text-sm uppercase tracking-[0.22em] text-white/75">Academic Year</div>
                <div className="mt-2 md:mt-3 text-lg md:text-2xl font-semibold text-white">{academicYear}</div>
              </div>
            )}
            <div className="rounded-2xl md:rounded-3xl px-4 md:px-5 py-3 md:py-5 backdrop-blur transition duration-300 hover:-translate-y-1"
              style={{ backgroundColor: `${COLORS.white}12` }}
            >
              <div className="text-[10px] md:text-sm uppercase tracking-[0.22em] text-white/75">Today</div>
              <div className="mt-2 md:mt-3 text-lg md:text-2xl font-semibold text-white">{today}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {actionCards.map((card) => (
          <div key={card.title} className="group overflow-hidden rounded-[1.25rem] md:rounded-[1.5rem] lg:rounded-[2rem] border bg-white p-4 md:p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{ borderColor: COLORS.lightGray }}
          >
            <div className="mb-4 md:mb-5 inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl md:rounded-3xl text-lg md:text-xl text-white shadow-lg transition duration-300 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
            >
              {card.icon}
            </div>
            <h2 className="text-lg md:text-xl font-semibold" style={{ color: COLORS.dark }}>{card.title}</h2>
            <ul className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-xs md:text-sm" style={{ color: COLORS.slate }}>
              {card.items.map((item) => (
                <li key={item} className="flex items-start gap-2 md:gap-3">
                  <span className="mt-1 h-2 w-2 md:h-2.5 md:w-2.5 rounded-full" style={{ backgroundColor: COLORS.gray }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to={card.link} className="mt-4 md:mt-6 inline-flex items-center gap-2 rounded-full border px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-semibold transition duration-300 hover:bg-white hover:shadow-lg"
              style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.dark }}
            >
              {card.buttonLabel}
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-[1.25rem] md:rounded-[1.5rem] lg:rounded-[2rem] border bg-white p-4 md:p-6 shadow-lg"
        style={{ borderColor: COLORS.lightGray }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] md:text-sm uppercase tracking-[0.24em]" style={{ color: COLORS.slate }}>Recent Activity</p>
            <h2 className="mt-1 md:mt-2 text-xl md:text-2xl font-semibold" style={{ color: COLORS.dark }}>Latest updates</h2>
          </div>
        </div>
        <div className="mt-4 md:mt-6 rounded-2xl md:rounded-3xl border p-4 md:p-6"
          style={{ borderColor: COLORS.lightGray, backgroundColor: COLORS.gray, color: COLORS.slate }}
        >
          <p className="text-xs md:text-sm">No recent activity available.</p>
        </div>
      </section>
    </div>
  );
}
