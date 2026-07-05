import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function AccountSettings() {
  const { user, updateProfile } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    department: '',
    designation: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        address: user.profile?.address || '',
        department: user.profile?.department || '',
        designation: user.profile?.designation || ''
      }));
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
    setMessage('');
  };

  const saveProfile = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

      try {
      const payload = {
        name: form.name,
        email: form.email,
        profile: {
          phone: form.phone,
          address: form.address,
          department: form.department,
          designation: form.designation
        }
      };


      if (form.password) {
        payload.currentPassword = form.currentPassword;
        payload.password = form.password;
      }

      await updateProfile(payload);
      setMessage('Your account settings have been updated successfully.');
      setForm((prev) => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async () => {
    // removed: profile photos are no longer managed from account settings
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveProfile();
  };

  return (
    <div className="space-y-6 select-none font-sans">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Keep your login email and password secure. Change them here anytime.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Logged in as <span className="font-semibold text-slate-900">{user?.role}</span>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full name</label>
              <input
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email address</label>
              <input
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="balbodh@gmail.com"
                type="email"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</label>
              <input
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</label>
              <input
                value={form.address}
                onChange={handleChange('address')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Home or work address"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department</label>
              <input
                value={form.department}
                onChange={handleChange('department')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Department or class"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Designation</label>
              <input
                value={form.designation}
                onChange={handleChange('designation')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Designation or role details"
              />
            </div>
          </div>

          {/* Profile picture removed from account settings */}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Change password</p>
            <p className="text-xs text-slate-500">Leave blank if you do not want to change your password.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current password</label>
              <input
                value={form.currentPassword}
                onChange={handleChange('currentPassword')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                type="password"
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">New password</label>
              <input
                value={form.password}
                onChange={handleChange('password')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                type="password"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confirm new password</label>
            <input
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              type="password"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving changes...' : 'Save account settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
