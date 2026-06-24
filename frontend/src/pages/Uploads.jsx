import React, { useState, useEffect } from 'react';
import api from '../services/api';

const uploadTypes = [
  { value: 'routine', label: 'Routine' },
  { value: 'fee-structure', label: 'Fee Structure' },
  { value: 'timetable', label: 'Timetable' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'other', label: 'Other' }
];

export default function Uploads(){
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('routine');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('published');
  const [editAudience, setEditAudience] = useState('public');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setDocLoading(true);
    try {
      const res = await api.get('/uploads');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error(err);
    }
    setDocLoading(false);
  };

  const handle = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please choose a file first.');
      return;
    }

    if (uploadType === 'other' && !title.trim()) {
      alert('Please enter a title for the document when using Other type.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', uploadType);
    fd.append('title', title.trim() || uploadTypes.find(type => type.value === uploadType)?.label || file.name);
    fd.append('description', description);

    setLoading(true);
    try {
      const res = await api.post(`/uploads?folder=${encodeURIComponent(uploadType)}`, fd);
      setUrl(res.data.fileUrl || res.data.url);
      setFile(null);
      setTitle('');
      setDescription('');
      alert('Upload successful');
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
    setLoading(false);
  };

  const handleEdit = (doc) => {
    setEditingId(doc._id);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setEditStatus(doc.status || 'published');
    setEditAudience(doc.audience || 'public');
  };

  const handleUpdateDocument = async () => {
    try {
      await api.patch(`/uploads/${editingId}`, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        audience: editAudience
      });
      alert('Document updated');
      setEditingId(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      try {
        await api.delete(`/uploads/${id}`);
        alert('Document deleted');
        fetchDocuments();
      } catch (err) {
        console.error(err);
        alert('Delete failed');
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Uploads</h1>
      <form onSubmit={handle} className="bg-white p-6 shadow rounded-lg space-y-4 max-w-xl mb-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Type</label>
          <select
            value={uploadType}
            onChange={e => setUploadType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          >
            {uploadTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

            {uploadType === 'other' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter a title for this upload"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add an optional note or details"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">File</label>
          <input type="file" onChange={e => setFile(e.target.files[0])} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload & Submit'}
          </button>
          {file && <span className="text-sm text-slate-600">Selected file: {file.name}</span>}
        </div>
      </form>

      {url && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="font-semibold text-slate-800">Upload completed</p>
          <p className="text-sm text-slate-600">Type: {uploadTypes.find(type => type.value === uploadType)?.label || uploadType}</p>
          {title && <p className="text-sm text-slate-600">Title: {title}</p>}
          {description && <p className="text-sm text-slate-600">Description: {description}</p>}
          <div className="mt-2">Uploaded: <a href={url} target="_blank" rel="noreferrer" className="text-blue-600">{url}</a></div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
        {docLoading ? (
          <p className="text-slate-600">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-slate-600">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc._id} className="bg-white p-4 rounded shadow border border-slate-200 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                  {doc.description && <p className="text-sm text-slate-600">{doc.description}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded">{doc.type}</span>
                    <span className="px-2 py-1 bg-slate-100 rounded">{doc.status}</span>
                    <span className="px-2 py-1 bg-slate-100 rounded">{doc.audience}</span>
                    {doc.size && <span className="px-2 py-1 bg-slate-100 rounded">{Math.round(doc.size / 1024)} KB</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(doc)}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Edit Document</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Audience</label>
              <select
                value={editAudience}
                onChange={e => setEditAudience(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-slate-300 text-slate-900 rounded hover:bg-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
