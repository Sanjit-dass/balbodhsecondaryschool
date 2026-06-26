import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SCHOOL_INFO } from '../../constants/schoolData';

const formatMoney = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

const STATUS_CONFIG = {
  Paid:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: '✓', label: 'Paid' },
  Partial: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   icon: '◐', label: 'Partial' },
  Unpaid:  { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',     badge: 'bg-rose-100 text-rose-700',     icon: '○', label: 'Unpaid' }
};

function ProgressBar({ percent }) {
  const p = Math.min(100, Math.max(0, percent));
  const color = p >= 100 ? 'from-emerald-400 to-emerald-600' : p >= 50 ? 'from-amber-400 to-amber-600' : 'from-rose-400 to-rose-600';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500">Collection Progress</span>
        <span className={`text-sm font-bold ${p >= 100 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{p}% Paid</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function CategoryCard({ item, selected, onToggle }) {
  const isLocked = Number(item.due) <= 0;
  const status = isLocked ? 'Paid' : (item.paid > 0 ? 'Partial' : 'Unpaid');
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all duration-200 ${isLocked ? 'border-emerald-300 bg-emerald-50/50' : selected ? 'border-indigo-300 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checkbox / Lock icon */}
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggle(item.category, e.target.checked)}
            disabled={isLocked}
            className={`flex-shrink-0 mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          />
          {isLocked && (
            <div className="ml-2 flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold ${isLocked ? 'text-emerald-700' : 'text-slate-900'}`}>{item.category}</span>
              {item.categoryType === 'Optional Service' && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-violet-700">Optional</span>
              )}
            </div>
            {/* Amount display */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-bold ${isLocked ? 'text-emerald-600' : 'text-slate-700'}`}>
                Paid {formatMoney(item.paid)} / {formatMoney(item.amount)}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${cfg.badge}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            {/* Remaining */}
            {!isLocked && item.due > 0 && item.paid > 0 && (
              <p className="mt-1 text-xs font-medium text-amber-600">Remaining {formatMoney(item.due)}</p>
            )}
            {isLocked && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Locked
              </p>
            )}
          </div>
        </div>
        {/* Amount on right */}
        <div className={`text-right flex-shrink-0 ${isLocked ? 'text-emerald-500 line-through opacity-60' : 'text-slate-900'}`}>
          <div className="text-lg font-bold">{formatMoney(item.amount)}</div>
        </div>
      </div>
    </div>
  );
}

export default function FeePayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const studentId = searchParams.get('studentId');

  const [student, setStudent] = useState(null);
  const [structure, setStructure] = useState([]);
  const [receipts, setReceipts] = useState([]);
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
      if (!printWindow) return alert('Unable to open print window.');
      const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => el.outerHTML).join('\n');
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><title>Receipt</title>${headStyles}<style>@media print{body{-webkit-print-color-adjust:exact}}@page{size:A4;margin:16mm}</style></head><body><div class="receipt-root">${content}</div></body></html>`);
      printWindow.document.close();
      const tryPrint = () => { try { printWindow.focus(); printWindow.print(); try { printWindow.close(); } catch(e){} } catch(e) { notify('Printing failed.','error'); } };
      if (printWindow.document.readyState === 'complete') setTimeout(tryPrint, 120);
      else { printWindow.onload = () => setTimeout(tryPrint, 120); setTimeout(tryPrint, 800); }
    } catch (err) { notify('Failed to print receipt.','error'); }
  }

  useEffect(() => { if (studentId) fetchStudent(studentId); }, [studentId]);
  useEffect(() => { setSelectedCategories({}); }, [studentId]);

  const extractSelectedOptionalFees = (s) => {
    const values = [];
    if (!s) return values;
    if (Array.isArray(s.selectedOptionalFees)) values.push(...s.selectedOptionalFees);
    if (s.metadata && Array.isArray(s.metadata.selectedOptionalFees)) values.push(...s.metadata.selectedOptionalFees);
    return values.map(i => String(i || '').trim()).filter(Boolean);
  };

  // Helper to get a category amount dynamically from fetched structure or feeRows
  const getCategoryAmount = (category) => {
    const s = structure.find(i => String(i.category || '').trim() === String(category || '').trim());
    if (s && Number(s.amount || 0) > 0) return Number(s.amount || 0);
    const r = feeRows.find(i => String(i.category || '').trim() === String(category || '').trim());
    if (r && Number(r.amount || 0) > 0) return Number(r.amount || 0);
    return 0;
  };

  const cleanString = (v) => String(v || '').replace(/%{3,}/g, '').trim();
  const normalizeCategory = (v) => String(v || '').trim().toLowerCase();

  async function fetchStudent(id) {
    try {
      const res = await api.get(`/fees/student/${id}`);
      const data = res.data || res;
      const s = data.student || {};
      const normalizedName = s.name || s.fullName || s.fullname || ((s.firstName || s.lastName) ? `${s.firstName || ''}${s.firstName && s.lastName ? ' ' : ''}${s.lastName || ''}` : '');
      setStudent({ ...s, name: normalizedName || '-', summary: data.summary || {} });
      // fetch payment history (receipts) to compute paid amounts per category
      try {
        const historyRes = await api.get(`/fees/student/${id}/history`);
        const historyData = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data && Array.isArray(historyRes.data.data) ? historyRes.data.data : []);
        setReceipts(historyData);
      } catch (hErr) {
        console.warn('Failed to fetch payment history for student', id, hErr && hErr.message);
        setReceipts([]);
      }
      setSelectedCategories({});
      const classValue = s.classId || s.class || s.className;
      const classIdentifier = typeof classValue === 'string' ? classValue : classValue?._id || classValue?.toString?.();
      if (classIdentifier) await fetchStructure(classIdentifier);
    } catch (err) { console.error(err); }
  }

  async function fetchStructure(classId) {
    try {
      const res = await api.get('/fees/categories', { params: { classId } });
      const data = Array.isArray(res.data) ? res.data : [];
      setStructure(data.map(i => ({ category: i.name, amount: Number(i.amount || i.defaultAmount || 0), categoryType: i.categoryType || '', status: i.status || '' })));
    } catch (err) { console.error(err); }
  }

  const handleViewReceipt = () => {
    if (!receiptResult?.receipt) { notify('Receipt is not available.', 'error'); return; }
    const r = receiptResult.receipt;
    const receiptId = r.receiptId || r._id;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Primary: Navigate to receipt view (preserves auth context)
    if (receiptId) {
      navigate(`/fee-management/receipt/${encodeURIComponent(receiptId)}`);
      return;
    }
    
    // Fallback to direct PDF view
    if (r.pdfUrl) { 
      if (isMobile) {
        // Mobile: Download instead of open to preserve auth
        const a = document.createElement('a');
        a.href = r.pdfUrl;
        a.download = `${r.receiptNumber || 'receipt'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(r.pdfUrl, '_blank', 'noopener');
      }
      return;
    }
    
    if (r.pdfBase64) { 
      const byteChars = atob(r.pdfBase64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      if (isMobile) {
        // Mobile: Download instead of open to preserve auth
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${r.receiptNumber || 'receipt'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        window.open(URL.createObjectURL(blob), '_blank', 'noopener');
      }
      return;
    }
    
    notify('Receipt cannot be opened.', 'error');
  };

  // Build paid amounts map from receipts/history (sum of all previous payments per category)
  const paidMap = useMemo(() => {
    const map = {};
    (receipts || []).forEach((r) => {
      try {
        const breakdownSource = r.breakdown || (r.data && r.data.breakdown) || (r.data?.data && r.data.data.breakdown) || r.data || {};
        let entries = [];
        if (Array.isArray(breakdownSource)) entries = breakdownSource;
        else if (typeof breakdownSource === 'string') {
          try { entries = JSON.parse(breakdownSource); } catch (e) { entries = []; }
        } else if (breakdownSource && typeof breakdownSource === 'object') entries = Object.entries(breakdownSource);
        entries.forEach(([k, v]) => {
          if (!k) return;
          const key = normalizeCategory(k);
          const val = Number(v || 0);
          if (!map[key]) map[key] = 0;
          if (!Number.isNaN(val)) map[key] += val;
        });
      } catch (e) {
        // ignore malformed receipt entry
      }
    });
    return map;
  }, [receipts]);

  // === FEE ROWS: Built primarily from BACKEND SUMMARY (database is source of truth) ===
  const feeRows = useMemo(() => {
    const summaryBreakdown = student?.summary?.feeBreakdown;
    const hasSummaryData = Array.isArray(summaryBreakdown) && summaryBreakdown.length > 0;
    const persistedOptionals = new Set((extractSelectedOptionalFees(student) || []).map(normalizeCategory));
    // Also consider locally selected optionals (checkboxes) so UI updates immediately
    const localSelectedOptionals = new Set(Object.keys(selectedCategories || {}).filter(k => selectedCategories[k]).map(normalizeCategory));
    const selectedOptionals = new Set([...persistedOptionals, ...localSelectedOptionals]);

    // Build a Map from backend summary for quick lookup
    const summaryMap = new Map();
    if (Array.isArray(summaryBreakdown)) {
      summaryBreakdown.forEach(item => {
        if (!item) return;
        const cat = String(item.category || item.name || '').trim();
        if (cat) summaryMap.set(normalizeCategory(cat), item);
      });
    }

    // PRIMARY: If backend summary has data, use it as the authoritative source
    if (hasSummaryData) {
      const rows = [];
      summaryBreakdown
        .filter(item => item && String(item.category || '').trim())
        .forEach(item => {
          const cat = String(item.category || '').trim();
          const key = normalizeCategory(cat);
          const actualFee = Number(item.actualFee ?? item.amount ?? 0);
          const paidFromReceipts = Number(paidMap[key] || 0);
          // Ensure paid amount comes from receipts aggregation (source of truth)
          const paidFee = paidFromReceipts;
          const dueAmount = Math.max(0, Number(item.dueAmount ?? item.due ?? Math.max(0, actualFee - paidFee)));
          const isOptional = String(item.categoryType || item.status || '').trim().toLowerCase().includes('optional');
          // OPTIONAL: include only when explicitly selected (persisted) OR locally ticked
          if (isOptional && !selectedOptionals.has(normalizeCategory(cat))) return;
          const status = dueAmount <= 0 ? 'Paid' : (dueAmount > 0 && paidFee > 0 ? 'Partial' : 'Unpaid');
          const locked = dueAmount <= 0;
          console.log(`[FeePayment][debug] Category=${cat} OriginalAmount=${actualFee} PaidAmount=${paidFee} DueAmount=${dueAmount}`);
          rows.push({
            category: cat,
            amount: actualFee,
            paid: paidFee,
            due: dueAmount,
            status,
            locked,
            categoryType: item.categoryType || ''
          });
        });

      // Add any mandatory structure items missing from the summary
      const summaryCats = new Set(rows.map(r => normalizeCategory(r.category)));
      structure.forEach(item => {
        const key = normalizeCategory(item.category);
        if (summaryCats.has(key)) return;
        const isOptional = String(item.categoryType || item.status || '').trim().toLowerCase().includes('optional');
        // skip optional unless selected (persisted or locally)
        if (isOptional && !selectedOptionals.has(key)) return;
        const amt = Number(item.amount || 0);
        const paidFromReceipts = Number(paidMap[normalizeCategory(item.category)] || 0);
        const dueAmt = Math.max(0, amt - paidFromReceipts);
        rows.push({
          category: item.category,
          amount: amt,
          paid: paidFromReceipts,
          due: dueAmt,
          status: dueAmt <= 0 ? 'Paid' : (paidFromReceipts > 0 ? 'Partial' : 'Unpaid'),
          locked: dueAmt <= 0,
          categoryType: item.categoryType || ''
        });
        console.log(`[FeePayment][debug] Category=${item.category} OriginalAmount=${amt} PaidAmount=${paidFromReceipts} DueAmount=${dueAmt}`);
      });

      console.log('[FeePayment] feeRows from backend summary:', rows.map(r => `${r.category}: paid=${r.paid}, due=${r.due}, status=${r.status}`));
      return rows;
    }

    // FALLBACK: No backend summary — derive from structure (all unpaid, do not include optional)
    console.warn('[FeePayment] No backend summary available, falling back to structure-only (all unpaid)');
    return structure
      .filter(item => {
        const isOptional = String(item.categoryType || item.status || '').trim().toLowerCase().includes('optional');
        return !isOptional;
      })
      .map(item => ({
        category: item.category,
        amount: Number(item.amount || 0),
        paid: Number(paidMap[normalizeCategory(item.category)] || 0),
        due: Math.max(0, Number(item.amount || 0) - Number(paidMap[normalizeCategory(item.category)] || 0)),
        status: Math.max(0, Number(item.amount || 0) - Number(paidMap[normalizeCategory(item.category)] || 0)) <= 0 ? 'Paid' : 'Unpaid',
        locked: Math.max(0, Number(item.amount || 0) - Number(paidMap[normalizeCategory(item.category)] || 0)) <= 0,
        categoryType: item.categoryType || ''
      }));
  }, [structure, student, receipts, paidMap, selectedCategories]);
  

  // === OVERALL SUMMARY: Use backend totals when available, else derive from rows ===
  const summary = useMemo(() => {
    const backendTotalFee = Number(student?.summary?.totalFee || 0);
    const backendTotalPaid = Number(student?.summary?.totalPaid || 0);
    const backendTotalDue = Number(student?.summary?.totalDue || 0);

    // TotalFee should count only mandatory + selected optional (feeRows is built that way)
    const hasRowData = feeRows && feeRows.length > 0;
    const totalFee = hasRowData ? feeRows.reduce((s, r) => s + Number(r.amount || 0), 0) : backendTotalFee;

        // TotalPaid must be sum of all historical payments across receipts (all categories)
        const totalPaidFromReceipts = Object.values(paidMap || {}).reduce((s, v) => s + Number(v || 0), 0);
        const totalPaid = totalPaidFromReceipts || backendTotalPaid;

    // Total due is TotalFee - TotalPaid, floored at 0
    const totalDue = Math.max(0, totalFee - totalPaid);

    // Status: NEVER mark as Paid if totalFee is 0 or if any category still has due
    const anyCategoryHasDue = feeRows.some(r => Number(r.due || 0) > 0);
    const status = (totalFee <= 0 && totalPaid <= 0) ? 'Unpaid'
      : (totalDue === 0 && !anyCategoryHasDue && totalFee > 0) ? (totalPaid > 0 ? 'Paid' : 'Unpaid')
      : (totalPaid > 0 ? 'Partial' : 'Unpaid');

    const progress = totalFee > 0 ? Math.round(Math.min(100, (totalPaid / totalFee) * 100)) : 0;

    console.log('[FeePayment] Summary:', { totalFee, totalPaid, totalDue, status, progress, fromBackend: !!(backendTotalFee || backendTotalPaid) });
    return { totalFee, totalPaid, totalDue, status, progress };
  }, [feeRows, student, paidMap]);

  const isStudentFullyPaid = summary.status === 'Paid' && feeRows.length > 0 && summary.totalFee > 0 && !feeRows.some(r => r.due > 0);

  const isOptionalRow = (r) => {
    const t = String(r.categoryType || '').toLowerCase();
    return t === 'optional service' || t === 'optional' || t.includes('optional');
  };

  // Auto-select categories on load
  useEffect(() => {
    if (!student || feeRows.length === 0) return;
    if (Object.keys(selectedCategories).length > 0) return;
    const selectedOptionals = new Set((extractSelectedOptionalFees(student) || []).map(normalizeCategory));
    const init = {};
    feeRows.forEach(row => {
      if (row.locked) return;
      const isOpt = isOptionalRow(row);
      if (isOpt) { if (selectedOptionals.has(normalizeCategory(row.category))) init[row.category] = true; }
      else if (row.due > 0) init[row.category] = true;
    });
    if (Object.keys(init).length > 0) setSelectedCategories(init);
  }, [feeRows, selectedCategories, student]);

  // Prefill selection when navigated with query params (category & amount)
  useEffect(() => {
    try {
      const catParam = searchParams.get('category');
      const amtParam = searchParams.get('amount');
      if (!catParam || !feeRows || feeRows.length === 0) return;
      const targetKey = normalizeCategory(catParam);
      const match = feeRows.find(r => normalizeCategory(r.category) === targetKey);
      if (!match) return;
      // select the category and prefill amountPaid to the provided amount (or the due)
      setSelectedCategories(prev => ({ ...prev, [match.category]: true }));
      const amt = amtParam ? Number(amtParam) : Number(match.due || 0);
      if (!Number.isNaN(amt) && amt > 0) setForm(f => ({ ...f, amountPaid: amt }));
      // ensure scroll into view: try to focus on first matching category checkbox after a tick
      setTimeout(() => {
        const el = document.querySelector(`label input[type=checkbox][checked]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    } catch (e) {
      // ignore
    }
  }, [feeRows]);

  // Remove locked categories from selection
  useEffect(() => {
    if (feeRows.length === 0) return;
    setSelectedCategories(prev => {
      const next = { ...prev }; let changed = false;
      feeRows.forEach(row => { if (row.locked && next[row.category]) { delete next[row.category]; changed = true; } });
      return changed ? next : prev;
    });
  }, [feeRows]);

  const selectedRows = useMemo(() => feeRows.filter(r => selectedCategories[r.category] && r.due > 0 && !r.locked), [feeRows, selectedCategories]);
  const selectedDueTotal = useMemo(() => selectedRows.reduce((s, r) => s + r.due, 0), [selectedRows]);

  const mandatoryRows = useMemo(() => feeRows.filter(r => !isOptionalRow(r)), [feeRows]);
  const optionalRows = useMemo(() => feeRows.filter(r => isOptionalRow(r)), [feeRows]);

  // Available optional categories for this class (from structure) merged with optionalRows (which include payment/locked info)
  const availableOptionalServices = useMemo(() => {
    const map = new Map();
    (structure || []).forEach(s => {
      const isOpt = String(s.categoryType || s.status || '').trim().toLowerCase().includes('optional');
      if (!isOpt) return;
      map.set(String(s.category || '').trim(), { category: String(s.category || '').trim(), amount: Number(s.amount || 0), locked: false });
    });
    (optionalRows || []).forEach(r => {
      if (!r || !r.category) return;
      const key = String(r.category).trim();
      const prev = map.get(key) || { category: key, amount: Number(r.amount || 0), locked: false };
      map.set(key, { ...prev, amount: Number(prev.amount || r.amount || 0), locked: Boolean(r.locked) });
    });
    return Array.from(map.values());
  }, [structure, optionalRows]);

  const discount = Number(form.discount || 0);
  const amountPaid = form.amountPaid !== '' ? Number(form.amountPaid || 0) : 0;
  const totalDueAfterDiscount = Math.max(0, selectedDueTotal - discount);
  const dueAmount = Math.max(0, totalDueAfterDiscount - amountPaid);

  function updateForm(key, value) { setForm(c => ({ ...c, [key]: value })); }

  const saveSelectedOptionalFees = async (category, enabled) => {
    if (!student) return;
    const sel = new Set(extractSelectedOptionalFees(student));
    if (enabled) sel.add(category); else sel.delete(category);
    const metadata = { ...(student.metadata || {}), selectedOptionalFees: Array.from(sel) };
    try {
      setSavingOptionals(true);
      await api.put(`/students/${studentId}`, { metadata });
      // Persist selection locally and update student's summary immediately so totals update in UI
      setStudent(prev => {
        const next = { ...prev, metadata };
        const amt = Number(getCategoryAmount(category) || 0);
        const hasBreakdown = Array.isArray(next.summary?.feeBreakdown);
        const breakdown = hasBreakdown ? [...next.summary.feeBreakdown] : (next.summary?.feeBreakdown ? [ ...next.summary.feeBreakdown ] : []);

        const idx = breakdown.findIndex(b => String(b.category || '').trim() === String(category).trim());
        if (enabled) {
          // add if not present
          if (idx === -1) {
            breakdown.push({ category, actualFee: amt, paidFee: 0, dueAmount: amt, categoryType: 'Optional Service' });
            // update totals
            const totalFee = Number(next.summary?.totalFee || 0) + amt;
            const totalDue = Number(next.summary?.totalDue || 0) + amt;
            next.summary = { ...(next.summary || {}), feeBreakdown: breakdown, totalFee, totalDue };
          }
        } else {
          // remove if present
          if (idx !== -1) {
            const existing = breakdown[idx];
            const paidAgainst = Number(existing.paidFee ?? existing.paid ?? 0);
            if (paidAgainst > 0) {
              // cannot remove a service that has payments
              throw new Error('Cannot remove optional service because payments exist against it');
            }
            const removed = breakdown.splice(idx, 1)[0];
            const amtRemoved = Number((removed.actualFee ?? removed.amount ?? getCategoryAmount(category)) || 0);
            const totalFee = Math.max(0, Number(next.summary?.totalFee || 0) - amtRemoved);
            const totalDue = Math.max(0, Number(next.summary?.totalDue || 0) - amtRemoved);
            next.summary = { ...(next.summary || {}), feeBreakdown: breakdown, totalFee, totalDue };
          }
        }
        return next;
      });
    } catch (err) {
      setSelectedCategories(prev => ({ ...prev, [category]: !enabled }));
      alert('Unable to save optional service selection.');
    } finally { setSavingOptionals(false); }
  };

  const handleToggleCategory = (category, enabled) => {
    const row = feeRows.find(r => r.category === category);
    if (enabled && row && row.locked) { alert(`${category} is fully paid and locked.`); return; }
    setSelectedCategories(prev => ({ ...prev, [category]: enabled }));
    const catRow = feeRows.find(r => r.category === category);
    if (String(catRow?.categoryType || '').toLowerCase() === 'optional service') saveSelectedOptionalFees(category, enabled);
  };

  const handleToggleOptionalService = (category, enabled) => {
    // Toggle local selection and persist as optional selection for the student
    setSelectedCategories(prev => ({ ...prev, [category]: enabled }));
    saveSelectedOptionalFees(category, enabled);
  };

  // === PAYMENT VALIDATION: Prevent overpayment per category ===
  const validatePayment = () => {
    if (!student) return 'No student selected.';
    if (isStudentFullyPaid) return 'All fees are fully paid. No further payment needed.';
    if (selectedRows.length === 0) return 'Select at least one fee category.';
    if (!amountPaid || amountPaid <= 0) return 'Enter a valid payment amount.';
    if (amountPaid > totalDueAfterDiscount) return `Maximum payable amount is Rs ${totalDueAfterDiscount.toLocaleString()}. You cannot pay more than the total due for selected categories.`;

    // Per-category overpayment check
    let remaining = amountPaid;
    for (const row of selectedRows) {
      if (remaining <= 0) break;
      const pay = Math.min(row.due, remaining);
      if (pay > row.due) return `Cannot pay more than Rs ${row.due.toLocaleString()} for ${row.category}.`;
      remaining -= pay;
    }
    if (remaining > 0) return 'Payment exceeds total due for selected categories.';
    return null;
  };

  async function handleCollect() {
    const error = validatePayment();
    if (error) { alert(error); return; }

    const breakdownPayload = {};
    let remaining = amountPaid;
    for (const row of selectedRows) {
      if (remaining <= 0) break;
      const pay = Math.min(row.due, remaining);
      if (pay > 0) { breakdownPayload[row.category] = pay; remaining -= pay; }
    }
    if (Object.keys(breakdownPayload).length === 0) { alert('Payment amount too low.'); return; }

    setLoading(true);
    try {
      const classValue = student.classId || student.class || student.className;
      const classIdPayload = typeof classValue === 'string' ? classValue : classValue?._id || classValue?.toString?.();
      const payload = { studentId, classId: classIdPayload, breakdown: breakdownPayload, amountPaid, discount, paymentMethod: form.paymentMethod, remarks: form.remarks, feeMonth: form.feeMonth };
      const res = await api.post('/fees/collect', payload);
      const result = res.data || res;
      setReceiptResult({
        receipt: result.receipt, payment: result.payment, student,
        breakdown: Object.entries(breakdownPayload).map(([category, amount]) => ({ category, amount: Number(amount || 0) })),
        totalFee: summary.totalFee,
        totalPaidTillDate: Number(result.receipt?.data?.totalPaidTillDate || result.payment?.totalPaidTillDate || summary.totalPaid + amountPaid),
        discount, amountPaid, dueAmount: Math.max(0, summary.totalDue - amountPaid + discount), paymentMethod: form.paymentMethod
      });
      notify('Payment completed successfully.', 'success');
      // Remove any persisted optional selections that were fully paid by this transaction
      try {
        const persisted = new Set(extractSelectedOptionalFees(student));
        const toRemove = [];
        for (const [cat, amt] of Object.entries(breakdownPayload)) {
          const row = feeRows.find(r => String(r.category || '').trim() === String(cat || '').trim());
          if (!row) continue;
          // if we paid at least the remaining due for this category, it's now fully paid
          if (Number(amt || 0) >= Number(row.due || 0) && isOptionalRow(row) && persisted.has(String(cat).trim())) toRemove.push(cat);
        }
        if (toRemove.length > 0) {
          toRemove.forEach(c => persisted.delete(c));
          const metadata = { ...(student.metadata || {}), selectedOptionalFees: Array.from(persisted) };
          await api.put(`/students/${studentId}`, { metadata });
          setStudent(prev => ({ ...(prev || {}), metadata }));
        }
      } catch (metaErr) {
        console.warn('Failed to sanitize selected optional fees after payment', metaErr);
      }
      await fetchStudent(studentId);
      setSelectedCategories({});
    } catch (err) {
      console.error(err);
      notify(err?.response?.data?.message || 'Unable to collect payment.', 'error');
    } finally { setLoading(false); }
  }

  const studentClassName = student?.className || student?.class?.name || student?.class || student?.classId || '';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Payment Collection</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Manage Student Fee</h1>
        </div>
        {/* Back to Roster removed per UX request; navigation available in sidebar */}
      </div>

      {notification && (
        <div className={`rounded-2xl border px-5 py-4 text-sm ${notification.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>{notification.message}</div>
            {notification.type === 'success' && receiptResult?.receipt && (
              <div className="flex flex-wrap gap-2">
                <button onClick={handleViewReceipt} className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-semibold hover:bg-emerald-700 transition">View Receipt</button>
                <button onClick={() => { setNotification(null); if (studentId) fetchStudent(studentId); }} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition">OK</button>
              </div>
            )}
          </div>
        </div>
      )}

      {!student ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">Loading student details...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Student Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Student Details</h2>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div><span className="text-slate-500">Name</span><p className="font-semibold text-slate-900">{student.name}</p></div>
                <div><span className="text-slate-500">Admission No.</span><p className="font-semibold text-slate-900">{student.admissionNumber || '—'}</p></div>
                <div><span className="text-slate-500">Class</span><p className="font-semibold text-slate-900">{studentClassName || '—'}</p></div>
              </div>
            </div>

            {/* FEE SUMMARY CARD */}
            {feeRows.length > 0 && (
              <div className={`rounded-2xl border-2 p-6 shadow-sm ${summary.status === 'Paid' ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white' : summary.status === 'Partial' ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white' : 'border-rose-200 bg-gradient-to-br from-rose-50 to-white'}`}>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Fee Summary</h2>
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  <div className="rounded-xl bg-white/80 border border-slate-200 p-4 text-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">Total Fee</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(summary.totalFee)}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-emerald-200 p-4 text-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-emerald-600">Total Paid</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(summary.totalPaid)}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-rose-200 p-4 text-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-rose-600">Total Due</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(summary.totalDue)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">Payment Status:</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${STATUS_CONFIG[summary.status]?.badge || STATUS_CONFIG.Unpaid.badge}`}>
                    {STATUS_CONFIG[summary.status]?.icon} {summary.status}
                  </span>
                </div>
                <ProgressBar percent={summary.progress} />
                {/* Optional services UI removed per requirement */}
              </div>
            )}

            {/* FULLY PAID BANNER */}
            {isStudentFullyPaid && (
              <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white text-3xl shadow-lg shadow-emerald-200">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-emerald-800">All Fees Fully Paid</h2>
                <p className="mt-2 text-sm text-emerald-700">All fee categories are settled and locked. No further collection needed.</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Payment Record Locked
                </div>
              </div>
            )}

            {/* FEE CATEGORIES */}
            {!isStudentFullyPaid && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Fee Categories</h2>
                    <p className="text-xs text-slate-500 mt-1">Select categories to collect. Fully paid categories are locked automatically.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selectedRows.length} selected</span>
                </div>

                {/* Mandatory */}
                {mandatoryRows.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Mandatory Fees</h3>
                    <div className="space-y-2">
                      {mandatoryRows.map(item => (
                        <CategoryCard key={item.category} item={item} selected={Boolean(selectedCategories[item.category])} onToggle={handleToggleCategory} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional rows hidden in this UI per requirement */}

                {feeRows.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No fee categories defined for this class.</div>
                )}

                {/* Per-category max payment info */}
                {selectedRows.length > 0 && (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">Maximum Payment Allowed</p>
                    <div className="space-y-1">
                      {selectedRows.map(r => (
                        <div key={r.category} className="flex justify-between text-xs text-indigo-600">
                          <span>{r.category}</span>
                          <span className="font-bold">Max: {formatMoney(r.due)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-indigo-200 flex justify-between text-sm font-bold text-indigo-800">
                      <span>Total Maximum</span>
                      <span>{formatMoney(selectedDueTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Payment Form */}
          <div className="space-y-6" style={isStudentFullyPaid ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
            {!isStudentFullyPaid && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Payment Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount to Pay *</label>
                    <input type="text" inputMode="numeric" value={form.amountPaid} onChange={e => updateForm('amountPaid', e.target.value)}
                      placeholder={`Max: Rs ${selectedDueTotal.toLocaleString()}`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                    {amountPaid > selectedDueTotal && selectedDueTotal > 0 && (
                      <p className="mt-1 text-xs font-semibold text-rose-600">Amount exceeds maximum allowed ({formatMoney(selectedDueTotal)})</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Discount</label>
                    <input type="text" inputMode="numeric" value={form.discount} onChange={e => updateForm('discount', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Method</label>
                    <select value={form.paymentMethod} onChange={e => updateForm('paymentMethod', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100">
                      <option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fee Month</label>
                    <input type="text" value={form.feeMonth} onChange={e => updateForm('feeMonth', e.target.value)} placeholder="e.g. April 2026"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Remarks</label>
                    <textarea value={form.remarks} onChange={e => updateForm('remarks', e.target.value)} rows="2"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Payment Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600"><span>Selected Categories</span><span className="font-semibold text-slate-900">{selectedRows.length}</span></div>
                <div className="flex justify-between text-slate-600"><span>Selected Due Total</span><span className="font-semibold text-slate-900">{formatMoney(selectedDueTotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-semibold">- {formatMoney(discount)}</span></div>}
                <div className="flex justify-between text-slate-600"><span>Amount Paying</span><span className="font-bold text-indigo-700">{formatMoney(amountPaid)}</span></div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Remaining After Payment</span>
                  <span className={dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatMoney(dueAmount)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button onClick={handleCollect} disabled={loading || !student || isStudentFullyPaid || selectedRows.length === 0}
                className={`rounded-xl px-6 py-3.5 text-sm font-bold transition shadow-md ${
                  isStudentFullyPaid || selectedRows.length === 0 || loading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                }`}>
                {isStudentFullyPaid ? 'All Fees Paid & Locked' : selectedRows.length === 0 ? 'Select Fee Categories' : loading ? 'Processing...' : `Collect ${formatMoney(amountPaid)}`}
              </button>
              <button onClick={() => navigate('/fee-management/collect')} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                Back to Student Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT */}
      {receiptResult && (
        <div ref={receiptRef} id="receipt-container" className="receipt-root rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center mb-6">
            {SCHOOL_INFO.logo && <img src={SCHOOL_INFO.logo} alt="Logo" className="mx-auto h-20 w-20 rounded-full border border-slate-200 object-cover" />}
            <div className="mt-3 text-2xl font-bold text-red-700">{SCHOOL_INFO.name}</div>
            <div className="text-sm font-semibold text-red-700">{SCHOOL_INFO.address}</div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="space-y-1 text-sm">
              <div><span className="font-semibold text-slate-700">Name:</span> {cleanString(receiptResult.student?.name || 'N/A')}</div>
              <div><span className="font-semibold text-slate-700">Roll No:</span> {cleanString(receiptResult.student?.rollNumber || receiptResult.student?.admissionNumber || 'N/A')}</div>
              <div><span className="font-semibold text-slate-700">Class:</span> {cleanString(receiptResult.receipt?.data?.student?.className || receiptResult.student?.className || 'N/A')}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-right text-sm">
              <div className="text-xs text-slate-500">Receipt No.</div>
              <div className="font-bold text-slate-900">{receiptResult.receipt?.receiptNumber || 'N/A'}</div>
              <div className="mt-1 text-xs text-slate-500">Date</div>
              <div className="text-slate-700">{receiptResult.receipt?.data?.date ? new Date(receiptResult.receipt.data.date).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm text-slate-700 border-collapse">
              <thead><tr className="border-y border-slate-200 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                <th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Particular</th><th className="px-4 py-2.5 text-right">Amount</th>
              </tr></thead>
              <tbody>
                {(receiptResult.breakdown || []).map((item, i) => (
                  <tr key={i}><td className="px-4 py-2.5">{new Date().toLocaleDateString()}</td><td className="px-4 py-2.5">{cleanString(item.category)}</td><td className="px-4 py-2.5 text-right font-semibold">{Number(item.amount || 0).toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mb-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-right mr-2">
              <div className="text-xs text-slate-500">Total Fee</div>
              <div className="text-lg font-bold text-slate-900">{formatMoney(receiptResult.totalFee)}</div>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-right mr-2">
              <div className="text-xs text-indigo-600">Paid Today</div>
              <div className="text-lg font-bold text-indigo-700">{formatMoney(receiptResult.amountPaid)}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-right mr-2">
              <div className="text-xs text-emerald-600">Total Paid Till Date</div>
              <div className="text-lg font-bold text-emerald-700">{formatMoney(receiptResult.totalPaidTillDate)}</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-right">
              <div className="text-xs text-rose-600">Due Amount</div>
              <div className="text-lg font-bold text-rose-700">{formatMoney(receiptResult.dueAmount)}</div>
            </div>
          </div>
          {/* Printing handled from Receipt History page — hide print button here */}
        </div>
      )}
    </div>
  );
}
