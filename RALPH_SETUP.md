# Ralf Loop Setup Guide - Social Chef Native App

This guide will help you set up Ralf Loop to autonomously build the native iOS/Android version of Social Chef overnight.

## What is Ralf Loop?

Ralf Loop is an autonomous AI coding agent that can work on your codebase for extended periods, completing tasks from a checklist while you sleep. It uses Claude (via Anthropic API) to read code, make changes, run tests, and commit work automatically.

## Prerequisites

- Node.js 20+ and npm
- Git
- GitHub account with personal access token
- Anthropic API key (for Claude)
- macOS (for iOS development) or Linux/Windows (for Android only)

## Installation & Setup

### 1. Install Ralf Loop

```bash
# Install Ralf Loop CLI globally
npm install -g @snarktank/ralph

# Verify installation
ralph --version

# Alternative if @snarktank/ralph doesn't work:
# npm install -g ralph-claude-code
```

### 2. Configure Environment Variables

Copy the template and fill in your credentials:

```bash
cp .env.ralph.template .env
```

Edit `.env` and add:

**Required**:
- `ANTHROPIC_API_KEY`: Your Anthropic API key (get from https://console.anthropic.com)
- `GITHUB_TOKEN`: GitHub Personal Access Token with `repo` scope
- `GITHUB_REPO_OWNER`: Your GitHub username
- `GITHUB_REPO_NAME`: Repository name (e.g., `social-chef-native`)

**Optional** (for Linear integration):
- `LINEAR_API_KEY`: Linear API key (Settings → API → Personal API Keys)
- `LINEAR_TEAM_ID`: Linear team ID (get via API query)

### 3. Initialize GitHub Repository (if using new boilerplate)

If you're starting from a local boilerplate project:

```bash
# Initialize Git (if not already initialized)
git init
git add .
git commit -m "Initial commit: Native app boilerplate"

# Create GitHub repo
gh repo create social-chef-native --private --source=. --remote=origin

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Create GitHub Labels

```bash
# Create labels for Ralf task tracking
gh label create "ralph-task" --color "7B68EE" --description "Task for Ralf Loop autonomous agent"
gh label create "ralph-done" --color "00FF00" --description "Completed by Ralf Loop"
gh label create "ralph-blocked" --color "FF0000" --description "Ralf Loop encountered blocker"
```

### 5. Configure Linear (Optional)

If using Linear for project management:

```bash
# Get your Linear team ID
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ teams { nodes { id name } } }"}' | jq

# Add team ID to .env
echo "LINEAR_TEAM_ID=your-team-id" >> .env
```

## Configuration Files

All configuration files are already created in this repository:

- **`.ralph/PROMPT.md`**: Core instructions for Ralf (what to build, how to build it)
- **`.ralph/fix_plan.md`**: 100-task checklist for the native app
- **`.ralph/specs/requirements.md`**: Technical requirements
- **`.ralph/specs/api-integration.md`**: API endpoint documentation
- **`ralph.config.json`**: Runtime configuration (quality gates, cost limits, etc.)

## Running Ralf Loop

### Pre-Flight Checklist

Before starting the overnight run, verify:

```bash
# 1. Environment variables are set
cat .env

# 2. Quality gates work
npm run type-check
npm run lint
npm run build

# 3. Git status is clean
git status

# 4. Configuration files exist
ls -la .ralph/
```

### Start Overnight Run

```bash
# Execute the overnight script (this will run for ~8 hours)
./scripts/ralph-overnight.sh
```

The script will:
1. Create a backup branch (for rollback if needed)
2. Create a pre-Ralf checkpoint commit
3. Execute Ralf Loop for up to 100 iterations
4. Log all output to `.ralph/logs/overnight_[timestamp].log`
5. Send a macOS notification when complete

### Monitor Progress

In a separate terminal, you can monitor progress:

```bash
# Real-time log tailing
tail -f .ralph/logs/overnight_*.log

# See recent commits
git log --oneline --since="2 hours ago"

# Count completed tasks
grep -c "\[x\]" .ralph/fix_plan.md
```

## Integration with GitHub Issues

The GitHub Actions workflow (`.github/workflows/ralph-integration.yml`) automatically syncs issues:

1. Create a GitHub issue with the label `ralph-task`
2. The workflow adds it to `.ralph/fix_plan.md`
3. Ralf will pick it up on the next run

You can also manually sync:

```bash
./scripts/sync-github.sh
```

## Integration with Linear

If using Linear, sync tasks manually:

```bash
./scripts/sync-linear.sh
```

## Expected Outcomes

### After 8 Hours (Conservative)
- ✅ 40-50 tasks completed
- ✅ 3,000-4,000 lines of code
- ✅ Foundation + Authentication + Restaurants + partial Content Generation

### After 8 Hours (Optimistic)
- ✅ 60-70 tasks completed
- ✅ 5,000-6,000 lines of code
- ✅ Foundation + Auth + Restaurants + Content Generation + Social OAuth (partial)

## Post-Run Review

After the overnight run completes:

```bash
# View summary of changes
git diff backup/[timestamp] --stat

# Review commits
git log --oneline --since="12 hours ago" --graph

# Check for errors
grep -i "error\|failed" .ralph/logs/overnight_*.log

# Test the app
npm run build
npx cap sync ios
npx cap open ios
```

## Troubleshooting

### "Ralf not found" after installation

```bash
# Check npm global path
npm config get prefix

# Add to PATH
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Quality gate failed

```bash
# Run manually to see errors
npm run type-check
npm run lint

# Fix errors, commit, and resume
git add .
git commit -m "Fix quality gate errors"
ralph --resume --config ralph.config.json
```

### API rate limit exceeded

Reduce calls per hour in `ralph.config.json`:

```json
{
  "ai": {
    "apiCallsPerHour": 30  // Down from 50
  }
}
```

### No progress after 3 iterations

Ralf is stuck on a task. Review the last commit and either:
1. Manually complete the blocking task
2. Simplify the task in `.ralph/fix_plan.md`
3. Skip the task and move to the next one

## Safety & Rollback

### Rollback to Pre-Ralf State

If the overnight run produces broken code:

```bash
# Find backup branch
git branch | grep backup

# Reset to backup
git reset --hard backup/[timestamp]
git push --force-with-lease
```

### Cost Controls

Configured in `ralph.config.json`:
- **Max daily cost**: $40
- **Max iterations**: 100
- **Estimated cost per call**: $0.03
- **Total estimated cost**: ~$40 for 8-hour run

## Next Steps

After the overnight run:

1. **Manual Testing**: Test on iOS simulator and Android emulator
2. **Fix Blockers**: Address any tasks Ralf couldn't complete
3. **Continue Development**: Resume Ralf for remaining tasks or continue manually
4. **App Store Prep**: Add icons, screenshots, privacy policy
5. **Beta Testing**: TestFlight (iOS) and Google Play Beta (Android)

## Support

- **Ralf Loop Documentation**: Check npm package docs for `@snarktank/ralph`
- **GitHub Issues**: Create issues with `ralph-blocked` label for tasks Ralf can't complete
- **Manual Override**: You can always pause, fix issues manually, and resume

---

**Ready to Start?**

```bash
# Quick start command
./scripts/ralph-overnight.sh
```

Let Ralf build your native app while you sleep! 🌙🤖
