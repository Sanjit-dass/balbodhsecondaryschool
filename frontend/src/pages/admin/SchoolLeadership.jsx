import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StaffModal from '../../components/public/StaffModal';

function Modal({ open, onClose, children }){
  useEffect(()=>{
    if(!open) return;
    const onKey = (e) => { if(e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // robust scroll lock
    let scrollY = 0;
    if (typeof document !== 'undefined') {
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
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      try {
        const top = document.body.style.top || '';
        const restored = top ? parseInt(top.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, restored || scrollY);
      } catch (e) { /* ignore */ }
      document.documentElement.style.scrollBehavior = '';
    };
  },[open]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-600">Close</button>
        {children}
      </div>
    </div>
  );
}

export default function AdminSchoolLeadership(){
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewStaff, setViewStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ fullName:'', designation:'', department:'', roleCategory:'', shortBio:'', status:'active' });
  const [editId, setEditId] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff-leadership');
      if (res.data && res.data.data) setList(res.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, []);

  function openAdd(){
    setEditId(null);
    setForm({ fullName:'', designation:'', department:'', roleCategory:'', shortBio:'', status:'active' });
    setFile(null);
    setShowModal(true);
  }

  function openEdit(item){
    setEditId(item._id);
    setForm({ fullName: item.fullName || '', designation: item.designation || '', department: item.department || '', roleCategory: item.roleCategory || '', shortBio: item.shortBio || '', status: item.status || 'active' });
    setFile(null);
    setShowModal(true);
  }

  const handleFileChange = (e) => {
    if(!e.target.files || !e.target.files[0]) return;
    setFile(e.target.files[0]);
  };

  const handleSave = async () => {
    // validation: require name and photo only; designation optional
    if(!form.fullName){
      alert('Please provide Full Name');
      return;
    }
    // file optional on edit; require for create
    if(!editId && !file){ alert('Please upload a photo'); return; }
    setSaving(true);
    try{
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      if (form.designation) fd.append('designation', form.designation);
      if (form.department) fd.append('department', form.department);
      fd.append('roleCategory', form.roleCategory);
      fd.append('shortBio', form.shortBio);
      fd.append('status', form.status);
      fd.append('displayOrder', form.displayOrder || 0);
      if (file) fd.append('photo', file);

      let res;
      if (editId) {
        res = await api.put(`/staff-leadership/${editId}`, fd);
      } else {
        res = await api.post('/staff-leadership', fd);
      }

      if(res && res.data && res.data.data){
        await fetchList();
        setShowModal(false);
        setEditId(null);
        alert(editId ? 'Staff member updated' : 'Staff member saved');
      } else {
        alert('Save failed');
      }
    }catch(err){
      console.error('Save error', err);
      alert('Save failed: ' + (err?.response?.data?.message || err.message));
    }finally{ setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await api.delete(`/staff-leadership/${id}`);
      await fetchList();
    } catch (e) { console.error(e); alert('Delete failed'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">School Leadership</h1>
        <button type="button" onClick={openAdd} className="btn btn-primary">Add New</button>
      </div>
      <Modal open={showModal} onClose={()=> setShowModal(false)}>
        <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
        <div className="grid grid-cols-1 gap-3">
          <input value={form.fullName} onChange={e=> setForm({...form, fullName: e.target.value})} placeholder="Full Name *" className="border p-2 rounded" />
          <input value={form.designation} onChange={e=> setForm({...form, designation: e.target.value})} placeholder="Designation" className="border p-2 rounded" />
          <input value={form.department} onChange={e=> setForm({...form, department: e.target.value})} placeholder="Department" className="border p-2 rounded" />
          <input value={form.roleCategory} onChange={e=> setForm({...form, roleCategory: e.target.value})} placeholder="Role (e.g., Leadership, Admin)" className="border p-2 rounded" />
          <textarea value={form.shortBio} onChange={e=> setForm({...form, shortBio: e.target.value})} placeholder="Short Bio" className="border p-2 rounded" rows={4} />
          <div>
            <label className="block text-sm font-medium mb-1">Photo *</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2"><input type="radio" checked={form.status==='active'} onChange={()=> setForm({...form, status:'active'})} /> Active</label>
            <label className="flex items-center gap-2"><input type="radio" checked={form.status==='inactive'} onChange={()=> setForm({...form, status:'inactive'})} /> Inactive</label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={()=> { setShowModal(false); setEditId(null); }} className="px-4 py-2 border rounded">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving? 'Saving...': (editId ? 'Update' : 'Save')}</button>
          </div>
        </div>
      </Modal>
      {loading ? <div>Loading...</div> : (
        <div>
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500">Total Staff</div>
              <div className="text-2xl font-bold">{list.length}</div>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500">Published Staff</div>
              <div className="text-2xl font-bold">{list.filter(i=> i.status === 'active').length}</div>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500">Draft Staff</div>
              <div className="text-2xl font-bold">{list.filter(i=> i.status === 'draft').length}</div>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500">Total Photos</div>
              <div className="text-2xl font-bold">{list.filter(i=> i.photo && i.photo.url).length}</div>
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Photo</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 w-24">
                      <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
                        <img src={(s.photo && s.photo.url) ? s.photo.url : '/images/faculty1.png'} alt={s.fullName} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3">{s.fullName}</td>
                    <td className="p-3">{s.designation}</td>
                    <td className="p-3">{s.department}</td>
                    <td className="p-3">{s.status}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="text-slate-700" onClick={() => setViewStaff(s)}>👁 View</button>
                        <button className="text-indigo-600" onClick={() => openEdit(s)}>✏ Edit</button>
                        <button className="text-red-600" onClick={() => handleDelete(s._id)}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* View modal for public-style detail */}
          {viewStaff ? <StaffModal staff={viewStaff} onClose={() => setViewStaff(null)} /> : null}
        </div>
      )}
    </div>
  );
}
