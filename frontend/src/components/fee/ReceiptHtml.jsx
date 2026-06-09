import React from 'react';
import { SCHOOL_INFO } from '../../constants/schoolData';

export default function ReceiptHtml({ receipt = {}, student = {}, breakdown = [], totalFee, amountPaid, dueAmount, paymentMethod }){
  // Ensure breakdown items show ONLY paid fees (fees in this transaction)
  const normalizeBreakdown = (data) => {
    if (Array.isArray(data) && data.length) return data;
    if (data && typeof data === 'object') {
      return Object.entries(data).map(([category, value]) => {
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
    return [];
  };

  let breakdownData = normalizeBreakdown(breakdown);
  if (!breakdownData.length) breakdownData = normalizeBreakdown(receipt.data?.breakdown);
  if (!breakdownData.length) breakdownData = normalizeBreakdown(receipt.feeBreakdown);
  const breakdownItems = breakdownData.filter((item) => Number(item.paidFee || item.amount || 0) > 0);

  // Proper student details resolution with comprehensive fallbacks
  const normalizeValue = (value) => {
    if (value == null) return null;
    const normalized = String(value).trim();
    return normalized && normalized.toUpperCase() !== 'N/A' ? normalized : null;
  };

  const getStudentDetail = (primary, ...fallbacks) => {
    let value = normalizeValue(primary);
    if (!value) {
      for (const fallback of fallbacks) {
        const normalized = normalizeValue(fallback);
        if (normalized) {
          value = normalized;
          break;
        }
      }
    }
    return value || null;
  };

  const studentName = getStudentDetail(
    student.name || student.fullName || student.fullname,
    receipt.data?.student?.name || receipt.data?.student?.fullName || receipt.data?.student?.fullname,
    receipt.studentName,
    receipt.data?.studentName
  );
  const studentRollNo = getStudentDetail(
    student.rollNumber || student.admissionNumber,
    receipt.data?.student?.rollNumber || receipt.data?.student?.admissionNumber,
    student.admissionNumber,
    receipt.data?.student?.admissionNumber,
    receipt.rollNumber,
    receipt.data?.rollNumber
  );
  const studentClass = getStudentDetail(
    student.class?.name || student.className || student.class,
    receipt.data?.student?.class?.name || receipt.data?.student?.className || receipt.data?.student?.class,
    receipt.className,
    receipt.data?.className
  );

  const studentNameDisplay = studentName || 'Unknown Student';
  const studentRollNoDisplay = studentRollNo || '-';
  const studentClassDisplay = studentClass || '-';

  // === RECEIPT BREAKDOWN SUMMARY (from items in THIS transaction) ===
  const receiptTotalFee = Number(breakdownItems.reduce((sum, item) => sum + Number(item.actualFee || item.amount || 0), 0));
  const receiptAmountPaid = Number(breakdownItems.reduce((sum, item) => sum + Number(item.paidFee || item.amount || 0), 0));
  const receiptDueAmount = Number(breakdownItems.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0));

  // === OVERALL STUDENT LEDGER SUMMARY (from backend totalFeeAll - all enrolled categories) ===
  // totalFeeAll from backend = sum of all assigned categories (mandatory + selected optional)
  const studentTotalFeeAllCategories = Number(totalFee ?? receipt.data?.totalFeeAll ?? receipt.totalFeeAll ?? receiptTotalFee);
  const studentAmountPaidToday = receiptAmountPaid; // Amount paid in this transaction
  const studentTotalPaidTillDate = Number(receipt.data?.totalPaidTillDate ?? receipt.data?.totalPaid ?? receipt.data?.amountPaid ?? receipt.amountPaid ?? amountPaid ?? receiptAmountPaid);
  // IMPORTANT: Due Amount for ledger = Total Fee (All Categories) - Total Paid Till Date, NOT from dueAmount prop (which is transaction-level)
  const studentDueAmount = Math.max(0, studentTotalFeeAllCategories - studentTotalPaidTillDate);
  
  // === CALCULATE STATUS ===
  const calculateStatus = () => {
    if (studentTotalPaidTillDate >= studentTotalFeeAllCategories) return 'PAID';
    if (studentTotalPaidTillDate > 0) return 'PARTIALLY PAID';
    return 'UNPAID';
  };
  const status = calculateStatus();

  // === FORMAT DATE ===
  const formatReceiptDate = () => {
    let dateValue = receipt.data?.date || receipt.data?.paymentDate || receipt.paymentDate || receipt.date || receipt.createdAt;
    if (!dateValue) return 'Date not available';
    try {
      const dateObj = new Date(dateValue);
      if (isNaN(dateObj.getTime())) return 'Date not available';
      return dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (err) {
      return 'Date not available';
    }
  };
  const receiptDateFormatted = formatReceiptDate();

  const cleanString = (v) => String(v || '').replace(/%{3,}/g, '').trim();

  return (
    <div id="receipt-container" className="receipt-root bg-white rounded-3xl shadow-soft overflow-hidden border border-slate-200">
      <div className="px-6 py-8 text-center">
        {SCHOOL_INFO.logo && (
          <img src={SCHOOL_INFO.logo} alt="School Logo" className="mx-auto h-24 w-24 rounded-full border border-slate-200 bg-white object-cover" />
        )}
        <div className="mt-4 text-3xl font-bold text-red-700">{SCHOOL_INFO.name}</div>
        <div className="mt-2 text-xl font-semibold text-red-700">{SCHOOL_INFO.address}</div>
      </div>

      <div className="px-6 pb-6 receipt-student-header">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 text-left">
            <div className="text-lg font-semibold text-slate-900">Name: <span className="font-normal">{studentNameDisplay}</span></div>
            <div className="text-lg font-semibold text-slate-900">Roll no.: <span className="font-normal">{studentRollNoDisplay}</span></div>
            <div className="text-lg font-semibold text-slate-900">Class : <span className="font-normal">{studentClassDisplay}</span></div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Receipt No.</div>
            <div className="mt-2 font-semibold text-slate-900">{receipt.receiptNumber || '-'}</div>
            <div className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Date</div>
            <div className="mt-2 text-slate-700">{receiptDateFormatted}</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <table className="min-w-full border-collapse text-sm text-slate-700">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-100 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-3">S.No</th>
              <th className="px-4 py-3">Fee Head</th>
              <th className="px-4 py-3 text-right">Actual Fee</th>
              <th className="px-4 py-3 text-right">Paid Fee</th>
              <th className="px-4 py-3 text-right">Due Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {breakdownItems.map((item, index) => (
              <tr key={`${item.category}-${index}`} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{cleanString(item.category)}</td>
                <td className="px-4 py-3 text-right font-semibold">RS {Number(item.actualFee || item.amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold">RS {Number(item.paidFee || item.amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold">RS {Number(item.dueAmount || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{item.status || (item.dueAmount === 0 ? 'Paid' : 'Partial')}</td>
              </tr>
            ))}
            {breakdownItems.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No breakdown available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RECEIPT BREAKDOWN SUMMARY - From items in this transaction */}
      <div className="px-6 pb-6 receipt-breakdown-summary">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Receipt Breakdown Summary</h3>
        <div className="space-y-2 text-slate-800 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span>Total Fee</span>
            <span className="font-semibold">RS {receiptTotalFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span>Amount Paid</span>
            <span className="font-semibold">RS {receiptAmountPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Due Amount</span>
            <span className="font-semibold">RS {receiptDueAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* OVERALL STUDENT LEDGER SUMMARY - From all categories */}
      <div className="px-6 pb-6 receipt-overall-summary">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Overall Student Summary</h3>
        <div className="space-y-2 text-slate-800 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span>Total Fee (All Categories)</span>
            <span className="font-semibold">RS {studentTotalFeeAllCategories.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span>Amount Paid Today</span>
            <span className="font-semibold">RS {studentAmountPaidToday.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span>Total Paid Till Date</span>
            <span className="font-semibold">RS {studentTotalPaidTillDate.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Due Amount</span>
            <span className="font-semibold">RS {studentDueAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-900 font-semibold">
          Status: <span className="font-bold">{status}</span>
        </div>
      </div>

      {/* PAYMENT METHOD SECTION */}
      <div className="px-6 pb-6 receipt-payment-method">
        <div className="text-slate-800 text-sm">
          <div className="flex justify-between items-center py-2 border-t border-slate-200 pt-4">
            <span>Payment Method</span>
            <span className="font-semibold">{paymentMethod || receipt.paymentMethod || receipt.data?.paymentMethod || 'Cash'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

