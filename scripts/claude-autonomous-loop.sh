#!/bin/bash
# Autonomous Claude Code Loop - Spawns agents using your subscription!
# No API costs - uses Claude Code's built-in agent spawning

set -e

PROJECT_DIR="$(pwd)"
LOG_DIR="${PROJECT_DIR}/.ralph/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/autonomous_${TIMESTAMP}.log"
TASK_FILE="${PROJECT_DIR}/.ralph/fix_plan.md"
MAX_AGENTS=3  # Number of parallel agents to spawn
ITERATION=0
MAX_ITERATIONS=50

mkdir -p "${LOG_DIR}"

echo "🤖 Claude Code Autonomous Loop" | tee -a "${LOG_FILE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "${LOG_FILE}"
echo "📁 Project: ${PROJECT_DIR}" | tee -a "${LOG_FILE}"
echo "📋 Tasks: ${TASK_FILE}" | tee -a "${LOG_FILE}"
echo "🔢 Max Iterations: ${MAX_ITERATIONS}" | tee -a "${LOG_FILE}"
echo "👥 Parallel Agents: ${MAX_AGENTS}" | tee -a "${LOG_FILE}"
echo "📝 Log: ${LOG_FILE}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# Pre-flight checks
if [ ! -f "${TASK_FILE}" ]; then
  echo "❌ Missing ${TASK_FILE}" | tee -a "${LOG_FILE}"
  exit 1
fi

# Create checkpoint
if [ -n "$(git status --porcelain)" ]; then
  echo "💾 Creating checkpoint..." | tee -a "${LOG_FILE}"
  git add .
  git commit -m "Pre-autonomous-loop checkpoint: $(date)" || true
fi

# Create backup branch
BACKUP_BRANCH="backup/autonomous-$(date +%Y%m%d_%H%M%S)"
git branch "${BACKUP_BRANCH}"
echo "💾 Backup branch: ${BACKUP_BRANCH}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

echo "🚀 Starting autonomous task processing (FULL AUTOPILOT MODE)..." | tee -a "${LOG_FILE}"
echo "   🤖 No prompts - agents run with --dangerously-skip-permissions" | tee -a "${LOG_FILE}"
echo "   ⚠️  All edits, writes, and bash commands auto-approved" | tee -a "${LOG_FILE}"
echo "   Press Ctrl+C to stop gracefully" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# Function to get next unchecked task
get_next_task() {
  grep "### 🔴\|### 🟠\|### 🟡" "${TASK_FILE}" | grep -v "Linear:" | head -1 | sed 's/### [🔴🟠🟡] //'
}

# Function to mark task as done
mark_task_done() {
  local task_id=$1
  # This will be done by the spawned agent
  echo "✅ Task ${task_id} marked for completion" | tee -a "${LOG_FILE}"
}

# Main processing loop
while [ ${ITERATION} -lt ${MAX_ITERATIONS} ]; do
  ITERATION=$((ITERATION + 1))

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "${LOG_FILE}"
  echo "🔄 Iteration ${ITERATION}/${MAX_ITERATIONS} - $(date)" | tee -a "${LOG_FILE}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "${LOG_FILE}"

  # Get next task
  NEXT_TASK=$(get_next_task)

  if [ -z "${NEXT_TASK}" ]; then
    echo "✅ All priority tasks completed!" | tee -a "${LOG_FILE}"
    break
  fi

  echo "📋 Next Task: ${NEXT_TASK}" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"

  # Create task prompt file
  TASK_PROMPT_FILE=".ralph/.current_task_${ITERATION}.md"
  cat > "${TASK_PROMPT_FILE}" << EOF
# Task: ${NEXT_TASK}

## Your Mission

Complete the following story from our Linear native app migration:

**${NEXT_TASK}**

## Context

You are building a native iOS/Android app for SocialChef. Review the task details in:
- \`.ralph/fix_plan.md\` - Find your task and read the full description
- \`.ralph/PROMPT.md\` - Core instructions and architecture
- \`.ralph/specs/\` - API integration docs

## Steps

1. **Read** your full task from fix_plan.md (search for "${NEXT_TASK}")
2. **Plan** your implementation approach
3. **Implement** the task following the task list
4. **Test** by running:
   - npm run type-check
   - npm run lint
   - npm run build
5. **Commit** if tests pass: "feat: ${NEXT_TASK}"
6. **Mark Complete** - Update your task in Linear to "Done" status

## Success Criteria

- All subtasks from your story completed
- All success criteria met
- Quality gates pass (type-check, lint, build)
- Code follows the patterns in CLAUDE.md
- Committed with descriptive message

## Important

- Focus ONLY on your assigned story
- Don't skip quality gates
- Use CSS variables from theme.css
- Use i18n for all text (en.ts, no.ts)
- Follow mobile-first responsive design

When you're done, report back with a summary of what you built!

EOF

  echo "📝 Created task prompt: ${TASK_PROMPT_FILE}" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"
  echo "⚠️  NEXT STEP: Manually spawn agent with this task" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"
  echo "In your MAIN Claude Code session, run:" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"
  echo "  Spawn agent to work on: ${NEXT_TASK}" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"

  # For now, we pause here. In a future version, this could automatically
  # spawn agents via the Claude Code API or MCP

  echo "Press ENTER when the agent completes this task (or Ctrl+C to exit)..."
  read -r

  echo "" | tee -a "${LOG_FILE}"
  echo "📊 Progress Summary:" | tee -a "${LOG_FILE}"
  COMPLETED=$(grep -c "\[x\]" "${TASK_FILE}" || echo "0")
  TOTAL=$(grep -c "\[ \]\|\[x\]" "${TASK_FILE}" || echo "0")
  echo "   Completed: ${COMPLETED}/${TOTAL} tasks" | tee -a "${LOG_FILE}"
  echo "" | tee -a "${LOG_FILE}"

  # Small delay between iterations
  sleep 2
done

echo "" | tee -a "${LOG_FILE}"
echo "🏁 Autonomous loop completed at $(date)" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
echo "📊 Final Summary:" | tee -a "${LOG_FILE}"
COMPLETED=$(grep -c "\[x\]" "${TASK_FILE}" || echo "0")
TOTAL=$(grep -c "\[ \]\|\[x\]" "${TASK_FILE}" || echo "0")
echo "   Completed: ${COMPLETED}/${TOTAL} tasks" | tee -a "${LOG_FILE}"
echo "   Iterations: ${ITERATION}" | tee -a "${LOG_FILE}"
echo "   Backup branch: ${BACKUP_BRANCH}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# macOS notification
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"Completed ${COMPLETED}/${TOTAL} tasks\" with title \"Claude Code Loop Complete\""
fi

echo "View changes: git diff ${BACKUP_BRANCH}" | tee -a "${LOG_FILE}"
