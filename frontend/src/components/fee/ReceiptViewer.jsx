import React from 'react';

export default function ReceiptViewer({ base64 }){
  if (!base64) return null;
  const src = `data:application/pdf;base64,${base64}`;
  const handlePrint = () => {
    const printWindow = window.open(src, '_blank');
    if (!printWindow) {
      return alert('Unable to open print window. Please allow popups and try again.');
    }
    printWindow.focus();
    printWindow.onload = () => {
      try {
        printWindow.print();
      } catch (err) {
        console.error('Receipt print failed', err);
      }
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-4">
      <iframe title="receipt" src={src} className="w-full h-96" />
      <div className="mt-3 flex space-x-2">
        <a href={src} download className="px-4 py-2 bg-green-600 text-white rounded">Download PDF</a>
        <button onClick={handlePrint} className="px-4 py-2 bg-gray-200 rounded">Print</button>
      </div>
    </div>
  );
}
