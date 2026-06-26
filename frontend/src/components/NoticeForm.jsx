import React, { useEffect, useState } from 'react';
import api from '../services/api';
import FileUploader from './FileUploader';
import { getInlineViewUrl } from '../services/fileViewService';

export default function NoticeForm({ existing, onSaved }){
  const [form, setForm] = useState({ title:'', body:'', audience:'all', category:'General', publishedAt:'', expiryDate:'', priority:'Medium', targetClassId:'', status:'draft', pinned:false });
  const [attachments, setAttachments] = useState([]);
  const [classes, setClasses] = useState([]);
  useEffect(()=>{ if(existing) setForm({ ...existing, publishedAt: existing?.publishedAt ? new Date(existing.publishedAt).toISOString().slice(0,10) : '', expiryDate: existing?.expiryDate ? new Date(existing.expiryDate).toISOString().slice(0,10) : '' }); if(existing) setAttachments(existing.attachments || []); },[existing]);

  useEffect(()=>{
    // fetch classes for "Specific Class" audience option
    (async ()=>{
      try{
        const res = await api.get('/classes');
        setClasses(res.data.classes || []);
      }catch(e){ /* ignore */ }
    })();
  },[]);

  const submit = async (e, publish=false) => {
    if(e) e.preventDefault();
    try{
      const payload = {
        title: form.title,
        body: form.body,
        audience: form.audience,
        category: form.category,
        publishedAt: publish ? (form.publishedAt ? new Date(form.publishedAt) : new Date()) : form.publishedAt ? new Date(form.publishedAt) : null,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        priority: form.priority,
        pinned: form.pinned,
        attachments,
        status: publish ? 'published' : (form.status || 'draft')
      };
      if (form.audience === 'specificClass' && form.targetClassId) {
        payload.targetClassId = form.targetClassId;
      }
      if(existing && existing._id) await api.put(`/notices/${existing._id}`, payload);
      else await api.post('/notices', payload);
      onSaved && onSaved();
    }catch(err){
      console.error('Notice save failed', err.response ? err.response.data : err);
      const message = err.response?.data?.errors?.map(e => e.msg).join(', ') || err.response?.data?.message || 'Could not save notice';
      alert(message);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 md:p-5 lg:p-6 shadow rounded-xl md:rounded-2xl mb-4 md:mb-6">
      <div className="grid gap-3 md:gap-4">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        <textarea placeholder="Notice body" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" rows="4" />
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
          <select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none">
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="parents">Parents</option>
            <option value="specificClass">Specific Class</option>
          </select>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none">
            <option value="General">General</option>
            <option value="Academic">Academic</option>
            <option value="Exam">Exam</option>
            <option value="Holiday">Holiday</option>
            <option value="Event">Event</option>
            <option value="Emergency">Emergency</option>
            <option value="Fee">Fee</option>
          </select>
          <input type="date" value={form.publishedAt} onChange={e=>setForm({...form,publishedAt:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
          <input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" placeholder="Expiry date" />
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})} className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-300" /> <span className="text-xs md:text-sm">Pin notice</span>
          </label>
        </div>

        {form.audience === 'specificClass' && (
          <div>
            <select value={form.targetClassId} onChange={e=>setForm({...form,targetClassId:e.target.value})} className="p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none w-full">
              <option value="">Select Class</option>
              {classes.map(c=> <option key={c._id} value={c._id}>{c.name || c.className || c.displayName || c}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="mt-4 md:mt-5">
        <label className="block text-xs md:text-sm text-slate-600 font-medium mb-2">Attachments</label>
        <FileUploader folder="notices" accept="image/*,application/pdf,.doc,.docx" onUploaded={(data)=>{ setAttachments(a=>[...a, { fileUrl: data.fileUrl || data.url, publicId: data.publicId }]); }} />
        <div className="mt-2 md:mt-3 space-y-2">
          {attachments.map((a,i)=>(
            <div key={i} className="flex items-center justify-between bg-gray-50 p-2 md:p-3 rounded-lg">
              <a href={getInlineViewUrl(a.fileUrl || a.url)} target="_blank" rel="noreferrer" className="text-xs md:text-sm text-blue-600 truncate">{a.fileUrl || a.url || a.publicId}</a>
              <button type="button" onClick={()=>setAttachments(at=>at.filter((_,idx)=>idx!==i))} className="text-xs md:text-sm text-red-600 font-medium">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-3 md:mt-4 flex gap-2">
          <button type="button" onClick={(e)=>submit(e,false)} className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-400 hover:bg-gray-500 text-white text-xs md:text-sm font-medium rounded-lg transition">Save Draft</button>
          <button type="button" onClick={(e)=>submit(e,true)} className="px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium rounded-lg transition">Publish Notice</button>
        </div>
      </div>
    </form>
  );
}
