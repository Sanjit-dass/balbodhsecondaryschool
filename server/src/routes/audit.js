const express = require('express');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const router = express.Router();
const logPath = path.resolve(__dirname, '..', '..', 'logs', 'audit.log');

const parseEntries = () => {
  if (!fs.existsSync(logPath)) return [];
  const raw = fs.readFileSync(logPath, 'utf8').trim();
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
};

router.get('/', auth, roles(['superadmin','principal']), async (req, res) => {
  try {
    const entries = parseEntries();
    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/export/csv', auth, roles(['superadmin','principal']), async (req, res) => {
  try {
    const entries = parseEntries();
    const fields = ['timestamp','action','user','path','method','body','ip'];
    const parser = new Parser({ fields });
    const rows = entries.map((entry) => ({
      timestamp: entry.timestamp,
      action: entry.action,
      user: entry.user ? JSON.stringify(entry.user) : '',
      path: entry.path,
      method: entry.method,
      body: entry.body ? JSON.stringify(entry.body) : '',
      ip: entry.ip
    }));
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-log.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
