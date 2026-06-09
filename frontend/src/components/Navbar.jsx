import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const { language, changeLanguage } = useLanguage();

  const getInitials = (name) => {
    if (!name) return 'U';
    return String(name).trim().charAt(0).toUpperCase();
  };

  const homePath = '/';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-4 md:px-6 h-18 flex items-center justify-between select-none">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">

        {user && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Toggle Sidebar"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* LOGO + NAME */}
        <Link to={homePath} className="flex items-center gap-2.5">

          <img
            src="/logo.png"
            alt="Bal Bodh School Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-md shadow-indigo-500/20"
          />

          <div>
            <span className="font-bold text-slate-900 text-sm md:text-base block">
              Bal Bodh School
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block -mt-1">
              Management Portal
            </span>
          </div>

        </Link>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* LANGUAGE TOGGLE */}
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
          <button
            onClick={() => changeLanguage('ne')}
            className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
              language === 'ne'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ने
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-3">

            {/* USER INFO */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-800">
                {user.name}
              </span>
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {user.role}
              </span>
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
          <Link to="/login" className="btn-primary text-xs py-1.5 px-3.5">
            Sign In
          </Link>
        )}

      </div>

    </header>
  );
}