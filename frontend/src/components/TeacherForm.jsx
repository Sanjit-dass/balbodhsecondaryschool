import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FileUploader from './FileUploader';
import ResponsiveSelect from './ResponsiveSelect';

const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];
const GENDER_OPTIONS = ['male', 'female', 'other'];

const defaultFormState = {
  fullName: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  address: '',
  employeeId: '',
  qualification: '',
  experience: '',
  joiningDate: '',
  subject: '',
  assignedClass: '',
  status: 'active',
  photoUrl: ''
};

export default function TeacherForm({ existing, onSaved }){
  const [form, setForm] = useState(defaultFormState);
  const [uploadMeta, setUploadMeta] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        fullName: existing.fullName || '',
        email: existing.email || '',
        gender: existing.gender || '',
        dateOfBirth: existing.dateOfBirth ? new Date(existing.dateOfBirth).toISOString().slice(0, 10) : '',
        phone: existing.phone || '',
        address: existing.address || '',
        employeeId: existing.employeeId || '',
        qualification: existing.qualifications || '',
        experience: existing.experience || '',
        joiningDate: existing.joiningDate ? new Date(existing.joiningDate).toISOString().slice(0, 10) : '',
        subject: existing.subject || '',
        assignedClass: existing.assignedClass || '',
        status: existing.status || 'active',
        photoUrl: existing.photoUrl || ''
      });
      setUploadMeta(null);
    } else {
      setForm(defaultFormState);
      setUploadMeta(null);
    }
  }, [existing]);

  const submit = async (e) => {
    e && e.preventDefault();
    if (!form.fullName) {
      return alert('Full name is required.');
    }
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone,
        address: form.address,
        employeeId: form.employeeId,
        qualification: form.qualification,
        experience: form.experience,
        joiningDate: form.joiningDate || undefined,
        subject: form.subject,
        assignedClass: form.assignedClass,
        status: form.status,
        photoUrl: uploadMeta?.fileUrl || form.photoUrl
      };

      if (existing && existing._id) {
        await api.put(`/teachers/${existing._id}`, payload);
      } else {
        await api.post('/teachers', payload);
      }

      setForm(defaultFormState);
      setUploadMeta(null);
      setSaveError('');
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || err.message || 'Save failed.';
      setSaveError(message);
      alert(message);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-3 sm:p-5 shadow rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
      {saveError && <div className="mb-3 sm:mb-4 rounded-lg border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700">{saveError}</div>}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Personal Info</h2>
          <input placeholder="Full Name *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <ResponsiveSelect
            value={form.gender}
            onChange={(v) => setForm({ ...form, gender: v })}
            options={[{ value: '', label: 'Gender' }, ...GENDER_OPTIONS.map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }))]}
            placeholder="Gender"
            className="w-full"
          />
          <input type="date" placeholder="Date of Birth" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Professional</h2>
          <input placeholder="Employee ID (optional)" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Qualification" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Experience" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input type="date" placeholder="Joining Date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Subject Specialization" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <input placeholder="Assigned Class" value={form.assignedClass} onChange={e => setForm({ ...form, assignedClass: e.target.value })} className="w-full p-2 sm:p-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none" />
          <ResponsiveSelect
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={STATUS_OPTIONS.map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }))}
            placeholder="Status"
            className="w-full"
          />
        </div>

        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Profile</h2>
          <div>
            <label className="block text-xs sm:text-sm text-slate-600 font-medium mb-2">Profile Photo</label>
            <FileUploader folder="teachers" accept="image/*" onUploaded={(data) => { setUploadMeta(data); setForm(prev => ({ ...prev, photoUrl: data.fileUrl })); }} />
            {form.photoUrl && <img src={form.photoUrl} alt="preview" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg mt-2" />}
          </div>
          <button type="submit" className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-medium rounded-lg transition">{existing ? 'Update Teacher' : 'Add Teacher'}</button>
        </div>
      </div>
    </form>
  );
}
