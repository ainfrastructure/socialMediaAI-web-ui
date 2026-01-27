#!/bin/bash
# Sync Linear issues labeled "ralph-task" to .ralph/fix_plan.md

set -e

source .env

echo "🔄 Syncing Linear issues to fix_plan.md..."

curl -X POST https://api.linear.app/graphql \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { issues(filter: { team: { id: { eq: \"'${LINEAR_TEAM_ID}'\" } }, labels: { name: { eq: \"ralph-task\" } } }) { nodes { identifier title state { name } } } }"
  }' | jq -r '.data.issues.nodes[] | "- [ ] [LIN-\(.identifier)] \(.title)"' >> .ralph/fix_plan.md

git add .ralph/fix_plan.md
git commit -m "Sync Linear issues to Ralf" || echo "No new issues to sync"

echo "✅ Linear sync complete"
