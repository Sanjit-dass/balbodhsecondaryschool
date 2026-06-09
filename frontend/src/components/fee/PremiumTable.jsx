import React from 'react';

export default function PremiumTable({ columns, rows, actions }){
  return (
    <div className="bg-white rounded-xl shadow-soft overflow-x-auto">
      <table className="min-w-full table-fixed">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c=> (
              <th key={c.key} className="text-left p-3 text-sm text-gray-600" style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
            <th className="p-3 text-sm text-gray-600" style={{ width: '12%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=> (
            <tr key={r.studentId || r.id} className="border-t hover:bg-gray-50">
              {columns.map(c=> (
                <td key={c.key} className="p-3 text-sm text-gray-700" style={c.width ? { width: c.width } : undefined}>
                  {c.render? c.render(r): r[c.key]}
                </td>
              ))}
              <td className="p-3 space-x-2" style={{ width: '12%' }}>
                {actions && actions.map(a=> (
                  <button key={a.key} onClick={()=>a.onClick(r)} className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">{a.label}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
