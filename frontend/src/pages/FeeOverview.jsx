import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const STATUS_CONFIG = {
  Paid: { badge: 'bg-emerald-100 text-emerald-700' },
  Partial: { badge: 'bg-amber-100 text-amber-700' },
  Unpaid: { badge: 'bg-rose-100 text-rose-700' }
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();
const isOptionalFee = (item) => {
  const raw = `${item?.categoryType || ''} ${item?.type || ''} ${item?.status || ''}`;
  return raw.toLowerCase().includes('optional');
};

const getReceiptAmount = (receipt) => Number(receipt?.amountPaid ?? receipt?.amount ?? receipt?.paid ?? receipt?.totalPaid ?? 0);
const getReceiptDate = (receipt) => receipt?.date || receipt?.createdAt || receipt?.paymentDate || receipt?.timestamp;
const getReceiptTotalFee = (receipt) => Number(receipt?.totalFee ?? receipt?.totalFeeAll ?? receipt?.data?.totalFeeAll ?? receipt?.data?.totalAmount ?? receipt?.payment?.totalFee ?? 0);
const getReceiptDue = (receipt) => Number(receipt?.dueAmount ?? receipt?.data?.dueAmount ?? receipt?.payment?.dueAmount ?? 0);

function ProgressBar({ percent }) {
  const p = Math.max(0, Math.min(100, percent));
  const color = p >= 100 ? 'from-emerald-400 to-emerald-600' : p > 0 ? 'from-amber-400 to-amber-600' : 'from-rose-400 to-rose-600';

  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Collection Progress</span>
        <span className={`text-sm font-bold ${p >= 100 ? 'text-emerald-600' : p > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
          {p}% Paid
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function FeeCategoryCard({ item }) {
  const locked = Number(item.paid || 0) >= Number(item.amount || 0);
  const status = locked ? 'Paid' : Number(item.paid || 0) > 0 ? 'Partial' : 'Unpaid';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Unpaid;

  return (
    <div className={`rounded-2xl border-2 p-4 ${locked ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={!locked}
            readOnly
            disabled
            className="mt-1 h-5 w-5 cursor-not-allowed rounded border-slate-300 text-indigo-600 opacity-70"
          />
          {locked ? (
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-semibold ${locked ? 'text-emerald-700' : 'text-slate-900'}`}>{item.category}</span>
              {item.optional ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-violet-700">Optional</span>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`text-sm font-bold ${locked ? 'text-emerald-600' : 'text-slate-700'}`}>
                Paid {formatMoney(item.paid)} / {formatMoney(item.amount)}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${cfg.badge}`}>
                {status}
              </span>
            </div>
            {locked ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">Locked</p>
            ) : (
              <p className="mt-1 text-xs font-medium text-amber-600">Remaining {formatMoney(item.due)}</p>
            )}
          </div>
        </div>
        <div className={`flex-shrink-0 text-right ${locked ? 'text-emerald-600' : 'text-slate-900'}`}>
          <div className="text-lg font-bold">{formatMoney(item.amount)}</div>
        </div>
      </div>
    </div>
  );
}

export default function FeeOverview() {
  const [searchParams] = useSearchParams();
  const [studentId, setStudentId] = useState(searchParams.get('student') || searchParams.get('studentId') || '');
  const [profile, setProfile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [lookupName, setLookupName] = useState('');
  const [lookupClass, setLookupClass] = useState('');
  const [lookupRoll, setLookupRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('verifiedStudent');
      if (saved && !studentId) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          setVerifiedStudent(parsed);
          setStudentId(parsed.id);
        }
      }
    } catch (err) {
      console.warn('Unable to load verified student', err);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setSearchError('');
      try {
        let data;
        try {
          const response = await api.get(`/fees/student/${encodeURIComponent(studentId)}`);
          data = response.data;
        } catch (profileError) {
          const response = await api.get(`/fees/student/${encodeURIComponent(studentId)}/summary`);
          data = response.data;
        }

        const payload = data?.data || data || {};
        const student = payload.student || payload.summary?.student || {};
        const summaryRaw = payload.summary || payload.fees || payload || {};
        const summary = {
          ...summaryRaw,
          totalFee: summaryRaw.totalFee ?? summaryRaw.totalBilled ?? summaryRaw.totalAmount ?? 0,
          totalPaid: summaryRaw.totalPaid ?? summaryRaw.paid ?? 0,
          totalDue: summaryRaw.totalDue ?? summaryRaw.due
        };

        if ((!summary.feeBreakdown || summary.feeBreakdown.length === 0) && Array.isArray(summaryRaw.feeBreakdownItems)) {
          summary.feeBreakdown = summaryRaw.feeBreakdownItems.map((item) => ({
            category: item.category || item.name,
            actualFee: item.actualFee ?? item.amount ?? item.total ?? 0,
            paidFee: item.paidFee ?? item.paid ?? 0,
            dueAmount: item.dueAmount ?? item.due,
            status: item.status,
            categoryType: item.categoryType || item.type
          }));
        }

        if ((!summary.feeBreakdown || summary.feeBreakdown.length === 0) && Array.isArray(summaryRaw.invoices)) {
          summary.feeBreakdown = summaryRaw.invoices.map((invoice) => ({
            category: invoice.month || `Invoice ${invoice.invoiceId || ''}`.trim(),
            actualFee: invoice.netAmount || invoice.totalAmount || 0,
            paidFee: invoice.paidAmount || 0,
            categoryType: 'Mandatory Fee'
          }));
        }

        if (!cancelled) {
          const normalizedStudent = {
            ...student,
            id: student._id || student.id || studentId,
            name: student.name || student.fullName || student.fullname || '-'
          };
          setProfile({ student: normalizedStudent, summary });

          const verified = {
            id: normalizedStudent.id,
            name: normalizedStudent.name,
            className: normalizedStudent.className || normalizedStudent.class?.name || '',
            admissionNumber: normalizedStudent.admissionNumber || normalizedStudent.rollNumber || ''
          };
          setVerifiedStudent(verified);
          try {
            localStorage.setItem('verifiedStudent', JSON.stringify(verified));
          } catch (err) {
            console.warn('Unable to store verified student', err);
          }
        }

        if (!cancelled && Array.isArray(payload.receipts) && payload.receipts.length) {
          setReceipts(payload.receipts);
        } else if (!cancelled && Array.isArray(payload.payments) && payload.payments.length) {
          setReceipts(payload.payments);
        }

        try {
          const history = await api.get(`/fees/student/${encodeURIComponent(studentId)}/history`);
          const historyData = history.data;
          const list = Array.isArray(historyData) ? historyData : Array.isArray(historyData?.data) ? historyData.data : [];
          if (!cancelled) {
            setReceipts(list);
            try {
              localStorage.setItem(`feeReceipts_${studentId}`, JSON.stringify(list));
            } catch (err) {
              console.warn('Unable to cache receipts', err);
            }
          }
        } catch (historyError) {
          if (!cancelled) setReceipts([]);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setSearchError(err?.response?.data?.message || 'Unable to load fee data for this student.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const handleLookup = async (event) => {
    event?.preventDefault();
    setSearchError('');
    const className = lookupClass.trim();
    const rollNumber = lookupRoll.trim();
    const name = lookupName.trim();

    if (!className || !rollNumber) {
      setSearchError('Please enter class and roll/admission number to verify.');
      return;
    }

    setSearching(true);
    try {
      let candidateId = '';
      try {
        const lookup = await api.post('/fees/lookup', { name, className, rollNumber });
        const payload = lookup.data || {};
        candidateId = payload.student?.id || payload.student?._id || payload.matches?.[0]?.id || payload.matches?.[0]?._id || '';
      } catch (lookupError) {
        candidateId = '';
      }

      if (!candidateId) {
        const response = await api.get('/students', {
          params: { className, admissionNumber: rollNumber, q: name || undefined, limit: 1 }
        });
        const students = response.data?.students || response.data || [];
        candidateId = students[0]?._id || students[0]?.id || '';
      }

      if (!candidateId) {
        setSearchError('No matching student found.');
        return;
      }

      setStudentId(candidateId);
    } catch (err) {
      setSearchError(err?.response?.data?.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const { feeRows, optionalRows, mandatoryRows, summary } = useMemo(() => {
    const breakdown = Array.isArray(profile?.summary?.feeBreakdown) ? profile.summary.feeBreakdown : [];
    const paidByCategory = new Map();

    receipts.forEach((receipt) => {
      // Try multiple common paths where a receipt may list category breakdowns
      const possibleSources = [
        receipt.breakdown,
        receipt.data?.breakdown,
        receipt.data?.feeBreakdown,
        receipt.paymentBreakdown,
        receipt.data?.items,
        receipt.items,
        receipt.data?.paymentBreakdown,
        receipt.data?.payment?.breakdown,
        receipt.data?.data?.breakdown,
        receipt.data?.receiptBreakdown
      ];

      let sourceFound = null;
      for (const s of possibleSources) {
        if (Array.isArray(s) && s.length) {
          sourceFound = s;
          break;
        }
        if (s && typeof s === 'object' && !Array.isArray(s) && Object.keys(s).length) {
          sourceFound = s;
          break;
        }
      }

      const addEntry = (category, amount) => {
        const key = normalizeText(category || '');
        if (!key) return;
        paidByCategory.set(key, (paidByCategory.get(key) || 0) + Number(amount || 0));
      };

      if (Array.isArray(sourceFound)) {
        sourceFound.forEach((item) => {
          const category = item?.category || item?.name || item?.label || item?.title;
          const amount = Number(item?.amount ?? item?.paid ?? item?.value ?? item?.paidAmount ?? 0);
          addEntry(category, amount);
        });
      } else if (sourceFound && typeof sourceFound === 'object') {
        Object.entries(sourceFound).forEach(([category, amount]) => {
          addEntry(category, amount);
        });
      } else {
        // Fallback: some receipts store paid amount without breakdown; attribute full amount to a generic key if category present
        const singleAmount = getReceiptAmount(receipt);
        const singleCat = receipt.category || receipt.categoryName || receipt.paymentFor || receipt.purpose || receipt.description;
        if (singleCat) addEntry(singleCat, singleAmount);
      }
    });

    // Determine which optional services are actually assigned to this student
    const metaSelected = Array.isArray(profile?.student?.selectedOptionalFees)
      ? profile.student.selectedOptionalFees
      : (Array.isArray(profile?.student?.metadata?.selectedOptionalFees) ? profile.student.metadata.selectedOptionalFees : []);
    const assignedSet = new Set((metaSelected || []).map(s => normalizeText(typeof s === 'string' ? s : (s?.name || s?.category || ''))).filter(Boolean));

    // Filter out optional items that are NOT assigned to the student so totals and rows reflect only assigned fees
    const filteredBreakdown = (Array.isArray(breakdown) ? breakdown : []).filter((item) => {
      if (!item || !(item.category || item.name || item.label)) return false;
      const isOpt = isOptionalFee(item);
      if (!isOpt) return true; // always include mandatory
      const cat = normalizeText(item.category || item.name || item.label || '');
      return assignedSet.size > 0 ? assignedSet.has(cat) : false; // include optional only when assigned
    });

    // Helper: find paid amount for a category using exact or inclusive matching of normalized keys
    const findPaidForCategory = (categoryName) => {
      const cat = normalizeText(categoryName);
      if (!cat) return undefined;
      if (paidByCategory.has(cat)) return paidByCategory.get(cat);
      for (const [key, value] of paidByCategory.entries()) {
        if (!key) continue;
        if (key.includes(cat) || cat.includes(key)) return value;
      }
      return undefined;
    };

    let rows = filteredBreakdown
      .map((item) => {
        const category = item.category || item.name || item.label;
        const amount = Number(item.actualFee ?? item.total ?? item.amount ?? item.defaultAmount ?? 0);
        const paidFromHistory = findPaidForCategory(category);
        const paid = Number(paidFromHistory ?? item.paidFee ?? item.paid ?? 0);
        const due = Math.max(0, Number(item.dueAmount ?? item.due ?? amount - paid));
        return {
          category,
          amount,
          paid,
          due,
          optional: isOptionalFee(item),
          categoryType: item.categoryType || item.type || ''
        };
      });

    // Ensure assigned optional fees appear even when not present in the server-provided breakdown.
    // Use amounts from `metaSelected` entries when available.
    try {
      const existing = new Set(rows.map(r => normalizeText(r.category)));
      (metaSelected || []).forEach((s) => {
        const name = normalizeText(typeof s === 'string' ? s : (s?.name || s?.category || s?.label || ''));
        if (!name) return;
        if (existing.has(name)) return;
        const displayName = typeof s === 'string' ? s : (s?.name || s?.category || s?.label || '');
        // Prefer explicit amount from metaSelected; otherwise infer from receipts if possible
        let amount = Number(s?.amount ?? s?.fee ?? s?.value ?? s?.defaultAmount ?? 0);
        const paidFromHistory = findPaidForCategory(displayName);
        if ((!amount || amount <= 0) && paidFromHistory) {
          amount = Number(paidFromHistory);
        }
        const paid = Number(paidFromHistory ?? 0);
        const due = Math.max(0, amount - paid);
        rows.push({ category: displayName, amount, paid, due, optional: true, categoryType: 'Optional Fee' });
        existing.add(name);
      });
    } catch (err) {
      // defensive: if metaSelected is unexpected, skip adding
    }

    const rowsTotal = rows.reduce((sum, row) => sum + row.amount, 0);
    const recordTotalFee = receipts.reduce((max, receipt) => Math.max(max, getReceiptTotalFee(receipt)), 0);
    const summaryTotalFee = Number(profile?.summary?.totalFee || profile?.summary?.totalAmount || 0);
    // Prefer computed rowsTotal (which excludes unassigned optional fees).
    // If we have breakdown rows, trust them as the source-of-truth and do NOT inflate totalFee using summary/receipt totals —
    // this avoids adding a "Remaining Fee" when the higher summary total comes from unassigned optionals.
    const totalFee = rowsTotal > 0 ? rowsTotal : Math.max(summaryTotalFee, recordTotalFee);
    const historyPaid = receipts.reduce((sum, receipt) => sum + getReceiptAmount(receipt), 0);
    const rowPaid = rows.reduce((sum, row) => sum + row.paid, 0);
    const totalPaid = historyPaid || rowPaid || Number(profile?.summary?.totalPaid || profile?.summary?.paid || 0);
    // Compute totalDue strictly as totalFee - totalPaid (bounded to >= 0) to avoid inflated due values
    // caused by mismatched summary or historical records. The breakdown rows are treated as source-of-truth.
    const totalDue = Math.max(0, totalFee - totalPaid);

    // total due aggregated from rows (used for missing calculations)
    const rowDue = rows.reduce((sum, row) => sum + (row.due || 0), 0);

    if (totalFee > rowsTotal) {
      const missingAmount = totalFee - rowsTotal;
      const missingDue = Math.max(0, totalDue - rowDue);
      const missingPaid = Math.max(0, missingAmount - missingDue);
      rows = [
        ...rows,
        {
          category: rows.length ? 'Remaining Fee' : 'Fee Balance',
          amount: missingAmount,
          paid: missingPaid,
          due: missingDue,
          optional: false,
          categoryType: 'Mandatory Fee'
        }
      ];
    }

    const status = totalFee <= 0 && totalPaid <= 0 ? 'Unpaid' : totalDue <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
    const progress = totalFee > 0 ? Math.round(Math.min(100, (totalPaid / totalFee) * 100)) : 0;

    // UI decision: hide optional categories from the Fee Categories UI while keeping them in `feeRows` for calculations.
    const optionalRowsComputed = []; // intentionally empty — optional services not displayed in this interface
    const mandatoryRowsComputed = rows.filter((row) => !row.optional);

    return {
      feeRows: rows,
      optionalRows: optionalRowsComputed,
      mandatoryRows: mandatoryRowsComputed,
      summary: { totalFee, totalPaid, totalDue, status, progress }
    };
  }, [profile, receipts]);

  const clearVerified = () => {
    try {
      localStorage.removeItem('verifiedStudent');
    } catch (err) {
      console.warn('Unable to clear verified student', err);
    }
    setVerifiedStudent(null);
    setStudentId('');
    setProfile(null);
    setReceipts([]);
    setLookupName('');
    setLookupClass('');
    setLookupRoll('');
    setSearchError('');
  };

  if (!studentId || (!profile && !loading)) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Fee Overview</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Verify Student</h1>
          <p className="mt-2 text-sm text-slate-500">Enter the student details to view fee status and receipts in read-only mode.</p>

          <form onSubmit={handleLookup} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">Name</label>
              <input value={lookupName} onChange={(event) => setLookupName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Student name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Class</label>
                <input value={lookupClass} onChange={(event) => setLookupClass(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Class 10 or 10" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Roll / Admission No.</label>
                <input value={lookupRoll} onChange={(event) => setLookupRoll(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Admission number" />
              </div>
            </div>
            {searchError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{searchError}</div> : null}
            <button type="submit" disabled={searching} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {searching ? 'Verifying...' : 'Verify and View Fees'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-slate-600">Loading fee overview...</div>;
  }

  const student = profile?.student || {};
  const studentClassName = student.className || student.class?.name || student.class || verifiedStudent?.className || '-';
  const studentAdmissionNumber = student.admissionNumber || student.rollNumber || verifiedStudent?.admissionNumber || '-';
  const selectedDueRows = feeRows.filter((row) => row.due > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Payment Collection</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Manage Student Fee</h1>
          <p className="mt-2 text-sm text-slate-500">Read-only view synced from the school fee collection records.</p>
        </div>
        <button onClick={clearVerified} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Change Student
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Student Details</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div><span className="text-slate-500">Name</span><p className="font-semibold text-slate-900">{student.name || '-'}</p></div>
              <div><span className="text-slate-500">Admission No.</span><p className="font-semibold text-slate-900">{studentAdmissionNumber}</p></div>
              <div><span className="text-slate-500">Class</span><p className="font-semibold text-slate-900">{studentClassName}</p></div>
            </div>
          </section>

          <section className={`rounded-2xl border-2 p-6 shadow-sm ${summary.status === 'Paid' ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white' : summary.status === 'Partial' ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white' : 'border-rose-200 bg-gradient-to-br from-rose-50 to-white'}`}>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Fee Summary</h2>
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">Total Fee</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(summary.totalFee)}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white/80 p-4 text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-emerald-600">Total Paid</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(summary.totalPaid)}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-white/80 p-4 text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-rose-600">Total Due</p>
                <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(summary.totalDue)}</p>
              </div>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Payment Status:</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${(STATUS_CONFIG[summary.status] || STATUS_CONFIG.Unpaid).badge}`}>
                {summary.status}
              </span>
            </div>
            <ProgressBar percent={summary.progress} />

            {/* Optional Services UI removed per requirement — display only mandatory fees. */}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Fee Categories</h2>
                <p className="mt-1 text-xs text-slate-500">All categories are locked for students. Fully paid categories are marked automatically.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selectedDueRows.length} due</span>
            </div>

            {mandatoryRows.length ? (
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-700">Mandatory Fees</h3>
                <div className="space-y-2">
                  {mandatoryRows.map((item) => <FeeCategoryCard key={item.category} item={item} />)}
                </div>
              </div>
            ) : null}

            {/* Optional Services block intentionally omitted — only mandatory fees are shown. */}

            {!feeRows.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No fee categories found for this student.</div>
            ) : null}

            {selectedDueRows.length ? (
              <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="mb-2 text-xs font-semibold text-indigo-700">Maximum Payment Allowed</p>
                <div className="space-y-1">
                  {selectedDueRows.map((row) => (
                    <div key={row.category} className="flex justify-between text-xs text-indigo-600">
                      <span>{row.category}</span>
                      <span className="font-bold">Max: {formatMoney(row.due)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between border-t border-indigo-200 pt-2 text-sm font-bold text-indigo-800">
                  <span>Total Maximum</span>
                  <span>{formatMoney(selectedDueRows.reduce((sum, row) => sum + row.due, 0))}</span>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Fee Receipt</h2>
            <p className="text-sm text-slate-500">Receipts are fetched from payment history for this student.</p>
            <Link to={`/fees/overview/receipt?student=${encodeURIComponent(student.id || studentId)}`} className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
              View Receipts
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Payment History</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{receipts.length}</span>
            </div>
            <div className="space-y-3">
              {receipts.length ? receipts.slice(0, 5).map((receipt, index) => (
                <div key={receipt._id || receipt.id || receipt.receiptNumber || index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-900">{receipt.receiptNumber || receipt.paymentMethod || receipt.method || 'Payment'}</span>
                    <span className="font-bold text-emerald-700">{formatMoney(getReceiptAmount(receipt))}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {getReceiptDate(receipt) ? new Date(getReceiptDate(receipt)).toLocaleDateString() : 'Date unavailable'}
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No payment history found.</div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
