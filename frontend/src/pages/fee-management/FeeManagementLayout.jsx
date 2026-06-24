import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: 'dashboard', icon: '📊' },
  { label: 'Fee Categories', to: 'categories', icon: '📋' },
  { label: 'Fee Collection', to: 'collect', icon: '💰' },
  { label: 'Payment History', to: 'history', icon: '📜' },
  { label: 'Reports', to: 'reports', icon: '📈' },
];

export default function FeeManagementLayout() {
  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto">
      <div className="space-y-6">
        {/* Premium Header */}
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100 opacity-30 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-100 opacity-20 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Fee Workspace
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">School Fee Management</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Professional workflow for fee categories, collection, receipts, and management reports.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="relative mt-6 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                end
                to={item.to}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white/80 text-slate-700 hover:bg-white hover:shadow-sm border border-slate-200/60'
                  ].join(' ')
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>

        <Outlet />
      </div>
    </div>
  );
}
