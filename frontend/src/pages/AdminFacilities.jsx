import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ResponsiveSelect from '../components/ResponsiveSelect';
import { apiBaseURL } from '../services/api';

function formatDate(d) {
  if (!d) return '';
  try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0,10); } catch { return ''; }
}

export default function AdminFacilities(){
  const { user, token } = useContext(AuthContext);
  const modalScrollY = useRef(0);
  const API = apiBaseURL.replace(/\/api$/, '');
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(()=>{ fetchFacilities(); },[]);

  async function fetchFacilities(){
    setLoading(true);
    try{
      const res = await fetch(`${API}/api/facilities`);
      const ct = res.headers.get('content-type')||'';
      if (!ct.includes('application/json')) throw new Error('Server returned non-JSON response');
      const body = await res.json();
      const list = Array.isArray(body.data) ? body.data : [];
      setFacilities(list.sort((a,b)=> (a.displayOrder||0)-(b.displayOrder||0)));
    }catch(err){ console.error(err); setFacilities([]); }
    finally{ setLoading(false); }
  }

  function emptyForm(){ return { facilityName:'', shortDescription:'', fullDescription:'', category:'Infrastructure', status:'published', featured:false, displayOrder: (facilities.length+1), photos:[], _newFiles: [], _coverIndex:0 }; }
  function openNew(){ setEditing(emptyForm()); setShowForm(true); }
  function openEdit(f){
    let coverIndex = 0;
    if (f.coverPhoto && Array.isArray(f.photos)){
      const idx = (f.photos||[]).findIndex(p=> String(p._id) === String(f.coverPhoto));
      if (idx >= 0) coverIndex = idx;
    }
    setEditing({...f, _newFiles: [], _coverIndex:coverIndex});
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

  async function saveFacility(){
    try{
      setSaveError('');
      setSaving(true);
      const isNew = !editing._id;
      const hasFiles = editing._newFiles && editing._newFiles.length>0;
      let res;
      if (isNew || hasFiles){
        const fd = new FormData();
        fd.append('facilityName', editing.facilityName||'');
        fd.append('shortDescription', editing.shortDescription||'');
        fd.append('fullDescription', editing.fullDescription||'');
        fd.append('category', editing.category||'Infrastructure');
        fd.append('status', editing.status||'published');
        fd.append('featured', String(editing.featured||false));
        fd.append('displayOrder', String(editing.displayOrder||0));
        fd.append('coverIndex', String(editing._coverIndex||0));
        (editing._newFiles||[]).forEach(f=> fd.append('photos', f));
        res = await fetch(isNew?`${API}/api/facilities`:`${API}/api/facilities/${editing._id}`, { method: isNew? 'POST':'PUT', body: fd, headers: { Authorization: token? `Bearer ${token}` : undefined } });
      } else {
        const payload = { facilityName: editing.facilityName, shortDescription: editing.shortDescription, fullDescription: editing.fullDescription, category: editing.category, status: editing.status, featured: editing.featured, displayOrder: editing.displayOrder||0 };
        if (!hasFiles && editing._coverIndex !== undefined && editing.photos && editing.photos[editing._coverIndex]) payload.coverPhoto = editing.photos[editing._coverIndex]._id;
        res = await fetch(isNew?`${API}/api/facilities`:`${API}/api/facilities/${editing._id}`, { method: isNew? 'POST':'PATCH', headers: {'Content-Type':'application/json', Authorization: token? `Bearer ${token}`: undefined}, body: JSON.stringify(payload) });
      }
      const body = await res.json().catch(()=> ({}));
      if (!res.ok || body.success === false) {
        const msg = body.message || (body.error || 'Save failed');
        throw new Error(msg);
      }
      await fetchFacilities();
      closeForm();
    }catch(err){ console.error(err); setSaveError(err.message||'Failed'); alert(err.message||'Failed'); }
    finally{ setSaving(false); }
  }

  async function deleteFacility(id){ if(!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return; const res = await fetch(`${API}/api/facilities/${id}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } }); if (!res.ok) { alert('Delete failed'); return; } await fetchFacilities(); }

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
    if (i < (editing.photos||[]).length) {
      if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
      const photo = editing.photos[i];
      const res = await fetch(`${API}/api/facilities/${editing._id}/photos/${photo._id}`, { method: 'DELETE', headers: { Authorization: token? `Bearer ${token}`: undefined } });
      if (!res.ok) { alert('Photo delete failed'); return; }
      setEditing(prev=> ({ ...prev, photos: prev.photos.filter((_,idx)=> idx!==i) }));
      return;
    }
  }

  // Calculate summary stats
  const totalFacilities = facilities.length;
  const publishedFacilities = facilities.filter(f => f.status === 'published').length;
  const draftFacilities = facilities.filter(f => f.status === 'draft').length;
  const totalPhotos = facilities.reduce((sum, f) => sum + (f.photos?.length || 0), 0);

  function renderForm(){
    if (!showForm || !editing) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="absolute inset-0 bg-black/40" onClick={closeForm}></div>
        <div className="relative z-10 w-full max-w-6xl bg-white rounded shadow-lg p-6">
          <div className="md:flex gap-6">
            <div className="md:w-full overflow-hidden">
              <div style={{ maxHeight: '78vh', overflowY: 'auto', paddingRight: 8 }}>
                <div className="md:flex gap-6">
                  <div className="md:w-3/4 space-y-4">
                    <div>
                      <label className="block font-semibold">Facility Name *</label>
                      <input className="w-full border p-2 rounded" value={editing.facilityName} onChange={(e)=> setEditing(prev=> ({ ...prev, facilityName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block font-semibold">Short Description *</label>
                      <textarea className="w-full border p-2 rounded h-20" value={editing.shortDescription} onChange={(e)=> setEditing(prev=> ({ ...prev, shortDescription: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block font-semibold">Full Description</label>
                      <textarea className="w-full border p-2 rounded h-40" value={editing.fullDescription} onChange={(e)=> setEditing(prev=> ({ ...prev, fullDescription: e.target.value }))} />
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
                          onChange={(v) => setEditing(prev=> ({...prev, category: v}))}
                          options={[
                            'Academic','Technology','Science','Sports','Hostel','Library','Transportation','Medical','Infrastructure','Other'
                          ].map(c=> ({ value: c, label: c }))}
                          placeholder="Select category"
                          className="w-full"
                          maxHeight={300}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block font-semibold">Status</label>
                        <ResponsiveSelect
                          value={editing.status}
                          onChange={(v) => setEditing(prev=> ({...prev, status: v}))}
                          options={[
                            { value: 'draft', label: 'Draft' },
                            { value: 'published', label: 'Published' },
                            { value: 'hidden', label: 'Hidden' }
                          ]}
                          placeholder="Select status"
                          className="w-full"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editing.featured||false} onChange={(e)=> setEditing(prev=> ({...prev, featured: e.target.checked}))} />
                          <span className="font-semibold">Featured Facility</span>
                        </label>
                      </div>
                      <div className="mb-3">
                        <label className="block font-semibold">Display Order</label>
                        <input type="number" className="w-full border p-2 rounded" value={editing.displayOrder||0} onChange={(e)=> setEditing(prev=> ({...prev, displayOrder: Number(e.target.value)}))} />
                      </div>
                      <div className="mb-3">
                        <div className="font-semibold">Preview Card</div>
                        <div className="mt-2 h-32 border rounded flex items-center justify-center text-sm text-slate-500">
                          {(() => {
                            const newFilesLen = editing._newFiles ? editing._newFiles.length : 0;
                            if (editing._coverIndex !== undefined && editing._coverIndex < newFilesLen) {
                              const f = editing._newFiles[editing._coverIndex];
                              return <img src={f.previewUrl||''} alt="cover" className="h-full object-cover" />;
                            }
                            const photoIdx = editing._coverIndex !== undefined ? editing._coverIndex - newFilesLen : 0;
                            if (editing.photos && editing.photos[photoIdx]) {
                              return <img src={editing.photos[photoIdx].url} alt="cover" className="h-full object-cover" />;
                            }
                            return <div>No preview</div>;
                          })()}
                        </div>
                      </div>
                      {saveError && <div className="text-sm text-red-600 mb-2">{saveError}</div>}
                      <div className="flex gap-2">
                        <button onClick={closeForm} disabled={saving} className="flex-1 px-3 py-2 border rounded">Cancel</button>
                        <button onClick={saveFacility} disabled={saving} className={`flex-1 px-3 py-2 text-white rounded ${saving? 'bg-slate-400':'bg-blue-600'}`}>
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

  // lock body scroll when form modal is open
  useEffect(() => {
    if (showForm) {
      const y = window.scrollY || window.pageYOffset;
      modalScrollY.current = y;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      // restore
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, modalScrollY.current || 0);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, modalScrollY.current || 0);
    };
  }, [showForm]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">World-Class Facilities Management</h1>
            <div className="text-sm text-slate-600">Manage school infrastructure, laboratories, classrooms, hostel facilities, transportation, sports facilities, and campus resources displayed on the school website.</div>
          </div>
          <div>
            <button onClick={openNew} className="px-4 py-2 bg-green-600 text-white rounded">Add Facility</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Facilities</div>
            <div className="text-2xl font-bold text-gray-900">{totalFacilities}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Published Facilities</div>
            <div className="text-2xl font-bold text-green-600">{publishedFacilities}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Draft Facilities</div>
            <div className="text-2xl font-bold text-yellow-600">{draftFacilities}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Facility Photos</div>
            <div className="text-2xl font-bold text-blue-600">{totalPhotos}</div>
          </div>
        </div>

        {loading && (
          <div>Loading…</div>
        )}

        {!loading && facilities.length === 0 && (
          <div className="bg-white rounded shadow p-8 text-center text-gray-600">No facilities added yet. Click <strong>+ Add Facility</strong> to create one.</div>
        )}

        {!loading && facilities.length > 0 && (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left">Cover Photo</th>
                  <th className="px-4 py-2 text-left">Facility Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Photos</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Last Updated</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map(f=> (
                  <tr key={f._id} className="border-t">
                    <td className="px-4 py-3">
                      {f.coverPhoto && f.photos && f.photos.length > 0 ? (
                        <img src={f.photos.find(p => String(p._id) === String(f.coverPhoto))?.url || f.photos[0]?.url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : f.photos && f.photos.length > 0 ? (
                        <img src={f.photos[0].url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">No img</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{f.facilityName}</td>
                    <td className="px-4 py-3">{f.category||'Other'}</td>
                    <td className="px-4 py-3 text-center">{(f.photos||[]).length}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${f.status === 'published' ? 'bg-green-100 text-green-800' : f.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {f.status||'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{f.updatedAt ? formatDate(f.updatedAt) : ''}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>{ window.open(`/facilities?facility=${f._id}`,'_blank') }} className="px-3 py-1 border rounded">👁</button>
                        <button onClick={()=> openEdit(f)} className="px-3 py-1 bg-blue-600 text-white rounded">✏</button>
                        <button onClick={()=> deleteFacility(f._id)} className="px-3 py-1 bg-red-600 text-white rounded">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {renderForm()}
      </div>
    </div>
  );
}
