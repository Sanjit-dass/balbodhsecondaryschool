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
import { COLORS, SCHOOL_INFO } from '../constants/schoolData';

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
        { path: '/admin/subjects', label: 'Subjects', icon: FaBook },
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
      title: 'Main',
      items: [
        { path: '/student/dashboard', label: 'Dashboard', icon: FaTachometerAlt }
      ]
    },
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
          <div className="relative flex min-h-full w-full flex-col overflow-y-auto slide-down scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" style={{ 
            zIndex: 2147483647, 
            background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.primary} 40%, ${COLORS.secondary} 100%)`,
            boxShadow: '-8px 0 30px rgba(2,6,23,0.06)' 
          }}>
              {/* Decorative gradient overlays */}
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle at 10% 20%, ${COLORS.accent} 0%, transparent 40%)` }}></div>
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 90% 80%, ${COLORS.accent} 0%, transparent 40%)` }}></div>
              
              {/* Premium Header with School Branding */}
              <div className="relative p-6 pb-8" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}>
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 0%, ${COLORS.accent} 0%, transparent 60%)` }}></div>
                <div className="relative flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" style={{ backgroundColor: COLORS.accent }}></div>
                      <div className="relative h-16 w-16 rounded-full flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.white}25, ${COLORS.white}10)`, border: `2px solid ${COLORS.accent}50` }}>
                        <img 
                          src="/logo.png" 
                          alt="Bal Bodh Secondary School Logo" 
                          className="h-12 w-12 rounded-full object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">{SCHOOL_INFO.name}</h1>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg" style={{ 
                          background: `linear-gradient(135deg, ${COLORS.accent}30, ${COLORS.accent}15)`, 
                          color: COLORS.accent, 
                          border: `1px solid ${COLORS.accent}50`,
                          backdropFilter: 'blur(10px)'
                        }}>
                          Est. {SCHOOL_INFO.established}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-3 rounded-xl relative transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl" style={{ background: `${COLORS.white}20`, border: `1px solid ${COLORS.white}30`, backdropFilter: 'blur(10px)' }}>
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                
                {/* Subtitle */}
                <p className="relative text-sm text-white/90 font-semibold tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {user?.role === 'student' ? 'Student Portal' : 
                   user?.role === 'teacher' ? 'Teacher Portal' :
                   user?.role === 'accountant' ? 'Accountant Portal' :
                   user?.role === 'examcontroller' ? 'Exam Controller Portal' :
                   user?.role === 'parent' ? 'Parent Portal' :
                   user ? 'Admin Panel' : 'Main Menu'}
                </p>
              </div>

            <nav className="relative flex-1 px-4 pb-6 space-y-2 text-sm md:text-base">
              { !user ? (
                // Guest (public website) mobile nav with premium styling
                <>
                  <Link to="/" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">🏠</span>
                      <span>Home</span>
                    </span>
                  </Link>
                  <Link to="/about" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">ℹ️</span>
                      <span>About</span>
                    </span>
                  </Link>
                  <Link to="/academics" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">📚</span>
                      <span>Academics</span>
                    </span>
                  </Link>
                  <Link to="/admissions" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">🎓</span>
                      <span>Admissions</span>
                    </span>
                  </Link>
                  <Link to="/facilities" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <span>Facilities</span>
                    </span>
                  </Link>
                  <Link to="/student-life" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">🎯</span>
                      <span>Student Life</span>
                    </span>
                  </Link>
                  <Link to="/gallery" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">🖼️</span>
                      <span>Gallery</span>
                    </span>
                  </Link>
                  <Link to="/staff" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">👨‍🏫</span>
                      <span>Staff</span>
                    </span>
                  </Link>
                  <Link to="/contact" onClick={onClose} className="group block py-4 px-5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg">📞</span>
                      <span>Contact</span>
                    </span>
                  </Link>

                    <div className="mt-8">
                    <Link to="/admissions" onClick={onClose} className="inline-block w-full text-center font-semibold px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`, boxShadow: `0 10px 40px ${COLORS.accent}50` }}>
                      Apply Now
                    </Link>
                  </div>
                </>
              ) : (
                // Logged-in portals: render the role-specific menu groups (flattened)
                menuGroups.map((group) => (
                  <div key={group.title} className="mb-3">
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    >
                      <span className="text-[12px]">{group.title}</span>
                      <svg className={`w-5 h-5 transition-transform ${openGroups.has(group.title) ? 'rotate-90' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M6 6L14 10L6 14V6Z" /></svg>
                    </button>
                    <ul className={`mt-2 space-y-2 pl-0 transition-all ${openGroups.has(group.title) ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      {group.items.map((item) => (
                        <li key={item.path}>
                          <Link to={item.path} onClick={onClose} className="group flex items-center gap-3 py-3.5 px-5 rounded-xl text-white font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                            {typeof item.icon === 'function' ? React.createElement(item.icon, { size: 20, className: '', style: { color: COLORS.accent } }) : null}
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </nav>

            {user && (
              <div className="mt-4 px-4 pb-6 pt-4 border-t" style={{ borderColor: `${COLORS.white}20` }}>
                <button
                  type="button"
                  onClick={() => { onClose(); if (onLogoutRequest) onLogoutRequest(); }}
                  className="w-full rounded-xl px-6 py-4 text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ backgroundColor: `${COLORS.error}80`, border: `1px solid ${COLORS.error}40`, backdropFilter: 'blur(10px)' }}
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
              <div className="text-xs text-slate-400">
                {user?.role === 'student' ? 'Student Portal' : 
                 user?.role === 'teacher' ? 'Teacher Portal' :
                 user?.role === 'accountant' ? 'Accountant Portal' :
                 user?.role === 'examcontroller' ? 'Exam Controller Portal' :
                 user?.role === 'parent' ? 'Parent Portal' :
                 user ? 'Admin Panel' : 'Main Menu'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 py-2">
          <nav className="space-y-4 mt-16 lg:mt-0">
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
