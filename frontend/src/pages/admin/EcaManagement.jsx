import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function EcaManagement() {
  const [categories, setCategories] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [form, setForm] = useState({
    name: '',
    academicYear: new Date().getFullYear().toString(),
    applyToAllClasses: false,
    applicableClasses: []
  });
  const [selectedMarksClass, setSelectedMarksClass] = useState('');
  const [editingStudentId, setEditingStudentId] = useState('');
  const [rowDrafts, setRowDrafts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, markRes] = await Promise.all([
        api.get('/eca/categories'),
        api.get('/eca/admin/marks')
      ]);
      setCategories(catRes.data.categories || []);
      setMarks(markRes.data.marks || []);
    } catch (error) {
      console.error(error);
      setMessage('Failed to load ECA data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', academicYear: new Date().getFullYear().toString(), applyToAllClasses: false, applicableClasses: [] });
    setEditingCategoryId('');
  };

  const handleClassToggle = (className) => {
    setForm((prev) => {
      const exists = prev.applicableClasses.includes(className);
      return {
        ...prev,
        applicableClasses: exists ? prev.applicableClasses.filter((item) => item !== className) : [...prev.applicableClasses, className]
      };
    });
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        academicYear: form.academicYear,
        applyToAllClasses: form.applyToAllClasses,
        applicableClasses: form.applicableClasses
      };

      if (!payload.name) {
        setMessage('Category name is required');
        return;
      }

      if (!payload.applyToAllClasses && payload.applicableClasses.length === 0) {
        setMessage('Select at least one class or apply to all classes');
        return;
      }

      if (editingCategoryId) {
        await api.put(`/eca/categories/${editingCategoryId}`, payload);
      } else {
        await api.post('/eca/categories', payload);
      }

      setMessage(editingCategoryId ? 'ECA category updated successfully' : 'ECA category created successfully');
      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to save ECA category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setForm({
      name: category.name || '',
      academicYear: category.academicYear || new Date().getFullYear().toString(),
      applyToAllClasses: Boolean(category.applyToAllClasses),
      applicableClasses: Array.isArray(category.applicableClasses) ? category.applicableClasses : []
    });
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category and its marks entries?')) return;
    try {
      await api.delete(`/eca/categories/${categoryId}`);
      setMessage('Category deleted successfully');
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to delete category');
    }
  };

  const startRowEdit = (group) => {
    const studentId = group.student?._id || '';
    if (!studentId) return;
    setEditingStudentId(studentId);
    setRowDrafts((prev) => ({
      ...prev,
      [studentId]: Object.fromEntries((group.entries || []).map((entry) => [
        entry.category?._id || entry.category || entry.categoryName || entry._id,
        {
          markId: entry._id,
          marks: entry.marks || '',
          status: entry.status || 'draft'
        }
      ]))
    }));
  };

  const handleRowDraftChange = (studentId, categoryKey, value) => {
    setRowDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [categoryKey]: {
          ...(prev[studentId]?.[categoryKey] || {}),
          marks: value
        }
      }
    }));
  };

  const handleSaveRowEdit = async (studentId) => {
    const draftEntries = rowDrafts[studentId] || {};
    try {
      await Promise.all(Object.entries(draftEntries).map(async ([categoryKey, value]) => {
        const trimmed = String(value?.marks ?? '').trim();
        if (!value?.markId) return null;
        if (!trimmed) {
          return api.delete(`/eca/admin/marks/${value.markId}`);
        }
        return api.put(`/eca/admin/marks/${value.markId}`, { marks: trimmed, status: value.status || 'draft' });
      }));
      setMessage('ECA marks updated successfully');
      setEditingStudentId('');
      setRowDrafts((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to update ECA marks');
    }
  };

  const handleDeleteEntry = async (markId) => {
    try {
      await api.delete(`/eca/admin/marks/${markId}`);
      setMessage('ECA mark deleted successfully');
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to delete ECA mark');
    }
  };

  const handleBulkStatusChange = async (group, action) => {
    const entries = group?.entries || [];
    if (!entries.length) {
      setMessage('No ECA marks available for this student');
      return;
    }

    try {
      const nextStatus = action === 'verify' ? 'verified' : action === 'publish' ? 'published' : 'deleted';
      await Promise.all(entries.map((entry) => api.put(`/eca/admin/marks/${entry._id}`, { status: nextStatus })));
      setMessage(action === 'publish' ? 'Published successfully' : action === 'verify' ? 'Verified successfully' : 'Deleted successfully');
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to update ECA mark');
    }
  };

  const handlePublishClass = async () => {
    const classEntries = visibleMarks.flatMap((group) => group.entries || []);
    if (!classEntries.length) {
      setMessage('No ECA marks available for the selected class');
      return;
    }

    try {
      await Promise.all(classEntries.map((entry) => api.put(`/eca/admin/marks/${entry._id}`, { status: 'published' })));
      setMessage('Published successfully');
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to publish ECA marks');
    }
  };

  const categorySummary = useMemo(() => (category) => {
    if (category.applyToAllClasses) return 'All Classes';
    return (category.applicableClasses || []).join(', ') || '—';
  }, []);

  const marksClassOptions = useMemo(() => {
    const classes = new Set();
    marks.forEach((entry) => {
      const className = entry.classId?.name || entry.className || '';
      if (className) classes.add(className);
    });
    return Array.from(classes).sort();
  }, [marks]);

  const visibleMarks = useMemo(() => {
    const filtered = marks.filter((entry) => {
      const className = entry.classId?.name || entry.className || '';
      return !selectedMarksClass || className === selectedMarksClass;
    });

    const grouped = {};
    filtered.forEach((entry) => {
      const studentId = entry.student?._id || entry.student || '';
      if (!studentId) return;
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student: entry.student,
          className: entry.classId?.name || entry.className || '',
          entries: []
        };
      }
      grouped[studentId].entries.push(entry);
    });

    return Object.values(grouped);
  }, [marks, selectedMarksClass]);

  const visibleCategoryColumns = useMemo(() => {
    const columns = [];
    const seen = new Set();
    visibleMarks.forEach((group) => {
      group.entries.forEach((entry) => {
        const label = entry.category?.name || entry.categoryName || '';
        const key = entry.category?._id || entry.category || entry.categoryName || entry._id;
        if (!label || seen.has(key)) return;
        seen.add(key);
        columns.push({ key, label });
      });
    });
    return columns;
  }, [visibleMarks]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">ECA Management</h1>
        <p className="text-sm text-slate-600">Create categories, assign classes, and manage ECA marks entries.</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingCategoryId ? 'Edit ECA Category' : 'Create ECA Category'}</h2>
            {editingCategoryId && <button type="button" onClick={resetForm} className="text-sm font-medium text-indigo-600">Cancel</button>}
          </div>

          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ECA Name</label>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Essay Competition" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
              <input type="text" value={form.academicYear} onChange={(event) => setForm((prev) => ({ ...prev, academicYear: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="2026" />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.applyToAllClasses} onChange={(event) => setForm((prev) => ({ ...prev, applyToAllClasses: event.target.checked }))} />
              Apply to all classes
            </label>

            {!form.applyToAllClasses && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Applicable Classes</p>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-3">
                  {CLASS_OPTIONS.map((className) => (
                    <label key={className} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={form.applicableClasses.includes(className)} onChange={() => handleClassToggle(className)} />
                      {className}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">{editingCategoryId ? 'Save Changes' : 'Create Category'}</button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">ECA Categories</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Applicable Classes</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-800">{category.name}</td>
                    <td className="px-3 py-2">{categorySummary(category)}</td>
                    <td className="px-3 py-2">{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleEditCategory(category)} className="rounded bg-amber-500 px-2.5 py-1 text-white">Edit</button>
                        <button onClick={() => handleDeleteCategory(category._id)} className="rounded bg-rose-600 px-2.5 py-1 text-white">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Entered ECA Marks</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={selectedMarksClass} onChange={(event) => setSelectedMarksClass(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">All Classes</option>
              {marksClassOptions.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
            <button onClick={handlePublishClass} className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Publish Class</button>
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          {selectedMarksClass ? `Showing ECA entries for ${selectedMarksClass}.` : 'Showing all classes.'}
        </p>

        {loading ? <div className="text-sm text-slate-500">Loading ECA mark entries...</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Class</th>
                  {visibleCategoryColumns.map((column) => <th key={column.key} className="px-3 py-2">{column.label}</th>)}
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleMarks.length === 0 ? (
                  <tr>
                    <td colSpan={4 + visibleCategoryColumns.length} className="px-3 py-4 text-center text-slate-500">No ECA marks found for this selection.</td>
                  </tr>
                ) : (
                  visibleMarks.map((group) => {
                    const studentId = group.student?._id || '';
                    const isEditing = editingStudentId === studentId;
                    return (
                      <tr key={studentId} className="border-t border-slate-200 align-top">
                        <td className="px-3 py-2 font-medium text-slate-800">{group.student?.fullName || 'Student'}</td>
                        <td className="px-3 py-2">{group.className || '—'}</td>
                        {visibleCategoryColumns.map((column) => {
                          const entry = (group.entries || []).find((item) => (item.category?._id || item.category || item.categoryName || item._id) === column.key);
                          const draftValue = rowDrafts[studentId]?.[column.key];
                          return (
                            <td key={`${studentId}-${column.key}`} className="px-3 py-2">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input type="text" value={draftValue?.marks || ''} onChange={(event) => handleRowDraftChange(studentId, column.key, event.target.value)} className="w-24 rounded border border-slate-300 px-2 py-1" placeholder="A" />
                                  {draftValue?.markId && (
                                    <button onClick={() => handleDeleteEntry(draftValue.markId)} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white">Delete</button>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium">{entry?.marks || '—'}</div>
                                  <div className="text-xs uppercase text-slate-500">{entry?.status || 'draft'}</div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => handleSaveRowEdit(studentId)} className="rounded bg-green-600 px-2.5 py-1 text-white">Save</button>
                              <button onClick={() => {
                                setEditingStudentId('');
                                setRowDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[studentId];
                                  return next;
                                });
                              }} className="rounded bg-slate-200 px-2.5 py-1">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => startRowEdit(group)} className="rounded bg-blue-600 px-2.5 py-1 text-white">Edit</button>
                              <button onClick={() => handleBulkStatusChange(group, 'verify')} className="rounded bg-amber-600 px-2.5 py-1 text-white">Verify</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
