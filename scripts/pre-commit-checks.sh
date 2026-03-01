#!/bin/bash

# Claude Code PreToolUse hook for git commit checks.
# Checks Convex code for common anti-patterns before allowing commits.
# Returns JSON on stdout.

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT="$(cat)"
if [ -z "$HOOK_INPUT" ]; then
  exit 0
fi

# Extract the command from the tool input JSON
# The input format is: {"tool_name":"Bash","tool_input":{"command":"..."}}
COMMAND=""
if command -v jq &>/dev/null; then
  COMMAND="$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
else
  # Fallback: simple pattern extraction
  COMMAND="$(echo "$HOOK_INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//' || true)"
fi

# Only check git commit commands
if [[ ! "$COMMAND" =~ (^|[[:space:]])git[[:space:]]+commit($|[[:space:]]) ]]; then
  exit 0
fi

# Find repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CONVEX_DIR="${REPO_ROOT}/convex"

if [ ! -d "$CONVEX_DIR" ]; then
  exit 0
fi

# Check for Date.now() near query functions in convex/ directory
DATE_NOW_IN_QUERIES="$(
  grep -rn "Date\.now()\|new Date()" "$CONVEX_DIR"/ --include="*.ts" --include="*.js" \
    | grep -v "node_modules" \
    | grep -v "_generated" \
    | grep -v "\.test\." \
    || true
)"

if [ -n "$DATE_NOW_IN_QUERIES" ]; then
  # Check if any of these are near query definitions
  HAS_QUERY_PATTERN=false
  while IFS= read -r line; do
    file="$(echo "$line" | cut -d: -f1)"
    if grep -q "query({" "$file" 2>/dev/null; then
      HAS_QUERY_PATTERN=true
      break
    fi
  done <<< "$DATE_NOW_IN_QUERIES"

  if [ "$HAS_QUERY_PATTERN" = true ]; then
    echo '{"decision":"block","reason":"Found Date.now() or new Date() in a Convex file that contains query functions. Date.now() in queries breaks reactivity and caching. Use a function argument or status field instead. See docs/CONVEX_BEST_PRACTICES.md for details."}'
    exit 0
  fi
fi

# Check for .filter() chained on db.query() calls
FILTER_ON_QUERIES="$(
  grep -rn "\.query(.*)\.\(filter\|\.filter\)" "$CONVEX_DIR"/ --include="*.ts" --include="*.js" \
    | grep -v "node_modules" \
    | grep -v "_generated" \
    | grep -v "\.test\." \
    || true
)"

if [ -n "$FILTER_ON_QUERIES" ]; then
  echo '{"decision":"block","reason":"Found .filter() on Convex db.query() calls. Use .withIndex() instead for better performance. See docs/CONVEX_BEST_PRACTICES.md for details."}'
  exit 0
fi

# All checks passed
exit 0
