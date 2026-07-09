import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../Sidebar';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FaBars, FaTimes, FaPhone, FaEnvelope } from 'react-icons/fa';
import { SCHOOL_INFO, COLORS } from '../../constants/schoolData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../hooks/useTranslate';
import NotificationBell from '../NotificationBell';

const PublicHeader = () => {
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t('home'), path: '/' },
    { label: t('about'), path: '/about' },
    { label: t('academics'), path: '/academics' },
    { label: t('admissions'), path: '/admissions' },
    { label: t('facilities'), path: '/facilities' },
    { label: t('studentLife'), path: '/student-life' },
    { label: t('gallery'), path: '/gallery' },
    { label: t('staff'), path: '/staff' },
    { label: t('contact'), path: '/contact' },
  ];

  const toggleMobileMenu = () => {
    try { console.log('[PublicHeader] toggleMobileMenu before=', isOpen); } catch (e) {}
    setIsOpen(!isOpen);
    try { setTimeout(() => { console.log('[PublicHeader] toggleMobileMenu after=', !isOpen); }, 50); } catch (e) {}
  };

  useEffect(() => {
    try { console.log('[PublicHeader] mobileMenuOpen:', isOpen); } catch (e) {}
  }, [isOpen]);

  const isActive = (path) => location.pathname === path;

  const navigate = useNavigate();
  // No submenus: all nav items link to their full pages

  const handleMobileNavClick = (e, path) => {
    e && e.preventDefault();
    navigate(path);
    setIsOpen(false);
  };

  const { user } = useContext(AuthContext);
  const isPortalRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/teacher') || location.pathname.startsWith('/student') || location.pathname.startsWith('/fee-management') || location.pathname.startsWith('/exam') || location.pathname.startsWith('/account');

  return (
    <>
      <motion.header initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22 }} className="relative z-50">
        {/* Mobile fast bar: logo, centered name/address/ESTD, hamburger */}
        <div className="md:hidden w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white" style={{ zIndex: 2147483647, position: 'fixed', top: 0, left: 0, right: 0 }}>
          <div className="w-full px-0 py-3 flex items-center" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <div className="flex items-center">
              <Link to="/">
                <img src="/logo.png" alt="Bal Bodh Secondary School logo" loading="eager" decoding="sync" fetchpriority="high" className="rounded-md object-cover" style={{ width: '44px', height: '44px', marginLeft: '12px' }} />
              </Link>
            </div>
            <div className="flex-1 text-center px-2">
              <div className="text-[15px] leading-tight font-semibold tracking-wide text-white">{SCHOOL_INFO.name}</div>
              <div className="mobile-location mt-0.5 text-[11px] text-blue-100">{SCHOOL_INFO.address}</div>
              <div className="mt-1"><span className="inline-block text-[11px] text-white font-bold">ESTD. {SCHOOL_INFO.established}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { try { console.log('[PublicHeader] Hamburger clicked (fastbar)'); } catch (e) {} ; toggleMobileMenu(); }} className="p-4 rounded-md bg-blue-800/60 hover:bg-blue-800/80 relative focus:outline-none focus:ring-2 focus:ring-white transition-all active:scale-95" aria-label="Toggle menu" aria-expanded={isOpen} style={{ zIndex: 2147483648, marginRight: '12px' }}>
                {isOpen ? <FaTimes className="w-6 h-6 text-white" /> : <FaBars className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop-only top contact strip: blue background, phone/email left, bell + Sign In right */}
        <div className="hidden md:flex items-center justify-between px-6 py-1 text-sm" style={{ backgroundColor: COLORS.primary, color: '#fff' }}>
          <div className="flex items-center gap-4">
            <FaPhone className="w-4 h-4 text-white" />
            <a href={`tel:${SCHOOL_INFO.phone}`} className="text-white hover:underline">{SCHOOL_INFO.phone}</a>
            <span className="opacity-40 text-white">|</span>
            <FaEnvelope className="w-4 h-4 text-white" />
            <a href={`mailto:${SCHOOL_INFO.email}`} className="text-white hover:underline">{SCHOOL_INFO.email}</a>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <NotificationBell />
            </div>
            {!user ? (
              <Link to="/login" className="px-3 py-1.5 rounded-md font-semibold bg-white" style={{ color: COLORS.primary }}>
                Sign In
              </Link>
            ) : (
              (() => {
                const role = (user.role || '').toLowerCase();
                let dashboardPath = '/';
                if (['superadmin','admin','principal'].includes(role)) dashboardPath = '/admin';
                else if (role === 'student') dashboardPath = '/student';
                else if (role === 'teacher') dashboardPath = '/teacher';
                else if (role === 'parent') dashboardPath = '/parent';
                else if (role === 'accountant') dashboardPath = '/account';
                else if (role === 'examcontroller') dashboardPath = '/exam';
                return (
                  <Link to={dashboardPath} className="px-3 py-1.5 rounded-md font-semibold bg-white" style={{ color: COLORS.primary }}>
                    Dashboard
                  </Link>
                );
              })()
            )}
          </div>
        </div>

        {/* Desktop / wider-screen header row: full navbar with links, logo and CTA */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-transparent">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Bal Bodh Secondary School logo" className="w-12 h-12 object-cover rounded-lg" />
              <div className="hidden lg:block">
                <div className="font-bold text-lg text-slate-900">{SCHOOL_INFO.name}</div>
                <div className="text-xs text-slate-500">ESTD. {SCHOOL_INFO.established}</div>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item, idx) => (
              <Link key={idx} to={item.path} className={`px-4 py-2 text-sm font-medium ${isActive(item.path) ? 'text-blue-700' : 'text-slate-700'} hover:text-blue-600 transition`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={() => changeLanguage('en')} className={`px-3 py-1 rounded-md text-sm font-semibold ${language === 'en' ? 'bg-white text-blue-900' : 'text-slate-700'}`}>EN</button>
              <button onClick={() => changeLanguage('ne')} className={`px-3 py-1 rounded-md text-sm font-semibold ${language === 'ne' ? 'bg-white text-blue-900' : 'text-slate-700'}`}>ने</button>
            </div>

            {/* Notification bell shown in the top strip; removed from main navbar to avoid duplication */}

            <Link to="/admissions" className="ml-2 px-4 py-2 rounded-lg font-semibold text-white" style={{ backgroundColor: COLORS.accent, color: '#000' }}>{t('applyNow')}</Link>
            <button className="lg:hidden text-2xl ml-3 p-2 rounded-md focus:outline-none focus:ring-2" onClick={() => toggleMobileMenu()} aria-label="Toggle menu" aria-expanded={isOpen} style={{ color: COLORS.primary }}>{isOpen ? <FaTimes /> : <FaBars />}</button>
          </div>
        </div>
      </motion.header>
      {/* Mobile full-screen menu to ensure it appears above all content (rendered outside header so it's present on small screens) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="lg:hidden fixed inset-0 bg-black/30"
              style={{ zIndex: 2147483649, pointerEvents: 'auto' }}
              onClick={() => setIsOpen(false)}
            />

            <motion.nav
              key="mobile-menu"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="lg:hidden fixed inset-0"
                style={{ zIndex: 2147483650 }}
              aria-label="Mobile menu"
            >
              <div className="h-full overflow-auto relative" style={{ background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.primary} 40%, ${COLORS.secondary} 100%)` }}>
                {/* Decorative gradient overlays */}
                <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle at 10% 20%, ${COLORS.accent} 0%, transparent 40%)` }}></div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 90% 80%, ${COLORS.accent} 0%, transparent 40%)` }}></div>
                
                {/* Mobile header inside menu: logo + school info */}
                <div className="relative flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: `${COLORS.white}20`, background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}>
                  <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 0%, ${COLORS.accent} 0%, transparent 60%)` }}></div>
                  <Link to="/" onClick={(e) => handleMobileNavClick(e, '/')} className="relative flex items-center gap-3">
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" style={{ backgroundColor: COLORS.accent }}></div>
                      <div className="relative h-14 w-14 rounded-full flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.white}25, ${COLORS.white}10)`, border: `2px solid ${COLORS.accent}50` }}>
                        <img src="/logo.png" alt="Bal Bodh Secondary School logo" loading="eager" decoding="sync" fetchpriority="high" className="h-10 w-10 rounded-full object-contain" width="40" height="40" />
                      </div>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">{SCHOOL_INFO.name}</span>
                      <span className="text-xs text-white/80">Est. {SCHOOL_INFO.established}</span>
                    </div>
                  </Link>
                  <div className="ml-auto flex items-center gap-2">
                    {/* Language Toggle */}
                    <div className="flex items-center gap-1 bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                      <button onClick={() => changeLanguage('en')} className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${language === 'en' ? 'bg-white text-blue-900 shadow-sm' : 'text-white'}`}>EN</button>
                      <button onClick={() => changeLanguage('ne')} className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${language === 'ne' ? 'bg-white text-blue-900 shadow-sm' : 'text-white'}`}>ने</button>
                    </div>
                    { !user ? (
                      <Link
                        to="/login?force=true"
                        onClick={(e) => { setIsOpen(false); }}
                        className="px-4 py-2 rounded-md text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
                        style={{ background: `${COLORS.white}20`, border: `1px solid ${COLORS.white}30`, backdropFilter: 'blur(10px)' }}
                      >
                        LOGIN
                      </Link>
                    ) : (
                      (() => {
                        const role = (user.role || '').toLowerCase();
                        let dashboardPath = '/';
                        if (['superadmin','admin','principal'].includes(role)) dashboardPath = '/admin';
                        else if (role === 'student') dashboardPath = '/student';
                        else if (role === 'teacher') dashboardPath = '/teacher';
                        else if (role === 'parent') dashboardPath = '/parent';
                        else if (role === 'accountant') dashboardPath = '/account';
                        else if (role === 'examcontroller') dashboardPath = '/exam';
                        return (
                          <Link
                            to={dashboardPath}
                            onClick={(e) => { setIsOpen(false); }}
                            className="px-4 py-2 rounded-md text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
                            style={{ background: `${COLORS.white}20`, border: `1px solid ${COLORS.white}30`, backdropFilter: 'blur(10px)' }}
                          >
                            Dashboard
                          </Link>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <div className="relative px-1 py-4">
                  <div className="flex flex-col divide-y" style={{ borderColor: `${COLORS.white}10` }}>
                    {navItems.map((item, idx) => (
                      <div key={idx} className="px-0">
                        <Link to={item.path} onClick={() => setIsOpen(false)} className="group block px-5 py-4 text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${COLORS.white}15, ${COLORS.white}5)`, border: `1px solid ${COLORS.white}25`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                          <span className="flex items-center gap-3">
                            <span className="text-lg">{idx === 0 ? '🏠' : idx === 1 ? 'ℹ️' : idx === 2 ? '📚' : idx === 3 ? '🎓' : idx === 4 ? '🏢' : idx === 5 ? '🎯' : idx === 6 ? '🖼️' : idx === 7 ? '👨‍🏫' : '📞'}</span>
                            <span>{item.label}</span>
                          </span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="relative px-5 pb-8 pt-4">
                  <a
                    href="/admissions"
                    onClick={(e) => handleMobileNavClick(e, '/admissions')}
                    className="w-full inline-flex items-center justify-center py-4 rounded-xl text-white font-semibold shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`, boxShadow: `0 10px 40px ${COLORS.accent}50` }}
                  >
                    {t('applyNow')}
                  </a>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PublicHeader;
