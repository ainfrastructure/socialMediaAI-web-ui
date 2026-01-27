#!/usr/bin/env node
/**
 * Sync Linear stories to Ralph Loop fix_plan.md
 * Prioritizes Todo and In Progress issues over Backlog
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const LINEAR_API_KEY = 'lin_api_mxU59TuOEyBkZYDPCdFN6jTpbyFfGeDONZwcf2yf';
const LINEAR_TEAM_ID = 'a1d72468-d667-4657-90a6-e48a7d0b1b8f';
const FIX_PLAN_PATH = path.join(__dirname, '..', '.ralph', 'fix_plan.md');

async function linearRequest(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

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

async function fetchLinearStories() {
  const query = `
    query {
      issues(
        filter: {
          team: { id: { eq: "${LINEAR_TEAM_ID}" } }
          labels: { name: { eq: "ralph-task" } }
        }
        orderBy: createdAt
      ) {
        nodes {
          identifier
          title
          description
          state {
            name
            type
          }
          priority
          estimate
          labels {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  const result = await linearRequest(query);
  return result.issues.nodes;
}

function generateFixPlan(stories) {
  const header = `# Native App Migration - Ralph Loop Tasks

**Generated:** ${new Date().toLocaleString()}
**Total Stories:** ${stories.length}

## Instructions for Ralph

Work through these stories in order. Each story has:
- Full description with task list
- Success criteria
- Story points estimate

Start with Phase 1 (Foundation) stories, then move to Phase 2, etc.

---

`;

  // Group by status
  const todoStories = stories.filter(s => s.state.type === 'unstarted');
  const inProgressStories = stories.filter(s => s.state.type === 'started');
  const backlogStories = stories.filter(s => s.state.type === 'backlog');

  let content = header;

  // Priority: Todo first
  if (todoStories.length > 0) {
    content += `## 📋 Todo (${todoStories.length} stories)\n\n`;
    todoStories.forEach(story => {
      content += formatStory(story, false);
    });
    content += '\n';
  }

  // Then In Progress
  if (inProgressStories.length > 0) {
    content += `## 🔄 In Progress (${inProgressStories.length} stories)\n\n`;
    inProgressStories.forEach(story => {
      content += formatStory(story, false);
    });
    content += '\n';
  }

  // Finally Backlog (available but lower priority)
  if (backlogStories.length > 0) {
    content += `## 📦 Backlog (${backlogStories.length} stories)\n\n`;
    content += `*These stories are available but lower priority. Focus on Todo stories first.*\n\n`;
    backlogStories.forEach(story => {
      content += formatStory(story, true);
    });
  }

  return content;
}

function formatStory(story, collapsed = false) {
  const priorityEmoji = {
    1: '🔴',
    2: '🟠',
    3: '🟡',
    4: '🟢'
  };

  const emoji = priorityEmoji[story.priority] || '⚪';
  const estimate = story.estimate ? `${story.estimate}pts` : '';

  let output = `### ${emoji} [${story.identifier}] ${story.title} ${estimate}\n\n`;

  if (!collapsed) {
    // Show full description for Todo/In Progress
    if (story.description) {
      output += `${story.description}\n\n`;
    }
  } else {
    // Collapsed view for Backlog
    output += `*Status: Backlog*\n\n`;
  }

  output += `**Linear:** https://linear.app/infrastructureai/issue/${story.identifier}\n\n`;
  output += '---\n\n';

  return output;
}

async function main() {
  console.log('🔄 Syncing Linear stories to Ralph Loop...\n');

  try {
    // Fetch stories
    console.log('📥 Fetching stories from Linear...');
    const stories = await fetchLinearStories();
    console.log(`✅ Found ${stories.length} stories with "ralph-task" label\n`);

    // Generate fix plan
    console.log('📝 Generating fix_plan.md...');
    const fixPlan = generateFixPlan(stories);

    // Write to file
    fs.writeFileSync(FIX_PLAN_PATH, fixPlan, 'utf8');
    console.log(`✅ Wrote to ${FIX_PLAN_PATH}\n`);

    // Summary
    const todoCount = stories.filter(s => s.state.type === 'unstarted').length;
    const inProgressCount = stories.filter(s => s.state.type === 'started').length;
    const backlogCount = stories.filter(s => s.state.type === 'backlog').length;

    console.log('📊 Summary:');
    console.log(`   Todo: ${todoCount} stories`);
    console.log(`   In Progress: ${inProgressCount} stories`);
    console.log(`   Backlog: ${backlogCount} stories`);
    console.log(`   Total: ${stories.length} stories\n`);

    console.log('═'.repeat(60));
    console.log('✨ Sync complete! Ralph Loop is ready.\n');
    console.log('Next steps:');
    console.log('  1. Review .ralph/fix_plan.md');
    console.log('  2. Run: ./scripts/ralph-overnight.sh');
    console.log('  3. Ralph will start working! 🤖\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
