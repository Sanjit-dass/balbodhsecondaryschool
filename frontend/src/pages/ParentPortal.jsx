import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

export default function ParentPortal(){
  const { user } = useContext(AuthContext);
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(()=>{
    api.get('/fees').then(r=>setFees(r.data.fees||[])).catch(()=>{});
    api.get('/attendance').then(r=>setAttendance(r.data.attendance||[])).catch(()=>{});
  },[]);

  return (
    <div>
      <h1 className="text-2xl mb-4">Parent Portal</h1>
      <div className="bg-white p-4 shadow rounded mb-4">
        <div className="text-lg font-semibold">Welcome, {user?.name || user?.email || 'Parent'}</div>
        <div className="text-sm text-gray-600">Role: {user?.role}</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white p-4 shadow rounded">
          <div className="font-bold mb-2">Fee Ledger</div>
          <p className="text-sm text-gray-600 mb-4">View your child's fee summary, pending dues, payment history, and receipts in a secure read-only portal.</p>
          <a href="/parent/fees" className="inline-flex items-center justify-center rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 transition">Open Fee Ledger</a>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <div className="font-bold mb-2">Attendance Overview</div>
          <ul className="space-y-2">
            {attendance.slice(0,4).map(a=> (<li key={a._id} className="border p-2 rounded"><div className="font-semibold">{new Date(a.date).toLocaleDateString()}</div><div className="text-sm text-gray-600">Type: {a.type} · Records: {a.records?.length || 0}</div></li>))}
          </ul>
        </div>
      </div>
    </div>
  );
}
