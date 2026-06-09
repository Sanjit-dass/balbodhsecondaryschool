import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationForm from '../../components/NotificationForm';

export default function CreateNotification() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Create Notification</h1>
          <p className="mt-2 text-sm text-slate-500">Send announcements, reminders, and alerts to your school community.</p>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <NotificationForm
            onSaved={() => {
              window.dispatchEvent(new CustomEvent('notifications:update'));
              navigate('/admin/notifications');
            }}
          />
        </div>
      </div>
    </div>
  );
}
