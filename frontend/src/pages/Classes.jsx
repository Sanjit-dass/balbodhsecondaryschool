import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ClassForm from '../components/ClassForm';
import ExportActions from '../components/ExportActions';

export default function Classes(){
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  useEffect(()=>{ fetch(); },[]);
  const fetch=async()=>{ try{ const res=await api.get('/classes'); setList(res.data.classes||[]); }catch(err){console.error(err);} };

  const remove = async (id)=>{ if(!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return; try{ await api.delete(`/classes/${id}`); fetch(); }catch(err){console.error(err);} };

  return (
    <div>
      <h1 className="text-2xl mb-4">Classes</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={()=>setEditing(null)} className="p-2 bg-blue-600 text-white rounded">New</button>
        <ExportActions resource="classes" />
      </div>
      <ClassForm existing={editing} onSaved={()=>{ setEditing(null); fetch(); }} />
      <div className="grid gap-4">
        {list.map(c=> (
          <div key={c._id} className="p-4 bg-white shadow rounded flex justify-between items-center">
            <div>
              <div className="font-bold">{c.name}</div>
              <div className="text-sm text-gray-600">Year: {c.academicYear}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setEditing(c)} className="p-1 bg-yellow-400 rounded">Edit</button>
              <button onClick={()=>remove(c._id)} className="p-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
