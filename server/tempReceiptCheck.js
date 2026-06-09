const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const FeeReceipt = require('./src/models/FeeReceipt');
const FeePayment = require('./src/models/FeePayment');
const url = process.env.MONGODB_URL || process.env.MONGODB_URI;
if (!url) {
  console.error('No mongo url');
  process.exit(1);
}
(async () => {
  try {
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const id = '6a23efa210c098d85b2d4a19';
    console.log('ReceiptById:', await FeeReceipt.findById(id).lean());
    console.log('ReceiptByNumber:', await FeeReceipt.findOne({ receiptNumber: id }).lean());
    console.log('PaymentById:', await FeePayment.findById(id).lean());
    console.log('ReceiptByPaymentId:', await FeeReceipt.findOne({ paymentId: id }).lean());
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
