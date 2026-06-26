import React from 'react';

export default function PremiumTable({ columns, rows, actions }){
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-soft overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c=> (
              <th key={c.key} className="text-left px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-600 whitespace-nowrap" style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-600 whitespace-nowrap" style={{ width: '12%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=> (
            <tr key={r.studentId || r.id} className="border-t hover:bg-gray-50">
              {columns.map(c=> (
                <td key={c.key} className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap" style={c.width ? { width: c.width } : undefined}>
                  {c.render? c.render(r): r[c.key]}
                </td>
              ))}
              <td className="px-3 py-2 md:px-4 md:py-3 space-x-1 md:space-x-2" style={{ width: '12%' }}>
                {actions && actions.map(a=> (
                  <button key={a.key} onClick={()=>a.onClick(r)} className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">{a.label}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
