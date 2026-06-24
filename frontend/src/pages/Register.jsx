import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
const bgImage = '/images/schoolphoto.png';

const allRoles = [
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'examcontroller', label: 'Exam Controller' },
  { value: 'admin', label: 'Admin' },
  { value: 'principal', label: 'Founder' },
  { value: 'superadmin', label: 'Super Admin' }
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'student';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please complete all fields before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/create-user', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });
      setSuccess(`Account created for ${role.charAt(0).toUpperCase() + role.slice(1)} successfully.`);
      setName('');
      setEmail('');
      setPassword('');
      setRole(defaultRole);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Bal Bodh Secondary School</h1>
          <p className="mt-2 text-lg font-bold text-indigo-300">Create account</p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-lg">Register to access your school dashboard.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[20px] z-20"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(2,6,23,0.35)'
          }}
        >
          <div className="relative grid gap-6 lg:grid-cols-[420px_auto] p-6 sm:p-8 lg:p-10">
            <div className="rounded-[2rem] bg-transparent p-6 ring-1 ring-white/8 shadow-xl shadow-slate-950/20">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Create account</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Bal Bodh Secondary School</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">Create student, parent, or staff accounts. Only administrators can add new users.</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm font-semibold text-white">Quick tips</p>
                  <p className="mt-2 text-sm text-slate-400">Use a valid school email and a strong password. Only admin, founder, or superadmin can access this page.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] bg-transparent p-8 ring-1 ring-white/8 shadow-2xl shadow-black/20 transform transition hover:-translate-y-1">
              <div className="mb-6 text-center">
                <img src="/logo.png" alt="Balbodh School" className="mx-auto h-20 w-auto rounded-full mb-4" />
                <h2 className="mt-2 text-2xl font-semibold text-white">Create your account</h2>
                <p className="mt-2 text-sm text-slate-400">Register once and the system will route you to the correct dashboard after verification.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
              )}
              {success && (
                <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{success}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Full name</label>
                  <div className="relative mt-3">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><FaUser /></span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="mt-0 w-full rounded-3xl border border-white/10 bg-slate-900/90 pl-12 pr-4 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/30"
                      disabled={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Email address</label>
                  <div className="relative mt-3">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><FaEnvelope /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@balbodhschool.com"
                      className="mt-0 w-full rounded-3xl border border-white/10 bg-slate-900/90 pl-12 pr-4 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/30"
                      disabled={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Password</label>
                  <div className="relative mt-3">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><FaLock /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-0 w-full rounded-3xl border border-white/10 bg-slate-900/90 pl-12 pr-4 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/30"
                      disabled={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Role</label>
                  <div className="relative mt-3">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/30"
                    >
                      {allRoles.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-xl transition transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Creating…' : 'Create account'}
                </button>

                <div className="text-center text-sm text-slate-400">
                  Already have an account? <button type="button" onClick={() => window.location.href = '/login'} className="text-indigo-300 hover:text-white font-semibold">Sign in</button>
                </div>
              </form>
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
        </motion.div>
      </div>
    </div>
  );
}

