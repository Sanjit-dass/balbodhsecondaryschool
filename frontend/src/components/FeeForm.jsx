import React, { useEffect, useState } from 'react';
import api from '../services/api';
import FileUploader from './FileUploader';
import { getInlineViewUrl } from '../services/fileViewService';

export default function FeeForm({ existing, onSaved }){
  const [form, setForm] = useState({ title:'', amount:'', dueDate:'', paid:false });
  const [receipt, setReceipt] = useState(null);
  useEffect(()=>{ if(existing) { setForm({ ...existing, dueDate: existing?.dueDate ? new Date(existing.dueDate).toISOString().slice(0,10) : '' }); setReceipt(existing.receipt || (existing.receiptUrl ? { fileUrl: existing.receiptUrl } : null)); } },[existing]);

  const submit = async (e) => {
    e.preventDefault();
    try{
      const payload = { ...form, amount:Number(form.amount), paid:Boolean(form.paid), receipt };
      if(existing && existing._id) await api.put(`/fees/${existing._id}`, payload);
      else await api.post('/fees', payload);
      onSaved && onSaved();
    }catch(err){ console.error(err); alert('Could not save fee'); }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2 border" />
        <input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="p-2 border" />
        <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="p-2 border" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.paid} onChange={e=>setForm({...form,paid:e.target.checked})} /> Paid</label>
      </div>
      <div className="mt-3">
        <label className="block text-sm text-slate-600 mb-2">Receipt (optional)</label>
        <FileUploader folder="fees" accept="image/*,application/pdf" onUploaded={(data)=>{ setReceipt({ fileUrl: data.fileUrl || data.url, publicId: data.publicId }); }} />
        {receipt && (
          <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
            <a href={getInlineViewUrl(receipt.fileUrl || receipt.url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{receipt.fileUrl || receipt.url || receipt.publicId}</a>
            <button type="button" onClick={()=>setReceipt(null)} className="text-sm text-red-600">Remove</button>
          </div>
        )}
        <div className="mt-3"><button className="p-2 bg-green-600 text-white rounded">Save Fee</button></div>
      </div>
    </form>
  );
}
