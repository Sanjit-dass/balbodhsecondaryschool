require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ user: { id: '000000000000000000000000', role: 'student' } }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

// Use a known studentId from DB (replace if needed)
const data = JSON.stringify({ studentId: '6a267d5acfd5e9f2039af45f' });

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/fees/student/claim',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try { console.log(JSON.parse(body)); } catch (e) { console.log(body); }
  });
});

req.on('error', (e) => { console.error('Request error', e); });
req.write(data);
req.end();
