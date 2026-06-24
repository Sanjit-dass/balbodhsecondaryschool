import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationForm from '../components/NotificationForm';
import ExportActions from '../components/ExportActions';

export default function Notifications() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setList(res.data.notifications || []);
    } catch (err) {
      console.error('Unable to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
    try {
      await api.delete(`/notifications/${id}`);
      window.dispatchEvent(new CustomEvent('notifications:update'));
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  const resend = async (id) => {
    if (!window.confirm('Send this notification again?')) return;
    try {
      await api.post(`/notifications/${id}/send-again`);
      window.dispatchEvent(new CustomEvent('notifications:update'));
      fetch();
      alert('Notification sent again.');
    } catch (err) {
      console.error(err);
      alert('Unable to resend notification.');
    }
  };

  const stats = useMemo(() => ({
    total: list.length,
    drafts: list.filter((item) => item.status === 'draft').length,
    sent: list.filter((item) => item.status === 'sent').length
  }), [list]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">All Notifications</h1>
          <p className="mt-2 text-sm text-slate-500">Review, edit, delete, and resend notifications for your school community.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/admin/notifications/create')} className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            Create Notification
          </button>
          <ExportActions resource="notifications" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Notifications</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Sent</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.sent}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Drafts</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.drafts}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Notification History</h2>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">{loading ? 'Updating...' : 'Latest first'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item._id} className="border-b border-slate-200 transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.title}</td>
                      <td className="px-4 py-4 uppercase tracking-wide text-slate-500">{item.audience}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 space-x-2">
                        <button onClick={() => setSelected(item)} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">View</button>
                        <button onClick={() => setEditing(item)} className="rounded-2xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200">Edit</button>
                        <button onClick={() => resend(item._id)} className="rounded-2xl bg-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-200">Send Again</button>
                        <button onClick={() => remove(item._id)} className="rounded-2xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {editing ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Edit Notification</h2>
                  <p className="text-sm text-slate-500">Update the draft or resend the notification.</p>
                </div>
                <button onClick={() => setEditing(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Close</button>
              </div>
              <NotificationForm existing={editing} onSaved={() => { setEditing(null); fetch(); }} onCancel={() => setEditing(null)} />
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Notification Detail</h2>
              <p className="mt-3 text-sm text-slate-500">Select a notification row to preview details here.</p>
              {selected ? (
                <div className="mt-4 space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">Title</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{selected.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Message</p>
                    <p className="mt-2 text-slate-700 whitespace-pre-line">{selected.message || selected.body}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>Audience: {selected.audience}</div>
                    <div>Priority: {selected.priority}</div>
                    <div>Status: {selected.status}</div>
                    <div>Date: {new Date(selected.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Select a notification to preview its full contents.</div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
