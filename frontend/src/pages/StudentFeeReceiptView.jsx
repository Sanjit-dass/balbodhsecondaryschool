import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString()}`;
const getReceiptAmount = (receipt) => Number(receipt?.amountPaid ?? receipt?.amount ?? receipt?.paid ?? 0);
const getReceiptDate = (receipt) => receipt?.createdAt || receipt?.date || receipt?.timestamp;

function openReceiptRoute(receipt, role, print = false, navigate) {
  const receiptId = receipt?.receiptId || receipt?.id || receipt?._id || receipt?.paymentId || receipt?.receiptNumber;
  if (!receiptId) return false;
  const basePath = role === 'parent' ? '/parent/receipt' : role === 'student' ? '/student/receipt' : '/fee-management/receipt';
  navigate(`${basePath}/${encodeURIComponent(receiptId)}${print ? '?print=1' : ''}`);
  return true;
}

function openPdf(receipt, print = false) {
  const receiptId = receipt?.receiptId || receipt?.id || receipt?._id || receipt?.paymentId || receipt?.receiptNumber;
  const url = receipt?.receiptUrl || receipt?.pdfUrl || receipt?.receipt?.pdfUrl;
  const base64 = receipt?.pdfBase64 || receipt?.receipt?.pdfBase64;

  if (url) {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (print && win) setTimeout(() => win.print?.(), 600);
    return true;
  }

  if (base64) {
    const win = window.open(`data:application/pdf;base64,${base64}`, '_blank', 'noopener,noreferrer');
    if (print && win) setTimeout(() => win.print?.(), 600);
    return true;
  }

  return false;
}

export default function StudentFeeReceiptView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [studentId, setStudentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryStudentId = searchParams.get('student') || searchParams.get('studentId');
    if (queryStudentId) {
      setStudentId(queryStudentId);
      return;
    }

    try {
      const verified = localStorage.getItem('verifiedStudent');
      if (verified) {
        const parsed = JSON.parse(verified);
        if (parsed?.id) {
          setStudentId(parsed.id);
          return;
        }
      }
    } catch (err) {
      console.warn('Unable to read verified student', err);
    }

    if (user && (user.role === 'student' || user.role === 'parent')) {
      setStudentId(user.studentId || user.student?._id || user.student?.id || user.id || user._id || null);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    const loadReceiptData = async () => {
      setLoading(true);
      try {
        try {
          const cached = localStorage.getItem(`feeReceipts_${studentId}`);
          if (cached && !cancelled) setReceipts(JSON.parse(cached));
        } catch (err) {
          console.warn('Unable to read cached receipts', err);
        }

        let profilePayload = null;
        try {
          const summaryResponse = await api.get(`/fees/student/${encodeURIComponent(studentId)}/summary`);
          profilePayload = summaryResponse.data?.data || summaryResponse.data;
        } catch (summaryError) {
          const profileResponse = await api.get(`/fees/student/${encodeURIComponent(studentId)}`);
          profilePayload = profileResponse.data?.data || profileResponse.data;
        }

        if (!cancelled) {
          const student = profilePayload?.student || profilePayload?.summary?.student || {};
          setProfile({ student, summary: profilePayload?.summary || profilePayload || {} });
        }

        const historyResponse = await api.get(`/fees/student/${encodeURIComponent(studentId)}/history`);
        const historyData = historyResponse.data;
        const list = Array.isArray(historyData) ? historyData : Array.isArray(historyData?.data) ? historyData.data : [];
        if (!cancelled) {
          setReceipts(list);
          try {
            localStorage.setItem(`feeReceipts_${studentId}`, JSON.stringify(list));
          } catch (err) {
            console.warn('Unable to cache receipts', err);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Receipt load failed:', err);
          setReceipts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReceiptData();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading) return <div className="p-6">Loading receipts...</div>;

  if (!studentId) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 text-sm text-slate-700">Please verify your student record first from Fee Overview.</div>
          <a href="/fees/overview" className="rounded bg-indigo-600 px-4 py-2 text-white">Go To Fee Overview</a>
        </div>
      </div>
    );
  }

  const student = profile?.student || {};
  const role = String(user?.role || '').toLowerCase();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          <img src={student.photo || '/default-placeholder.png'} alt="student" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <div className="text-xl font-bold">{student.name || student.fullName || '-'}</div>
            <div className="text-sm text-slate-600">Class: <span className="font-semibold">{student.className || student.class?.name || '-'}</span></div>
            <div className="text-sm text-slate-600">Roll: <span className="font-semibold">{student.admissionNumber || student.rollNumber || '-'}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Payment Timeline</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{receipts.length} receipts</span>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">Visual timeline of your payment activity and transactions.</p>
          <div className="space-y-4">
            {receipts.length === 0 ? (
              <div className="text-sm text-slate-500">No receipts found.</div>
            ) : receipts.map((receipt, index) => {
              const receiptDate = getReceiptDate(receipt);
              const formattedDate = receiptDate ? new Date(receiptDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable';
              const receiptNumber = receipt.receiptNumber || receipt.receiptId || receipt._id || 'N/A';
              const amount = formatMoney(getReceiptAmount(receipt));
              
              return (
                <div key={receipt._id || receipt.id || receipt.receiptNumber || index} className="relative pl-8 pb-4 border-l-2 border-slate-200 last:border-0">
                  <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white -translate-x-1/2"></div>
                  <div className="mb-1 text-xs text-slate-500">{formattedDate}</div>
                  <div className="text-sm text-slate-700 mb-1">({receiptNumber})</div>
                  <div className="text-sm font-semibold text-slate-900">Fee Payment Received</div>
                  <div className="text-lg font-bold text-green-600">{amount}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Receipt Center</h4>
          <p className="text-sm text-slate-600 mb-4">Access all available receipts. Download, print, or view detailed receipt information.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Receipt No</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Amount</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-500">No receipts found.</td>
                  </tr>
                ) : receipts.map((receipt, index) => {
                  const receiptDate = getReceiptDate(receipt);
                  const formattedDate = receiptDate ? new Date(receiptDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'N/A';
                  const receiptNumber = receipt.receiptNumber || receipt.receiptId || receipt._id || 'N/A';
                  const amount = formatMoney(getReceiptAmount(receipt));
                  
                  return (
                    <tr key={receipt._id || receipt.id || receipt.receiptNumber || index} className="border-b">
                      <td className="py-3 px-3 text-slate-700">{receiptNumber}</td>
                      <td className="py-3 px-3 text-slate-700">{formattedDate}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{amount}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!openPdf(receipt)) openReceiptRoute(receipt, role, false, navigate);
                            }}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!openPdf(receipt, true)) openReceiptRoute(receipt, role, true, navigate);
                            }}
                            className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
