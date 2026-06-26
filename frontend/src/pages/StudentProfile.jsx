import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString()}`;

const printStyles = `
  @media print {
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    .no-print { display: none !important; }
    #receipt-print-area {
      display: block !important;
      margin: 0;
      padding: 20px;
      page-break-inside: avoid;
    }
    .receipt-container {
      display: block !important;
      width: 100%;
      background: white;
      border: none;
    }
  }
`;

export default function StudentProfile({ studentId }){
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [claimName, setClaimName] = useState('');
  const [claimClass, setClaimClass] = useState('');
  const [claimRoll, setClaimRoll] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMatches, setClaimMatches] = useState(null);
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [confirmPay, setConfirmPay] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unpaid | paid
  const [showDebugCategories, setShowDebugCategories] = useState(false);

  useEffect(()=>{
    if (!studentId) return;
    setLoading(true);
    setHistoryLoading(true);
    setLoadError(null);

    const fetchProfile = api.get(`/fees/student/${studentId}`).then((res) => res.data);
    const fetchHistory = api.get(`/fees/student/${studentId}/history`).then((res) => {
      const d = res.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.data)) return d.data;
      return [];
    });

    fetchProfile.then((profileData) => {
      const s = profileData.student || {};
      const normalizedName = s.name || s.fullName || s.fullname || ((s.firstName || s.lastName) ? `${s.firstName || ''}${s.firstName && s.lastName ? ' ' : ''}${s.lastName || ''}` : '');
      setProfile({ student: { ...s, name: normalizedName || '-' }, summary: profileData.summary || {} });
    }).catch((err) => {
      console.error('Profile fetch failed:', err);
      const message = err?.response?.data?.message || err.message || 'Student not found.';
      setLoadError(message);
      setProfile(null);
    }).finally(() => setLoading(false));

    fetchHistory.then((historyData) => {
      setReceipts(Array.isArray(historyData) ? historyData : []);
    }).catch((err) => {
      console.error('History fetch failed:', err);
      setReceipts([]);
    }).finally(() => setHistoryLoading(false));
  },[studentId]);

  // If profile loads but no fee structure assigned, attempt an automatic lookup/claim
  useEffect(() => {
    const tryAutoClaim = async () => {
      try {
        if (!user) return;
        const role = String((user && user.role) || '').toLowerCase();
        if (!(role === 'student' || role === 'parent')) return;

        // If we already have fee data, nothing to do
        const hasFeeData = (profile && profile.summary && Array.isArray(profile.summary.feeBreakdown) && profile.summary.feeBreakdown.length > 0) || Number((profile && profile.summary && profile.summary.totalFee) || 0) > 0 || (Array.isArray(categories) && categories.length > 0) || receipts.length > 0;
        if (hasFeeData) return;

        // Build best-effort payload from available sources (profile -> user)
        const payload = {};
        const tryName = (profile && profile.student && (profile.student.name || profile.student.fullName)) || (user && (user.name || user.fullName || user.firstName)) || '';
        const tryClass = (profile && profile.student && (profile.student.className || (profile.student.class && profile.student.class.name))) || (user && (user.className || user.class)) || '';
        const tryRoll = (profile && profile.student && (profile.student.rollNumber || profile.student.admissionNumber)) || (user && (user.rollNumber || user.admissionNumber)) || '';

        if (!tryClass || !tryRoll) return; // need class+roll to safely lookup

        payload.name = tryName;
        payload.className = tryClass;
        payload.rollNumber = tryRoll;

        // Call public lookup to find matching student(s)
        const lookupRes = await api.post('/fees/lookup', payload).then(r => r.data).catch(() => null);
        if (!lookupRes || !lookupRes.success) return;

        // If single match, attempt to claim (this returns fees, payments, receipts)
        if (lookupRes.student && lookupRes.student.id) {
          const claimRes = await api.post('/fees/student/claim', { studentId: lookupRes.student.id }).then(r => r.data).catch(() => null);
          if (claimRes && claimRes.success && claimRes.student) {
            const s = claimRes.student;
            const normalizedName = s.name || s.fullName || s.fullname || ((s.firstName || s.lastName) ? `${s.firstName || ''}${s.firstName && s.lastName ? ' ' : ''}${s.lastName || ''}` : '');
            setProfile({ student: { ...s, name: normalizedName || '-' }, summary: claimRes.fees || claimRes.summary || {} });
            setReceipts(Array.isArray(claimRes.receipts) ? claimRes.receipts : (Array.isArray(claimRes.payments) ? claimRes.payments : []));
            // attempt to fetch categories for UI
            if (s && s.classId) {
              api.get(`/fees/categories?classId=${encodeURIComponent(s.classId)}`).then((res) => {
                const data = res.data;
                const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
                setCategories(list);
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        // ignore auto-claim errors — leave user to manual claim
        console.debug('Auto claim attempt failed:', (e && e.message) || e);
      }
    };

    // Only run when profile exists but shows no fee data
    if (profile && !((profile && profile.summary && Array.isArray(profile.summary.feeBreakdown) && profile.summary.feeBreakdown.length > 0) || Number((profile && profile.summary && profile.summary.totalFee) || 0) > 0 || (Array.isArray(categories) && categories.length > 0) || receipts.length > 0)) {
      tryAutoClaim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user, categories, receipts]);

  // Redirect to claim form when no studentId or when profile fails to load
  useEffect(() => {
    if (!studentId) {
      const role = String(user?.role || '').toLowerCase();
      if (role === 'student' || role === 'parent') {
        navigate(`/${role}/fees?showClaim=1`);
      }
    } else if (loadError && loading === false) {
      // If profile failed to load after attempting, redirect to claim form
      const role = String(user?.role || '').toLowerCase();
      if (role === 'student' || role === 'parent') {
        navigate(`/${role}/fees?showClaim=1`);
      }
    }
  }, [studentId, loadError, loading, user?.role, navigate]);

  useEffect(() => {
    if (!profile?.student?.classId) return;
    api.get(`/fees/categories?classId=${encodeURIComponent(profile.student.classId)}`)
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setCategories(list);
      })
      .catch(() => { setCategories([]); });
  }, [profile]);

  const handleDeleteReceipt = async (receiptItem) => {
    if (!receiptItem) return;
    const paymentId = String(receiptItem.paymentId || receiptItem.id || receiptItem._id || receiptItem.receiptId || '').trim();
    if (!paymentId) return;
    if (!window.confirm('Are you sure you want to delete this receipt?')) return;
    try {
      await api.delete(`/fees/payments/${encodeURIComponent(paymentId)}`);
      setReceipts((prev) => prev.filter((item) => {
        const itemPaymentId = String(item.paymentId || item.id || item._id || item.receiptId || '').trim();
        return itemPaymentId !== paymentId;
      }));
    } catch (err) {
      console.error('Delete receipt failed:', err);
      alert(err?.response?.data?.message || 'Unable to delete receipt.');
    }
  };

  const location = useLocation();
  const queryRollNumber = searchParams.get('rollNumber');
  const queryClassName = searchParams.get('className');
  const studentRollNumber = profile?.student?.rollNumber || profile?.student?.admissionNumber || queryRollNumber || '-';
  const studentClassName =
    profile?.student?.class?.name ||
    profile?.student?.className ||
    (typeof profile?.student?.class === 'string' ? profile.student.class : '') ||
    queryClassName ||
    '-';
  const studentSection = profile?.student?.section || profile?.student?.group || null;
  const studentAdmissionNumber = profile?.student?.admissionNumber || profile?.student?.admissionNo || profile?.student?.rollNumber || null;
  const studentName = profile?.student?.name || profile?.student?.fullName || profile?.student?.fullname || null;
  const academicYear = profile?.summary?.academicYear || profile?.student?.academicYear || null;
  const studentStatusRaw = profile?.student?.status ?? (profile?.student?.isActive != null ? (profile.student.isActive ? 'Active' : 'Inactive') : null);
  const studentStatus = typeof studentStatusRaw === 'string' ? studentStatusRaw : (studentStatusRaw === true ? 'Active' : studentStatusRaw === false ? 'Inactive' : 'Unknown');
  const totalPaidFromSummary = Number(profile?.summary?.totalPaid || 0);
  const totalDueFromSummary = Number(profile?.summary?.totalDue || 0);
  // total paid derived from receipts (authoritative) when receipts exist
  const totalReceipts = receipts.length;
  // Helper to normalize category keys
  const normalizeKey = (value) => String(value || '').trim().toLowerCase();

  // Aggregate paid amounts per category from receipts (authoritative)
  const paidMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(receipts) || receipts.length === 0) return map;
    receipts.forEach((r) => {
      const breakdown = r.breakdown || r.data?.breakdown || r.data?.feeBreakdown || r.payment?.breakdown || r.paymentBreakdown || r.data?.data?.breakdown || [];
      if (Array.isArray(breakdown)) {
        breakdown.forEach((item) => {
          if (!item) return;
          let category = item.category || item.name || item.label || (Array.isArray(item) ? item[0] : undefined);
          const amount = Number(item.amount ?? item.paid ?? item.value ?? (Array.isArray(item) ? item[1] : undefined) ?? 0);
          if (!category) return;
          const key = normalizeKey(category);
          map.set(key, (map.get(key) || 0) + (Number(amount) || 0));
        });
      } else if (breakdown && typeof breakdown === 'object') {
        Object.entries(breakdown).forEach(([cat, amt]) => {
          const key = normalizeKey(cat);
          map.set(key, (map.get(key) || 0) + Number(amt || 0));
        });
      }
    });
    return map;
  }, [receipts]);
  const totalPaidFromReceipts = useMemo(() => {
    if (!Array.isArray(receipts) || receipts.length === 0) return 0;
    return Array.from(paidMap.values()).reduce((s, v) => s + Number(v || 0), 0);
  }, [paidMap, receipts]);
  const totalPaid = totalReceipts > 0 ? totalPaidFromReceipts : totalPaidFromSummary;
  if (profile?.summary && totalReceipts > 0 && totalPaidFromSummary !== totalPaidFromReceipts) {
    console.warn('Fee reconciliation mismatch detected: profile.summary.totalPaid=%d does not equal receipt total=%d', totalPaidFromSummary, totalPaidFromReceipts);
  }

  const feeRows = useMemo(() => {
    // Build fee rows primarily from class categories + selected optional fees,
    // merging payment records to compute paid/due/status. Prefer class categories
    // so assigned mandatory fees always appear. Optional categories are shown
    // only when selected for the student.
    const classCategories = Array.isArray(categories) ? categories : [];
    const metaSelected = Array.isArray(profile?.student?.selectedOptionalFees)
      ? profile.student.selectedOptionalFees
      : (Array.isArray(profile?.student?.metadata?.selectedOptionalFees) ? profile.student.metadata.selectedOptionalFees : []);
    const metaSelectedNames = new Set(metaSelected.map(m => (typeof m === 'string' ? String(m).trim() : String(m?.name || m?.category || '').trim())).filter(Boolean).map(s => normalizeKey(s)));

    const rows = [];
    // Include all class categories: mandatory always, optional only if selected
    classCategories.forEach((item, idx) => {
      if (!item) return;
      const name = String(item.name || item.category || `Fee ${idx+1}`).trim();
      const key = normalizeKey(name);
      const total = Number(item.amount ?? item.defaultAmount ?? item.value ?? 0);
      const paid = Number(paidMap.get(key) || 0);
      const due = Math.max(0, total - paid);
      const isOptional = String(item.categoryType || item.type || '').toLowerCase().includes('optional');
      if (isOptional && !metaSelectedNames.has(key)) return; // skip unassigned optional
      const status = due === 0 ? (paid > 0 ? 'Paid' : 'Unpaid') : (paid > 0 ? 'Partial' : 'Unpaid');
      rows.push({ id: rows.length + 1, category: name, total, paid, due, status, categoryType: item.categoryType || item.type || '' });
    });

    // Also include any categories present in backend summary that are not part of classCategories
    const summaryFeeBreakdown = profile?.summary?.feeBreakdown;
    if (Array.isArray(summaryFeeBreakdown)) {
      summaryFeeBreakdown.forEach((it) => {
        if (!it || typeof it !== 'object') return;
        const name = String(it.category || it.name || it.label || '').trim();
        if (!name) return;
        const key = normalizeKey(name);
        if (rows.some(r => normalizeKey(r.category) === key)) return; // already included
        const paidFee = Number(it.paidFee ?? it.paid ?? it.amountPaid ?? it.paidAmount ?? 0);
        const actualFee = Number(it.actualFee ?? it.amount ?? it.defaultAmount ?? it.total ?? paidFee);
        const paid = Number(paidMap.get(key) || paidFee || 0);
        const due = Math.max(0, actualFee - paid);
        const status = due === 0 ? (paid > 0 ? 'Paid' : 'Unpaid') : (paid > 0 ? 'Partial' : 'Unpaid');
        rows.push({ id: rows.length + 1, category: name, total: actualFee, paid, due, status, categoryType: it.categoryType || it.type || '' });
      });
    }

    // As a last resort, if we have no class categories or summary but do have payments,
    // attempt to infer category totals from payment breakdown keys so user sees something.
    if (rows.length === 0 && paidMap && paidMap.size > 0) {
      Array.from(paidMap.entries()).forEach(([k, v], idx) => {
        const name = String(k || `Payment ${idx+1}`).trim();
        const paid = Number(v || 0);
        rows.push({ id: rows.length + 1, category: name, total: paid, paid, due: 0, status: 'Paid' });
      });
    }

    // Debug logging when breakdown is empty — include requested details
    if (rows.length === 0) {
      try {
        console.warn('[FEE DEBUG] studentId:', profile?.student?._id || profile?.student?.id || null);
        console.warn('[FEE DEBUG] classId:', profile?.student?.classId || profile?.student?.class || null);
        console.warn('[FEE DEBUG] class fee structure (categories):', classCategories);
        console.warn('[FEE DEBUG] optional fees assigned:', Array.from(metaSelectedNames));
        console.warn('[FEE DEBUG] payment records (paidMap):', Array.from(paidMap.entries()));
        console.warn('[FEE DEBUG] final feeBreakdown array (rows):', rows);
      } catch (e) { /* ignore */ }
    }

    return rows;
  }, [categories, profile, receipts]);
  // Prefer computing due from breakdown rows when available so status reflects actual per-head dues
  const totalDue = (Array.isArray(feeRows) && feeRows.length > 0)
    ? feeRows.reduce((sum, r) => sum + Number(r.due || 0), 0)
    : totalDueFromSummary;
  const feeRowsTotal = Array.isArray(feeRows) && feeRows.length ? feeRows.reduce((s, r) => s + Number(r.total || 0), 0) : 0;
  const fallbackTotalFee = Array.isArray(profile?.summary?.feeBreakdown)
    ? profile.summary.feeBreakdown.reduce((sum, item) => sum + Number(item?.actualFee ?? item?.amount ?? 0), 0)
    : totalPaid + totalDue;
  const totalFee = Number((feeRowsTotal || profile?.summary?.totalFee || fallbackTotalFee) || 0);
  // Payment status rules (calculate strictly from totals)
  const totalPaidNum = Number(totalPaid || 0);
  const totalFeeNum = Number(totalFee || 0);
  const totalDueNum = Math.max(0, totalFeeNum - totalPaidNum);

  // Debug log totals and derived values
  try {
    console.log('[PAYMENT DEBUG] totalFee:', totalFeeNum, 'totalPaid:', totalPaidNum, 'totalDue:', totalDueNum);
  } catch (e) { /* ignore */ }

  let paymentStatus = 'Not Available';
  if (totalFeeNum > 0) {
    if (totalPaidNum === 0) {
      paymentStatus = 'Unpaid';
    } else if (totalDueNum === 0) {
      paymentStatus = 'Paid';
    } else {
      paymentStatus = 'Partial';
    }
  } else if (receipts.length > 0) {
    // When no fee structure exists but payments are present, infer status
    if (totalPaidNum === 0) paymentStatus = 'Unpaid';
    else if (totalDueNum === 0) paymentStatus = 'Paid';
    else paymentStatus = 'Partial';
  } else {
    paymentStatus = 'Not Available';
  }

  const paymentStatusClasses = paymentStatus === 'Paid'
    ? 'bg-emerald-100 text-emerald-700'
    : paymentStatus === 'Unpaid'
    ? 'bg-rose-100 text-rose-700'
    : paymentStatus === 'Not Available'
    ? 'bg-slate-100 text-slate-700'
    : 'bg-amber-100 text-amber-700';
  const normalizedRole = String(user?.role || '').toLowerCase();
  const isStudentOrParent = normalizedRole === 'student' || normalizedRole === 'parent';
  const receiptRouteBase = normalizedRole === 'parent' ? '/parent/receipt' : normalizedRole === 'student' ? '/student/receipt' : '/fee-management/receipt';
  const canDeleteReceipt = user && ['admin', 'accountant'].includes(normalizedRole);
  const canManageFees = user && ['admin', 'accountant'].includes(normalizedRole);
  const inFeeManagement = location.pathname.startsWith('/fee-management/student');

  const backPath = normalizedRole === 'parent' ? '/parent/fees' : normalizedRole === 'student' ? '/student/fees' : '/fee-management/history';
  const pendingDues = feeRows.filter((row) => Number(row.due || 0) > 0);
  const totalOutstanding = pendingDues.reduce((sum, row) => sum + Number(row.due || 0), 0);

  const displayedRows = useMemo(() => {
    if (!Array.isArray(feeRows)) return [];
    // copy rows, sort unpaid/partial first, then by due desc
    const rows = [...feeRows];
    rows.sort((a, b) => {
      const aDue = Number(a.due || 0);
      const bDue = Number(b.due || 0);
      if ((aDue > 0) !== (bDue > 0)) return (bDue > 0) ? 1 : -1; // unpaid first
      // partials with larger due first
      if (aDue !== bDue) return bDue - aDue;
      return String(a.category || '').localeCompare(String(b.category || ''));
    });
    if (filter === 'unpaid') return rows.filter(r => Number(r.due || 0) > 0);
    if (filter === 'paid') return rows.filter(r => Number(r.due || 0) === 0 && Number(r.paid || 0) > 0);
    return rows;
  }, [feeRows, filter]);

  // Debug: build class-level fee breakdown (categories + payments)
  const debugRows = useMemo(() => {
    if (!Array.isArray(categories) || !profile || !profile.student) return [];
    const metaSelected = Array.isArray(profile?.student?.selectedOptionalFees) ? profile.student.selectedOptionalFees : (Array.isArray(profile?.student?.metadata?.selectedOptionalFees) ? profile.student.metadata.selectedOptionalFees : []);
    const metaSelectedNames = new Set(metaSelected.map(m => (typeof m === 'string' ? String(m).trim() : String(m?.name || m?.category || '').trim())).filter(Boolean));
    const mandatory = [];
    const optionalAssigned = [];
    const rows = [];
    categories.forEach((c, idx) => {
      if (!c) return;
      const name = String(c.name || c.category || `Fee ${idx + 1}`).trim();
      const key = normalizeKey(name);
      const total = Number(c.amount || c.defaultAmount || 0);
      const paid = Number(paidMap.get(key) || 0);
      const due = Math.max(0, total - paid);
      const isOptional = String(c.categoryType || c.type || c.status || '').toLowerCase().includes('optional');
      const status = due === 0 ? (paid > 0 ? 'Paid' : 'Unpaid') : (paid > 0 ? 'Partial' : 'Unpaid');
      if (isOptional) {
        if (metaSelectedNames.has(name)) {
          optionalAssigned.push(name);
          rows.push({ category: name, total, paid, due, status, type: 'Optional' });
        }
      } else {
        mandatory.push(name);
        rows.push({ category: name, total, paid, due, status, type: 'Mandatory' });
      }
    });
    // console logs for debugging as requested
    try {
      console.log('[DEBUG] classId:', profile?.student?.classId || profile?.student?.class || null);
      console.log('[DEBUG] fee structure loaded - categories count:', Array.isArray(categories) ? categories.length : 0);
      console.log('[DEBUG] mandatory categories:', mandatory);
      console.log('[DEBUG] optional categories (assigned):', optionalAssigned);
      // payment records (paidMap)
      const payments = Array.from((paidMap && paidMap.size) ? paidMap.entries() : []);
      console.log('[DEBUG] payment records (paidMap):', payments);
      console.log('[DEBUG] final fee breakdown sent to UI (debugRows):', rows);
    } catch (e) {
      // ignore
    }
    return rows;
  }, [categories, profile, paidMap]);

  // Determine whether a fee structure has been assigned for this student
  const feeStructureAssigned = (Array.isArray(categories) && categories.length > 0) || (Array.isArray(profile?.summary?.feeBreakdown) && profile.summary.feeBreakdown.length > 0) || Number(profile?.summary?.totalFee || 0) > 0;

  // Helper: prefer raw API value; return empty string when absent (avoid placeholder text)
  const displayOrNA = (v) => (v == null || v === '' ? '' : v);

  if (!profile) {
    if (loading) {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">Loading student fee profile…</div>
          </div>
        </div>
      );
    }

    const normalizedRole = String(user?.role || '').toLowerCase();
    if (!studentId && (normalizedRole === 'student' || normalizedRole === 'parent')) {
      return null;
    }

    const errorMsg = loadError || 'Student record not found';
    const helpText = loadError?.includes('404') || loadError?.includes('not found')
      ? 'Your student profile has not been set up in the system yet. Please contact your school administrator to create your student record.'
      : 'An error occurred while loading your fee information';

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="text-lg font-semibold text-rose-800">⚠️ {errorMsg}</div>
          <p className="mt-3 text-sm text-rose-700">{helpText}</p>
          <div className="mt-4 rounded-3xl bg-rose-100 px-4 py-3 text-xs font-mono text-rose-700">
            <div className="font-semibold mb-1">Debug Info:</div>
            <div>Student ID: {studentId || 'Not available'}</div>
            <div>Your Role: {user?.role || 'Unknown'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure student record is actually linked
  const studentLinked = Boolean(profile?.student && (profile.student._id || profile.student.id || profile.student.admissionNumber || profile.student.rollNumber || profile.student.name));
  if (!studentLinked) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="text-lg font-semibold text-rose-800">Student profile not linked. Please contact school administration.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>
      <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Student Profile Header Card */}
      <div className="no-print rounded-[1.5rem] bg-gradient-to-r from-white to-slate-50 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
          <div className="flex items-center justify-center md:justify-start">
            <div className="rounded-full ring-2 ring-indigo-100 p-1 shadow-md">
              {profile.student.photo ? (
                <img src={profile.student.photo} alt={profile.student.name} className="h-28 w-28 rounded-full object-cover" />
              ) : (
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {profile.student.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="text-center md:text-left">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{displayOrNA(profile.student.name)}</div>
            <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2 text-sm text-slate-600">
              <div className="md:mr-4">Class <span className="font-semibold text-slate-900">{displayOrNA(studentClassName)}</span></div>
              <div>Roll <span className="font-semibold text-slate-900">{displayOrNA(studentAdmissionNumber)}</span></div>
            </div>
            {studentSection ? <div className="mt-2 text-sm text-slate-500">Section • {studentSection}</div> : null}
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            {totalDueNum > 0 ? (
              <>
                <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${paymentStatusClasses}`}>
                  {paymentStatus}
                </div>
                <div className="text-xs text-slate-500">Total Due</div>
                <div className="text-lg font-semibold text-rose-600">{formatMoney(totalDueNum)}</div>
                {(!isStudentOrParent && canManageFees && inFeeManagement) ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/fee-management/collect/payment?studentId=${encodeURIComponent(studentId)}`)}
                    className="mt-2 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    Collect
                  </button>
                ) : null}
              </>
              ) : (
              // When nothing is due, hide the 'Paid / ₹0' noise and keep the header minimal
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm text-slate-500">No outstanding dues</div>
              </div>
              )}
          </div>
        </div>
      </div>
      {/* Optional services display removed per design decision */}

      {/* Fee related sections: show only when a fee structure is assigned */}
      {/* Confirmation modal for Pay action */}
      {confirmPay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmPay(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Confirm payment</h3>
            <p className="mt-2 text-sm text-slate-600">You are about to pay <span className="font-semibold">{formatMoney(confirmPay.amount)}</span> for <span className="font-semibold">{confirmPay.category}</span>.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmPay(null)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => { navigate(`/fee-management/collect/payment?studentId=${encodeURIComponent(studentId)}&category=${encodeURIComponent(confirmPay.category)}&amount=${encodeURIComponent(confirmPay.amount)}`); setConfirmPay(null); }} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Proceed to Pay</button>
            </div>
          </div>
        </div>
      ) : null}
      {!feeStructureAssigned ? null : (
        <>
        <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Fee Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm text-slate-500 font-medium">Total Fee</div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{formatMoney(totalFee)}</div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm text-slate-500 font-medium">Total Paid</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-600">{formatMoney(totalPaid)}</div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm text-slate-500 font-medium">Total Due</div>
            <div className="mt-3 text-3xl font-semibold text-rose-600">{formatMoney(totalDueNum)}</div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm text-slate-500 font-medium">Payment Status</div>
            <div className="mt-3 inline-flex rounded-full px-3 py-2 text-sm font-semibold" style={{
              backgroundColor: paymentStatus === 'Paid' ? '#dcfce7' : paymentStatus === 'Unpaid' ? '#fee2e2' : '#fef3c7',
              color: paymentStatus === 'Paid' ? '#166534' : paymentStatus === 'Unpaid' ? '#b91c1c' : '#92400e'
            }}>
              {paymentStatus}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Collection Progress</span>
            <span className={`text-sm font-bold ${totalFee === 0 ? 'text-slate-600' : totalFee > 0 && totalPaid >= totalFee ? 'text-emerald-600' : totalPaid > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
              {totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0}% Paid
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                totalFee > 0 && totalPaid >= totalFee ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : totalPaid > 0 ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                : 'bg-gradient-to-r from-rose-400 to-rose-600'
              }`}
              style={{ width: `${totalFee > 0 ? Math.min(100, Math.round((totalPaid / totalFee) * 100)) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Fee Breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">S.No, Fee head, actual fee, paid fee and due amount as a table.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600">Filter:</div>
            <div className="inline-flex rounded-md bg-slate-50 p-1">
              <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm ${filter==='all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>All</button>
              <button onClick={() => setFilter('unpaid')} className={`px-3 py-1 text-sm ${filter==='unpaid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>Unpaid</button>
              <button onClick={() => setFilter('paid')} className={`px-3 py-1 text-sm ${filter==='paid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>Paid</button>
            </div>
            <div className="inline-flex items-center gap-2">
              <label className="text-sm text-slate-600">Debug</label>
              <button onClick={() => setShowDebugCategories(s => !s)} className={`px-3 py-1 text-sm rounded ${showDebugCategories ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}>{showDebugCategories ? 'On' : 'Off'}</button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">S.No</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Category Name</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Class</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Amount</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Paid</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Due</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Type</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Status</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-500">No fee breakdown available.</td>
                </tr>
              ) : (
                displayedRows.map((row) => (
                    <tr key={row.id} className={`hover:bg-slate-50 ${Number(row.due || 0) > 0 ? 'bg-rose-50/40' : ''}`}>
                    <td className="px-5 py-4 text-slate-900">{row.id}</td>
                    <td className="px-5 py-4 text-slate-900 font-medium">{row.category}</td>
                    <td className="px-5 py-4 text-slate-900">{studentClassName || '-'}</td>
                    <td className="px-5 py-4 text-right text-slate-900">{formatMoney(row.total ?? row.amount)}</td>
                    <td className="px-5 py-4 text-right text-slate-900">{formatMoney(row.paid ?? 0)}</td>
                    <td className={`px-5 py-4 text-right font-semibold ${Number(row.due || 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatMoney(row.due ?? 0)}</td>
                    <td className="px-5 py-4 text-slate-900">{(String(row.categoryType || '').toLowerCase().includes('optional') ? 'Optional Service' : 'Mandatory Fee')}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {Number(row.due || 0) === 0 ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.293a1 1 0 00-1.414-1.414L9 9.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                            Locked
                          </span>
                        ) : canManageFees ? (
                          <>
                            <button onClick={() => navigate(`/fee-management/categories?classId=${encodeURIComponent(profile?.student?.classId || profile?.student?.class || '')}&category=${encodeURIComponent(row.category)}`)} className="rounded-2xl bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition">Edit</button>
                            <button onClick={async () => {
                              if (!String(row.categoryType || '').toLowerCase().includes('optional')) { alert('Cannot delete mandatory fees here. Use the Fee Categories page.'); return; }
                              if (!window.confirm(`Remove ${row.category} selection for this student?`)) return;
                              try {
                                // Build metadata removing this optional
                                const sel = Array.isArray(profile?.student?.selectedOptionalFees) ? [...profile.student.selectedOptionalFees] : (Array.isArray(profile?.student?.metadata?.selectedOptionalFees) ? [...profile.student.metadata.selectedOptionalFees] : []);
                                const normalized = (name) => (typeof name === 'string' ? name.trim() : (name?.name || name?.category || '') || '').trim();
                                const idx = sel.findIndex(s => normalizeKey(normalized(s)) === normalizeKey(row.category));
                                if (idx === -1) {
                                  // nothing to do
                                  alert('Category not present in student selections.');
                                  return;
                                }
                                // Prevent deletion if payments exist against this category
                                const paidAgainst = Number(paidMap.get(normalizeKey(row.category)) || 0);
                                if (paidAgainst > 0) { alert('Cannot remove optional service because payments exist against it.'); return; }
                                sel.splice(idx, 1);
                                const metadata = { ...(profile.student.metadata || {}), selectedOptionalFees: sel };
                                await api.put(`/students/${profile.student._id || studentId}`, { metadata });
                                // Update local profile state
                                setProfile(prev => {
                                  if (!prev) return prev;
                                  const next = { ...prev };
                                  next.student = { ...(next.student || {}), metadata };
                                  if (Array.isArray(next.summary?.feeBreakdown)) {
                                    const brIdx = next.summary.feeBreakdown.findIndex(b => normalizeKey(b.category || b.name || b.label) === normalizeKey(row.category));
                                    if (brIdx !== -1) {
                                      const existing = next.summary.feeBreakdown[brIdx];
                                      const paid = Number(existing.paidFee ?? existing.paid ?? 0);
                                      if (paid === 0) {
                                        next.summary.feeBreakdown = [...next.summary.feeBreakdown];
                                        next.summary.feeBreakdown.splice(brIdx, 1);
                                      }
                                    }
                                  }
                                  return next;
                                });
                              } catch (err) {
                                console.error('Failed to remove optional:', err);
                                alert('Unable to remove optional service.');
                              }
                            }} className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">Delete</button>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {showDebugCategories ? (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-slate-800">
            <div className="font-semibold mb-2">Debug: Class Fee Structure</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-yellow-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Category Name</th>
                    <th className="px-4 py-2 text-right font-semibold">Total</th>
                    <th className="px-4 py-2 text-right font-semibold">Paid</th>
                    <th className="px-4 py-2 text-right font-semibold">Due</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {debugRows.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-600">No categories available for class.</td></tr>
                  ) : (
                    debugRows.map((r, i) => (
                      <tr key={`${r.category}-${i}`}>
                        <td className="px-4 py-2 text-slate-900">{r.category}</td>
                        <td className="px-4 py-2 text-right text-slate-900">{formatMoney(r.total)}</td>
                        <td className="px-4 py-2 text-right text-slate-900">{formatMoney(r.paid)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-rose-600">{formatMoney(r.due)}</td>
                        <td className="px-4 py-2">{r.status}</td>
                        <td className="px-4 py-2">{r.type}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Fee</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(totalFee)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Paid</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(totalPaid)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Due</div>
            <div className="mt-2 text-lg font-semibold text-rose-600">{formatMoney(totalDueNum)}</div>
          </div>
        </div>
      </div>

      {pendingDues.length > 0 ? (
        <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Pending Dues</h2>
              <p className="mt-1 text-sm text-slate-500">These charges are outstanding and need to be settled.</p>
            </div>
            <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="font-semibold text-rose-800">Total Outstanding</div>
              <div>{formatMoney(totalOutstanding)}</div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em]">Fee Head</th>
                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.1em]">Due Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {pendingDues.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.category}</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-semibold">{formatMoney(row.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
            <p className="mt-1 text-sm text-slate-500">All fee payments made by this student, with download and print options.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Total Payments</div>
            <div>{receipts.length}</div>
          </div>
        </div>
        {/* Fee Left to Pay - prominent summary and per-category dues */}
        <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm mt-4">
          <h3 className="text-lg font-semibold text-slate-900">Fee Left to Pay</h3>
          <div className="mt-3 text-3xl font-semibold text-rose-600">{formatMoney(totalOutstanding)}</div>
          <div className="mt-4 text-sm text-slate-600">Remaining amounts by category:</div>
          <div className="mt-3">
            {pendingDues.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {pendingDues.map((row) => (
                  <li key={`due-${row.id}`} className="py-2 flex items-center justify-between">
                    <div className="text-slate-700">{row.category}</div>
                    <div className="font-medium text-rose-600">{formatMoney(row.due)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-3 text-sm text-slate-500">No outstanding fees.</div>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">Loading full student bill history...</div>
        ) : receipts.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em]">Receipt</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em]">Date</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em]">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em]">Status</th>
                      <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.1em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {receipts.map((item) => (
                      <tr key={item.id || item.receiptNumber} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.receiptNumber || '—'}</td>
                        <td className="px-4 py-3">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">{formatMoney(item.amount || item.amountPaid || 0)}</td>
                        <td className="px-4 py-3">{item.status || 'Paid'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                                if (rid) navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}`);
                                else alert('Receipt id missing');
                              }}
                              className="rounded-2xl bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                            >
                              View Receipt
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = item.receiptUrl || item.pdfUrl || item.receipt?.pdfUrl || null;
                                const base64 = item.pdfBase64 || item.receipt?.pdfBase64 || null;
                                if (url) {
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${item.receiptNumber || 'receipt'}.pdf`;
                                  a.target = '_blank';
                                  a.rel = 'noopener noreferrer';
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  return;
                                }
                                if (base64) {
                                  const byteChars = atob(base64);
                                  const byteNumbers = new Array(byteChars.length);
                                  for (let i = 0; i < byteChars.length; i += 1) byteNumbers[i] = byteChars.charCodeAt(i);
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: 'application/pdf' });
                                  const downloadUrl = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = downloadUrl;
                                  a.download = `${item.receiptNumber || 'receipt'}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(downloadUrl);
                                  return;
                                }
                                const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                                if (rid) navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}?print=1`);
                                else alert('Receipt id missing');
                              }}
                              className="no-print rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Download PDF
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                                if (rid) {
                                  navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}?print=1`);
                                  return;
                                }
                                const url = item.receiptUrl || item.pdfUrl || item.receipt?.pdfUrl || null;
                                const base64 = item.pdfBase64 || item.receipt?.pdfBase64 || null;
                                if (url) {
                                  const win = window.open(url, '_blank');
                                  if (!win) return alert('Allow popups to print the receipt.');
                                  try { win.focus(); win.print(); } catch (err) { console.error(err); }
                                  return;
                                }
                                if (base64) {
                                  const src = `data:application/pdf;base64,${base64}`;
                                  const win = window.open(src, '_blank');
                                  if (!win) return alert('Allow popups to print the receipt.');
                                  try { win.focus(); win.print(); } catch (err) { console.error(err); }
                                  return;
                                }
                                alert('Receipt id missing');
                              }}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Payment Timeline Section */}
      {receipts.length > 0 ? (
        <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Payment Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">Visual timeline of your payment activity and transactions.</p>
          </div>
          <div className="relative">
            <div className="space-y-6">
              {[...receipts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).map((item, idx) => (
                <div key={item.id || item.receiptNumber} className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-white mt-1"></div>
                    {idx < [...receipts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).length - 1 && (
                      <div className="w-0.5 h-16 bg-gradient-to-b from-indigo-200 to-slate-200"></div>
                    )}
                  </div>
                  {/* Timeline content */}
                  <div className="pb-4 pt-1">
                    <div className="flex items-baseline gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </div>
                      <div className="text-sm text-slate-500">({item.receiptNumber || 'Receipt'})</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-slate-600">Fee Payment Received</div>
                      <div className="text-lg font-semibold text-emerald-600">{formatMoney(item.amount || item.amountPaid || 0)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Receipt Center Section */}
      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Receipt Center</h2>
          <p className="mt-1 text-sm text-slate-500">Access all available receipts. Download, print, or view detailed receipt information.</p>
        </div>
        {receipts.length > 0 ? (
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Receipt No</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Date</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Amount</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[...receipts].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                  <tr key={item.id || item.receiptNumber} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{item.receiptNumber || '—'}</td>
                    <td className="px-5 py-4 text-slate-700">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{formatMoney(item.amount || item.amountPaid || 0)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                            if (rid) navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}`);
                            else alert('Receipt id missing');
                          }}
                          className="rounded-2xl bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = item.receiptUrl || item.pdfUrl || item.receipt?.pdfUrl || null;
                            const base64 = item.pdfBase64 || item.receipt?.pdfBase64 || null;
                            if (url) {
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${item.receiptNumber || 'receipt'}.pdf`;
                              a.target = '_blank';
                              a.rel = 'noopener noreferrer';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              return;
                            }
                            if (base64) {
                              const byteChars = atob(base64);
                              const byteNumbers = new Array(byteChars.length);
                              for (let i = 0; i < byteChars.length; i += 1) byteNumbers[i] = byteChars.charCodeAt(i);
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: 'application/pdf' });
                              const downloadUrl = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = downloadUrl;
                              a.download = `${item.receiptNumber || 'receipt'}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(downloadUrl);
                              return;
                            }
                            alert('PDF not available for this receipt.');
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = item.receiptUrl || item.pdfUrl || item.receipt?.pdfUrl || null;
                            const base64 = item.pdfBase64 || item.receipt?.pdfBase64 || null;
                            if (url) {
                              const win = window.open(url, '_blank');
                              if (!win) return alert('Allow popups to print the receipt.');
                              try { win.focus(); win.print(); } catch (err) { console.error(err); }
                              return;
                            }
                            if (base64) {
                              const src = `data:application/pdf;base64,${base64}`;
                              const win = window.open(src, '_blank');
                              if (!win) return alert('Allow popups to print the receipt.');
                              try { win.focus(); win.print(); } catch (err) { console.error(err); }
                              return;
                            }
                            const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                            if (rid) navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}?print=1`);
                            else alert('Receipt id missing');
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No receipts available.</div>
        )}
      </div>
      </>
      )}

      {/* Payment Timeline Section */}
      {receipts.length > 0 ? (
        <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Payment Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">Visual timeline of your payment activity and transactions.</p>
          </div>
          <div className="relative">
            <div className="space-y-6">
              {[...receipts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).map((item, idx) => (
                <div key={item.id || item.receiptNumber} className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-white mt-1"></div>
                    {idx < [...receipts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).length - 1 && (
                      <div className="w-0.5 h-16 bg-gradient-to-b from-indigo-200 to-slate-200"></div>
                    )}
                  </div>
                  {/* Timeline content */}
                  <div className="pb-4 pt-1">
                    <div className="flex items-baseline gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </div>
                      <div className="text-sm text-slate-500">({item.receiptNumber || 'Receipt'})</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-slate-600">Fee Payment Received</div>
                      <div className="text-lg font-semibold text-emerald-600">{formatMoney(item.amount || item.amountPaid || 0)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Receipt Center Section */}
      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Receipt Center</h2>
          <p className="mt-1 text-sm text-slate-500">Access all available receipts. Download, print, or view detailed receipt information.</p>
        </div>
        {receipts.length > 0 ? (
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Receipt No</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Date</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Amount</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[...receipts].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                  <tr key={item.id || item.receiptNumber} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{item.receiptNumber || '—'}</td>
                    <td className="px-5 py-4 text-slate-700">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{formatMoney(item.amount || item.amountPaid || 0)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                            if (rid) navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}`);
                            else alert('Receipt id missing');
                          }}
                          className="rounded-2xl bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = item.receiptUrl || item.pdfUrl || item.receipt?.pdfUrl || null;
                            const base64 = item.pdfBase64 || item.receipt?.pdfBase64 || null;
                            if (url) {
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${item.receiptNumber || 'receipt'}.pdf`;
                              a.target = '_blank';
                              a.rel = 'noopener noreferrer';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              return;
                            }
                            if (base64) {
                              const byteChars = atob(base64);
                              const byteNumbers = new Array(byteChars.length);
                              for (let i = 0; i < byteChars.length; i += 1) byteNumbers[i] = byteChars.charCodeAt(i);
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: 'application/pdf' });
                              const downloadUrl = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = downloadUrl;
                              a.download = `${item.receiptNumber || 'receipt'}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(downloadUrl);
                              return;
                            }
                            alert('PDF not available for this receipt.');
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = item.receiptUrl || item.pdfUrl || item.receipt?.pdfUrl || null;
                            const base64 = item.pdfBase64 || item.receipt?.pdfBase64 || null;
                            if (url) {
                              const win = window.open(url, '_blank');
                              if (!win) return alert('Allow popups to print the receipt.');
                              try { win.focus(); win.print(); } catch (err) { console.error(err); }
                              return;
                            }
                            if (base64) {
                              const src = `data:application/pdf;base64,${base64}`;
                              const win = window.open(src, '_blank');
                              if (!win) return alert('Allow popups to print the receipt.');
                              try { win.focus(); win.print(); } catch (err) { console.error(err); }
                              return;
                            }
                            const rid = item.receiptId || item.receipt?.receiptId || item.paymentId || item.id || item._id || item.receiptNumber;
                            if (rid) navigate(`${receiptRouteBase}/${encodeURIComponent(rid)}?print=1`);
                            else alert('Receipt id missing');
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No receipts available.</div>
        )}
      </div>
    </div>
      <div className="no-print mt-6">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (normalizedRole === 'student' || normalizedRole === 'parent') {
                const query = new URLSearchParams();
                query.set('showClaim', '1');
                if (studentClassName) query.set('className', studentClassName);
                if (studentRollNumber) query.set('rollNumber', studentRollNumber);
                if (studentName) query.set('name', studentName);
                navigate(`${backPath}?${query.toString()}`);
                return;
              }
              navigate(backPath);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-slate-700 hover:bg-slate-50 transition"
          >
            Back to Fees
          </button>
        </div>
      </div>
    </>
  );
}
