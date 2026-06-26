import React, { useEffect, useState } from 'react';
import api from '../services/api';
import TeacherForm from '../components/TeacherForm';
import ExportActions from '../components/ExportActions';

export default function Teachers(){
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(()=>{ fetch(); },[]);

  const fetch = async (query = '') => {
    try {
      const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await api.get(`/teachers${suffix}`);
      setList(res.data.teachers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id)=>{
    if(!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
    try{
      await api.delete(`/teachers/${id}`);
      fetch(search);
      if(selected && selected._id === id) setSelected(null);
    }catch(err){
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(search);
  };

  return (
    <div className="space-y-3 md:space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 md:gap-3 sm:gap-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 p-3 md:p-4 sm:p-6 rounded-xl md:rounded-2xl sm:rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-white">Teacher Management</h1>
          <p className="text-slate-300 sm:text-slate-200 text-xs md:text-sm sm:text-base max-w-2xl mt-1 md:mt-1 sm:mt-2">Add, search, edit, and remove teaching staff from the admin portal.</p>
        </div>
        <div className="flex justify-end">
          <button onClick={()=>{ setEditing(null); setSelected(null); }} className="btn-primary text-xs md:text-sm sm:text-base px-3 md:px-4 sm:px-6 py-2 md:py-2 sm:py-3">Add Teacher</button>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3 sm:space-y-4">
        <div className="rounded-xl md:rounded-2xl sm:rounded-3xl bg-white p-3 md:p-4 sm:p-6 shadow-lg">
          <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Total Teachers</div>
          <div className="mt-1 md:mt-2 text-2xl md:text-3xl sm:text-4xl font-bold text-slate-900">{list.length}</div>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="flex-1 min-w-0 rounded-xl md:rounded-2xl border border-slate-300 bg-white px-3 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 text-xs md:text-sm sm:text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" className="rounded-xl md:rounded-2xl bg-indigo-600 px-3 md:px-4 sm:px-5 py-2 md:py-2 sm:py-3 text-xs md:text-sm sm:text-base text-white font-medium hover:bg-indigo-700 transition whitespace-nowrap">Search</button>
        </form>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ExportActions resource="teachers" />
      </div>

      <TeacherForm key={editing ? editing._id : 'new'} existing={editing} onSaved={()=>{ setEditing(null); fetch(search); }} />

      {list.length === 0 ? (
        <div className="p-4 sm:p-6 bg-white shadow rounded-2xl text-center text-slate-500 text-sm sm:text-base">No teachers found. Add a new teacher to begin.</div>
      ) : (
        <>
          <div className="lg:hidden grid gap-2 md:gap-3 sm:gap-4">
            {list.map((t) => (
              <div key={t._id} className="rounded-xl md:rounded-2xl sm:rounded-3xl bg-white p-3 md:p-3 sm:p-4 shadow border border-slate-200">
                <div className="flex items-start justify-between gap-2 md:gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm sm:text-base font-semibold text-slate-900 truncate">{t.fullName || 'Unnamed'}</div>
                    <div className="text-[10px] md:text-xs sm:text-sm text-slate-500">{t.employeeId || 'ID N/A'}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 md:px-2 sm:px-3 py-1 text-[10px] md:text-xs sm:text-xs uppercase tracking-wider text-slate-600 whitespace-nowrap">{t.status || 'active'}</span>
                </div>
                <div className="mt-2 md:mt-2 sm:mt-3 grid gap-1 md:gap-2 text-[10px] md:text-xs sm:text-sm text-slate-600">
                  <div><strong>Subject:</strong> {t.subject || 'N/A'}</div>
                  <div><strong>Class:</strong> {t.assignedClass || 'N/A'}</div>
                  <div><strong>Phone:</strong> {t.phone || 'N/A'}</div>
                  <div><strong>Email:</strong> {t.email || 'N/A'}</div>
                </div>
                <div className="mt-2 md:mt-3 sm:mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={()=>setSelected(t)} className="flex-1 min-w-[60px] md:min-w-[70px] rounded-lg md:rounded-xl border border-slate-300 px-2 md:px-2 sm:px-3 py-2 text-[10px] md:text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition">View</button>
                  <button type="button" onClick={()=>{ setEditing(t); setSelected(t); }} className="flex-1 min-w-[60px] md:min-w-[70px] rounded-lg md:rounded-xl bg-yellow-400 px-2 md:px-2 sm:px-3 py-2 text-[10px] md:text-xs sm:text-sm text-slate-900 hover:bg-yellow-500 transition">Edit</button>
                  <button type="button" onClick={()=>remove(t._id)} className="flex-1 min-w-[60px] md:min-w-[70px] rounded-lg md:rounded-xl bg-red-600 px-2 md:px-2 sm:px-3 py-2 text-[10px] md:text-xs sm:text-sm text-white hover:bg-red-700 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto rounded-xl md:rounded-2xl sm:rounded-3xl bg-white shadow-lg">
            <table className="w-full border-collapse text-left text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Employee ID</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Name</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Subject</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Class</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Phone</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:sm:py-3 font-semibold">Email</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Joined</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Status</th>
                  <th className="px-2 md:px-3 sm:px-4 py-2 md:py-2 sm:py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t._id} className="border-t border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700">{t.employeeId || 'N/A'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700 font-medium">{t.fullName || 'Unnamed'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700">{t.subject || 'N/A'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700">{t.assignedClass || 'N/A'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700">{t.phone || 'N/A'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700 text-[10px] md:text-xs sm:text-sm">{t.email || 'N/A'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 text-slate-700 text-[10px] md:text-xs sm:text-sm">{t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 capitalize text-slate-700"><span className="inline-block px-2 py-1 rounded-full text-[10px] md:text-xs sm:text-xs bg-slate-100">{t.status || 'active'}</span></td>
                    <td className="px-2 md:px-3 sm:px-4 py-2 md:py-3 sm:py-4 space-x-1 md:space-x-1 sm:space-x-2">
                      <button type="button" onClick={()=>setSelected(t)} className="rounded-lg border border-slate-300 px-2 md:px-2 sm:px-3 py-1 md:py-1 sm:py-2 text-[10px] md:text-xs sm:text-xs text-slate-700 hover:bg-slate-50 transition">View</button>
                      <button type="button" onClick={()=>{ setEditing(t); setSelected(t); }} className="rounded-lg bg-yellow-400 px-2 md:px-2 sm:px-3 py-1 md:py-1 sm:py-2 text-[10px] md:text-xs sm:text-xs text-slate-900 hover:bg-yellow-500 transition">Edit</button>
                      <button type="button" onClick={()=>remove(t._id)} className="rounded-lg bg-red-600 px-2 md:px-2 sm:px-3 py-1 md:py-1 sm:py-2 text-[10px] md:text-xs sm:text-xs text-white hover:bg-red-700 transition">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <div className="rounded-xl md:rounded-2xl sm:rounded-3xl bg-white p-3 md:p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col gap-2 md:gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 sm:mb-5">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg sm:text-xl font-semibold text-slate-900">Teacher Details</h2>
              <p className="text-xs md:text-sm sm:text-base text-slate-500 truncate">{selected.fullName || 'Unnamed teacher'}</p>
            </div>
            <button className="rounded-xl md:rounded-2xl bg-slate-100 px-3 md:px-3 sm:px-4 py-2 text-xs md:text-sm sm:text-sm text-slate-700 hover:bg-slate-200 transition w-full sm:w-auto" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="grid gap-2 md:gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Employee ID</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 font-semibold">{selected.employeeId || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Subject</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 font-semibold">{selected.subject || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Class</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 font-semibold">{selected.assignedClass || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Status</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 font-semibold capitalize">{selected.status || 'active'}</div>
            </div>
            <div className="bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Phone</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 font-semibold">{selected.phone || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Joining Date</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 font-semibold">{selected.joiningDate ? new Date(selected.joiningDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Email</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900 break-all">{selected.email || 'N/A'}</div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 bg-slate-50 p-2 md:p-3 sm:p-4 rounded-lg md:rounded-xl">
              <div className="text-[10px] md:text-xs sm:text-sm text-slate-500 font-medium">Address</div>
              <div className="mt-1 text-xs md:text-sm sm:text-base text-slate-900">{selected.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
