#!/bin/bash
set -e

echo "🔍 SocialChefAI Verification Suite"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

run_check() {
    local name="$1"
    local cmd="$2"
    echo -n "  $name... "
    if eval "$cmd" > /tmp/check_output.txt 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        cat /tmp/check_output.txt
        FAILED=1
    fi
}

echo ""
echo "📦 Dependencies"
run_check "Node modules" "test -d node_modules"

echo ""
echo "🔧 Code Quality"
run_check "TypeScript compile" "npx vue-tsc --noEmit"
run_check "ESLint" "npm run lint 2>/dev/null || npx eslint src --ext .ts,.vue --max-warnings 0"

echo ""
echo "🏗️  Build"
run_check "Vite build" "npm run build"

echo ""
echo "🧪 Tests"
if pgrep -f "vite" > /dev/null; then
    run_check "E2E tests" "npx playwright test e2e/ --reporter=dot"
else
    echo -e "  E2E tests... ${YELLOW}skipped (dev server not running)${NC}"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed${NC}"
    exit 1
fi
