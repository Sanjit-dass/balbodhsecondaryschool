import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SCHOOL_INFO } from '../../constants/schoolData';

const formatMoney = (value) => `RS${Number(value || 0).toLocaleString()}`;

export default function FeePayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const studentId = searchParams.get('studentId');

  const [student, setStudent] = useState(null);
  const [structure, setStructure] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [savingOptionals, setSavingOptionals] = useState(false);
  const [form, setForm] = useState({ amountPaid: '', discount: 0, paymentMethod: 'Cash', remarks: '', feeMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) });
  const [loading, setLoading] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [notification, setNotification] = useState(null);
  const receiptRef = useRef(null);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 4200);
  };

  function printReceiptWindow() {
    try {
      const content = receiptRef.current ? receiptRef.current.innerHTML : '';
      const printWindow = window.open('', '_blank', 'top=0,left=0,height=900,width=900');
      if (!printWindow) return alert('Unable to open print window. Please allow popups and try again.');

      // Clone existing stylesheet and style tags so printed output matches the app
      const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join('\n');

      // Minimal print-specific adjustments to ensure page size and margin
      const printOnlyStyle = `
        <style>
          @media print { body { -webkit-print-color-adjust: exact; } }
          @page { size: A4; margin: 16mm }
        </style>
      `;

      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><title>Receipt</title>${headStyles}${printOnlyStyle}</head><body><div class="receipt-root">${content}</div></body></html>`);
      printWindow.document.close();

      // Try to print when resources are ready. Use onload if available, fallback to timeout.
      const tryPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
          try { printWindow.close(); } catch (e) {}
        } catch (e) {
          console.error('Print failed', e);
          notify('Printing failed.', 'error');
        }
      };

      if (printWindow.document.readyState === 'complete') {
        setTimeout(tryPrint, 120);
      } else {
        printWindow.onload = () => setTimeout(tryPrint, 120);
        setTimeout(tryPrint, 800);
      }
    } catch (err) {
      console.error('Print failed', err);
      notify('Failed to print receipt.', 'error');
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchStudent(studentId);
    }
  }, [studentId]);

  useEffect(() => {
    setSelectedCategories({});
  }, [studentId]);

  const extractSelectedOptionalFees = (studentObject) => {
    const values = [];
    if (!studentObject) return values;
    if (Array.isArray(studentObject.selectedOptionalFees)) values.push(...studentObject.selectedOptionalFees);
    if (studentObject.metadata && Array.isArray(studentObject.metadata.selectedOptionalFees)) values.push(...studentObject.metadata.selectedOptionalFees);
    return values.map((item) => String(item || '').trim()).filter(Boolean);
  };

  const cleanString = (v) => String(v || '').replace(/%{3,}/g, '').trim();
  const normalizeCategory = (value) => String(value || '').trim().toLowerCase();

  async function fetchStudent(id) {
    try {
      const res = await api.get(`/fees/student/${id}`);
      const data = res.data || res;
      const s = data.student || {};
      const normalizedName = s.name || s.fullName || s.fullname || ((s.firstName || s.lastName) ? `${s.firstName || ''}${s.firstName && s.lastName ? ' ' : ''}${s.lastName || ''}` : '');
      setStudent({ ...s, name: normalizedName || '-', summary: data.summary || {} });
      setSelectedCategories({});
      const classValue = data.student?.classId || data.student?.class || data.student?.className;
      const classIdentifier = typeof classValue === 'string'
        ? classValue
        : classValue?._id || classValue?.toString?.();
      if (classIdentifier) {
        await fetchStructure(classIdentifier);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchStructure(classId) {
    try {
      const res = await api.get('/fees/categories', { params: { classId } });
      const data = Array.isArray(res.data) ? res.data : [];
      setStructure(data.map((item) => ({
        category: item.name,
        amount: Number(item.amount || item.defaultAmount || 0),
        categoryType: item.categoryType || '',
        status: item.status || ''
      })));
    } catch (err) {
      console.error(err);
    }
  }

  const handleViewReceipt = () => {
    if (!receiptResult?.receipt) {
      notify('Receipt is not available.', 'error');
      return;
    }

    const receipt = receiptResult.receipt;
    if (receipt.pdfUrl) {
      window.open(receipt.pdfUrl, '_blank', 'noopener');
      return;
    }

    if (receipt.pdfBase64) {
      const blob = new Blob([Uint8Array.from(atob(receipt.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      return;
    }

    if (receipt.receiptId || receipt._id) {
      const id = receipt.receiptId || receipt._id;
      window.open(`/fee-management/receipt/${encodeURIComponent(id)}`, '_blank', 'noopener');
      return;
    }

    notify('Receipt cannot be opened at this time.', 'error');
  };

  const feeRows = useMemo(() => {
    const summaryBreakdown = student?.summary?.feeBreakdown;
    const summaryMap = Array.isArray(summaryBreakdown)
      ? summaryBreakdown.reduce((acc, item) => {
          if (!item) return acc;
          const category = String(item.category || item.name || item.label || '').trim();
          if (category) acc.set(normalizeCategory(category), item);
          return acc;
        }, new Map())
      : new Map();

    return structure.map(item => {
      const category = item.category;
      const summaryRow = summaryMap.get(normalizeCategory(category)) || {};
      const amount = Number(summaryRow.actualFee ?? (item.amount || 0));
      const paid = Number(summaryRow.paidFee ?? summaryRow.paid ?? 0);
      const due = Math.max(0, Number(summaryRow.dueAmount ?? summaryRow.due ?? Math.max(0, amount - paid)));
      // Status: Fully Paid only if due is 0 and paid > 0; Partial if due > 0 and paid > 0; Unpaid if due > 0 and paid = 0
      const status = due === 0 && paid > 0 ? 'Fully Paid' : (due > 0 && paid > 0 ? 'Partial' : 'Unpaid');
      // Only lock if fully paid (due === 0)
      const locked = due === 0;
      return {
        category,
        amount,
        paid,
        due,
        status,
        locked,
        categoryType: summaryRow.categoryType || item.categoryType || ''
      };
    });
  }, [structure, student]);

  useEffect(() => {
    if (!student || feeRows.length === 0) return;
    if (Object.keys(selectedCategories).length > 0) return;

    const selectedOptionals = new Set(extractSelectedOptionalFees(student));
    const initialSelection = {};
    feeRows.forEach((row) => {
      const isOptional = String(row.categoryType || '').toLowerCase() === 'optional service';
      if (row.locked) return;
      if (isOptional) {
        if (selectedOptionals.has(row.category)) {
          initialSelection[row.category] = true;
        }
      } else if (row.due > 0) {
        initialSelection[row.category] = true;
      }
    });
    if (Object.keys(initialSelection).length > 0) {
      setSelectedCategories(initialSelection);
    }
  }, [feeRows, selectedCategories, student]);

  useEffect(() => {
    if (feeRows.length === 0) return;
    setSelectedCategories((prev) => {
      const next = { ...prev };
      let changed = false;
      feeRows.forEach((row) => {
        if (row.locked && Object.prototype.hasOwnProperty.call(next, row.category)) {
          delete next[row.category];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [feeRows]);

  // Calculate total due across ALL categories to detect if student is fully paid
  const totalDueAllCategories = useMemo(() => feeRows.reduce((sum, row) => sum + row.due, 0), [feeRows]);
  const isStudentFullyPaid = totalDueAllCategories === 0 && feeRows.length > 0;

  const selectedRows = useMemo(() => feeRows.filter((row) => selectedCategories[row.category] && row.due > 0 && !row.locked), [feeRows, selectedCategories]);
  const selectedDueTotal = useMemo(() => selectedRows.reduce((sum, row) => sum + row.due, 0), [selectedRows]);
  // Total fee for selected heads must be the sum of original amounts (not the due amount)
  const totalFee = useMemo(() => selectedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0), [selectedRows]);

  const mandatoryRows = useMemo(() => feeRows.filter((row) => String(row.categoryType || '').toLowerCase() !== 'optional service'), [feeRows]);
  const optionalRows = useMemo(() => feeRows.filter((row) => String(row.categoryType || '').toLowerCase() === 'optional service'), [feeRows]);
  const discount = Number(form.discount || 0);
  const amountPaid = form.amountPaid !== '' ? Number(form.amountPaid || 0) : 0;
  const totalDueAfterDiscount = Math.max(0, totalFee - discount);
  const dueAmount = Math.max(0, totalDueAfterDiscount - amountPaid);
  const remainingAfterPayment = dueAmount;

  function updateForm(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  const saveSelectedOptionalFees = async (category, enabled) => {
    if (!student) return;
    const selectedOptionals = new Set(extractSelectedOptionalFees(student));
    if (enabled) selectedOptionals.add(category);
    else selectedOptionals.delete(category);

    const metadata = {
      ...(student.metadata || {}),
      selectedOptionalFees: Array.from(selectedOptionals)
    };

    try {
      setSavingOptionals(true);
      const res = await api.put(`/students/${studentId}`, { metadata });
      const updatedStudent = res.data || res;
      setStudent((prev) => ({ ...prev, metadata }));
    } catch (err) {
      setSelectedCategories((prev) => ({ ...prev, [category]: !enabled }));
      console.error('Unable to save optional service selection:', err);
      alert('Unable to save optional service selection. Please try again.');
    } finally {
      setSavingOptionals(false);
    }
  };

  const handleToggleCategory = (category, enabled, categoryType) => {
    const row = feeRows.find((r) => r.category === category);
    if (enabled && row && row.locked) {
      alert(`This fee category (${category}) is already paid and cannot be selected for collection.`);
      return;
    }
    setSelectedCategories((prev) => ({ ...prev, [category]: enabled }));
    if (String(categoryType || '').toLowerCase() === 'optional service') {
      saveSelectedOptionalFees(category, enabled);
    }
  };

  async function handleCollect() {
    if (!student) {
      alert('No student selected.');
      return;
    }

    if (isStudentFullyPaid) {
      alert('All fees for this student are already fully paid. No further payment collection is required.');
      return;
    }

    if (selectedRows.length === 0) {
      alert('Select at least one fee category to collect payment.');
      return;
    }

    if (!amountPaid || amountPaid <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }

    if (amountPaid > totalDueAfterDiscount) {
      alert(`Maximum payable amount is ₹${totalDueAfterDiscount}. Please enter a valid amount.`);
      return;
    }

    const breakdownPayload = {};
    let remaining = amountPaid;
    for (const row of selectedRows) {
      if (remaining <= 0) break;
      const pay = Math.min(row.due, remaining);
      if (pay > 0) {
        breakdownPayload[row.category] = pay;
        remaining -= pay;
      }
    }

    if (Object.keys(breakdownPayload).length === 0) {
      alert('Payment amount is too low for the selected fee categories.');
      return;
    }
    if (remaining > 0) {
      alert('Payment amount exceeds the total due for selected categories. Please reduce the amount or select more categories.');
      return;
    }

    setLoading(true);
    try {
      const classValue = student.classId || student.class || student.className;
      const classIdPayload = typeof classValue === 'string'
        ? classValue
        : classValue?._id || classValue?.toString?.();
      const payload = {
        studentId,
        classId: classIdPayload,
        breakdown: breakdownPayload,
        amountPaid,
        discount,
        paymentMethod: form.paymentMethod,
        remarks: form.remarks,
        feeMonth: form.feeMonth
      };
      const res = await api.post('/fees/collect', payload);
      const result = res.data || res;
      const paymentBreakdown = Object.entries(breakdownPayload).map(([category, amount]) => ({
        category,
        amount: Number(amount || 0)
      }));
      setReceiptResult({
        receipt: result.receipt,
        payment: result.payment,
        student,
        breakdown: paymentBreakdown,
        // totalFee should reflect the original fee amounts for selected heads
        totalFee: selectedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
        discount,
        amountPaid,
        dueAmount,
        paymentMethod: form.paymentMethod
      });
      notify('✅ Payment completed successfully.', 'success');
      await fetchStudent(studentId);
      setSelectedCategories({});
    } catch (err) {
      console.error(err);
      notify(err?.response?.data?.message || 'Unable to collect payment.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Manage Fee</h1>
          <p className="text-sm text-slate-500 mt-2">Review student fee categories and collect payment on a dedicated page.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/fee-management/collect')}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back to Student Roster
        </button>
      </div>

      {notification && (
        <div className={`rounded-3xl border px-5 py-4 text-sm ${notification.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'} mb-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>{notification.message}</div>
            {notification.type === 'success' && receiptResult?.receipt && (
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <button
                  type="button"
                  onClick={handleViewReceipt}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  View Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    if (studentId) fetchStudent(studentId);
                  }}
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-soft p-6 border border-slate-200">
            <h2 className="text-xl font-semibold mb-4">Student Details</h2>
            {!student ? (
              <div className="text-slate-500">No student selected. Go back to Collect Fee and choose a student.</div>
            ) : (
              <div className="space-y-3 text-slate-700">
                <div><span className="font-medium">Name:</span> {student.name}</div>
                <div><span className="font-medium">Admission Number:</span> {student.admissionNumber}</div>
                <div><span className="font-medium">Class:</span> {student.className || student.classId}</div>
              </div>
            )}
          </div>

          {isStudentFullyPaid ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-700 mb-2">✓</div>
                <h2 className="text-xl font-semibold text-emerald-800 mb-2">All Fees Fully Paid</h2>
                <p className="text-sm text-emerald-700">This student has no pending fee obligations. All fee categories are fully settled.</p>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-3xl shadow-soft p-6 border border-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">Fee Categories</h2>
                <p className="text-sm text-slate-500">Select fee heads and enter the payment amount to process collection. Optional services are excluded from totals until selected.</p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Selected</div>
                <div>{selectedRows.length} heads</div>
              </div>
            </div>

            <div className="mt-4 space-y-6">
              {feeRows.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No class fee categories found for this student.
                </div>
              ) : (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Mandatory Fees</h3>
                        <p className="text-sm text-slate-500">Pay these by installment if needed; fully paid heads are locked.</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{mandatoryRows.length} items</div>
                    </div>
                    <div className="space-y-3">
                      {mandatoryRows.map((item) => {
                        const selected = Boolean(selectedCategories[item.category]);
                        const isLocked = Boolean(item.locked);
                        return (
                          <label
                            key={item.category}
                            className={`flex ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} items-center justify-between gap-4 rounded-3xl border px-4 py-3 ${isLocked ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!isLocked && selected}
                                disabled={isLocked}
                                onChange={(e) => handleToggleCategory(item.category, e.target.checked, item.categoryType)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="font-medium text-slate-900">{item.category}</div>
                                <div className="text-sm text-slate-500">{item.due === 0 ? '✓ Fully Paid' : `Due ${formatMoney(item.due)} · ${item.status}`}</div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-slate-900">RS {item.amount.toLocaleString()}</div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Optional Services</h3>
                        <p className="text-sm text-slate-500">Select only the optional services the student should be enrolled for. Selections are saved automatically.</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{optionalRows.length} items</div>
                    </div>
                    <div className="space-y-3">
                      {optionalRows.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                          No optional services are defined for this class.
                        </div>
                      ) : (
                        optionalRows.map((item) => {
                          const selected = Boolean(selectedCategories[item.category]);
                          const isLocked = Boolean(item.locked);
                          return (
                            <label
                              key={item.category}
                              className={`flex ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} items-center justify-between gap-4 rounded-3xl border px-4 py-3 ${selected ? 'border-indigo-200 bg-white' : 'border-slate-200 bg-slate-50'} ${isLocked ? 'opacity-75' : 'hover:border-indigo-300'}`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={!isLocked && selected}
                                  disabled={isLocked}
                                  onChange={(e) => handleToggleCategory(item.category, e.target.checked, item.categoryType)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">{item.category}</span>
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-700">Optional</span>
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {item.due === 0 ? '✓ Fully Paid' : (selected ? `Due ${formatMoney(item.due)} · ${item.status}` : 'Not enrolled')}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-slate-900">RS {item.amount.toLocaleString()}</div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected Heads</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedRows.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected Balance</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(selectedDueTotal)}</p>
              </div>
              {!isStudentFullyPaid && (
              <>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Amount Entered</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">RS {amountPaid.toLocaleString()}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Remaining</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(remainingAfterPayment)}</p>
              </div>
              </>
              )}
            </div>
          </div>
          )}
        </div>

        <div className="space-y-6" style={isStudentFullyPaid ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
          {!isStudentFullyPaid && (
          <div className="bg-white rounded-3xl shadow-soft p-6 border border-slate-200">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Amount Paid</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.amountPaid}
                  onChange={e => updateForm('amountPaid', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Discount</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.discount}
                  onChange={e => updateForm('discount', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={e => updateForm('remarks', e.target.value)}
                  rows="3"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={e => updateForm('paymentMethod', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Fee Month</label>
                <input
                  type="text"
                  placeholder="e.g. April 2026"
                  value={form.feeMonth}
                  onChange={e => updateForm('feeMonth', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
          )}

          <div className="bg-white rounded-3xl shadow-soft p-6 border border-slate-200">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="space-y-3 text-slate-700">
              <div className="flex justify-between"><span>Total Fee</span><span>RS {totalFee.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>RS {discount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Amount Paid</span><span>RS {amountPaid.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Due Amount</span><span className="font-semibold">RS {dueAmount.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={handleCollect} disabled={loading || !student || isStudentFullyPaid || selectedRows.length === 0} className="rounded-2xl px-6 py-3 text-white font-semibold transition disabled:cursor-not-allowed" style={{
              backgroundColor: isStudentFullyPaid || selectedRows.length === 0 ? '#d1d5db' : '#4f46e5',
              color: isStudentFullyPaid || selectedRows.length === 0 ? '#9ca3af' : 'white',
              cursor: isStudentFullyPaid || selectedRows.length === 0 ? 'not-allowed' : 'pointer'
            }}>
              {isStudentFullyPaid ? 'All Fees Paid' : selectedRows.length === 0 ? 'Select Fee Categories' : loading ? 'Collecting...' : 'Collect Payment'}
            </button>
            <button onClick={() => navigate('/fee-management/collect')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition">
              Back to Student Roster
            </button>
          </div>
        </div>
      </div>

      {receiptResult && (
        <div ref={receiptRef} id="receipt-container" className="receipt-root mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="px-6 py-8 text-center">
            {SCHOOL_INFO.logo && (
                <img src={SCHOOL_INFO.logo} alt="School Logo" className="mx-auto h-24 w-24 rounded-full border border-slate-200 bg-white object-cover" />
            )}
            <div className="mt-4 text-3xl font-bold text-red-700">{SCHOOL_INFO.name}</div>
            <div className="mt-2 text-xl font-semibold text-red-700">{SCHOOL_INFO.address}</div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 text-left">
                <div className="text-lg font-semibold text-slate-900">Name: <span className="font-normal">{cleanString(receiptResult.student?.name || receiptResult.receipt?.data?.student?.name || 'N/A')}</span></div>
                <div className="text-lg font-semibold text-slate-900">Roll no.: <span className="font-normal">{cleanString(receiptResult.student?.rollNumber || receiptResult.student?.admissionNumber || receiptResult.receipt?.data?.student?.rollNumber || receiptResult.receipt?.data?.student?.admissionNumber || 'N/A')}</span></div>
                <div className="text-lg font-semibold text-slate-900">Class : <span className="font-normal">{cleanString(receiptResult.student?.className || receiptResult.receipt?.data?.student?.className || 'N/A')}</span></div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Receipt No.</div>
                <div className="mt-2 font-semibold text-slate-900">{receiptResult.receipt?.receiptNumber || 'N/A'}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Date</div>
                <div className="mt-2 text-slate-700">{receiptResult.receipt?.data?.date ? new Date(receiptResult.receipt.data.date).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-6 pb-6">
            <table className="min-w-full border-collapse text-sm text-slate-700">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-100 text-left text-sm font-semibold text-slate-700">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Particular</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(receiptResult.breakdown || receiptResult.receipt?.data?.breakdown || []).map((item, index) => (
                  <tr key={`${item.category}-${index}`}>
                    <td className="px-4 py-3">{receiptResult.receipt?.data?.date ? new Date(receiptResult.receipt.data.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">{cleanString(item.category)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col gap-3 md:flex-row md:justify-end">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">RS {Number(receiptResult.totalFee || 0).toLocaleString()}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">RS {Number(receiptResult.amountPaid || 0).toLocaleString()}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Due</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">RS {Number(receiptResult.dueAmount || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="receipt-summary text-slate-700">
              <div className="summary-line">Total Fee (All Categories): Rs. {Number(receiptResult.totalFee || 0).toLocaleString()}</div>
              <div className="summary-line">Amount Paid Today: Rs. {Number(receiptResult.amountPaid || 0).toLocaleString()}</div>
              <div className="summary-line">Total Paid Till Date: Rs. {Number(receiptResult.receipt?.data?.totalPaid || 0).toLocaleString()}</div>
              <div className="summary-line">Due Amount: Rs. {Number(receiptResult.dueAmount || 0).toLocaleString()}</div>
              <div className="summary-line">Status: {receiptResult.receipt?.data?.status || 'N/A'}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 pb-6">
            <button onClick={printReceiptWindow} className="rounded-2xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition w-full sm:w-auto">
              Print Receipt
            </button>
            <button
              type="button"
              onClick={() => {
                const url = receiptResult.receipt?.pdfUrl;
                if (!url) return alert('Receipt PDF not available.');
                const link = document.createElement('a');
                link.href = url;
                link.download = `${receiptResult.receipt.receiptNumber || 'receipt'}.pdf`;
                link.click();
              }}
              className="rounded-2xl border border-indigo-600 bg-white px-6 py-3 text-indigo-700 font-semibold hover:bg-indigo-50 transition w-full sm:w-auto"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
