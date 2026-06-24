import React, { useContext, useState, useEffect } from 'react';
import {
  FaTachometerAlt,
  FaUsers,
  FaUserTie,
  FaBook,
  FaClipboardList,
  FaMoneyBillWave,
  FaImage,
  FaBell,
  FaEnvelope,
  FaCogs,
  FaSignOutAlt,
  FaChartBar,
  FaCalendarAlt,
  FaAward,
  FaBuilding,
  FaLayerGroup,
  FaFileInvoiceDollar,
  FaRegAddressCard
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ROLE_MENU = {
  admin: [
    {
      title: 'Main',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt }
      ]
    },
    {
      title: 'Student Management',
      items: [
        { path: '/admin/students', label: 'Students', icon: FaUsers },
        { path: '/admin/admissions', label: 'Admissions', icon: FaRegAddressCard },
        { path: '/admin/attendance', label: 'Attendance', icon: FaClipboardList }
      ]
    },
    {
      title: 'Academic',
      items: [
        { path: '/admin/results', label: 'Results', icon: FaChartBar },
        { path: '/admin/exams', label: 'Exams', icon: FaClipboardList },
        { path: '/admin/assignments', label: 'Assignments', icon: FaClipboardList },
        { path: '/admin/admit-cards', label: 'Admit Card', icon: FaFileInvoiceDollar }
      ]
    },
    {
      title: 'Fees & Finance',
      items: [
        { path: '/fee-management/dashboard', label: 'Fee Workspace', icon: FaChartBar },
        { path: '/fee-management/categories', label: '📋Fee Categories', icon: FaLayerGroup },
        { path: '/fee-management/collect', label: '💰Fee Collection', icon: FaMoneyBillWave },
        { path: '/fee-management/history', label: '📜Payment History', icon: FaChartBar },
        { path: '/fee-management/reports', label: '📈Reports', icon: FaChartBar }
      ]
    },
    {
      title: 'Media & Content',
      items: [
        { path: '/admin/photo-gallery', label: 'Photo Gallery', icon: FaImage },
        { path: '/admin/events', label: 'Upcoming Events', icon: FaCalendarAlt },
        { path: '/admin/student-achievements', label: 'Student Achievements', icon: FaAward },
        { path: '/admin/school-leadership', label: 'School Leadership', icon: FaBuilding },
        { path: '/admin/facilities', label: 'World-Class Facilities', icon: FaLayerGroup }
      ]
    },
    {
      title: 'Communication',
      items: [
        { path: '/admin/notifications/create', label: 'Create Notification', icon: FaBell },
        { path: '/admin/notifications', label: 'All Notifications', icon: FaBell },
        { path: '/admin/notices', label: 'Notices', icon: FaBell },
        { path: '/admin/contact-messages', label: 'Contact Messages', icon: FaEnvelope },
        { path: '/admin/uploads', label: 'Important Documents', icon: FaFileInvoiceDollar },
        // Notification center removed from admin communication menu
      ]
    },
    {
      title: 'Staff Management',
      items: [
        { path: '/admin/teachers', label: 'Teachers', icon: FaUserTie },
        
      ]
    },
    {
      title: 'System / Settings',
      items: [
        { path: '/admin/user-roles', label: 'User Roles', icon: FaUsers },
        { path: '/admin/settings', label: 'Account Settings', icon: FaCogs },
        { path: '/logout', label: 'Logout', icon: FaSignOutAlt }
      ]
    }
  ],
  teacher: [
    {
      title: 'Teacher Tools',
      items: [
        { path: '/teacher/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
        { path: '/teacher/attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { path: '/teacher/assignments', label: 'Assignments', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        { path: '/teacher/results', label: 'Students Report', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' }
      ]
    },
    {
      title: 'Support',
      items: [
        { path: '/teacher/settings', label: 'Account Settings', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
      ]
    }
  ],
  student: [
    {
      title: 'Fees',
      items: [
        { path: '/fees/overview', label: 'Fee Overview', icon: FaFileInvoiceDollar },
        { path: '/fees/overview/receipt', label: 'Fee Receipt', icon: FaFileInvoiceDollar }
      ]
    },
    {
      title: 'Student Menu',
      items: [
        { path: '/student/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
        { path: '/student/attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { path: '/student/assignments', label: 'Assignments', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        { path: '/student/results', label: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
        { path: '/student/admit-card', label: 'Admit Card', icon: 'M5 13l4 4L19 7' },
        { path: '/student/settings', label: 'Account Settings', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
      ]
    }
  ],
  accountant: [
    {
      title: 'Finance',
      items: [
        { path: '/account/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
        { path: '/fee-management/dashboard', label: '📊Dashboard', icon: FaChartBar },
        { path: '/fee-management/categories', label: '📋Fee Categories', icon: FaLayerGroup },
        { path: '/admin/fees/collect', label: '💰Fee Collection', icon: FaMoneyBillWave },
        { path: '/fee-management/history', label: '📜Payment History', icon: FaChartBar },
        { path: '/fee-management/reports', label: '📈Reports', icon: FaChartBar }
      ]
    },
    {
      title: 'Academic Operations',
      items: [
        { path: '/account/admit-cards', label: 'Admit Card', icon: 'M5 13l4 4L19 7' }
      ]
    },
    
  ],
  examcontroller: [
    {
      title: 'Exam Control',
      items: [
        { path: '/exam/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
        { path: '/exam/exams', label: 'Exams', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { path: '/exam/admit-card', label: 'Admit Card', icon: 'M5 13l4 4L19 7' },
        { path: '/exam/results', label: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
        { path: '/exam/settings', label: 'Account Settings', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
      ]
    }
  ],
  parent: [
    {
      title: 'Parent Access',
      items: [
        { path: '/parent/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
        { path: '/parent/settings', label: 'Settings', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
      ]
    }
  ]
};

const GUEST_MENU = [
  {
    title: 'Main',
    items: [
      { path: '/', label: 'Home' },
      { path: '/about', label: 'About' },
      { path: '/admissions', label: 'Admissions' },
      { path: '/contact', label: 'Contact' }
    ]
  }
];

export default function Sidebar({ isOpen, onClose, onLogoutRequest }){
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [openGroups, setOpenGroups] = useState(() => new Set());

  // Debugging: log open state and menu groups
  React.useEffect(() => {
    try { console.log('[Sidebar] isOpen=', isOpen, 'menuGroups=', menuGroups.map(g=>g.title)); } catch (e) {}
  }, [isOpen]);

  // Fallback to 'admin' menu when a specific role mapping isn't present
  const menuGroups = user ? (ROLE_MENU[user.role] || ROLE_MENU['admin'] || []) : GUEST_MENU;

  // Auto-expand all groups when the sidebar opens so guests see items immediately
  useEffect(() => {
    if (!menuGroups || !menuGroups.length) return;
    if (isOpen) {
      // For guest (public) menu, auto-expand so items are immediately visible.
      // For logged-in portal users, keep groups collapsed so they behave like dropdowns.
      if (!user) {
        setOpenGroups(new Set(menuGroups.map(g => g.title)));
      } else {
        setOpenGroups(new Set());
      }
    } else {
      setOpenGroups(new Set());
    }
  }, [isOpen, menuGroups]);

  useEffect(() => {
    try { console.log('[Sidebar] mobileMenuUser=', !!user, 'isOpen=', isOpen); } catch (e) {}
  }, [user, isOpen]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) => {
      // For logged-in portal users behave like single-open dropdowns
      if (user) {
        const next = new Set();
        if (!prev.has(title)) next.add(title); // open this one, close others
        return next;
      }
      // For guests allow multiple groups open
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <>
      {isOpen && (
        <div 
          onClick={() => { if (typeof window !== 'undefined' && window.__ignoreSidebarOverlay) return; onClose(); }} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          style={{ zIndex: 2147483646, pointerEvents: 'auto' }}
        />
      )}

      {/* Mobile full-screen menu (slide-down) - only for small screens */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 flex" style={{ zIndex: 2147483647, pointerEvents: 'auto' }}>
          <div className="relative flex min-h-full w-full flex-col bg-[#FAFAFB] text-slate-900 p-4 overflow-y-auto slide-down scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" style={{ zIndex: 2147483647, boxShadow: '-8px 0 30px rgba(2,6,23,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="logo" className="h-10 w-10 rounded-md object-contain bg-white p-1 shadow-sm" />
                  <div>
                    <div className="font-extrabold text-lg text-slate-900">Bal Bodh</div>
                    <div className="text-xs text-slate-500">Admin Panel</div>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-md bg-white/80 hover:bg-white">
                  <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

            <nav className="flex-1 space-y-3 text-base">
              { !user ? (
                // Guest (public website) mobile nav
                <>
                  <Link to="/" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Home</Link>
                  <Link to="/about" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">About</Link>
                  <Link to="/academics" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Academics</Link>
                  <Link to="/admissions" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Admissions</Link>
                  <Link to="/facilities" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Facilities</Link>
                  <Link to="/student-life" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Student Life</Link>
                  <Link to="/gallery" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Gallery</Link>
                  <Link to="/staff" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Staff</Link>
                  <Link to="/contact" onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 transition">Contact</Link>

                    <div className="mt-6">
                    <Link to="/apply" onClick={onClose} className="inline-block w-full text-center bg-indigo-600 text-white font-semibold px-4 py-3 rounded-lg shadow-sm">Apply Now</Link>
                  </div>
                </>
              ) : (
                // Logged-in portals: render the role-specific menu groups (flattened)
                menuGroups.map((group) => (
                  <div key={group.title} className="mb-3">
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-md text-xs font-semibold uppercase tracking-wide text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      <span className="text-[12px]">{group.title}</span>
                      <svg className={`w-4 h-4 transition-transform ${openGroups.has(group.title) ? 'rotate-90' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M6 6L14 10L6 14V6Z" /></svg>
                    </button>
                    <ul className={`mt-2 space-y-2 pl-0 transition-all ${openGroups.has(group.title) ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      {group.items.map((item) => (
                        <li key={item.path}>
                          <Link to={item.path} onClick={onClose} className="block py-3 px-3 rounded-lg bg-white text-slate-800 hover:bg-indigo-50 text-sm shadow-sm">{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </nav>

            {user && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { onClose(); if (onLogoutRequest) onLogoutRequest(); }}
                  className="w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-200 border-r border-slate-800 p-4 flex flex-col transition-transform duration-300 ease-in-out transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 lg:z-0 h-[calc(100vh-4.5rem)]`}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="logo" className="h-10 w-10 rounded-md object-contain" />
            <div>
              <div className="font-bold text-lg leading-tight text-white">Bal Bodh</div>
              <div className="text-xs text-slate-400">{user ? 'Admin Panel' : 'Main Menu'}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 py-2">
          <nav className="space-y-4">
            {menuGroups.map((group) => (
              <div key={group.title} className="">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800/40 transition-colors"
                >
                  <span className="uppercase tracking-wider text-[11px] text-slate-400">{group.title}</span>
                  <svg className={`w-4 h-4 transition-transform ${openGroups.has(group.title) ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M6 6L14 10L6 14V6Z" /></svg>
                </button>

                <ul className={`mt-2 space-y-1 pl-2 transition-all ${openGroups.has(group.title) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-60 overflow-hidden'}`}>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        {item.path === '/logout' ? (
                          <button
                            onClick={() => { onClose(); if (onLogoutRequest) onLogoutRequest(); }}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                              ${isActive 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                                : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'}`}
                          >
                            <span className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                              {typeof item.icon === 'function' ? React.createElement(item.icon, { size: 16 }) : null}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        ) : (
                          (() => {
                            // Compute dynamic target path for fee collection links so that
                            // when viewing a student the admin can jump directly to collecting for that student.
                            let to = item.path;
                            try {
                              // Admin collect route: include ?student= when on /admin/fees/student/:id
                              if (item.path === '/admin/fees/collect' && location.pathname.startsWith('/admin/fees/student/')) {
                                const parts = location.pathname.split('/');
                                const sid = parts[parts.length - 1];
                                if (sid) to = `/admin/fees/collect?student=${encodeURIComponent(sid)}`;
                              }
                              // Fee-management collect route: include studentId when on /fee-management/student/:id
                              if (item.path === '/fee-management/collect' && location.pathname.startsWith('/fee-management/student/')) {
                                const parts = location.pathname.split('/');
                                const sid = parts[parts.length - 1];
                                if (sid) to = `/fee-management/collect?studentId=${encodeURIComponent(sid)}`;
                              }
                            } catch (e) { /* ignore */ }

                            return (
                              <Link 
                                to={to}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive 
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'}`}>
                                <span className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                  {typeof item.icon === 'function' ? React.createElement(item.icon, { size: 16 }) : null}
                                </span>
                                <span>{item.label}</span>
                              </Link>
                            );
                          })()
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
