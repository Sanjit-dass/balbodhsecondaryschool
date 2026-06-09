const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a PDF Buffer directly to Cloudinary
 * @param {Buffer} buffer
 * @param {String} folder
 * @param {String} filename
 * @returns {Promise<String>} secure_url
 */
const uploadPdfBuffer = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `balbodh-school/${folder}`,
        public_id: filename,
        resource_type: 'auto', // PDF is best uploaded as auto so it displays inline in browsers
        format: 'pdf',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary buffer upload error:', error);
          return reject(error);
        }
        resolve(result.secure_url || result.url);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Generate PDF Receipt Buffer
 * @param {Object} data - { receiptNumber, student, invoice, payment }
 * @returns {Promise<Buffer>}
 */
const generateReceiptPdfBuffer = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const { receiptNumber, student, invoice, payment } = data;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- PREMIUM PDF DESIGN SYSTEMS ---
      // Primary Colors
      const primaryColor = '#1e3a8a'; // Deep Navy
      const secondaryColor = '#b45309'; // Warm Amber
      const textColor = '#374151'; // Charcoal
      const lightBg = '#f3f4f6'; // Light Gray
      const gridBorder = '#e5e7eb'; // Grid line gray

      // Header Branding
      doc.fillColor(primaryColor)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('BAL BODH SECONDARY SCHOOL', { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text('Kathmandu, Nepal | Tel: +977-1-4XXXXXX | info@balbodh.edu.np', { align: 'center' })
         .moveDown(1.5);

      // Receipt Title & Metadata Banner
      doc.rect(50, doc.y, 495, 40)
         .fill(primaryColor);

      // Reset text pointer position and draw receipt title
      doc.fillColor('#ffffff')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('OFFICIAL FEE RECEIPT', 65, doc.y - 30);

      const formattedDate = new Date(payment.createdAt || new Date()).toLocaleDateString();
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Receipt No: ${receiptNumber}  |  Date: ${formattedDate}`, 250, doc.y - 12, { align: 'right', width: 280 });

      doc.moveDown(2.5);

      // Student and Billing Information Grid
      const col1X = 50;
      const col2X = 300;
      const startY = doc.y;

      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('STUDENT INFORMATION', col1X, startY);
      doc.fillColor(textColor).font('Helvetica').fontSize(10);
      doc.text(`Name: ${student?.fullName || invoice.studentName || 'N/A'}`, col1X, startY + 20);
      doc.text(`Roll / Admission No: ${student?.rollNumber || student?.admissionNumber || invoice.rollNumber || 'N/A'}`, col1X, startY + 35);
      doc.text(`Class: ${invoice.className || 'N/A'}`, col1X, startY + 50);

      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('PAYMENT DETAILS', col2X, startY);
      doc.fillColor(textColor).font('Helvetica').fontSize(10);
      doc.text(`Academic Year: ${invoice.academicYear}`, col2X, startY + 20);
      doc.text(`Billing Month: Month ${invoice.month}`, col2X, startY + 35);
      doc.text(`Payment Method: ${String(payment.method).toUpperCase()}`, col2X, startY + 50);
      if (payment.transactionId) {
        doc.text(`Transaction ID: ${payment.transactionId}`, col2X, startY + 65);
      }

      doc.moveDown(5);

      // Itemized Payment Allocation Table
      const tableTop = doc.y + 10;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('FEE BREAKDOWN & PAYMENT ALLOCATION', col1X, tableTop - 20);

      // Table Header Row
      doc.rect(50, tableTop, 495, 20).fill(primaryColor);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('Fee Category / Item Name', 60, tableTop + 5, { width: 250 });
      doc.text('Total Due', 320, tableTop + 5, { width: 100, align: 'right' });
      doc.text('Allocated Payment', 430, tableTop + 5, { width: 100, align: 'right' });

      // Table Body Rows
      let currentY = tableTop + 20;
      doc.fillColor(textColor).font('Helvetica').fontSize(9);

      const invoiceItems = invoice.items || [];
      const bd = payment.breakdown || new Map();

      invoiceItems.forEach((item, idx) => {
        // Draw background zebra striping
        if (idx % 2 === 1) {
          doc.rect(50, currentY, 495, 20).fill(lightBg);
        }

        doc.fillColor(textColor);
        doc.text(item.name, 60, currentY + 5, { width: 250 });
        doc.text(item.amount.toFixed(2), 320, currentY + 5, { width: 100, align: 'right' });

        // Get paid allocation for this specific item
        const allocatedVal = bd instanceof Map ? (bd.get(item.name) || 0) : (bd[item.name] || 0);
        doc.text(allocatedVal.toFixed(2), 430, currentY + 5, { width: 100, align: 'right' });

        // Draw thin bottom border
        doc.strokeColor(gridBorder).lineWidth(0.5).moveTo(50, currentY + 20).lineTo(545, currentY + 20).stroke();

        currentY += 20;
      });

      doc.moveDown(2);

      // Financial Calculation Summary Box (Right aligned)
      const summaryX = 320;
      const summaryWidth = 225;
      const summaryStartY = doc.y + 10;

      // Draw box border
      doc.strokeColor(primaryColor).lineWidth(1).rect(summaryX, summaryStartY, summaryWidth, 100).stroke();

      doc.fillColor(textColor).font('Helvetica').fontSize(9);
      doc.text('Total Invoice Amount:', summaryX + 10, summaryStartY + 10);
      doc.text(invoice.totalAmount.toFixed(2), summaryX + 130, summaryStartY + 10, { align: 'right', width: 80 });

      doc.text('Applied Discount:', summaryX + 10, summaryStartY + 25);
      doc.text((invoice.discount || 0).toFixed(2), summaryX + 130, summaryStartY + 25, { align: 'right', width: 80 });

      doc.text('Net Billed Dues:', summaryX + 10, summaryStartY + 40);
      doc.text(invoice.netAmount.toFixed(2), summaryX + 130, summaryStartY + 40, { align: 'right', width: 80 });

      // Highlight current payment
      doc.fillColor(secondaryColor).font('Helvetica-Bold');
      doc.text('Amount Paid Now:', summaryX + 10, summaryStartY + 60);
      doc.text(payment.amount.toFixed(2), summaryX + 130, summaryStartY + 60, { align: 'right', width: 80 });

      // Highlight remaining due balance
      doc.fillColor(primaryColor);
      doc.text('Remaining Balance:', summaryX + 10, summaryStartY + 80);
      doc.text(invoice.dueAmount.toFixed(2), summaryX + 130, summaryStartY + 80, { align: 'right', width: 80 });

      doc.moveDown(7);

      // Footer - Terms & Signatures
      const footerY = doc.y;
      doc.strokeColor(textColor).lineWidth(0.5).moveTo(50, footerY).lineTo(545, footerY).stroke();

      doc.fillColor(textColor).font('Helvetica').fontSize(8)
         .text('Thank you for your payment. This is a computer-generated official receipt and does not require a physical signature.', 50, footerY + 10, { width: 300 });

      doc.fontSize(10).font('Helvetica-Bold')
         .text('School Accountant', 420, footerY + 25, { width: 125, align: 'center' });
      doc.strokeColor(textColor).lineWidth(0.5).moveTo(420, footerY + 20).lineTo(545, footerY + 20).stroke();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateReceiptPdfBuffer,
  uploadPdfBuffer,
};
