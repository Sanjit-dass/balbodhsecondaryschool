const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');

const CONTACT_SUBJECTS = ['admission', 'fees', 'academics', 'facilities', 'other'];

async function sendAdminNotificationEmail(contact) {
  if (!process.env.EMAIL_SERVICE_HOST || !process.env.EMAIL_SERVICE_USER || !process.env.EMAIL_SERVICE_PASS) {
    return;
  }

  const toEmail = process.env.CONTACT_NOTIFICATION_EMAIL || process.env.EMAIL_SERVICE_USER;
  if (!toEmail) return;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVICE_HOST,
      port: Number(process.env.EMAIL_SERVICE_PORT) || 587,
      secure: process.env.EMAIL_SERVICE_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASS
      }
    });

    const html = `
      <p><strong>New contact inquiry received</strong></p>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${contact.subject}</p>
      <p><strong>Message:</strong><br/>${contact.message.replace(/\n/g, '<br/>')}</p>
      <p><strong>IP Address:</strong> ${contact.ipAddress || 'N/A'}</p>
      <p><strong>User Agent:</strong> ${contact.userAgent || 'N/A'}</p>
    `;

    await transporter.sendMail({
      from: `"Bal Bodh Sec School" <${process.env.EMAIL_SERVICE_USER}>`,
      to: toEmail,
      subject: `Contact inquiry from ${contact.name}`,
      text: `New contact inquiry from ${contact.name} (${contact.email}). Subject: ${contact.subject}. Message: ${contact.message}`,
      html
    });
  } catch (err) {
    console.error('Failed to send contact inquiry email:', err);
  }
}

exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const contactSubject = subject && CONTACT_SUBJECTS.includes(subject) ? subject : 'other';

    const contact = new ContactMessage({
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
      subject: contactSubject,
      message: String(message || '').trim(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        path: req.originalUrl,
        referrer: req.get('referer') || ''
      }
    });

    await contact.save();
    sendAdminNotificationEmail(contact).catch(() => {});

    res.status(201).json({ message: 'Your message has been submitted successfully.' });
  } catch (err) {
    console.error('submitContact error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listMessages = async (req, res) => {
  try {
    const { status, subject, search, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { subject: regex },
        { message: regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ContactMessage.countDocuments(query);
    const items = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({ total, page: Number(page), limit: Number(limit), items });
  } catch (err) {
    console.error('listMessages error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id).lean();
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message });
  } catch (err) {
    console.error('getMessage error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { status } = req.body;
    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (status) {
      message.status = status;
      if (status === 'read' && !message.readAt) {
        message.readAt = new Date();
      }
      if (status !== 'read') {
        message.readAt = null;
      }
    }

    await message.save();
    res.json({ message: 'Message updated', data: message });
  } catch (err) {
    console.error('updateMessage error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('deleteMessage error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
