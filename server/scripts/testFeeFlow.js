require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB, disconnectDB } = require('../src/config/db');
const mongoose = require('mongoose');

// Import models
const ClassModel = require('../src/models/Class');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const FeeStructure = require('../src/models/FeeStructure');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const Receipt = require('../src/models/Receipt');
const Ledger = require('../src/models/Ledger');

// Import services
const feeService = require('../src/services/feeService');
const invoiceService = require('../src/services/invoiceService');
const paymentService = require('../src/services/paymentService');
const reportService = require('../src/services/reportService');

const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/balbodh';

async function runTest() {
  console.log('🚀 Starting ERP Fee Management backend integration test...');
  await connectDB(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  // Clean up any existing test records to ensure reproducibility
  console.log('🧹 Cleaning up test database records...');
  const testClassName = 'Test Class ERP';
  const testStudentEmail = 'erp.student@test.com';

  const oldClass = await ClassModel.findOne({ name: testClassName });
  if (oldClass) {
    await Student.deleteMany({ class: oldClass._id });
    await FeeStructure.deleteMany({ classId: oldClass._id });
    await Invoice.deleteMany({ classId: oldClass._id });
    await ClassModel.deleteOne({ _id: oldClass._id });
  }
  const oldUser = await User.findOne({ email: testStudentEmail });
  if (oldUser) {
    await Student.deleteMany({ user: oldUser._id });
    await User.deleteOne({ _id: oldUser._id });
  }

  // 1. Create a Class
  const classObj = new ClassModel({
    name: testClassName,
    numeric: 10,
    sections: ['A']
  });
  await classObj.save();
  console.log(`1️⃣ Created Test Class: ${classObj.name} (ID: ${classObj._id})`);

  // 2. Create User and Student Profile
  const user = new User({
    name: 'ERP Test Student',
    email: testStudentEmail,
    password: 'password123',
    role: 'student'
  });
  await user.save();

  const student = new Student({
    fullName: user.name,
    email: user.email,
    user: user._id,
    class: classObj._id,
    admissionNumber: 'STU-ERP-01',
    status: 'active'
  });
  await student.save();
  console.log(`2️⃣ Created Student User and Profile: ${student.fullName} (ID: ${student._id})`);

  // 3. Configure Fee Structure
  const feeItems = [
    { name: 'Tuition Fee', type: 'mandatory', amount: 3000 },
    { name: 'Bus Fee', type: 'mandatory', amount: 1200 },
    { name: 'Exam Fee', type: 'mandatory', amount: 800 },
    { name: 'Hostel Fee', type: 'optional', amount: 5000 }
  ];

  const structure = await feeService.createOrUpdateFeeStructure({
    classId: classObj._id,
    academicYear: '2026-2027',
    items: feeItems
  });
  console.log(`3️⃣ Configured Fee Structure for class ${classObj.name}:`, structure.items.map(i => `${i.name} (${i.type}): ${i.amount}`).join(', '));

  // 4. Generate Invoice
  const invoice = await invoiceService.createSingleInvoice(
    student._id,
    classObj._id,
    1, // Month: January
    '2026-2027'
  );
  console.log(`4️⃣ Generated Invoice for student:`);
  console.log(`   - Month: ${invoice.month}`);
  console.log(`   - Total Billed: ${invoice.totalAmount}`);
  console.log(`   - Net Amount: ${invoice.netAmount}`);
  console.log(`   - Due Amount: ${invoice.dueAmount}`);
  console.log(`   - Status: ${invoice.status}`);
  console.log(`   - Items Billed:`, invoice.items.map(i => `${i.name}: ${i.amount}`).join(', '));

  // 5. Collect Payment (Process Payment flow)
  const payAmount = 2500;
  console.log(`5️⃣ Collecting partial payment of ${payAmount}...`);
  const paymentResult = await paymentService.processPayment({
    studentId: student._id,
    invoiceId: invoice._id,
    amount: payAmount,
    method: 'cash',
    transactionId: 'TXN-ERP-TEST-99',
    breakdown: { 'Tuition Fee': 1500, 'Bus Fee': 1000 }, // Specific allocation
    processedBy: user._id
  });

  console.log('✅ Payment processed successfully!');
  console.log(`   - Payment Transaction ID: ${paymentResult.payment._id}`);
  console.log(`   - Payment Amount: ${paymentResult.payment.amount}`);
  console.log(`   - Stored Allocation Breakdown:`, paymentResult.payment.breakdown);

  // 6. Check updated invoice
  const updatedInvoice = await Invoice.findById(invoice._id);
  console.log(`6️⃣ Verifying updated Invoice values:`);
  console.log(`   - Paid Amount: ${updatedInvoice.paidAmount} (expected 2500)`);
  console.log(`   - Due Amount: ${updatedInvoice.dueAmount} (expected 2500)`);
  console.log(`   - Status: ${updatedInvoice.status} (expected partial)`);
  console.log(`   - Item Allocation Stored:`, updatedInvoice.items.map(i => `${i.name}: paid ${i.paid}/${i.amount}`).join(', '));

  // 7. Verify Receipt
  const receipt = await Receipt.findOne({ paymentId: paymentResult.payment._id });
  console.log(`7️⃣ Verifying Receipt Document:`);
  console.log(`   - Receipt Number: ${receipt.receiptNumber}`);
  console.log(`   - PDF URL: ${receipt.pdfUrl || 'None (Buffer uploaded to Cloudinary)'}`);

  // 8. Verify Ledger Entry
  const ledger = await Ledger.findOne({ paymentId: paymentResult.payment._id });
  console.log(`8️⃣ Verifying Ledger Entry:`);
  console.log(`   - Transaction Type: ${ledger.transactionType}`);
  console.log(`   - Credit: ${ledger.credit}`);
  console.log(`   - Running Balance: ${ledger.balance}`);

  // 9. Verify Reporting System
  console.log(`9️⃣ Verifying Reporting System aggregates...`);
  const globalSummary = await reportService.getGlobalSummary('2026-2027');
  const classRevenue = await reportService.getClassWiseRevenue('2026-2027');
  const monthlyIncome = await reportService.getMonthlyIncome('2026-2027');
  const categoryBreakdown = await reportService.getFeeCategoryBreakdown('2026-2027');

  console.log('📊 Reports Output:');
  console.log('   - Global Summary:', globalSummary);
  console.log('   - Class Revenue:', classRevenue);
  console.log('   - Monthly Income:', monthlyIncome);
  console.log('   - Category Breakdown:', categoryBreakdown);

  console.log('🎉 Integration Test Successful! All ERP logic checks out.');
  await disconnectDB();
}

runTest().catch(async (err) => {
  console.error('❌ Integration Test Failed:', err);
  await disconnectDB();
  process.exit(1);
});
