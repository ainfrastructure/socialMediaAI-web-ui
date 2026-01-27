#!/bin/bash
# Autonomous loop using Claude Code agents (no API costs!)
# Uses your existing Claude subscription via spawned agents

set -e

PROJECT_DIR="$(pwd)"
LOG_DIR="${PROJECT_DIR}/.ralph/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/claude_loop_${TIMESTAMP}.log"
TASK_FILE="${PROJECT_DIR}/.ralph/fix_plan.md"
MAX_ITERATIONS=100
CURRENT_ITERATION=0

mkdir -p "${LOG_DIR}"

echo "🤖 Claude Code Loop - Starting at $(date)" | tee -a "${LOG_FILE}"
echo "📁 Project: ${PROJECT_DIR}" | tee -a "${LOG_FILE}"
echo "📋 Task File: ${TASK_FILE}" | tee -a "${LOG_FILE}"
echo "📝 Log: ${LOG_FILE}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# Pre-flight checks
if [ ! -f "${TASK_FILE}" ]; then
  echo "❌ Missing ${TASK_FILE}" | tee -a "${LOG_FILE}"
  exit 1
fi

# Create checkpoint
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes detected. Creating checkpoint..." | tee -a "${LOG_FILE}"
  git add .
  git commit -m "Pre-Claude-Loop checkpoint: $(date)"
fi

# Create backup branch
BACKUP_BRANCH="backup/claude-loop-$(date +%Y%m%d_%H%M%S)"
git branch "${BACKUP_BRANCH}"
echo "💾 Backup branch: ${BACKUP_BRANCH}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# Main loop
while [ ${CURRENT_ITERATION} -lt ${MAX_ITERATIONS} ]; do
  CURRENT_ITERATION=$((CURRENT_ITERATION + 1))

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "${LOG_FILE}"
  echo "🔄 Iteration ${CURRENT_ITERATION}/${MAX_ITERATIONS}" | tee -a "${LOG_FILE}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "${LOG_FILE}"

  # Get next unchecked task
  NEXT_TASK=$(grep -m 1 "^- \[ \]" "${TASK_FILE}" | sed 's/^- \[ \] //')

  if [ -z "${NEXT_TASK}" ]; then
    echo "✅ All tasks completed! Exiting loop." | tee -a "${LOG_FILE}"
    break
  fi

  echo "📋 Next Task: ${NEXT_TASK}" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"

  # This is where Claude Code integration would happen
  # For now, create a marker file that Claude Code will process
  TASK_MARKER="${PROJECT_DIR}/.ralph/.current_task"
  echo "${NEXT_TASK}" > "${TASK_MARKER}"

  echo "⏸️  MANUAL STEP REQUIRED:" | tee -a "${LOG_FILE}"
  echo "   Run: claude code --task \"${NEXT_TASK}\"" | tee -a "${LOG_FILE}"
  echo "   Or use the wrapper script below" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"

  # In true autonomous mode, this would spawn a Claude Code agent
  # For now, we'll create a wrapper that you can use

  break  # Remove this for continuous loop
done

echo "" | tee -a "${LOG_FILE}"
echo "🏁 Claude Code Loop session ended at $(date)" | tee -a "${LOG_FILE}"
echo "📊 Completed ${CURRENT_ITERATION} iterations" | tee -a "${LOG_FILE}"

# Send notification (macOS)
if command -v osascript &> /dev/null; then
  osascript -e 'display notification "Claude Code Loop session ended" with title "Social Chef Native"'
fi
