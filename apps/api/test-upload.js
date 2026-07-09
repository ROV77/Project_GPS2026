const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: '1', role: 'store_owner' }, 'dev-only-insecure-secret-change-me', { expiresIn: '1h' });
const http = require('http');
const crypto = require('crypto');

const boundary = '----Boundary' + crypto.randomBytes(8).toString('hex');
const payload = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n' + Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000B4944415478DA636000020000050001E9FA0E2F0000000049454E44AE426082', 'hex').toString('binary') + '\r\n--' + boundary + '--\r\n';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/uploads/image?kind=store_logo',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Authorization': 'Bearer ' + token
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.on('error', e => console.error(e));
req.write(payload, 'binary');
req.end();
