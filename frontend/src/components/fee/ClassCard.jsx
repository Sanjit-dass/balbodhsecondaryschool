import React from 'react';

export default function ClassCard({ cls, onView }){
  return (
    <div className="bg-white rounded-xl shadow-soft p-5 w-full sm:w-72">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-600 font-medium">{cls.className}</div>
          <div className="text-sm text-gray-400">{cls.count||0} Students</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{cls.collected? `RS${cls.collected}` : 'RS0'}</div>
          <div className="text-sm text-red-500">{cls.pending? `RS${cls.pending}` : 'RS0'}</div>
        </div>
      </div>
      <div className="mt-4">
        <button onClick={()=>onView && onView(cls)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700">View Students</button>
      </div>
    </div>
  );
}
