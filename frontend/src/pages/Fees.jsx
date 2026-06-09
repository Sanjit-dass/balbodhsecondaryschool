import React from 'react';
import FeeDashboard from './FeeDashboard';

export default function Fees(){
  return (
    <div>
      <div className="p-4 bg-white rounded-xl shadow-soft mb-4">
        <div>
          <h1 className="text-xl font-semibold">Fees</h1>
          <p className="text-sm text-slate-500">Start by creating fee categories from the sidebar, then select a class to enter payment details.</p>
        </div>
      </div>
      <FeeDashboard />
    </div>
  );
}
