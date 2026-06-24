import React, { useState } from 'react';
import api from '../services/api';

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

export default function ExportActions({ resource, filenamePrefix, resourceId }){
  const [loading, setLoading] = useState(false);
  const name = filenamePrefix || resource;

  const handleExport = async () => {
    try {
      setLoading(true);
      const url = `/${resource}/export/pdf`;
      const res = await api.get(url, {
        params: resourceId ? { id: resourceId } : {},
        responseType: 'arraybuffer'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      downloadBlob(blob, `${name}_report.pdf`);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'PDF export failed. Please refresh and try again.';
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <button 
        onClick={handleExport} 
        disabled={loading}
        className="no-print px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl shadow-sm transition-colors"
      >
        {loading ? 'Generating PDF...' : '📄 Download PDF Report'}
      </button>
    </div>
  );
}
