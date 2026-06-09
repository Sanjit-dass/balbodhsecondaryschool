import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function VehicleForm({ existing, onSaved }){
  const [form, setForm] = useState({ name:'', route:'', capacity:'', driver:'' });
  useEffect(()=>{ if(existing) setForm(existing); },[existing]);

  const submit = async (e) => {
    e.preventDefault();
    try{
      const payload = { ...form, capacity:Number(form.capacity) };
      if(existing && existing._id) await api.put(`/vehicles/${existing._id}`, payload);
      else await api.post('/vehicles', payload);
      onSaved && onSaved();
    }catch(err){ console.error(err); alert('Could not save vehicle'); }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="p-2 border" />
        <input placeholder="Route" value={form.route} onChange={e=>setForm({...form,route:e.target.value})} className="p-2 border" />
        <input placeholder="Capacity" type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} className="p-2 border" />
        <input placeholder="Driver" value={form.driver} onChange={e=>setForm({...form,driver:e.target.value})} className="p-2 border" />
      </div>
      <div className="mt-3"><button className="p-2 bg-green-600 text-white rounded">Save Vehicle</button></div>
    </form>
  );
}
