#!/usr/bin/env node
const https = require('https');

const LINEAR_API_KEY = 'lin_api_mxU59TuOEyBkZYDPCdFN6jTpbyFfGeDONZwcf2yf';
const LINEAR_TEAM_ID = 'a1d72468-d667-4657-90a6-e48a7d0b1b8f';

const data = JSON.stringify({
  query: `
    query {
      issues(
        filter: {
          team: { id: { eq: "${LINEAR_TEAM_ID}" } }
        }
        orderBy: createdAt
        last: 30
      ) {
        nodes {
          identifier
          title
          state {
            name
            type
          }
          labels {
            nodes {
              name
            }
          }
          createdAt
        }
      }
    }
  `
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
    if (response.data && response.data.issues) {
      const issues = response.data.issues.nodes;

      console.log(`\n📊 Found ${issues.length} recent issues:\n`);

      const migrationIssues = issues.filter(issue =>
        issue.labels.nodes.some(label =>
          label.name === 'native-migration' || label.name === 'ralph-task'
        )
      );

      console.log(`✅ Native Migration issues: ${migrationIssues.length}\n`);

      migrationIssues.forEach(issue => {
        const labels = issue.labels.nodes.map(l => l.name).join(', ');
        console.log(`${issue.identifier}: ${issue.title}`);
        console.log(`   Status: ${issue.state.name} (${issue.state.type})`);
        console.log(`   Labels: ${labels}`);
        console.log(`   Created: ${new Date(issue.createdAt).toLocaleString()}`);
        console.log('');
      });

      if (migrationIssues.length === 0) {
        console.log('⚠️  No migration issues found with labels "native-migration" or "ralph-task"');
      }
    } else {
      console.error('Error:', response);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(data);
req.end();
