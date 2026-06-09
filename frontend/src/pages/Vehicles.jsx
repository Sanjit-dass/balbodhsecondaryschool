import React, { useEffect, useState } from 'react';
import api from '../services/api';
import VehicleForm from '../components/VehicleForm';
import ExportActions from '../components/ExportActions';

export default function Vehicles(){
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  useEffect(()=>{ fetch(); },[]);
  const fetch=async()=>{ try{ const res=await api.get('/vehicles'); setList(res.data.vehicles||[]); }catch(err){console.error(err);} };
  const remove=async(id)=>{ if(!window.confirm('Delete vehicle?')) return; try{ await api.delete(`/vehicles/${id}`); fetch(); }catch(err){console.error(err);} };

  return (
    <div>
      <h1 className="text-2xl mb-4">Vehicles</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={()=>setEditing(null)} className="p-2 bg-blue-600 text-white rounded">New</button>
        <ExportActions resource="vehicles" />
      </div>
      <VehicleForm existing={editing} onSaved={()=>{ setEditing(null); fetch(); }} />
      <div className="grid gap-4">
        {list.map(v=> (
          <div key={v._id} className="p-4 bg-white shadow rounded flex justify-between items-center">
            <div>
              <div className="font-bold">{v.name}</div>
              <div className="text-sm text-gray-600">Route: {v.route} · Capacity: {v.capacity}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setEditing(v)} className="p-1 bg-yellow-400 rounded">Edit</button>
              <button onClick={()=>remove(v._id)} className="p-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
