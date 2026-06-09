import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const formatMoney = (value) => `RS${Number(value || 0).toLocaleString()}`;

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

  useEffect(()=>{
    if (!studentId) return;
    setLoading(true);
    setHistoryLoading(true);
    setLoadError(null);

    const fetchProfile = api.get(`/fees/student/${studentId}`).then((res) => res.data);
    const fetchHistory = api.get(`/fees/student/${studentId}/history`).then((res) => res.data);

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
      if (Array.isArray(historyData)) {
        setReceipts(historyData);
      } else {
        setReceipts([]);
      }
    }).catch((err) => {
      console.error('History fetch failed:', err);
      setReceipts([]);
    }).finally(() => setHistoryLoading(false));
  },[studentId]);

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
  const studentAdmissionNumber = profile?.student?.admissionNumber || profile?.student?.admissionNo || profile?.student?.rollNumber || '-';
  const totalPaidFromSummary = Number(profile?.summary?.totalPaid || 0);
  const totalDue = Number(profile?.summary?.totalDue || 0);
  const receiptTotal = receipts.reduce((sum, item) => sum + Number(item.amountPaid ?? item.amount ?? item.paidToday ?? 0), 0);
  const totalPaid = receipts.length > 0 && totalPaidFromSummary !== receiptTotal ? receiptTotal : totalPaidFromSummary;
  if (profile?.summary && receipts.length > 0 && totalPaidFromSummary !== receiptTotal) {
    console.error('Fee reconciliation mismatch detected: profile.summary.totalPaid=%d does not equal receipt total=%d', totalPaidFromSummary, receiptTotal);
  }
  const totalReceipts = receipts.length;
  const fallbackTotalFee = Array.isArray(profile?.summary?.feeBreakdown)
    ? profile.summary.feeBreakdown.reduce((sum, item) => sum + Number(item?.actualFee ?? item?.amount ?? 0), 0)
    : totalPaid + totalDue;
  const totalFee = Number((profile?.summary?.totalFee ?? fallbackTotalFee) || 0);
  const paymentStatus = totalDue === 0 ? 'Paid' : totalPaid === 0 ? 'Unpaid' : 'Partially Paid';
  const paymentStatusClasses = paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : paymentStatus === 'Unpaid' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
  const normalizedRole = String(user?.role || '').toLowerCase();
  const receiptRouteBase = normalizedRole === 'parent' ? '/parent/receipt' : normalizedRole === 'student' ? '/student/receipt' : '/fee-management/receipt';
  const canDeleteReceipt = user && ['admin', 'accountant'].includes(normalizedRole);
  const canManageFees = user && ['admin', 'accountant'].includes(normalizedRole);
  const inFeeManagement = location.pathname.startsWith('/fee-management/student');

  const backPath = normalizedRole === 'parent' ? '/parent/fees' : normalizedRole === 'student' ? '/student/fees' : '/fee-management/history';

  const normalizeKey = (value) => String(value || '').trim().toLowerCase();

  const feeRows = useMemo(() => {
    const summaryFeeBreakdown = profile?.summary?.feeBreakdown;
    const summaryItems = Array.isArray(summaryFeeBreakdown)
      ? summaryFeeBreakdown.map((item) => {
          if (!item || typeof item !== 'object') return null;
          const category = item.category || item.name || item.feeHead || item.label || '';
          const paidFee = Number(item.paidFee ?? item.paid ?? item.amountPaid ?? item.paidAmount ?? 0);
          const actualFee = Number(item.actualFee ?? item.amount ?? item.defaultAmount ?? item.total ?? (paidFee || 0));
          const dueAmount = Number(item.dueAmount ?? item.due ?? Math.max(0, actualFee - paidFee));
          const status = item.status || (dueAmount === 0 ? (paidFee > 0 ? 'Paid' : 'Unpaid') : (paidFee > 0 ? 'Partial' : 'Unpaid'));
          return {
            category: String(category || 'Fee').trim(),
            actualFee,
            paidFee,
            dueAmount,
            status
          };
        }).filter(Boolean)
      : profile?.summary?.feeBreakdown && typeof profile.summary.feeBreakdown === 'object'
      ? Object.entries(profile.summary.feeBreakdown).map(([category, value]) => {
          const paidFee = Number(value || 0);
          return {
            category,
            actualFee: paidFee,
            paidFee,
            dueAmount: 0,
            status: paidFee > 0 ? 'Paid' : 'Unpaid'
          };
        })
      : [];

    const summaryMap = new Map(summaryItems.map((item) => [normalizeKey(item.category), item]));

    if (summaryItems.length) {
      return summaryItems.map((item, idx) => {
        const total = item.actualFee || item.paidFee + item.dueAmount || 0;
        const paid = item.paidFee;
        const due = Number(item.dueAmount || Math.max(0, total - paid));
        return {
          id: idx + 1,
          category: item.category || `Fee ${idx + 1}`,
          total,
          paid,
          due,
          status: item.status || (due === 0 ? (paid > 0 ? 'Paid' : 'Unpaid') : 'Partial')
        };
      });
    }

    if (Array.isArray(categories) && categories.length) {
      return categories.map((item, idx) => {
        const name = item.name || item.category || `Fee ${idx + 1}`;
        const total = Number(item.amount || item.defaultAmount || 0);
        const summary = summaryMap.get(normalizeKey(name));
        const paid = Number(summary?.paidFee || 0);
        const due = Math.max(0, total - paid);
        return {
          id: idx + 1,
          category: name,
          total,
          paid,
          due,
          status: due === 0 ? (paid > 0 ? 'Paid' : 'Unpaid') : 'Partial'
        };
      });
    }

    const totalPaid = receipts.length > 0 ? receiptTotal : Number(profile?.summary?.totalPaid || 0);
    const totalDue = Number(profile?.summary?.totalDue || 0);
    return [{
      id: 1,
      category: 'Total Fee',
      total: totalPaid + totalDue,
      paid: totalPaid,
      due: totalDue,
      status: totalDue === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
    }];
  }, [categories, profile]);

  const pendingDues = feeRows.filter((row) => Number(row.due || 0) > 0);
  const totalOutstanding = pendingDues.reduce((sum, row) => sum + Number(row.due || 0), 0);

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

  return (
    <>
      <style>{printStyles}</style>
      <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Student Profile Header Card */}
      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] items-start">
          <div className="flex flex-col items-center gap-4">
            {profile.student.photo ? (
              <img
                src={profile.student.photo}
                alt={profile.student.name}
                className="h-24 w-24 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                {profile.student.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </div>
            )}
            <div className="text-center">
              <div className="text-xl font-semibold text-slate-900">{profile.student.name}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="text-slate-500">Class</div>
                <div className="mt-2 font-semibold text-slate-900">{studentClassName}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="text-slate-500">Roll No</div>
                <div className="mt-2 font-semibold text-slate-900">{studentAdmissionNumber}</div>
              </div>
              {studentSection ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Section</div>
                  <div className="mt-2 font-semibold text-slate-900">{studentSection}</div>
                </div>
              ) : null}
            </div>
            <div className="flex gap-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm flex-1">
                <div className="text-slate-500">Academic Year</div>
                <div className="mt-2 font-semibold text-slate-900">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm flex-1">
                <div className="text-slate-500">Status</div>
                <div className="mt-2 font-semibold text-emerald-600">Active</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {canManageFees && inFeeManagement ? (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-slate-500">Fee Management</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">Manage collection for this student</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/fee-management/collect/payment?studentId=${encodeURIComponent(studentId)}`)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  Collect Payment
                </button>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm uppercase tracking-[0.18em] text-slate-500">Payment Status</div>
              <div className="mt-4 flex items-center gap-3">
                <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${paymentStatusClasses}`}>
                  {paymentStatus}
                </div>
              </div>
              <div className="mt-6 text-sm text-slate-600">
                {canManageFees && inFeeManagement
                  ? 'You can collect payment for this student via the accountant fee collection workflow.'
                  : 'This portal is read-only. Receipts and payment history can be viewed, printed, or downloaded only.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Dashboard Summary Cards */}
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
            <div className="mt-3 text-3xl font-semibold text-rose-600">{formatMoney(totalDue)}</div>
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
      </div>

      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Fee Breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">S.No, Fee head, actual fee, paid fee and due amount as a table.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">S.No</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Fee Head</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Actual Fee</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Paid Fee</th>
                  <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Due Amount</th>
                  <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {feeRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500">No fee breakdown available.</td>
                </tr>
              ) : (
                feeRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-900">{row.id}</td>
                    <td className="px-5 py-4 text-slate-900 font-medium">{row.category}</td>
                    <td className="px-5 py-4 text-right text-slate-900">{formatMoney(row.total)}</td>
                    <td className="px-5 py-4 text-right text-slate-900">{formatMoney(row.paid)}</td>
                    <td className="px-5 py-4 text-right text-slate-900">{formatMoney(row.due)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
            <div className="mt-2 text-lg font-semibold text-rose-600">{formatMoney(totalDue)}</div>
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
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Download PDF
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
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
                            {canDeleteReceipt ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteReceipt(item); }}
                                className="rounded-2xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No receipts yet</div>
        )}
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
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No receipts available yet.</div>
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
