import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Fee Categories', to: 'categories' },
  { label: 'Fee Collection', to: 'collect' },
  { label: 'Payment History', to: 'history' },
  { label: 'Reports', to: 'reports' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function FeeManagementLayout() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fee Workspace</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">School Fee Management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A premium workflow for fee categories, collection, receipts and management reports.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  end
                  to={item.to}
                  className={({ isActive }) => classNames(
                    'rounded-3xl px-4 py-3 text-center text-sm font-semibold transition',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-soft'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </section>

        <Outlet />
      </div>
    </div>
  );
}
