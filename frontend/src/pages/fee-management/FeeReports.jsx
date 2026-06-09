import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

export default function FeeReports() {
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canExport = user && (user.role === 'admin' || user.role === 'accountant');

  useEffect(() => {
    fetchClasses();
    fetchSummary();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/fees/dashboard');
      setSummary(res.data || res);
    } catch (err) {
      console.error(err);
    }
  };

  const classCollection = useMemo(() => summary?.classWise || [], [summary]);
  const filteredClassCollection = useMemo(() => {
    if (!selectedClass) return classCollection;
    return classCollection.filter((item) => item.className === selectedClass);
  }, [classCollection, selectedClass]);
  const maxCollection = useMemo(() => classCollection.reduce((max, item) => Math.max(max, Number(item.collected || 0)), 0), [classCollection]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Fee Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Review collection performance, outstanding dues, and class-level trends.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Total Collected</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">RS{Number(summary?.totalCollected || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Outstanding Due</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">RS{Number(summary?.totalPendingFees || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Class Count</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{classes.length}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Today Collected</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">RS{Number(summary?.totalCollectionToday || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px] items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Classwise Collection</h2>
            <p className="mt-2 text-sm text-slate-500">Select a class to focus the report and compare performance across the school.</p>
          </div>
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-slate-50">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Class</th>
                <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Collected</th>
                <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Outstanding</th>
                <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClassCollection.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-500">No class collection data available.</td>
                </tr>
              ) : (
                filteredClassCollection.map((item) => (
                  <tr key={item.className} className="bg-white hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{item.className || 'Unknown'}</td>
                    <td className="px-5 py-4 text-right text-slate-900">RS{Number(item.collected || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-slate-900">RS{Number(item.due || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-slate-900">{item.students || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.62fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-slate-900">Monthly Trend</h3>
          {summary?.monthly?.length ? (
            <div className="mt-5 space-y-4">
              {summary.monthly.map((item) => (
                <div key={item.month} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{item.month}</span>
                    <span className="font-semibold text-slate-900">RS{Number(item.collected || 0).toLocaleString()}</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, item.progress || 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Monthly performance data is not available.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-slate-900">Top Pending Classes</h3>
            {summary?.topPending?.length ? (
              <ul className="mt-5 space-y-3">
                {summary.topPending.map((item) => (
                  <li key={item.className} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between font-medium text-slate-900">{item.className}</div>
                    <div className="mt-2">Due RS{Number(item.due || 0).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No pending dues summary available.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-slate-900">Export & Share</h3>
            <p className="mt-2 text-sm text-slate-500">Download the full fee report for board review and accounting handover.</p>
            <div className="mt-5 grid gap-3">
              <button onClick={() => window.print()} className="rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition">Print Report</button>
              <button onClick={() => alert('Export to PDF is coming soon')} disabled={!canExport} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50">Export PDF</button>
              <button onClick={() => alert('Export to Excel is coming soon')} disabled={!canExport} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50">Export XLSX</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-start">
        <button onClick={() => navigate('/fee-management/history')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition">← Go to Payment History</button>
      </div>
    </div>
  );
}
