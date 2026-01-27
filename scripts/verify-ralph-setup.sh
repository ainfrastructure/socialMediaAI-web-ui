#!/bin/bash
# Verify Ralf Loop setup is complete and ready to run

echo "🔍 Verifying Ralf Loop Setup..."
echo ""

ERRORS=0

# Check required files
echo "📄 Checking configuration files..."
FILES=(
  ".ralph/PROMPT.md"
  ".ralph/fix_plan.md"
  ".ralph/specs/requirements.md"
  ".ralph/specs/api-integration.md"
  "ralph.config.json"
  "scripts/ralph-overnight.sh"
  "scripts/sync-github.sh"
  "scripts/sync-linear.sh"
  ".github/workflows/ralph-integration.yml"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    ((ERRORS++))
  fi
done

echo ""

# Check directories
echo "📁 Checking directories..."
DIRS=(
  ".ralph"
  ".ralph/specs"
  ".ralph/logs"
  "scripts"
  ".github/workflows"
)

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✅ $dir"
  else
    echo "  ❌ $dir (MISSING)"
    ((ERRORS++))
  fi
done

echo ""

# Check scripts are executable
echo "🔧 Checking script permissions..."
SCRIPTS=(
  "scripts/ralph-overnight.sh"
  "scripts/sync-github.sh"
  "scripts/sync-linear.sh"
)

for script in "${SCRIPTS[@]}"; do
  if [ -x "$script" ]; then
    echo "  ✅ $script (executable)"
  else
    echo "  ⚠️  $script (not executable - run: chmod +x $script)"
    ((ERRORS++))
  fi
done

echo ""

# Check environment variables
echo "🔐 Checking environment variables..."
if [ -f ".env" ]; then
  echo "  ✅ .env file exists"

  # Check for required variables
  if grep -q "ANTHROPIC_API_KEY=" .env && ! grep -q "ANTHROPIC_API_KEY=.*your.*key" .env; then
    echo "  ✅ ANTHROPIC_API_KEY is set"
  else
    echo "  ❌ ANTHROPIC_API_KEY not configured in .env"
    ((ERRORS++))
  fi

  if grep -q "GITHUB_TOKEN=" .env && ! grep -q "GITHUB_TOKEN=.*your.*token" .env; then
    echo "  ✅ GITHUB_TOKEN is set"
  else
    echo "  ⚠️  GITHUB_TOKEN not configured (optional but recommended)"
  fi
else
  echo "  ⚠️  .env file not found (copy from .env.ralph.template)"
  ((ERRORS++))
fi

echo ""

# Check if ralph is installed
echo "🤖 Checking Ralf Loop installation..."
if command -v ralph &> /dev/null; then
  RALPH_VERSION=$(ralph --version 2>&1 || echo "unknown")
  echo "  ✅ Ralf Loop is installed (version: $RALPH_VERSION)"
else
  echo "  ❌ Ralf Loop not installed"
  echo "     Install with: npm install -g @snarktank/ralph"
  ((ERRORS++))
fi

echo ""

# Check Node.js and npm
echo "📦 Checking dependencies..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "  ✅ Node.js installed ($NODE_VERSION)"
else
  echo "  ❌ Node.js not installed"
  ((ERRORS++))
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "  ✅ npm installed ($NPM_VERSION)"
else
  echo "  ❌ npm not installed"
  ((ERRORS++))
fi

echo ""

# Check git
echo "🔄 Checking Git..."
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  echo "  ✅ Git installed ($GIT_VERSION)"

  if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "  ✅ Git repository initialized"

    if git remote get-url origin > /dev/null 2>&1; then
      REMOTE_URL=$(git remote get-url origin)
      echo "  ✅ Remote origin configured ($REMOTE_URL)"
    else
      echo "  ⚠️  No remote origin configured"
      echo "     Set up with: gh repo create social-chef-native --private --source=. --remote=origin"
    fi
  else
    echo "  ❌ Not a Git repository"
    ((ERRORS++))
  fi
else
  echo "  ❌ Git not installed"
  ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Final summary
if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks passed! You're ready to run Ralf Loop."
  echo ""
  echo "Next steps:"
  echo "  1. Ensure .env is configured with your API keys"
  echo "  2. Review .ralph/PROMPT.md and .ralph/fix_plan.md"
  echo "  3. Run: ./scripts/ralph-overnight.sh"
  exit 0
else
  echo "⚠️  Found $ERRORS issue(s) that need attention."
  echo ""
  echo "Please fix the issues above before running Ralf Loop."
  echo "See RALPH_SETUP.md for detailed setup instructions."
  exit 1
fi
