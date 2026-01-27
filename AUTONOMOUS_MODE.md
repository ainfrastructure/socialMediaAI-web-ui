# Autonomous Mode - No Prompts, Full Autopilot

## Quick Start

### Ralph Loop (Recommended for overnight runs)
```bash
./scripts/ralph-overnight.sh
```
- ✅ Full autopilot - no prompts
- ✅ Auto-approves all edits, writes, bash commands
- ✅ Creates backup branch automatically
- ✅ Comprehensive logging

### Direct Claude Code (for manual tasks)
```bash
claude code \
  --dangerously-skip-permissions \
  --auto-approve-edits \
  --auto-approve-writes \
  --auto-approve-bash
```

### With a specific task file
```bash
claude code \
  --dangerously-skip-permissions \
  --auto-approve-edits \
  --auto-approve-writes \
  --auto-approve-bash \
  --file .ralph/PROMPT.md
```

## Flags Explained

| Flag | What it does |
|------|--------------|
| `--dangerously-skip-permissions` | Skip ALL permission prompts (files, bash, etc.) |
| `--auto-approve-edits` | Auto-approve all file edits without asking |
| `--auto-approve-writes` | Auto-approve all file writes without asking |
| `--auto-approve-bash` | Auto-approve all bash commands without asking |

## Safety Features Already in Place ✅

Your scripts already have these safeguards:
- ✅ Creates git backup branch before starting
- ✅ Creates checkpoint commit of current changes
- ✅ Comprehensive logging to `.ralph/logs/`
- ✅ Exit on error (`set -e`)
- ✅ Summary of changes at the end

## Review Changes After Run

```bash
# View all changes since backup
git diff backup/BRANCH_NAME

# View commit history
git log --oneline --since="12 hours ago"

# Rollback if needed
git reset --hard backup/BRANCH_NAME
```

## Environment Variables (Optional)

Add to `~/.zshrc` or `~/.bashrc` for permanent autopilot mode:

```bash
export CLAUDE_CODE_AUTO_APPROVE=true
export CLAUDE_CODE_SKIP_PERMISSIONS=true
```

## Current Scripts Updated

1. ✅ `scripts/ralph-overnight.sh` - Ralph loop with autopilot flags
2. ✅ `scripts/claude-autonomous-loop.sh` - Documented as autopilot

## Example Overnight Run

```bash
# Terminal 1: Start the loop
cd /Users/svendaneel/Desktop/Programming/socialMediaAI-web-ui
./scripts/ralph-overnight.sh

# Walk away! Come back in the morning and check:
git log --oneline --since="12 hours ago"
git diff backup/LATEST_BACKUP_BRANCH
```

---

**⚠️ Remember:** Autopilot mode gives Claude full control. Use in controlled environments with good backups (which you have!).
