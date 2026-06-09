/**
 * EXAMPLE SCRIPT: Using the New Fee System
 * 
 * This script demonstrates how to use the new ERP fee management system
 * Both from HTTP requests and programmatically
 */

// ==============================================================
// EXAMPLE 1: CREATE FEE STRUCTURE (ADMIN TASK)
// ==============================================================

async function exampleCreateFeeStructure() {
  const feeService = require('../services/feeService');

  const feeStructure = await feeService.createFeeStructure({
    classId: 'class_12a_2024',
    academicYear: '2024-2025',
    createdBy: 'admin_user_id',
    items: [
      {
        name: 'Tuition Fee',
        category: 'tuition',
        type: 'mandatory',
        description: 'Monthly tuition fee',
        amount: 5000,
        frequency: 'monthly',
      },
      {
        name: 'Bus Service',
        category: 'transportation',
        type: 'optional',
        description: 'School bus transportation',
        amount: 1500,
        frequency: 'monthly',
      },
      {
        name: 'Lab Fee',
        category: 'lab',
        type: 'mandatory',
        description: 'Science lab charges',
        amount: 500,
        frequency: 'monthly',
      },
      {
        name: 'Hostel Fee',
        category: 'hostel',
        type: 'optional',
        description: 'Hostel accommodation',
        amount: 3000,
        frequency: 'monthly',
      },
    ],
  });

  console.log('Fee Structure Created:', feeStructure);
  return feeStructure;
}

// ==============================================================
// EXAMPLE 2: GENERATE MONTHLY INVOICES (MONTHLY CRON JOB)
// ==============================================================

async function exampleGenerateMonthlyInvoices() {
  const invoiceService = require('../services/invoiceService');

  const result = await invoiceService.generateMonthlyInvoices(
    'class_12a_2024', // classId
    4, // month (April)
    '2024-2025' // academicYear
  );

  console.log('Invoice Generation Result:');
  console.log(`- Created: ${result.created}`);
  console.log(`- Failed: ${result.failed}`);
  if (result.errors.length > 0) {
    console.log('Errors:', result.errors);
  }

  return result;
}

// ==============================================================
// EXAMPLE 3: CREATE INVOICE MANUALLY (FOR SPECIFIC STUDENT)
// ==============================================================

async function exampleCreateSingleInvoice() {
  const invoiceService = require('../services/invoiceService');

  const invoice = await invoiceService.createOrGetInvoice(
    'student_roll_001', // studentId
    'class_12a_2024', // classId
    4, // month
    '2024-2025' // academicYear
  );

  console.log('Invoice Created:');
  console.log(`- Student: ${invoice.studentName}`);
  console.log(`- Total Amount: Rs ${invoice.totalAmount}`);
  console.log(`- Due Amount: Rs ${invoice.dueAmount}`);
  console.log(`- Status: ${invoice.status}`);

  return invoice;
}

// ==============================================================
// EXAMPLE 4: PROCESS PAYMENT (MAIN OPERATION)
// ==============================================================

async function exampleProcessPayment() {
  const paymentService = require('../services/paymentService');

  const result = await paymentService.processPayment({
    studentId: 'student_roll_001',
    invoiceId: 'invoice_id_here',
    amount: 2500, // Partial payment
    paymentMethod: 'cash',
    transactionId: 'CASH-2024-04-001',
    remarks: 'Payment for April fees',
  });

  console.log('Payment Processed Successfully!');
  console.log(`\nPayment Details:`);
  console.log(`- Amount: Rs ${result.payment.amount}`);
  console.log(`- Method: ${result.payment.paymentMethod}`);
  console.log(`- Receipt Number: ${result.receipt.receiptNumber}`);

  console.log(`\nInvoice Updated:`);
  console.log(`- Paid Amount: Rs ${result.invoice.paidAmount}`);
  console.log(`- Due Amount: Rs ${result.invoice.dueAmount}`);
  console.log(`- Status: ${result.invoice.status}`);

  return result;
}

// ==============================================================
// EXAMPLE 5: GET STUDENT'S OUTSTANDING DUES
// ==============================================================

async function exampleGetOutstandingDues() {
  const invoiceService = require('../services/invoiceService');

  const outstanding = await invoiceService.getStudentOutstanding('student_roll_001');

  console.log('Student Outstanding Dues:');
  console.log(`- Total Due: Rs ${outstanding.totalDue}`);
  console.log(`- Number of Invoices: ${outstanding.invoiceCount}`);

  console.log('\nBreakdown:');
  outstanding.invoices.forEach((inv) => {
    console.log(
      `  Month ${inv.month}: Rs ${inv.dueAmount} (Status: ${inv.status})`
    );
  });

  return outstanding;
}

// ==============================================================
// EXAMPLE 6: APPLY SCHOLARSHIP/DISCOUNT
// ==============================================================

async function exampleApplyScholarship() {
  const invoiceService = require('../services/invoiceService');

  const invoice = await invoiceService.applyDiscount(
    'invoice_id_here',
    1000, // Discount amount
    'Merit scholarship - 20% concession'
  );

  console.log('Discount Applied:');
  console.log(`- Original Total: Rs ${invoice.totalAmount}`);
  console.log(`- Discount: Rs ${invoice.discount}`);
  console.log(`- Net Amount: Rs ${invoice.netAmount}`);
  console.log(`- Due: Rs ${invoice.dueAmount}`);

  return invoice;
}

// ==============================================================
// EXAMPLE 7: GET STUDENT FEE SUMMARY
// ==============================================================

async function exampleGetStudentFeeSummary() {
  const feeService = require('../services/feeService');

  const summary = await feeService.getStudentFeeSummary(
    'student_roll_001',
    '2024-2025'
  );

  console.log('Student Fee Summary for 2024-2025:');
  console.log(`- Total Billed: Rs ${summary.totalBilled}`);
  console.log(`- Total Paid: Rs ${summary.totalPaid}`);
  console.log(`- Total Due: Rs ${summary.totalDue}`);
  console.log(`- Payment Percentage: ${summary.paymentPercentage}%`);

  console.log('\nMonth-wise Breakdown:');
  summary.invoices.forEach((inv) => {
    console.log(
      `  Month ${inv.month}: Billed Rs ${inv.totalAmount}, Paid Rs ${inv.paidAmount}, Due Rs ${inv.dueAmount}`
    );
  });

  return summary;
}

// ==============================================================
// EXAMPLE 8: GET CLASS BILLING REPORT
// ==============================================================

async function exampleGetClassBillingReport() {
  const feeService = require('../services/feeService');

  const report = await feeService.getClassBillingReport('class_12a_2024', '2024-2025');

  console.log('Class Billing Report - Class 12A (2024-2025):');
  console.log(`- Total Students: ${report.totalStudents}`);
  console.log(`- Total Billed: Rs ${report.totalBilled}`);
  console.log(`- Total Collected: Rs ${report.totalCollected}`);
  console.log(`- Total Pending: Rs ${report.totalPending}`);

  console.log('\nStudent-wise Details:');
  report.report.forEach((student) => {
    console.log(`\n  ${student.studentName} (Roll: ${student.rollNumber})`);
    console.log(`    Billed: Rs ${student.totalBilled}`);
    console.log(`    Paid: Rs ${student.paid}`);
    console.log(`    Due: Rs ${student.due}`);
    console.log(`    Status: ${student.status} (${student.paymentPercentage}%)`);
  });

  return report;
}

// ==============================================================
// EXAMPLE 9: HANDLE PARTIAL PAYMENTS (MULTIPLE PAYMENTS)
// ==============================================================

async function exampleMultiplePartialPayments() {
  const paymentService = require('../services/paymentService');

  console.log('Processing 3 partial payments for same invoice...\n');

  // First payment - 2000
  console.log('Payment 1: Rs 2000');
  let result1 = await paymentService.processPayment({
    studentId: 'student_roll_001',
    invoiceId: 'invoice_id_here',
    amount: 2000,
    paymentMethod: 'cash',
    remarks: 'Partial payment 1',
  });
  console.log(`  Invoice Status: ${result1.invoice.status}`);
  console.log(`  Outstanding: Rs ${result1.invoice.dueAmount}\n`);

  // Second payment - 2000
  console.log('Payment 2: Rs 2000');
  let result2 = await paymentService.processPayment({
    studentId: 'student_roll_001',
    invoiceId: 'invoice_id_here',
    amount: 2000,
    paymentMethod: 'check',
    referenceNumber: 'CHK-001',
    remarks: 'Partial payment 2',
  });
  console.log(`  Invoice Status: ${result2.invoice.status}`);
  console.log(`  Outstanding: Rs ${result2.invoice.dueAmount}\n`);

  // Final payment - 1000 (completes the invoice)
  console.log('Payment 3: Rs 1000');
  let result3 = await paymentService.processPayment({
    studentId: 'student_roll_001',
    invoiceId: 'invoice_id_here',
    amount: 1000,
    paymentMethod: 'bank_transfer',
    transactionId: 'TXN-2024-001',
    remarks: 'Final payment',
  });
  console.log(`  Invoice Status: ${result3.invoice.status}`);
  console.log(`  Outstanding: Rs ${result3.invoice.dueAmount}`);

  return { result1, result2, result3 };
}

// ==============================================================
// EXAMPLE 10: EXPORT CLASS BILLING DATA
// ==============================================================

async function exampleExportBillingData() {
  const feeService = require('../services/feeService');

  const data = await feeService.exportClassBillingData('class_12a_2024', '2024-2025');

  console.log('Exported Billing Data (CSV format):');
  console.log('-----------------------------------');
  console.log(data);

  // You can write this to a file
  const fs = require('fs');
  fs.writeFileSync('./billing_report.csv', data);
  console.log('\nFile saved: billing_report.csv');

  return data;
}

// ==============================================================
// EXAMPLE 11: HTTP API USAGE (Using CURL or Postman)
// ==============================================================

const httpExamples = `
# CURL Examples for the Fee System APIs

## 1. Create Fee Structure
curl -X POST http://localhost:5000/api/fees/structure \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "classId": "class_12a_2024",
    "academicYear": "2024-2025",
    "items": [
      {
        "name": "Tuition Fee",
        "category": "tuition",
        "type": "mandatory",
        "amount": 5000
      }
    ]
  }'

## 2. Generate Monthly Invoices
curl -X POST http://localhost:5000/api/fees/invoice/generate-monthly \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "classId": "class_12a_2024",
    "month": 4,
    "academicYear": "2024-2025"
  }'

## 3. Process Payment
curl -X POST http://localhost:5000/api/fees/pay \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "studentId": "student_id",
    "invoiceId": "invoice_id",
    "amount": 5000,
    "paymentMethod": "cash"
  }'

## 4. Get Outstanding Dues
curl -X GET http://localhost:5000/api/fees/invoice/student_id/outstanding \\
  -H "Authorization: Bearer YOUR_TOKEN"

## 5. Get Class Billing Report
curl -X GET "http://localhost:5000/api/fees/class/class_id/billing-report?academicYear=2024-2025" \\
  -H "Authorization: Bearer YOUR_TOKEN"
`;

// ==============================================================
// RUN EXAMPLES
// ==============================================================

async function runAllExamples() {
  console.log('================================');
  console.log('FEE SYSTEM EXAMPLES');
  console.log('================================\n');

  try {
    // Note: Run these one at a time, replacing IDs with real ones
    // await exampleCreateFeeStructure();
    // await exampleGenerateMonthlyInvoices();
    // await exampleCreateSingleInvoice();
    // await exampleProcessPayment();
    // await exampleGetOutstandingDues();
    // await exampleApplyScholarship();
    // await exampleGetStudentFeeSummary();
    // await exampleGetClassBillingReport();
    // await exampleMultiplePartialPayments();
    // await exampleExportBillingData();

    console.log('\nHTTP API Examples:');
    console.log(httpExamples);
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

module.exports = {
  exampleCreateFeeStructure,
  exampleGenerateMonthlyInvoices,
  exampleCreateSingleInvoice,
  exampleProcessPayment,
  exampleGetOutstandingDues,
  exampleApplyScholarship,
  exampleGetStudentFeeSummary,
  exampleGetClassBillingReport,
  exampleMultiplePartialPayments,
  exampleExportBillingData,
  runAllExamples,
};

// To run: node server/src/scripts/feeExamples.js
if (require.main === module) {
  runAllExamples();
}
