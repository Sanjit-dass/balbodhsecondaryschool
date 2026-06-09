import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Timetable(){
  const [timetables, setTimetables] = useState([]);

  useEffect(()=>{
    const fetchTimetables = async () => {
      try {
        const res = await api.get('/students/me/timetable');
        setTimetables(res.data.timetables || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTimetables();
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Timetable</h1>
          <p className="text-sm text-slate-600">View your class schedule and daily timetable.</p>
        </div>
        <button onClick={()=>window.print()} className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800">Print Timetable</button>
      </div>

      {timetables.length === 0 ? (
        <div className="rounded bg-white p-6 shadow border border-slate-200 text-slate-600">No timetable data is available yet.</div>
      ) : (
        <div className="space-y-6">
          {timetables.map(item => (
            <section key={item._id} className="rounded-lg border border-slate-200 bg-white shadow-sm p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.class?.name || item.class || 'Class'} {item.section ? `- ${item.section}` : ''}</h2>
                  <p className="text-sm text-slate-500">Academic year: {item.academicYear || 'N/A'}</p>
                </div>
                <div className="text-sm text-slate-600">Entries: {item.entries?.length || 0}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-[0.1em] text-xs">
                    <tr>
                      <th className="px-3 py-2">Day</th>
                      <th className="px-3 py-2">Period</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2">Teacher</th>
                      <th className="px-3 py-2">Room</th>
                      <th className="px-3 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {item.entries?.map((entry, index) => (
                      <tr key={`${item._id}-${index}`}>
                        <td className="px-3 py-2 text-slate-800">{entry.day}</td>
                        <td className="px-3 py-2 text-slate-800">{entry.period}</td>
                        <td className="px-3 py-2 text-slate-800">{entry.subject?.name || entry.subject || 'N/A'}</td>
                        <td className="px-3 py-2 text-slate-800">{entry.teacher?.fullName || entry.teacher || 'N/A'}</td>
                        <td className="px-3 py-2 text-slate-800">{entry.room || '—'}</td>
                        <td className="px-3 py-2 text-slate-800">{entry.startTime || '—'} {entry.endTime ? `to ${entry.endTime}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
