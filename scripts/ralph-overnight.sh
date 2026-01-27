#!/bin/bash
# Safe overnight execution of Ralf Loop

set -e

PROJECT_DIR="$(pwd)"
LOG_DIR="${PROJECT_DIR}/.ralph/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/overnight_${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"

echo "🚀 Ralf Loop - Overnight Run Starting at $(date)"
echo "📁 Project: ${PROJECT_DIR}"
echo "📋 Log: ${LOG_FILE}"

# Pre-flight checks
if [ ! -f ".ralph/PROMPT.md" ]; then
  echo "❌ Missing .ralph/PROMPT.md"
  exit 1
fi

if [ ! -f ".ralph/fix_plan.md" ]; then
  echo "❌ Missing .ralph/fix_plan.md"
  exit 1
fi

# Check git status and create checkpoint
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes detected. Creating checkpoint..."
  git add .
  git commit -m "Pre-Ralf checkpoint: $(date)"
fi

# Create backup branch
BACKUP_BRANCH="backup/$(date +%Y%m%d_%H%M%S)"
git branch "${BACKUP_BRANCH}"
echo "💾 Backup branch created: ${BACKUP_BRANCH}"

# Execute Ralf Loop
echo "🤖 Starting Ralf Loop autonomous execution (FULL AUTOPILOT - NO PROMPTS)..."

agentic-loop \
  --config ralph.config.json \
  --dangerously-skip-permissions \
  --auto-approve-edits \
  --auto-approve-writes \
  --auto-approve-bash \
  --verbose \
  2>&1 | tee "${LOG_FILE}"

RALPH_EXIT_CODE=$?

# Post-run summary
echo ""
echo "🏁 Ralf Loop Completed at $(date)"
echo "Exit Code: ${RALPH_EXIT_CODE}"
echo "📊 Summary:"
git log --oneline --since="12 hours ago" | wc -l | xargs echo "  Commits:"
git diff --stat "${BACKUP_BRANCH}" | tail -1

# Send notification (macOS)
if command -v osascript &> /dev/null; then
  osascript -e 'display notification "Ralf Loop execution completed" with title "Social Chef Native"'
fi

exit ${RALPH_EXIT_CODE}
