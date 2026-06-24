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

  const handleExportCSV = () => {
    if (!classCollection.length) return alert('No data to export.');
    const headers = ['Class', 'Collected', 'Outstanding', 'Students', 'Collection %'];
    const rows = classCollection.map(item => {
      const total = (item.collected || 0) + (item.due || 0);
      const pct = total > 0 ? Math.round(((item.collected || 0) / total) * 100) : 0;
      return [item.className || '-', item.collected || 0, item.due || 0, item.students || 0, `${pct}%`];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Analytics</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Fee Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Review collection performance, outstanding dues, and class-level trends.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100 opacity-30" />
          <div className="relative">
            <div className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">Total Collected</div>
            <div className="mt-3 text-3xl font-bold text-emerald-600">RS{Number(summary?.totalCollected || 0).toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-500">All time collection</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-100 opacity-30" />
          <div className="relative">
            <div className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">Outstanding Due</div>
            <div className="mt-3 text-3xl font-bold text-amber-600">RS{Number(summary?.totalPendingFees || 0).toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-500">Pending dues</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-indigo-100 opacity-30" />
          <div className="relative">
            <div className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">Collection Rate</div>
            <div className="mt-3 text-3xl font-bold text-indigo-600">{summary?.collectionRate || 0}%</div>
            <div className="mt-1 text-xs text-slate-500">Overall efficiency</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sky-100 opacity-30" />
          <div className="relative">
            <div className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">Today Collected</div>
            <div className="mt-3 text-3xl font-bold text-sky-600">RS{Number(summary?.totalCollectionToday || 0).toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-500">Today's collection</div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px_auto] items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Class-wise Collection</h2>
            <p className="mt-1 text-sm text-slate-500">Compare performance across all classes.</p>
          </div>
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExportCSV} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm">
            Export CSV
          </button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Class</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Collected</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Outstanding</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Students</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] min-w-[200px]">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClassCollection.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No class collection data available.</td>
                </tr>
              ) : (
                filteredClassCollection.map((item) => {
                  const total = (item.collected || 0) + (item.due || 0);
                  const pct = total > 0 ? Math.round(((item.collected || 0) / total) * 100) : 0;
                  return (
                    <tr key={item.className} className="bg-white hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-semibold text-slate-900">{item.className || 'Unknown'}</td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-600">RS{Number(item.collected || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-right font-semibold text-amber-600">RS{Number(item.due || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-right text-slate-700">{item.students || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-bold min-w-[40px] text-right ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.62fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Monthly Trend</h3>
          {summary?.monthly?.length ? (
            <div className="mt-5 space-y-4">
              {summary.monthly.map((item) => (
                <div key={item.month} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{item.month}</span>
                    <span className="font-bold text-slate-900">RS{Number(item.collected || 0).toLocaleString()}</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700" style={{ width: `${Math.min(100, item.progress || 0)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.count} payments</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Monthly performance data is not available.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Top Pending Classes</h3>
            {summary?.topPending?.length ? (
              <ul className="mt-5 space-y-3">
                {summary.topPending.map((item, i) => (
                  <li key={item.className} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.className}</p>
                    </div>
                    <p className="text-sm font-bold text-rose-600">Due RS{Number(item.due || 0).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No pending dues summary available.</p>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Export & Share</h3>
            <p className="mt-2 text-sm text-slate-500">Download the full fee report for board review and accounting.</p>
            <div className="mt-5 grid gap-3">
              <button onClick={() => window.print()} className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm">Print Report</button>
              <button onClick={handleExportCSV} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm">Export CSV</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <button onClick={() => navigate('/fee-management/history')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition">← Go to Payment History</button>
      </div>
    </div>
  );
}
