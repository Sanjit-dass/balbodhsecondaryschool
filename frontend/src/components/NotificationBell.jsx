import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const ADMIN_ROLES = ['superadmin','admin','principal','accountant','examcontroller'];

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const wrapperRef = useRef();
  const ignoreClickRef = useRef(false);

  const fetchNotifications = async () => {
    try {
      const [latestRes, countRes] = await Promise.all([
        api.get('/notifications/latest'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(latestRes.data.notifications || []);
      setCount(countRes.data.count || 0);
    } catch (err) {
      console.error('Unable to load notifications', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:update', handler);
    return () => window.removeEventListener('notifications:update', handler);
  }, [user]);

  useEffect(() => {
    const pageClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', pageClick);
    return () => document.removeEventListener('pointerdown', pageClick);
  }, []);

  const handleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('notifications:update'));
    } catch (err) {
      console.error('Unable to mark notification read', err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('notifications:update'));
    } catch (err) {
      console.error('Unable to mark notifications read', err);
    }
  };

  const allLink = ADMIN_ROLES.includes(user?.role) ? '/admin/notifications' : '/notifications/center';

  if (!user) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onPointerDown={(e) => { ignoreClickRef.current = true; setOpen(o => !o); }}
        onClick={(e) => { if (ignoreClickRef.current) { ignoreClickRef.current = false; return; } setOpen(o => !o); }}
        className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-3 md:py-2 md:px-3 text-slate-700 shadow-md hover:shadow-lg hover:bg-slate-50 transition transform active:scale-95 touch-manipulation min-w-[44px] min-h-[44px]"
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="text-2xl leading-none">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white shadow-sm">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed left-3 right-3 sm:absolute sm:left-auto sm:right-6 z-50 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
          style={{ willChange: 'transform' }}
        >
          {/* Mobile: nearly full-width fixed panel with side margins; Desktop: anchored to the right with larger fixed widths */}
          <div className="w-full sm:w-[24rem] md:w-[32rem] lg:w-[48rem] xl:w-[56rem] px-4 mx-auto">
            <div className="px-4 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Latest Notifications</p>
                  <p className="text-xs text-slate-500">Recent alerts from the notification center</p>
                </div>
                <button onClick={handleMarkAll} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Mark All As Read</button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {!notifications.length ? (
                <div className="p-4 text-sm text-slate-500">No new notifications.</div>
              ) : (
                notifications.map((note) => (
                  <button
                    key={note._id}
                    type="button"
                    onClick={() => handleRead(note._id)}
                    className={`w-full text-left px-4 py-3 transition ${note.isRead ? 'bg-white hover:bg-slate-50' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                        <p className="mt-1 text-sm text-slate-600 break-words whitespace-normal">{note.message || note.body}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${note.isRead ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white'}`}>
                        {note.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      {note.priority === 'Urgent' && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">Urgent</span>}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="grid gap-2 p-4 border-t border-slate-200 bg-slate-50">
              <Link to={allLink} onClick={() => setOpen(false)} className="inline-flex justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                View All Notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
