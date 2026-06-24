const http = require('http');
const data = JSON.stringify({ className: '10', rollNumber: '1' });

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/fees/lookup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
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
