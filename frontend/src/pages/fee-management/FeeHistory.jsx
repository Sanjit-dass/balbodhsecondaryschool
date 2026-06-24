import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

export default function FeeHistory() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canDeleteReceipt = user && ['admin', 'accountant'].includes(user.role);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    // Use fixed class options for the accountant workflow
    try {
      const fixed = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
      setClasses(fixed.map((name, idx) => ({ _id: `fixed-${idx}`, name })));
    } catch (err) {
      console.error(err);
      setClasses([]);
    }
  };

  const fetchClassStudents = async (className) => {
    try {
      if (!className) {
        setStudents([]);
        return;
      }
      setStudentsLoading(true);
      const res = await api.get(`/fees/class/${encodeURIComponent(className)}/students`);
      const data = res.data?.data || res.data || [];
      setStudents(data);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    const q = (search || '').trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (String(s.rollNumber || s.admissionNumber || '')).toLowerCase().includes(q));
  }, [students, search]);

  const monthOptions = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = useMemo(() => [], []);

  const handleDelete = async (paymentId, student) => {
    if (!window.confirm('Are you sure you want to delete this receipt? This action cannot be undone for locked/paid records.')) return;
    try {
      await api.delete(`/fees/payments/${paymentId}`);
      fetchClassStudents(selectedClass);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Unable to delete receipt.';
      alert(msg);
    }
  };

  const viewStudentReceipts = (student) => {
    const studentId = student?.studentId || student?._id;
    if (!studentId) return alert('Student id missing');
    const params = new URLSearchParams();
    const rollNumber = student?.rollNumber || student?.admissionNumber || '';
    const className = student?.className || student?.class || '';
    if (rollNumber) params.set('rollNumber', rollNumber);
    if (className) params.set('className', className);
    const query = params.toString();
    navigate(`/fee-management/student/${studentId}${query ? `?${query}` : ''}`);
  };

  const printReceipt = (payment) => {
    const url = payment.receiptUrl || payment.pdfUrl;
    if (url) {
      const win = window.open(url, '_blank');
      if (!win) return alert('Allow popups to print the receipt.');
      return;
    }
    if (payment.pdfBase64) {
      const src = `data:application/pdf;base64,${payment.pdfBase64}`;
      const win = window.open(src, '_blank');
      if (!win) return alert('Allow popups to print the receipt.');
      return;
    }
    const id = payment.receiptId || payment.paymentId || payment.id || payment._id || payment.receiptNumber;
    if (id) {
      navigate(`/fee-management/receipt/${encodeURIComponent(id)}`);
      return;
    }
    alert('Receipt preview is not available for this payment.');
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">History</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Payment History</h1>
        <p className="mt-2 text-sm text-slate-500">Track every fee payment with lock status, due tracking, and export actions.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">Students</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{filteredStudents.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-[0.6rem] uppercase tracking-[0.22em] text-emerald-600">Paid</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{filteredStudents.filter(s => s.feeStatus === 'Paid').length}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-[0.6rem] uppercase tracking-[0.22em] text-amber-600">Partial</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{filteredStudents.filter(s => s.feeStatus === 'Partial').length}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="text-[0.6rem] uppercase tracking-[0.22em] text-rose-600">Unpaid</div>
          <div className="mt-2 text-2xl font-bold text-rose-700">{filteredStudents.filter(s => !s.feeStatus || s.feeStatus === 'Unpaid').length}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto] mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Class</label>
          <select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); fetchClassStudents(e.target.value); }}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select a class</option>
            {classes.map((cl) => (
              <option key={cl._id} value={cl.name}>{cl.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Search Student</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name or roll number"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-end">
          <button onClick={() => navigate('/fee-management/collect')} className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm">
            Collect Fee
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Roll No</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Student Name</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Class</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Total Fee</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Paid</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Due</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Status</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {(!selectedClass || filteredStudents.length === 0) ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                  {!selectedClass ? 'Select a class to view students.' : studentsLoading ? 'Loading students...' : 'No students found for this class.'}
                </td>
              </tr>
            ) : filteredStudents.map((s) => (
              <tr key={s.studentId || s._id} className={`hover:bg-slate-50 transition ${s.feeStatus === 'Paid' ? 'bg-emerald-50/30' : ''}`}>
                <td className="px-5 py-4 text-slate-700">{s.rollNumber || s.admissionNumber || '—'}</td>
                <td className="px-5 py-4">
                  <button onClick={() => viewStudentReceipts(s)} className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                    {s.name || '-'}
                  </button>
                </td>
                <td className="px-5 py-4 text-slate-700">{s.className || s.class || '—'}</td>
                <td className="px-5 py-4 text-right font-semibold text-slate-900">RS{Number(s.totalFee || 0).toLocaleString()}</td>
                <td className="px-5 py-4 text-right text-emerald-600 font-semibold">RS{Number(s.paidAmount || 0).toLocaleString()}</td>
                <td className="px-5 py-4 text-right text-amber-600 font-semibold">RS{Number(s.dueAmount || 0).toLocaleString()}</td>
                <td className="px-5 py-4">
                  {s.feeStatus === 'Paid' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      Locked
                    </span>
                  ) : s.feeStatus === 'Partial' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
                      Partial
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Unpaid</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => viewStudentReceipts(s)} className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm">
                    View Receipts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button onClick={() => navigate('/fee-management/collect')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition">Back to Collection</button>
        <button onClick={() => navigate('/fee-management/reports')} className="rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition shadow-sm">View Reports</button>
      </div>
    </div>
  );
}
