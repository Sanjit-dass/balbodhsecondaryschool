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
    <form onSubmit={submit} className="bg-white p-4 md:p-5 lg:p-6 shadow rounded-xl md:rounded-2xl mb-4 md:mb-6">
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.paid} onChange={e=>setForm({...form,paid:e.target.checked})} className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-300" /> <span className="text-xs md:text-sm">Paid</span></label>
      </div>
      <div className="mt-4 md:mt-5">
        <label className="block text-xs md:text-sm text-slate-600 font-medium mb-2">Receipt (optional)</label>
        <FileUploader folder="fees" accept="image/*,application/pdf" onUploaded={(data)=>{ setReceipt({ fileUrl: data.fileUrl || data.url, publicId: data.publicId }); }} />
        {receipt && (
          <div className="mt-2 md:mt-3 flex items-center justify-between bg-gray-50 p-2 md:p-3 rounded-lg">
            <a href={getInlineViewUrl(receipt.fileUrl || receipt.url)} target="_blank" rel="noreferrer" className="text-xs md:text-sm text-blue-600 truncate">{receipt.fileUrl || receipt.url || receipt.publicId}</a>
            <button type="button" onClick={()=>setReceipt(null)} className="text-xs md:text-sm text-red-600 font-medium">Remove</button>
          </div>
        )}
        <div className="mt-3 md:mt-4"><button className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium rounded-lg transition">Save Fee</button></div>
      </div>
    </form>
  );
}
