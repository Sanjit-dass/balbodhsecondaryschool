# 🏗️ NEW SCHOOL ERP FEE MANAGEMENT SYSTEM - ARCHITECTURE DOCUMENT

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Models](#data-models)
4. [Service Layer](#service-layer)
5. [Controller Layer](#controller-layer)
6. [API Routes](#api-routes)
7. [Business Logic Flow](#business-logic-flow)
8. [Scalability Features](#scalability-features)
9. [Security Model](#security-model)
10. [Integration Points](#integration-points)

---

## System Overview

The new Fee Management System is built on **ERP principles** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│              (HTTP Endpoints / Frontend APIs)            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   CONTROLLER LAYER                       │
│    (invoiceController, paymentController, feeController) │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                         │
│   (invoiceService, paymentService, feeService)          │
│                  (Business Logic)                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                      │
│              (MongoDB Models & Queries)                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                         │
│                    (MongoDB)                             │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram

```
PAYMENT PROCESSING FLOW:

1. Create Fee Structure (Master Data)
   ├─ Class A: Tuition=5000, Bus=1000
   └─ Class B: Tuition=6000, Bus=1200

        ↓

2. Generate Monthly Invoices (Automated)
   ├─ Student 1 (Class A) → Invoice for Month 4
   ├─ Student 2 (Class A) → Invoice for Month 4
   └─ Student 3 (Class B) → Invoice for Month 4

        ↓

3. Student Makes Payment
   ├─ Validates Invoice
   ├─ Creates Payment Record
   ├─ Updates Invoice (paidAmount, dueAmount, status)
   ├─ Generates Receipt
   └─ Optional: Creates Ledger Entry

        ↓

4. Reporting & Analytics
   ├─ Student Fee Summary
   ├─ Class Billing Report
   ├─ Payment Statistics
   └─ Ledger Reports
```

---

## Data Models

### 1. Invoice Model (Source of Truth)

**Purpose**: Single source of truth for student dues

```javascript
{
  _id: ObjectId,
  
  // References
  studentId: ObjectId,
  classId: ObjectId,
  
  // Billing Period
  month: Number (1-12),
  academicYear: String (2024-2025),
  
  // Denormalized Info
  rollNumber: String,
  studentName: String,
  className: String,
  
  // Line Items
  items: [
    {
      name: String,
      category: String,
      amount: Number,
      paid: Number
    }
  ],
  
  // Financial Summary (CALCULATED)
  totalAmount: Number,
  discount: Number,
  netAmount: Number,      // totalAmount - discount
  paidAmount: Number,
  dueAmount: Number,      // netAmount - paidAmount
  
  // Status
  status: String (unpaid, partial, paid),
  paymentCount: Number,
  lastPaymentDate: Date,
  
  // Metadata
  remarks: String,
  isActive: Boolean,
  timestamps: { createdAt, updatedAt }
}
```

**Key Methods**:
- `calculateTotals()` - Recalculate all amounts
- `addPayment(amount)` - Add payment and update status
- `canAcceptPayment()` - Check if invoice can accept more payments
- `getOutstanding()` - Get remaining due amount

**Indexes**:
- `{ studentId: 1, month: 1, academicYear: 1 }` - Unique compound index
- `{ status: 1, academicYear: 1 }` - For reporting

---

### 2. Payment Model (Transaction Only)

**Purpose**: Record payment transactions (no calculations)

```javascript
{
  _id: ObjectId,
  
  // References
  studentId: ObjectId,
  invoiceId: ObjectId,
  receiptId: ObjectId,
  
  // Payment Details
  amount: Number,
  paymentMethod: String (cash, check, card, online),
  
  // Transaction Reference
  transactionId: String,
  referenceNumber: String,
  remarks: String,
  
  // Breakdown (optional)
  breakdown: Map { 'Tuition': 1000, 'Bus': 500 },
  
  // Status
  status: String (completed, pending, failed, cancelled),
  
  // Audit
  processedBy: ObjectId,
  timestamps: { createdAt }
}
```

**Key Points**:
- **NO calculations** in this model
- Pure transaction record
- Links to invoice and receipt
- Immutable once created

**Indexes**:
- `{ studentId: 1, invoiceId: 1 }` - Lookup payments
- `{ transactionId: 1 }` - External validation
- `{ createdAt: -1 }` - Time-based queries

---

### 3. Receipt Model (Document Layer)

**Purpose**: Document representation of payment

```javascript
{
  _id: ObjectId,
  
  // References
  paymentId: ObjectId (unique),
  invoiceId: ObjectId,
  studentId: ObjectId,
  
  // Receipt Identification
  receiptNumber: String (RCP-20240401-00001),
  
  // Denormalized Info
  rollNumber: String,
  studentName: String,
  className: String,
  
  // Document Details
  pdfUrl: String,
  htmlContent: String,
  
  // Snapshot Data
  receiptData: {
    amount: Number,
    method: String,
    transactionId: String,
    date: Date,
    invoiceAmount: Number,
    previousBalance: Number,
    currentBalance: Number
  },
  
  // Status
  isGenerated: Boolean,
  generatedAt: Date,
  isArchived: Boolean,
  
  timestamps: { createdAt }
}
```

**Key Points**:
- One receipt per payment
- Snapshot data for future reference
- Can regenerate PDF from receipt data
- Read-only after creation

---

### 4. FeeStructureV2 Model (Master Data)

**Purpose**: Define fee configuration for a class

```javascript
{
  _id: ObjectId,
  
  // Identification
  classId: ObjectId,
  academicYear: String,
  
  // Fee Items
  items: [
    {
      name: String,
      category: String,
      type: String (mandatory, optional),
      description: String,
      amount: Number,
      frequency: String (monthly, quarterly, annual),
      isActive: Boolean
    }
  ],
  
  // Version Control
  version: Number,
  isActive: Boolean,
  
  // Audit
  createdBy: ObjectId,
  updatedBy: ObjectId,
  timestamps: { createdAt, updatedAt }
}
```

**Key Methods**:
- `getTotalMandatoryAmount()` - Sum mandatory fees
- `getTotalOptionalAmount()` - Sum optional fees
- `getActiveItems()` - Filter active items
- `getItemByCategory(category)` - Find specific item

**Indexes**:
- `{ classId: 1, academicYear: 1, isActive: 1 }` - Unique active structure

---

### 5. Ledger Model (Optional Accounting)

**Purpose**: Double-entry accounting for financial reporting

```javascript
{
  _id: ObjectId,
  
  // References
  studentId: ObjectId,
  invoiceId: ObjectId,
  paymentId: ObjectId,
  
  // Transaction Type
  transactionType: String (invoice, payment, adjustment),
  
  // Amounts
  debit: Number,    // Fee amount
  credit: Number,   // Payment amount
  balance: Number,  // Running balance
  
  // Details
  description: String,
  month: Number,
  academicYear: String,
  remarks: String,
  
  // Reconciliation
  isReconciled: Boolean,
  reconciledAt: Date,
  reconciledBy: ObjectId,
  
  timestamps: { createdAt }
}
```

**Use Cases**:
- Financial statement preparation
- Balance verification
- Audit trails
- Advanced reporting

---

## Service Layer

### InvoiceService

**Responsibilities**:
- Create/retrieve invoices
- Calculate totals and balances
- Apply discounts
- Generate batch invoices
- Produce reports

**Key Methods**:
```javascript
createOrGetInvoice()        // Create or retrieve invoice
getInvoiceById()            // Get by ID
getStudentInvoices()        // Get all student invoices
getPendingInvoices()        // Get unpaid/partial invoices
getStudentOutstanding()     // Get total dues
applyDiscount()             // Apply scholarship
validateInvoice()           // Check if can accept payment
generateMonthlyInvoices()   // Batch create invoices
getClassBillingReport()     // Class-level report
```

---

### PaymentService

**Responsibilities**:
- Process payments (main flow)
- Create receipts
- Record ledger entries
- Generate receipt numbers
- Payment statistics

**Key Methods**:
```javascript
processPayment()            // Main payment endpoint
getStudentPayments()        // Get all payments
getPaymentDetails()         // Get specific payment
getInvoicePayments()        // Payments for invoice
generateReceipt()           // Create receipt
generateReceiptNumber()     // Unique receipt number
createLedgerEntry()         // Optional accounting
getPaymentStats()           // Payment analytics
```

---

### FeeService

**Responsibilities**:
- Fee structure management
- Receipt retrieval
- Student fee summaries
- Billing reports
- Data validation and export

**Key Methods**:
```javascript
createFeeStructure()        // Create master data
getFeeStructure()           // Get current structure
getFeeStructureHistory()    // Version history
getReceipt()                // Get receipt by ID
getReceiptByNumber()        // Find by receipt number
getStudentReceipts()        // All receipts for student
getStudentFeeSummary()      // Comprehensive summary
getClassBillingReport()     // Class report
exportClassBillingData()    // CSV export
validateFeeCollection()     // Pre-payment check
```

---

## Controller Layer

### InvoiceController
- HTTP endpoints for invoice operations
- Input validation
- Error handling
- Response formatting

### PaymentController
- Payment processing endpoint
- Invoice validation endpoint
- Payment retrieval endpoints
- Statistics endpoints

### FeeController (feeNewController)
- Fee structure management
- Receipt management
- Report generation
- Data export

---

## API Routes

### Invoice Endpoints

```
POST   /fees/invoice/create                    Create invoice
GET    /fees/invoice/:studentId                Get student invoices
GET    /fees/invoice/details/:invoiceId        Get invoice details
GET    /fees/invoice/:studentId/outstanding   Get outstanding dues
POST   /fees/invoice/:invoiceId/discount      Apply discount
GET    /fees/invoice/class/:classId/summary   Get class summary
POST   /fees/invoice/generate-monthly         Generate monthly invoices
```

### Payment Endpoints

```
POST   /fees/pay                               Process payment ⭐
GET    /fees/payments/:studentId               Get student payments
GET    /fees/payments/details/:paymentId       Get payment details
GET    /fees/payments/invoice/:invoiceId      Get invoice payments
GET    /fees/payments/stats                    Get statistics
POST   /fees/validate-invoice                 Validate invoice
```

### Fee Structure Endpoints

```
POST   /fees/structure                         Create structure
GET    /fees/structure/:classId               Get structure
GET    /fees/structure/:classId/history       Get history
```

### Receipt Endpoints

```
GET    /fees/receipt/:receiptId               Get receipt
GET    /fees/receipt/number/:receiptNumber    Get by number
GET    /fees/receipts/:studentId              Get student receipts
```

### Report Endpoints

```
GET    /fees/student/:studentId/summary           Fee summary
GET    /fees/class/:classId/billing-report       Billing report
GET    /fees/class/:classId/export               CSV export
GET    /fees/payments/stats                      Payment stats
GET    /fees/dashboard                           Dashboard data
```

---

## Business Logic Flow

### Complete Payment Flow (Step-by-Step)

```
1. CREATE FEE STRUCTURE (Admin)
   ├─ Define fees for class
   ├─ Set as active
   └─ Version control for history

2. GENERATE INVOICE (System/Cron)
   ├─ Get all active students in class
   ├─ Get active fee structure
   ├─ Create invoice for each student
   ├─ Set status as 'unpaid'
   └─ Store denormalized student info

3. STUDENT PAYMENT (Accountant)
   ├─ User clicks "Pay Fee"
   ├─ Selects invoice
   ├─ Validates invoice (checks dueAmount > 0)
   ├─ Enters payment amount
   ├─ Selects payment method
   └─ Submits payment

4. PAYMENT PROCESSING (PaymentService)
   ├─ Validate amount ≤ dueAmount
   ├─ Create Payment record
   ├─ Update Invoice
   │   ├─ paidAmount += amount
   │   ├─ dueAmount -= amount
   │   └─ status = paid/partial/unpaid
   ├─ Create Receipt
   ├─ Create Ledger entry (optional)
   └─ Return result

5. GENERATE RECEIPT (PaymentService)
   ├─ Get unique receipt number
   ├─ Snapshot payment data
   ├─ Store student info
   ├─ Generate PDF (optional)
   └─ Return receipt reference

6. REPORTING (FeeService)
   ├─ Query invoices by status
   ├─ Calculate aggregates
   ├─ Format for display
   └─ Export as CSV
```

### Invoice Status Transitions

```
UNPAID → PARTIAL → PAID
  ↓       ↓        ↓
  └─ No payment   └─ Some payment   └─ Full payment received
```

---

## Scalability Features

### For 1000+ Students

#### 1. **Indexing Strategy**
```javascript
// Critical indexes
studentId: 1                    // Fast student lookups
classId: 1                      // Class reports
invoiceId: 1                    // Payment joins
status: 1                       // Quick pending invoice queries
academicYear: 1                 // Year-based filtering
{ studentId: 1, month: 1, year: 1 }  // Unique constraint
```

#### 2. **Denormalization**
```javascript
// Invoice stores frequently accessed fields
- rollNumber (avoid Student join)
- studentName (avoid Student join)
- className (avoid Class join)

// Reduces query latency for reports
```

#### 3. **Batch Operations**
```javascript
// Generate all class invoices in single operation
generateMonthlyInvoices(classId, month, year)
// Handles 100+ students efficiently
```

#### 4. **Aggregation Pipeline**
```javascript
// MongoDB aggregation for reports
db.invoices.aggregate([
  { $match: { classId, academicYear } },
  { $group: { 
      _id: "$status",
      count: { $sum: 1 },
      totalDue: { $sum: "$dueAmount" }
  }},
  { $sort: { _id: 1 }}
])
```

#### 5. **Pagination**
```javascript
// Large reports with pagination
GET /api/fees/class/:classId/billing-report?page=1&limit=50
```

#### 6. **Caching Strategy**
```javascript
// Cache fee structures (rarely change)
cache.set(`structure_${classId}_${year}`, structure, 86400)

// Cache student outstanding (invalidate on payment)
cache.del(`outstanding_${studentId}`)
```

---

## Security Model

### 1. Role-Based Access Control

```javascript
// Only accountants can process payments
POST /fees/pay
  └─ roles(['superadmin', 'admin', 'principal', 'accountant'])

// Students see only their own data
GET /fees/invoice/:studentId
  └─ Check: req.user.studentId === studentId (for students)

// Reports accessible only to admin
GET /fees/class/:classId/billing-report
  └─ roles(['superadmin', 'admin', 'principal', 'accountant'])
```

### 2. Data Validation

```javascript
// All inputs validated before processing
- Amount > 0
- Invoice exists and belongs to student
- Invoice can accept payment
- Payment method is valid
- Academic year format correct
```

### 3. Audit Trail

```javascript
// All payments recorded with
- processedBy (who)
- timestamp (when)
- transactionId (external verification)
- remarks (why)

// Can reconstruct payment history
```

### 4. Immutability

```javascript
// Payments are immutable
- Cannot edit past payment
- Cannot delete payment
- Only mark as cancelled (with reason)

// Invoices can be modified (discount)
- Audit log entries created
```

---

## Integration Points

### 1. Payment Gateway Integration

```javascript
// Ready for online payments
processPayment({
  ...paymentData,
  paymentMethod: 'online',
  transactionId: 'RAZORPAY_TXN_12345' // From gateway
})

// Works with:
- Razorpay
- Stripe
- PayU
- Any gateway returning transactionId
```

### 2. SMS/Email Notifications

```javascript
// Hook into payment completion
paymentService.processPayment()
  .then(result => {
    // Send SMS to parent
    sendSMS(student.parentPhone, 
      `Payment received: Rs ${result.payment.amount}`)
    
    // Send email with receipt
    sendEmail(student.email, 
      'Fee Receipt', 
      receipt)
  })
```

### 3. Student Portal Integration

```javascript
// Student dashboard can show
GET /api/fees/student/:studentId/summary
{
  totalBilled, totalPaid, totalDue,
  paymentPercentage, invoices[]
}

// And receipts
GET /api/fees/receipts/:studentId
```

### 4. ERP Dashboard

```javascript
// Admin dashboard can show
GET /api/fees/class/:classId/billing-report
{
  summary: { totalBilled, collected, pending },
  report: [ student details ]
}
```

### 5. Accounting Software

```javascript
// Export ledger entries for integration
GET /api/ledger/entries
?startDate=2024-01-01&endDate=2024-12-31

// Format for import into tally/quickbooks
```

---

## Performance Considerations

### Query Optimization

```javascript
// ❌ Inefficient: Multiple queries
const invoice = await Invoice.findById(id);
const student = await Student.findById(invoice.studentId);
const class = await Class.findById(invoice.classId);

// ✅ Efficient: Use denormalization
const invoice = await Invoice.findById(id);
// Student name and class already in invoice
```

### Batch Processing

```javascript
// ❌ Slow: Loop through students
for (const student of students) {
  await createInvoice(student._id);
}

// ✅ Fast: Batch operation
await invoiceService.generateMonthlyInvoices(classId, month, year)
```

### Report Generation

```javascript
// ❌ Slow: Load all invoices in memory
const invoices = await Invoice.find({ classId });
let total = 0;
invoices.forEach(inv => total += inv.dueAmount);

// ✅ Fast: MongoDB aggregation
await Invoice.aggregate([
  { $match: { classId } },
  { $group: { _id: null, total: { $sum: "$dueAmount" } }}
])
```

---

## Monitoring & Maintenance

### Key Metrics to Track

```javascript
- Payment Success Rate
- Average Days to Collection
- Outstanding Dues Trend
- Payment Method Distribution
- Late Fees Generated
- Discount Distribution
```

### Regular Maintenance

```javascript
// Monthly
- Verify all invoices generated
- Check for orphaned payments
- Reconcile ledger entries

// Quarterly
- Audit outstanding dues
- Review fee structure changes
- Verify receipt archive

// Annually
- Ledger reconciliation
- Financial statement preparation
- System backup verification
```

---

## Conclusion

This architecture provides:

✅ **Single source of truth** (Invoice)
✅ **Clean separation of concerns** (Service layer)
✅ **Scalability** (Indexing, denormalization, aggregation)
✅ **Security** (RBAC, validation, audit trail)
✅ **Extensibility** (Integration ready)
✅ **Maintainability** (Clear structure, documented)
✅ **Performance** (Optimized queries)

Perfect for growing from 100 to 10,000+ students.

---

**Last Updated**: 2024
**Version**: 2.0 (ERP Level)
**Status**: Production Ready
