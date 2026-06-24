import React, { useEffect, useState } from 'react';
import PremiumTable from '../components/fee/PremiumTable';
import api from '../services/api';

export default function ClassStudents({ classId }){
  const [rows, setRows] = useState([]);

  useEffect(()=>{
    if (!classId) return;
    (async ()=>{
      try{
        const studentsRes = await fetch(`/api/fees/class/${classId}/students`).then(r=>r.json());
        const list = studentsRes.data||[];
        // Enrich each row with authoritative fee summary (same logic as FeePayment)
        try{
          const enriched = await Promise.all(list.map(async (r)=>{
            const sid = r.studentId || r._id || r.id || r.student || r.studentId;
            if (!sid) return r;
            try{
              const resp = await api.get(`/fees/student/${encodeURIComponent(sid)}`);
              const data = resp.data || resp;
              const summary = data.summary || {};
              // Prefer backend totals when present
              let totalFee = Number(summary.totalFee || 0);
              let totalPaid = Number(summary.totalPaid || 0);
              let totalDue = Number(summary.totalDue || 0);
              let status = summary.status || '';

              // If backend totals missing, compute from feeBreakdown
              if (!totalFee && Array.isArray(summary.feeBreakdown) && summary.feeBreakdown.length>0) {
                totalFee = summary.feeBreakdown.reduce((s,it)=>s+Number(it?.actualFee ?? it?.amount ?? 0),0);
              }

              // try receipts for totalPaid if backend doesn't provide
              try{
                const hist = await api.get(`/fees/student/${encodeURIComponent(sid)}/history`);
                const histData = Array.isArray(hist.data) ? hist.data : (hist.data && Array.isArray(hist.data.data) ? hist.data.data : []);
                const paidSum = histData.reduce((s,rec)=>{
                  try{
                    const breakdown = rec.breakdown || rec.data?.breakdown || rec.data || {};
                    if (Array.isArray(breakdown)) return s + breakdown.reduce((ss,it)=>ss + Number(it?.amount ?? it?.paid ?? 0),0);
                    if (breakdown && typeof breakdown === 'object') return s + Object.values(breakdown).reduce((ss,v)=>ss + Number(v||0),0);
                  }catch(e){}
                  return s;
                },0);
                if (paidSum>0) totalPaid = paidSum;
              }catch(e){}

              // If still missing totalFee, try class categories
              if (!totalFee) {
                try{
                  const classIdVal = data.student?.classId || data.student?.class || r.classId || null;
                  if (classIdVal) {
                    const cats = await api.get('/fees/categories', { params: { classId: classIdVal } });
                    const catsData = Array.isArray(cats.data) ? cats.data : (cats.data && Array.isArray(cats.data.data) ? cats.data.data : []);
                    totalFee = catsData.reduce((s,it)=>s + Number(it?.amount ?? it?.defaultAmount ?? 0),0);
                  }
                }catch(e){}
              }

              totalDue = Math.max(0, Number(totalFee || 0) - Number(totalPaid || 0));
              // compute status per rules
              if (Number(totalDue) === 0 && Number(totalFee) > 0) status = Number(totalPaid) > 0 ? 'Paid' : 'Unpaid';
              else if (Number(totalPaid) === 0) status = 'Unpaid';
              else status = 'Partial';

              return { ...r, totalFee, paidAmount: totalPaid, dueAmount: totalDue, feeStatus: status };
            }catch(e){ return r; }
          }));
          setRows(enriched);
        }catch(err){ console.error('Failed to enrich roster rows', err); setRows(list); }
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
