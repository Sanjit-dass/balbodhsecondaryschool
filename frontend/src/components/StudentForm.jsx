import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FileUploader from './FileUploader';

const defaultForm = {
  fullName: '',
  admissionNumber: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  class: '',
  address: '',
  guardian: {
    fatherName: '',
    motherName: '',
    contact: '',
    address: ''
  },
  photoUrl: ''
};

export default function StudentForm({ existing, selectedClassName, onSaved, onCancel }) {
  const [form, setForm] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploadMeta, setUploadMeta] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!existing) {
      setForm({ ...defaultForm, class: selectedClassName || '' });
      return;
    }
    setForm({
      fullName: existing.fullName || '',
      admissionNumber: existing.admissionNumber || '',
      gender: existing.gender || '',
      dateOfBirth: existing.dateOfBirth ? existing.dateOfBirth.split('T')[0] : existing.dob ? existing.dob.split('T')[0] : '',
      phone: existing.phone || '',
      class: selectedClassName || (existing.class && existing.class.name ? existing.class.name : existing.class || ''),
      address: existing.address || existing.guardian?.address || '',
      guardian: {
        fatherName: existing.guardian?.fatherName || '',
        motherName: existing.guardian?.motherName || '',
        contact: existing.guardian?.contact || '',
        address: existing.guardian?.address || existing.address || ''
      },
      photoUrl: existing.photoUrl || existing.profilePhoto || existing.profilePhotoObj?.fileUrl || ''
    });
  }, [existing, selectedClassName]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleUpload = async () => {
    // If file was selected but not uploaded, prevent save
    if (file && !uploadMeta?.fileUrl) {
      throw new Error('Please upload the photo before saving. Click the Upload button next to the photo.');
    }
    // If upload was successful, return the uploaded URL
    if (uploadMeta?.fileUrl) return uploadMeta.fileUrl;
    // Otherwise return existing photoUrl
    return form.photoUrl;
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setErrorMsg('');
    setUploadSuccess('');
    try {
      let photoUrl = form.photoUrl;
      if (file) photoUrl = await handleUpload();
      const payload = {
        fullName: form.fullName,
        admissionNumber: form.admissionNumber,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone,
        address: form.address,
        guardian: form.guardian,
        photoUrl,
        photo: photoUrl
      };
      // only send gender when selected
      if (form.gender) payload.gender = form.gender;
      if (selectedClassName) {
        payload.className = selectedClassName;
      } else if (form.class) {
        payload.className = form.class;
      }

      if (existing && existing._id) {
        await api.put(`/students/${existing._id}`, payload);
      } else {
        await api.post('/students', payload);
      }
      setUploadSuccess('Student saved successfully!');
      setTimeout(() => onSaved && onSaved(), 500);
    } catch (err) {
      console.error(err);
      // try to extract useful message from server response
      const resp = err?.response?.data;
      if (resp) {
        if (resp.message) setErrorMsg(resp.message + (resp.detail ? `: ${JSON.stringify(resp.detail)}` : ''));
        else if (resp.errors && Array.isArray(resp.errors)) setErrorMsg(resp.errors.map(e => e.msg || e.message || `${e.field || e.param}: ${e.msg || e.message}`).join('; '));
        else setErrorMsg(JSON.stringify(resp));
      } else if (err.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Save failed. Please check the form and try again.');
      }
    }
  };

  return (
    <form onSubmit={submit} className="card-premium mb-6">
      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{errorMsg}</div>
      )}
      {uploadSuccess && (
        <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{uploadSuccess}</div>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{existing ? 'Edit Student' : 'Add New Student'}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {selectedClassName ? `Assigned to ${selectedClassName}` : 'Create a new student profile here.'}
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto">Cancel</button>
          )}
          <button type="submit" className="btn-primary w-full sm:w-auto">Save Student</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <input placeholder="Full name (optional)" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input-premium" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Roll No (same number may be reused in other classes)" value={form.admissionNumber} onChange={e => setForm({ ...form, admissionNumber: e.target.value })} className="input-premium" />
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-premium">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="input-premium" />
            {!selectedClassName && (
              <input placeholder="Class name" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="input-premium" />
            )}
          </div>
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-premium" />
          <input placeholder="Home / Guardian Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-premium" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Father's Name" value={form.guardian.fatherName} onChange={e => setForm({ ...form, guardian: { ...form.guardian, fatherName: e.target.value } })} className="input-premium" />
            <input placeholder="Mother's Name" value={form.guardian.motherName} onChange={e => setForm({ ...form, guardian: { ...form.guardian, motherName: e.target.value } })} className="input-premium" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Guardian Contact" value={form.guardian.contact} onChange={e => setForm({ ...form, guardian: { ...form.guardian, contact: e.target.value } })} className="input-premium" />
            <input placeholder="Guardian Address" value={form.guardian.address} onChange={e => setForm({ ...form, guardian: { ...form.guardian, address: e.target.value } })} className="input-premium" />
          </div>
        </div>

        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-2">📸 Student Photo Upload</div>
          <div className="text-xs text-slate-500 mb-3">
            JPG, PNG (Max 5MB)
          </div>
          <FileUploader 
            folder="students" 
            accept="image/*" 
            onUploaded={(data) => { 
              setUploadMeta(data); 
              setForm(f => ({ ...f, photoUrl: data.fileUrl }));
              setUploadSuccess('Photo uploaded successfully! ✓');
              setTimeout(() => setUploadSuccess(''), 3000);
            }} 
          />
          {(preview || form.photoUrl) && (
            <div className="mt-4 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
              <img src={preview || form.photoUrl} alt="preview" className="w-full h-40 object-cover" />
              <div className="p-2 bg-white text-center text-xs text-slate-600">
                {preview ? 'Preview (click Upload to confirm)' : 'Current photo'}
              </div>
            </div>
          )}
          {!preview && !form.photoUrl && (
            <div className="mt-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-white">
              <div className="text-xs text-slate-400">No photo uploaded yet</div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
