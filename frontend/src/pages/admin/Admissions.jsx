import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function AdminAdmissions(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admissions');
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load admissions');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchList(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;
    try {
      await api.delete(`/admissions/${id}`);
      fetchList();
    } catch (err) { console.error(err); alert('Delete failed'); }
  };

  const handleConvert = async (id) => {
    if (!confirm('Approve this application? This will mark it Approved and will not create a student account.')) return;
    try {
      await api.post(`/admissions/${id}/convert`);
      fetchList();
      alert('Application approved');
    } catch (err) { console.error(err); alert('Approve failed'); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason (optional)') || '';
    try {
      await api.put(`/admissions/${id}/status`, { status: 'Rejected', rejectionReason: reason });
      fetchList();
    } catch (err) { console.error(err); alert('Update failed'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admissions (Admin)</h2>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">App ID</th>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Parent</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Submitted</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-3">{it.applicationId}</td>
                  <td className="p-3">{it.studentName}</td>
                  <td className="p-3">{it.parentName}</td>
                  <td className="p-3">{it.phone}</td>
                  <td className="p-3">{it.applyingClass}</td>
                  <td className="p-3">{new Date(it.submissionDate).toLocaleString()}</td>
                  <td className="p-3">{it.status}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={()=>handleConvert(it._id)} className="px-2 py-1 bg-green-500 text-white rounded">Approve</button>
                    <button onClick={()=>handleReject(it._id)} className="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
                    <button onClick={()=>handleDelete(it._id)} className="px-2 py-1 bg-gray-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
