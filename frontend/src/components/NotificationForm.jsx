import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ResponsiveSelect from './ResponsiveSelect';

const DEFAULT_FORM = {
  title: '',
  message: '',
  audience: 'all',
  classId: '',
  priority: 'Medium',
  status: 'draft'
};

export default function NotificationForm({ existing, onSaved, onCancel }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        message: existing.message || existing.body || '',
        audience: existing.audience || 'all',
        classId: existing.classId || '',
        priority: existing.priority || 'Medium',
        status: existing.status || 'draft'
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [existing]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data.classes || res.data || []);
      } catch (err) {
        console.error('Unable to load classes', err);
      }
    };
    fetchClasses();
  }, []);

  const saveNotification = async (status) => {
    if (!form.title.trim() || !form.message.trim()) {
      alert('Please enter both a title and a message.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        status,
        classId: form.audience === 'specificClass' ? form.classId : null
      };

      if (existing && existing._id) {
        await api.put(`/notifications/${existing._id}`, payload);
      } else {
        await api.post('/notifications', payload);
      }

      window.dispatchEvent(new CustomEvent('notifications:update'));
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert('Could not save notification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Notification Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            placeholder="Enter a strong notification title"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Notification Message *</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            placeholder="Write the message for your recipients."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Audience *</label>
            <ResponsiveSelect
              value={form.audience}
              onChange={(v) => setForm({ ...form, audience: v, classId: '' })}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'students', label: 'Students' },
                { value: 'teachers', label: 'Teachers' },
                { value: 'parents', label: 'Parents' },
                { value: 'specificClass', label: 'Specific Class' }
              ]}
              placeholder="Audience"
            />
          </div>

          {form.audience === 'specificClass' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Class *</label>
              <ResponsiveSelect
                value={form.classId}
                onChange={(v) => setForm({ ...form, classId: v })}
                options={[{ value: '', label: 'Select class' }, ...(classes||[]).map(c => ({ value: c._id, label: c.name }))]}
                placeholder="Select class"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Priority *</label>
            <ResponsiveSelect
              value={form.priority}
              onChange={(v) => setForm({ ...form, priority: v })}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Urgent', label: 'Urgent' }
              ]}
              placeholder="Priority"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Current status: <span className="font-semibold text-slate-900">{form.status}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => saveNotification('draft')}
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => saveNotification('sent')}
              disabled={saving}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
