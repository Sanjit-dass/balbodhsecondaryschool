import React, { useEffect, useState } from 'react';
import api from '../../services/api';

// Import class sorting utility
const classUtils = {
  getClassOrder(className) {
    if (!className) return 999;
    const name = String(className).trim();
    let cleanName = name.replace(/^class\s+/i, '').trim();
    
    const ORDER = {
      'Nursery': 0, 'nursery': 0,
      'LKG': 1, 'lkg': 1,
      'UKG': 2, 'ukg': 2,
      '1': 3, '2': 4, '3': 5, '4': 6, '5': 7, '6': 8, '7': 9, '8': 10, '9': 11, '10': 12,
    };
    
    if (ORDER.hasOwnProperty(cleanName)) return ORDER[cleanName];
    const lowerName = cleanName.toLowerCase();
    if (ORDER.hasOwnProperty(lowerName)) return ORDER[lowerName];
    
    const numMatch = cleanName.match(/^(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (num >= 1 && num <= 10) return num + 2;
    }
    
    const lower = cleanName.toLowerCase();
    if (lower.startsWith('nursery')) return 0;
    if (lower.startsWith('lkg')) return 1;
    if (lower.startsWith('ukg')) return 2;
    
    return 999;
  },
  
  sortClasses(classes) {
    if (!Array.isArray(classes)) return [];
    return [...classes].sort((a, b) => {
      const nameA = (typeof a === 'string') ? a : (a.name || a);
      const nameB = (typeof b === 'string') ? b : (b.name || b);
      return this.getClassOrder(nameA) - this.getClassOrder(nameB);
    });
  }
};

export default function FeeCategories() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Mandatory Fee');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('Mandatory Fee');
  const [editStatus, setEditStatus] = useState('active');
  const [editClassId, setEditClassId] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [selectedClassId]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      let classList = Array.isArray(res.data) ? res.data : res.data?.classes || [];
      // SORT CLASSES IN CORRECT ORDER
      classList = classUtils.sortClasses(classList);
      setClasses(classList);
      if (!selectedClassId && classList.length) {
        setSelectedClassId(classList[0]._id || classList[0].id || '');
      }
    } catch (err) {
      console.error(err);
      showNotification('Unable to load classes.', 'error');
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClassId) params.classId = selectedClassId;
      const res = await api.get('/fees/categories', { params });
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      showNotification('Unable to load fee categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getClassName = (cat) => {
    if (cat.className) return cat.className;
    if (!cat.classId) return 'Unknown';
    const cls = classes.find((c) => String(c._id) === String(cat.classId) || String(c.id) === String(cat.classId));
    return cls?.name || String(cat.classId);
  };

  const handleCreate = async () => {
    if (!selectedClassId) {
      showNotification('Please select a class before creating a category.', 'error');
      return;
    }
    if (!name.trim()) {
      showNotification('Please enter a category name.', 'error');
      return;
    }
    if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase() && String(cat.classId) === String(selectedClassId))) {
      showNotification('This category already exists for the selected class.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post('/fees/categories', {
        classId: selectedClassId,
        name: name.trim(),
        amount: Number(amount || 0),
        categoryType: type,
        status,
      });
      showNotification('Category created successfully.');
      setName('');
      setAmount('');
      setType('Mandatory Fee');
      setStatus('active');
      await fetchCategories();
    } catch (err) {
      console.error(err);
      showNotification(err?.response?.data?.message || 'Failed to create category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    const catId = category._id || category.id;
    setEditingId(catId);
    setEditName(category.name);
    setEditAmount(category.amount ?? category.defaultAmount ?? 0);
    setEditType(category.categoryType || 'Mandatory Fee');
    setEditStatus(category.status || 'active');
    setEditClassId(category.classId || selectedClassId || '');
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      showNotification('Category name cannot be empty.', 'error');
      return;
    }
    if (categories.some((cat) => (cat._id || cat.id) !== editingId && cat.name.toLowerCase() === editName.toLowerCase() && String(cat.classId) === String(editClassId))) {
      showNotification('Another category already uses that name for this class.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/fees/categories/${editingId}`, {
        classId: editClassId,
        name: editName.trim(),
        amount: Number(editAmount || 0),
        categoryType: editType,
        status: editStatus,
      });
      showNotification('Category updated successfully.');
      setEditingId(null);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      showNotification(err?.response?.data?.message || 'Failed to update category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryId = (category) => category._id || category.id;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This action cannot be undone.')) return;

    setSaving(true);
    try {
      await api.delete(`/fees/categories/${id}`);
      showNotification('Category deleted successfully.');
      await fetchCategories();
    } catch (err) {
      console.error(err);
      showNotification(err?.response?.data?.message || 'Failed to delete category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditName('');
    setEditAmount('');
    setEditType('Mandatory Fee');
    setEditStatus('active');
    setEditClassId('');
  };

  const totalCategories = categories.length;
  const mandatoryCount = categories.filter((c) => c.categoryType === 'Mandatory Fee').length;
  const optionalCount = categories.filter((c) => c.categoryType === 'Optional Service').length;
  const activeCount = categories.filter((c) => c.status === 'active').length;

  const typeColor = (value) => {
    return value === 'Mandatory Fee' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700';
  };

  const statusColor = (value) => {
    return value === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-3xl border px-5 py-4 text-sm ${
          notification.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-rose-200 bg-rose-50 text-rose-800'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Total Categories</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{totalCategories}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Mandatory</div>
          <div className="mt-3 text-3xl font-semibold text-indigo-600">{mandatoryCount}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Optional</div>
          <div className="mt-3 text-3xl font-semibold text-amber-600">{optionalCount}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Active</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-600">{activeCount}</div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Create Fee Category</h2>
          <p className="mt-2 text-sm text-slate-500">Assign a new fee category directly to a class. Mandatory items are applied automatically during collection, optional items can be adjusted per student.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_160px_160px_160px_160px] items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Fee"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="Mandatory Fee">Mandatory</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Fee Categories</h2>
            <p className="mt-1 text-sm text-slate-500">Showing categories for {selectedClassId ? getClassName({ classId: selectedClassId }) : 'all classes'}.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedClassId('')}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Show all classes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No fee categories created yet. Add your first category above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-[0.18em]">Category Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-[0.18em]">Class</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-[0.18em]">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-[0.18em]">Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-[0.18em]">Status</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-600 uppercase tracking-[0.18em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {categories.map((cat) => {
                  const catId = cat._id || cat.id;
                  return (
                    <tr key={catId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                      <td className="px-6 py-4 text-slate-700">{getClassName(cat)}</td>
                      <td className="px-6 py-4 text-slate-700">RS{Number(cat.amount || cat.defaultAmount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeColor(cat.categoryType)}`}>
                          {cat.categoryType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(cat.status)}`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(catId)}
                          className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-slate-900">Edit Category</h3>
              <p className="mt-2 text-sm text-slate-500">Update category details below.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Class</label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Category Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Amount</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Mandatory Fee">Mandatory</option>
                  <option value="Optional Service">Optional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeEditModal}
                className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
