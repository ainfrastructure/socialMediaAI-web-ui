#!/bin/bash
set -e

echo "⚡ Quick Check"
echo "============="

# Type check only changed files would be ideal, but for now:
echo -n "  TypeScript... "
if npx vue-tsc --noEmit 2>/dev/null; then
    echo "✓"
else
    echo "✗"
    exit 1
fi

echo -n "  Build... "
if npm run build > /dev/null 2>&1; then
    echo "✓"
else
    echo "✗"
    exit 1
fi

echo "✅ Quick check passed!"
