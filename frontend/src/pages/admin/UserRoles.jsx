import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import ResponsiveSelect from '../../components/ResponsiveSelect';

const ROLE_COLORS = {
  admin: 'bg-blue-100 text-blue-700',
  teacher: 'bg-green-100 text-green-700',
  student: 'bg-purple-100 text-purple-700',
  accountant: 'bg-orange-100 text-orange-700'
};

export default function UserRoles(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'student', password: '', status: 'Active' });
  const [editingUser, setEditingUser] = useState(null);

  const fetch = async ()=>{
    setLoading(true);
    try{
      const res = await api.get('/users');
      setUsers(res.data.users || res.data.data || []);
    }catch(e){ console.error(e); alert('Failed to load users'); }
    setLoading(false);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    const s = u.status ? String(u.status) : 'active';
    const cap = s.charAt(0).toUpperCase() + s.slice(1);
    setForm({ name: u.name || '', email: u.email || '', phone: u.profile?.phone || '', role: u.role || 'student', password: '', status: cap });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    try{
      const payload = { name: form.name, email: form.email, ['profile.phone']: form.phone, role: form.role, status: String(form.status).toLowerCase() };
      if (form.password && form.password.trim() !== '') payload.password = form.password;
      await api.put(`/users/${editingUser._id}`, payload);
      setShowEdit(false);
      setEditingUser(null);
      fetch();
    }catch(e){ console.error(e); alert(e.response?.data?.message || 'Update failed'); }
  };

  useEffect(()=>{ fetch(); }, []);

  const counts = users.reduce((acc,u)=>{
    acc.total = (acc.total||0)+1;
    if (u.role) {
      // For students, count only those who have actual login accounts (hasLogin === true)
      if (u.role === 'student') {
        if (u.hasLogin) acc.student = (acc.student||0)+1;
      } else {
        acc[u.role] = (acc[u.role]||0)+1;
      }
    }
    return acc;
  }, { total: 0 });

  const handleAdd = async ()=>{
    try{
      await api.post('/users', { name: form.name, email: form.email, phone: form.phone, role: form.role, password: form.password, status: String(form.status).toLowerCase() });
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', role: 'student', password: '', status: 'Active' });
      fetch();
    }catch(e){ console.error(e); alert(e.response?.data?.message || 'Create user failed'); }
  };

  const handleDelete = async (id)=>{
    if (!confirm('Delete user?')) return;
    try{ await api.delete(`/users/${id}`); fetch(); }catch(e){ console.error(e); alert('Delete failed'); }
  };

  const toggleActive = async (u)=>{
    try{
      const cur = String(u.status || 'active').toLowerCase();
      const next = cur === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${u._id}`, { status: next });
      fetch();
    }catch(e){ console.error(e); alert('Update failed'); }
  };

  const { user: currentUser } = useContext(AuthContext);

  const ROLE_ORDER = ['admin','accountant','teacher','student'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Roles Management</h2>
          <p className="text-sm text-slate-600">Manage users, roles, and access permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-indigo-600 text-white rounded">Add User</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-slate-500">Total Users</div>
          <div className="text-2xl font-bold">{counts.total || 0}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-slate-500">Total Teachers</div>
          <div className="text-2xl font-bold">{counts.teacher || 0}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-slate-500">Total Students</div>
          <div className="text-2xl font-bold">{counts.student || 0}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-slate-500">Total Accountants</div>
          <div className="text-2xl font-bold">{counts.accountant || 0}</div>
        </div>
      </div>

      <div className="space-y-6">
        {ROLE_ORDER.map(roleKey=>{
          // For the student role, only show users who have a login (hasLogin flag from API)
          const group = users.filter(u=>u.role === roleKey && (roleKey !== 'student' || u.hasLogin));
          return (
            <div key={roleKey} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{roleKey.charAt(0).toUpperCase()+roleKey.slice(1)}s ({group.length})</h3>
                <div className="text-sm text-slate-500">{loading ? 'Loading...' : `${group.length} users`}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-600">
                      <th className="p-2">Profile</th>
                      <th className="p-2">Name</th>
                      { /* Show email and phone only to admins or in Admins section */ }
                      {(currentUser?.role === 'admin' || roleKey === 'admin') && <th className="p-2">Email</th>}
                      {(currentUser?.role === 'admin' || roleKey === 'admin') && <th className="p-2">Phone</th>}
                      <th className="p-2">Status</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.length === 0 ? (
                      <tr><td className="p-4" colSpan={6}>No users in this role.</td></tr>
                    ) : group.map(u=> (
                      <tr key={u._id} className="border-t">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {u.profile?.photoUrl ? (
                              <img src={u.profile.photoUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold">{(u.name||'')[0] || 'U'}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{u.name}</td>
                        {(currentUser?.role === 'admin' || roleKey === 'admin') && <td className="p-2">{u.email}</td>}
                        {(currentUser?.role === 'admin' || roleKey === 'admin') && <td className="p-2">{u.profile?.phone || '-'}</td>}
                        <td className="p-2">{u.status || 'Active'}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-1 text-sm text-sky-600" onClick={()=>alert(JSON.stringify(u, null, 2))}>👁 View</button>
                            <button className="px-2 py-1 text-sm text-amber-600" onClick={()=>openEdit(u)}>✏ Edit</button>
                            <button className="px-2 py-1 text-sm text-green-600" onClick={()=>toggleActive(u)}>{u.status === 'Active' ? '🔒 Deactivate' : '🔓 Activate'}</button>
                            <button className="px-2 py-1 text-sm text-red-600" onClick={()=>handleDelete(u._id)}>🗑 Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Add User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Full Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} className="p-2 border rounded" />
              <ResponsiveSelect
                value={form.role}
                onChange={(v)=>setForm({...form, role: v})}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'teacher', label: 'Teacher' },
                  { value: 'student', label: 'Student' },
                  { value: 'accountant', label: 'Accountant' }
                ]}
                placeholder="Role"
                className="w-full"
              />
              <input placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="p-2 border rounded" />
              <ResponsiveSelect
                value={form.status}
                onChange={(v)=>setForm({...form, status: v})}
                options={[ { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' } ]}
                placeholder="Status"
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded bg-slate-100">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 rounded bg-indigo-600 text-white">Create</button>
            </div>
          </div>
        </div>
      ) : null}
      {showEdit ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Edit User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Full Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="p-2 border rounded" />
                <input placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="p-2 border rounded" />
                <input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} className="p-2 border rounded" />
                <ResponsiveSelect
                  value={form.role}
                  onChange={(v)=>setForm({...form, role: v})}
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'teacher', label: 'Teacher' },
                    { value: 'student', label: 'Student' },
                    { value: 'accountant', label: 'Accountant' }
                  ]}
                  placeholder="Role"
                  className="w-full"
                />
                { (currentUser?.role === 'admin') ? (
                  <input placeholder="New Password (leave blank to keep)" type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="p-2 border rounded" />
                ) : <div /> }
                <ResponsiveSelect
                  value={form.status}
                  onChange={(v)=>setForm({...form, status: v})}
                  options={[ { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' } ]}
                  placeholder="Status"
                  className="w-full"
                />
              </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={()=>{ setShowEdit(false); setEditingUser(null); }} className="px-4 py-2 rounded bg-slate-100">Cancel</button>
              <button onClick={handleEdit} className="px-4 py-2 rounded bg-amber-600 text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
