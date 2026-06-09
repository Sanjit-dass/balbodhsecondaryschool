import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LibraryForm from '../components/LibraryForm';
import ExportActions from '../components/ExportActions';

export default function Library(){
  const [books, setBooks] = useState([]);
  const [editing, setEditing] = useState(null);
  useEffect(()=>{ fetch(); },[]);
  const fetch=async()=>{ try{ const res=await api.get('/library'); setBooks(res.data.books||[]); }catch(err){console.error(err);} };
  const remove=async(id)=>{ if(!window.confirm('Delete book?')) return; try{ await api.delete(`/library/${id}`); fetch(); }catch(err){console.error(err);} };

  return (
    <div>
      <h1 className="text-2xl mb-4">Library</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={()=>setEditing(null)} className="p-2 bg-blue-600 text-white rounded">New</button>
        <ExportActions resource="library" />
      </div>
      <LibraryForm existing={editing} onSaved={()=>{ setEditing(null); fetch(); }} />
      <div className="grid gap-4">
        {books.map(b=> (
          <div key={b._id} className="p-4 bg-white shadow rounded flex justify-between items-center">
            <div>
              <div className="font-bold">{b.title}</div>
              <div className="text-sm text-gray-600">Author: {b.author} · ISBN: {b.isbn}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setEditing(b)} className="p-1 bg-yellow-400 rounded">Edit</button>
              <button onClick={()=>remove(b._id)} className="p-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
