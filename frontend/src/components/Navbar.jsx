import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { SCHOOL_INFO, COLORS } from '../constants/schoolData';
import NotificationBell from './NotificationBell';
import { useLocation } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const { language, changeLanguage } = useLanguage();
  const location = useLocation();

  // Apply premium header on desktop for admin, accountant, student, and all portal pages
  const pathname = location?.pathname || '';
  const isPortalPath = pathname.includes('/admin') || pathname.includes('portal') || pathname.includes('/fee-management') || pathname.includes('/fees');
  const isRolePortal = !!(user && ['superadmin','admin','principal','accountant','student','teacher','parent'].includes(user.role));
  const isAdminOrPortal = isPortalPath || isRolePortal;

  const getInitials = (name) => {
    if (!name) return 'U';
    return String(name).trim().charAt(0).toUpperCase();
  };

  const homePath = '/';

  // Subtitle text based on portal context
  const subtitleText = (() => {
    if (!isAdminOrPortal) return 'Management Portal';
    if (pathname.includes('student-portal') || user?.role === 'student') return 'Student Portal';
    if (pathname.includes('teacher-portal') || user?.role === 'teacher') return 'Teacher Portal';
    if (pathname.includes('parent-portal') || user?.role === 'parent') return 'Parent Portal';
    if (user?.role === 'accountant') return 'Accountant Portal';
    return 'Management Portal';
  })();

  return (
    <>
      {/* Mobile fast bar: blue background with logo, school name, address and ESTD */}
      <div className="md:hidden w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="w-full px-0 py-3 flex items-center">
          <div className="flex items-center">
            <Link to="/">
              <img src="/logo.png" alt="logo" className="rounded-md object-cover" style={{ width: '48px', height: '48px', marginLeft: '6px' }} />
            </Link>
          </div>
          <div className="flex-1 text-center">
            <div className="text-[16px] leading-tight font-semibold tracking-wide text-white">{SCHOOL_INFO.name}</div>
            <div className="mobile-location mt-0.5">{SCHOOL_INFO.address}</div>
            <div className="mt-1"><span className="inline-block text-xs text-white font-bold">ESTD. {SCHOOL_INFO.established}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="block">
              <NotificationBell />
            </div>
            <button
              onTouchStart={(e) => { e.stopPropagation(); }}
              onPointerDown={(e) => { e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); try { window.__ignoreSidebarOverlay = true; setTimeout(() => { window.__ignoreSidebarOverlay = false; }, 300); } catch (err) {} console.log('[Navbar] mobile hamburger clicked'); onMenuClick(); }}
              className="p-2 rounded-md bg-blue-800/60 hover:bg-blue-800/80 relative"
              aria-label="Toggle Sidebar"
              style={{ zIndex: 9999, marginRight: '8px' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-only welcome marquee for guests */}
      {!user && (
        <div className="md:hidden marquee-outer bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-500 text-white shadow-md">
          <div className="marquee-track">
            <div className="marquee-inner px-4 py-2 items-center">
              <span className="text-sm font-semibold mr-8">Welcome To Bal Bodh Secondary School</span>
              <span className="text-sm font-semibold mr-8">Welcome To Bal Bodh Secondary School</span>
            </div>
          </div>
        </div>
      )}

      <header
        className={`hidden md:flex sticky top-0 z-40 w-full ${isAdminOrPortal ? 'text-white border-b border-transparent' : 'bg-white/80 text-slate-900 backdrop-blur-md border-b border-slate-200/50'} px-4 md:px-6 py-3 md:py-4 items-center justify-between min-h-[64px] select-none`}
        style={isAdminOrPortal ? { background: COLORS.primary } : {}}
      >

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">

        {user && (
          <button
            onTouchStart={(e) => { e.stopPropagation(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); try { window.__ignoreSidebarOverlay = true; setTimeout(() => { window.__ignoreSidebarOverlay = false; }, 300); } catch (err) {} console.log('[Navbar] header hamburger clicked'); onMenuClick(); }}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 lg:hidden transition-colors relative"
            aria-label="Toggle Sidebar"
            style={{ zIndex: 9999 }}
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* LOGO + NAME */}
        <Link to={homePath} className="flex items-center gap-3">

          <img
            src="/logo.png"
            alt="Bal Bodh School Logo"
            className={`w-10 h-10 ${isAdminOrPortal ? 'md:w-10 md:h-10' : 'md:w-16 md:h-16'} rounded-xl object-cover shadow-md shadow-indigo-500/20`}
          />

          <div>
            <span className={`font-bold text-sm md:text-lg block ${isAdminOrPortal ? 'text-white' : 'text-slate-900'}`}>
              Bal Bodh School
            </span>
            <span
              className="text-[11px] md:text-sm uppercase tracking-widest font-semibold block mt-1 leading-tight"
              style={isAdminOrPortal ? { color: COLORS.accent } : undefined}
            >
              {subtitleText}
            </span>
          </div>

        </Link>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* LANGUAGE TOGGLE (hidden on desktop for admin/portal) */}
        {!isAdminOrPortal && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                language === 'en'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>
        )}

        {/* Notification bell (keep as previous) */}
        <div className="hidden sm:block">
          <NotificationBell />
        </div>

        {user ? (
          <div className="flex items-center gap-3">

            {/* USER INFO */}
            <div className="hidden sm:flex flex-col items-end">
                <span className={`text-sm md:text-base font-semibold ${isAdminOrPortal ? 'text-white' : 'text-slate-800'}`}>
                    {user.name}
                  </span>
                  {isAdminOrPortal ? (
                    <span
                      className="mt-1 inline-block px-3 py-1 rounded-full font-semibold text-sm"
                      style={{ background: COLORS.accent, color: COLORS.white }}
                    >
                      {user.role}
                    </span>
                  ) : (
                    <span className={`${isAdminOrPortal ? 'text-slate-900 bg-white border-white' : 'text-indigo-600 bg-indigo-50 border-indigo-100'} text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1`}>
                      {user.role}
                    </span>
                  )}
            </div>
            {/* USER AVATAR */}
            {user?.profile?.photoUrl ? (
              <img
                src={user.profile.photoUrl}
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover border border-white shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {getInitials(user.name)}
              </div>
            )}

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all duration-300"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

          </div>
        ) : (
          <Link to="/login?force=true" className="btn-primary text-xs py-1.5 px-3.5">
            Sign In
          </Link>
        )}

      </div>

    </header>
    </>
  );
}