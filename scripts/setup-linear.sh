#!/bin/bash
# Setup Linear Integration for Native App Migration Stories
# This script helps you configure Linear API credentials and create migration stories

set -e

echo "🔧 Linear Integration Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📄 No .env file found. Creating from template..."
  cp .env.ralph.template .env
  echo "✅ Created .env file"
  echo ""
fi

# Function to check if a variable is set in .env
check_env_var() {
  local var_name=$1
  if grep -q "^${var_name}=" .env 2>/dev/null; then
    local var_value=$(grep "^${var_name}=" .env | cut -d '=' -f2)
    if [ -n "$var_value" ] && [ "$var_value" != "your_key_here" ] && [ "$var_value" != "your-team-id" ] && [[ ! "$var_value" =~ ^(lin_api_|your-) ]]; then
      return 0  # Variable is set
    fi
  fi
  return 1  # Variable is not set or has placeholder value
}

# Check for LINEAR_API_KEY
if check_env_var "LINEAR_API_KEY"; then
  echo "✅ LINEAR_API_KEY is already configured"
  source .env
else
  echo "❌ LINEAR_API_KEY not found in .env"
  echo ""
  echo "To get your Linear API key:"
  echo "  1. Go to Linear Settings"
  echo "  2. Navigate to API → Personal API Keys"
  echo "  3. Click 'Create new key'"
  echo "  4. Copy the key"
  echo ""
  read -p "Enter your Linear API key (or press Enter to skip): " api_key

  if [ -n "$api_key" ]; then
    # Update .env file
    if grep -q "^LINEAR_API_KEY=" .env; then
      # Replace existing line (macOS compatible)
      sed -i '' "s|^LINEAR_API_KEY=.*|LINEAR_API_KEY=${api_key}|" .env
    else
      echo "LINEAR_API_KEY=${api_key}" >> .env
    fi
    echo "✅ LINEAR_API_KEY saved to .env"
    export LINEAR_API_KEY="$api_key"
  else
    echo "⚠️  Skipped LINEAR_API_KEY setup"
  fi
  echo ""
fi

# Check for LINEAR_TEAM_ID
if check_env_var "LINEAR_TEAM_ID"; then
  echo "✅ LINEAR_TEAM_ID is already configured"
  source .env
else
  echo "❌ LINEAR_TEAM_ID not found in .env"

  # If we have an API key, try to fetch teams
  if [ -n "$LINEAR_API_KEY" ]; then
    echo ""
    echo "🔍 Fetching your Linear teams..."
    echo ""

    teams_response=$(curl -s -X POST https://api.linear.app/graphql \
      -H "Authorization: ${LINEAR_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"query":"{ teams { nodes { id name } } }"}')

    # Check if jq is available
    if command -v jq &> /dev/null; then
      echo "Available teams:"
      echo "$teams_response" | jq -r '.data.teams.nodes[] | "  - \(.name) (ID: \(.id))"'
      echo ""
      read -p "Enter your Linear Team ID: " team_id
    else
      echo "⚠️  jq not installed. Raw response:"
      echo "$teams_response"
      echo ""
      read -p "Enter your Linear Team ID: " team_id
    fi

    if [ -n "$team_id" ]; then
      # Update .env file
      if grep -q "^LINEAR_TEAM_ID=" .env; then
        sed -i '' "s|^LINEAR_TEAM_ID=.*|LINEAR_TEAM_ID=${team_id}|" .env
      else
        echo "LINEAR_TEAM_ID=${team_id}" >> .env
      fi
      echo "✅ LINEAR_TEAM_ID saved to .env"
      export LINEAR_TEAM_ID="$team_id"
    fi
  else
    echo ""
    echo "To get your team ID:"
    echo "  1. Set up LINEAR_API_KEY first"
    echo "  2. Or find it in your Linear workspace URL"
    echo ""
    read -p "Enter your Linear Team ID (or press Enter to skip): " team_id

    if [ -n "$team_id" ]; then
      if grep -q "^LINEAR_TEAM_ID=" .env; then
        sed -i '' "s|^LINEAR_TEAM_ID=.*|LINEAR_TEAM_ID=${team_id}|" .env
      else
        echo "LINEAR_TEAM_ID=${team_id}" >> .env
      fi
      echo "✅ LINEAR_TEAM_ID saved to .env"
      export LINEAR_TEAM_ID="$team_id"
    else
      echo "⚠️  Skipped LINEAR_TEAM_ID setup"
    fi
  fi
  echo ""
fi

# Load environment variables
source .env

# Check if both are now set
if [ -n "$LINEAR_API_KEY" ] && [ -n "$LINEAR_TEAM_ID" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Linear integration configured successfully!"
  echo ""
  echo "📊 Ready to create 27 migration stories in Linear"
  echo ""
  read -p "Would you like to create the stories now? (y/n): " create_now

  if [[ "$create_now" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Creating Linear stories..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    node scripts/create-linear-stories.js
  else
    echo ""
    echo "To create stories later, run:"
    echo "  node scripts/create-linear-stories.js"
    echo ""
    echo "To sync existing Linear issues to Ralph:"
    echo "  ./scripts/sync-linear.sh"
  fi
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  Linear integration setup incomplete"
  echo ""
  echo "Missing variables in .env:"
  [ -z "$LINEAR_API_KEY" ] && echo "  - LINEAR_API_KEY"
  [ -z "$LINEAR_TEAM_ID" ] && echo "  - LINEAR_TEAM_ID"
  echo ""
  echo "You can:"
  echo "  1. Run this script again: ./scripts/setup-linear.sh"
  echo "  2. Manually edit .env file"
  echo "  3. Export variables: export LINEAR_API_KEY=..."
  echo ""
  echo "See LINEAR_MIGRATION_STORIES.md for detailed instructions"
fi

echo ""
