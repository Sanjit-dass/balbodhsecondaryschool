import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { apiBaseURL } from '../services/api';
import ResponsiveSelect from '../components/ResponsiveSelect';

function formatDate(d) {
  if (!d) return '';
  try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0,10); } catch { return ''; }
}

export default function AdminAchievements(){
  const { user, token } = useContext(AuthContext);
  const API = apiBaseURL.replace(/\/api$/, '');
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(()=>{ fetchAchievements(); },[]);

  // Lock body scroll when modal/form is open to prevent background scroll/overscroll on mobile
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let scrollY = 0;
    if (showForm) {
      scrollY = window.scrollY || window.pageYOffset || 0;
      try {
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
      } catch (e) { /* ignore */ }
    } else {
      try {
        const top = document.body.style.top || '';
        const restored = top ? parseInt(top.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, restored);
      } catch (e) { /* ignore */ }
      document.documentElement.style.scrollBehavior = '';
    }

    return () => {
      try {
        const top = document.body.style.top || '';
        const restored = top ? parseInt(top.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, restored);
      } catch (e) { /* ignore */ }
      document.documentElement.style.scrollBehavior = '';
    };
  }, [showForm]);

  async function fetchAchievements(){
    setLoading(true);
    try{
      const res = await fetch(`${API}/api/academic-excellence`);
      const ct = res.headers.get('content-type')||'';
      if (!ct.includes('application/json')) throw new Error('Server returned non-JSON response');
      const body = await res.json();
      const list = Array.isArray(body.data) ? body.data : (body.achievements||body.data||[]);
      setAchievements((list||[]).sort((a,b)=> (a.displayOrder||0)-(b.displayOrder||0)));
    }catch(err){ console.error(err); setAchievements([]); }
    finally{ setLoading(false); }
  }

  function emptyForm(){ return { title:'', shortDescription:'', description:'', category:'Academic', statistics:[], photos:[], status:'published', displayOrder: (achievements.length+1), _newFiles: [], _coverIndex:0 }; }
  function openNew(){ setEditing(emptyForm()); setShowForm(true); }
  function openEdit(a){
    const stats = Array.isArray(a.statistics) ? a.statistics : (a.statistics && typeof a.statistics === 'object' ? Object.entries(a.statistics).map(([k,v])=>({ label:k, value:String(v) })) : []);
    let coverIndex = 0;
    if (a.coverPhoto && Array.isArray(a.photos)){
      const idx = (a.photos||[]).findIndex(p=> String(p._id) === String(a.coverPhoto));
      if (idx >= 0) coverIndex = idx; // will be adjusted (no new files yet)
    }
    setEditing({...a, statistics: stats, _newFiles: [], _coverIndex:coverIndex});
    setShowForm(true);
  }

  function closeForm(){
    try{
      if (editing && Array.isArray(editing._newFiles)){
        editing._newFiles.forEach(f=> { try{ if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); }catch(e){}});
      }
    }catch(e){}
    setShowForm(false);
    setEditing(null);
    setSaveError('');
    setSaving(false);
  }

  function addStat(label, value){ setEditing(prev=> ({ ...prev, statistics: [...(prev.statistics||[]), { label, value }] })); }
  function editStat(idx, label, value){ setEditing(prev=> { const s = [...(prev.statistics||[])]; s[idx] = { label, value }; return { ...prev, statistics: s }; }); }
  function removeStat(idx){ setEditing(prev=> { const s = [...(prev.statistics||[])]; s.splice(idx,1); return { ...prev, statistics: s }; }); }

  async function saveAchievement(){
    try{
      setSaveError('');
      setSaving(true);
      const isNew = !editing._id;
      const hasFiles = editing._newFiles && editing._newFiles.length>0;
      let res;
      if (isNew || hasFiles){
        const fd = new FormData();
        fd.append('title', editing.title||'');
        fd.append('shortDescription', editing.shortDescription||'');
        fd.append('description', editing.description||'');
        fd.append('category', editing.category||'Academic');
        fd.append('statistics', JSON.stringify(editing.statistics||[]));
        fd.append('displayOrder', String(editing.displayOrder||0));
        fd.append('status', editing.status||'published');
        fd.append('coverIndex', String(editing._coverIndex||0));
        (editing._newFiles||[]).forEach(f=> fd.append('photos', f));
        res = await fetch(isNew?`${API}/api/academic-excellence`:`${API}/api/academic-excellence/${editing._id}`, { method: isNew? 'POST':'PUT', body: fd, headers: { Authorization: token? `Bearer ${token}` : undefined } });
      } else {
        const payload = { title: editing.title, shortDescription: editing.shortDescription, description: editing.description, category: editing.category, statistics: editing.statistics||{}, displayOrder: editing.displayOrder||0, status: editing.status||'published', photos: editing.photos||[] };
        // include coverPhoto if selecting existing photo as cover
        if (!hasFiles && editing._coverIndex !== undefined && editing.photos && editing.photos[editing._coverIndex]) payload.coverPhoto = editing.photos[editing._coverIndex]._id;
        payload.statistics = editing.statistics||[];
        res = await fetch(isNew?`${API}/api/academic-excellence`:`${API}/api/academic-excellence/${editing._id}`, { method: isNew? 'POST':'PATCH', headers: {'Content-Type':'application/json', Authorization: token? `Bearer ${token}`: undefined}, body: JSON.stringify(payload) });
      }
      const body = await res.json().catch(()=> ({}));
      if (!res.ok || body.success === false) {
        const msg = body.message || (body.error || 'Save failed');
        throw new Error(msg);
      }
      await fetchAchievements();
      try{ if (typeof window !== 'undefined') window.dispatchEvent(new Event('academic-excellence:updated')); }catch(e){}
      closeForm();
    }catch(err){ console.error(err); setSaveError(err.message||'Failed'); alert(err.message||'Failed'); }
    finally{ setSaving(false); }
  }

  async function deleteAchievement(id){ if(!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return; const res = await fetch(`${API}/api/academic-excellence/${id}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } }); if (!res.ok) { alert('Delete failed'); return; } await fetchAchievements(); }
  
  // ensure public pages update immediately after delete
  async function deleteAchievementAndNotify(id){
    if(!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
    const res = await fetch(`${API}/api/academic-excellence/${id}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } });
    if (!res.ok) { alert('Delete failed'); return; }
    await fetchAchievements();
    try{ if (typeof window !== 'undefined') window.dispatchEvent(new Event('academic-excellence:updated')); }catch(e){}
  }

  function handleFileSelect(e){
    const files = Array.from(e.target.files||[]).map(f=> Object.assign(f, { previewUrl: URL.createObjectURL(f) }));
    setEditing(prev=> ({ ...prev, _newFiles: [...(prev._newFiles||[]), ...files] }));
  }
  function removeNewFile(i){
    setEditing(prev=> {
      const toRevoke = (prev._newFiles && prev._newFiles[i]);
      try{ if (toRevoke && toRevoke.previewUrl) URL.revokeObjectURL(toRevoke.previewUrl); }catch(e){}
      return { ...prev, _newFiles: prev._newFiles.filter((_,idx)=> idx!==i) };
    });
  }
  function setCover(i){ setEditing(prev=> ({ ...prev, _coverIndex: i })); }

  function handlePhotoReorder(from, to){
    if (!editing || !editing.photos) return;
    const p = [...editing.photos];
    const item = p.splice(from,1)[0];
    p.splice(to,0,item);
    setEditing(prev=> ({ ...prev, photos: p }));
  }

  async function handlePhotoDelete(i){
    if (!editing) return;
    // if deleting a new (unsaved) file
    if (editing._newFiles && i < (editing.photos||[]).length) {
      // index corresponds to existing photos section; handle separately
    }
    if (i < (editing.photos||[]).length) {
      if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
      const photo = editing.photos[i];
      const res = await fetch(`${API}/api/academic-excellence/${editing._id}/photos/${photo._id}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } });
      if (!res.ok) { alert('Photo delete failed'); return; }
      setEditing(prev=> ({ ...prev, photos: prev.photos.filter((_,idx)=> idx!==i) }));
      return;
    }
  }

  function renderForm(){
    if (!showForm || !editing) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="absolute inset-0 bg-black/40" onClick={closeForm}></div>
        <div className="relative z-10 w-full max-w-5xl bg-white rounded shadow-lg p-6">
          <div className="md:flex gap-6">
            <div className="md:w-full overflow-hidden">
              <div className="modal-scrollable pr-2">
                <div className="md:flex gap-6">
              <div className="md:w-3/4 space-y-4">
              <div>
                <label className="block font-semibold">Title</label>
                <input className="w-full border p-2 rounded" value={editing.title} onChange={(e)=> setEditing(prev=> ({ ...prev, title: e.target.value }))} />
              </div>
                <div>
                  <label className="block font-semibold">Short Description</label>
                  <input className="w-full border p-2 rounded" value={editing.shortDescription||''} onChange={(e)=> setEditing(prev=> ({ ...prev, shortDescription: e.target.value }))} />
                </div>
              <div>
                <label className="block font-semibold">Description</label>
                <textarea className="w-full border p-2 rounded h-28" value={editing.description} onChange={(e)=> setEditing(prev=> ({ ...prev, description: e.target.value }))} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Statistics</div>
                  <div><button onClick={()=>{ const k = prompt('Statistic name'); if(!k) return; const v = prompt('Value'); addStat(k,v); }} className="px-2 py-1 border rounded">+ Add</button></div>
                </div>
                <div className="mt-2">
                  <table className="w-full text-sm border">
                    <thead className="bg-slate-50 text-slate-700 text-left">
                      <tr>
                        <th className="px-2 py-1">Statistic</th>
                        <th className="px-2 py-1">Value</th>
                        <th className="px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editing.statistics||[]).map((s,idx)=> (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{s.label}</td>
                          <td className="px-2 py-1">{s.value}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              <button onClick={()=>{ const label = prompt('Statistic name', s.label); if(!label) return; const val = prompt('Value', s.value); if(val==null) return; editStat(idx,label,val); }} className="text-xs px-2 py-1 border rounded">Edit</button>
                              <button onClick={()=> removeStat(idx)} className="text-xs px-2 py-1 border rounded text-red-600">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">Photos</div>
                <div className="border-dashed border-2 border-slate-300 p-4 rounded text-center text-sm">
                  <div>Drag & drop images to your OS file manager into this area, or use the selector below.</div>
                  <input ref={fileRef} onChange={handleFileSelect} className="mt-2" type="file" multiple accept="image/*" />
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {(editing._newFiles||[]).map((f,i)=> (
                    <div key={i} className="border rounded overflow-hidden p-1">
                      <div className="relative">
                        <img src={f.previewUrl||''} alt={f.name} className="w-full h-24 object-cover" />
                        {editing._coverIndex===i && (
                          <div className="absolute left-1 top-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Cover</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <button onClick={()=> removeNewFile(i)} className="px-2 py-1 text-xs border rounded text-red-600">Delete</button>
                        <button onClick={()=> setCover(i)} className="px-2 py-1 text-xs border rounded">Set Cover</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {(editing.photos||[]).map((p,i)=> (
                    <div key={i} className="border rounded overflow-hidden p-1">
                      <div className="relative">
                        <img src={p.url} alt={p.caption||''} className="w-full h-24 object-cover" />
                        {editing.photos && editing.photos[0] && editing.photos[0].url === p.url && (
                          <div className="absolute left-1 top-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Cover</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <button disabled={i===0} onClick={()=> handlePhotoReorder(i,i-1)} className="px-2 py-1 text-xs border rounded">↑</button>
                        <button disabled={i===(editing.photos||[]).length-1} onClick={()=> handlePhotoReorder(i,i+1)} className="px-2 py-1 text-xs border rounded">↓</button>
                        <button onClick={()=> handlePhotoDelete(i)} className="px-2 py-1 text-xs border rounded text-red-600">Delete</button>
                        <button onClick={()=> setCover((editing._newFiles||[]).length + i)} className="px-2 py-1 text-xs border rounded">Set Cover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:w-1/4">
              <div className="sticky top-5 bg-white p-3 rounded border">
                <div className="mb-3">
                  <label className="block font-semibold">Category</label>
                  <ResponsiveSelect
                    value={editing.category}
                    onChange={(v)=> setEditing(prev=> ({...prev, category: v}))}
                    options={[
                      { value: 'Academic', label: 'Academic' },
                      { value: 'Sports', label: 'Sports' },
                      { value: 'Science', label: 'Science' },
                      { value: 'Technology', label: 'Technology' },
                      { value: 'Awards', label: 'Awards' },
                      { value: 'Institutional Achievement', label: 'Institutional Achievement' }
                    ]}
                    placeholder="Select Category"
                    className="mt-1 w-full"
                    maxHeight={360}
                  />
                </div>
                <div className="mb-3">
                  <label className="block font-semibold">Status</label>
                  <select className="w-full border p-2 rounded" value={editing.status} onChange={(e)=> setEditing(prev=> ({...prev, status: e.target.value}))}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="mb-3">
                  <div className="font-semibold">Preview</div>
                  <div className="mt-2 border rounded p-3 bg-white">
                    <div className="flex gap-3">
                      <div className="w-1/3 h-28 bg-slate-100 flex items-center justify-center overflow-hidden rounded">
                        {(() => {
                          const newFilesLen = editing._newFiles ? editing._newFiles.length : 0;
                          if (editing._coverIndex !== undefined && editing._coverIndex < newFilesLen) {
                            const f = editing._newFiles[editing._coverIndex];
                            return <img src={f.previewUrl||''} alt="cover" className="h-full w-full object-cover" />;
                          }
                          const photoIdx = editing._coverIndex !== undefined ? editing._coverIndex - newFilesLen : 0;
                          if (editing.photos && editing.photos[photoIdx]) {
                            return <img src={editing.photos[photoIdx].url} alt="cover" className="h-full w-full object-cover" />;
                          }
                          return <div className="text-sm text-slate-500">No cover</div>;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{editing.title || 'Untitled'}</div>
                        <div className="text-sm text-slate-600 mt-1">{editing.shortDescription || ''}</div>
                        <div className="mt-2 text-sm">
                          {(editing.statistics||[]).slice(0,5).map((s,idx)=> (
                            <div key={idx} className="inline-block mr-3"><strong>{s.label}</strong>: {s.value}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {saveError && <div className="text-sm text-red-600 mb-2">{saveError}</div>}
                <div className="flex gap-2">
                  <button onClick={closeForm} disabled={saving} className="flex-1 px-3 py-2 border rounded">Cancel</button>
                  <button onClick={saveAchievement} disabled={saving} className={`flex-1 px-3 py-2 text-white rounded ${saving? 'bg-slate-400':'bg-blue-600'}`}>
                    {saving? 'Saving…':'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Academic Excellence Management</h1>
            <div className="text-sm text-slate-600">Manage school-level academic achievements, SEE results, toppers, awards, sports championships, and institutional achievements.</div>
          </div>
          <div>
            <button onClick={openNew} className="px-4 py-2 bg-green-600 text-white rounded">+ Add Excellence</button>
          </div>
        </div>

        {loading && (
          <div>Loading…</div>
        )}

        {!loading && achievements.length === 0 && (
          <div className="bg-white rounded shadow p-8 text-center text-gray-600">No academic excellence records added yet. Click <strong>+ Add Excellence</strong> to create one.</div>
        )}

        {!loading && achievements.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded shadow text-center">
                <div className="text-sm text-slate-500">Total Achievements</div>
                <div className="text-2xl font-bold">{achievements.length}</div>
              </div>
              <div className="bg-white p-4 rounded shadow text-center">
                <div className="text-sm text-slate-500">Published</div>
                <div className="text-2xl font-bold">{achievements.filter(a=> a.status==='published').length}</div>
              </div>
              <div className="bg-white p-4 rounded shadow text-center">
                <div className="text-sm text-slate-500">Drafts</div>
                <div className="text-2xl font-bold">{achievements.filter(a=> a.status==='draft').length}</div>
              </div>
              <div className="bg-white p-4 rounded shadow text-center">
                <div className="text-sm text-slate-500">Total Photos</div>
                <div className="text-2xl font-bold">{achievements.reduce((s,a)=> s + ((a.photos && a.photos.length) || 0), 0)}</div>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-2">Cover</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Photos</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Last Updated</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map(a=> {
                    const cover = a.coverPhoto ? (a.photos||[]).find(p=> String(p._id)===String(a.coverPhoto)) : (a.photos && a.photos[0]);
                    return (
                      <tr key={a._id} className="border-t">
                        <td className="px-4 py-3"><img src={cover ? cover.url : '/default-placeholder.png'} alt="cover" className="w-20 h-12 object-cover rounded" /></td>
                        <td className="px-4 py-3">{a.title}</td>
                        <td className="px-4 py-3">{a.category||'Other'}</td>
                        <td className="px-4 py-3 text-center">{(a.photos||[]).length}</td>
                        <td className="px-4 py-3">{a.status||'draft'}</td>
                        <td className="px-4 py-3">{a.updatedAt ? formatDate(a.updatedAt) : (a.createdAt ? formatDate(a.createdAt): '')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={()=>{ setEditing(a); setShowForm(true); }} className="px-3 py-1 border rounded">View</button>
                            <button onClick={()=> openEdit(a)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                            <button onClick={()=> deleteAchievementAndNotify(a._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {renderForm()}

      </div>
    </div>
  );
}
