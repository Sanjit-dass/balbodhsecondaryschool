const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });
const auditFile = path.join(logPath, 'audit.log');

module.exports = (action) => (req, res, next) => {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    user: req.user || null,
    path: req.originalUrl,
    method: req.method,
    body: req.body || null,
    ip: req.ip
  };
  fs.appendFile(auditFile, JSON.stringify(entry) + '\n', () => {});
  next();
};
