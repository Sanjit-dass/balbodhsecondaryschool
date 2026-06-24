import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ReceiptViewer from '../../components/fee/ReceiptViewer';
import ReceiptHtml from '../../components/fee/ReceiptHtml';
import html2pdf from 'html2pdf.js';

export default function ReceiptPage(){
  const { receiptId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = useMemo(() => searchParams.get('id') || searchParams.get('receiptNumber'), [searchParams]);
  const idToUse = useMemo(() => receiptId || queryId, [receiptId, queryId]);
  const printFlag = useMemo(() => searchParams.get('print'), [searchParams]);
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/student/')) return '/student/fees';
    if (path.startsWith('/parent/')) return '/parent/fees';
    if (path.startsWith('/fee-management/')) return '/fee-management/history';
    return '/student/fees';
  }, [location.pathname]);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdf, setPdf] = useState({ base64: null, url: null });
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [historyComputed, setHistoryComputed] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    if (!idToUse) return setError('No receipt id provided');
    let mounted = true;
    setLoading(true); setError(null);
    const fetchById = async (id) => {
      try {
        const endpoints = [
          `/fees/receipts/${encodeURIComponent(id)}`,
          `/fees/receipts/by-id/${encodeURIComponent(id)}`,
          `/fees/receipt/${encodeURIComponent(id)}`,
          `/fees/receipts?receiptId=${encodeURIComponent(id)}`,
          `/fees/receipt?id=${encodeURIComponent(id)}`,
          `/fees/payments/${encodeURIComponent(id)}/receipt`,
        ];
        let data = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            const res = await api.get(endpoint);
            data = res.data || res;
            break;
          } catch (err) {
            if (err?.response?.status === 404) {
              lastError = err;
              continue;
            }
            throw err;
          }
        }

        if (!data) {
          setError(lastError?.response?.data?.message || 'Receipt not found');
          return;
        }

        if (!mounted) return;
        const receiptObject = data.receipt || data;
        if (!receiptObject) {
          setError('Receipt not found');
          return;
        }
        if (!receiptObject.receiptNumber && data.receiptNumber) receiptObject.receiptNumber = data.receiptNumber;
        if (!receiptObject.pdfBase64 && data.pdfBase64) receiptObject.pdfBase64 = data.pdfBase64;
        if (!receiptObject.pdfUrl && !receiptObject.receiptUrl && data.receiptUrl) receiptObject.receiptUrl = data.receiptUrl;
        if (!receiptObject.receiptId && data.receiptId) receiptObject.receiptId = data.receiptId;
        if (!receiptObject.receiptId && data.id) receiptObject.receiptId = data.id;
        if (!receiptObject.receiptId && data._id) receiptObject.receiptId = data._id;
        if (!receiptObject.data) receiptObject.data = {};
        if (!receiptObject.data.breakdown && Array.isArray(receiptObject.feeBreakdown) && receiptObject.feeBreakdown.length) {
          receiptObject.data.breakdown = receiptObject.feeBreakdown.map((item) => ({
            category: String(item.category || item.name || 'Fee'),
            actualFee: Number(item.actualFee ?? item.amount ?? item.value ?? 0),
            paidFee: Number(item.paidFee ?? item.amount ?? item.value ?? 0),
            dueAmount: Number(item.dueAmount ?? item.due ?? 0),
            status: item.status || (Number(item.dueAmount ?? item.due ?? 0) === 0 ? 'Paid' : 'Partial'),
          }));
        } else if (receiptObject.data.breakdown && !Array.isArray(receiptObject.data.breakdown) && typeof receiptObject.data.breakdown === 'object') {
          receiptObject.data.breakdown = Object.entries(receiptObject.data.breakdown).map(([category, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              return {
                category,
                actualFee: Number(value.actualFee ?? value.amount ?? value.total ?? 0),
                paidFee: Number(value.paidFee ?? value.paid ?? value.amount ?? 0),
                dueAmount: Number(value.dueAmount ?? value.due ?? 0),
                status: value.status || (Number(value.dueAmount ?? value.due ?? 0) === 0 ? 'Paid' : (Number(value.paidFee ?? value.paid ?? value.amount ?? 0) > 0 ? 'Partial' : 'Unpaid')),
              };
            }
            return {
              category,
              actualFee: Number(value ?? 0),
              paidFee: Number(value ?? 0),
              dueAmount: 0,
              status: Number(value ?? 0) === 0 ? 'Unpaid' : 'Paid',
            };
          });
        }
        if (receiptObject.data.totalFeeAll == null && receiptObject.totalFeeAll != null) receiptObject.data.totalFeeAll = receiptObject.totalFeeAll;
        if (receiptObject.data.totalAmount == null && receiptObject.totalFee != null) receiptObject.data.totalAmount = receiptObject.totalFee;
        if (receiptObject.data.amountPaid == null && receiptObject.amountPaid != null) receiptObject.data.amountPaid = receiptObject.amountPaid;
        if (receiptObject.data.dueAmount == null && receiptObject.dueAmount != null) receiptObject.data.dueAmount = receiptObject.dueAmount;
        if (receiptObject.data.paymentMethod == null && receiptObject.paymentMethod != null) receiptObject.data.paymentMethod = receiptObject.paymentMethod;
        if (!receiptObject.data.student && receiptObject.student) receiptObject.data.student = receiptObject.student;
        setReceipt(receiptObject);
        const base64 = receiptObject.pdfBase64 || receiptObject.receipt?.pdfBase64 || receiptObject.data?.pdfBase64 || null;
        const url = receiptObject.pdfUrl || receiptObject.receiptUrl || receiptObject.receipt?.pdfUrl || receiptObject.data?.pdfUrl || null;
        setPdf({ base64: base64 || null, url: url || null });
      } catch (err) {
        console.error('Fetch receipt failed', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Receipt not found');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchById(idToUse);
    return () => { mounted = false; };
  }, [idToUse]);

  const handleDownloadPdf = useCallback(() => {
    if (pdf.url) {
      const a = document.createElement('a');
      a.href = pdf.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      return;
    }
    if (pdf.base64) {
      const byteChars = atob(pdf.base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.receiptNumber || 'receipt'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }
    // If we have rendered receipt HTML, generate a PDF from the DOM as a fallback
    const element = receiptRef.current;
    if (element) {
      const filename = `${receipt.receiptNumber || 'receipt'}.pdf`;
      const container = element.cloneNode(true);
      container.style.maxWidth = '180mm';
      container.style.padding = '12px';
      container.style.background = '#fff';
      container.style.boxSizing = 'border-box';
      // append off-screen so html2pdf can render it
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      const opts = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      html2pdf().set(opts).from(container).save().finally(() => { try { document.body.removeChild(container); } catch (e) {} });
      return;
    }
    alert('PDF not available. You can print the receipt to PDF using the Print action.');
  }, [pdf.base64, pdf.url, receipt?.receiptNumber]);

  const handlePrint = useCallback(() => {
    if (pdf.base64 && !receiptRef.current) {
      const src = `data:application/pdf;base64,${pdf.base64}`;
      const win = window.open(src, '_blank');
      if (!win) return alert('Allow popups to print the receipt.');
      win.onload = () => {
        try { win.focus(); win.print(); } catch (err) { console.error(err); }
      };
      return;
    }

    const content = receiptRef.current ? receiptRef.current.innerHTML : '';
    if (!content) {
      if (pdf.url) {
        const win = window.open(pdf.url, '_blank');
        if (!win) return alert('Allow popups to print the receipt.');
        win.onload = () => {
          try { win.focus(); win.print(); } catch (err) { console.error(err); }
        };
        return;
      }
      return alert('Receipt is not ready to print.');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Allow popups to print the receipt.');

    const getPageStyles = () => {
      const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      return styleNodes.map((node) => {
        if (node.tagName === 'LINK') {
          return `<link rel="stylesheet" href="${node.href}" />`;
        }
        return `<style>${node.innerHTML}</style>`;
      }).join('\n');
    };

    const styles = `
      <base href="${window.location.origin}" />
      ${getPageStyles()}
      <style>
        @page { size: A4; margin: 15mm; }
        html, body { width: 100%; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #111827; font-size: 13px; }
        .receipt-root { max-width: 800px; margin: 0 auto; max-height: 100vh; overflow: hidden; page-break-after: avoid; }
        .receipt-student-header, .receipt-breakdown-summary, .receipt-overall-summary, .receipt-payment-method { page-break-inside: avoid; break-inside: avoid; }
        .no-print { display: none !important; }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>Receipt</title>${styles}</head><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      try { printWindow.print(); } catch (err) { console.error(err); }
    };
  }, [pdf.base64, pdf.url]);

  // auto-print when requested
  useEffect(() => {
    if (printFlag === '1' && receipt) {
      const timer = setTimeout(() => { handlePrint(); }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [printFlag, receipt, handlePrint]);

  // fetch full student details when receipt is loaded
  useEffect(() => {
    if (!receipt) return;
    const studentId = receipt.studentId || receipt.data?.studentId || receipt.data?.student?._id;
    if (!studentId) return;
    const fetchStudentDetails = async () => {
      try {
        const res = await api.get(`/fees/student/${studentId}`);
        const studentProfile = res.data?.student || res.data || {};
        setStudentData(studentProfile);
      } catch (err) {
        console.warn('Could not fetch full student details:', err);
        setStudentData(receipt.data?.student || receipt.student || {});
      }
    };
    fetchStudentDetails();
  }, [receipt]);

  // fetch payment history totals for more accurate ledger values
  useEffect(() => {
    if (!receipt || historyComputed) return;
    const studentId = receipt.studentId || receipt.data?.studentId || receipt.data?.student?._id;
    if (!studentId) return;

    const fetchHistoryTotals = async () => {
      try {
        const res = await api.get(`/fees/student/${studentId}/history`);
        const records = Array.isArray(res.data) ? res.data : [];
        const totalPaidTillDate = records.reduce((sum, record) => sum + Number(record.amountPaid ?? record.amount ?? record.paidToday ?? 0), 0);
        const totalFeeAll = Number(receipt.data?.totalFeeAll ?? receipt.totalFeeAll ?? receipt.data?.totalAmount ?? receipt.data?.totalFee ?? 0);

        setReceipt((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            totalPaidTillDate: totalPaidTillDate || prev.data?.totalPaidTillDate,
            totalFeeAll: prev.data?.totalFeeAll ?? totalFeeAll,
          }
        }));
      } catch (err) {
        console.warn('Could not fetch payment history for receipt totals:', err);
      } finally {
        setHistoryComputed(true);
      }
    };

    fetchHistoryTotals();
  }, [receipt, historyComputed]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading receipt...</div>;
  if (error) return <div className="p-6 text-center text-rose-600">{error}</div>;
  if (!receipt) return <div className="p-6 text-center text-slate-500">Receipt preview is not available.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="no-print flex flex-wrap items-center justify-end gap-3 mb-4">
        <button
          onClick={() => {
            if (backPath) {
              const url = (backPath.startsWith('/student') || backPath.startsWith('/parent')) ? `${backPath}?showClaim=1` : backPath;
              return navigate(url);
            }
            return navigate(-1);
          }}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold hover:bg-slate-50 transition"
        >
          Back
        </button>
        <button onClick={handlePrint} className="rounded-2xl bg-indigo-600 px-4 py-2 text-white font-semibold">Print Receipt</button>
        <button onClick={handleDownloadPdf} className="no-print rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold">Download PDF</button>
      </div>

      {pdf.base64 ? (
        <ReceiptViewer base64={pdf.base64} />
      ) : (
        <div ref={receiptRef}>
          <ReceiptHtml receipt={receipt} student={studentData || receipt.data?.student || receipt.student || {}} breakdown={receipt.feeBreakdown || receipt.data?.breakdown || []} amountPaid={receipt.data?.amountPaid} totalFee={receipt.data?.totalFeeAll || receipt.data?.totalAmount} dueAmount={receipt.data?.dueAmount} paymentMethod={receipt.data?.paymentMethod || receipt.paymentMethod} />
        </div>
      )}
    </div>
  );
}
