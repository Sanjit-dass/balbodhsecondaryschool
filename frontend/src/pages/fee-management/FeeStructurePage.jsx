import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function FeeStructurePage() {
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [structure, setStructure] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchClasses();
  }, []);

  async function fetchCategories() {
    try {
      const res = await api.get('/fees/categories');
      setCategories(res.data || res);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchClasses() {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes || res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStructure(classId) {
    setSelectedClass(classId);
    if (!classId) {
      setStructure([]);
      return;
    }

    try {
      const res = await api.get('/fees/categories', { params: { classId } });
      const data = Array.isArray(res.data) ? res.data : [];
      setStructure(data.map(item => ({ category: item.name, amount: Number(item.amount || item.defaultAmount || 0) })));
    } catch (err) {
      console.error(err);
    }
  }

  function setAmount(category, value) {
    const amount = Number(value || 0);
    setStructure(current => {
      const copy = [...current];
      const index = copy.findIndex(item => item.category === category);
      if (index === -1) {
        copy.push({ category, amount });
      } else {
        copy[index] = { ...copy[index], amount };
      }
      return copy;
    });
  }

  async function saveStructure() {
    if (!selectedClass) {
      alert('Select a class first.');
      return;
    }

    try {
      const payload = { items: structure.map(item => ({ name: item.category, amount: item.amount })) };
      await api.post(`/fees/structure/${selectedClass}`, payload);
      alert('Structure saved.');
      loadStructure(selectedClass);
    } catch (err) {
      console.error(err);
      alert('Unable to save structure.');
    }
  }

  const totalAmount = useMemo(() => {
    return structure.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [structure]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Fee Structure</h1>
        <p className="text-sm text-slate-500 mt-2">Assign a fee structure for each class using the stored fee categories.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-soft p-6 border border-slate-200">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Select Class</label>
            <select
              value={selectedClass}
              onChange={e => loadStructure(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select Class</option>
              {classes.map(cl => (
                <option key={cl._id} value={cl._id}>{cl.name}</option>
              ))}
            </select>
          </div>
          <button onClick={saveStructure} className="rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition">
            Save Structure
          </button>
        </div>

        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-500">No fee categories available. Create categories first.</div>
          ) : (
            categories.map(category => {
              const item = structure.find(s => s.category === category.name) || { amount: 0 };
              return (
                <div key={category._id} className="grid sm:grid-cols-[1fr_auto] gap-3 items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{category.name}</div>
                  </div>
                  <input
                    type="number"
                    value={item.amount}
                    min="0"
                    onChange={e => setAmount(category.name, e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Total structure amount</div>
            <div className="text-xl font-semibold text-slate-900">RS{totalAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button onClick={() => navigate('/fee-management/categories')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition">
          ← Previous Go To Fee Categories
        </button>
        <button onClick={() => navigate('/fee-management/collect')} className="rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition">
          NEXT → Go To Collect Fee
        </button>
      </div>
    </div>
  );
}
