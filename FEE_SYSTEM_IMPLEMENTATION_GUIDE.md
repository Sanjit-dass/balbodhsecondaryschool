/**
 * FEE SYSTEM IMPLEMENTATION GUIDE
 * 
 * This document explains how to use the new ERP-level Fee Management System
 */

# 🏗️ NEW FEE ARCHITECTURE OVERVIEW

## Models

- **Invoice** - Main billing document (source of truth for dues)
- **Payment** - Transaction records only (no calculations)
- **Receipt** - Document layer for issued receipts
- **FeeStructureV2** - Master fee configuration
- **Ledger** - Optional accounting layer

## Services

- **invoiceService** - Invoice creation, retrieval, calculations
- **paymentService** - Payment processing, transaction recording
- **feeService** - Fee configuration, reporting

## Controllers

- **invoiceController** - Invoice HTTP endpoints
- **paymentController** - Payment HTTP endpoints
- **feeNewController** - Fee structure and reports

## Routes

New routes available at: `/fees` (update in main server file)

---

# 📋 SETUP INSTRUCTIONS

## 1. Update Your Server Entry Point

In your `server/src/index.js` or main file:

```javascript
// Add this route
const feesV2Routes = require('./routes/feesV2');
app.use('/api/fees', feesV2Routes);

// Keep old routes if needed
const feesRoutes = require('./routes/fees');
app.use('/api/fees-legacy', feesRoutes);
```

## 2. Create Fee Structure (Master Setup)

```javascript
POST /api/fees/structure

{
  "classId": "class_id_here",
  "academicYear": "2024-2025",
  "items": [
    {
      "name": "Tuition Fee",
      "category": "tuition",
      "type": "mandatory",
      "amount": 5000,
      "frequency": "monthly"
    },
    {
      "name": "Bus Fee",
      "category": "transportation",
      "type": "optional",
      "amount": 1000,
      "frequency": "monthly"
    }
  ]
}
```

## 3. Generate Monthly Invoices (Automated)

```javascript
POST /api/fees/invoice/generate-monthly

{
  "classId": "class_id_here",
  "month": 4,
  "academicYear": "2024-2025"
}
```

Run this monthly via cron job.

## 4. Process Payment

```javascript
POST /api/fees/pay

{
  "studentId": "student_id",
  "invoiceId": "invoice_id",
  "amount": 5000,
  "paymentMethod": "cash",
  "transactionId": "TXN123456",
  "referenceNumber": "CHK-001",
  "remarks": "Payment for April"
}
```

Response includes:
- Payment record
- Updated Invoice
- Generated Receipt

## 5. Get Outstanding Dues

```javascript
GET /api/fees/invoice/{studentId}/outstanding

Response:
{
  "totalDue": 15000,
  "invoiceCount": 3,
  "invoices": [
    {
      "id": "invoice_id",
      "month": 4,
      "academicYear": "2024-2025",
      "dueAmount": 5000,
      "status": "unpaid"
    }
  ]
}
```

---

# 🔄 PAYMENT FLOW (STEP BY STEP)

## Step 1: Create Fee Structure
Admin creates fee structure for each class per year

## Step 2: Auto-Generate Invoices (Monthly)
System automatically creates invoices from structure

## Step 3: Collect Payment
Accountant processes payment against invoice

## Step 4: System Updates
- Invoice.paidAmount increases
- Invoice.dueAmount decreases
- Invoice.status updates (paid/partial/unpaid)
- Receipt generated automatically

## Step 5: Accounting (Optional)
Ledger entry created for accounting reports

---

# 💡 KEY FEATURES

## 1. Monthly Billing
Automated monthly invoice generation from master fee structure

## 2. Partial Payments
Support for partial payments across multiple months

## 3. Discount Management
Apply scholarships/concessions directly to invoices

## 4. Multiple Payment Methods
Support: cash, check, bank_transfer, card, online

## 5. Receipt Generation
Automatic receipt creation with unique numbers

## 6. Comprehensive Reports
- Student fee summary
- Class billing report
- Payment statistics
- Ledger reports

---

# 🎯 BEST PRACTICES FOR SCALING

## For 1000+ Students

### 1. Indexing
All critical fields are indexed for fast queries:
```
- studentId (for fetching student records)
- classId (for class reports)
- invoiceId (for payments)
- academicYear (for filtering)
- status (for pending invoices)
```

### 2. Denormalization
Invoice stores:
- studentName
- rollNumber
- className

Payment stores minimal denormalization (references only)

### 3. Batch Operations
Generate monthly invoices in batches:
```javascript
POST /api/fees/invoice/generate-monthly
// Handles all students in a class efficiently
```

### 4. Aggregation Pipeline
For large reports, use MongoDB aggregation:
```javascript
// Example in reports
db.invoices.aggregate([
  { $match: { classId, academicYear } },
  { $group: {
      _id: "$status",
      count: { $sum: 1 },
      total: { $sum: "$dueAmount" }
  }}
])
```

### 5. Pagination
Implement pagination for student lists:
```javascript
GET /api/fees/class/:classId/billing-report?page=1&limit=50
```

---

# 🔐 SECURITY CONSIDERATIONS

## 1. Role-Based Access
```javascript
// Only accountants and admins can process payments
roles(['superadmin', 'admin', 'principal', 'accountant'])

// Students can only view their own fees
if (req.user.role === 'student') {
  query.studentId = req.user.studentId;
}
```

## 2. Validation
All inputs validated before processing:
- Amount > 0
- Invoice exists
- Student matches invoice
- Invoice can accept payment

## 3. Audit Trail
All payments recorded with:
- processedBy (who entered it)
- timestamp
- transactionId (for external validation)

---

# 📊 REPORTING FEATURES

## 1. Student Fee Summary
```javascript
GET /api/fees/student/:studentId/summary?academicYear=2024-2025
```

## 2. Class Billing Report
```javascript
GET /api/fees/class/:classId/billing-report?academicYear=2024-2025
```

## 3. Export as CSV
```javascript
GET /api/fees/class/:classId/export?academicYear=2024-2025
```

## 4. Payment Statistics
```javascript
GET /api/fees/payments/stats?startDate=2024-01-01&endDate=2024-12-31
```

---

# ⚙️ OPTIONAL ADVANCED FEATURES

## 1. Late Fee Calculation
Add to invoice service:
```javascript
calculateLateFee: (invoice, currentDate) => {
  const daysLate = Math.floor(
    (currentDate - invoice.createdAt) / (1000 * 60 * 60 * 24)
  );
  if (daysLate > 30) {
    return invoice.dueAmount * 0.05; // 5% late fee
  }
  return 0;
}
```

## 2. Auto Reminder System
Create reminder service:
```javascript
// Send email/SMS for unpaid invoices
sendReminder: async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);
  // Send notification
}
```

## 3. Payment Plan
Allow installment plans:
```javascript
{
  invoiceId,
  studentId,
  totalAmount,
  installments: 3,
  schedule: [
    { dueDate: '2024-05-01', amount: 2000 },
    { dueDate: '2024-06-01', amount: 2000 },
    { dueDate: '2024-07-01', amount: 1000 }
  ]
}
```

## 4. Scholarship Management
Automated discount application:
```javascript
applyScholarship: async (studentId, percentage) => {
  const invoices = await Invoice.find({ studentId });
  for (const invoice of invoices) {
    await invoiceService.applyDiscount(
      invoice._id,
      invoice.totalAmount * (percentage / 100),
      'Scholarship'
    );
  }
}
```

---

# 🧪 TESTING THE SYSTEM

## 1. Create Test Data
```javascript
// Create a test fee structure
POST /api/fees/structure
{
  "classId": "test-class-id",
  "academicYear": "2024-2025",
  "items": [
    { "name": "Tuition", "category": "tuition", "type": "mandatory", "amount": 5000 }
  ]
}
```

## 2. Generate Test Invoice
```javascript
POST /api/fees/invoice/create
{
  "studentId": "test-student-id",
  "classId": "test-class-id",
  "month": 4,
  "academicYear": "2024-2025"
}
```

## 3. Process Test Payment
```javascript
POST /api/fees/pay
{
  "studentId": "test-student-id",
  "invoiceId": "returned-invoice-id",
  "amount": 2500,
  "paymentMethod": "cash"
}
```

## 4. Verify Results
```javascript
GET /api/fees/invoice/details/{invoiceId}
// Should show: paidAmount=2500, dueAmount=2500, status=partial
```

---

# 🚀 MIGRATION FROM OLD SYSTEM

## Option 1: Parallel Running
- Keep old fee routes
- New routes for new data
- Gradually migrate invoices

## Option 2: Data Migration
```javascript
// Script to migrate FeePayment records to Invoice + Payment
async function migrateOldFees() {
  const oldPayments = await FeePayment.find();
  
  for (const payment of oldPayments) {
    // Create invoice if not exists
    // Create payment record
    // Create receipt record
  }
}
```

---

# 📞 SUPPORT FEATURES

## Debug Endpoints
```javascript
GET /api/fees/debug/payments/:studentId
// Returns all payment records for troubleshooting
```

## Error Handling
All endpoints return structured error responses:
```javascript
{
  "success": false,
  "message": "Specific error message",
  "code": "ERROR_CODE"
}
```

---

# ✅ CHECKLIST

- [ ] Install all models (Invoice, Payment, Receipt, FeeStructureV2, Ledger)
- [ ] Create service files (invoiceService, paymentService, feeService)
- [ ] Import controllers in routes
- [ ] Add feesV2 route to server
- [ ] Test fee structure creation
- [ ] Test invoice generation
- [ ] Test payment processing
- [ ] Test receipt generation
- [ ] Run reports
- [ ] Set up monthly cron job
- [ ] Document your specific workflows

---

End of Implementation Guide
