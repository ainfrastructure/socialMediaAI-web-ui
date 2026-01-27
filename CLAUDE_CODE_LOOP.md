# Autonomous Loop with Claude Code (No API Costs!)

This is the solution you wanted: autonomous task execution using Claude Code agents (your existing subscription) instead of direct API calls.

## How It Works

Instead of using Ralf Loop with API calls, this approach:

1. **Reads tasks** from `.ralph/fix_plan.md`
2. **Spawns Claude Code agents** (me!) to work on each task
3. **Loops autonomously** through the 100-task checklist
4. **Uses your subscription** - no API costs!

## 🚀 Quick Start

### Option 1: Semi-Autonomous (Recommended)

This gives you oversight while still being mostly hands-off:

```bash
# Run the Python loop
python3 scripts/autonomous-claude-loop.py
```

**What happens**:
1. Script shows you the next task
2. Creates a detailed prompt for Claude Code
3. You paste the prompt into your Claude Code session (or press Enter if I'm already working on it)
4. I complete the task
5. Script moves to next task
6. Repeat for 100 tasks

### Option 2: Fully Manual (Maximum Control)

Process one task at a time:

```bash
# Get next task and create prompt
./scripts/claude-task-worker.sh

# Copy the output and paste it into your Claude Code session
# I'll implement the task and mark it complete
```

### Option 3: True Autonomous (Future)

When Claude Code supports programmatic agent spawning, the Python script can be updated to automatically spawn me for each task without manual intervention.

## 📋 What I Do For Each Task

When you give me a task from the list, I will:

1. ✅ **Read the task** from `.ralph/fix_plan.md`
2. ✅ **Review context** from `.ralph/PROMPT.md` and specs
3. ✅ **Look at web app** to find components/code to port
4. ✅ **Implement the task** following mobile-first principles
5. ✅ **Run quality gates**:
   - `npm run type-check`
   - `npm run lint`
   - `npm run build`
6. ✅ **Commit changes** (only if quality gates pass)
7. ✅ **Mark task complete** in `.ralph/fix_plan.md` by changing `- [ ]` to `- [x]`
8. ✅ **Ready for next task**

## 🎯 Let's Start Right Now!

Want me to start working through the tasks? Just say:

**"Start with Phase 1, Task 1"**

And I'll:
1. Read the first task
2. Implement it
3. Run quality checks
4. Commit
5. Move to the next task

## 💡 Workflow Examples

### Example 1: Batch Mode
```
You: "Complete Phase 1 tasks (Foundation)"
Me: Works through tasks 1-8 sequentially
     Installs Capacitor
     Sets up iOS/Android projects
     Ports Base components
     Commits after each task
     Reports progress
```

### Example 2: Guided Mode
```
You: "What's the next task?"
Me: "Next: Install Capacitor 6 in project"
You: "Do it"
Me: Implements Capacitor setup, runs checks, commits
You: "What's next?"
Me: "Next: Initialize iOS project"
... continues ...
```

### Example 3: Autonomous Mode (with Python script)
```bash
$ python3 scripts/autonomous-claude-loop.py

🤖 AUTONOMOUS CLAUDE CODE LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Iteration 1/100
📊 Progress: 0 completed, 100 remaining
📋 Next Task: Install Capacitor 6 in project

Task prompt created. Paste into Claude Code:
[Shows detailed prompt]

Press Enter when task is complete...
```

## 📊 Tracking Progress

See your progress anytime:

```bash
# Count completed tasks
grep -c "\[x\]" .ralph/fix_plan.md

# See what's next
grep -m 1 "^- \[ \]" .ralph/fix_plan.md

# Recent work
git log --oneline --since="2 hours ago"
```

## 🔧 Configuration

All configuration is in the files we already created:
- **`.ralph/PROMPT.md`** - Instructions I follow for each task
- **`.ralph/fix_plan.md`** - 100-task checklist
- **`.ralph/specs/`** - API and requirements documentation

## 💰 Cost Comparison

| Approach | Cost | Speed | Control |
|----------|------|-------|---------|
| **Ralf Loop (API)** | ~$30-40/night | Fast | Low |
| **Claude Code Loop** | $0 (your subscription) | Medium | High |
| **Manual** | $0 | Slow | Maximum |

You get the best of both worlds: autonomous execution at zero extra cost!

## 🚨 Safety Features

Same safety as the original plan:
- ✅ Backup branch created before starting
- ✅ Quality gates before each commit
- ✅ Full git history
- ✅ You can stop anytime (Ctrl+C)
- ✅ Rollback available: `git reset --hard backup/[timestamp]`

## 🎬 Ready to Start?

Choose your approach:

### A) Start Right Now (Interactive)
Just tell me: **"Start with the first task"** and I'll begin immediately.

### B) Use the Python Loop (Semi-Autonomous)
```bash
python3 scripts/autonomous-claude-loop.py
```

### C) One Task at a Time (Manual)
```bash
./scripts/claude-task-worker.sh
```

## 📖 Task Phases

Here's what we'll build (100 tasks total):

1. **Phase 1**: Foundation (8 tasks) - ~1 hour
2. **Phase 2**: Authentication (10 tasks) - ~1.5 hours
3. **Phase 3**: Restaurant Management (10 tasks) - ~1.5 hours
4. **Phase 4**: Content Generation (17 tasks) - ~3 hours
5. **Phase 5**: Social Platforms (15 tasks) - ~2.5 hours
6. **Phase 6**: Scheduling (15 tasks) - ~2.5 hours
7. **Phase 7**: Analytics (10 tasks) - ~1.5 hours
8. **Phase 8**: Billing (7 tasks) - ~1 hour
9. **Phase 9**: Native Polish (5 tasks) - ~1 hour
10. **Phase 10**: Quality & Testing (3 tasks) - ~30 min

**Total**: ~15-20 hours of work

## 🌙 Overnight Option

You can leave the Python script running overnight with the semi-autonomous mode. Each task will wait for you to press Enter, but you could modify the script to auto-continue after checking git status.

---

## 🚀 Let's Go!

I'm ready to start. Just say:
- **"Start with Phase 1"** - I'll begin with Foundation tasks
- **"What's the first task?"** - I'll tell you what's next
- **"Run the loop"** - Run `python3 scripts/autonomous-claude-loop.py`

**No API costs. Uses your subscription. Full control. Let's build your native app!**
