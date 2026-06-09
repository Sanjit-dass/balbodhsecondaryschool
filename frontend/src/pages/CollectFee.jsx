import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function CollectFee({ studentId }){
  const [form, setForm] = useState({ breakdown: {}, amountPaid: 0, dueAmount: 0, paymentMethod: 'Cash', classId: null });
  const [result, setResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [classStructure, setClassStructure] = useState([]);
  const [classTotal, setClassTotal] = useState(0);
  const { user } = useContext(AuthContext);
  const canEditPaid = user && (user.role === 'admin' || user.role === 'accountant');
  useEffect(()=>{
    if (studentId) setForm(f=>({ ...f, studentId }));
  },[studentId]);

  const handleChange = (k,v)=> setForm(f=>({ ...f, [k]: v }));
  const handleBreak = (k,v)=> setForm(f=>({ ...f, breakdown: { ...f.breakdown, [k]: Number(v||0) } }));

  useEffect(()=>{
    const subtotal = Object.values(form.breakdown||{}).reduce((s,n)=>s+Number(n||0),0);
    const grand = subtotal + (form.previousDue||0) - (form.discount||0);
    // if amountPaid is zero (initial), default to full payment
    const amountPaid = (form.amountPaid && Number(form.amountPaid)) ? Number(form.amountPaid) : grand;
    const due = grand - (amountPaid||0);
    setForm(f=>({ ...f, subtotal, grand, dueAmount: due, amountPaid }));
  }, [form.breakdown, form.previousDue, form.discount]);

  // load student profile and class fee structure
  useEffect(()=>{
    if (!studentId) return;
    (async ()=>{
      try{
        const res = await fetch(`/api/fees/student/${studentId}`);
        const data = await res.json();
        const stud = data.student || data;
        setStudent(stud);
        const classId = stud?.classId || stud?.class;
        if (classId){
          setForm(f=>({ ...f, classId }));
          const st = await fetch(`/api/fees/structure/${classId}`).then(r=>r.json()).catch(()=>({ structure: [] }));
          const structure = st.structure || [];
          setClassStructure(structure);
          const total = Array.isArray(structure) ? structure.reduce((s,it)=>s + Number(it.amount||0),0) : 0;
          setClassTotal(total);
          // prefill breakdown
          const breakdown = {};
          structure.forEach(it=>{ const key = it.category || it.name; breakdown[key] = Number(it.amount||0); });
          setForm(f=>({ ...f, breakdown, previousDue: (data.summary && data.summary.totalDue) || 0 }));
        }
      }catch(err){ console.error(err); }
    })();
  },[studentId]);

  const submit = async ()=>{
    const payload = { ...form };
    if (student && (student.classId || student.class)) payload.classId = payload.classId || student.classId || (typeof student.class === 'string' ? student.class : student.class?._id || null);
    const res = await fetch('/api/fees/collect', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Collect Fee</h1>
      <div className="bg-white rounded-xl shadow-soft p-4 mb-4">
        <div className="mb-3">
          <div className="text-sm text-slate-600">Class</div>
          <div className="font-semibold">{student ? (student.className || student.class?.name || form.classId) : '—'}</div>
        </div>

        <div className="grid gap-3">
          {classStructure && classStructure.length > 0 ? (
            classStructure.map((it, idx) => {
              const key = it.category || it.name;
              return (
                <div key={idx}>
                  <label className="block text-sm text-gray-600">{key}</label>
                  <input type="number" value={form.breakdown?.[key] ?? ''} className="mt-1 w-full p-2 border rounded" onChange={e=>handleBreak(key, e.target.value)} />
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">No fee structure found for this student's class.</div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between"><div>Class Total</div><div>RS{classTotal}</div></div>
          <div className="flex justify-between"><div>Subtotal</div><div>RS{form.subtotal||0}</div></div>
          <div className="flex justify-between"><div>Previous Due</div><div>RS{form.previousDue||0}</div></div>
          <div className="flex justify-between"><div>Discount</div><div>RS{form.discount||0}</div></div>
          <div className="flex justify-between font-semibold"><div>Grand Total</div><div>RS{form.grand||0}</div></div>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-600">Amount Paid</label>
          <input type="number" value={form.amountPaid} onChange={e=>handleChange('amountPaid', Number(e.target.value||0))} className="mt-1 w-full p-2 border rounded" readOnly={!canEditPaid} />
          {!canEditPaid && <div className="text-xs text-gray-500 mt-1">Only admin/accountant can edit Paid amount; otherwise it's auto-calculated.</div>}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
          <select value={form.paymentMethod} onChange={e=>handleChange('paymentMethod', e.target.value)} className="p-2 border rounded w-full sm:w-48">
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>Cheque</option>
            <option>eSewa</option>
            <option>Khalti</option>
            <option>Fonepay</option>
            <option>ConnectIPS</option>
            <option>IME Pay</option>
          </select>
          <input placeholder="Transaction ID" value={form.transactionId||''} onChange={e=>handleChange('transactionId', e.target.value)} className="p-2 border rounded flex-1 mt-2 sm:mt-0" />
        </div>

        {/* Dynamic QR for digital payments */}
        {['eSewa','Khalti','Fonepay','Bank Transfer','IME Pay','ConnectIPS'].includes(form.paymentMethod) && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Dynamic Payment QR</div>
            <img alt="payment-qr" className="w-40 h-40" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ studentId: form.studentId, amount: form.amountPaid || form.grand || form.subtotal, method: form.paymentMethod }))}`} />
            <div className="text-xs text-gray-500 mt-2">Scan this QR with the chosen payment app and enter the transaction ID above.</div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded">Collect</button>
        </div>
      </div>

      {result && <div className="bg-white rounded-xl shadow-soft p-4">Receipt generated. <a className="text-indigo-600" href={result.receipt.pdfUrl} target="_blank">Open</a></div>}
    </div>
  );
}
