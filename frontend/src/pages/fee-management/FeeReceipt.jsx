import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SCHOOL_INFO } from '../../constants/schoolData';
import ReceiptHtml from '../../components/fee/ReceiptHtml';

export default function FeeReceipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const receipt = state.receipt || {};
  const payment = state.payment || {};
  const student = state.student || {};
  const breakdown = state.breakdown || [];
  const totalFee = state.totalFee || 0;
  const amountPaid = state.amountPaid || 0;
  const dueAmount = state.dueAmount || 0;
  const paymentMethod = state.paymentMethod || payment.paymentMethod || 'Cash';

  const breakdownItems = breakdown.length
    ? breakdown
    : receipt.data?.breakdown
    ? Object.entries(receipt.data.breakdown).map(([key, value]) => ({ category: key, amount: Number(value) }))
    : [];

  const cleanString = (v) => String(v || '').replace(/%{3,}/g, '').trim();

  function downloadPdf() {
    if (!receipt.pdfUrl) {
      alert('PDF not available.');
      return;
    }
    const link = document.createElement('a');
    link.href = receipt.pdfUrl;
    link.download = `${receipt.receiptNumber || 'receipt'}.pdf`;
    link.click();
  }

  const backPath = (() => {
    const path = location.pathname || '';
    if (path.startsWith('/student/')) return '/student/fees';
    if (path.startsWith('/parent/')) return '/parent/fees';
    if (path.startsWith('/fee-management/')) return '/fee-management/history';
    return '/student/fees';
  })();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Receipt</h1>
        <p className="text-sm text-slate-500 mt-2">Review payment details and print or download the receipt.</p>
      </div>

      <div>
        <ReceiptHtml receipt={receipt} student={student} breakdown={breakdown} totalFee={totalFee} amountPaid={amountPaid} dueAmount={dueAmount} paymentMethod={paymentMethod} />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              if (backPath) {
                const url = (backPath.startsWith('/student') || backPath.startsWith('/parent')) ? `${backPath}?showClaim=1` : backPath;
                return navigate(url);
              }
              return navigate(-1);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition"
          >
            Back to Payment History
          </button>
          <button onClick={() => window.print()} className="rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition">
            Print Receipt
          </button>
          <button onClick={downloadPdf} className="rounded-2xl border border-indigo-600 bg-white px-6 py-3 text-indigo-700 font-semibold hover:bg-indigo-50 transition">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
