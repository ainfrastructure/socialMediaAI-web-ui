#!/bin/bash
# Claude Code Task Worker - Processes one task from the list
# This script is called repeatedly to work through the task list

set -e

PROJECT_DIR="$(pwd)"
TASK_FILE="${PROJECT_DIR}/.ralph/fix_plan.md"
SPECS_DIR="${PROJECT_DIR}/.ralph/specs"
PROMPT_FILE="${PROJECT_DIR}/.ralph/PROMPT.md"

# Get the next unchecked task
NEXT_TASK=$(grep -m 1 "^- \[ \]" "${TASK_FILE}")

if [ -z "${NEXT_TASK}" ]; then
  echo "✅ All tasks completed!"
  exit 0
fi

# Extract just the task description
TASK_DESC=$(echo "${NEXT_TASK}" | sed 's/^- \[ \] //')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Current Task: ${TASK_DESC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create a detailed prompt for Claude Code
cat > /tmp/claude_task_prompt.md << EOF
# Task to Complete

${TASK_DESC}

## Context

You are working on building a native iOS/Android app using Capacitor 6 to wrap the existing Vue 3 web app located at:
\`/Users/svendaneel/Desktop/Programming/socialMediaAI-web-ui\`

## Instructions

1. Read the task carefully
2. Review relevant files from the web app that need to be ported
3. Implement the task following the patterns in \`.ralph/PROMPT.md\`
4. Reference API docs in \`.ralph/specs/api-integration.md\` if needed
5. Run quality gates:
   - npm run type-check
   - npm run lint
   - npm run build
6. Only commit if all quality gates pass
7. Update the task in \`.ralph/fix_plan.md\` to mark it complete: \`- [x]\`

## Mobile-First Principles

- Optimize for 375px-428px screens
- Use Capacitor plugins for native features
- Maintain "Quiet Luxury" design (cream backgrounds, green accents)
- Port from web app, don't rewrite from scratch

## Exit Condition

When this specific task is complete and quality gates pass, mark it as done in fix_plan.md.
EOF

echo "📝 Task prompt created at /tmp/claude_task_prompt.md"
echo ""
echo "To process this task, you would run:"
echo "  claude code --file /tmp/claude_task_prompt.md"
echo ""
echo "Or paste the task into your Claude Code session."
echo ""
cat /tmp/claude_task_prompt.md
