#!/bin/bash
# Sync GitHub issues labeled "ralph-task" to .ralph/fix_plan.md

set -e

source .env

echo "🔄 Syncing GitHub issues to fix_plan.md..."

gh issue list \
  --label "ralph-task" \
  --state open \
  --json number,title \
  --jq '.[] | "- [ ] [GH-\(.number)] \(.title)"' >> .ralph/fix_plan.md

git add .ralph/fix_plan.md
git commit -m "Sync GitHub issues to Ralf" || echo "No new issues to sync"

echo "✅ GitHub sync complete"
