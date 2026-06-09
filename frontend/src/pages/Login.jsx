import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaChalkboardTeacher, FaMoneyBillWave, FaClipboardList, FaShieldAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import bgImage from '../images/schoolphoto.png';
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
  const navigate = useNavigate();

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
  const validRole = selectedRole && ROLE_NAMES[selectedRole] ? selectedRole : null;
  const roleTitle = validRole ? ROLE_NAMES[validRole] : null;
  const roleWarning = selectedRole && !validRole ? 'This login shortcut is not recognized. Use a valid portal shortcut or the generic login page.' : null;

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(LOGIN_REDIRECT[user.role] || '/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      navigate(LOGIN_REDIRECT[loggedInUser.role] || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-slate-100"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">BAL BODH SECONDARY SCHOOL</h1>
          <p className="mt-2 text-lg font-bold text-indigo-300">Login Portal</p>
          <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">A smart digital school management system</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-lg">
            Sign in with your school credentials to access your authorized dashboard.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[20px] z-20"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(2,6,23,0.6)'
          }}
        >
          <div className="relative grid gap-6 lg:grid-cols-[420px_auto] p-6 sm:p-8 lg:p-10">
            <div className="rounded-[2rem] bg-slate-950/90 p-6 ring-1 ring-white/10 shadow-xl shadow-slate-950/30">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Unified portal</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">BAL BODH SECONDARY SCHOOL</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Secure access for admin, teachers, students, accountants and exam controllers with crisp role isolation.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm font-semibold text-white">Login shortcuts</p>
                  <div className="mt-4 grid gap-3">
                    <Link
                      to="/login?role=student"
                      className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition"
                    >
                      <FaUserGraduate className="h-5 w-5 text-indigo-300" />
                      Student login
                    </Link>
                    <Link
                      to="/login?role=teacher"
                      className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition"
                    >
                      <FaChalkboardTeacher className="h-5 w-5 text-violet-300" />
                      Faculty login
                    </Link>
                    <Link
                      to="/login?role=accountant"
                      className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition"
                    >
                      <FaMoneyBillWave className="h-5 w-5 text-emerald-300" />
                      Accountant login
                    </Link>
                    <Link
                      to="/login?role=examcontroller"
                      className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition"
                    >
                      <FaClipboardList className="h-5 w-5 text-cyan-300" />
                      Exam controller login
                    </Link>
                    <Link
                      to="/login?role=admin"
                      className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition"
                    >
                      <FaShieldAlt className="h-5 w-5 text-rose-300" />
                      Admin login
                    </Link>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm font-semibold text-white">Why this login is better</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-400">
                    <li>• Single entry page. No role selector.</li>
                    <li>• Auto redirect after authentication.</li>
                    <li>• JWT stores role and protects every route.</li>
                    <li>• Clean, modern and mobile-friendly layout.</li>
                  </ul>
                </div>
                <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm font-semibold text-white">Fast access</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">Admin dashboard</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">Student portal</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">Teacher tools</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">Finance workspace</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] bg-white/6 p-6 ring-1 ring-white/10 shadow-2xl shadow-black/40 transform transition hover:-translate-y-1">
              <div className="mb-8 text-center">
                <img src="/logo.png" alt="Balbodh School" className="mx-auto h-20 w-auto rounded-full mb-4" />
                <span className="text-xs uppercase tracking-[0.35em] text-indigo-300">Secure sign in</span>
                <h2 className="mt-4 text-3xl font-semibold text-white">
                  {roleTitle || 'Email and password only'}
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                  {roleTitle
                    ? `Enter your credentials for ${roleTitle.toLowerCase()}. The system still redirects by your authenticated role.`
                    : 'Enter your credentials once. The system will detect your role and redirect you to the correct dashboard.'}
                </p>
                {roleWarning && (
                  <div className="mt-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900">
                    {roleWarning}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Email address</label>
                  <div className="relative mt-3">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@balbodhschool.com"
                      className="mt-0 w-full rounded-3xl border border-white/10 bg-slate-900/90 pl-12 pr-4 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/30"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <label>Password</label>
                    <button
                      type="button"
                      className="text-indigo-300 hover:text-white"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative mt-3">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-0 w-full rounded-3xl border border-white/10 bg-slate-900/90 pl-12 pr-4 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/30"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-400"
                    />
                    Remember me
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-500 text-sm">Contact your administrator to create a new account.</span>
                    <Link
                      to={`/forgot-password${selectedRole ? `?role=${selectedRole}` : ''}`}
                      className="text-indigo-300 hover:text-white font-semibold text-sm">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-xl transition transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 flex justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
