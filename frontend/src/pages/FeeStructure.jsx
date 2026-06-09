import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function FeeStructure(){
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [structure, setStructure] = useState([]);
  const [allStructures, setAllStructures] = useState([]);

  const preferredClassOrder = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
  const orderedStructures = [...allStructures].sort((a,b)=>{
    const aIndex = preferredClassOrder.indexOf(a.className);
    const bIndex = preferredClassOrder.indexOf(b.className);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
    return a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' });
  });

  useEffect(()=>{ fetchCategories(); fetchClasses(); fetchAllStructures(); },[]);

  async function fetchCategories(){
    try{ const res = await api.get('/fees/categories'); setCategories(res.data || res); }catch(e){console.error(e);} }
  async function fetchClasses(){ try{ const res = await api.get('/classes'); setClasses(res.data.classes||res.data||[]); }catch(e){console.error(e);} }

  async function fetchAllStructures(){
    try{
      const res = await api.get('/fees/structure');
      const data = res.data || res;
      setAllStructures(data.structures || []);
    } catch(e){
      console.error(e);
    }
  }

  async function addCategory(){
    const name = newName.trim();
    if(!name){
      alert('Enter a fee category name first.');
      return;
    }

    try{
      await api.post('/fees/categories', { name });
      setNewName('');
      fetchCategories();
      fetchAllStructures();
    } catch(e){
      console.error(e);
      alert(e?.response?.data?.message || 'Unable to save fee category.');
    }
  }

  async function removeCategory(id){ if(!window.confirm('Delete category?')) return; try{ await api.delete(`/fees/categories/${id}`); fetchCategories(); }catch(e){console.error(e);} }

  async function loadStructure(classId){
    if(!classId) return setStructure([]);
    try{
      const res = await api.get('/fees/categories', { params: { classId } });
      const data = Array.isArray(res.data) ? res.data : [];
      setStructure(data.map(item => ({ category: item.name, amount: Number(item.amount || item.defaultAmount || 0) })));
      setSelectedClass(classId);
    } catch(e){
      console.error(e);
    }
  }

  function setAmountForCategory(catName, amt){
    setStructure(s=>{
      const copy = [...s];
      const idx = copy.findIndex(x=>x.category===catName);
      if(idx>=0) copy[idx].amount = Number(amt||0);
      else copy.push({ category: catName, amount: Number(amt||0) });
      return copy;
    });
  }

  async function saveStructure(){
    if(!selectedClass) { alert('Select a class first'); return; }
    try{
      const payload = { items: structure.map(s=>({ name: s.category, amount: s.amount })) };
      await api.post(`/fees/structure/${selectedClass}`, payload);
      alert('Saved');
      loadStructure(selectedClass);
      fetchAllStructures();
    }catch(e){console.error(e); alert('Save failed');}
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Fee Categories</h1>
      <div className="text-sm text-slate-500 mb-4">Type a category like Admission Fee, Book Fee, Tuition Fee, then click Add. Categories are stored permanently and available when assigning them to classes.</div>

      <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Type fee category name (e.g. Admission Fee)" className="p-2 border rounded flex-1" />
          <button onClick={addCategory} className="px-4 py-2 bg-indigo-600 text-white rounded">Add</button>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-medium">Saved Fee Categories</h2>
          <div className="mt-2 grid gap-2">
            {categories.length===0 && <div className="text-gray-500">No categories yet. Add one to save it permanently.</div>}
            {categories.map(c=> (
              <div key={c._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>{c.name}</div>
                <div className="flex gap-2">
                  <button onClick={()=>{ const name = prompt('Edit name', c.name); if(name) api.put(`/fees/categories/${c._id}`, { name }).then(()=>fetchCategories()); }} className="px-3 py-1 bg-yellow-400 rounded">Edit</button>
                  <button onClick={()=>removeCategory(c._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft p-4">
        <h2 className="text-lg font-medium mb-3">Assign Fee Structure To Class</h2>
        <div className="flex gap-3 mb-4">
          <select value={selectedClass} onChange={e=>{ loadStructure(e.target.value); }} className="p-2 border rounded">
            <option value="">Select Class</option>
            {classes.map(cl=> <option key={cl._id} value={cl._id}>{cl.name}</option>)}
          </select>
          <button onClick={()=> selectedClass && loadStructure(selectedClass)} className="px-3 py-2 bg-gray-200 rounded">Reload</button>
        </div>

        <div>
          {categories.map(cat=>{
            const existing = structure.find(s=>s.category===cat.name) || { amount: 0 };
            const amountValue = existing.amount !== undefined && existing.amount !== null ? existing.amount : 0;
            return (
              <div key={cat._id} className="flex items-center gap-3 mb-2">
                <div className="w-64">{cat.name}</div>
                <input type="text" value={amountValue} placeholder="0" onChange={e=>setAmountForCategory(cat.name, e.target.value)} className="p-2 border rounded w-40" />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={saveStructure} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Fee Structure</button>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-3xl p-1 shadow-xl">
        <div className="bg-white rounded-3xl p-6 shadow-inner">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Saved Fee Structure by Class</h2>
              <p className="text-sm text-slate-500">Premium class-wise view with Nursery, LKG, UKG, then 1–10 order.</p>
            </div>
          </div>

          {orderedStructures.length === 0 ? (
            <div className="text-gray-500">No class-wise fee structure saved yet.</div>
          ) : (
            <div className="space-y-6">
              {orderedStructures.map(cls => {
                const classTotal = cls.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                return (
                  <div key={cls.classId} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-100 p-5 shadow-sm hover:shadow-lg transition-shadow duration-200">
                    <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="inline-flex flex-col items-start rounded-3xl bg-blue-600 px-6 py-4 text-white shadow-sm">
                        <div className="text-xs uppercase tracking-[0.25em]">Class</div>
                        <div className="text-2xl font-bold">{cls.className}</div>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-white text-sm font-semibold shadow-sm sm:ml-auto">
                        {classTotal.toLocaleString()} total
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fee Category</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {cls.items.map(item => (
                            <tr key={item.category} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-700">{item.category}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{Number(item.amount || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">Total</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{classTotal.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
