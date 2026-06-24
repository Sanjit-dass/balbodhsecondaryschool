import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString()}`;

export default function StudentFeeCollectView(){
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [studentId, setStudentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lookupName, setLookupName] = useState('');
  const [lookupClass, setLookupClass] = useState('');
  const [lookupRoll, setLookupRoll] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const q = searchParams.get('student') || searchParams.get('studentId');
    if (q) setStudentId(q);
    else if (user && (user.role === 'student' || user.role === 'parent')) setStudentId(user.id || user._id || user.studentId || null);
  }, [searchParams, user]);

  useEffect(()=>{
    if (!studentId) return;
    setLoading(true);
    api.get(`/fees/student/${encodeURIComponent(studentId)}/summary`).then(r=>r.data).then((data)=>{
      const payload = (data && data.data) ? data.data : data;
      const s = payload.student || (payload.summary && payload.summary.student) || {};
      const summaryRaw = payload.summary || payload;
      const summary = { ...summaryRaw };
      if (summaryRaw.totalBilled !== undefined && summary.totalFee === undefined) summary.totalFee = summaryRaw.totalBilled;
      if (summaryRaw.totalPaid !== undefined && summary.totalPaid === undefined) summary.totalPaid = summaryRaw.totalPaid;
      if (summaryRaw.totalDue !== undefined && summary.totalDue === undefined) summary.totalDue = summaryRaw.totalDue;
      if ((!summary.feeBreakdown || summary.feeBreakdown.length === 0) && Array.isArray(summaryRaw.invoices) && summaryRaw.invoices.length > 0) {
        summary.feeBreakdown = summaryRaw.invoices.map(inv => ({
          category: inv.month || (`Invoice ${inv.invoiceId || ''}`),
          total: inv.netAmount || inv.totalAmount || 0,
          paid: inv.paidAmount || 0
        }));
      }
      setProfile({ student: s, summary });
    }).catch(()=>{
      api.get(`/fees/student/${encodeURIComponent(studentId)}`).then(r=>r.data).then((data)=>{
        const payload = (data && data.data) ? data.data : data;
        const s = payload.student || {};
        setProfile({ student: s, summary: payload.summary || {} });
      }).catch(()=>setProfile(null));
    }).finally(()=>setLoading(false));
  }, [studentId]);

  const handleLookup = async (e) => {
    e && e.preventDefault();
    setSearchError(null);
    const className = (lookupClass || '').trim();
    const admissionNumber = (lookupRoll || '').trim();
    const q = (lookupName || '').trim();
    if (!className && !admissionNumber && !q) {
      setSearchError('Please provide at least Class or Roll/Name to search');
      return;
    }
    setSearching(true);
    try{
      const params = { limit: 1 };
      if (className) params.className = className;
      if (admissionNumber) params.admissionNumber = admissionNumber;
      if (q) params.q = q;
      const res = await api.get('/students', { params });
      const students = (res.data && res.data.students) || [];
      if (students.length === 0) {
        setSearchError('No matching student found');
      } else {
        const s = students[0];
        setStudentId(s._id || s.id || (s._doc && s._doc._id));
      }
    }catch(err){
      setSearchError('Search failed');
    }finally{ setSearching(false); }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="font-semibold mb-3">Find Student for Fee Summary</h3>
          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="text-sm text-slate-600">Name (optional)</label>
              <input value={lookupName} onChange={e=>setLookupName(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Student name" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Class</label>
              <input value={lookupClass} onChange={e=>setLookupClass(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Class (e.g. Class 10 or 10)" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Roll / Admission No</label>
              <input value={lookupRoll} onChange={e=>setLookupRoll(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Roll or admission number" />
            </div>
            {searchError ? <div className="text-sm text-rose-600">{searchError}</div> : null}
            <div className="flex items-center gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={searching}>{searching ? 'Searching...' : 'Search'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const summary = profile.summary || {};

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl p-6 mb-6 shadow">
        <div className="flex items-center gap-4">
          <img src={profile.student.photo || '/default-placeholder.png'} alt="photo" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <div className="text-xl font-bold">{profile.student.name || '-'}</div>
            <div className="text-sm text-slate-600">Class: <span className="font-semibold">{profile.student.className || profile.student.class?.name || '-'}</span></div>
            <div className="text-sm text-slate-600">Roll: <span className="font-semibold">{profile.student.admissionNumber || profile.student.rollNumber || '-'}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="font-semibold mb-3">Fee Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>Total Fee<br/><span className="font-semibold">{formatMoney(summary.totalFee || summary.totalAmount || 0)}</span></div>
          <div>Total Paid<br/><span className="font-semibold">{formatMoney(summary.totalPaid || summary.paid || 0)}</span></div>
          <div>Total Due<br/><span className="font-semibold">{formatMoney(summary.totalDue || summary.due || 0)}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="font-semibold mb-3">Fee Breakdown (read-only)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500"><th>Category</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Due</th></tr>
          </thead>
          <tbody className="divide-y">
            {(Array.isArray(summary.feeBreakdown) ? summary.feeBreakdown : []).map((r, idx) => (
              <tr key={idx}>
                <td className="py-2">{r.category || r.name}</td>
                <td className="py-2 text-right">{formatMoney(((r.total ?? r.amount ?? r.actualFee) || 0))}</td>
                <td className="py-2 text-right">{formatMoney(((r.paid ?? r.paidFee) || 0))}</td>
                <td className="py-2 text-right">{formatMoney(Math.max(0, (((r.total ?? r.amount ?? r.actualFee) || 0) - ((r.paid ?? r.paidFee) || 0))))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
