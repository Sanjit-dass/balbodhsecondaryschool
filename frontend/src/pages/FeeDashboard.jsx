import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const formatMoney = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

const CLASS_ORDER = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
const sortClasses = (arr) => [...arr].sort((a, b) => {
  const ai = CLASS_ORDER.indexOf(a.className);
  const bi = CLASS_ORDER.indexOf(b.className);
  return (ai >= 0 ? ai : 99) - (bi >= 0 ? bi : 99);
});

function ProgressRing({ percent, size = 80, stroke = 8, color = '#4f46e5' }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, percent) / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700" />
    </svg>
  );
}

function KpiCard({ icon, label, value, sub, accent }) {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    rose: 'from-rose-500 to-rose-700',
    sky: 'from-sky-500 to-sky-700',
    violet: 'from-violet-500 to-violet-700',
  };
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${colors[accent] || colors.indigo} opacity-10`} />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${colors[accent] || colors.indigo} text-white text-lg`}>
            {icon}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
        </div>
        <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function FeeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/fees/dashboard');
        setData(res.data || res);
      } catch (err) {
        console.error(err);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sortedClassWise = useMemo(() => sortClasses(data?.classWise || []), [data]);
  const maxCollected = useMemo(() => sortedClassWise.reduce((m, c) => Math.max(m, c.collected || 0), 0), [sortedClassWise]);
  const collectionRate = data?.collectionRate || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-slate-600 font-medium">Loading fee dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Overview</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Fee Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Real-time fee collection performance across all classes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/fee-management/collect')}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Collect Fee
          </button>
          <button onClick={() => navigate('/fee-management/reports')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            View Reports
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      )}

      {/* KPI Grid - only show cards with meaningful data */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard icon="💰" label="Total Collected" value={formatMoney(data?.totalCollected)} sub="All time collection" accent="indigo" />
        <KpiCard icon="📅" label="Today" value={formatMoney(data?.totalCollectionToday)} sub="Collected today" accent="sky" />
        <KpiCard icon="📆" label="This Month" value={formatMoney(data?.totalCollectionThisMonth)} sub="Monthly collection" accent="violet" />
        <KpiCard icon="⏳" label="Outstanding" value={formatMoney(data?.totalPendingFees)} sub="Pending dues" accent="amber" />
        <KpiCard icon="✅" label="Paid Students" value={data?.totalPaidStudents || 0} sub="Fully settled" accent="emerald" />
        <KpiCard icon="⚠️" label="Defaulters" value={data?.totalDefaulters || 0} sub="Pending payments" accent="rose" />
      </div>

      {/* Show empty state if no data at all */}
      {!data?.totalCollected && !data?.totalPendingFees && (sortedClassWise.length === 0) && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-600">No Fee Data Available</p>
          <p className="mt-2 text-sm text-slate-500">Start by creating fee categories and collecting payments to see dashboard analytics.</p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('/fee-management/categories')} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">Setup Fee Categories</button>
            <button onClick={() => navigate('/fee-management/collect')} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Collect Fee</button>
          </div>
        </div>
      )}

      {/* Collection Rate Ring + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Collection Rate</p>
          <div className="relative mt-6 inline-flex items-center justify-center">
            <ProgressRing percent={collectionRate} size={140} stroke={12} color={collectionRate >= 75 ? '#10b981' : collectionRate >= 50 ? '#f59e0b' : '#ef4444'} />
            <span className="absolute text-3xl font-bold text-slate-900">{collectionRate}%</span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Overall fee collection efficiency</p>
        </div>

        {/* Recent Activity */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <button onClick={() => navigate('/fee-management/history')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View All →</button>
          </div>
          <div className="space-y-3">
            {(data?.recentActivity || []).length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No recent payment activity.</p>
            ) : (data?.recentActivity || []).slice(0, 6).map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-slate-50 transition">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold ${item.status === 'Paid' ? 'bg-emerald-500' : item.status === 'Partial' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                  {item.status === 'Paid' ? '✓' : item.status === 'Partial' ? '◐' : '○'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{item.studentName}</p>
                  <p className="text-xs text-slate-500">{item.className} · Roll {item.rollNumber} · {item.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatMoney(item.amountPaid)}</p>
                  <p className={`text-xs font-semibold ${item.status === 'Paid' ? 'text-emerald-600' : item.status === 'Partial' ? 'text-amber-600' : 'text-slate-500'}`}>{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class-wise Collection Bars */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Class-wise Collection</h2>
            <p className="mt-1 text-sm text-slate-500">Visual breakdown of fee collection by class</p>
          </div>
          <button onClick={() => navigate('/fee-management/reports')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Full Report</button>
        </div>

        {sortedClassWise.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No class collection data available yet.</p>
        ) : (
          <div className="space-y-4">
            {sortedClassWise.map((cls) => {
              const total = (cls.collected || 0) + (cls.due || 0);
              const pct = total > 0 ? Math.round(((cls.collected || 0) / total) * 100) : 0;
              const barWidth = maxCollected > 0 ? Math.max(2, ((cls.collected || 0) / maxCollected) * 100) : 2;
              return (
                <div key={cls.className} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                        {cls.className?.charAt(0) || '?'}
                      </span>
                      <span className="font-semibold text-slate-900">{cls.className}</span>
                      <span className="text-xs text-slate-500">{cls.students} students</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-emerald-600">{formatMoney(cls.collected)}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-amber-600">{formatMoney(cls.due)} due</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : pct >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'}`}
                      style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Trend + Top Pending */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Monthly Trend</h2>
          {(data?.monthly || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No monthly data available.</p>
          ) : (
            <div className="space-y-4">
              {(data?.monthly || []).map((m) => (
                <div key={m.month} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">{m.month}</span>
                    <span className="font-bold text-slate-900">{formatMoney(m.collected)}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700" style={{ width: `${m.progress || 0}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{m.count} payments</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Top Pending Classes</h2>
          {(data?.topPending || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No pending dues.</p>
          ) : (
            <div className="space-y-3">
              {(data?.topPending || []).map((item, i) => (
                <div key={item.className} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.className}</p>
                    <p className="text-xs text-slate-500">{item.students} students</p>
                  </div>
                  <p className="font-bold text-rose-600">{formatMoney(item.due)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
