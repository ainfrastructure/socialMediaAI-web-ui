# Ralf Loop Quick Start - 5 Steps to Launch

Get your autonomous AI agent building your native app in 5 minutes.

## ⚡ Quick Start

### Step 1: Install Ralf Loop (2 minutes)

```bash
# Install Ralf Loop CLI
npm install -g @snarktank/ralph

# Verify installation
ralph --version
```

> **Note**: If `@snarktank/ralph` doesn't work, try: `npm install -g ralph-claude-code`

### Step 2: Configure Environment (2 minutes)

```bash
# Copy template
cp .env.ralph.template .env

# Edit .env and add your keys
nano .env  # or use your preferred editor
```

**Required in `.env`**:
```bash
ANTHROPIC_API_KEY=sk-ant-your_actual_key_here
GITHUB_TOKEN=ghp_your_github_token_here  # Optional but recommended
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=social-chef-native
```

**Get API Keys**:
- Anthropic API: https://console.anthropic.com/settings/keys
- GitHub Token: https://github.com/settings/tokens (select `repo` scope)

### Step 3: Verify Setup (30 seconds)

```bash
# Run verification script
./scripts/verify-ralph-setup.sh
```

This checks:
- ✅ All config files present
- ✅ Scripts are executable
- ✅ Environment variables set
- ✅ Ralf Loop installed
- ✅ Git repository ready

### Step 4: Review Configuration (1 minute)

Take a quick look at what Ralf will do:

```bash
# View the task list (100 tasks)
cat .ralph/fix_plan.md

# View the main instructions
cat .ralph/PROMPT.md
```

### Step 5: Launch! (30 seconds)

```bash
# Start the overnight run
./scripts/ralph-overnight.sh
```

That's it! Ralf will now:
- Work through the 100-task checklist
- Write code, run tests, commit changes
- Log everything to `.ralph/logs/`
- Send you a notification when done (macOS)

## 📊 Monitoring Progress

Open a new terminal and run:

```bash
# Watch the log in real-time
tail -f .ralph/logs/overnight_*.log

# Or check task completion
watch -n 60 'grep -c "\[x\]" .ralph/fix_plan.md'
```

## ⏰ What to Expect

**Duration**: ~8 hours (100 iterations)
**Cost**: ~$30-40 (Claude API calls)
**Output**: 40-70 completed tasks, 3,000-6,000 lines of code

### Conservative Estimate (8 hours)
- ✅ Foundation setup (Capacitor, Base components)
- ✅ Authentication (Supabase + OAuth)
- ✅ Restaurant management (CRUD, Google Places)
- ✅ Basic content generation (Gemini images)

### Optimistic Estimate (8 hours)
- ✅ All of the above, plus:
- ✅ Advanced content generation (Veo videos, carousel)
- ✅ Social platform OAuth flows (Facebook, Instagram, etc.)
- ✅ Scheduling system (partial)

## 🌅 Morning Routine

When you wake up:

```bash
# 1. Check the summary
git log --oneline --since="12 hours ago" --graph

# 2. Review completed tasks
grep "\[x\]" .ralph/fix_plan.md | wc -l

# 3. Check for errors
grep -i "error\|blocked" .ralph/logs/overnight_*.log

# 4. Build and test
npm run build
npx cap sync ios
npx cap open ios
```

## 🔧 Troubleshooting

### Ralf Not Found
```bash
# Add npm global bin to PATH
export PATH="$PATH:$(npm config get prefix)/bin"

# Then try again
ralph --version
```

### Build Failed
```bash
# See what went wrong
npm run type-check
npm run lint

# Fix manually, commit, and resume
git add .
git commit -m "Manual fix: [issue]"
ralph --resume --config ralph.config.json
```

### Stuck on One Task
```bash
# Check last commit
git log -1

# Manually complete the task or skip it
# Edit .ralph/fix_plan.md and mark it [x]
# Then resume
ralph --resume --config ralph.config.json
```

## 🚨 Emergency Stop

If you need to stop Ralf:

```bash
# Press Ctrl+C in the terminal running the script

# Or kill the process
pkill -f "ralph"
```

## 🔄 Rollback

If something goes wrong:

```bash
# Find backup branch (created before run)
git branch | grep backup

# Reset to backup
git reset --hard backup/20260127_220000
```

## 📚 Full Documentation

For detailed setup instructions, see:
- **RALPH_SETUP.md** - Complete setup guide
- **.ralph/README.md** - Configuration file reference
- **ralph.config.json** - Runtime settings

## 🎯 What Ralf Will Build

A native iOS/Android app with:
- 🔐 Authentication (email, Apple Sign In, Google Sign In)
- 🏪 Restaurant management (Google Places integration)
- 🤖 AI content generation (Gemini images, Veo videos)
- 📱 Social platform connections (Facebook, Instagram, TikTok, etc.)
- 📅 Post scheduling & publishing
- 📊 Analytics dashboard
- 💳 Subscription & billing (Stripe)
- 🔔 Push notifications

## ⚙️ Advanced Options

### Reduce Speed (Lower Cost)

Edit `ralph.config.json`:
```json
{
  "ai": {
    "apiCallsPerHour": 30  // Down from 50
  }
}
```

### Run in Background

```bash
# Start and detach
nohup ./scripts/ralph-overnight.sh > /dev/null 2>&1 &

# Check progress anytime
tail -f .ralph/logs/overnight_*.log
```

### Sync GitHub Issues

```bash
# Pull tasks from GitHub issues labeled "ralph-task"
./scripts/sync-github.sh

# Then run Ralf
./scripts/ralph-overnight.sh
```

---

## 🚀 Ready to Launch?

```bash
# One command to rule them all
./scripts/ralph-overnight.sh
```

**Go to bed. Wake up to a native app.** 🌙➡️☀️🎉
