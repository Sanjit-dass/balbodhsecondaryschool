import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaChalkboardTeacher, FaMoneyBillWave, FaClipboardList, FaShieldAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import { COLORS } from '../constants/schoolData';
const bgImage = '/images/schoolphoto.png';
import { AuthContext } from '../contexts/AuthContext';

const LOGIN_REDIRECT = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
  accountant: '/account/dashboard',
  examcontroller: '/exam/dashboard',
  parent: '/parent/dashboard',
  superadmin: '/admin/dashboard',
  principal: '/admin/dashboard'
};

export default function Login() {
  const { login, user, isAuthenticated } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const navigate = useNavigate();
  const loginFormRef = React.useRef(null);
  const emailInputRef = React.useRef(null);

  const selectedRole = searchParams.get('role');
  const ROLE_NAMES = {
    student: 'Student login',
    teacher: 'Teacher login',
    accountant: 'Accountant login',
    examcontroller: 'Exam Controller login',
    admin: 'Admin login',
    superadmin: 'Admin login',
    principal: 'Admin login',
    parent: 'Parent login',
  };
  
  const PORTAL_INFO = {
    student: {
      title: '🎓 Student Login',
      description: 'Enter your credentials for student login.',
      subDescription: 'Only Student accounts are allowed.',
      badgeIcon: '🎓',
      badgeText: 'Student Portal',
      badgeColor: COLORS.accent
    },
    teacher: {
      title: '👨‍🏫 Teacher Login',
      description: 'Enter your credentials for teacher login.',
      subDescription: 'Only Faculty accounts are allowed.',
      badgeIcon: '👨‍🏫',
      badgeText: 'Faculty Portal',
      badgeColor: COLORS.secondary
    },
    accountant: {
      title: '💰 Accountant Login',
      description: 'Enter your credentials for accountant login.',
      subDescription: 'Only Accountant accounts are allowed.',
      badgeIcon: '💰',
      badgeText: 'Accountant Portal',
      badgeColor: COLORS.success
    },
    examcontroller: {
      title: '📋 Exam Controller Login',
      description: 'Enter your credentials for exam controller login.',
      subDescription: 'Only Exam Controller accounts are allowed.',
      badgeIcon: '📋',
      badgeText: 'Exam Controller Portal',
      badgeColor: COLORS.primary
    },
    admin: {
      title: '⚙️ Admin Login',
      description: 'Enter your credentials for admin login.',
      subDescription: 'Only Admin accounts are allowed.',
      badgeIcon: '⚙️',
      badgeText: 'Administrator Portal',
      badgeColor: COLORS.error
    }
  };
  
  const validRole = selectedRole && ROLE_NAMES[selectedRole] ? selectedRole : null;
  const roleTitle = validRole ? ROLE_NAMES[validRole] : null;
  const portalInfo = validRole ? PORTAL_INFO[validRole] : null;
  const roleWarning = selectedRole && !validRole ? 'This login shortcut is not recognized. Use a valid portal shortcut or the generic login page.' : null;
  
  // Force re-render when role changes
  useEffect(() => {
    if (selectedRole !== currentRole) {
      setCurrentRole(selectedRole);
    }
  }, [selectedRole, currentRole]);

  const forceShow = searchParams.get('force') === 'true';

  useEffect(() => {
    // When `force=true` is present in the query we should show the login form
    // even when the user already has an authenticated session (useful for
    // mobile sidebar 'Login' action which should bring up the portal).
    if (!forceShow && isAuthenticated && user?.role) {
      navigate(LOGIN_REDIRECT[user.role] || '/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate, forceShow]);

  // Smooth scroll to login form and auto-focus email when role is selected
  useEffect(() => {
    if (validRole && loginFormRef.current) {
      // Smooth scroll to login form
      loginFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Auto-focus email input after scroll completes
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 500);
    }
  }, [validRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password, remember, validRole);
      
      // Validate that the logged-in user's role matches the selected portal
      if (validRole && loggedInUser.role !== validRole) {
        setError('Access Denied. This account does not belong to the selected portal. Please select the correct login portal.');
        setSubmitting(false);
        return;
      }
      
      navigate(LOGIN_REDIRECT[loggedInUser.role] || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      key={selectedRole || 'default'}
      className="relative min-h-screen text-slate-100"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            `linear-gradient(135deg, ${COLORS.primary}50, ${COLORS.secondary}40, ${COLORS.dark}60)`,
            `linear-gradient(225deg, ${COLORS.secondary}50, ${COLORS.accent}40, ${COLORS.dark}60)`,
            `linear-gradient(315deg, ${COLORS.accent}50, ${COLORS.primary}40, ${COLORS.dark}60)`,
            `linear-gradient(135deg, ${COLORS.primary}50, ${COLORS.secondary}40, ${COLORS.dark}60)`
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      ></motion.div>
      
      {/* Top-left Home link */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 z-30 rounded-2xl px-3 py-2 shadow-xl"
        style={{ backgroundColor: `${COLORS.dark}90`, backdropFilter: 'blur(10px)' }}
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors">
          <span>←</span> Back to Home
        </Link>
      </motion.div>
      
      {/* Decorative floating elements - playful bubbles */}
      <motion.div 
        className="absolute top-20 right-10 w-20 h-20 rounded-full"
        animate={{ 
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 360]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{ backgroundColor: `${COLORS.accent}40`, backdropFilter: 'blur(10px)' }}
      ></motion.div>
      <motion.div 
        className="absolute top-40 right-32 w-14 h-14 rounded-full"
        animate={{ 
          y: [0, -40, 0],
          scale: [1, 0.8, 1],
          rotate: [360, 0]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
        style={{ backgroundColor: `${COLORS.secondary}40`, backdropFilter: 'blur(10px)' }}
      ></motion.div>
      <motion.div 
        className="absolute bottom-32 left-20 w-16 h-16 rounded-full"
        animate={{ 
          y: [0, -25, 0],
          scale: [1, 1.3, 1],
          rotate: [0, -360]
        }}
        transition={{ 
          duration: 4.5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
        style={{ backgroundColor: `${COLORS.primary}40`, backdropFilter: 'blur(10px)' }}
      ></motion.div>
      <motion.div 
        className="absolute bottom-20 left-48 w-12 h-12 rounded-full"
        animate={{ 
          y: [0, -35, 0],
          scale: [1, 1.1, 1],
          rotate: [180, 540]
        }}
        transition={{ 
          duration: 3.5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1.5
        }}
        style={{ backgroundColor: `${COLORS.success}40`, backdropFilter: 'blur(10px)' }}
      ></motion.div>
      <motion.div 
        className="absolute top-60 left-16 w-10 h-10 rounded-full"
        animate={{ 
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
        style={{ backgroundColor: `${COLORS.error}40`, backdropFilter: 'blur(10px)' }}
      ></motion.div>
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative rounded-[32px] z-20 w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.dark}95, ${COLORS.dark}85)`,
            border: `1px solid ${COLORS.white}10`,
            backdropFilter: 'blur(30px)',
            boxShadow: `0 30px 60px -15px ${COLORS.dark}80, 0 0 100px -30px ${COLORS.accent}30`
          }}
        >
          <div className="relative grid gap-0 grid-cols-1 lg:grid-cols-2">
            {/* Left Panel - Login Shortcuts */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 lg:p-12"
              style={{ 
                backgroundColor: `${COLORS.dark}90`,
                borderRight: `1px solid ${COLORS.white}10`
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mb-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
                  className="mb-6"
                >
                  <img src="/logo.png" alt="Balbodh School" className="h-16 w-auto rounded-full shadow-2xl" style={{ boxShadow: `0 0 30px ${COLORS.accent}40` }} />
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-2xl lg:text-3xl font-bold text-white leading-tight"
                >
                  BAL BODH SECONDARY SCHOOL
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="mt-3 text-sm lg:text-base leading-relaxed" 
                  style={{ color: COLORS.slate }}
                >
                  Choose your portal to sign in
                </motion.p>
              </motion.div>

              <div className="space-y-3">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-xs uppercase tracking-[0.3em] font-semibold mb-4" 
                    style={{ color: COLORS.accent }}
                  >
                    Quick Access
                  </motion.p>
                  <div className="grid gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                      whileHover={{ 
                        scale: 1.05, 
                        x: 10,
                        rotate: [-2, 2, -2]
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/login?role=student"
                        className="flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-white transition-all duration-300 cursor-pointer"
                        style={{ 
                          borderColor: `${COLORS.white}15`, 
                          backgroundColor: `${COLORS.dark}80`,
                          hoverBackgroundColor: `${COLORS.accent}20`
                        }}
                      >
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg" 
                          style={{ backgroundColor: `${COLORS.accent}25` }}
                        >
                          <FaUserGraduate className="h-5 w-5" style={{ color: COLORS.accent }} />
                        </motion.div>
                        <span>Student</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 }}
                      whileHover={{ 
                        scale: 1.05, 
                        x: 10,
                        rotate: [-2, 2, -2]
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/login?role=teacher"
                        className="flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-white transition-all duration-300 cursor-pointer"
                        style={{ borderColor: `${COLORS.white}15`, backgroundColor: `${COLORS.dark}80` }}
                      >
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg" 
                          style={{ backgroundColor: `${COLORS.secondary}25` }}
                        >
                          <FaChalkboardTeacher className="h-5 w-5" style={{ color: COLORS.secondary }} />
                        </motion.div>
                        <span>Faculty</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.9 }}
                      whileHover={{ 
                        scale: 1.05, 
                        x: 10,
                        rotate: [-2, 2, -2]
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/login?role=accountant"
                        className="flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-white transition-all duration-300 cursor-pointer"
                        style={{ borderColor: `${COLORS.white}15`, backgroundColor: `${COLORS.dark}80` }}
                      >
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg" 
                          style={{ backgroundColor: `${COLORS.success}25` }}
                        >
                          <FaMoneyBillWave className="h-5 w-5" style={{ color: COLORS.success }} />
                        </motion.div>
                        <span>Accountant</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.0 }}
                      whileHover={{ 
                        scale: 1.05, 
                        x: 10,
                        rotate: [-2, 2, -2]
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/login?role=examcontroller"
                        className="flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-white transition-all duration-300 cursor-pointer"
                        style={{ borderColor: `${COLORS.white}15`, backgroundColor: `${COLORS.dark}80` }}
                      >
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg" 
                          style={{ backgroundColor: `${COLORS.primary}25` }}
                        >
                          <FaClipboardList className="h-5 w-5" style={{ color: COLORS.primary }} />
                        </motion.div>
                        <span>Exam Controller</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.1 }}
                      whileHover={{ 
                        scale: 1.05, 
                        x: 10,
                        rotate: [-2, 2, -2]
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/login?role=admin"
                        className="flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-white transition-all duration-300 cursor-pointer"
                        style={{ borderColor: `${COLORS.white}15`, backgroundColor: `${COLORS.dark}80` }}
                      >
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg" 
                          style={{ backgroundColor: `${COLORS.error}25` }}
                        >
                          <FaShieldAlt className="h-5 w-5" style={{ color: COLORS.error }} />
                        </motion.div>
                        <span>Admin</span>
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Panel - Login Form */}
            <motion.div 
              ref={loginFormRef}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-8 lg:p-12"
              style={{ 
                backgroundColor: `${COLORS.dark}85`
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mb-8"
              >
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-xs uppercase tracking-[0.2em] font-semibold mb-4" 
                  style={{ color: COLORS.slate }}
                >
                  Secure sign in
                </motion.p>
                {portalInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 150 }}
                    className="mb-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
                    style={{ 
                      backgroundColor: `${portalInfo.badgeColor}20`,
                      border: `2px solid ${portalInfo.badgeColor}40`
                    }}
                  >
                    <span className="text-2xl">{portalInfo.badgeIcon}</span>
                    <span className="text-sm font-bold" style={{ color: portalInfo.badgeColor }}>
                      {portalInfo.badgeText}
                    </span>
                  </motion.div>
                )}
                <motion.h2 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: portalInfo ? 0.7 : 0.6, type: "spring", stiffness: 120 }}
                  className="text-2xl lg:text-3xl font-bold text-white leading-tight"
                >
                  {portalInfo?.title || 'Sign In'}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: portalInfo ? 0.8 : 0.7 }}
                  className="mt-3 text-sm lg:text-base" 
                  style={{ color: COLORS.slate }}
                >
                  {portalInfo?.description || 'Enter your credentials to access your dashboard'}
                </motion.p>
                {portalInfo?.subDescription && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="mt-2 text-xs lg:text-sm italic" 
                    style={{ color: COLORS.slate }}
                  >
                    {portalInfo.subDescription}
                  </motion.p>
                )}
              </motion.div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 rounded-xl border p-4 text-sm" 
                  style={{ borderColor: `${COLORS.error}30`, backgroundColor: `${COLORS.error}15`, color: COLORS.white }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.slate }}>Email</label>
                  <div className="relative">
                    <motion.span 
                      className="absolute inset-y-0 left-4 flex items-center" 
                      style={{ color: COLORS.slate }}
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <FaEnvelope />
                    </motion.span>
                    <motion.input
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-xl border pl-12 pr-4 py-3.5 text-white outline-none transition-all duration-300 focus:ring-2 disabled:cursor-not-allowed"
                      style={{ 
                        borderColor: `${COLORS.white}15`, 
                        backgroundColor: `${COLORS.dark}70`,
                        focusRingColor: COLORS.accent
                      }}
                      whileFocus={{ scale: 1.02 }}
                      disabled={submitting}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <div className="flex items-center justify-between text-sm font-semibold mb-2" style={{ color: COLORS.slate }}>
                    <label>Password</label>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9, rotate: -10 }}
                      type="button"
                      className="hover:text-white transition-colors duration-200"
                      style={{ color: COLORS.accent }}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </motion.button>
                  </div>
                  <div className="relative">
                    <motion.span 
                      className="absolute inset-y-0 left-4 flex items-center" 
                      style={{ color: COLORS.slate }}
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <FaLock />
                    </motion.span>
                    <motion.input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border pl-12 pr-4 py-3.5 text-white outline-none transition-all duration-300 focus:ring-2 disabled:cursor-not-allowed"
                      style={{ 
                        borderColor: `${COLORS.white}15`, 
                        backgroundColor: `${COLORS.dark}70`,
                        focusRingColor: COLORS.accent
                      }}
                      whileFocus={{ scale: 1.02 }}
                      disabled={submitting}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="flex items-center justify-between text-sm" 
                  style={{ color: COLORS.slate }}
                >
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <motion.input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-2 focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed transition-all duration-200"
                      style={{ 
                        borderColor: `${COLORS.white}20`, 
                        backgroundColor: COLORS.dark, 
                        focusRingColor: COLORS.accent,
                        accentColor: COLORS.accent
                      }}
                      whileTap={{ scale: 1.2 }}
                    />
                    <span className="font-medium">Remember me</span>
                  </label>
                  <Link
                    to={`/forgot-password${selectedRole ? `?role=${selectedRole}` : ''}`}
                    className="font-semibold hover:text-white transition-colors duration-200"
                    style={{ color: COLORS.accent }}
                  >
                    Forgot password?
                  </Link>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: `0 15px 40px ${COLORS.accent}50`,
                    rotate: [-1, 1, -1]
                  }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                    boxShadow: `0 10px 30px ${COLORS.accent}30`
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    validRole ? `Sign In as ${portalInfo?.badgeText || roleTitle}` : 'Sign In'
                  )}
                </motion.button>
              </form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="mt-6 text-center text-sm"
                style={{ color: COLORS.slate }}
              >
                Contact your administrator to create a new account
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
