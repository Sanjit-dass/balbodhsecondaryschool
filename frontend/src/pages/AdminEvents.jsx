import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import EventModal from '../components/public/EventModal';
import { useNavigate } from 'react-router-dom';

function Modal({ children, open, onClose }){
  useEffect(()=>{ if(open) document.body.style.overflow = 'hidden'; return ()=> { document.body.style.overflow = ''; }; },[open]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-auto rounded shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-600">Close</button>
        {children}
      </div>
    </div>
  );
}

export default function AdminEvents(){
  const { token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title:'', eventDate:'', shortDescription:'', fullDescription:'', status:'draft', photos:[], coverPhoto: null });
  const [editingId, setEditingId] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(()=>{ fetchList(); },[]);

  async function fetchList(){
    setLoading(true);
    try{
      const res = await api.get('/events-v2/admin/list');
      setEvents(res.data.events || []);
    }catch(err){ console.error(err); setEvents([]); }
    finally{ setLoading(false); }
  }

  function openAdd(){
    setEditingId(null);
    setForm({ title:'', eventDate:'', shortDescription:'', fullDescription:'', status:'draft', photos:[], coverPhoto: null });
    setShowModal(true);
  }

  async function editEvent(id){
    try{
      const res = await api.get(`/events-v2/${id}`);
      const ev = res.data;
      if(!ev) throw new Error('Event not found');
      // normalize photos to { url, publicId, caption }
      const photos = (ev.photos || []).map(p => ({ url: p.url || p.fileUrl || p.path, publicId: p.publicId || p.public_id || null, caption: p.caption || '' })).filter(Boolean);
      const coverPhoto = ev.coverPhoto ? ({ url: ev.coverPhoto.url || ev.coverPhoto.fileUrl || ev.coverPhoto.path, publicId: ev.coverPhoto.publicId || ev.coverPhoto.public_id || null, caption: ev.coverPhoto.caption || '' }) : (photos[0] || null);
      setEditingId(ev._id);
      setForm({ title: ev.title || '', eventDate: ev.eventDate ? new Date(ev.eventDate).toISOString().slice(0,10) : '', shortDescription: ev.shortDescription || '', fullDescription: ev.fullDescription || '', status: ev.status || 'draft', photos, coverPhoto });
      setReadOnly(false);
      setShowModal(true);
    }catch(err){ console.error(err); alert('Failed to load event: ' + (err?.response?.data?.message || err.message)); }
  }

  async function viewEvent(id){
    // navigate to public events page with query param to open unified modal on main page
    navigate(`/events?event=${id}`);
  }

  async function handleFileUpload(file){
    if(!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try{
      const res = await api.post('/uploads', fd);
      const body = res.data || {};
      const source = body.document || body;
      const fileUrlCandidate = (source && (source.fileUrl || source.fileURL || source.secure_url || source.url)) || body.fileUrl || body.secure_url || body.url || null;
      const publicIdCandidate = (source && (source.publicId || source.public_id || source.publicID)) || body.publicId || body.public_id || null;
      const doc = {
        url: fileUrlCandidate,
        publicId: publicIdCandidate,
        caption: (source && (source.originalName || source.original_filename || source.caption)) || body.originalName || body.original_name || ''
      };
      const photos = [...(form.photos||[]), doc];
      const coverPhoto = form.coverPhoto || doc;
      setForm(s=> ({ ...s, photos, coverPhoto }));
    }catch(err){ console.error('upload failed',err); alert('Upload failed: ' + (err?.response?.data?.message || err.message)); }
  }

  async function submitCreate(e){
    e.preventDefault();
    setSubmitting(true);
    try{
      const payload = {
        title: form.title,
        eventDate: form.eventDate || null,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        status: form.status,
        coverPhoto: form.coverPhoto,
        photos: form.photos,
      };
      let res;
      if (editingId) {
        res = await api.put(`/events-v2/${editingId}`, payload);
      } else {
        res = await api.post('/events-v2', payload);
      }
      if(!res || !res.data) throw new Error('Save failed');
      await fetchList();
      setShowModal(false);
    }catch(err){ console.error(err); const msg = err?.response?.data?.message || err.message || 'Failed'; alert('Create failed: ' + msg); }
    finally{ setSubmitting(false); }
  }

  async function remove(id){ if(!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return; try{ await api.delete(`/events-v2/${id}`); await fetchList(); }catch(err){ alert('Delete failed: ' + (err?.response?.data?.message || err.message)); } }

  const totalEvents = events.length;
  const publishedCount = events.filter(e=> e.status === 'published').length;
  const draftCount = events.filter(e=> e.status === 'draft').length;
  const totalPhotos = events.reduce((s,e)=> s + ((e.photos && e.photos.length) || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">World-Class Events Management</h1>
          <p className="text-slate-500 mt-1">Manage upcoming events, photos, publish status and public listings.</p>
        </div>
        <div>
          <button onClick={openAdd} className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-lg shadow">Add Event</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Total Events</div>
          <div className="text-2xl font-bold text-slate-900">{totalEvents}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Published Events</div>
          <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Draft Events</div>
          <div className="text-2xl font-bold text-amber-600">{draftCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Total Event Photos</div>
          <div className="text-2xl font-bold text-blue-600">{totalPhotos}</div>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="card-premium bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Cover Photo</th>
                <th className="px-4 py-3 text-left">Event Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Photos</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev._id} className="border-t hover:bg-blue-50">
                  <td className="px-4 py-3">
                    <div className="w-14 h-14 rounded overflow-hidden bg-gray-100">
                      <img alt="cover" src={(ev.coverPhoto && (ev.coverPhoto.url || ev.coverPhoto.fileUrl)) || (ev.photos && ev.photos[0] && (ev.photos[0].url || ev.photos[0].fileUrl)) || '/placeholder.png'} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">{ev.title}</td>
                  <td className="px-4 py-3">{ev.category || ev.type || '-'}</td>
                  <td className="px-4 py-3">{(ev.photos && ev.photos.length) || 0}</td>
                  <td className="px-4 py-3">
                    {ev.status === 'published' ? <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">published</span> : <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">draft</span>}
                  </td>
                  <td className="px-4 py-3">{ev.updatedAt ? new Date(ev.updatedAt).toISOString().slice(0,10) : (ev.createdAt ? new Date(ev.createdAt).toISOString().slice(0,10) : '')}</td>
                  <td className="px-4 py-3 text-right">
                    <button title="View" onClick={()=> viewEvent(ev._id)} className="inline-flex items-center justify-center mr-2 w-9 h-9 rounded bg-white border text-slate-600 hover:bg-slate-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3C6 3 2.73 5.11 1 8c1.73 2.89 5 5 9 5s7.27-2.11 9-5c-1.73-2.89-5-5-9-5zM10 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
                    </button>
                    <button title="Edit" onClick={()=> editEvent(ev._id)} className="inline-flex items-center justify-center mr-2 w-9 h-9 rounded bg-blue-600 text-white hover:bg-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/></svg>
                    </button>
                    <button title="Delete" onClick={()=> remove(ev._id)} className="inline-flex items-center justify-center w-9 h-9 rounded bg-red-500 text-white hover:bg-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={()=> setShowModal(false)}>
        <form onSubmit={submitCreate}>
          <h2 className="text-xl font-semibold mb-4">Add Event</h2>
          <div className="grid grid-cols-1 gap-3">
            <input required value={form.title} onChange={e=> setForm(s=> ({ ...s, title: e.target.value }))} placeholder="Title" className="border p-2 rounded" disabled={readOnly} />
            <input required type="date" value={form.eventDate} onChange={e=> setForm(s=> ({ ...s, eventDate: e.target.value }))} className="border p-2 rounded" disabled={readOnly} />
            <input value={form.shortDescription} onChange={e=> setForm(s=> ({ ...s, shortDescription: e.target.value }))} placeholder="Short description" className="border p-2 rounded" disabled={readOnly} />
            <textarea rows={6} value={form.fullDescription} onChange={e=> setForm(s=> ({ ...s, fullDescription: e.target.value }))} placeholder="Full description" className="border p-2 rounded" disabled={readOnly} />

            <div>
              <label className="block text-sm font-medium mb-1">Photos</label>
              <div className="flex gap-2 mb-2">
                {(form.photos||[]).map((p, i)=> (
                  <div key={i} className="w-24 h-24 bg-gray-100 rounded overflow-hidden relative">
                    <img src={p.url || p.fileUrl || p.secure_url || p.path} alt="photo" className="w-full h-full object-cover" />
                    <button type="button" onClick={()=> setForm(s=> ({ ...s, photos: s.photos.filter((_,idx)=> idx!==i), coverPhoto: s.coverPhoto === p ? null : s.coverPhoto }))} className="absolute top-1 right-1 text-white bg-red-500 rounded-full px-1">x</button>
                  </div>
                ))}
                <div className="w-24 h-24 flex items-center justify-center border rounded relative">
                  <input ref={fileRef} onChange={e=> { if(e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = null; }} type="file" accept="image/*" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                  <div className="text-sm text-gray-500">Upload</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Hint: first uploaded image becomes cover. Click delete to remove.</div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2"><input type="radio" checked={form.status==='draft'} onChange={()=> setForm(s=> ({ ...s, status:'draft' }))} /> Draft</label>
              <label className="flex items-center gap-2"><input type="radio" checked={form.status==='published'} onChange={()=> setForm(s=> ({ ...s, status:'published' }))} /> Published</label>
            </div>

            <div className="flex justify-end gap-3">
              {readOnly ? (
                <button type="button" onClick={()=> setShowModal(false)} className="px-4 py-2 border rounded">Close</button>
              ) : (
                <>
                  <button type="button" onClick={()=> setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">{submitting? 'Saving...':'Save Event'}</button>
                </>
              )}
            </div>
          </div>
        </form>
      </Modal>
      { /* Admin no longer opens inline modal; navigation handled by viewEvent -> /events?event=id */ }
    </div>
  );
}
