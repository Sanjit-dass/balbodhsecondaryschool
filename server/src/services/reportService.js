const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const ClassModel = require('../models/Class');
const mongoose = require('mongoose');

class ReportService {
  /**
   * Get global billing and collection reports
   * @param {String} academicYear
   * @returns {Promise<Object>}
   */
  async getGlobalSummary(academicYear) {
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;

    const invoices = await Invoice.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$netAmount' },
          totalCollected: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = invoices[0] || { totalBilled: 0, totalCollected: 0, totalDue: 0, count: 0 };
    return {
      totalBilled: result.totalBilled,
      totalCollected: result.totalCollected,
      totalDue: result.totalDue,
      invoiceCount: result.count
    };
  }

  /**
   * Get income report grouped by class
   * @param {String} academicYear
   * @returns {Promise<Array>}
   */
  async getClassWiseRevenue(academicYear) {
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;

    const classRevenue = await Invoice.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: '$classId',
          totalBilled: { $sum: '$netAmount' },
          totalCollected: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' }
        }
      }
    ]);

    // Populate class names
    const populated = await Promise.all(
      classRevenue.map(async (item) => {
        const classObj = await ClassModel.findById(item._id).select('name').lean();
        return {
          classId: item._id,
          className: classObj?.name || 'Unknown',
          totalBilled: item.totalBilled,
          totalCollected: item.totalCollected,
          totalDue: item.totalDue
        };
      })
    );

    // Sort by class name or amount
    return populated.sort((a, b) => a.className.localeCompare(b.className));
  }

  /**
   * Get monthly income report for a given academic year
   * @param {String} academicYear
   * @returns {Promise<Array>}
   */
  async getMonthlyIncome(academicYear) {
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;

    // Group payments by month based on invoice month
    const monthlyData = await Payment.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoiceId',
          foreignField: '_id',
          as: 'invoice'
        }
      },
      { $unwind: '$invoice' },
      {
        $match: academicYear ? { 'invoice.academicYear': academicYear } : {}
      },
      {
        $group: {
          _id: '$invoice.month',
          totalCollected: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map month numbers to names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return monthlyData.map(item => ({
      monthNumber: item._id,
      monthName: monthNames[item._id - 1] || `Month ${item._id}`,
      totalCollected: item.totalCollected,
      paymentCount: item.paymentCount
    }));
  }

  /**
   * Get total collection on a specific day
   * @param {Date} date
   * @returns {Promise<Object>}
   */
  async getDailyCollection(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 53, 53, 999);

    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('studentId', 'fullName rollNumber admissionNumber');

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      date: start.toISOString().split('T')[0],
      totalCollected,
      paymentCount: payments.length,
      payments: payments.map(p => ({
        paymentId: p._id,
        studentName: p.studentId?.fullName || 'N/A',
        rollNumber: p.studentId?.rollNumber || p.studentId?.admissionNumber || 'N/A',
        amount: p.amount,
        method: p.method,
        transactionId: p.transactionId,
        time: p.createdAt
      }))
    };
  }

  /**
   * Get list of students with outstanding dues
   * @param {ObjectId} classId - optional filter
   * @param {Number} month - optional filter
   * @param {String} academicYear - optional filter
   * @returns {Promise<Array>}
   */
  async getPendingDues(classId, month, academicYear) {
    const filter = { dueAmount: { $gt: 0 }, isActive: true };
    if (classId) filter.classId = classId;
    if (month) filter.month = month;
    if (academicYear) filter.academicYear = academicYear;

    const invoices = await Invoice.find(filter)
      .populate('studentId', 'fullName rollNumber admissionNumber phone email')
      .populate('classId', 'name')
      .sort({ dueAmount: -1 });

    return invoices.map(inv => ({
      invoiceId: inv._id,
      studentId: inv.studentId?._id,
      studentName: inv.studentId?.fullName || inv.studentName || 'N/A',
      rollNumber: inv.studentId?.rollNumber || inv.studentId?.admissionNumber || inv.rollNumber || 'N/A',
      phone: inv.studentId?.phone || 'N/A',
      className: inv.classId?.name || inv.className || 'N/A',
      month: inv.month,
      academicYear: inv.academicYear,
      totalAmount: inv.totalAmount,
      discount: inv.discount,
      netAmount: inv.netAmount,
      paidAmount: inv.paidAmount,
      dueAmount: inv.dueAmount,
      items: inv.items
    }));
  }

  /**
   * Get detailed payment history for a specific student
   * @param {ObjectId} studentId
   * @returns {Promise<Array>}
   */
  async getStudentPaymentHistory(studentId) {
    const payments = await Payment.find({ studentId })
      .populate('invoiceId', 'month academicYear')
      .sort({ createdAt: -1 });

    return payments.map(p => ({
      paymentId: p._id,
      invoiceId: p.invoiceId?._id,
      billingMonth: p.invoiceId?.month,
      academicYear: p.invoiceId?.academicYear,
      amount: p.amount,
      method: p.method,
      transactionId: p.transactionId,
      breakdown: p.breakdown,
      receiptId: p.receiptId,
      date: p.createdAt
    }));
  }

  /**
   * Get revenue breakdown by fee categories
   * @param {String} academicYear
   * @returns {Promise<Array>}
   */
  async getFeeCategoryBreakdown(academicYear) {
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;

    const invoices = await Invoice.find({ ...filter, isActive: true });
    const categoryTotals = {};

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.name;
        if (!categoryTotals[key]) {
          categoryTotals[key] = { name: key, totalBilled: 0, totalPaid: 0, totalDue: 0 };
        }
        categoryTotals[key].totalBilled += item.amount;
        categoryTotals[key].totalPaid += item.paid || 0;
        categoryTotals[key].totalDue += Math.max(0, item.amount - (item.paid || 0));
      });
    });

    return Object.values(categoryTotals).sort((a, b) => b.totalBilled - a.totalBilled);
  }
}

module.exports = new ReportService();
