import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ResponsiveSelect from '../components/ResponsiveSelect';

const EXAM_TYPES = [
  'First Terminal Exam',
  'Second Terminal Exam',
  'Third Terminal Exam',
  'Final Exam'
];

const CLASS_OPTIONS = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];

const ALL_CLASS_VALUE = 'all';

export default function ExamForm({ existing, onSaved }){
  const [form, setForm] = useState({ 
    type:'First Terminal Exam', 
    class:'', 
    academicYear: new Date().getFullYear().toString(),
    subjects: [],
    startDate: '',
    endDate: '',
    maxMarks: '100',
    passMarks: '40',
    notes: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    if (form.class) {
      loadSubjectsForClass(form.class);
    }
  }, [form.class]);

  useEffect(()=>{ 
    if(existing) {
      setForm({ 
        type: existing.type || 'First Terminal Exam',
        class: existing.class?._id || existing.class || '',
        academicYear: existing.academicYear || new Date().getFullYear().toString(),
        subjects: existing.subjects?.map(s => s._id || s) || [],
        startDate: existing.startDate ? new Date(existing.startDate).toISOString().slice(0,10) : '',
        endDate: existing.endDate ? new Date(existing.endDate).toISOString().slice(0,10) : '',
        maxMarks: existing.maxMarks != null ? String(existing.maxMarks) : '100',
        passMarks: existing.passMarks != null ? String(existing.passMarks) : '40',
        notes: existing.notes || ''
      });
      setSelectedSubjects(existing.subjects?.map(s => s._id || s) || []);
    }
  },[existing]);

  const loadSubjectsForClass = async (classId) => {
    try {
      const res = await api.get(`/subjects?class=${classId}`);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try{
      const payload = {
        ...form,
        subjects: selectedSubjects,
        // convert free-text marks to numbers where possible
        maxMarks: form.maxMarks !== '' ? (Number(form.maxMarks) || 0) : undefined,
        passMarks: form.passMarks !== '' ? (Number(form.passMarks) || 0) : undefined
      };
      if(existing && existing._id) await api.put(`/exams/${existing._id}`, payload);
      else await api.post('/exams', payload);
      onSaved && onSaved();
    }catch(err){ 
      console.error('Exam save error:', err); 
      const details = err?.response?.data;
      const message = details?.message || err?.message || 'Could not save exam';
      const detailText = details?.error || details?.stack ? `\n${details?.error || details?.stack}` : '';
      setError(`${message}${detailText}`);
      alert(`${message}${detailText}`);
    }finally{
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 md:p-5 lg:p-6 shadow rounded-xl md:rounded-2xl border border-slate-200">
      <h2 className="text-lg md:text-xl font-semibold mb-4">{existing ? 'Edit Exam' : 'Create New Exam'}</h2>
      
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 mb-4">
        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Exam Type *</label>
          <ResponsiveSelect
            value={form.type}
            onChange={(v) => setForm(prev => ({ ...prev, type: v }))}
            options={EXAM_TYPES.map(t => ({ value: t, label: t }))}
            placeholder="Select Exam Type"
            maxHeight={300}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Class *</label>
          <ResponsiveSelect
            value={form.class}
            onChange={(v) => setForm(prev => ({ ...prev, class: v }))}
            options={[{ value: '', label: 'Select Class' }, { value: ALL_CLASS_VALUE, label: 'All' }, ...CLASS_OPTIONS.map(c => ({ value: c, label: c }))]}
            placeholder="Select Class"
            maxHeight={300}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
          <input
            type="text"
            value={form.academicYear}
            onChange={e => setForm({ ...form, academicYear: e.target.value })}
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. 2024-2025"
            required
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Max Marks</label>
          <input
            type="text"
            value={form.maxMarks}
            onChange={e => setForm({ ...form, maxMarks: e.target.value })}
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Pass Marks</label>
          <input
            type="text"
            value={form.passMarks}
            onChange={e => setForm({ ...form, passMarks: e.target.value })}
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">Subjects</label>
        <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2">
          {subjects.map(s => (
            <label key={s._id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(s._id)}
                onChange={() => toggleSubject(s._id)}
                className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-300"
              />
              <span className="text-xs md:text-sm">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className="w-full p-2.5 md:p-3 text-sm md:text-base border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          rows="3"
          placeholder="Additional notes about the exam"
        />
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs md:text-sm">{error}</div>}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Saving...' : (existing ? 'Update Exam' : 'Create Exam')}
      </button>
    </form>
  );
}
