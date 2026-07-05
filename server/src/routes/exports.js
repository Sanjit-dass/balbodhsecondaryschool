const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');

const router = express.Router();

const auditLogPath = path.resolve(__dirname, '..', '..', 'logs', 'audit.log');

const exportConfigs = {
  students: {
    model: require('../models/Student'),
    fields: ['admissionNumber','fullName','class','section','phone','createdAt']
  },
  teachers: {
    model: require('../models/Teacher'),
    fields: ['employeeId','fullName','email','department','phone','createdAt']
  },
  classes: {
    model: require('../models/Class'),
    fields: ['name','section','academicYear','createdAt']
  },
  subjects: {
    model: require('../models/Subject'),
    fields: ['name','code','class','teacher','createdAt']
  },
  attendance: {
    model: require('../models/Attendance'),
    fields: ['studentName','class','section','status','date','type','createdAt']
  },
  exams: {
    model: require('../models/Exam'),
    fields: ['title','type','class','date','totalMarks','createdAt']
  },
  fees: {
    model: require('../models/Fee'),
    fields: ['title','amount','paid','student','dueDate','createdAt']
  },
  notices: {
    model: require('../models/Notice'),
    fields: ['title','audience','publishedAt','createdAt']
  },
  assignments: {
    model: require('../models/Assignment'),
    fields: ['title','class','subject','dueDate','createdAt']
  },
  library: {
    model: require('../models/Library'),
    fields: ['title','author','isbn','category','copies','createdAt']
  },
  vehicles: {
    model: require('../models/Vehicle'),
    fields: ['vehicleNumber','driverName','route','capacity','createdAt']
  },
  notifications: {
    model: require('../models/Notification'),
    fields: ['title','type','audience','createdAt']
  },
  results: {
    model: require('../models/Result'),
    fields: ['student','exam','class','grade','score','createdAt']
  },
  audit: {
    loader: async () => {
      if (!fs.existsSync(auditLogPath)) return [];
      const content = fs.readFileSync(auditLogPath, 'utf8').trim();
      if (!content) return [];
      return content.split('\n').map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
    },
    fields: ['timestamp','action','user','path','method','body','ip']
  }
};

const generatePdf = (rows, fields, title) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);

  rows.forEach((row) => {
    fields.forEach((field) => {
      const value = typeof row[field] === 'object' ? JSON.stringify(row[field]) : row[field];
      doc.text(`${field}: ${value ?? ''}`);
    });
    doc.moveDown();
  });

  doc.end();
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findClassByName = async (className) => {
  if (!className || typeof className !== 'string') return null;
  const Class = require('../models/Class');
  let normalized = className.trim();
  normalized = normalized.replace(/:\d+$/, '').trim();
  normalized = normalized.replace(/^class\s*/i, '').trim();
  normalized = normalized.replace(/(?:st|nd|rd|th)$/i, '').trim();
  if (!normalized) return null;

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    const classDoc = await Class.findById(normalized).lean();
    if (classDoc) return classDoc;
  }

  let classDoc = await Class.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') }).lean();
  if (classDoc) return classDoc;

  const numericMatch = normalized.match(/^(\d+)$/);
  if (numericMatch) {
    classDoc = await Class.findOne({ numeric: parseInt(numericMatch[1], 10) }).lean();
    if (classDoc) return classDoc;
  }

  return Class.findOne({ name: new RegExp(escapeRegex(normalized), 'i') }).lean();
};

const buildRows = (resource, rows) => {
  if (resource === 'audit') {
    return rows.map((entry) => ({
      timestamp: entry.timestamp,
      action: entry.action,
      user: entry.user ? JSON.stringify(entry.user) : '',
      path: entry.path,
      method: entry.method,
      body: entry.body ? JSON.stringify(entry.body) : '',
      ip: entry.ip
    }));
  }

  return rows.map((row) => {
    const flattened = {};
    Object.keys(row).forEach((key) => {
      if (row[key] && typeof row[key] === 'object' && row[key]._id) {
        flattened[key] = row[key].name || row[key].fullName || row[key].title || row[key]._id;
      } else {
        flattened[key] = row[key];
      }
    });
    return flattened;
  });
};

const getRows = async (resource, query = {}) => {
  const config = exportConfigs[resource];
  if (!config) throw new Error('Unsupported export resource');
  if (config.loader) return config.loader();

  if (resource === 'students') {
    const Student = require('../models/Student');
    const filter = {};
    const className = query.className || query.class || '';

    if (className) {
      const classDoc = await findClassByName(className);
      if (classDoc) {
        filter.$or = [
          { class: classDoc._id },
          { className: classDoc.name },
          { className: className },
          { className: new RegExp(`^${escapeRegex(className)}$`, 'i') }
        ];
      } else {
        filter.className = className;
      }
    }

    return Student.find(filter).populate('class', 'name section numeric').sort({ admissionNumber: 1, rollNumber: 1, fullName: 1 }).lean();
  }

  return config.model.find().lean();
};

router.get('/:resource/:type', auth, async (req, res) => {
  try {
    const { resource, type } = req.params;
    const config = exportConfigs[resource];
    if (!config) return res.status(404).json({ message: 'Export resource not found' });

    const exportRoles = {
      audit: ['superadmin','admin','principal'],
      students: ['superadmin','admin','principal','teacher','accountant'],
      teachers: ['superadmin','admin','principal','teacher'],
      classes: ['superadmin','admin','principal','teacher'],
      subjects: ['superadmin','admin','principal','teacher'],
      attendance: ['superadmin','admin','principal','teacher','student','parent'],
      exams: ['superadmin','admin','principal','teacher','examcontroller'],
      fees: ['superadmin','admin','principal','accountant','student','parent'],
      notices: ['superadmin','admin','principal','teacher','student','parent','accountant'],
      assignments: ['superadmin','admin','principal','teacher','student','parent'],
      library: ['superadmin','admin','principal','teacher','student','parent','accountant'],
      vehicles: ['superadmin','admin','principal','accountant'],
      notifications: ['superadmin','admin','principal','teacher','student','parent','accountant'],
      results: ['superadmin','admin','principal','teacher','examcontroller','student','parent'],
      audit: ['superadmin','admin','principal']
    };

    const allowedRoles = exportRoles[resource] || ['superadmin','principal'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (type !== 'pdf') {
      return res.status(400).json({ message: 'Only PDF export is supported' });
    }

    let rows;
    if (resource === 'attendance' && req.query.id) {
      const Attendance = require('../models/Attendance');
      const rec = await Attendance.findById(req.query.id).populate('class','name').populate('subject','name').lean();
      rows = rec ? [rec] : [];
    } else {
      rows = await getRows(resource, req.query);
    }
    const data = buildRows(resource, rows);
    const fields = config.fields;
    const title = `${resource}-export`;

    const pdfBuffer = await generatePdf(data, fields, `${resource} export`);
    res.header('Content-Type', 'application/pdf');
    res.attachment(`${title}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
