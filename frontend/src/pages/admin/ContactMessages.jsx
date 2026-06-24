import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
];

const SUBJECT_OPTIONS = [
  { value: '', label: 'All Subjects' },
  { value: 'admission', label: 'Admission' },
  { value: 'fees', label: 'Fees' },
  { value: 'academics', label: 'Academics' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'other', label: 'Other' },
];

export default function ContactMessages() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get('/contact', {
        params: {
          page,
          limit,
          status: statusFilter || undefined,
          subject: subjectFilter || undefined,
          search: search || undefined,
        },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load contact messages', err);
      setError(err?.response?.data?.message || 'Failed to load contact messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, statusFilter, subjectFilter]);

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/contact/${id}`, { status });
      fetchList();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error('Failed to update contact message', err);
      alert(err?.response?.data?.message || 'Failed to update message status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact message? This cannot be undone.')) return;
    try {
      await api.delete(`/contact/${id}`);
      fetchList();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error('Failed to delete contact message', err);
      alert(err?.response?.data?.message || 'Failed to delete message.');
    }
  };

  const toggleDetails = (id) => {
    setSelectedId((current) => (current === id ? null : id));
  };

  const currentPageCount = items.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contact Messages</h2>
          <p className="mt-1 text-sm text-slate-600">Manage inquiries sent from the public contact page.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => { setPage(1); setSubjectFilter(e.target.value); }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Search</label>
            <div className="flex gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or message"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => { setPage(1); fetchList(); }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading contact messages...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-slate-600">No contact messages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Subject</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <React.Fragment key={item._id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-700">{item.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 break-words max-w-xs">{item.email}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 capitalize">{item.subject || 'Other'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.status === 'new' ? 'bg-amber-100 text-amber-700' : item.status === 'read' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {item.status || 'new'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleDetails(item._id)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
                        >
                          {selectedId === item._id ? 'Hide' : 'Details'}
                        </button>
                        {item.status === 'new' && (
                          <button
                            type="button"
                            onClick={() => handleAction(item._id, 'read')}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
                          >
                            Mark Read
                          </button>
                        )}
                        {item.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleAction(item._id, 'archived')}
                            className="rounded-lg bg-slate-700 px-3 py-2 text-white hover:bg-slate-800"
                          >
                            Archive
                          </button>
                        )}
                        {item.status === 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleAction(item._id, 'new')}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {selectedId === item._id && (
                      <tr className="bg-slate-50">
                        <td colSpan="6" className="px-4 py-4 text-sm text-slate-700">
                          <div className="space-y-3">
                            <div>
                              <div className="font-semibold">Message</div>
                              <p className="whitespace-pre-wrap text-slate-700 mt-2">{item.message}</p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <div>
                                <div className="font-semibold">Phone</div>
                                <p>{item.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <div className="font-semibold">IP Address</div>
                                <p>{item.ipAddress || 'N/A'}</p>
                              </div>
                              <div>
                                <div className="font-semibold">User Agent</div>
                                <p className="break-words">{item.userAgent || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
          <div>
            Showing {currentPageCount} of {total} messages
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
