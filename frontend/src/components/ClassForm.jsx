import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ClassForm({ existing, onSaved }){
  const [form, setForm] = useState({ name:'', numeric:'', sections:'', academicYear:'', classTeacher:'' });
  useEffect(()=>{ if(existing) setForm(existing); },[existing]);

  const submit = async (e) => {
    e && e.preventDefault();
    try{
      const payload = { ...form, sections: typeof form.sections === 'string' ? form.sections.split(',').map(s=>s.trim()) : form.sections };
      if(existing && existing._id) await api.put(`/classes/${existing._id}`, payload);
      else await api.post('/classes', payload);
      onSaved && onSaved();
    }catch(err){ console.error(err); alert('Save failed'); }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input placeholder="Class name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="p-2 border" />
        <input placeholder="Numeric" value={form.numeric} onChange={e=>setForm({...form, numeric:e.target.value})} className="p-2 border" />
        <input placeholder="Sections (comma separated)" value={form.sections} onChange={e=>setForm({...form, sections:e.target.value})} className="p-2 border" />
        <input placeholder="Academic Year" value={form.academicYear} onChange={e=>setForm({...form, academicYear:e.target.value})} className="p-2 border" />
        <input placeholder="Class Teacher (ID)" value={form.classTeacher} onChange={e=>setForm({...form, classTeacher:e.target.value})} className="p-2 border" />
      </div>
      <div className="mt-3">
        <button className="p-2 bg-green-600 text-white rounded">Save</button>
      </div>
    </form>
  );
}
