import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const selectedRole = searchParams.get('role');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const res = await api.post('/auth/forgot', { email: normalizedEmail });
      setMessage(res.data.message || 'If the email exists, password reset instructions will be sent.');
      setResetLink(res.data.resetLink || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process request. Please try again.');
      setResetLink('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_100px_-60px_rgba(255,255,255,0.5)] backdrop-blur-xl"
        >
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Password recovery</p>
            <h2 className="mt-4 text-4xl font-semibold text-white">Forgot your password?</h2>
            <p className="mt-3 text-sm text-slate-400">
              Enter the email address associated with your account. We will send you instructions to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {message}
              {resetLink && (
                <div className="mt-3 break-words">
                  <p className="font-semibold">Reset link:</p>
                  <a href={resetLink} target="_blank" rel="noreferrer" className="text-indigo-200 underline">
                    {resetLink}
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@balbodhschool.com"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/90 px-5 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending reset link…' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-400">
            Remembered your password?{' '}
            <Link
              to={`/login${selectedRole ? `?role=${selectedRole}` : ''}`}
              className="font-semibold text-indigo-300 hover:text-white"
            >
              Back to login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
