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
      <div className="mb-4 md:mb-6 flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Notification Center</h1>
          <p className="mt-1 md:mt-2 text-xs md:text-sm text-slate-500">All of your unread and read alerts in one place.</p>
        </div>
        <Link to="/admin/notifications" className="inline-flex items-center justify-center rounded-xl md:rounded-2xl bg-indigo-600 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
          Manage Notifications
        </Link>
      </div>

      <div className="grid gap-3 md:gap-4">
        {loading ? (
          <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 md:p-6 text-center text-slate-500 shadow-sm text-xs md:text-sm">Loading notifications...</div>
        ) : !notifications.length ? (
          <div className="rounded-2xl md:rounded-3xl border border-dashed border-slate-300 bg-white p-6 md:p-8 text-center text-slate-500 shadow-sm text-xs md:text-sm">No notifications available.</div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {notifications.map((note) => (
              <button
                key={note._id}
                type="button"
                onClick={() => openNotification(note)}
                className={`w-full rounded-2xl md:rounded-3xl border p-3 md:p-5 text-left shadow-sm transition ${note.isRead ? 'border-slate-200 bg-white hover:border-indigo-200' : 'border-indigo-200 bg-slate-50 hover:bg-slate-100'}`}>
                <div className="flex items-start justify-between gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 text-base md:text-lg font-semibold text-slate-900">
                      <span className="text-lg md:text-xl">📢</span>
                      <span className="truncate">{note.title}</span>
                    </div>
                    <p className="mt-2 md:mt-3 text-xs md:text-sm leading-5 md:leading-6 text-slate-600 line-clamp-2 md:line-clamp-none">{note.message || note.body}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 md:gap-2 shrink-0">
                    <div className={`rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold ${note.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {note.priority}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</div>
                    {!note.isRead && <div className="rounded-full bg-indigo-600 px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] font-semibold text-white">Unread</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-4 md:mt-6 rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">{selected.title}</h2>
              <p className="text-xs md:text-sm text-slate-500">{new Date(selected.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className={`rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold ${selected.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{selected.priority}</span>
              {!selected.isRead && <span className="rounded-full bg-indigo-600 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold text-white">Unread</span>}
            </div>
          </div>
          <div className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-xs md:text-sm leading-6 md:leading-7 text-slate-700">
            <p>{selected.message || selected.body}</p>
            {selected.audience && <p className="text-slate-500">Audience: {selected.audience}</p>}
            {selected.classId && <p className="text-slate-500">Class: {selected.classId}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
