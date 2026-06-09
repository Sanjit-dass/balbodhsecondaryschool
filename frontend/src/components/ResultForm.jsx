import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ResultForm({ existing, onSaved }){
  const [form, setForm] = useState({ student:'', exam:'', grade:'', gpa:'', published:false });
  useEffect(()=>{ if(existing) setForm(existing); },[existing]);

  const submit = async (e) => {
    e.preventDefault();
    try{
      const payload = { ...form, gpa:Number(form.gpa), published:Boolean(form.published) };
      if(existing && existing._id) await api.put(`/results/${existing._id}`, payload);
      else await api.post('/results', payload);
      onSaved && onSaved();
    }catch(err){ console.error(err); alert('Could not save result'); }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Student ID" value={form.student} onChange={e=>setForm({...form,student:e.target.value})} className="p-2 border" />
        <input placeholder="Exam ID" value={form.exam} onChange={e=>setForm({...form,exam:e.target.value})} className="p-2 border" />
        <input placeholder="Grade" value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})} className="p-2 border" />
        <input placeholder="GPA" type="number" step="0.01" value={form.gpa} onChange={e=>setForm({...form,gpa:e.target.value})} className="p-2 border" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})} /> Published</label>
      </div>
      <div className="mt-3"><button className="p-2 bg-green-600 text-white rounded">Save Result</button></div>
    </form>
  );
}
