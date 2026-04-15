#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NEW_VERSION="$(node "$ROOT/scripts/bump-version.mjs" "$ROOT" minor)"
echo "==> Bumped to v${NEW_VERSION}"
echo "==> Building"
npm run build --prefix "$ROOT"
echo "Done — v${NEW_VERSION}"
