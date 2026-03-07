#!/usr/bin/env bash

# Quick issue checker for local QA + remote GitHub issues (if reachable)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

run_check() {
  local label="$1"
  shift

  info "Running ${label}"
  if "$@"; then
    pass "${label} passed"
    return 0
  fi

  fail "${label} failed"
  return 1
}

has_python_test_deps() {
  python3 - <<'PY' >/dev/null 2>&1
import importlib
required = ["pytest", "pytest_asyncio", "pydantic_settings"]
for package in required:
    importlib.import_module(package)
PY
}

echo -e "${BLUE}UNNA Brain - Issue Check${NC}"

total_failures=0

# Static checks (best-effort)
if command -v ruff >/dev/null 2>&1; then
  run_check "Ruff lint" ruff check . || total_failures=$((total_failures + 1))
else
  warn "ruff is not installed; skipping lint"
fi

if command -v mypy >/dev/null 2>&1; then
  run_check "mypy type-check" mypy app tests || total_failures=$((total_failures + 1))
else
  warn "mypy is not installed; skipping type-check"
fi

# pytest-cov addopts in pyproject can break local runs when plugin is missing.
if command -v pytest >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
  if has_python_test_deps; then
    info "Running pytest (with --override-ini addopts='')"
    if pytest -q --override-ini addopts=''; then
      pass "pytest passed"
    else
      fail "pytest failed"
      total_failures=$((total_failures + 1))
    fi
  else
    warn "Python test dependencies are missing (pytest_asyncio and/or pydantic_settings); skipping pytest"
  fi
else
  warn "pytest or python3 is not installed; skipping tests"
fi

# Remote issue check (best-effort)
if command -v curl >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
  info "Checking open GitHub issues for RemoRaj007/UNNA_BRAIN"

  api_response="$(curl -fsSL \
    -H 'Accept: application/vnd.github+json' \
    -H 'User-Agent: unna-brain-issue-check' \
    --connect-timeout 5 \
    --max-time 10 \
    'https://api.github.com/repos/RemoRaj007/UNNA_BRAIN/issues?state=open&per_page=10' 2>/dev/null || true)"

  if [ -z "$api_response" ]; then
    warn "Could not reach GitHub API from this environment"
  else
    python3 - <<'PY' <<< "$api_response"
import json
import sys

raw = sys.stdin.read().strip()
if not raw:
    print('⚠ GitHub API returned empty response')
    raise SystemExit(0)

try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print('⚠ Could not parse GitHub API response')
    raise SystemExit(0)

if isinstance(data, dict) and data.get('message'):
    print(f"⚠ GitHub API error: {data['message']}")
    raise SystemExit(0)

issues = [item for item in data if 'pull_request' not in item]
print(f"ℹ Open issues: {len(issues)}")
for issue in issues:
    print(f"  - #{issue['number']}: {issue['title']}")
PY
  fi
else
  warn "curl or python3 is missing; skipping GitHub issue check"
fi

echo ""
if [ "$total_failures" -eq 0 ]; then
  pass "Issue check completed with no local failures"
  exit 0
else
  fail "Issue check found ${total_failures} local failure(s)"
  exit 1
fi
