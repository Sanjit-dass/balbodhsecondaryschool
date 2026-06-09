import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/center');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const openNotification = async (note) => {
    setSelected(note);
    if (!note.isRead) {
      try {
        await api.put(`/notifications/${note._id}/read`);
        fetchNotifications();
        window.dispatchEvent(new CustomEvent('notifications:update'));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Notification Center</h1>
          <p className="mt-2 text-sm text-slate-500">All of your unread and read alerts in one place.</p>
        </div>
        <Link to="/admin/notifications" className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
          Manage Notifications
        </Link>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">Loading notifications...</div>
        ) : !notifications.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">No notifications available.</div>
        ) : (
          <div className="grid gap-4">
            {notifications.map((note) => (
              <button
                key={note._id}
                type="button"
                onClick={() => openNotification(note)}
                className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${note.isRead ? 'border-slate-200 bg-white hover:border-indigo-200' : 'border-indigo-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <span>📢</span>
                      <span>{note.title}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{note.message || note.body}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${note.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {note.priority}
                    </div>
                    <div className="text-[11px] text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</div>
                    {!note.isRead && <div className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">Unread</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{selected.title}</h2>
              <p className="text-sm text-slate-500">{new Date(selected.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selected.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{selected.priority}</span>
              {!selected.isRead && <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Unread</span>}
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <p>{selected.message || selected.body}</p>
            {selected.audience && <p className="text-slate-500">Audience: {selected.audience}</p>}
            {selected.classId && <p className="text-slate-500">Class: {selected.classId}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
