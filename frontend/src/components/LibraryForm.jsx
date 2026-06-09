import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function LibraryForm({ existing, onSaved }){
  const [form, setForm] = useState({ title:'', author:'', isbn:'', available:true });
  useEffect(()=>{ if(existing) setForm(existing); },[existing]);

  const submit = async (e) => {
    e.preventDefault();
    try{
      const payload = { ...form, available:Boolean(form.available) };
      if(existing && existing._id) await api.put(`/library/${existing._id}`, payload);
      else await api.post('/library', payload);
      onSaved && onSaved();
    }catch(err){ console.error(err); alert('Could not save book'); }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2 border" />
        <input placeholder="Author" value={form.author} onChange={e=>setForm({...form,author:e.target.value})} className="p-2 border" />
        <input placeholder="ISBN" value={form.isbn} onChange={e=>setForm({...form,isbn:e.target.value})} className="p-2 border" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.available} onChange={e=>setForm({...form,available:e.target.checked})} /> Available</label>
      </div>
      <div className="mt-3"><button className="p-2 bg-green-600 text-white rounded">Save Book</button></div>
    </form>
  );
}
