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

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return;
    try {
      await api.delete(`/fees/payments/${paymentId}`);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert('Unable to delete receipt.');
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Payment History</h1>
        <p className="mt-2 text-sm text-slate-500">Track every fee payment with due status and export actions.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 mb-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Students</div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">{filteredStudents.length}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Search</div>
          <div className="mt-3 text-lg font-semibold text-slate-900">{search ? `Matching “${search}”` : 'Search students'}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Class</div>
          <div className="mt-3 text-lg font-semibold text-slate-900">{selectedClass || 'No class selected'}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <button onClick={() => navigate('/fee-management/collect')} className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition">Collect Fee</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Class</label>
          <select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); fetchClassStudents(e.target.value); }}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div />
        <div />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
        <div className="grid grid-cols-8 gap-4 bg-slate-100 px-5 py-4 text-sm font-semibold text-slate-600">
          <div>Roll No</div>
          <div>Student Name</div>
          <div>Class</div>
          <div>Total Fee</div>
          <div>Paid</div>
          <div>Due</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-slate-200">
          {(!selectedClass || filteredStudents.length === 0) ? (
            <div className="p-6 text-center text-slate-500">
              {!selectedClass ? 'Select a class to view students.' : studentsLoading ? 'Loading students...' : 'No students found for this class.'}
            </div>
          ) : filteredStudents.map((s) => (
            <div key={s.studentId || s._id} className="grid grid-cols-8 gap-4 px-5 py-4 items-center text-sm text-slate-700 hover:bg-slate-50">
              <div>{s.rollNumber || s.admissionNumber || '—'}</div>
              <div>
                <button onClick={() => viewStudentReceipts(s)} className="text-indigo-600 hover:text-indigo-800 font-medium underline">
                  {s.name || '-'}
                </button>
              </div>
              <div>{s.className || s.class || '—'}</div>
              <div>RS{Number(s.totalFee || 0).toLocaleString()}</div>
              <div>RS{Number(s.paidAmount || 0).toLocaleString()}</div>
              <div>RS{Number(s.dueAmount || 0).toLocaleString()}</div>
              <div>{s.feeStatus || s.status || '-'}</div>
              <div className="flex justify-end">
                <button onClick={() => viewStudentReceipts(s)} className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition">View Receipts</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button onClick={() => navigate('/fee-management/collect')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition">Back to Collection</button>
        <button onClick={() => navigate('/fee-management/reports')} className="rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition">View Reports</button>
      </div>
    </div>
  );
}
