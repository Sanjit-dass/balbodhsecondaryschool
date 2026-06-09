import React, { useEffect, useState } from 'react';
import PremiumTable from '../components/fee/PremiumTable';

export default function ClassStudents({ classId }){
  const [rows, setRows] = useState([]);

  useEffect(()=>{
    if (!classId) return;
    (async ()=>{
      try{
        const studentsRes = await fetch(`/api/fees/class/${classId}/students`).then(r=>r.json());
        setRows(studentsRes.data||[]);
      }catch(err){ console.error(err); }
    })();
  },[classId]);

  const formatFeeBreakdown = (feeBreakdown) => {
    if (Array.isArray(feeBreakdown)) return feeBreakdown;
    if (feeBreakdown && typeof feeBreakdown === 'object') {
      return Object.entries(feeBreakdown).map(([category, amount]) => ({ category, amount }));
    }
    return [];
  };

  const columns = [
    { key: 'admissionNumber', label: 'Roll No', width: '8%' },
    { key: 'name', label: 'Student Name', width: '24%' },
    { key: 'feeBreakdown', label: 'Fee', width: '20%', render: r=> {
      const breakdown = formatFeeBreakdown(r.feeBreakdown);
      return (
        <div className="text-sm text-slate-700 space-y-1">
          {breakdown.length > 0 ? (
            breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-4">
                <span>{item.category}</span>
                <span className="font-semibold">RS{Number(item.amount||0).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No fee data</div>
          )}
        </div>
      );
    } },
    { key: 'totalFee', label: 'Total Fee', width: '12%', render: r=> `RS${Number(r.totalFee||0).toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid Amount', width: '12%', render: r=> `RS${Number(r.paidAmount||0).toLocaleString()}` },
    { key: 'dueAmount', label: 'Due Amount', width: '12%', render: r=> `RS${Number(r.dueAmount||0).toLocaleString()}` },
    { key: 'feeStatus', label: 'Status', width: '12%', render: (r)=> (<span className={`px-2 py-1 rounded ${r.feeStatus==='Paid'?'bg-green-100 text-green-700': r.feeStatus==='Partial'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{r.feeStatus}</span>) },
  ];

  const actions = [
    { key: 'view', label: 'View', onClick: (r)=> window.location.href = `/admin/fees/student/${r.studentId}` },
    { key: 'collect', label: 'Collect Fee', onClick: (r)=> window.location.href = `/admin/fees/collect?student=${r.studentId}` },
    { key: 'receipt', label: 'Print', onClick: (r)=> window.open(`/api/fees/student/${r.studentId}/history`) },
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Students</h1>
      <PremiumTable columns={columns} rows={rows} actions={actions} />
    </div>
  );
}
