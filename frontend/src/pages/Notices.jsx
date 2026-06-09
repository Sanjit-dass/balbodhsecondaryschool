import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { getInlineViewUrl } from '../services/fileViewService';
import NoticeForm from '../components/NoticeForm';
import ExportActions from '../components/ExportActions';

export default function Notices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // or 'table'

  const categories = [
    'All',
    'Admissions',
    'Holidays',
    'Events',
    'Academics',
    'General'
  ];

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete notice?')) return;

    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotices =
    selectedCategory === 'All'
      ? notices
      : notices.filter((n) => n.category === selectedCategory);

  return (
    <div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notices</h1>
          <p className="text-slate-500 mt-1">Manage school notices and announcements</p>
        </div>
        <div>
          <button onClick={() => navigate(-1)} className="px-3 py-2 bg-gray-200 rounded mr-2">Back</button>
          <button onClick={() => navigate('/admin')} className="px-3 py-2 bg-indigo-600 text-white rounded">Dashboard</button>
        </div>
      </div>


      {/* Form */}
      <div className="mb-6">
        <NoticeForm
          existing={editing}
          onSaved={() => {
            setEditing(null);
            fetchNotices();
          }}
        />
      </div>

      {/* Notice List */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">No notices found in this category.</div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4">
          {filteredNotices.map((n, index) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 flex justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-bold text-lg text-slate-800">{n.title}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{n.category}</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{n.audience} • {n.publishedAt ? new Date(n.publishedAt).toLocaleString() : '—'}</div>
                <div className="text-slate-700">{n.body}</div>
                {n.attachments && n.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {n.attachments.map((a, idx) => {
                      const url = a?.fileUrl || a?.url || a;
                      const lower = (url || '').toLowerCase();
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/.test(lower);
                      return isImage ? (
                        <a key={idx} href={getInlineViewUrl(url)} target="_blank" rel="noreferrer" className="block">
                          <img src={getInlineViewUrl(url)} alt={`attachment-${idx}`} className="max-w-[160px] max-h-32 object-cover rounded" />
                        </a>
                      ) : (
                        <a key={idx} href={getInlineViewUrl(url)} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded text-sm text-blue-600">View Attachment</a>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setEditing(n)} className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition">Edit</button>
                <button onClick={() => remove(n._id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Publish Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.map((n) => (
                <tr key={n._id} className="border-t">
                  <td className="px-4 py-3">{n.title}</td>
                  <td className="px-4 py-3">{n.category}</td>
                  <td className="px-4 py-3">{n.audience}{n.audience==='specificClass' && n.targetClassName ? ` • ${n.targetClassName}` : ''}</td>
                  <td className="px-4 py-3">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{n.expiryDate ? new Date(n.expiryDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{n.priority || 'Medium'}</td>
                  <td className="px-4 py-3">
                    {n.status === 'published' && (!n.expiryDate || new Date(n.expiryDate) > new Date()) && <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Published</span>}
                    {(!n.status || n.status === 'draft') && <span className="px-2 py-1 rounded text-xs bg-gray-100 text-slate-700">Draft</span>}
                    {n.expiryDate && new Date(n.expiryDate) <= new Date() && <span className="px-2 py-1 rounded text-xs bg-red-100 text-rose-700">Expired</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setEditing(n)} className="px-2 py-1 bg-yellow-400 rounded text-xs">Edit</button>
                      <button onClick={()=>remove(n._id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                      <button onClick={async ()=>{ try{ await api.put(`/notices/${n._id}`, { status: n.status==='published' ? 'draft' : 'published' }); fetchNotices(); }catch(e){console.error(e)} }} className="px-2 py-1 bg-slate-700 text-white rounded text-xs">{n.status==='published' ? 'Unpublish' : 'Publish'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}