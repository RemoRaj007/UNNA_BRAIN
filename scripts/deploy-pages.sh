#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT="${CLOUDFLARE_PAGES_PROJECT:-unna-brain}"
BRANCH="${CLOUDFLARE_PAGES_BRANCH:-production}"
DRY_RUN="${CLOUDFLARE_DRY_RUN:-0}"

printf 'Building frontend for Cloudflare Pages...\n'
npm --prefix frontend run build

if [ ! -f frontend/dist/index.html ]; then
  echo "Error: frontend/dist/index.html not found. Build output is missing."
  exit 1
fi

if rg -n "src/main\.jsx|text/jsx" frontend/dist/index.html >/dev/null 2>&1; then
  echo "Error: dist/index.html still references JSX source files."
  echo "This would cause MIME errors in production. Ensure the build output is deployed, not frontend source."
  exit 1
fi

printf 'Deploying frontend/dist to Cloudflare Pages project=%s branch=%s\n' "$PROJECT" "$BRANCH"

args=(pages deploy frontend/dist --project-name="$PROJECT" --branch="$BRANCH")
if [ "$DRY_RUN" = "1" ]; then
  args+=(--dry-run)
fi

if [ -x "frontend/node_modules/.bin/wrangler" ]; then
  npm --prefix frontend exec wrangler -- "${args[@]}"
  exit 0
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "Warning: wrangler is not installed locally; build/output validation passed, deploy step skipped."
  exit 0
fi

npx wrangler "${args[@]}"
