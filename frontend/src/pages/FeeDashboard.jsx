import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const CLASS_ORDER = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function FeeDashboard(){
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data.classes || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setTableRows([]);
      return;
    }

    const fetchClassStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/fees/class/${selectedClassId}/students`);
        const rows = (res.data.data || res.data || []).map(row => ({
          ...row,
          paidAmount: row.paidAmount || '',
          receiptNumber: '',
          receiptDate: '',
          refund: ''
        }));
        setTableRows(rows);
      } catch (err) {
        console.error(err);
        setTableRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassStudents();
  }, [selectedClassId]);

  const orderedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const aIndex = CLASS_ORDER.indexOf(a.name) >= 0 ? CLASS_ORDER.indexOf(a.name) : CLASS_ORDER.length;
      const bIndex = CLASS_ORDER.indexOf(b.name) >= 0 ? CLASS_ORDER.indexOf(b.name) : CLASS_ORDER.length;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.name.localeCompare(b.name);
    });
  }, [classes]);

  const handleRowChange = (index, field, value) => {
    setTableRows(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: value } : row));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="mb-6 bg-white rounded-3xl shadow-soft p-6 border border-slate-200">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700">Select Class</label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Choose class (Nursery → 10)</option>
              {orderedClasses.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 text-sm text-slate-500">
            Select a class to view the student fee entry table. Enter paid amount, receipt number, receipt date, and refund details for each student.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft overflow-x-auto border border-slate-200">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading students...</div>
        ) : tableRows.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Select a class to show the fee entry table.</div>
        ) : (
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Roll Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Payable</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Paid Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Receipt No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Receipt Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">Refund</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={row.studentId || row.rollNumber || index} className="border-t border-slate-200 bg-white hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{row.rollNumber || '-'}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">{row.name || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">RS{row.dueAmount?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      value={row.paidAmount}
                      onChange={e => handleRowChange(index, 'paidAmount', e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Paid"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      value={row.receiptNumber}
                      onChange={e => handleRowChange(index, 'receiptNumber', e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Receipt #"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="date"
                      value={row.receiptDate}
                      onChange={e => handleRowChange(index, 'receiptDate', e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      value={row.refund}
                      onChange={e => handleRowChange(index, 'refund', e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Refund"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
