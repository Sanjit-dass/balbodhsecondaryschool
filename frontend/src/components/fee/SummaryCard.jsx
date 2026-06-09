import React from 'react';

export default function SummaryCard({ title, value, icon }){
  return (
    <div className="bg-white shadow-soft rounded-xl p-5 flex items-center space-x-4">
      <div className="bg-gray-50 rounded-lg p-3">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
}
