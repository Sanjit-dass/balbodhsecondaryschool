const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
let QRCode;
try {
  QRCode = require('qrcode');
} catch (err) {
  QRCode = null;
  console.warn('Optional dependency `qrcode` not installed — receipt QR codes will be omitted. Install with `npm install qrcode` in server.');
}

const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const FeeReceipt = require('../models/FeeReceipt');
const FeeCategory = require('../models/FeeCategory');
const ClassModel = require('../models/Class');

const { Types: { ObjectId } } = mongoose;

const formatCurrency = (n) => {
  let value = Number(n || 0);
  if (Number.isNaN(value)) value = 0;
  return `Rs ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function getStudentName(student = {}) {
  if (!student) return '-';
  const name = student.name || student.fullName || student.fullname;
  if (name && String(name).trim()) return String(name).trim();
  const first = String(student.firstName || '').trim();
  const last = String(student.lastName || '').trim();
  if (first || last) return `${first}${first && last ? ' ' : ''}${last}`.trim();
  return student.admissionNumber || student.rollNumber || '-';
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeKey(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function isOptionalCategory(item) {
  const type = String(item?.categoryType || item?.status || '').trim().toLowerCase();
  return type === 'optional service' || type === 'optional';
}

function buildStudentSelectionMap(student = {}) {
  const selected = {};
  const values = [];
  if (Array.isArray(student.selectedOptionalFees)) values.push(...student.selectedOptionalFees);
  if (student.metadata && Array.isArray(student.metadata.selectedOptionalFees)) values.push(...student.metadata.selectedOptionalFees);
  if (Array.isArray(student.optionalFees)) {
    student.optionalFees.forEach((item) => {
      if (!item) return;
      if (typeof item === 'object' && (item.selected === true || item.isSelected === true || item.checked === true)) {
        values.push(item);
      }
    });
  }
  if (Array.isArray(student.feeBreakdown)) {
    student.feeBreakdown.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      if (item.selected === true || item.isSelected === true || item.checked === true || Number(item.paid || item.paidFee || item.amountPaid || 0) > 0) {
        values.push(item);
      }
    });
  }
  values.forEach((item) => {
    if (!item) return;
    if (typeof item === 'string') {
      selected[normalizeKey(item)] = true;
      return;
    }
    const key = normalizeKey(item.category || item.name || item.type || item.label || item.feeHead || item);
    if (key) selected[key] = true;
  });
  if (student.transportation || student.busService || student.hasBusService || student.busRoute || student.hasBusRoute) {
    selected['transportation'] = true;
    selected['bus'] = true;
  }
  if (student.hostel || student.hasHostel || student.hostelService) {
    selected['hostel'] = true;
  }
  if (student.lab || student.hasLab || student.labService) {
    selected['lab'] = true;
  }
  if (student.sports || student.hasSports || student.sportsService) {
    selected['sports'] = true;
  }
  return selected;
}

function breakdownEntries(breakdown) {
  if (!breakdown) return [];
  if (Array.isArray(breakdown)) {
    return breakdown.map((item) => {
      if (!item || typeof item !== 'object') return [String(item || ''), 0];
      const category = String(item.category || item.name || item.label || item.type || '').trim();
      const amount = Number(item.amount ?? item.value ?? item.paidFee ?? item.paid ?? 0);
      return [category, amount];
    });
  }
  if (typeof breakdown === 'object') {
    return Object.entries(breakdown);
  }
  return [];
}

function isReceiptValid(receipt) {
  if (!receipt) return false;
  const status = String(receipt.data?.status || receipt.status || '').trim().toLowerCase();
  if (['failed', 'cancelled', 'void', 'reversed', 'deleted', 'error'].includes(status)) return false;
  if (receipt.data?.isCancelled || receipt.data?.cancelled || receipt.data?.failed || receipt.data?.voided) return false;
  return true;
}

function normalizeReceiptKey(receipt) {
  if (!receipt) return null;
  const paymentId = receipt.paymentId ? String(receipt.paymentId) : null;
  const receiptNumber = receipt.receiptNumber ? String(receipt.receiptNumber).trim() : null;
  return paymentId ? `payment:${paymentId}` : receiptNumber ? `receipt:${receiptNumber}` : `id:${String(receipt._id || '')}`;
}

function dedupeReceipts(receipts = []) {
  const seen = new Set();
  const unique = [];
  receipts.forEach((receipt) => {
    if (!isReceiptValid(receipt)) return;
    const key = normalizeReceiptKey(receipt);
    if (!key || seen.has(key)) return;
    seen.add(key);
    if (receipt.paymentId) seen.add(`payment:${String(receipt.paymentId)}`);
    if (receipt.receiptNumber) seen.add(`receipt:${String(receipt.receiptNumber).trim()}`);
    unique.push(receipt);
  });
  return unique;
}

function getValidReceipts(receipts = []) {
  return dedupeReceipts(receipts);
}

function buildPaymentAllocation(payments = [], receipts = []) {
  const categoryPaid = {};
  let unallocated = 0;
  let totalPaid = 0;
  const paymentsById = {};

  payments.forEach((payment) => {
    if (!payment) return;
    const paymentId = payment._id ? String(payment._id) : null;
    if (paymentId) paymentsById[paymentId] = payment;
  });

  // Get valid receipts (filters invalid ones)
  const validReceipts = receipts.filter(r => r && isReceiptValid(r));
  const paymentIdsWithReceipts = new Set(validReceipts.map((receipt) => String(receipt.paymentId)).filter(Boolean));

  // DEBUG: Log what we're working with
  const debug = process.env.DEBUG_FEES === 'true';
  if (debug) {
    console.log('[buildPaymentAllocation] Total payments:', payments.length, 'Total receipts:', receipts.length, 'Valid receipts:', validReceipts.length);
    validReceipts.forEach((r, i) => console.log(`  Receipt ${i}: id=${r._id}, paymentId=${r.paymentId}, data.breakdown=`, r.data?.breakdown));
    payments.forEach((p, i) => console.log(`  Payment ${i}: id=${p._id}, breakdown=`, p.breakdown, 'amountPaid=', p.amountPaid));
  }

  // Process valid receipts
  validReceipts.forEach((receipt) => {
    const receiptAmount = Number(receipt.data?.amountPaid ?? receipt.data?.amount ?? receipt.amountPaid ?? 0);
    if (Number.isNaN(receiptAmount) || receiptAmount <= 0) return;
    totalPaid += receiptAmount;

    const entries = breakdownEntries(receipt.data?.breakdown ?? receipt.breakdown ?? paymentsById[String(receipt.paymentId)]?.breakdown);
    if (debug && entries.length > 0) {
      console.log(`[buildPaymentAllocation] Receipt ${receipt._id} entries:`, entries);
    }
    let sumBreakdown = 0;
    entries.forEach(([category, value]) => {
      if (!category) return;
      const paid = Number(value || 0);
      if (Number.isNaN(paid) || paid <= 0) return;
      const key = normalizeKey(category);
      categoryPaid[key] = (categoryPaid[key] || 0) + paid;
      sumBreakdown += paid;
    });

    if (receiptAmount > sumBreakdown) {
      unallocated += receiptAmount - sumBreakdown;
    }
  });

  // Process payments that don't have valid receipts
  payments.forEach((payment) => {
    const paymentId = payment._id ? String(payment._id) : null;
    if (paymentId && paymentIdsWithReceipts.has(paymentId)) return;
    const amountPaid = Number(payment.amountPaid || payment.paidToday || 0);
    if (Number.isNaN(amountPaid) || amountPaid <= 0) return;

    const entries = breakdownEntries(payment.breakdown);
    if (debug && entries.length > 0) {
      console.log(`[buildPaymentAllocation] Payment ${payment._id} (no valid receipt) entries:`, entries);
    }
    if (entries.length > 0) {
      entries.forEach(([category, value]) => {
        if (!category) return;
        const paid = Number(value || 0);
        if (Number.isNaN(paid) || paid <= 0) return;
        const key = normalizeKey(category);
        categoryPaid[key] = (categoryPaid[key] || 0) + paid;
      });
    } else {
      unallocated += amountPaid;
    }
    totalPaid += amountPaid;
  });

  if (debug) {
    console.log('[buildPaymentAllocation] Final result:', { categoryPaid, unallocated, totalPaid });
  }

  return { categoryPaid, unallocated, totalPaid };
}

function buildAssignedFeeSummary(student = {}, classCategories = [], payments = [], receipts = []) {
  const selectedMap = buildStudentSelectionMap(student);
  const { categoryPaid, unallocated, totalPaid } = buildPaymentAllocation(payments, receipts);
  const feeBreakdownItems = [];
  let totalFee = 0;
  let remainingUnallocated = unallocated;

  const debug = process.env.DEBUG_FEES === 'true';
  if (debug) {
    console.log('[buildAssignedFeeSummary] categoryPaid:', categoryPaid, 'unallocated:', unallocated, 'totalPaid:', totalPaid);
    console.log('[buildAssignedFeeSummary] classCategories:', classCategories.length, classCategories.map(c => ({ name: c.name || c.category, amount: c.amount })));
  }

  classCategories.forEach((item) => {
    const categoryName = String(item.name || item.category || item.label || 'Fee').trim();
    const categoryKey = normalizeKey(categoryName);
    const amount = Number(item.amount || item.defaultAmount || 0);
    let paid = Number(categoryPaid[categoryKey] || 0);
    const mandatory = !isOptionalCategory(item);
    const selected = mandatory || paid > 0 || Boolean(selectedMap[categoryKey]);
    if (!selected) return;

    if (remainingUnallocated > 0) {
      const available = Math.min(remainingUnallocated, Math.max(0, amount - paid));
      paid += available;
      remainingUnallocated -= available;
    }

    const due = Math.max(0, amount - paid);
    totalFee += amount;

    if (debug) {
      console.log(`  Category ${categoryName} (key=${categoryKey}): amount=${amount}, paid=${paid}, due=${due}`);
    }

    feeBreakdownItems.push({
      category: categoryName,
      actualFee: amount,
      paidFee: paid,
      dueAmount: due,
      status: due === 0 ? (paid > 0 ? 'Paid' : 'Unpaid') : (paid > 0 ? 'Partial' : 'Unpaid'),
      categoryType: item.categoryType || item.status || (mandatory ? 'Mandatory Fee' : 'Optional Service')
    });
  });

  if (remainingUnallocated > 0) {
    feeBreakdownItems.push({
      category: 'Unallocated',
      actualFee: 0,
      paidFee: remainingUnallocated,
      dueAmount: 0,
      status: 'Paid',
      categoryType: 'Unallocated'
    });
  }

  const breakdownPaidSum = feeBreakdownItems.reduce((sum, item) => sum + Number(item.paidFee || 0), 0);
  if (Number(totalPaid) !== breakdownPaidSum) {
    console.error('Fee summary reconciliation mismatch: totalPaid=%d but fee breakdown paid total=%d. Rebuilding from payment/receipt records.', totalPaid, breakdownPaidSum);
  }

  const totalDue = Math.max(0, totalFee - totalPaid);
  return { totalFee, totalPaid, totalDue, feeBreakdownItems, selectedMap };
}

function normalizeClassLabel(value) {
  if (!value) return '';
  let normalized = String(value).trim();
  normalized = normalized.replace(/:\d+$/, '').trim();
  normalized = normalized.replace(/^(?:class|grade|std|standard)\s*/i, '').trim();
  normalized = normalized.replace(/(?:st|nd|rd|th)$/i, '').trim();
  return normalized;
}

async function resolveClassRecord(classId) {
  if (!classId) return null;
  const normalized = normalizeClassLabel(classId);
  if (!normalized) return null;

  if (ObjectId.isValid(classId)) {
    const cls = await ClassModel.findById(classId).lean();
    if (cls) return cls;
  }

  const numericValue = parseInt(normalized, 10);
  const cls = await ClassModel.findOne({
    $or: [
      { name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') },
      { name: new RegExp(`^${escapeRegex(normalized)}\b`, 'i') },
      { name: new RegExp(`\b${escapeRegex(normalized)}\b`, 'i') },
      { name: new RegExp(`(?:class|grade|std|standard)\s*${escapeRegex(normalized)}`, 'i') },
      Number.isNaN(numericValue) ? undefined : { numeric: numericValue }
    ].filter(Boolean)
  }).lean();
  return cls || null;
}

async function resolveClassObjectId(classId) {
  const cls = await resolveClassRecord(classId);
  return cls ? String(cls._id) : null;
}

async function buildStudentClassQuery(classId) {
  const rawValue = String(classId || '').trim();
  const normalized = normalizeClassLabel(rawValue);
  if (!normalized) return null;

  const or = [];
  const classRecord = await resolveClassRecord(rawValue);

  if (ObjectId.isValid(rawValue)) {
    or.push({ class: rawValue }, { classId: rawValue });
  }

  if (classRecord) {
    const classObjectId = String(classRecord._id);
    or.push({ class: classObjectId }, { classId: classObjectId });

    if (classRecord.name) {
      or.push({ className: classRecord.name });
      or.push({ className: new RegExp(`^${escapeRegex(classRecord.name)}$`, 'i') });
      or.push({ className: new RegExp(escapeRegex(classRecord.name), 'i') });
    }

    const resolvedName = normalizeClassLabel(classRecord.name);
    if (resolvedName) {
      or.push({ className: resolvedName });
      or.push({ className: new RegExp(`^${escapeRegex(resolvedName)}$`, 'i') });
      or.push({ className: new RegExp('\\b' + escapeRegex(resolvedName) + '\\b', 'i') });
      or.push({ className: new RegExp(escapeRegex(resolvedName), 'i') });
    }
  }

  or.push({ className: rawValue });
  or.push({ className: new RegExp(`^${escapeRegex(normalized)}$`, 'i') });
  or.push({ className: new RegExp(`\\b${escapeRegex(normalized)}\\b`, 'i') });
  or.push({ className: new RegExp(`^${escapeRegex(normalized)}\\b`, 'i') });

  or.push({ className: new RegExp(`^${escapeRegex(rawValue)}$`, 'i') });
  or.push({ className: new RegExp(escapeRegex(rawValue), 'i') });
  or.push({ className: normalized });
  or.push({ className: new RegExp(`^${escapeRegex(normalized)}$`, 'i') });
  or.push({ className: new RegExp('\\b' + escapeRegex(normalized) + '\\b', 'i') });
  or.push({ className: new RegExp(escapeRegex(normalized), 'i') });

  const numericMatch = normalized.match(/^(\d+)$/);
  if (numericMatch) {
    const rawValue = numericMatch[1];
    or.push({ className: `Class ${rawValue}` });
    or.push({ className: `${rawValue}th` });
    or.push({ className: `Grade ${rawValue}` });
    or.push({ className: `Std ${rawValue}` });
    or.push({ className: new RegExp(`\\b${escapeRegex(rawValue)}\\b`, 'i') });
    or.push({ className: new RegExp(`^${escapeRegex(rawValue)}\\s*[A-Za-z]?$`, 'i') });
  }

  const resolvedId = await resolveClassObjectId(normalized);
  if (resolvedId) {
    or.push({ class: resolvedId }, { classId: resolvedId });
  }

  return { $or: or };
}

async function dashboard(req, res) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate()+1);

    const [todayCollAgg, monthCollAgg, pendingAgg, paidStudentsAgg, defaultersAgg] = await Promise.all([
      FeePayment.aggregate([{ $match: { createdAt: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      (async ()=>{
        const first = new Date(); first.setDate(1); first.setHours(0,0,0,0);
        return FeePayment.aggregate([{ $match: { createdAt: { $gte: first } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]);
      })(),
      FeePayment.aggregate([{ $group: { _id: null, totalPending: { $sum: '$dueAmount' } } }]),
      FeePayment.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, count: { $sum: 1 } } }]),
      FeePayment.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, count: { $sum: 1 } } }]),
    ]);

    const monthly = (monthCollAgg[0] && monthCollAgg[0].total) || 0;
    const todayTotal = (todayCollAgg[0] && todayCollAgg[0].total) || 0;
    const pending = (pendingAgg[0] && pendingAgg[0].totalPending) || 0;
    const totalPaidStudents = (paidStudentsAgg[0] && paidStudentsAgg[0].count) || 0;
    const totalDefaulters = (defaultersAgg[0] && defaultersAgg[0].count) || 0;

    // Class wise aggregation
    let classWise = await FeePayment.aggregate([
      { $group: { _id: '$classId', collected: { $sum: '$amountPaid' }, pending: { $sum: '$dueAmount' } } },
    ]);
    // Resolve class names
    const classIds = classWise.map(c=>c._id).filter(Boolean);
    if (classIds.length) {
      const classes = await ClassModel.find({ _id: { $in: classIds } }).lean();
      const classMap = {};
      classes.forEach(cl=> classMap[cl._id.toString()] = cl.name);
      classWise = classWise.map(c=> ({ ...c, className: classMap[c._id ? c._id.toString() : ''] || (c._id || 'Class') }));
    }

    res.json({
      totalCollectionToday: todayTotal,
      totalCollectionThisMonth: monthly,
      totalPendingFees: pending,
      totalPaidStudents,
      totalDefaulters,
      classWise
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function resolveReceiptByIdOrNumber(identifier) {
  if (!identifier) return null;
  let receipt = null;
  if (ObjectId.isValid(identifier)) {
    receipt = await FeeReceipt.findById(identifier).lean();
    if (!receipt) {
      receipt = await FeeReceipt.findOne({ paymentId: identifier }).lean();
    }
  }
  if (!receipt) {
    receipt = await FeeReceipt.findOne({ receiptNumber: String(identifier).trim() }).lean();
  }
  return receipt;
}

function normalizeBreakdownObject(breakdownSource) {
  if (Array.isArray(breakdownSource)) {
    return breakdownSource.reduce((acc, item) => {
      if (!item) return acc;
      const category = String(item.category || item.name || item.label || 'Fee').trim() || 'Fee';
      const amount = Number(item.amount ?? item.value ?? 0);
      acc[category] = amount;
      return acc;
    }, {});
  }

  if (breakdownSource && typeof breakdownSource === 'object') {
    return Object.entries(breakdownSource).reduce((acc, [category, amount]) => {
      if (!category) return acc;
      acc[String(category)] = Number(amount || 0);
      return acc;
    }, {});
  }

  return {};
}

function normalizeBreakdownItems(breakdownSource, categories = []) {
  if (categories && Array.isArray(categories) && categories.length) {
    const breakdownMap = normalizeBreakdownObject(breakdownSource);
    const categoryNames = categories.map((cat) => String(cat.name || cat.category || cat.label || 'Fee').trim() || 'Fee');
    const items = categories.map((cat) => {
      const categoryName = String(cat.name || cat.category || cat.label || 'Fee').trim() || 'Fee';
      const actualFee = Number(cat.amount ?? cat.defaultAmount ?? cat.fee ?? cat.totalFee ?? 0);
      const paidFee = Number(breakdownMap[categoryName] || 0);
      const dueAmount = Math.max(0, actualFee - paidFee);
      return {
        category: categoryName,
        actualFee,
        paidFee,
        dueAmount,
        status: dueAmount === 0 ? 'Paid' : paidFee > 0 ? 'Partial' : 'Unpaid'
      };
    });

    Object.entries(breakdownMap).forEach(([category, amount]) => {
      if (!categoryNames.includes(category)) {
        const paidFee = Number(amount || 0);
        items.push({ category, actualFee: paidFee, paidFee, dueAmount: 0, status: 'Paid' });
      }
    });

    return items;
  }

  if (Array.isArray(breakdownSource)) {
    return breakdownSource.map((item) => {
      const categoryName = String(item.category || item.name || item.label || 'Fee').trim() || 'Fee';
      const amount = Number(item.amount ?? item.value ?? 0);
      return { category: categoryName, actualFee: amount, paidFee: amount, dueAmount: 0, status: 'Paid' };
    });
  }

  if (breakdownSource && typeof breakdownSource === 'object') {
    return Object.entries(breakdownSource).map(([category, amount]) => {
      const paidFee = Number(amount || 0);
      return { category: String(category || 'Fee'), actualFee: paidFee, paidFee, dueAmount: 0, status: 'Paid' };
    });
  }

  return [];
}

async function enrichReceiptCategories(receipt, payment = null) {
  if (!receipt) return [];
  const existing = Array.isArray(receipt.data?.categories) && receipt.data.categories.length ? receipt.data.categories : [];
  if (existing.length) return existing;

  const classId = receipt.data?.student?.classId || receipt.classId || payment?.classId || receipt.data?.classId || receipt.data?.className;
  if (!classId) return [];

  const resolvedClassId = await resolveClassObjectId(classId) || classId;
  if (!resolvedClassId) return [];

  const categories = await FeeCategory.find({ classId: resolvedClassId, status: 'active' }).lean() || [];
  if (categories.length) {
    if (!receipt.data) receipt.data = {};
    receipt.data.categories = categories;
  }
  return categories;
}

function buildReceiptPayload(receipt, payment = null, categories = [], student = null) {
  if (!receipt) return null;
  const normalizedReceiptId = receipt._id ? String(receipt._id) : (receipt.receiptId || receipt.id || null);
  const receiptDate = receipt.data?.date || receipt.createdAt || payment?.createdAt || new Date();
  const breakdownSource = receipt.data?.breakdown ?? payment?.breakdown ?? {};
  const activeCategories = Array.isArray(categories) && categories.length ? categories : (receipt.data?.categories || []);
  const breakdownObject = normalizeBreakdownObject(breakdownSource);
  const feeBreakdownItems = normalizeBreakdownItems(breakdownSource, activeCategories);
  
  // Get student's selected optional fees
  const studentRecord = student || receipt.data?.student || payment?.student || {};
  const selectedOptionalMap = buildStudentSelectionMap(studentRecord);
  
  // Calculate totalFeeAll: sum of ALL assigned categories (mandatory + selected optional)
  const categoriesForTotalFee = Array.isArray(activeCategories) && activeCategories.length
    ? activeCategories.filter(cat => {
        const isOptional = isOptionalCategory(cat);
        if (!isOptional) return true; // Include all mandatory categories
        const catKey = normalizeKey(cat.name || cat.category || '');
        return selectedOptionalMap[catKey]; // Include only selected optional categories
      })
    : [];
  
  const totalFeeAll = Array.isArray(categoriesForTotalFee) && categoriesForTotalFee.length
    ? categoriesForTotalFee.reduce((sum, cat) => sum + Number(cat.amount ?? cat.defaultAmount ?? cat.fee ?? cat.totalFee ?? 0), 0)
    : 0;
  
  // Calculate currentTransaction totalAmount from breakdown items
  const categoryTotal = Array.isArray(activeCategories) && activeCategories.length
    ? activeCategories.reduce((sum, cat) => sum + Number(cat.amount ?? cat.defaultAmount ?? cat.fee ?? cat.totalFee ?? 0), 0)
    : 0;
  const totalAmount = receipt.data?.totalAmount ?? receipt.data?.totalFee ?? (categoryTotal || payment?.totalFee || Object.values(breakdownObject).reduce((sum, value) => sum + Number(value || 0), 0));
  const amountPaid = receipt.data?.amountPaid ?? payment?.amountPaid ?? 0;
  const dueAmount = receipt.data?.dueAmount ?? payment?.dueAmount ?? Math.max(0, totalAmount - amountPaid);
  const studentData = {
    name: receipt.data?.student?.name || receipt.data?.student?.fullName || receipt.data?.student?.fullname || receipt.studentName || payment?.studentName || '',
    admissionNumber: receipt.data?.student?.admissionNumber || receipt.rollNumber || payment?.rollNumber || '',
    rollNumber: receipt.data?.student?.rollNumber || receipt.rollNumber || payment?.rollNumber || '',
    className: receipt.data?.student?.className || receipt.className || payment?.className || '',
    section: receipt.data?.student?.section || '',
  };

  const payload = {
    receiptId: normalizedReceiptId,
    id: normalizedReceiptId,
    receiptNumber: receipt.receiptNumber,
    paymentId: receipt.paymentId ? String(receipt.paymentId) : (payment?._id ? String(payment._id) : null),
    studentId: receipt.studentId ? String(receipt.studentId) : (payment?.studentId ? String(payment.studentId) : null),
    studentName: studentData.name,
    rollNumber: studentData.rollNumber,
    className: studentData.className,
    totalFee: totalAmount,
    totalFeeAll,
    amountPaid,
    dueAmount,
    paymentMethod: receipt.data?.paymentMethod || payment?.paymentMethod || 'Cash',
    paymentDate: receiptDate,
    feeBreakdown: feeBreakdownItems,
    status: receipt.data?.status ?? payment?.status ?? (dueAmount === 0 ? 'Paid' : 'Pending'),
    transactionId: receipt.transactionId || payment?.transactionId || null,
    pdfUrl: receipt.pdfUrl || null,
    pdfBase64: receipt.pdfUrl && typeof receipt.pdfUrl === 'string' && receipt.pdfUrl.startsWith('data:application/pdf;base64,')
      ? receipt.pdfUrl.replace('data:application/pdf;base64,', '')
      : null,
    data: {
      ...receipt.data,
      breakdown: breakdownObject,
      totalAmount,
      totalFeeAll,
      amountPaid,
      dueAmount,
      paymentMethod: receipt.data?.paymentMethod || payment?.paymentMethod || 'Cash',
      date: receiptDate,
      paymentDate: receiptDate,
      status: receipt.data?.status ?? payment?.status ?? (dueAmount === 0 ? 'Paid' : 'Pending')
    },
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  };

  return payload;
}

async function getReceipt(req, res) {
  try {
    const id = String(req.params.receiptId || req.params.id || req.query.receiptId || req.query.id || req.query.receiptNumber || '').trim();
    if (!id) return res.status(400).json({ message: 'Receipt id is required' });

    let receipt = await resolveReceiptByIdOrNumber(id);
    let payment = null;

    if (receipt && receipt.paymentId) {
      payment = await FeePayment.findById(receipt.paymentId).lean();
    }

    if (!receipt) {
      const paymentQuery = ObjectId.isValid(id)
        ? { _id: id }
        : { receiptNumber: id };
      payment = await FeePayment.findOne(paymentQuery).lean();
      if (payment) {
        receipt = await FeeReceipt.findOne({ paymentId: payment._id }).lean() || payment;
      }
    }

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if (!receipt.paymentId && payment && payment._id) {
      receipt.paymentId = payment._id;
    }
    if (!receipt.receiptId && receipt._id) {
      receipt.receiptId = receipt._id.toString();
    }

    const categories = await enrichReceiptCategories(receipt, payment);
    
    // Fetch full student record for selection map
    let studentRecord = null;
    const studentId = receipt.data?.student?._id || receipt.studentId || payment?.studentId;
    if (studentId) {
      try {
        studentRecord = await Student.findById(studentId).lean();
      } catch (err) {
        console.warn('Could not fetch student for receipt:', err);
      }
    }
    if (!studentRecord) {
      studentRecord = receipt.data?.student || payment?.student || {};
    }
    
    const payload = buildReceiptPayload(receipt, payment, categories, studentRecord);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getPayment(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ message: 'Payment id is required' });

    const query = ObjectId.isValid(id)
      ? { _id: id }
      : { receiptNumber: id };

    const payment = await FeePayment.findOne(query).lean();
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const receipt = await FeeReceipt.findOne({ paymentId: payment._id }).lean();
    const payload = {
      ...payment,
      receipt: receipt || null,
      pdfBase64: receipt?.pdfUrl && typeof receipt.pdfUrl === 'string' && receipt.pdfUrl.startsWith('data:application/pdf;base64,')
        ? receipt.pdfUrl.replace('data:application/pdf;base64,', '')
        : null,
      receiptUrl: receipt?.pdfUrl || null,
    };
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getPaymentPdf(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ message: 'Payment id is required' });

    const query = ObjectId.isValid(id)
      ? { _id: id }
      : { receiptNumber: id };

    const payment = await FeePayment.findOne(query).lean();
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const receipt = await FeeReceipt.findOne({ paymentId: payment._id }).lean();
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    const pdfBase64 = receipt.pdfUrl && typeof receipt.pdfUrl === 'string' && receipt.pdfUrl.startsWith('data:application/pdf;base64,')
      ? receipt.pdfUrl.replace('data:application/pdf;base64,', '')
      : null;

    res.json({ pdfBase64, pdfUrl: receipt.pdfUrl || null, receipt, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function classStudents(req, res) {
  try {
    const { classId } = req.params;
    const page = parseInt(req.query.page||'1',10);
    const limit = Math.min(parseInt(req.query.limit||'20',10), 100);
    const skip = (page-1)*limit;
    const countOnly = String(req.query.countOnly || '').toLowerCase() === 'true';

    const studentQuery = await buildStudentClassQuery(classId);
    if (!studentQuery) return res.status(400).json({ message: 'Class filter invalid or not provided' });
    if (countOnly) {
      const count = await Student.countDocuments(studentQuery);
      return res.json({ count });
    }

    const students = await Student.find(studentQuery).skip(skip).limit(limit).lean();

    const studentIds = students.map(s=>s._id);
    const payments = await FeePayment.find({ studentId: { $in: studentIds } }).lean();
    const paymentsByStudent = {};
    payments.forEach((payment) => {
      const studentKey = String(payment.studentId);
      if (!paymentsByStudent[studentKey]) paymentsByStudent[studentKey] = [];
      paymentsByStudent[studentKey].push(payment);
    });

    const receipts = await FeeReceipt.find({ studentId: { $in: studentIds } }).lean();
    const receiptsByStudent = {};
    receipts.forEach((receipt) => {
      const studentKey = String(receipt.studentId);
      if (!receiptsByStudent[studentKey]) receiptsByStudent[studentKey] = [];
      receiptsByStudent[studentKey].push(receipt);
    });

    const resolvedClassId = await resolveClassObjectId(classId);
    let classCategories = [];
    if (resolvedClassId) {
      classCategories = await FeeCategory.find({ classId: resolvedClassId, status: 'active' }).lean();
    }

    const categoryPaidByStudent = {};
    Object.entries(paymentsByStudent).forEach(([studentKey, studentPayments]) => {
      categoryPaidByStudent[studentKey] = {};
      studentPayments.forEach((payment) => {
        const breakdown = payment.breakdown || {};
        let hadCategoryAmount = false;
        Object.entries(breakdown).forEach(([category, value]) => {
          if (!category) return;
          const key = normalizeKey(category);
          const amount = Number(value || 0);
          if (Number.isNaN(amount) || amount <= 0) return;
          hadCategoryAmount = true;
          categoryPaidByStudent[studentKey][key] = (categoryPaidByStudent[studentKey][key] || 0) + amount;
        });
        if (!hadCategoryAmount) {
          categoryPaidByStudent[studentKey].__unallocated = (categoryPaidByStudent[studentKey].__unallocated || 0) + Number(payment.amountPaid || 0);
        }
      });
    });

    const rows = students.map(s=>{
      const studentSummary = buildAssignedFeeSummary(s, classCategories, paymentsByStudent[s._id.toString()] || [], receiptsByStudent[s._id.toString()] || []);
      const { totalFee, totalPaid, totalDue, feeBreakdownItems: feeBreakdown } = studentSummary;
      const feeBreakdownFormatted = feeBreakdown.map(item => ({
        category: item.category,
        amount: item.actualFee,
        paid: item.paidFee,
        due: item.dueAmount,
        status: item.status,
        locked: item.dueAmount === 0,
        selected: true,
        categoryType: item.categoryType
      }));
      const status = totalDue === 0 ? (totalPaid > 0 ? 'Paid' : 'Unpaid') : (totalPaid > 0 ? 'Partial' : 'Unpaid');

      const studentName = s.name || s.fullName || s.fullname || ((s.firstName || s.lastName) ? `${s.firstName || ''}${s.firstName && s.lastName ? ' ' : ''}${s.lastName || ''}` : '');

      return {
        rollNumber: s.rollNumber || s.admissionNumber || '-',
        admissionNumber: s.admissionNumber,
        studentId: s._id,
        name: studentName || '-',
        parentName: s.parentName,
        contactNumber: s.contactNumber,
        feeStatus: status,
        totalFee,
        paidAmount: totalPaid,
        dueAmount: totalDue,
        feeBreakdown: feeBreakdownFormatted
      };
    });

    res.json({ page, limit, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function studentProfile(req, res) {
  try {
    const { studentId } = req.params;
    // Primary: treat `studentId` as Student._id
    let student = null;
    if (studentId) {
      try {
        student = await Student.findById(studentId).populate('class', 'name section numeric').lean();
      } catch (e) {
        student = null;
      }
    }

    // Fallback: if not found by _id, maybe caller passed the User id — try to find Student linked to that user
    if (!student && studentId) {
      try {
        student = await Student.findOne({ user: studentId }).populate('class', 'name section numeric').lean();
      } catch (e) {
        student = null;
      }
    }

    // Final fallback: try to find Student by authenticated user (useful when frontend didn't pass an id)
    if (!student && req.user && (req.user.id || req.user._id)) {
      try {
        const uid = req.user.id || req.user._id;
        student = await Student.findOne({ user: uid }).populate('class', 'name section numeric').lean();
      } catch (e) {
        student = null;
      }
    }

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Resolve payments/receipts by studentId (primary key)
    const studentObjectId = student._id ? String(student._id) : null;
    const studentRecordQuery = studentObjectId ? { studentId: studentObjectId } : {};
    
    // Also try by rollNumber and admissionNumber as fallback
    const orClauses = [];
    if (studentObjectId) {
      orClauses.push({ studentId: studentObjectId });
    }
    if (student.rollNumber) orClauses.push({ rollNumber: String(student.rollNumber) });
    if (student.admissionNumber) orClauses.push({ admissionNumber: String(student.admissionNumber) });
    
    const query = orClauses.length > 1 ? { $or: orClauses } : studentRecordQuery;
    const payments = await FeePayment.find(query).sort({ createdAt: -1 }).lean();
    const receipts = await FeeReceipt.find(query).sort({ createdAt: -1 }).lean();

    console.log(`[studentProfile] Student: ${student.name} (${studentObjectId}), Payments: ${payments.length}, Receipts: ${receipts.length}`);

    const resolvedClassId = await resolveClassObjectId(student.classId || student.class || student.className);
    const classCategories = resolvedClassId ? await FeeCategory.find({ classId: resolvedClassId, status: 'active' }).lean() : [];
    const studentSummary = buildAssignedFeeSummary(student, classCategories, payments, receipts);

    const totalPaid = Math.max(0, studentSummary.totalPaid || 0);
    const totalDue = Math.max(0, studentSummary.totalDue || 0);
    const totalFee = Math.max(0, studentSummary.totalFee || 0);
    const feeBreakdownItems = studentSummary.feeBreakdownItems || [];

    res.json({ student, payments, summary: { totalPaid, totalDue, totalFee, feeBreakdown: feeBreakdownItems } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function generateReceiptPDF(receiptData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const buffers = [];
      doc.on('data', (d)=>buffers.push(d));
      doc.on('end', ()=>{
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const schoolName = 'BAL BODH SECONDARY SCHOOL';
      const schoolAddress = 'Kanchanpur-08, Saptari, Nepal';
      const student = receiptData.student || {};
      const studentName = student.name || 'N/A';
      const studentRoll = student.rollNumber || student.admissionNumber || '-';
      const studentClass = student.className || student.classId || '-';
      const receiptNo = receiptData.receiptNumber || 'N/A';
      const receiptDate = receiptData.date ? new Date(receiptData.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 30;
      const contentWidth = pageWidth - (margin * 2);

      // Header with School Name in Red
      doc.fontSize(20).fillColor('#b91c1c').font('Helvetica-Bold').text(schoolName, margin, margin, { align: 'center', width: contentWidth });
      doc.fontSize(11).fillColor('#333').font('Helvetica').text(schoolAddress, { align: 'center', width: contentWidth });
      doc.moveTo(margin, doc.y + 5).lineTo(margin + contentWidth, doc.y + 5).strokeColor('#ddd').stroke();
      doc.moveDown(1);

      // Student Information Section
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text('STUDENT INFORMATION', margin, doc.y);
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      const infoY = doc.y;
      doc.text(`Student Name: ${studentName}`, margin);
      doc.text(`Roll No: ${studentRoll}`);
      doc.text(`Class: ${studentClass}`);
      doc.text(`Receipt No: ${receiptNo}`);
      doc.text(`Date: ${receiptDate}`);
      doc.moveDown(0.8);

      // Fee Breakdown Table
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text('FEE BREAKDOWN', margin, doc.y);
      doc.moveDown(0.4);

      const col1Width = 150;
      const col2Width = 90;
      const col3Width = 90;
      const col4Width = 90;
      const tableStartX = margin;
      const tableStartY = doc.y;

      // Table Header Background
      doc.rect(tableStartX, tableStartY, contentWidth, 22).fill('#000');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
      doc.text('Fee Head', tableStartX + 5, tableStartY + 4);
      doc.text('Total Fee', tableStartX + col1Width + 5, tableStartY + 4, { align: 'right', width: col2Width - 10 });
      doc.text('Paid Till Date', tableStartX + col1Width + col2Width + 5, tableStartY + 4, { align: 'right', width: col3Width - 10 });
      doc.text('Due', tableStartX + col1Width + col2Width + col3Width + 5, tableStartY + 4, { align: 'right', width: col4Width - 10 });

      doc.fillColor('#000');
      let currentY = tableStartY + 22;

      // Table Rows - only show categories that were paid or have a due amount
      const categories = receiptData.categories || [];
      const breakdown = receiptData.breakdown || {};
      doc.fontSize(8).font('Helvetica');

      // Filter to show only categories that have amounts in breakdown
      const displayCategories = categories.filter(cat => {
        const categoryName = cat.name || cat.category || 'Fee';
        const paidAmount = Number(breakdown[categoryName] || 0);
        return paidAmount > 0; // Only show if something was paid for this category
      });

      if (displayCategories.length > 0) {
        displayCategories.forEach((cat, idx) => {
          const categoryName = cat.name || cat.category || 'Fee';
          const totalAmount = Number(cat.amount || cat.defaultAmount || 0);
          const paidAmount = Number(breakdown[categoryName] || 0);
          const dueAmount = Math.max(0, totalAmount - paidAmount);

          // Row background
          if (idx % 2 === 0) {
            doc.rect(tableStartX, currentY, contentWidth, 18).fill('#f9f9f9');
          }
          doc.fillColor('#000');

          // Text
          const rowText = categoryName.substring(0, 25);
          doc.text(rowText, tableStartX + 5, currentY + 2);
          doc.text(formatCurrency(totalAmount), tableStartX + col1Width + 5, currentY + 2, { align: 'right', width: col2Width - 10 });
          doc.text(formatCurrency(paidAmount), tableStartX + col1Width + col2Width + 5, currentY + 2, { align: 'right', width: col3Width - 10 });
          doc.text(formatCurrency(dueAmount), tableStartX + col1Width + col2Width + col3Width + 5, currentY + 2, { align: 'right', width: col4Width - 10 });

          currentY += 18;
        });
      } else {
        // Fallback: if no categories match, show breakdown entries directly
        Object.entries(breakdown).forEach(([categoryName, paidAmount], idx) => {
          paidAmount = Number(paidAmount || 0);
          if (paidAmount <= 0) return;

          if (idx % 2 === 0) {
            doc.rect(tableStartX, currentY, contentWidth, 18).fill('#f9f9f9');
          }
          doc.fillColor('#000');

          const rowText = categoryName.substring(0, 25);
          doc.text(rowText, tableStartX + 5, currentY + 2);
          doc.text(formatCurrency(paidAmount), tableStartX + col1Width + 5, currentY + 2, { align: 'right', width: col2Width - 10 });
          doc.text(formatCurrency(paidAmount), tableStartX + col1Width + col2Width + 5, currentY + 2, { align: 'right', width: col3Width - 10 });
          doc.text(formatCurrency(0), tableStartX + col1Width + col2Width + col3Width + 5, currentY + 2, { align: 'right', width: col4Width - 10 });

          currentY += 18;
        });
      }

      // Table Border
      doc.strokeColor('#000').lineWidth(1);
      doc.rect(tableStartX, tableStartY, contentWidth, currentY - tableStartY).stroke();

      // Vertical lines for columns
      doc.moveTo(tableStartX + col1Width, tableStartY).lineTo(tableStartX + col1Width, currentY).stroke();
      doc.moveTo(tableStartX + col1Width + col2Width, tableStartY).lineTo(tableStartX + col1Width + col2Width, currentY).stroke();
      doc.moveTo(tableStartX + col1Width + col2Width + col3Width, tableStartY).lineTo(tableStartX + col1Width + col2Width + col3Width, currentY).stroke();

      doc.moveDown(2);

      // Receipt Summary Section - with proper spacing
      const totalFeeAll = Number(receiptData.totalFeeAll || receiptData.totalAmount || 0);
      const totalPaidTillDate = Number(receiptData.totalPaidTillDate || receiptData.amountPaid || 0);
      const totalDueAmount = Math.max(0, totalFeeAll - totalPaidTillDate);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('RECEIPT SUMMARY', margin, doc.y);
      doc.moveDown(0.6);
      doc.fontSize(9).font('Helvetica').fillColor('#333');

      const summaryLines = [
        `Total Fee (All Categories): ${formatCurrency(totalFeeAll)}`,
        `Amount Paid Today: ${formatCurrency(receiptData.amountPaid || 0)}`,
        `Total Paid Till Date: ${formatCurrency(totalPaidTillDate)}`,
      ];

      summaryLines.forEach(line => {
        doc.text(line, margin, { width: contentWidth });
        doc.moveDown(0.4);
      });

      // Due Amount in Red
      doc.font('Helvetica-Bold').fillColor('#b91c1c').fontSize(10);
      doc.text(`Due Amount: ${formatCurrency(totalDueAmount)}`, margin, { width: contentWidth });
      doc.moveDown(0.4);

      // Status
      const status = totalDueAmount === 0 ? 'FULLY PAID' : 'PARTIALLY PAID';
      const statusColor = totalDueAmount === 0 ? '#22c55e' : '#f59e0b';
      doc.font('Helvetica-Bold').fillColor(statusColor).fontSize(10);
      doc.text(`Status: ${status}`, margin, { width: contentWidth });
      doc.moveDown(1.5);

      // Footer with Signatures
      doc.fontSize(8).fillColor('#000').font('Helvetica');
      doc.text('Accountant Signature', margin);
      doc.text('Authorized Signature', margin + (contentWidth * 0.65));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function collectFee(req, res) {
  try {
    const body = req.body;
    // expected fields: studentId, classId, breakdown{}, amountPaid, paymentMethod, transactionId, referenceNumber, feeMonth, discount
    const { studentId, classId } = body;
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const breakdown = body.breakdown || {};
    const breakdownObject = normalizeBreakdownObject(breakdown);
    const breakdownTotal = Object.values(breakdownObject).reduce((sum, value) => sum + (Number(value || 0) || 0), 0);
    const discount = Math.max(0, Number(body.discount || 0));
    const paymentClassId = await resolveClassObjectId(classId) || student.classId || undefined;
    const resolvedClassId = paymentClassId || student.classId;
    const classCategories = resolvedClassId ? await FeeCategory.find({ classId: resolvedClassId, status: 'active' }).lean() || [] : [];

    const previousPayments = await FeePayment.find({ studentId }).lean() || [];
    const previousReceipts = await FeeReceipt.find({ studentId }).lean() || [];
    const studentSummary = buildAssignedFeeSummary(student, classCategories, previousPayments, previousReceipts);
    const remainingDue = Math.max(0, studentSummary.totalDue || 0);
    const rawAmountPaid = body.amountPaid || body.paidToday;
    const amountPaid = Number(rawAmountPaid || breakdownTotal || 0);
    const payableLimit = Math.max(0, remainingDue - discount);

    if (remainingDue === 0) {
      return res.status(400).json({ message: 'Student has no pending dues. Payment cannot be collected.' });
    }
    if (Number.isNaN(amountPaid) || amountPaid <= 0) {
      return res.status(400).json({ message: 'Enter a valid payment amount.' });
    }
    if (amountPaid > payableLimit) {
      return res.status(400).json({ message: `Maximum payable amount is ₹${payableLimit}.` });
    }

    const paymentCategoryTotals = {};
    const categoryLabelByKey = {};
    Object.entries(breakdownObject).forEach(([category, value]) => {
      const paidAmount = Number(value || 0);
      if (Number.isNaN(paidAmount) || paidAmount <= 0) return;
      const categoryKey = normalizeKey(category);
      if (!categoryKey) return;
      if (!categoryLabelByKey[categoryKey]) categoryLabelByKey[categoryKey] = String(category).trim() || categoryKey;
      paymentCategoryTotals[categoryKey] = (paymentCategoryTotals[categoryKey] || 0) + paidAmount;
    });

    const storedBreakdown = Object.entries(paymentCategoryTotals).reduce((acc, [categoryKey, total]) => {
      const label = categoryLabelByKey[categoryKey] || categoryKey;
      acc[label] = total;
      return acc;
    }, {});

    const breakdownTotalValidated = Object.values(paymentCategoryTotals).reduce((sum, value) => sum + value, 0);
    if (breakdownTotalValidated !== amountPaid) {
      return res.status(400).json({ message: 'Payment amount must equal the sum of category allocations.' });
    }

    const currentDueMap = studentSummary.feeBreakdownItems.reduce((acc, item) => {
      if (!item || !item.category) return acc;
      acc[normalizeKey(item.category)] = Number(item.dueAmount || 0);
      return acc;
    }, {});

    const invalidCategories = [];
    const overpaidCategories = [];
    Object.entries(paymentCategoryTotals).forEach(([categoryKey, paidAmount]) => {
      const due = currentDueMap[categoryKey];
      if (due == null) {
        invalidCategories.push(categoryLabelByKey[categoryKey] || categoryKey);
        return;
      }
      if (paidAmount > due) {
        overpaidCategories.push({ category: categoryLabelByKey[categoryKey] || categoryKey, due });
      }
    });

    if (invalidCategories.length) {
      return res.status(400).json({ message: `Cannot collect payment for these categories: ${invalidCategories.join(', ')}.` });
    }
    if (overpaidCategories.length) {
      const details = overpaidCategories.map((item) => `${item.category} (maximum ₹${item.due})`).join(', ');
      return res.status(400).json({ message: `Payment exceeds pending due for: ${details}.` });
    }

    const rollNumber = student.admissionNumber || student.rollNumber || '';
    const studentName = getStudentName(student);
    const className = student.className || student.class || '';

    const payment = await FeePayment.create({
      studentId,
      classId: paymentClassId,
      receiptNumber,
      paymentMethod: body.paymentMethod || 'Cash',
      transactionId: body.transactionId,
      referenceNumber: body.referenceNumber,
      amountPaid,
      paidToday: amountPaid,
      dueAmount: Math.max(0, payableLimit - amountPaid),
      discount,
      totalFee: studentSummary.totalFee,
      rollNumber,
      studentName,
      className,
      status: Math.max(0, payableLimit - amountPaid) === 0 ? (amountPaid > 0 ? 'Paid' : 'Unpaid') : (amountPaid > 0 ? 'Partial' : 'Unpaid'),
      feeMonth: body.feeMonth,
      breakdown: storedBreakdown,
      remarks: body.remarks
    });

    const validPreviousReceipts = getValidReceipts(previousReceipts);
    const totalPaidTillDate = validPreviousReceipts.reduce((sum, receipt) => sum + Number(receipt.data?.amountPaid ?? receipt.data?.amount ?? receipt.amountPaid ?? 0), amountPaid);

    const receiptData = {
      schoolName: 'BAL BODH SECONDARY SCHOOL',
      schoolAddress: 'Kanchanpur-08, Saptari, Nepal',
      receiptNumber,
      date: new Date(),
      student: {
        name: getStudentName(student),
        admissionNumber: student.admissionNumber,
        rollNumber,
        parentName: student.parentName,
        contactNumber: student.contactNumber,
        classId: student.classId,
        className: student.className,
        section: student.section
      },
      categories: classCategories,
      breakdown: storedBreakdown,
      totalAmount: amountPaid,
      discount,
      amountPaid,
      dueAmount: Math.max(0, payableLimit - amountPaid),
      totalFeeAll: studentSummary.totalFee,
      totalPaidTillDate,
      paymentMethod: body.paymentMethod || 'Cash'
    };

    let pdfBase64 = null;
    try {
      const pdfBuffer = await generateReceiptPDF(receiptData);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfErr) {
      console.warn('Unable to generate receipt PDF. Returning payment/receipt without PDF data.', pdfErr);
    }

    const receipt = await FeeReceipt.create({
      receiptNumber,
      paymentId: payment._id,
      studentId,
      rollNumber,
      studentName,
      className,
      transactionId: body.transactionId,
      data: receiptData,
      pdfUrl: null
    });

    // Create StudentFeeLock entries for any fully-paid categories in this payment
    try {
      const StudentFeeLock = require('../models/StudentFeeLock');
      // storedBreakdown uses label => amount mapping
      for (const [label, paidAmount] of Object.entries(storedBreakdown || {})) {
        const paid = Number(paidAmount || 0);
        if (paid <= 0) continue;
        // Find matching FeeCategory by classId and name (case-insensitive)
        const fc = await FeeCategory.findOne({ classId: resolvedClassId, name: new RegExp('^' + escapeRegex(String(label).trim()) + '$', 'i') }).lean();
        if (!fc) continue;
        const catAmount = Number(fc.amount || fc.defaultAmount || 0);
        if (paid >= catAmount && catAmount > 0) {
          try {
            await StudentFeeLock.findOneAndUpdate({ studentId, feeCategoryId: fc._id }, {
              studentId,
              feeCategoryId: fc._id,
              feeName: fc.name,
              classId: resolvedClassId,
              locked: true,
              lockedAt: new Date(),
              reason: 'Fully paid via collectFee endpoint'
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
          } catch (errLock) {
            console.warn('Failed to upsert StudentFeeLock for collectFee:', errLock.message);
          }
        }
      }
    } catch (err) {
      console.warn('Skipping StudentFeeLock creation in collectFee:', err.message);
    }

    res.json({ 
      payment, 
      receipt: {
        ...receipt.toObject(),
        ...(pdfBase64 ? { pdfBase64 } : {})
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function initializeFees(req, res) {
  try {
    const { classId, entries } = req.body;
    if (!classId) return res.status(400).json({ message: 'classId is required' });
    if (!Array.isArray(entries)) return res.status(400).json({ message: 'entries must be an array' });

    const resolvedClassId = await resolveClassObjectId(classId);
    const createdPayments = [];

    for (const entry of entries) {
      if (!entry.studentId) continue;

      const student = await Student.findById(entry.studentId).lean();
      if (!student) continue;

      const amountPaid = Number(entry.paidAmount || 0);
      const totalFee = Number(entry.totalFee || 0);
      const dueAmount = Number(entry.dueAmount != null ? entry.dueAmount : Math.max(0, totalFee - amountPaid));
      const status = dueAmount === 0 ? (amountPaid > 0 ? 'Paid' : 'Pending') : (amountPaid > 0 ? 'Partial' : 'Pending');
      const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const paymentClassId = resolvedClassId || student.classId || undefined;

      const rollNumber = student.admissionNumber || student.rollNumber || '';
      const studentName = student.name || '';
      const className = student.className || student.class || '';

      const payment = await FeePayment.create({
        studentId: entry.studentId,
        classId: paymentClassId,
        receiptNumber,
        paymentMethod: 'Cash',
        amountPaid,
        paidToday: amountPaid,
        dueAmount,
        discount: 0,
        totalFee,
        rollNumber,
        studentName,
        className,
        status,
        breakdown: entry.breakdown || { totalFee },
        remarks: entry.remarks || 'Initialized fee records',
      });

      createdPayments.push(payment);
    }

    res.json({ created: createdPayments.length, payments: createdPayments });
  } catch (err) {
    console.error('Failed to initialize fees:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function feeHistory(req, res) {
  try {
    const { studentId: paramId } = req.params;

    // Resolve the student identifier: accept Student._id, User._id, rollNumber or admissionNumber
    let resolvedStudent = null;
    if (paramId) {
      // try as Student._id
      try { resolvedStudent = await Student.findById(paramId).lean(); } catch (e) { resolvedStudent = null; }
      // try as linked user id
      if (!resolvedStudent) {
        try { resolvedStudent = await Student.findOne({ user: paramId }).lean(); } catch (e) { resolvedStudent = null; }
      }
      // try as rollNumber / admissionNumber
      if (!resolvedStudent) {
        try { resolvedStudent = await Student.findOne({ $or: [ { rollNumber: paramId }, { admissionNumber: paramId } ] }).lean(); } catch (e) { resolvedStudent = null; }
      }
    }

    // If still not resolved, try authenticated user
    if (!resolvedStudent && req.user && (req.user.id || req.user._id)) {
      const uid = req.user.id || req.user._id;
      try { resolvedStudent = await Student.findOne({ user: uid }).lean(); } catch (e) { resolvedStudent = null; }
    }

    if (!resolvedStudent) return res.status(404).json({ message: 'Student not found' });

    const studentId = String(resolvedStudent._id);
    
    // Fetch ALL receipts (no limit, no skip) and payments so we can merge them
    const receipts = await FeeReceipt.find({ studentId }).sort({ createdAt: -1 }).lean();
    console.log(`[feeHistory] Fetched ${receipts.length} receipts for student ${studentId}`);

    // Get valid receipts (filters by status)
    const validReceipts = receipts.filter(r => r && isReceiptValid(r));
    console.log(`[feeHistory] ${validReceipts.length} valid receipts after filtering`);

    // Also fetch payments to include legacy/initialized payments that may not have receipts
    const payments = await FeePayment.find({ studentId }).sort({ createdAt: -1 }).lean();

    // Build a map of paymentIds that already have receipts to avoid duplicate entries
    const paymentIdsWithReceipts = new Set(validReceipts.map(r => String(r.paymentId)).filter(Boolean));

    // Map receipts to history records
    const receiptRecords = validReceipts.map((receipt) => {
      const amount = Number(receipt.data?.amountPaid ?? receipt.data?.amount ?? receipt.amountPaid ?? 0);
      return {
        id: receipt._id,
        paymentId: receipt.paymentId || null,
        receiptId: receipt._id,
        receiptNumber: receipt.receiptNumber || null,
        date: receipt.createdAt || receipt.data?.date || receipt.date || null,
        feeMonth: receipt.data?.feeMonth || receipt.feeMonth || null,
        amount,
        amountPaid: amount,
        paidToday: amount,
        totalFee: Number(receipt.data?.totalFeeAll ?? receipt.data?.totalAmount ?? receipt.totalFee ?? 0),
        rollNumber: receipt.rollNumber || receipt.data?.student?.rollNumber || receipt.data?.student?.admissionNumber || '',
        studentName: receipt.studentName || receipt.data?.student?.name || '',
        className: receipt.className || receipt.data?.student?.className || receipt.data?.student?.class || '',
        paymentMethod: receipt.data?.paymentMethod || receipt.paymentMethod || 'Unknown',
        status: receipt.data?.status || receipt.status || 'Paid',
        receiptUrl: receipt.pdfUrl || null,
        breakdown: receipt.data?.breakdown || {},
        pdfBase64: receipt.pdfUrl && typeof receipt.pdfUrl === 'string' && receipt.pdfUrl.startsWith('data:application/pdf;base64,')
          ? receipt.pdfUrl.replace('data:application/pdf;base64,', '')
          : null,
      };
    });

    // Include payment records for payments that don't have a corresponding valid receipt
    const paymentOnlyRecords = (payments || []).filter(p => !paymentIdsWithReceipts.has(String(p._id))).map((payment) => ({
      id: payment._id,
      paymentId: payment._id,
      receiptId: payment._id,
      receiptNumber: payment.receiptNumber || null,
      date: payment.createdAt || payment.date || null,
      feeMonth: payment.feeMonth || null,
      amount: Number(payment.amountPaid || payment.paidToday || 0),
      amountPaid: Number(payment.amountPaid || payment.paidToday || 0),
      paidToday: Number(payment.amountPaid || payment.paidToday || 0),
      totalFee: Number(payment.totalFee || 0),
      rollNumber: payment.rollNumber || '',
      studentName: payment.studentName || '',
      className: payment.className || '',
      paymentMethod: payment.paymentMethod || 'Unknown',
      status: payment.status || 'Paid',
      receiptUrl: payment.receiptUrl || null,
      breakdown: payment.breakdown || {},
      pdfBase64: payment.pdfBase64 || null,
    }));

    // Merge receipts and payment-only records, sort by date desc
    const merged = [...receiptRecords, ...paymentOnlyRecords].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    console.log(`[feeHistory] Returning ${merged.length} history records (receipts: ${receiptRecords.length}, payments-only: ${paymentOnlyRecords.length})`);
    return res.json(merged);

  } catch (err) {
    console.error('[feeHistory] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Fee categories and structures
async function listCategories(req, res) {
  try {
    const query = {};
    if (req.query.classId) {
      let classFilter = String(req.query.classId).trim();
      const resolvedClassId = await resolveClassObjectId(classFilter);
      if (resolvedClassId) {
        classFilter = resolvedClassId;
      } else {
        const cls = await ClassModel.findOne({ name: new RegExp(`^${escapeRegex(classFilter)}$`, 'i') }).lean();
        if (cls) classFilter = cls._id.toString();
      }
      query.classId = classFilter;
    }
    if (req.query.status) {
      const status = String(req.query.status).trim().toLowerCase();
      if (['active', 'inactive'].includes(status)) query.status = status;
    }
    const cats = await FeeCategory.find(query).sort({ name: 1 }).lean();
    res.json(cats.map(cat => ({
      ...cat,
      amount: Number(cat.amount || cat.defaultAmount || 0)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createCategory(req, res) {
  try {
    const { classId, name, description, amount, defaultAmount, status, categoryType } = req.body;
    if (!classId) return res.status(400).json({ message: 'classId is required' });
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const resolvedClassId = await resolveClassObjectId(classId);
    if (!resolvedClassId) return res.status(400).json({ message: 'Invalid classId' });
    const c = new FeeCategory({
      classId: resolvedClassId,
      name: name.trim(),
      description,
      amount: Number(amount ?? defaultAmount ?? 0),
      defaultAmount: Number(defaultAmount ?? amount ?? 0),
      categoryType: ['Mandatory Fee', 'Optional Service'].includes(categoryType) ? categoryType : 'Mandatory Fee',
      status: status === 'inactive' ? 'inactive' : 'active',
    });
    await c.save();
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { classId, name, description, amount, defaultAmount, status, categoryType } = req.body;
    const payload = {};
    if (classId !== undefined) {
      const resolvedClassId = await resolveClassObjectId(classId);
      if (!resolvedClassId) return res.status(400).json({ message: 'Invalid classId' });
      payload.classId = resolvedClassId;
    }
    if (name !== undefined) payload.name = name.trim();
    if (description !== undefined) payload.description = description;
    if (amount !== undefined) payload.amount = Number(amount);
    if (defaultAmount !== undefined) payload.defaultAmount = Number(defaultAmount);
    if (categoryType !== undefined && ['Mandatory Fee', 'Optional Service'].includes(categoryType)) payload.categoryType = categoryType;
    if (status !== undefined && ['active', 'inactive'].includes(status)) payload.status = status;
    const c = await FeeCategory.findByIdAndUpdate(id, payload, { new: true });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    await FeeCategory.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Class fee structure endpoints
async function getClassStructure(req, res) {
  try {
    const { classId } = req.params;
    const resolvedClassId = await resolveClassObjectId(classId);
    const categories = resolvedClassId ? await FeeCategory.find({ classId: resolvedClassId }).sort({ name: 1 }).lean() : [];
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function saveClassStructure(req, res) {
  try {
    const { classId } = req.params;
    const resolvedClassId = await resolveClassObjectId(classId);
    if (!resolvedClassId) return res.status(400).json({ message: 'Invalid classId' });

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    await FeeCategory.deleteMany({ classId: resolvedClassId });

    const docs = items.map((it) => {
      const name = it.name || it.categoryName || it.category || '';
      const amount = Number(it.amount || 0) || 0;
      return {
        classId: resolvedClassId,
        name: name.trim(),
        description: it.description || '',
        amount,
        defaultAmount: amount,
        categoryType: ['Mandatory Fee', 'Optional Service'].includes(it.categoryType) ? it.categoryType : 'Mandatory Fee',
        status: it.status === 'inactive' ? 'inactive' : 'active'
      };
    }).filter(item => item.name);

    if (docs.length) await FeeCategory.insertMany(docs);
    const categories = await FeeCategory.find({ classId: resolvedClassId }).sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getAllClassStructures(req, res) {
  try {
    const classes = await ClassModel.find().sort({ name: 1 }).lean();
    const categories = await FeeCategory.find().lean();

    const structuresByClass = classes.map(cl => {
      const classItems = categories.filter(item => item.classId?.toString() === cl._id.toString());
      const items = classItems.map(item => ({
        category: item.name,
        amount: Number(item.amount || item.defaultAmount || 0),
        categoryType: item.categoryType || 'Mandatory Fee',
        status: item.status || 'active'
      }));
      const lastUpdated = classItems.reduce((latest, item) => {
        const updated = item.updatedAt ? new Date(item.updatedAt) : null;
        if (!updated) return latest;
        return !latest || updated > latest ? updated : latest;
      }, null);
      const total = items.reduce((sum, row) => sum + Number(row.amount || 0), 0);

      return {
        classId: cl._id,
        className: cl.name,
        items,
        total,
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null
      };
    });

    res.json({ structures: structuresByClass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function allPayments(req, res) {
  try {
    const query = {};
    if (req.query.classId && ObjectId.isValid(req.query.classId)) {
      query.classId = req.query.classId;
    }
    if (req.query.className) {
      query.className = new RegExp(`^${escapeRegex(String(req.query.className).trim())}$`, 'i');
    }
    if (req.query.studentId && ObjectId.isValid(req.query.studentId)) {
      query.studentId = req.query.studentId;
    }

    if (req.query.receiptNumber) {
      query.receiptNumber = String(req.query.receiptNumber).trim();
    }

    if (req.query.month || req.query.year) {
      const monthName = String(req.query.month || '').trim();
      const yearValue = String(req.query.year || '').trim();
      let startDate = null;
      let endDate = null;
      if (monthName && yearValue) {
        const monthDate = new Date(`${monthName} 1, ${yearValue}`);
        if (!Number.isNaN(monthDate.getTime())) {
          startDate = new Date(monthDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
        }
      } else if (yearValue) {
        const yearNum = parseInt(yearValue, 10);
        if (!Number.isNaN(yearNum)) {
          startDate = new Date(yearNum, 0, 1);
          endDate = new Date(yearNum + 1, 0, 1);
        }
      }
      if (startDate && endDate) {
        query.createdAt = { $gte: startDate, $lt: endDate };
      }
    }

    let payments = await FeePayment.find(query).sort({ createdAt: -1 }).populate('studentId', 'name admissionNumber className rollNumber parentName').populate('classId', 'name').lean();
    // Ensure every payment has denormalized student/class info filled from linked student when possible
    const studentIdsToResolve = payments.filter(p => (!p.studentName || p.studentName === 'Unknown Student') && p.studentId).map(p => String(p.studentId));
    let resolvedStudents = {};
    if (studentIdsToResolve.length) {
      const studs = await Student.find({ _id: { $in: studentIdsToResolve } }).lean();
      studs.forEach(s => { resolvedStudents[String(s._id)] = s; });
    }
    payments = payments.map(p => {
      const s = p.studentId && resolvedStudents[String(p.studentId)] ? resolvedStudents[String(p.studentId)] : p.studentId;
      const roll = p.rollNumber || (s && (s.admissionNumber || s.rollNumber)) || '';
      const name = (s && (s.name || s.fullName || s.fullname)) || p.studentName || 'Unknown Student';
      const cls = (p.classId && p.classId.name) || (s && s.className) || p.className || '';
      return { ...p, _resolvedStudent: s || null, rollNumber: roll, studentName: name, className: cls };
    });
    const paymentIds = payments.map(p => p._id);
    const receipts = await FeeReceipt.find({ paymentId: { $in: paymentIds } }).lean();
    const receiptMap = {};
    receipts.forEach((r) => {
      if (r.paymentId) receiptMap[r.paymentId.toString()] = r;
    });

    res.json(payments.map(p => {
      const receipt = receiptMap[p._id.toString()];
      const pdfBase64 = receipt?.pdfUrl && typeof receipt.pdfUrl === 'string' && receipt.pdfUrl.startsWith('data:application/pdf;base64,')
        ? receipt.pdfUrl.replace('data:application/pdf;base64,', '')
        : null;
      return {
        id: p._id,
        paymentId: p._id,
        receiptId: receipt?._id || null,
        studentId: p.studentId?._id || p.studentId || null,
        receiptNumber: p.receiptNumber,
        rollNumber: p.rollNumber || p.studentId?.admissionNumber || p.studentId?.rollNumber || '',
        studentName: p.studentId?.name || p.studentName || 'Unknown Student',
        className: p.classId?.name || p.studentId?.className || p.className || '',
        amountPaid: p.amountPaid || 0,
        paidToday: p.paidToday || p.amountPaid || 0,
        totalFee: p.totalFee || (p.breakdown ? Object.values(p.breakdown).reduce((s,v)=>s+Number(v||0),0) : 0),
        dueAmount: p.dueAmount || 0,
        paymentMethod: p.paymentMethod || '',
        date: p.createdAt,
        status: p.status || 'Pending',
        transactionId: p.transactionId || receipt?.transactionId || null,
        receiptUrl: receipt?.pdfUrl || null,
        pdfBase64,
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updatePayment(req, res) {
  try {
    const { id } = req.params;
    const allowed = ['amountPaid','dueAmount','discount','status','transactionId','paymentMethod','remarks','breakdown','feeMonth','referenceNumber'];
    const payload = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(req.body, k)) payload[k] = req.body[k];

    const updated = await FeePayment.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Payment not found' });

    // Optionally update receipt data if present
    await FeeReceipt.updateMany({ paymentId: updated._id }, { $set: { 'data.amountPaid': updated.amountPaid, 'data.dueAmount': updated.dueAmount, 'data.breakdown': updated.breakdown } }).catch(()=>{});

    res.json({ payment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deletePayment(req, res) {
  try {
    const { id } = req.params;
    const deleted = await FeePayment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Payment not found' });

    const voidMetadata = {
      'data.status': 'Cancelled',
      'data.cancelled': true,
      'data.voidedAt': new Date(),
      'data.remarks': 'Receipt voided due to payment deletion',
    };
    if (req.user && (req.user.id || req.user._id || req.user)) {
      voidMetadata['data.voidedBy'] = String(req.user.id || req.user._id || req.user);
    }
    await FeeReceipt.updateMany({ paymentId: id }, { $set: voidMetadata }).catch(() => {});

    res.json({ message: 'Payment deleted and linked receipts voided' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function claimStudent(req, res) {
  try {
    const userId = String(req.user && (req.user.id || req.user._id || req.user) || '').trim();
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const { studentId: bodyStudentId, name, className, rollNumber } = req.body || {};
    const userObjectId = ObjectId.isValid(userId) ? ObjectId(userId) : null;

    // If client provided a specific studentId to claim, try to claim directly
    if (bodyStudentId) {
      const student = await Student.findById(bodyStudentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      if (student.user) {
        if (userObjectId && String(student.user) === String(userObjectId)) {
          return res.json({ student });
        }
        return res.status(409).json({ message: 'Student already claimed by another account' });
      }
      student.user = userObjectId || userId;
      if (!student.name && name) student.name = name;
      await student.save();
      return res.json({ student });
    }

    // Validate inputs for matching
    if (!className || !rollNumber) return res.status(400).json({ message: 'Please provide class and roll/admission number' });

    const normalizedRoll = String(rollNumber || '').trim();
    const classQuery = await buildStudentClassQuery(className);
    if (!classQuery) return res.status(400).json({ message: 'Invalid class specified' });

    const userQuery = userObjectId ? { user: userObjectId } : null;
    const unclaimedQuery = { $or: [{ user: null }, { user: { $exists: false } }] };
    const claimEligibility = userQuery ? { $or: [unclaimedQuery, userQuery] } : unclaimedQuery;

    const rollQuery = {
      $or: [
        { rollNumber: normalizedRoll },
        { admissionNumber: normalizedRoll },
        { rollNumber: new RegExp(`^${escapeRegex(normalizedRoll)}$`, 'i') },
        { admissionNumber: new RegExp(`^${escapeRegex(normalizedRoll)}$`, 'i') }
      ]
    };

    const query = { $and: [classQuery, rollQuery, claimEligibility] };

    const matches = await Student.find(query).lean();

    if (!matches || matches.length === 0) {
      return res.status(404).json({ message: 'No matching student record found' });
    }

    if (matches.length === 1) {
      const toClaim = matches[0];
      if (toClaim.user && userObjectId && String(toClaim.user) === String(userObjectId)) {
        return res.json({ student: toClaim });
      }
      const updateData = { user: userObjectId || userId };
      if (name) updateData.name = toClaim.name || name;
      const updated = await Student.findByIdAndUpdate(toClaim._id, { $set: updateData }, { new: true }).lean();
      return res.json({ student: updated });
    }

    // Multiple matches — return minimal info for user selection (id, name, className, rollNumber, admissionNumber)
    const simplified = matches.map((m) => ({ id: m._id, name: m.name || m.fullName || m.fullname, className: m.className || m.class || '', rollNumber: m.rollNumber || m.admissionNumber || '' }));
    return res.json({ message: 'Multiple matches found', matches: simplified });
  } catch (err) {
    console.error('claimStudent failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function debugPayments(req, res) {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ message: 'studentId required' });

    let student = null;
    try {
      student = await Student.findById(studentId).lean();
    } catch (e) {
      student = null;
    }

    if (!student && studentId) {
      try {
        student = await Student.findOne({ user: studentId }).lean();
      } catch (e) {
        student = null;
      }
    }

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const studentObjectId = String(student._id || studentId);
    const payments = await FeePayment.find({ studentId: studentObjectId }).lean();
    const receipts = await FeeReceipt.find({ studentId: studentObjectId }).lean();

    // Show detailed breakdown of payments and receipts
    const paymentDetails = payments.map(p => ({
      _id: String(p._id),
      receiptNumber: p.receiptNumber,
      amountPaid: p.amountPaid,
      breakdown: p.breakdown || {},
      breakdownKeys: p.breakdown ? Object.keys(p.breakdown) : [],
      breakdownValues: p.breakdown ? Object.values(p.breakdown) : [],
      createdAt: p.createdAt
    }));

    const receiptDetails = receipts.map(r => ({
      _id: String(r._id),
      paymentId: String(r.paymentId || ''),
      receiptNumber: r.receiptNumber,
      data: {
        breakdown: r.data?.breakdown || {},
        breakdownKeys: r.data?.breakdown ? Object.keys(r.data.breakdown) : [],
        breakdownValues: r.data?.breakdown ? Object.values(r.data.breakdown) : [],
        amountPaid: r.data?.amountPaid,
        totalAmount: r.data?.totalAmount
      },
      createdAt: r.createdAt
    }));

    const { categoryPaid, totalPaid } = buildPaymentAllocation(payments, receipts);

    return res.json({
      student: { _id: String(student._id), name: student.name, admissionNumber: student.admissionNumber },
      payments: paymentDetails,
      receipts: receiptDetails,
      allocation: { categoryPaid, totalPaid },
      summary: `Found ${payments.length} payments and ${receipts.length} receipts. Total allocated: ₹${totalPaid}`
    });
  } catch (err) {
    console.error('debugPayments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * GET /fees/classes-dropdown
 * Get all classes in proper sorted order for dropdown
 * Returns: [{ _id, name, displayName, order }]
 */
async function getClassesForDropdown(req, res) {
  try {
    const classUtils = require('../utils/classUtils');
    
    const classes = await ClassModel.find({})
      .select('_id name')
      .lean();
    
    // Sort using class utility
    const sorted = classUtils.sortClasses(classes);
    
    // Map to include display name and order
    const mapped = sorted.map((cls, index) => ({
      _id: cls._id,
      name: cls.name,
      displayName: classUtils.formatClassName(cls.name),
      order: classUtils.getClassOrder(cls.name),
      index: index
    }));
    
    // Log for debugging
    console.log('✓ Classes fetched and sorted:');
    mapped.forEach(cls => {
      console.log(`  ${cls.index}. ${cls.displayName} (name: "${cls.name}", order: ${cls.order})`);
    });
    
    res.json({
      success: true,
      count: mapped.length,
      data: mapped
    });
  } catch (err) {
    console.error('getClassesForDropdown error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching classes',
      error: err.message 
    });
  }
}

/**
 * POST /fees/class/:classId/assign-categories
 * Assign multiple fee categories to a class
 * Body: {
 *   "mandatory": [
 *     { "name": "Tuition", "amount": 5000, "description": "..." },
 *     { "name": "Lab", "amount": 500 }
 *   ],
 *   "optional": [
 *     { "name": "Bus Service", "amount": 1000, "description": "..." },
 *     { "name": "Hostel", "amount": 3000 }
 *   ]
 * }
 */
async function assignFeeCategoryToClass(req, res) {
  try {
    const { classId } = req.params;
    const { mandatory = [], optional = [] } = req.body;
    
    if (!classId) {
      return res.status(400).json({ 
        success: false,
        message: 'Class ID is required' 
      });
    }
    
    // Resolve class ID
    const resolvedClassId = await resolveClassObjectId(classId);
    if (!resolvedClassId) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid class ID' 
      });
    }
    
    // Validate inputs
    if (!Array.isArray(mandatory) && !Array.isArray(optional)) {
      return res.status(400).json({ 
        success: false,
        message: 'mandatory and/or optional arrays are required' 
      });
    }
    
    const results = {
      created: [],
      updated: [],
      errors: []
    };
    
    // Process mandatory categories
    for (const item of mandatory) {
      try {
        if (!item.name) {
          results.errors.push({ 
            type: 'mandatory', 
            error: 'Name is required' 
          });
          continue;
        }
        
        // Try to find existing category
        let category = await FeeCategory.findOne({
          classId: resolvedClassId,
          name: new RegExp(`^${escapeRegex(item.name.trim())}$`, 'i')
        });
        
        if (category) {
          // Update existing
          category.amount = Number(item.amount || item.defaultAmount || 0);
          category.defaultAmount = Number(item.defaultAmount || item.amount || 0);
          category.description = item.description || '';
          category.categoryType = 'Mandatory Fee';
          category.status = item.status || 'active';
          await category.save();
          results.updated.push({
            name: item.name,
            type: 'mandatory',
            _id: category._id,
            amount: category.amount
          });
        } else {
          // Create new
          category = new FeeCategory({
            classId: resolvedClassId,
            name: item.name.trim(),
            amount: Number(item.amount || item.defaultAmount || 0),
            defaultAmount: Number(item.defaultAmount || item.amount || 0),
            description: item.description || '',
            categoryType: 'Mandatory Fee',
            status: item.status || 'active'
          });
          await category.save();
          results.created.push({
            name: item.name,
            type: 'mandatory',
            _id: category._id,
            amount: category.amount
          });
        }
      } catch (err) {
        results.errors.push({
          type: 'mandatory',
          name: item.name,
          error: err.message
        });
      }
    }
    
    // Process optional categories
    for (const item of optional) {
      try {
        if (!item.name) {
          results.errors.push({ 
            type: 'optional', 
            error: 'Name is required' 
          });
          continue;
        }
        
        // Try to find existing category
        let category = await FeeCategory.findOne({
          classId: resolvedClassId,
          name: new RegExp(`^${escapeRegex(item.name.trim())}$`, 'i')
        });
        
        if (category) {
          // Update existing
          category.amount = Number(item.amount || item.defaultAmount || 0);
          category.defaultAmount = Number(item.defaultAmount || item.amount || 0);
          category.description = item.description || '';
          category.categoryType = 'Optional Service';
          category.status = item.status || 'active';
          await category.save();
          results.updated.push({
            name: item.name,
            type: 'optional',
            _id: category._id,
            amount: category.amount
          });
        } else {
          // Create new
          category = new FeeCategory({
            classId: resolvedClassId,
            name: item.name.trim(),
            amount: Number(item.amount || item.defaultAmount || 0),
            defaultAmount: Number(item.defaultAmount || item.amount || 0),
            description: item.description || '',
            categoryType: 'Optional Service',
            status: item.status || 'active'
          });
          await category.save();
          results.created.push({
            name: item.name,
            type: 'optional',
            _id: category._id,
            amount: category.amount
          });
        }
      } catch (err) {
        results.errors.push({
          type: 'optional',
          name: item.name,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Successfully assigned ${results.created.length} new and updated ${results.updated.length} categories`,
      data: results
    });
    
  } catch (err) {
    console.error('assignFeeCategoryToClass error:', err);
    res.status(500).json({
      success: false,
      message: 'Error assigning categories',
      error: err.message
    });
  }
}

/**
 * GET /fees/class/:classId/fee-structure
 * Get current fee structure for a class with separated mandatory and optional items
 */
async function getClassFeeStructureWithSeparation(req, res) {
  try {
    const { classId } = req.params;
    
    const resolvedClassId = await resolveClassObjectId(classId);
    if (!resolvedClassId) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid class ID' 
      });
    }
    
    const categories = await FeeCategory.find({ classId: resolvedClassId })
      .sort({ categoryType: -1, name: 1 })
      .lean();
    
    const mandatory = categories.filter(c => c.categoryType === 'Mandatory Fee');
    const optional = categories.filter(c => c.categoryType === 'Optional Service');
    
    const mandatoryTotal = mandatory.reduce((sum, c) => sum + (c.amount || 0), 0);
    const optionalTotal = optional.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    res.json({
      success: true,
      classId: resolvedClassId,
      data: {
        mandatory: {
          items: mandatory,
          total: mandatoryTotal,
          count: mandatory.length,
          description: 'Applied automatically to all students'
        },
        optional: {
          items: optional,
          total: optionalTotal,
          count: optional.length,
          description: 'Can be selected by individual students'
        },
        summary: {
          totalMandatory: mandatoryTotal,
          totalOptional: optionalTotal,
          grandTotal: mandatoryTotal + optionalTotal,
          totalCategories: categories.length
        }
      }
    });
    
  } catch (err) {
    console.error('getClassFeeStructureWithSeparation error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching fee structure',
      error: err.message
    });
  }
}

/**
 * GET /fees/student/:studentId/locks
 * Return fee locks for a student
 */
async function getStudentFeeLocks(req, res) {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });
    const StudentFeeLock = require('../models/StudentFeeLock');
    const locks = await StudentFeeLock.find({ studentId }).lean();
    res.json({ count: locks.length, data: locks });
  } catch (err) {
    console.error('getStudentFeeLocks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { dashboard, classStudents, studentProfile, claimStudent, collectFee, initializeFees, feeHistory, allPayments, getPayment, getPaymentPdf, getReceipt, updatePayment, deletePayment, listCategories, createCategory, updateCategory, deleteCategory, getClassStructure, saveClassStructure, getAllClassStructures, debugPayments, getClassesForDropdown, assignFeeCategoryToClass, getClassFeeStructureWithSeparation, getStudentFeeLocks };

