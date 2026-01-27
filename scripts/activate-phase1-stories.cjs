#!/usr/bin/env node
/**
 * Move Phase 1 stories to Todo status for Ralph Loop
 *
 * Phase 1 (Foundation): INF-16, INF-17, INF-39
 */

const https = require('https');

const LINEAR_API_KEY = 'lin_api_mxU59TuOEyBkZYDPCdFN6jTpbyFfGeDONZwcf2yf';
const LINEAR_TEAM_ID = 'a1d72468-d667-4657-90a6-e48a7d0b1b8f';

// Phase 1 critical stories to activate
const PHASE_1_STORIES = [
  'INF-16', // Foundation & Infrastructure Setup
  'INF-17', // Authentication & Onboarding
  'INF-39'  // Migration of Design System
];

async function linearRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

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
        try {
          const response = JSON.parse(body);
          if (response.errors) {
            reject(new Error(JSON.stringify(response.errors, null, 2)));
          } else {
            resolve(response.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getIssueId(identifier) {
  const query = `
    query {
      issue(id: "${identifier}") {
        id
        identifier
        title
        state {
          id
          name
        }
      }
    }
  `;

  const result = await linearRequest(query);
  return result.issue;
}

async function getTodoStateId() {
  const query = `
    query {
      team(id: "${LINEAR_TEAM_ID}") {
        states {
          nodes {
            id
            name
            type
          }
        }
      }
    }
  `;

  const result = await linearRequest(query);
  const todoState = result.team.states.nodes.find(state =>
    state.type === 'unstarted' || state.name.toLowerCase().includes('todo')
  );

  return todoState;
}

async function updateIssueState(issueId, stateId) {
  const mutation = `
    mutation {
      issueUpdate(
        id: "${issueId}"
        input: { stateId: "${stateId}" }
      ) {
        issue {
          id
          identifier
          title
          state {
            name
          }
        }
      }
    }
  `;

  const result = await linearRequest(mutation);
  return result.issueUpdate.issue;
}

async function main() {
  console.log('🚀 Activating Phase 1 Stories for Ralph Loop\n');
  console.log('Moving to Todo status:');
  console.log('  - INF-16: Foundation & Infrastructure');
  console.log('  - INF-17: Authentication & Onboarding');
  console.log('  - INF-39: Design System Migration\n');

  try {
    // Get Todo state
    console.log('📋 Finding Todo state...');
    const todoState = await getTodoStateId();

    if (!todoState) {
      console.error('❌ Could not find Todo state');
      console.log('\nAvailable states:');
      const query = `
        query {
          team(id: "${LINEAR_TEAM_ID}") {
            states {
              nodes {
                id
                name
                type
              }
            }
          }
        }
      `;
      const result = await linearRequest(query);
      result.team.states.nodes.forEach(state => {
        console.log(`  - ${state.name} (${state.type})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found state: ${todoState.name} (${todoState.id})\n`);

    // Update each Phase 1 story
    for (const identifier of PHASE_1_STORIES) {
      try {
        console.log(`📌 Processing ${identifier}...`);

        const issue = await getIssueId(identifier);
        console.log(`   Found: ${issue.title}`);
        console.log(`   Current state: ${issue.state.name}`);

        if (issue.state.name === todoState.name) {
          console.log(`   ✓ Already in ${todoState.name}\n`);
          continue;
        }

        const updated = await updateIssueState(issue.id, todoState.id);
        console.log(`   ✅ Moved to: ${updated.state.name}\n`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
    }

    console.log('═'.repeat(60));
    console.log('✨ Phase 1 stories ready for Ralph Loop!\n');
    console.log('Next steps:');
    console.log('  1. Run: ./scripts/sync-linear.sh');
    console.log('  2. Run: ./scripts/ralph-overnight.sh');
    console.log('  3. Ralph will start with Phase 1 stories! 🤖\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
