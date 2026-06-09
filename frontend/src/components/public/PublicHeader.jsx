import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBars, FaTimes, FaPhone, FaEnvelope, FaChevronDown } from 'react-icons/fa';
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
    {
      label: t('academics'),
      path: '/academics',
      submenu: [
        { label: t('curriculum'), path: '/academics' },
        { label: t('classes'), path: '/academics' },
        { label: t('programs'), path: '/academics' },
      ],
    },
    { label: t('admissions'), path: '/admissions' },
    { label: t('facilities'), path: '/facilities' },
    {
      label: t('studentLife'),
      path: '/student-life',
      submenu: [
        { label: t('sports'), path: '/student-life' },
        { label: t('activities'), path: '/student-life' },
        { label: t('clubs'), path: '/student-life' },
      ],
    },
    { label: t('gallery'), path: '/gallery' },
    { label: t('staff'), path: '/staff' },
    { label: t('contact'), path: '/contact' },
  ];

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Info Bar */}
      <div className="hidden md:block relative z-[9998] bg-gradient-to-r from-blue-900 via-sky-800 to-cyan-700 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <FaPhone className="text-yellow-300" size={14} />
              <span>{SCHOOL_INFO.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaEnvelope className="text-yellow-300" size={14} />
              <span>{SCHOOL_INFO.email}</span>
            </div>
          </div>
          <div className="relative flex items-center gap-3">
            <NotificationBell />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-all"
            >
              LOGIN
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <motion.header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-xl'
            : 'bg-white shadow-lg'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & School Name */}
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src="/logo.png"
                alt="Bal Bodh Secondary School Logo"
                className="h-14 w-14 object-contain rounded-lg shadow-md"
              />
              <div className="hidden md:flex flex-col">
                <h1 className="font-bold text-blue-900 text-xl leading-none">
                  Bal Bodh
                </h1>
                <h1 className="font-bold text-blue-900 text-xl leading-none">
                  Secondary School
                </h1>
              </div>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <div key={index} className="relative group">
                  <Link
                    to={item.path}
                    className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-gray-700 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: isActive(item.path)
                        ? COLORS.secondary
                        : 'transparent',
                    }}
                  >
                    {item.label}
                    {item.submenu && (
                      <FaChevronDown size={12} className="mt-0.5" />
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.submenu && (
                    <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2">
                      {item.submenu.map((subitem, subindex) => (
                        <Link
                          key={subindex}
                          to={subitem.path}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Button + Language Toggle */}
            <div className="hidden lg:flex items-center gap-4">
              {/* LANGUAGE TOGGLE */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                    language === 'en'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('ne')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                    language === 'ne'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ने
                </button>
              </div>

              <Link
                to="/admissions"
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: COLORS.accent,
                  color: '#000',
                }}
              >
                {t('applyNow')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-2xl"
              style={{ color: COLORS.primary }}
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isOpen ? 'auto' : 0,
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden"
          >
            <nav className="flex flex-col gap-2 py-4 border-t mt-4">
              {navItems.map((item, index) => (
                <div key={index}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                    style={{
                      backgroundColor: isActive(item.path)
                        ? COLORS.secondary
                        : 'transparent',
                    }}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 flex flex-col gap-1 mt-1">
                      {item.submenu.map((subitem, subindex) => (
                        <Link
                          key={subindex}
                          to={subitem.path}
                          onClick={() => setIsOpen(false)}
                          className="text-sm text-gray-600 hover:text-blue-600 py-1"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* LANGUAGE TOGGLE - Mobile */}
              <div className="px-4 py-3 border-t mt-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 rounded-lg bg-slate-100 text-gray-700 text-sm font-medium hover:bg-slate-200 transition"
                >
                  {t('login') || 'Login'}
                </Link>
              </div>
              <div className="px-4 py-3 border-t mt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">{t('language')}</p>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setIsOpen(false);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all duration-300 ${
                      language === 'en'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('ne');
                      setIsOpen(false);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all duration-300 ${
                      language === 'ne'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ने
                  </button>
                </div>
              </div>

              <Link
                to="/admissions"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg font-semibold text-center text-white"
                style={{ backgroundColor: COLORS.accent, color: '#000' }}
              >
                {t('applyNow')}
              </Link>
            </nav>
          </motion.div>
        </div>
      </motion.header>
    </>
  );
};

export default PublicHeader;
