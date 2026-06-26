import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const formatMoney = (v) => `RS ${Number(v || 0).toLocaleString()}`;

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [structure, setStructure] = useState([]);
  const [backendClassId, setBackendClassId] = useState(null);
  const [feeRows, setFeeRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [classId]);

  const displayClassName = () => {
    if (!classId) return '';
    // If numeric (1,2,..) keep as-is; otherwise uppercase abbreviation (LKG, UKG) or name
    return isNaN(Number(classId)) ? classId.toUpperCase() : classId;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let resolvedBackendId = classId;
      const isProbablyObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const extractStudentRecords = (payload) => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.students)) return payload.students;
        return [];
      };

      if (!isProbablyObjectId(classId)) {
        try {
          const classesRes = await api.get('/classes');
          const all = classesRes.data || [];
          const found = all.find((c) => String(c._id) === String(classId) || String(c.name).toLowerCase() === String(classId).toLowerCase());
          if (found && found._id) {
            resolvedBackendId = found._id;
            setBackendClassId(found._id);
          }
        } catch (e) {
          console.warn('Failed to resolve class ID, using original:', classId);
        }
      } else {
        setBackendClassId(classId);
      }

      const classKey = resolvedBackendId || classId;
      let studentsData = [];
      try {
        const res = await api.get(`/fees/class/${encodeURIComponent(classKey)}/students`, { params: { limit: 500 } });
        studentsData = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
      } catch (err) {
        console.warn('Fee endpoint failed, falling back to student endpoint:', err?.message || err);
        try {
          const params = isProbablyObjectId(classKey)
            ? { classId: classKey, limit: 500 }
            : { className: classId, limit: 500 };
          const fallbackRes = await api.get('/students', { params });
          studentsData = extractStudentRecords(fallbackRes.data);
        } catch (fallbackErr) {
          console.warn('Failed to load students, using empty array');
          studentsData = [];
        }
      }

      const rows = studentsData.map((s) => {
        const breakdown = Array.isArray(s.feeBreakdown)
          ? s.feeBreakdown.map((item) => ({
              category: item.category || item.name || 'Fee',
              amount: Number(item.amount || item.defaultAmount || 0),
              categoryType: item.categoryType || item.status || 'Mandatory Fee',
              selected: item.selected !== false
            }))
          : [];
        const totalFromBreakdown = breakdown.length
          ? breakdown.reduce((sum, item) => sum + (item.selected ? Number(item.amount || 0) : 0), 0)
          : 0;
        return {
          ...s,
          studentId: s.studentId || s._id || s.id,
          rollNumber: s.rollNumber || s.admissionNumber || '',
          name: s.name || s.fullName || '',
          totalFee: Number(s.totalFee || s.total || totalFromBreakdown),
          paidAmount: Number(s.paidAmount || s.paid || 0),
          dueAmount: Number(s.dueAmount || 0),
          feeStatus: s.feeStatus || s.status || 'Unpaid',
          feeBreakdown: breakdown
        };
      });

      setStudents(rows);

      // Enrich student rows with authoritative fee summary per student
      try {
        const enriched = await Promise.all(rows.map(async (s) => {
          const sid = s.studentId || s._id || s.id || s.student || s.studentId;
          if (!sid) return s;
          try {
            const res = await api.get(`/fees/student/${encodeURIComponent(sid)}`);
            const data = res.data || res;
            const summary = data.summary || {};
            let totalFee = Number(summary.totalFee || 0);
            let totalPaid = Number(summary.totalPaid || 0);

            if (!totalFee && Array.isArray(summary.feeBreakdown) && summary.feeBreakdown.length > 0) {
              totalFee = summary.feeBreakdown.reduce((sum, it) => sum + Number(it?.actualFee ?? it?.amount ?? 0), 0);
            }

            try {
              const hist = await api.get(`/fees/student/${encodeURIComponent(sid)}/history`);
              const histData = Array.isArray(hist.data) ? hist.data : (hist.data && Array.isArray(hist.data.data) ? hist.data.data : []);
              const paidSum = histData.reduce((sum, rec) => {
                try {
                  const breakdown = rec.breakdown || rec.data?.breakdown || rec.data || {};
                  if (Array.isArray(breakdown)) return sum + breakdown.reduce((ss, it) => ss + Number(it?.amount ?? it?.paid ?? 0), 0);
                  if (breakdown && typeof breakdown === 'object') return sum + Object.values(breakdown).reduce((ss, v) => ss + Number(v || 0), 0);
                } catch (e) {}
                return sum;
              }, 0);
              if (paidSum > 0) totalPaid = paidSum;
            } catch (e) {}

            if (!totalFee) {
              try {
                const classIdVal = data.student?.classId || data.student?.class || s.classId || null;
                if (classIdVal) {
                  const cats = await api.get('/fees/categories', { params: { classId: classIdVal } });
                  const catsData = Array.isArray(cats.data) ? cats.data : (cats.data && Array.isArray(cats.data.data) ? cats.data.data : []);
                  totalFee = catsData.reduce((su, it) => su + Number(it?.amount ?? it?.defaultAmount ?? 0), 0);
                }
              } catch (e) {}
            }

            const totalDue = Math.max(0, Number(totalFee || 0) - Number(totalPaid || 0));
            let status = '';
            if (Number(totalDue) === 0 && Number(totalFee) > 0) status = Number(totalPaid) > 0 ? 'Paid' : 'Unpaid';
            else if (Number(totalPaid) === 0) status = 'Unpaid';
            else status = 'Partial';

            return { ...s, totalFee, paidAmount: totalPaid, dueAmount: totalDue, feeStatus: status };
          } catch (e) { return s; }
        }));
        setStudents(enriched);
      } catch (e) {
        setStudents(rows);
      }

      let categories = [];
      try {
        const catRes = await api.get('/fees/categories', { params: { classId: classKey } });
        categories = Array.isArray(catRes.data) ? catRes.data : [];
      } catch (e) {
        console.warn('Failed to load class fee categories:', e?.message || e);
      }

      const structArray = categories.map((item) => ({
        category: item.name,
        amount: Number(item.amount || item.defaultAmount || 0),
        categoryType: item.categoryType,
        status: item.status
      }));

      setStructure(structArray);
    } catch (err) {
      console.error('Unexpected error in fetchData:', err);
      setStudents([]);
      setStructure([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize editable fee rows when students or structure change
  useEffect(() => {
    if (!Array.isArray(students)) return;
    const rows = students.map(s => {
      const totalFromBreakdown = Array.isArray(s.feeBreakdown) && s.feeBreakdown.length
        ? s.feeBreakdown.reduce((acc, it) => acc + (it.selected !== false ? Number(it.amount || 0) : 0), 0)
        : null;
      const totalFee = Number(s.totalFee || s.total || (totalFromBreakdown !== null ? totalFromBreakdown : 0));
      const paid = Number(s.paidAmount || s.paid || 0);
      const due = Math.max(0, totalFee - paid);
      return {
        studentId: s._id || s.studentId || null,
        rollNumber: s.rollNumber || s.admissionNumber || '',
        name: s.name || s.fullName || '',
        totalFee,
        paidAmount: paid,
        dueAmount: due,
        status: paid >= totalFee ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
        payingToday: '',
        paymentMethod: 'Cash',
        remarks: '',
        receipt: null,
        feeBreakdown: Array.isArray(s.feeBreakdown) ? s.feeBreakdown : []
      };
    });
    setFeeRows(rows);
  }, [students, structure]);

  const updateRow = (index, changes) => {
    setFeeRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...changes };
      if (changes.paidAmount !== undefined) {
        const raw = String(changes.paidAmount || '');
        const cleaned = raw.replace(/[^0-9.\-]+/g, '');
        const paid = parseFloat(cleaned || '0') || 0;
        copy[index].paidAmount = paid;
        const total = Number(copy[index].totalFee || 0);
        copy[index].dueAmount = Math.max(0, total - paid);
        copy[index].status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
      }
      return copy;
    });
  };

  const filteredRows = feeRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (row.name || '').toLowerCase().includes(q)
        || (row.rollNumber || '').toLowerCase().includes(q);
    });

  const handleCollectFee = async (idx) => {
    const row = feeRows[idx];
    if (!row.studentId) return setMessage('Invalid student selected');
    const rawInput = String(row.payingToday || '').trim();
    const cleaned = rawInput.replace(/[^0-9.\-]+/g, '');
    const amount = parseFloat(cleaned || '0');
    if (isNaN(amount) || amount <= 0) return setMessage('Enter a valid amount to collect');
    const payload = {
      studentId: row.studentId,
      classId: backendClassId || classId,
      breakdown: {},
      amountPaid: amount,
      paymentMethod: row.paymentMethod || 'Cash',
      remarks: row.remarks || ''
    };
    // Build breakdown map from structure if available
    if (Array.isArray(structure) && structure.length) {
      structure.forEach(it => { payload.breakdown[it.category || it.name || 'item'] = Number(it.amount || 0); });
    } else {
      payload.breakdown = { totalFee: Number(row.totalFee || 0) };
    }

    try {
      setSaving(true);
      setMessage('');
      const res = await api.post('/fees/collect', payload);
      const payment = res.data?.payment;
      const receipt = res.data?.receipt;
      const pdfBase64 = res.data?.pdfBase64;

      // update local row
      const newPaid = Number(row.paidAmount || 0) + Number(amount || 0);
      const total = Number(row.totalFee || 0);
      const newDue = Math.max(0, total - newPaid);
      const newStatus = newDue === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

      setFeeRows(prev => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
          payingToday: '',
          remarks: '',
          receipt: receipt ? { id: receipt._id || receipt.id || null, pdfBase64 } : null
        };
        return copy;
      });

      setMessage('Payment recorded');
    } catch (err) {
      console.error('Collect failed', err);
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Collect failed';
      setMessage(`Collect failed: ${apiMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const viewReceipt = (pdfBase64, receipt) => {
    if (!pdfBase64 && !receipt) return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const receiptId = receipt?.receiptId || receipt?._id || receipt?.id;
    
    // Primary: Navigate to receipt view page (preserves auth)
    if (receiptId) {
      navigate(`/fee-management/receipt/${encodeURIComponent(receiptId)}`, {
        state: { receipt, from: '/fee-management/classes' }
      });
      return;
    }
    
    // Fallback: Direct PDF handling
    if (pdfBase64) {
      if (isMobile) {
        // Mobile: Download instead of open
        const byteChars = atob(pdfBase64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receipt?.receiptNumber || 'receipt'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Desktop: Open in new tab
        const url = `data:application/pdf;base64,${pdfBase64}`;
        const win = window.open(url, '_blank');
        if (!win) setMessage('Popup blocked. Allow popups to view receipt.');
      }
    }
  };

  const printReceipt = (pdfBase64, receipt) => {
    if (!pdfBase64 && !receipt) return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const receiptId = receipt?.receiptId || receipt?._id || receipt?.id;
    
    // Primary: Navigate to receipt view page with print flag (preserves auth)
    if (receiptId) {
      navigate(`/fee-management/receipt/${encodeURIComponent(receiptId)}?print=1`, {
        state: { receipt, from: '/fee-management/classes' }
      });
      return;
    }
    
    // Fallback: Direct PDF handling
    if (pdfBase64) {
      if (isMobile) {
        // Mobile: Download instead of print (system print not reliable)
        const byteChars = atob(pdfBase64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receipt?.receiptNumber || 'receipt'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Desktop: Open for print
        const url = `data:application/pdf;base64,${pdfBase64}`;
        const w = window.open(url, '_blank');
        if (w) {
          w.addEventListener('load', () => { w.print(); });
        } else {
          setMessage('Popup blocked. Allow popups to print receipt.');
        }
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        classId: backendClassId || classId,
        entries: (feeRows || []).map(r => ({
          studentId: r.studentId,
          rollNumber: r.rollNumber,
          name: r.name,
          totalFee: Number(r.totalFee || 0),
          paidAmount: Number(r.paidAmount || 0),
          dueAmount: Number(r.dueAmount || 0),
          status: r.status,
        })),
      };
      await api.post(`/fees/initialize`, payload);
      setMessage('Saved successfully');
      await fetchData();
    } catch (err) {
      console.error('Save failed', err);
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Save failed';
      setMessage(`Save failed: ${apiMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Class: {displayClassName()}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">← Back</button>
          <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm text-white">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      {structure.length === 0 && !loading && students.length > 0 && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No fee structure assigned for this class. Please save a class fee structure first.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700">Search students</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or roll number"
          className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-soft overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading students and fee structure...</div>
        ) : students.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No students found for this class.</div>
        ) : (
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Total Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Paying Today</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Payment Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Remarks</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Paid Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Due Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ row: r, index }, idx) => (
                <tr key={r.studentId || `${index}-${idx}`} className="border-t border-slate-200 bg-white hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{r.rollNumber || '-'}</td>
                  <td className="px-4 py-4 text-slate-900 font-medium">{r.name}</td>
                  <td className="px-4 py-4 text-slate-700">
                    {Array.isArray(r.feeBreakdown) && r.feeBreakdown.length > 0 ? (
                      <div className="space-y-1 text-xs leading-relaxed text-slate-600">
                        {r.feeBreakdown.map((it, i) => {
                          const optional = String(it.categoryType || '').trim().toLowerCase() === 'optional service';
                          const selected = it.selected !== false;
                          return (
                            <div key={i} className={optional && !selected ? 'text-slate-500' : ''}>
                              {it.category}: {formatMoney(it.amount)}
                              {optional ? (
                                <span className="ml-1 text-[0.65rem] text-slate-400">(Optional{selected ? '' : ' - not enrolled'})</span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : structure.length > 0 ? (
                      <div className="space-y-1 text-xs leading-relaxed text-slate-600">
                        {structure.map((it, i) => (
                          <div key={i}>{it.category}: {formatMoney(it.amount)}</div>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4 font-semibold text-indigo-600">{formatMoney(r.totalFee)}</td>
                  <td className="px-4 py-4 min-w-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9,\.]+"
                      className="w-full min-w-[8rem] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      value={r.payingToday}
                      onChange={(e) => updateRow(index, { payingToday: e.target.value })}
                      placeholder="e.g. 2,000"
                    />
                  </td>
                  <td className="px-4 py-4 min-w-0">
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      value={r.paymentMethod}
                      onChange={(e) => updateRow(index, { paymentMethod: e.target.value })}
                    >
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>Cheque</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      className="w-full min-w-[10rem] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none"
                      value={r.remarks}
                      placeholder="Optional remarks"
                      onChange={(e) => updateRow(index, { remarks: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9,\.]+"
                      readOnly
                      className="w-full min-w-[8rem] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none text-right font-semibold"
                      value={typeof r.paidAmount === 'number' ? Number(r.paidAmount).toLocaleString() : (r.paidAmount || '')}
                    />
                  </td>
                  <td className="px-4 py-4 text-slate-700">{formatMoney(r.dueAmount)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : r.status === 'Partial'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {r.receipt && r.receipt.pdfBase64 ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => viewReceipt(r.receipt.pdfBase64)} className="rounded-2xl bg-indigo-600 px-3 py-1 text-xs text-white">View Receipt</button>
                        <button onClick={() => printReceipt(r.receipt.pdfBase64)} className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs">Print</button>
                      </div>
                    ) : (
                      <button onClick={() => handleCollectFee(index)} disabled={saving} className="rounded-2xl bg-emerald-600 px-3 py-1 text-xs text-white">Collect Fee</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {message ? <div className="mt-4 text-sm text-emerald-700">{message}</div> : null}
    </div>
  );
}
