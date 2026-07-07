import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function SubjectForm({ existing, onSaved, defaultClass = 'Nursery' }){
  const [form, setForm] = useState({ name:'', class: defaultClass });
  useEffect(()=>{ 
    if(existing && existing._id) {
      setForm({ 
        name: existing.name || '', 
        class: existing.className || existing.class || defaultClass 
      });
    } else {
      setForm({ name:'', class: defaultClass });
    }
  },[existing, defaultClass]);

  const submit = async (e) => {
    e && e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter a subject name');
      return;
    }
    try{
      let res;
      if(existing && existing._id) {
        res = await api.put(`/subjects/${existing._id}`, form);
      } else {
        res = await api.post('/subjects', form);
      }
      onSaved && onSaved(res?.data || res);
      if (!existing || !existing._id) {
        setForm({ name: '', class: defaultClass });
      }
    }catch(err){ 
      console.error(err); 
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed'; 
      alert(`Save failed: ${msg}`); 
    }
  };

  const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Name</label>
        <input 
          placeholder="e.g., English, Mathematics, Science" 
          value={form.name} 
          onChange={e=>setForm({...form, name:e.target.value})} 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
        <select 
          value={form.class} 
          onChange={e=>setForm({...form, class: e.target.value})} 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CLASS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <button 
        type="submit"
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
      >
        {existing && existing._id ? 'Update Subject' : 'Add Subject'}
      </button>
    </form>
  );
}
