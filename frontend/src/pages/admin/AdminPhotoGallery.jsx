import React, { useEffect, useState, useRef } from 'react';
import { SectionTitle } from '../../components/public/SectionComponents';
import { GALLERY_CATEGORIES } from '../../constants/schoolData';
import { apiBaseURL, getImageUrl, API_BASE } from '../../services/api';
import ResponsiveSelect from '../../components/ResponsiveSelect';

const AdminPhotoGallery = () => {
  const [galleries, setGalleries] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('school');
  const [selectedClass, setSelectedClass] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('published');
  const [coverFile, setCoverFile] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]); // { file, previewUrl }
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [previewAlbum, setPreviewAlbum] = useState(null);
  const fileInputRef = useRef();

  const API = API_BASE;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const normalizeGallery = (g) => {
    const photos = (g.photos || []).map(p => {
      if (!p) return null;
      if (typeof p === 'string') {
        const url = getImageUrl(p);
        const title = (g.title) ? g.title : p.replace(/\.[^.]+$/, '');
        return { _id: null, url, filename: p, title };
      }
      // object
      const url = p.url || p.fileUrl || p.path || getImageUrl(p.filename || p.public_id || p._id || p);
      let title = p.title || p.caption || '';
      if (!title || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(title)) title = g.title || p.caption || p.filename || p._id || 'Photo';
      return { ...p, url, title };
    }).filter(Boolean);
    return { ...g, photos };
  };

  // Map UI gallery category ids to backend category enums
  const mapToServerCategory = (uiId) => {
    if (!uiId) return 'class-gallery';
    const mapping = {
      events: 'event-gallery',
      school: 'class-gallery',
      classrooms: 'class-gallery',
      labs: 'class-gallery',
      sports: 'class-gallery',
      activities: 'class-gallery',
      celebration: 'class-gallery',
      hostel: 'class-gallery',
      transport: 'class-gallery'
    };
    return mapping[uiId] || 'class-gallery';
  };

  const fetchGalleries = async () => {
    try {
      const r = await fetch(`${API}/api/photo-gallery`);
      const j = await r.json();
      if (j.success && Array.isArray(j.data)) {
        setGalleries(j.data.map(normalizeGallery));
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(()=>{ fetchGalleries(); },[]);

  // lock body scroll when preview album modal is open
  useEffect(() => {
    if (previewAlbum) {
      const y = window.scrollY || window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, y || 0);
      };
    }
    return undefined;
  }, [previewAlbum]);

  function startEdit(gallery){
    if(!gallery) return;
    setEditingId(gallery._id || null);
    setTitle(gallery.title || '');
    setCategory(gallery.category || 'school');
    setDescription(gallery.description || '');
    setStatus(gallery.status || 'published');
    setPendingFiles([]);
    // pick cover preview from photos
    const cover = (gallery.photos||[]).find(p => String(p._id) === String(gallery.coverPhoto)) || (gallery.photos && gallery.photos[0]);
    setCoverPreview(cover ? (cover.url || getImageUrl(cover)) : null);
    setCoverFile(null);
    // scroll to top so admin sees form
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){}
  }

  // Create album, upload cover then other photos
  const createAlbum = async () => {
    if (!title.trim()) return alert('Album title is required');
    setLoading(true);
    try {
      if (editingId) {
        // update metadata
        await fetch(`${API}/api/photo-gallery/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: token? `Bearer ${token}`: undefined }, body: JSON.stringify({ title, description, status, category: mapToServerCategory(category), className: selectedClass }) });

        // upload cover if a new file was selected
        if (coverFile) {
          const fd = new FormData(); fd.append('photos', coverFile); if (selectedClass) fd.append('className', selectedClass);
          const up = await fetch(`${API}/api/photo-gallery/${editingId}/photos`, { method: 'POST', body: fd, headers: { Authorization: token? `Bearer ${token}`: undefined } });
          const upj = await up.json(); if (upj && upj.success) {
            const last = upj.data && upj.data.photos && upj.data.photos[upj.data.photos.length-1];
            if (last) await fetch(`${API}/api/photo-gallery/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: token? `Bearer ${token}`: undefined }, body: JSON.stringify({ coverPhotoId: last._id }) });
          }
        }

        // upload other pending files
        if (pendingFiles.length) {
          const fd2 = new FormData(); pendingFiles.forEach(p => fd2.append('photos', p.file)); if (selectedClass) fd2.append('className', selectedClass);
          await fetch(`${API}/api/photo-gallery/${editingId}/photos`, { method: 'POST', body: fd2, headers: { Authorization: token? `Bearer ${token}`: undefined } });
        }

        // done
        setEditingId(null); setCoverPreview(null);
      } else {
        if (!coverFile) return alert('Cover photo is required');
        const res = await fetch(`${API}/api/photo-gallery`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token? `Bearer ${token}`: undefined }, body: JSON.stringify({ title, description, status, category: mapToServerCategory(category), className: selectedClass }) });
        const j = await res.json(); if (!j.success) throw new Error('Failed to create album');
        const album = j.data;
        // upload cover
        const fd = new FormData(); fd.append('photos', coverFile); if (selectedClass) fd.append('className', selectedClass);
        const up = await fetch(`${API}/api/photo-gallery/${album._id}/photos`, { method: 'POST', body: fd, headers: { Authorization: token? `Bearer ${token}`: undefined } });
        const upj = await up.json(); if (!upj.success) throw new Error('Cover upload failed');
        const uploadedAlbum = upj.data;
        const last = uploadedAlbum.photos && uploadedAlbum.photos[uploadedAlbum.photos.length-1];
        if (last) {
          await fetch(`${API}/api/photo-gallery/${album._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: token? `Bearer ${token}`: undefined }, body: JSON.stringify({ coverPhotoId: last._id }) });
        }
        // upload other pending files
        if (pendingFiles.length) {
          const fd2 = new FormData(); pendingFiles.forEach(p => fd2.append('photos', p.file)); if (selectedClass) fd2.append('className', selectedClass);
          await fetch(`${API}/api/photo-gallery/${album._id}/photos`, { method: 'POST', body: fd2, headers: { Authorization: token? `Bearer ${token}`: undefined } });
        }
      }

      // reset
      setTitle(''); setDescription(''); setStatus('published'); setCategory('school'); setCoverFile(null); setPendingFiles([]); setSelectedClass('');
      fetchGalleries();
    } catch (e) { console.error(e); alert('Failed to save album'); }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const mapped = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPendingFiles(prev => [...prev, ...mapped]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    const mapped = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPendingFiles(prev => [...prev, ...mapped]);
  };

  const removePending = (index) => { URL.revokeObjectURL(pendingFiles[index].preview); setPendingFiles(prev => prev.filter((_,i)=>i!==index)); };

  const reorderPending = (from, to) => {
    if (to<0||to>=pendingFiles.length) return;
    const arr = [...pendingFiles]; const [item] = arr.splice(from,1); arr.splice(to,0,item); setPendingFiles(arr);
  };

  const deletePhoto = async (galleryId, photoId) => {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`${API}/api/photo-gallery/${galleryId}/photos/${photoId}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } });
    const j = await res.json(); if (j.success) fetchGalleries();
  };

  const setCover = async (galleryId, photoId) => {
    await fetch(`${API}/api/photo-gallery/${galleryId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: token? `Bearer ${token}`: undefined }, body: JSON.stringify({ coverPhotoId: photoId }) });
    fetchGalleries();
  };

  const deleteAlbum = async (id) => {
    if (!confirm('Delete this album and all photos?')) return;
    const res = await fetch(`${API}/api/photo-gallery/${id}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } }); const j = await res.json(); if (j.success) fetchGalleries();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SectionTitle title="Photo Gallery Management" subtitle="Manage school photos, albums, events, celebrations, campus activities, classrooms, sports, hostel facilities, and infrastructure photos displayed on the website." />

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Create Album</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600">Album Title</label>
            <input className="mt-1 input w-full" placeholder="e.g. School Main Building" value={title} onChange={e=>setTitle(e.target.value)} />
            
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Category</label>
            <ResponsiveSelect
              value={category}
              onChange={(v) => setCategory(v)}
              options={GALLERY_CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select Category"
              className="mt-1 w-full"
              maxHeight={480}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Class (optional)</label>
            <ResponsiveSelect
              value={selectedClass}
              onChange={(v) => setSelectedClass(v)}
              options={[
                { value: '', label: 'None' },
                { value: 'Nursery', label: 'Nursery' },
                { value: 'LKG', label: 'LKG' },
                { value: 'UKG', label: 'UKG' },
                { value: 'Class 1', label: 'Class 1' },
                { value: 'Class 2', label: 'Class 2' },
                { value: 'Class 3', label: 'Class 3' },
                { value: 'Class 4', label: 'Class 4' },
                { value: 'Class 5', label: 'Class 5' },
                { value: 'Class 6', label: 'Class 6' },
                { value: 'Class 7', label: 'Class 7' },
                { value: 'Class 8', label: 'Class 8' },
                { value: 'Class 9', label: 'Class 9' },
                { value: 'Class 10', label: 'Class 10' },
              ]}
              placeholder="Select Class"
              className="mt-1 w-full"
              maxHeight={480}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Status</label>
            <ResponsiveSelect
              value={status}
              onChange={(v) => setStatus(v)}
              options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]}
              placeholder="Status"
              className="mt-1 w-full"
              maxHeight={300}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600">Album Description</label>
          <textarea className="mt-1 textarea w-full" placeholder="The main academic building of Bal Bodh Secondary School..." value={description} onChange={e=>setDescription(e.target.value)} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600">Album Cover Photo {editingId? '(optional - keep existing)' : '(required)'}</label>
            <input type="file" accept="image/*" onChange={e=>{ setCoverFile(e.target.files[0]); setCoverPreview(null); }} className="mt-2" />
            {(coverPreview || coverFile) && (
              <div className="mt-2">
                <img
                  src={coverFile ? URL.createObjectURL(coverFile) : coverPreview}
                  alt="cover"
                  onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/default-placeholder.png'; }}
                  className="w-48 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Gallery Photos (Drag & Drop)</label>
            <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop} className="mt-2 p-4 border-dashed border-2 border-gray-200 rounded text-center bg-gray-50">
              <p className="text-sm text-gray-500">Drag & drop images here or <button className="text-blue-600 underline" onClick={()=>fileInputRef.current.click()}>select files</button></p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {pendingFiles.map((p, idx) => (
                <div key={idx} className="relative bg-white p-1 rounded">
                  <img src={p.preview} alt="preview" className="w-full h-24 object-cover rounded" />
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs bg-slate-100 rounded" onClick={()=>reorderPending(idx, idx-1)}>↑</button>
                      <button className="px-2 py-1 text-xs bg-slate-100 rounded" onClick={()=>reorderPending(idx, idx+1)}>↓</button>
                    </div>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs text-red-600" onClick={()=>removePending(idx)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button disabled={loading} onClick={createAlbum} className="btn btn-primary">{loading? 'Saving...':(editingId? 'Update Album':'Create Album')}</button>
              <button onClick={()=>{ setTitle(''); setDescription(''); setStatus('published'); setCategory('school'); setCoverFile(null); setCoverPreview(null); setPendingFiles([]); setEditingId(null); }} className="btn">Reset</button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Albums</h3>
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Cover</th>
                <th className="px-4 py-3">Album Title</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {galleries.map(g => (
                <tr key={g._id} className="border-t text-sm align-top">
                  <td className="px-4 py-3">
                    <img
                      src={(g.photos&&g.coverPhoto)?(g.photos.find(p=>String(p._id)===String(g.coverPhoto))?.url):(g.photos&&g.photos[0]&&g.photos[0].url) || '/default-placeholder.png'}
                      alt="cover"
                      onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/default-placeholder.png'; }}
                      className="w-20 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{g.title || 'Untitled'}</td>
                  <td className="px-4 py-3">{g.className || (g.photos && g.photos[0] && g.photos[0].className) || '-'}</td>
                  <td className="px-4 py-3">{g.category}</td>
                  <td className="px-4 py-3">{(g.photos||[]).length}</td>
                  <td className="px-4 py-3">{g.status}</td>
                  <td className="px-4 py-3">{new Date(g.updatedAt || g.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setPreviewAlbum(g)} className="px-3 py-1 bg-gray-100 rounded">👁 View</button>
                      <button onClick={()=>startEdit(g)} className="px-3 py-1 bg-yellow-100 rounded">✏ Edit</button>
                      <button onClick={()=>deleteAlbum(g._id)} className="px-3 py-1 bg-red-100 rounded">🗑 Delete</button>
                    </div>
                        {previewAlbum && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/60" onClick={()=>setPreviewAlbum(null)} />
                            <div className="relative z-10 w-full max-w-4xl bg-white rounded shadow-lg p-4 overflow-auto" style={{ maxHeight: '80vh' }}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xl font-bold">{previewAlbum.title}</h3>
                                  <p className="text-sm text-gray-600">{previewAlbum.description}</p>
                                </div>
                                <button onClick={()=>setPreviewAlbum(null)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
                              </div>
                              <div className="mt-4">
                                <img src={(previewAlbum.photos && previewAlbum.photos[0] && previewAlbum.photos[0].url) || '/default-placeholder.png'} alt={previewAlbum.title} className="w-full h-64 object-cover rounded" onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/default-placeholder.png'; }} />
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-2">
                                {(previewAlbum.photos||[]).map((p, i)=> (
                                  <img key={p._id || p.filename || i} src={p.url} alt={p.title||''} className="w-full h-28 object-cover rounded" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/default-placeholder.png'; }} />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                    {/* Inline photo thumbnails with set cover / delete */}
                    <div className="mt-3 grid grid-cols-6 gap-2">
                      {(g.photos||[]).map((p, idx) => (
                        <div key={p._id || p.filename || p.url || idx} className="relative">
                          <img src={p.url} alt={p.title} onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/default-placeholder.png'; }} className="w-full h-16 object-cover rounded" />
                          <div className="absolute left-1 top-1 bg-white/80 rounded px-1 text-xs">
                            {g.coverPhoto && g.coverPhoto.toString() === p._id.toString() ? 'Cover' : (<button onClick={()=>setCover(g._id, p._id)} className="text-blue-600">Set cover</button>)}
                          </div>
                          <button onClick={()=>deletePhoto(g._id, p._id)} className="absolute right-1 top-1 text-red-600 text-sm">x</button>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPhotoGallery;
