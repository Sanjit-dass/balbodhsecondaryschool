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
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid gap-3">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2 border" />
        <textarea placeholder="Notice body" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} className="p-2 border" rows="4" />
        <div className="grid gap-3 sm:grid-cols-3">
          <select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="p-2 border">
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="parents">Parents</option>
            <option value="specificClass">Specific Class</option>
          </select>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="p-2 border">
            <option value="General">General</option>
            <option value="Academic">Academic</option>
            <option value="Exam">Exam</option>
            <option value="Holiday">Holiday</option>
            <option value="Event">Event</option>
            <option value="Emergency">Emergency</option>
            <option value="Fee">Fee</option>
          </select>
          <input type="date" value={form.publishedAt} onChange={e=>setForm({...form,publishedAt:e.target.value})} className="p-2 border" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} className="p-2 border" placeholder="Expiry date" />
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="p-2 border">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})} /> <span className="text-sm">Pin notice</span>
          </label>
        </div>

        {form.audience === 'specificClass' && (
          <div>
            <select value={form.targetClassId} onChange={e=>setForm({...form,targetClassId:e.target.value})} className="p-2 border w-full">
              <option value="">Select Class</option>
              {classes.map(c=> <option key={c._id} value={c._id}>{c.name || c.className || c.displayName || c}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="mt-3">
        <label className="block text-sm text-slate-600 mb-2">Attachments</label>
        <FileUploader folder="notices" accept="image/*,application/pdf,.doc,.docx" onUploaded={(data)=>{ setAttachments(a=>[...a, { fileUrl: data.fileUrl || data.url, publicId: data.publicId }]); }} />
        <div className="mt-2 space-y-2">
          {attachments.map((a,i)=>(
            <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <a href={getInlineViewUrl(a.fileUrl || a.url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{a.fileUrl || a.url || a.publicId}</a>
              <button type="button" onClick={()=>setAttachments(at=>at.filter((_,idx)=>idx!==i))} className="text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={(e)=>submit(e,false)} className="p-2 bg-gray-400 text-white rounded">Save Draft</button>
          <button type="button" onClick={(e)=>submit(e,true)} className="p-2 bg-green-600 text-white rounded">Publish Notice</button>
        </div>
      </div>
    </form>
  );
}
