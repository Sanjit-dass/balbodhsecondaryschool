/**
 * INTEGRATION GUIDE
 * How to integrate the new fee system into your Express server
 */

// ==============================================================
// STEP 1: Update your main server file (src/index.js)
// ==============================================================

// Add these imports at the top
const feesV2Routes = require('./routes/feesV2');
// Keep legacy routes if needed
const feesLegacyRoutes = require('./routes/fees');

// In your Express setup section, add the new routes:

// ✅ NEW FEE SYSTEM (Recommended)
app.use('/api/fees', feesV2Routes);

// ⚠️ LEGACY (Keep for backward compatibility)
app.use('/api/fees-legacy', feesLegacyRoutes);

// ==============================================================
// STEP 2: Ensure Models are Exported
// ==============================================================

// Check that these models exist:
// - server/src/models/Invoice.js ✅
// - server/src/models/Payment.js ✅
// - server/src/models/Receipt.js ✅
// - server/src/models/FeeStructureV2.js ✅
// - server/src/models/Ledger.js ✅

// ==============================================================
// STEP 3: Create Monthly Invoice Cron Job
// ==============================================================

// Create a new file: server/src/crons/invoiceGenerator.js

const invoiceService = require('../services/invoiceService');
const ClassModel = require('../models/Class');

async function generateMonthlyInvoices() {
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Determine academic year (April-based)
    const academicYear =
      month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

    // Get all active classes
    const classes = await ClassModel.find({ isActive: true });

    for (const classDoc of classes) {
      const result = await invoiceService.generateMonthlyInvoices(
        classDoc._id,
        month,
        academicYear
      );

      console.log(
        `[INVOICE CRON] ${classDoc.name}: Created ${result.created}, Failed ${result.failed}`
      );
    }

    console.log('[INVOICE CRON] Monthly invoice generation completed');
  } catch (error) {
    console.error('[INVOICE CRON] Error:', error);
  }
}

// Schedule using node-cron
const cron = require('node-cron');

// Run on 1st day of every month at 00:00 AM
cron.schedule('0 0 1 * *', () => {
  console.log('[CRON] Starting monthly invoice generation...');
  generateMonthlyInvoices();
});

module.exports = { generateMonthlyInvoices };

// ==============================================================
// STEP 4: Install Required Dependencies
// ==============================================================

/*
npm install express mongoose
npm install node-cron --save    // For scheduling cron jobs

Optional (for PDF generation):
npm install pdfkit
npm install cloudinary          // For storing PDF receipts
npm install nodemailer          // For email notifications
npm install twilio              // For SMS notifications
*/

// ==============================================================
// STEP 5: Complete Server Integration Example
// ==============================================================

const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware (keep your existing)
const auth = require('./middleware/auth');

// ============ NEW FEE SYSTEM ============
const feesV2Routes = require('./routes/feesV2');
const { generateMonthlyInvoices } = require('./crons/invoiceGenerator');

// Routes
app.use('/api/fees', feesV2Routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'fee-management-v2' });
});

// Start monthly invoice generation cron
generateMonthlyInvoices(); // Initial run
cron.schedule('0 0 1 * *', generateMonthlyInvoices); // Monthly

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Fee Management System v2.0 initialized');
});

// ==============================================================
// STEP 6: Testing the Integration
// ==============================================================

/*
1. Start your server:
   node server/src/index.js

2. Check health:
   curl http://localhost:5000/api/health

3. Create fee structure:
   curl -X POST http://localhost:5000/api/fees/structure \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "classId": "class_id",
       "academicYear": "2024-2025",
       "items": [
         {
           "name": "Tuition",
           "category": "tuition",
           "type": "mandatory",
           "amount": 5000
         }
       ]
     }'

4. Generate invoices:
   curl -X POST http://localhost:5000/api/fees/invoice/generate-monthly \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "classId": "class_id",
       "month": 4,
       "academicYear": "2024-2025"
     }'

5. Process payment:
   curl -X POST http://localhost:5000/api/fees/pay \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "studentId": "student_id",
       "invoiceId": "invoice_id",
       "amount": 5000,
       "paymentMethod": "cash"
     }'
*/

// ==============================================================
// STEP 7: Troubleshooting
// ==============================================================

/*
Issue: Routes not found (404)
Solution:
  - Ensure feesV2.js is correctly imported
  - Check that models are in correct path
  - Verify auth middleware is working
  - Check role-based access control

Issue: Payment validation fails
Solution:
  - Ensure invoice exists
  - Check studentId matches
  - Verify amount <= dueAmount
  - Check invoice isActive = true

Issue: Cron job not running
Solution:
  - Ensure node-cron is installed
  - Check cron schedule syntax
  - Add console logs to verify execution
  - Check server logs for errors

Issue: Receipt generation fails
Solution:
  - Verify Receipt model is imported
  - Check unique receiptNumber constraint
  - Ensure payment is completed status
  - Check database connection
*/

// ==============================================================
// STEP 8: Database Indexes Setup
// ==============================================================

/*
MongoDB Commands to create indexes:

use your_school_db

// Invoice Indexes
db.invoices.createIndex({ studentId: 1, month: 1, academicYear: 1 }, { unique: true })
db.invoices.createIndex({ status: 1, academicYear: 1 })
db.invoices.createIndex({ classId: 1 })

// Payment Indexes
db.payments.createIndex({ studentId: 1, invoiceId: 1 })
db.payments.createIndex({ transactionId: 1 })
db.payments.createIndex({ createdAt: -1 })

// Receipt Indexes
db.receipts.createIndex({ studentId: 1, createdAt: -1 })
db.receipts.createIndex({ receiptNumber: 1 }, { unique: true })

// FeeStructure Indexes
db.fee_structures.createIndex({ classId: 1, academicYear: 1, isActive: 1 }, { unique: true, sparse: true })

// Ledger Indexes
db.ledgers.createIndex({ studentId: 1, createdAt: -1 })
db.ledgers.createIndex({ invoiceId: 1 })
*/

// ==============================================================
// STEP 9: Environment Variables
// ==============================================================

/*
Add to your .env file:

# Fee System
FEE_SYSTEM_ENABLED=true
INVOICE_GENERATION_ENABLED=true
LEDGER_ENABLED=true
AUTO_RECEIPT_GENERATION=true

# Optional: PDF Storage
CLOUDINARY_NAME=your_name
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret

# Optional: Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+1234567890
*/

module.exports = { generateMonthlyInvoices };
