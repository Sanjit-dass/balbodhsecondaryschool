import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/auth/reset/${token}`, { password });
      setMessage(res.data.message || 'Password has been reset successfully.');
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
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
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Reset password</p>
            <h2 className="mt-4 text-4xl font-semibold text-white">Set a new password</h2>
            <p className="mt-3 text-sm text-slate-400">
              Enter your new password below to finish resetting your account password.
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
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/90 px-5 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/90 px-5 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Resetting password…' : 'Reset password'}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-400">
            <Link
              to="/login"
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
