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
    <form onSubmit={submit} className="bg-white p-4 md:p-5 lg:p-6 shadow rounded-xl md:rounded-2xl mb-4 md:mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <input placeholder="Class name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <input placeholder="Numeric" value={form.numeric} onChange={e=>setForm({...form, numeric:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <input placeholder="Sections (comma separated)" value={form.sections} onChange={e=>setForm({...form, sections:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <input placeholder="Academic Year" value={form.academicYear} onChange={e=>setForm({...form, academicYear:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <input placeholder="Class Teacher (ID)" value={form.classTeacher} onChange={e=>setForm({...form, classTeacher:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
      </div>
      <div className="mt-4 md:mt-5">
        <button className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium rounded-lg transition">Save</button>
      </div>
    </form>
  );
}
