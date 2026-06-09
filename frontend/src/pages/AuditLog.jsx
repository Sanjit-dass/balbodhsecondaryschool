import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ExportActions from '../components/ExportActions';

export default function AuditLog(){
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      const res = await api.get('/audit');
      setEntries(res.data.entries || []);
    } catch (err) {
      console.error(err);
      window.alert('Unable to load audit logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-gray-600">Review administrative activity, exports, and security events.</p>
        </div>
        <ExportActions resource="audit" filenamePrefix="audit-log" />
      </div>

      {loading ? (
        <div className="text-gray-700">Loading audit entries...</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-left divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-900">Time</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-900">Action</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-900">User</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-900">Path</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-900">Method</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-900">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">No audit entries found.</td>
                </tr>
              ) : entries.map((entry, index) => (
                <tr key={`${entry.timestamp}-${index}`}>
                  <td className="px-4 py-3 text-sm text-gray-700">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.user?.email || entry.user?.username || entry.user?.role || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 break-all">{entry.path}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.method}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
