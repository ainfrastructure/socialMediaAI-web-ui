#!/usr/bin/env node
const https = require('https');

const LINEAR_API_KEY = 'lin_api_mxU59TuOEyBkZYDPCdFN6jTpbyFfGeDONZwcf2yf';

const data = JSON.stringify({
  query: '{ teams { nodes { id name key } } }'
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
    const response = JSON.parse(body);
    if (response.data && response.data.teams) {
      const teams = response.data.teams.nodes;
      console.log('Available teams:');
      teams.forEach((team, index) => {
        console.log(`\n${index + 1}. ${team.name}`);
        console.log(`   Key: ${team.key}`);
        console.log(`   ID: ${team.id}`);
      });

      // If there's only one team, output just the ID
      if (teams.length === 1) {
        console.log(`\n✅ Found 1 team. Using: ${teams[0].id}`);
        process.stdout.write(teams[0].id);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(data);
req.end();
