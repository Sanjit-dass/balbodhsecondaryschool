import React, { useEffect, useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import ReceiptHtml from './ReceiptHtml';

export default function SelectedReceiptDisplay({ receipt, fetchReceiptPdf }){
  const [pdf, setPdf] = useState({ base64: null, url: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const knownBase64 = receipt.pdfBase64 || (receipt.receipt && receipt.receipt.pdfBase64) || null;
      const knownUrl = receipt.pdfUrl || (receipt.receipt && receipt.receipt.pdfUrl) || receipt.receiptUrl || (receipt.receipt && receipt.receipt.fileUrl) || null;
      if (knownBase64 || knownUrl) {
        if (!mounted) return;
        setPdf({ base64: knownBase64 || null, url: knownUrl || null });
        setLoading(false);
        return;
      }

      try {
        const fetched = await fetchReceiptPdf(receipt);
        if (!mounted) return;
        if (fetched) setPdf({ base64: fetched.base64 || null, url: fetched.url || null });
      } catch (err) {
        console.error('SelectedReceiptDisplay load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [receipt]);

  // Always show an HTML receipt preview when a receipt object exists.
  // If a PDF is available, prefer it; otherwise render the HTML receipt.
  if (loading && !pdf.base64 && !pdf.url) {
    // still render HTML preview while fetching PDF to avoid blank state
    return <div className="p-6 text-center text-slate-500">Loading receipt... <div className="mt-4"><ReceiptHtml receipt={receipt} student={receipt.data?.student || {}} breakdown={receipt.data?.breakdown || []} amountPaid={receipt.data?.amountPaid} totalFee={receipt.data?.totalAmount} dueAmount={receipt.data?.dueAmount} paymentMethod={receipt.data?.paymentMethod} /></div></div>;
  }

  if (pdf.base64) {
    return <ReceiptViewer base64={pdf.base64} />;
  }

  if (pdf.url) {
    return (
      <div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <iframe title="receipt-url" src={pdf.url} className="w-full h-96" />
          <div className="mt-3 flex space-x-2">
            <a href={pdf.url} download className="px-4 py-2 bg-green-600 text-white rounded">Download PDF</a>
            <button onClick={() => window.open(pdf.url, '_blank')?.print?.()} className="px-4 py-2 bg-gray-200 rounded">Print</button>
          </div>
        </div>
        <div className="mt-4">
          <ReceiptHtml receipt={receipt} student={receipt.data?.student || {}} breakdown={receipt.data?.breakdown || []} amountPaid={receipt.data?.amountPaid} totalFee={receipt.data?.totalAmount} dueAmount={receipt.data?.dueAmount} paymentMethod={receipt.data?.paymentMethod} />
        </div>
      </div>
    );
  }

  // No PDF available — render the HTML receipt so preview is never blank
  return (
    <div>
      <ReceiptHtml receipt={receipt} student={receipt.data?.student || {}} breakdown={receipt.data?.breakdown || []} amountPaid={receipt.data?.amountPaid} totalFee={receipt.data?.totalAmount} dueAmount={receipt.data?.dueAmount} paymentMethod={receipt.data?.paymentMethod} />
    </div>
  );
}
