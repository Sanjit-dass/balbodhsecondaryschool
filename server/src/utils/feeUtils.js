/**
 * FEE SYSTEM UTILITIES
 * Helper functions for the ERP fee management system
 */

const Invoice = require('../models/Invoice');
const FeeStructureV2 = require('../models/FeeStructureV2');

/**
 * Validation utilities
 */
const ValidationUtils = {
  /**
   * Validate invoice creation parameters
   */
  validateInvoiceParams: (studentId, classId, month, academicYear) => {
    if (!studentId) throw new Error('Student ID is required');
    if (!classId) throw new Error('Class ID is required');
    if (!month || month < 1 || month > 12) throw new Error('Invalid month (1-12)');
    if (!academicYear || !/^\d{4}-\d{4}$/.test(academicYear)) {
      throw new Error('Invalid academic year format (YYYY-YYYY)');
    }
  },

  /**
   * Validate payment parameters
   */
  validatePaymentParams: (studentId, invoiceId, amount, method) => {
    if (!studentId) throw new Error('Student ID is required');
    if (!invoiceId) throw new Error('Invoice ID is required');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
    if (!method) throw new Error('Payment method is required');
  },

  /**
   * Validate fee structure items
   */
  validateFeeStructureItems: (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }

    items.forEach((item, index) => {
      if (!item.name) throw new Error(`Item ${index}: name is required`);
      if (!item.category) throw new Error(`Item ${index}: category is required`);
      if (typeof item.amount !== 'number' || item.amount < 0) {
        throw new Error(`Item ${index}: amount must be a non-negative number`);
      }
    });
  },
};

/**
 * Calculation utilities
 */
const CalculationUtils = {
  /**
   * Calculate total from fee structure
   */
  calculateStructureTotal: (items, type = 'all') => {
    return items
      .filter((item) => {
        if (type === 'all') return true;
        if (type === 'mandatory') return item.type === 'mandatory';
        if (type === 'optional') return item.type === 'optional';
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  },

  /**
   * Calculate outstanding amount
   */
  calculateOutstanding: (totalAmount, discount, paidAmount) => {
    const netAmount = totalAmount - (discount || 0);
    return Math.max(0, netAmount - (paidAmount || 0));
  },

  /**
   * Calculate payment percentage
   */
  calculatePaymentPercentage: (paidAmount, totalAmount) => {
    const paid = Number(paidAmount || 0);
    const total = Number(totalAmount || 0);
    if (total === 0) return 0;
    // return number rounded to 2 decimal places
    return Number(((paid / total) * 100).toFixed(2));
  },

  /**
   * Calculate multiple invoices totals
   */
  calculateBatchTotals: (invoices) => {
    return {
      totalBilled: invoices.reduce((sum, inv) => sum + Number(inv.netAmount || 0), 0),
      totalPaid: invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0),
      totalDue: invoices.reduce((sum, inv) => sum + Number(inv.dueAmount || 0), 0),
    };
  },
};

/**
 * Date utilities
 */
const DateUtils = {
  /**
   * Get month name from number
   */
  getMonthName: (month) => {
    const months = [
      'January', 'February', 'March', 'April',
      'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December',
    ];
    return months[month - 1] || '';
  },

  /**
   * Get current academic year
   */
  getCurrentAcademicYear: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Assuming academic year is April to March (typical in India)
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  },

  /**
   * Get fiscal month (April-based)
   */
  getFiscalMonth: (date = new Date()) => {
    const month = date.getMonth() + 1;
    if (month < 4) {
      return month + 9; // Jan=10, Feb=11, Mar=12
    }
    return month - 3; // Apr=1, May=2, etc
  },
};

/**
 * Format utilities
 */
const FormatUtils = {
  /**
   * Format currency
   */
  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return 'Rs 0.00';
    const num = Number(amount);
    if (isNaN(num)) return 'Rs 0.00';
    return `Rs ${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  /**
   * Format date
   */
  formatDate: (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  /**
   * Format invoice number
   */
  formatInvoiceNumber: (invoiceId, month, year) => {
    return `INV-${year}-${String(month).padStart(2, '0')}-${invoiceId.toString().slice(-6)}`;
  },
};

/**
 * Report utilities
 */
const ReportUtils = {
  /**
   * Get payment status summary
   */
  getPaymentStatusSummary: (invoices) => {
    return {
      paid: invoices.filter((inv) => inv.status === 'paid').length,
      partial: invoices.filter((inv) => inv.status === 'partial').length,
      unpaid: invoices.filter((inv) => inv.status === 'unpaid').length,
    };
  },

  /**
   * Generate class-wise billing table
   */
  generateBillingTable: (invoices) => {
    return invoices.map((inv) => ({
      rollNumber: inv.rollNumber,
      studentName: inv.studentName,
      totalBilled: inv.netAmount,
      paid: inv.paidAmount,
      due: inv.dueAmount,
      status: inv.status,
      percentage: CalculationUtils.calculatePaymentPercentage(
        inv.paidAmount,
        inv.netAmount
      ),
    }));
  },

  /**
   * Generate ledger report
   */
  generateLedgerReport: (ledgerEntries) => {
    return ledgerEntries.map((entry) => ({
      date: FormatUtils.formatDate(entry.createdAt),
      description: entry.description,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance,
    }));
  },
};

/**
 * Query builders
 */
const QueryBuilders = {
  /**
   * Build invoice query filter
   */
  buildInvoiceFilter: (filters = {}) => {
    const query = {};

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.classId) query.classId = filters.classId;
    if (filters.month) query.month = filters.month;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.status) query.status = filters.status;

    if (filters.startMonth && filters.endMonth && filters.year) {
      query.month = { $gte: filters.startMonth, $lte: filters.endMonth };
      query.academicYear = filters.year;
    }

    if (filters.minDue !== undefined) query.dueAmount = { $gte: filters.minDue };
    if (filters.maxDue !== undefined) {
      query.dueAmount = { ...query.dueAmount, $lte: filters.maxDue };
    }

    return query;
  },

  /**
   * Build payment query filter
   */
  buildPaymentFilter: (filters = {}) => {
    const query = {};

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.invoiceId) query.invoiceId = filters.invoiceId;
    if (filters.method) query.paymentMethod = filters.method;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    if (filters.minAmount !== undefined) query.amount = { $gte: filters.minAmount };
    if (filters.maxAmount !== undefined) {
      query.amount = { ...query.amount, $lte: filters.maxAmount };
    }

    return query;
  },
};

module.exports = {
  ValidationUtils,
  CalculationUtils,
  DateUtils,
  FormatUtils,
  ReportUtils,
  QueryBuilders,
};
