#!/usr/bin/env node
const https = require('https');

const LINEAR_API_KEY = 'lin_api_mxU59TuOEyBkZYDPCdFN6jTpbyFfGeDONZwcf2yf';

const data = JSON.stringify({
  query: '{ viewer { name email } }'
});

const options = {
  hostname: 'api.linear.app',
  port: 443,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Authorization': LINEAR_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
