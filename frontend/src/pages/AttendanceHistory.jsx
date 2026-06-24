import React, { useEffect, useMemo, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

export default function AttendanceHistory() {
  const [filters, setFilters] = useState({ date:'', month:'', class:'', section:'', subject:'' });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', { params: { ...filters, ...params } });
      setList(res.data.attendance || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const applyFilters = () => fetchAttendance();

  const stats = useMemo(() => {
    return list.map((a) => {
      const total = (a.records || []).length;
      const present = (a.records || []).filter((r) => r.status === 'present').length;
      return {
        id: a._id,
        date: a.date,
        className: a.class?.name || a.class || '',
        section: a.section || '',
        subject: a.subject?.name || a.subject || '',
        homeworkGiven: a.homeworkGiven ?? !!a.homework,
        total,
        present,
        absent: total - present,
        percent: total ? Math.round((present / total) * 100) : 0,
      };
    });
  }, [list]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance History</h1>
          <p className="text-sm text-slate-600">Daily attendance sheets with section, date, and homework status.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="p-2 border" />
          <input placeholder="Month (YYYY-MM)" value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))} className="p-2 border" />
          <input placeholder="Class" value={filters.class} onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))} className="p-2 border" />
          <input placeholder="Section" value={filters.section} onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))} className="p-2 border" />
          <input placeholder="Subject" value={filters.subject} onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))} className="p-2 border" />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={applyFilters} className="px-4 py-2 bg-indigo-600 text-white rounded">Apply</button>
          <button onClick={() => { setFilters({ date:'', month:'', class:'', section:'', subject:'' }); fetchAttendance({}); }} className="px-4 py-2 bg-slate-100 rounded">Reset</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Section</th>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Homework Given</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Present</th>
                <th className="p-2 border">Absent</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-2 border">{s.className}</td>
                  <td className="p-2 border">{s.section}</td>
                  <td className="p-2 border">{s.subject}</td>
                  <td className="p-2 border text-center">{s.homeworkGiven ? 'Yes' : 'No'}</td>
                  <td className="p-2 border text-center">{s.total}</td>
                  <td className="p-2 border text-center">{s.present}</td>
                  <td className="p-2 border text-center">{s.absent}</td>
                  <td className="p-2 border text-center">
                    <button onClick={() => { const rec = list.find((l) => l._id === s.id); setViewRecord(rec); }} className="px-3 py-1 bg-slate-200 rounded">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Attendance Sheet - {new Date(viewRecord.date).toLocaleDateString()}</h3>
              <div className="flex gap-2">
                {user && ['superadmin','principal'].includes(user.role) && (
                  <>
                    <button onClick={async () => { if (!window.confirm('Reopen this attendance for editing?')) return; try { await api.post(`/attendance/${viewRecord._id}/reopen`); alert('Attendance reopened'); fetchAttendance(); setViewRecord(null); } catch (err) { console.error(err); alert('Unable to reopen'); } }} className="px-3 py-1 bg-yellow-400 rounded">Reopen</button>
                    <button onClick={async () => { if (!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return; try { await api.delete(`/attendance/${viewRecord._id}`); alert('Deleted'); fetchAttendance(); setViewRecord(null); } catch (err) { console.error(err); alert('Unable to delete'); } }} className="px-3 py-1 bg-rose-500 text-white rounded">Delete</button>
                  </>
                )}
                <button onClick={() => setViewRecord(null)} className="px-3 py-1 bg-rose-500 text-white rounded">Close</button>
              </div>
            </div>
            <div className="mb-2 grid gap-2 sm:grid-cols-2">
              <div><strong>Class:</strong> {viewRecord.class?.name || viewRecord.class}</div>
              <div><strong>Section:</strong> {viewRecord.section || 'N/A'}</div>
              <div><strong>Subject:</strong> {viewRecord.subject?.name || viewRecord.subject}</div>
              <div><strong>Homework Given:</strong> {(viewRecord.homeworkGiven ?? !!viewRecord.homework) ? 'Yes' : 'No'}</div>
              <div><strong>Period:</strong> {viewRecord.period}</div>
              <div><strong>Topic:</strong> {viewRecord.topic}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 border">S.No</th>
                    <th className="p-2 border">Roll No</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewRecord.records || []).map((r, i) => (
                    <tr key={r.person} className="odd:bg-white even:bg-slate-50">
                      <td className="p-2 border text-center">{i + 1}</td>
                      <td className="p-2 border">{r.rollNumber}</td>
                      <td className="p-2 border">{r.name}</td>
                      <td className="p-2 border text-center">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
