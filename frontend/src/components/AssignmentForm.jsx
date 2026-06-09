import React, { useEffect, useState } from 'react';
import api from '../services/api';
import FileUploader from './FileUploader';
import PDFViewer from './PDFViewer';
import { getInlineViewUrl } from '../services/fileViewService';

export default function AssignmentForm({ existing, onSaved }){
  const [form, setForm] = useState({ title:'', description:'', class:'', dueDate:'', totalMarks: '' });
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{
    if (existing) {
      setForm({
        title: existing.title || '',
        description: existing.description || '',
        class: existing.class || '',
        dueDate: existing.dueDate ? new Date(existing.dueDate).toISOString().slice(0,10) : '',
        totalMarks: existing.totalMarks ?? ''
      });
      setAttachments(existing.attachments || []);
      setError('');
    } else {
      setForm({ title:'', description:'', class:'', dueDate:'', totalMarks: '' });
      setAttachments([]);
      setError('');
    }
  },[existing]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try{
      const payload = { ...form, dueDate: form.dueDate ? new Date(form.dueDate) : null, totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined, attachments };
      if(existing && existing._id) await api.put(`/assignments/${existing._id}`, payload);
      else await api.post('/assignments', payload);
      onSaved && onSaved();
    }catch(err){
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'Could not save assignment';
      setError(message);
      alert(message);
    }finally{
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 shadow rounded mb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2 border" />
        <input placeholder="Class" value={form.class} onChange={e=>setForm({...form,class:e.target.value})} className="p-2 border" />
        <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="p-2 border" />
        <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="p-2 border" rows="3" />
        <input placeholder="Total Marks" type="number" value={form.totalMarks} onChange={e=>setForm({...form,totalMarks:e.target.value})} className="p-2 border" />
      </div>
      <div className="mt-3">
        <label className="block text-sm text-slate-600 mb-2">Attachments</label>
        <FileUploader folder="assignments" accept="image/*,application/pdf,.doc,.docx" onUploaded={(data)=>{ setAttachments(a=>[...a, { fileUrl: data.fileUrl || data.url || data.fileUrl, publicId: data.publicId, fileName: data.originalName || data.fileName }]); }} />
        <div className="mt-2 space-y-2">
          {attachments.map((a,i)=>(
            <div key={i}>
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <a href={getInlineViewUrl(a.fileUrl || a.url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{a.fileName || a.fileUrl?.split('/').pop() || a.url?.split('/').pop() || a.publicId}</a>
                <button type="button" onClick={()=>setAttachments(at=>at.filter((_,idx)=>idx!==i))} className="text-sm text-red-600">Remove</button>
              </div>
              <PDFViewer fileUrl={a.fileUrl || a.url} fileName={a.fileName} />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <button type="submit" disabled={saving} className="p-2 bg-green-600 text-white rounded disabled:opacity-50">{saving ? 'Saving...' : 'Save Assignment'}</button>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </form>
  );
}
